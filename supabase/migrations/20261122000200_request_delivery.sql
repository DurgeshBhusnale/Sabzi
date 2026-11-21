-- Request flow v2, last step (owner, 2026-11-22; DECISIONS): the vendor closes every confirmed order.
--   * Delivered / Not delivered per order (one buyer's items on one visit), or "Mark all delivered" for a visit.
--   * Not delivered needs a one-tap reason. The buyer is pushed only for Not delivered.
--   * Allowed from 1 hour before the visit until the end of the next day (IST); "reset" undoes a mark.
--   * After that window an unmarked confirmed order reads "not_recorded" (never guessed).
--   * The buyer can say "I didn't get it" for 24 hours after a Delivered mark: it files a report for the admin queue.

create type public.request_miss_reason as enum ('buyer_not_there', 'vendor_unavailable', 'other');

alter table public.requests
  add column delivered_at timestamptz,
  add column missed_reason public.request_miss_reason,
  add column buyer_disputed_at timestamptz;

-- End of the day after the visit, IST.
create or replace function public.delivery_deadline(p_slot_start timestamptz) returns timestamptz
language sql stable set search_path = '' as $$
  select (((p_slot_start at time zone 'Asia/Kolkata')::date + 2)::timestamp) at time zone 'Asia/Kolkata'
$$;

-- ---------------------------------------------------------------- vendor: mark delivered / not delivered / reset
create or replace function public.mark_delivery(p_request_ids uuid[], p_outcome text, p_reason public.request_miss_reason default null) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_count int;
begin
  if p_outcome not in ('delivered', 'not_delivered', 'reset') then raise exception 'invalid_status'; end if;
  if p_outcome = 'not_delivered' and p_reason is null then raise exception 'reason_required'; end if;
  if p_request_ids is null or cardinality(p_request_ids) = 0 or cardinality(p_request_ids) > 200 then raise exception 'request_not_found'; end if;
  update public.requests q
     set status = case p_outcome when 'delivered' then 'delivered'::public.request_status
                                 when 'not_delivered' then 'not_delivered'::public.request_status
                                 else 'accepted'::public.request_status end,
         delivered_at = case when p_outcome = 'reset' then null else now() end,
         missed_reason = case when p_outcome = 'not_delivered' then p_reason else null end
   where q.id = any(p_request_ids) and q.vendor_id = v_uid
     and q.status in ('accepted', 'delivered', 'not_delivered')
     and now() >= q.slot_start - interval '1 hour'
     and now() < public.delivery_deadline(q.slot_start);
  get diagnostics v_count = row_count;
  if v_count = 0 then
    if exists (select 1 from public.requests where id = any(p_request_ids) and vendor_id = v_uid and status in ('accepted', 'delivered', 'not_delivered')) then
      raise exception 'delivery_window_closed';
    end if;
    raise exception 'request_not_found';
  end if;
  return v_count;
end $$;

-- ---------------------------------------------------------------- buyer: "I didn't get it"
create or replace function public.report_not_received(p_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
  q record;
begin
  select r.*, coalesce(i.name, r.free_text) as item into q
    from public.requests r left join public.items i on i.id = r.item_id
   where r.id = p_request_id and r.buyer_id = v_uid;
  if q.id is null then raise exception 'request_not_found'; end if;
  if q.status <> 'delivered' or q.buyer_disputed_at is not null or q.delivered_at < now() - interval '24 hours' then
    raise exception 'dispute_closed';
  end if;
  update public.requests set buyer_disputed_at = now() where id = p_request_id;
  insert into public.reports (reporter_id, vendor_id, reason, text)
  values (v_uid, q.vendor_id, 'other',
          format('Request marked delivered but not received: %s%s, visit %s.', q.item, coalesce(' (' || q.qty || ')', ''),
                 to_char(q.slot_start at time zone 'Asia/Kolkata', 'DD Mon HH12:MI AM')));
end $$;

-- ---------------------------------------------------------------- read models
create or replace function public.my_requests() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id, 'vendor_id', q.vendor_id, 'vendor_name', v.display_name, 'society_name', s.name,
      'item_id', q.item_id, 'item_name', coalesce(i.name, q.free_text), 'qty', q.qty, 'note', q.note,
      'for_date', q.for_date,
      'status', case
         when q.status in ('open', 'will_bring') and q.slot_start <= now() then 'expired'
         when q.status = 'accepted' and now() >= public.delivery_deadline(q.slot_start) then 'not_recorded'
         else q.status::text end,
      'quoted_price', q.quoted_price, 'quoted_unit', q.quoted_unit,
      'slot_start', q.slot_start, 'slot_end', q.slot_end, 'cutoff_at', q.cutoff_at, 'gate_name', g.name,
      'created_at', q.created_at, 'answered_at', q.answered_at, 'responded_at', q.responded_at,
      'delivered_at', q.delivered_at, 'missed_reason', q.missed_reason, 'buyer_disputed_at', q.buyer_disputed_at
    ) order by q.slot_start desc, q.created_at desc), '[]'::jsonb)
  from public.requests q
  join public.vendors v on v.user_id = q.vendor_id
  join public.societies s on s.id = q.society_id
  left join public.items i on i.id = q.item_id
  left join public.stops st on st.id = q.stop_id
  left join public.gates g on g.id = st.gate_id
  where q.buyer_id = auth.uid() and q.status <> 'cancelled' and q.slot_start >= now() - interval '14 days'
