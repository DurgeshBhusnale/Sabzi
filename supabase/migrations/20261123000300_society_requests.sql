-- Owner review 2026-11-21: "My society isn't listed" becomes a society request the admin team works through.
-- The buyer gives the society's name and address (both required, no vendor name). Admins see the requests,
-- add the society (A-03), then mark the requests as added, which notifies every buyer who asked.
-- Picking a society that has no vendors yet no longer saves it to the buyer's account (fixed in the app).

alter type public.notif_type add value if not exists 'society_added';

alter table public.waitlist
  add column society_address text check (society_address is null or char_length(society_address) between 5 and 200),
  add column status text not null default 'open' check (status in ('open', 'added', 'dismissed')),
  add column resolved_society_id uuid references public.societies(id) on delete set null,
  add column resolved_at timestamptz,
  add column resolved_by uuid references public.profiles(user_id) on delete set null,
  -- one id per "mark as added" action: the notify function sends to exactly the requests in that batch
  add column resolve_batch uuid;
create index waitlist_open_idx on public.waitlist(status, created_at);
create index waitlist_batch_idx on public.waitlist(resolve_batch) where resolve_batch is not null;

-- Buyers write through request_society only (validation + one open request per society name).
drop policy if exists waitlist_insert on public.waitlist;

create or replace function public.request_society(p_name text, p_address text, p_society_id uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_address text := regexp_replace(trim(coalesce(p_address, '')), '\s+', ' ', 'g');
  v_id uuid;
begin
  -- A listed society with no vendors yet: its address is already known.
  if v_address = '' and p_society_id is not null then
    select address into v_address from public.societies where id = p_society_id;
    v_address := coalesce(v_address, '');
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'invalid_society_name'; end if;
  if char_length(v_address) < 5 or char_length(v_address) > 200 then raise exception 'invalid_society_address'; end if;
  if (select count(*) from public.waitlist where user_id = v_uid and status = 'open') >= 5 then raise exception 'society_request_limit'; end if;
  select id into v_id from public.waitlist
   where user_id = v_uid and status = 'open' and lower(society_name) = lower(v_name);
  if v_id is not null then
    update public.waitlist set society_address = v_address, society_id = coalesce(p_society_id, society_id) where id = v_id;
    return v_id;
  end if;
  insert into public.waitlist (user_id, society_name, society_address, society_id)
  values (v_uid, v_name, v_address, p_society_id)
  returning id into v_id;
  return v_id;
end $$;

-- A-12: open society requests, oldest first, with how many buyers asked for the same name.
create or replace function public.admin_society_requests(p_status text default 'open') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'id', w.id, 'society_name', w.society_name, 'society_address', w.society_address,
      'society_id', w.society_id, 'status', w.status, 'created_at', w.created_at, 'resolved_at', w.resolved_at,
      'resolved_society_name', rs.name,
      'requester', case when p.deleted_at is not null or p.name is null then 'Former user' else trim(p.name) end,
      'same_name_count', (select count(*) from public.waitlist w2 where w2.status = w.status and lower(w2.society_name) = lower(w.society_name))
    ) order by w.created_at), '[]'::jsonb)
    from public.waitlist w
    join public.profiles p on p.user_id = w.user_id
    left join public.societies rs on rs.id = w.resolved_society_id
    where w.status = p_status);
end $$;

-- Mark requests as added (linked to the society the admin created) and notify those buyers; or dismiss them.
create or replace function public.resolve_society_requests(p_ids uuid[], p_society_id uuid default null, p_dismiss boolean default false) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := public.require_admin();
  v_batch uuid := gen_random_uuid();
  v_count int;
begin
  if coalesce(array_length(p_ids, 1), 0) = 0 then raise exception 'nothing_selected'; end if;
  if not p_dismiss and not exists (select 1 from public.societies where id = p_society_id and active) then
    raise exception 'society_not_found';
  end if;
  update public.waitlist
     set status = case when p_dismiss then 'dismissed' else 'added' end,
         resolved_society_id = case when p_dismiss then null else p_society_id end,
         resolved_at = now(), resolved_by = v_admin,
         resolve_batch = case when p_dismiss then null else v_batch end
   where id = any(p_ids) and status = 'open';
  get diagnostics v_count = row_count;
  if v_count > 0 and not p_dismiss then
    perform private.enqueue_notify('society_added', v_batch);
  end if;
  return v_count;
end $$;