$$;

-- buyer_ref: stable per buyer and vendor, never the buyer id itself (groups one buyer's items into one order).
create or replace view public.v_vendor_requests with (security_barrier) as
select q.id, q.vendor_id, q.item_id, i.name as item_name, i.default_unit, q.free_text, q.qty, q.note,
       q.for_date, q.status, q.created_at, q.answered_at,
       case when p.deleted_at is not null or p.name is null then 'Former user'
            else split_part(trim(p.name), ' ', 1) end as buyer_first_name,
       s.id as society_id, s.name as society_name,
       q.stop_id, q.slot_start, q.slot_end, q.cutoff_at, q.quoted_price, q.quoted_unit, q.responded_at,
       g.name as gate_name,
       (select mi.price from public.daily_menus m join public.menu_items mi on mi.menu_id = m.id
         where m.vendor_id = q.vendor_id and mi.item_id = q.item_id order by m.date desc limit 1) as last_price,
       (select mi.unit from public.daily_menus m join public.menu_items mi on mi.menu_id = m.id
         where m.vendor_id = q.vendor_id and mi.item_id = q.item_id order by m.date desc limit 1) as last_unit,
       q.delivered_at, q.missed_reason,
       md5(q.buyer_id::text || ':' || q.vendor_id::text) as buyer_ref
  from public.requests q
  join public.profiles p on p.user_id = q.buyer_id
  join public.societies s on s.id = q.society_id
  left join public.items i on i.id = q.item_id
  left join public.stops st on st.id = q.stop_id
  left join public.gates g on g.id = st.gate_id
 where q.vendor_id = auth.uid() and q.status <> 'cancelled';
grant select on public.v_vendor_requests to authenticated;
revoke insert, update, delete on public.v_vendor_requests from anon, authenticated;

-- ---------------------------------------------------------------- notifications: tell the buyer only when not delivered
create or replace function private.on_request_answer() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('will_bring', 'cant_bring', 'vendor_cancelled', 'not_delivered')
     and (old.status is distinct from new.status or (new.status = 'will_bring' and old.quoted_price is distinct from new.quoted_price)) then
    perform private.enqueue_notify('request_reply', new.id);
  end if;
  return null;
end $$;

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
  else
    raise exception 'unknown_kind';
  end if;
  return v;
end $$;

-- ---------------------------------------------------------------- grants (SEC-08: nothing for anon)
revoke execute on function public.delivery_deadline(timestamptz), public.mark_delivery(uuid[], text, public.request_miss_reason),
  public.report_not_received(uuid), public.my_requests(), public.notify_context(text, uuid) from public, anon;
grant execute on function public.mark_delivery(uuid[], text, public.request_miss_reason), public.report_not_received(uuid),
  public.my_requests() to authenticated;
grant execute on function public.delivery_deadline(timestamptz) to authenticated, service_role;
grant execute on function public.notify_context(text, uuid) to service_role;
revoke execute on function public.notify_context(text, uuid) from authenticated;