-- notify_context: unchanged branches from 20261122000200, plus 'society_added' (ref = resolve batch id).
create or replace function public.notify_context(p_kind text, p_ref uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v jsonb;
begin
  if p_kind = 'stop_event' then
    select jsonb_build_object(
      'event', jsonb_build_object('id', e.id, 'type', e.type, 'created_at', e.created_at),
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'gate', jsonb_build_object('id', g.id, 'name', g.name),
      'society', jsonb_build_object('id', s.id, 'name', s.name),
      'menu', public.menu_json(e.vendor_id, (e.created_at at time zone 'Asia/Kolkata')::date),
      'recipients', coalesce((select jsonb_agg(jsonb_build_object(
          'user_id', f.buyer_id, 'push_token', p.push_token, 'notify_arrival', f.notify_arrival, 'notify_deals', f.notify_deals,
          'notify_requests', f.notify_requests, 'prefs', p.notify_prefs, 'deleted', p.deleted_at is not null))
        from public.follows f join public.profiles p on p.user_id = f.buyer_id
        where f.vendor_id = e.vendor_id and f.society_id = s.id), '[]'::jsonb))
    into v
    from public.stop_events e
    join public.vendors ve on ve.user_id = e.vendor_id
    join public.gates g on g.id = e.gate_id
    join public.societies s on s.id = g.society_id
    where e.id = p_ref;
  elsif p_kind = 'deal' then
    select jsonb_build_object(
      'deal', jsonb_build_object('id', d.id, 'date', d.date),
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'menu', public.menu_json(d.vendor_id, d.date),
      'recipients', coalesce((select jsonb_agg(distinct jsonb_build_object(
          'user_id', f.buyer_id, 'push_token', p.push_token, 'notify_arrival', f.notify_arrival, 'notify_deals', f.notify_deals,
          'notify_requests', f.notify_requests, 'prefs', p.notify_prefs, 'deleted', p.deleted_at is not null, 'society_id', f.society_id))
        from public.stops st
        join public.gates g on g.id = st.gate_id
        join public.follows f on f.vendor_id = st.vendor_id and f.society_id = g.society_id
        join public.profiles p on p.user_id = f.buyer_id
        where st.vendor_id = d.vendor_id and st.active and extract(isodow from d.date)::smallint = any(st.days_of_week)
          and not exists (select 1 from public.stop_skips k where k.stop_id = st.id and k.date = d.date)
          and not exists (select 1 from public.stop_events le where le.vendor_id = st.vendor_id and le.gate_id = st.gate_id
                           and le.type = 'left' and (le.created_at at time zone 'Asia/Kolkata')::date = d.date)), '[]'::jsonb))
    into v
    from public.deals d join public.vendors ve on ve.user_id = d.vendor_id
    where d.id = p_ref;
  elsif p_kind = 'request_reply' then
    select jsonb_build_object(
      'request', jsonb_build_object('id', q.id, 'status', q.status, 'qty', q.qty, 'item', coalesce(i.name, q.free_text),
        'for_date', q.for_date, 'price', q.quoted_price, 'unit', q.quoted_unit, 'slot_start', q.slot_start,
        'missed_reason', q.missed_reason),
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'recipients', jsonb_build_array(jsonb_build_object(
          'user_id', q.buyer_id, 'push_token', p.push_token, 'prefs', p.notify_prefs, 'deleted', p.deleted_at is not null,
          'notify_requests', coalesce((select bool_or(f.notify_requests) from public.follows f where f.buyer_id = q.buyer_id and f.vendor_id = q.vendor_id), true))))
    into v
    from public.requests q
    join public.vendors ve on ve.user_id = q.vendor_id
    join public.profiles p on p.user_id = q.buyer_id
    left join public.items i on i.id = q.item_id
    where q.id = p_ref;
  elsif p_kind = 'rating' then
    select jsonb_build_object(
      'review', jsonb_build_object('id', r.id, 'stars', r.stars, 'tags', r.tags, 'text', r.text,
        'society', (select s.name from public.follows f join public.societies s on s.id = f.society_id
                     where f.buyer_id = r.buyer_id and f.vendor_id = r.vendor_id order by f.created_at limit 1)),
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'recipients', jsonb_build_array(jsonb_build_object('user_id', vp.user_id, 'push_token', vp.push_token, 'prefs', vp.notify_prefs, 'deleted', vp.deleted_at is not null)))
    into v
    from public.reviews r
    join public.vendors ve on ve.user_id = r.vendor_id
    join public.profiles vp on vp.user_id = r.vendor_id
    where r.id = p_ref;
  elsif p_kind = 'vendor_requests' then
    select jsonb_build_object(
      'vendor', jsonb_build_object('id', ve.user_id, 'display_name', ve.display_name, 'verified', ve.status = 'verified'),
      'groups', coalesce((select jsonb_agg(jsonb_build_object('name', x.name, 'count', x.n))
                 from (select coalesce(i.name, initcap(q.free_text)) as name, count(*) as n
                         from public.requests q left join public.items i on i.id = q.item_id
                        where q.vendor_id = ve.user_id and q.slot_start > now() and q.status = 'open'
                        group by 1) x), '[]'::jsonb),
      'recipients', jsonb_build_array(jsonb_build_object('user_id', vp.user_id, 'push_token', vp.push_token, 'prefs', vp.notify_prefs, 'deleted', vp.deleted_at is not null)))
    into v
    from public.vendors ve join public.profiles vp on vp.user_id = ve.user_id
    where ve.user_id = p_ref;
  elsif p_kind = 'society_added' then
    -- No vendor involved: the society the admin linked, and everyone in this "mark as added" batch.
    select jsonb_build_object(
      'society', jsonb_build_object('id', s.id, 'name', s.name),
      'requested_name', (select w.society_name from public.waitlist w where w.resolve_batch = p_ref limit 1),
      'recipients', coalesce((select jsonb_agg(distinct jsonb_build_object(
          'user_id', w.user_id, 'push_token', p.push_token, 'prefs', p.notify_prefs, 'deleted', p.deleted_at is not null))
        from public.waitlist w join public.profiles p on p.user_id = w.user_id
        where w.resolve_batch = p_ref), '[]'::jsonb))
    into v
    from public.societies s
    where s.id = (select w.resolved_society_id from public.waitlist w where w.resolve_batch = p_ref limit 1);
  else
    raise exception 'unknown_kind';
  end if;
  return v;
end $$;

-- ---------------------------------------------------------------- grants (SEC-08: nothing for anon)
revoke execute on function public.request_society(text, text, uuid), public.admin_society_requests(text),
  public.resolve_society_requests(uuid[], uuid, boolean), public.notify_context(text, uuid) from public, anon;
grant execute on function public.request_society(text, text, uuid), public.admin_society_requests(text),
  public.resolve_society_requests(uuid[], uuid, boolean) to authenticated;
grant execute on function public.notify_context(text, uuid) to service_role;
revoke execute on function public.notify_context(text, uuid) from authenticated;
