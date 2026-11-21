-- Request flow v2 (owner, 2026-11-21; DECISIONS):
--   1. Buyer requests an item for one of the vendor's next visits to their society (a "slot"), not just "tomorrow".
--   2. Vendor accepts with an approximate price, or denies.
--   3. Buyer confirms the price ("Confirm order") or says "Not now". No second vendor confirmation.
-- Cutoffs: a request for a morning slot (starts before 12:00 IST) closes at 22:30 IST the night before;
-- any other slot closes 5 hours before it starts. Vendor replies and buyer confirmations are allowed until
-- the slot starts; after that unanswered rows read as "expired".

-- ---------------------------------------------------------------- columns
alter table public.requests
  add column stop_id uuid references public.stops(id) on delete set null,
  add column slot_start timestamptz,
  add column slot_end timestamptz,
  add column cutoff_at timestamptz,
  add column quoted_price numeric(7,2) check (quoted_price is null or quoted_price between 1 and 999),
  add column quoted_unit public.price_unit,
  add column responded_at timestamptz;

create or replace function public.request_cutoff(p_date date, p_start time) returns timestamptz
language sql stable set search_path = '' as $$
  select case
    when p_start < time '12:00' then ((p_date - 1) + time '22:30') at time zone 'Asia/Kolkata'
    else ((p_date + p_start) - interval '5 hours') at time zone 'Asia/Kolkata'
  end
$$;

-- Backfill: attach existing rows to the vendor's earliest stop at that society, else the end of for_date.
update public.requests q
   set (stop_id, slot_start, slot_end, cutoff_at) = (
     select st.id, (q.for_date + st.window_start) at time zone 'Asia/Kolkata', (q.for_date + st.window_end) at time zone 'Asia/Kolkata',
            public.request_cutoff(q.for_date, st.window_start)
       from public.stops st join public.gates g on g.id = st.gate_id
      where st.vendor_id = q.vendor_id and g.society_id = q.society_id order by st.window_start limit 1)
 where q.slot_start is null
   and exists (select 1 from public.stops st join public.gates g on g.id = st.gate_id
                where st.vendor_id = q.vendor_id and g.society_id = q.society_id);
update public.requests q
   set slot_start = (q.for_date + time '23:59') at time zone 'Asia/Kolkata',
       slot_end = (q.for_date + time '23:59') at time zone 'Asia/Kolkata',
       cutoff_at = (q.for_date + time '23:59') at time zone 'Asia/Kolkata'
 where q.slot_start is null;
update public.requests q
   set quoted_unit = coalesce((select i.default_unit from public.items i where i.id = q.item_id), 'kg')
 where q.status = 'will_bring' and q.quoted_unit is null;
alter table public.requests alter column slot_start set not null, alter column slot_end set not null, alter column cutoff_at set not null;
create index requests_vendor_slot_idx on public.requests(vendor_id, slot_start);

-- ---------------------------------------------------------------- slots
-- The vendor's next (up to 3) visits to a society that are still open for requests.
create or replace function public.request_slots(p_vendor_id uuid, p_society_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'stop_id', x.stop_id, 'date', x.d, 'window_start', x.window_start, 'window_end', x.window_end,
      'gate_name', x.gate_name, 'slot_start', x.slot_start, 'cutoff_at', x.cutoff_at) order by x.slot_start), '[]'::jsonb)
  from (
    select s.id as stop_id, d.d, s.window_start, s.window_end, g.name as gate_name,
           (d.d + s.window_start) at time zone 'Asia/Kolkata' as slot_start,
           public.request_cutoff(d.d, s.window_start) as cutoff_at
      from public.stops s
      join public.gates g on g.id = s.gate_id and g.society_id = p_society_id
      join public.vendors v on v.user_id = s.vendor_id and v.status = 'verified'
      cross join lateral (select (public.ist_today() + k) as d from generate_series(0, 2) k) d
     where s.vendor_id = p_vendor_id and s.active
       and extract(isodow from d.d)::smallint = any(s.days_of_week)
       and not exists (select 1 from public.stop_skips k where k.stop_id = s.id and k.date = d.d)
       and public.request_cutoff(d.d, s.window_start) > now()
     order by 6
     limit 3
  ) x
$$;

-- ---------------------------------------------------------------- buyer: create
drop function public.create_request(uuid, uuid, uuid, text, text, text);
create function public.create_request(p_vendor_id uuid, p_society_id uuid, p_item_id uuid default null,
  p_free_text text default null, p_qty text default null, p_note text default null,
  p_stop_id uuid default null, p_for_date date default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
  v_slot jsonb;
  v_id uuid;
begin
  if not public.is_verified_vendor(p_vendor_id) then raise exception 'vendor_not_found'; end if;
  if not exists (select 1 from public.buyer_societies where buyer_id = v_uid and society_id = p_society_id) then
    raise exception 'society_not_saved';
  end if;
  -- No slot given (older app): the next open slot.
  select e into v_slot from jsonb_array_elements(public.request_slots(p_vendor_id, p_society_id)) e
   where p_stop_id is null or ((e->>'stop_id')::uuid = p_stop_id and (e->>'date')::date = p_for_date)
   order by (e->>'slot_start')::timestamptz limit 1;
  if v_slot is null then raise exception 'slot_closed'; end if;
  insert into public.requests (buyer_id, vendor_id, society_id, item_id, free_text, qty, note, for_date,
                               stop_id, slot_start, slot_end, cutoff_at)
  values (v_uid, p_vendor_id, p_society_id, p_item_id, nullif(trim(p_free_text), ''), nullif(trim(p_qty), ''),
          nullif(trim(p_note), ''), (v_slot->>'date')::date, (v_slot->>'stop_id')::uuid,
          (v_slot->>'slot_start')::timestamptz,
          ((v_slot->>'date')::date + (v_slot->>'window_end')::time) at time zone 'Asia/Kolkata',
          (v_slot->>'cutoff_at')::timestamptz)
  returning id into v_id;
  return v_id;
end $$;

-- ---------------------------------------------------------------- buyer: confirm / not now / cancel
create or replace function public.respond_to_quote(p_request_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
begin
  update public.requests set status = case when p_accept then 'accepted'::public.request_status else 'declined'::public.request_status end,
         responded_at = now()
   where id = p_request_id and buyer_id = v_uid and status = 'will_bring' and slot_start > now();
  if found then return; end if;
  if exists (select 1 from public.requests where id = p_request_id and buyer_id = v_uid) then raise exception 'slot_closed'; end if;
  raise exception 'request_not_found';
end $$;

create or replace function public.cancel_request(p_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
begin
  update public.requests set status = 'cancelled', responded_at = now()
   where id = p_request_id and buyer_id = v_uid and status in ('open', 'will_bring', 'accepted') and slot_start > now();
  if not found then raise exception 'request_not_found'; end if;
end $$;

-- ---------------------------------------------------------------- vendor: accept with price / deny
-- Applies to every request for one item in one slot. Denying after buyers confirmed marks theirs vendor_cancelled.
-- Buyers who already confirmed keep the price they agreed to when the vendor changes the quote.
drop function public.answer_request(text, public.request_status, date);
create function public.answer_request(p_item_key text, p_status public.request_status, p_for_date date default null,
  p_stop_id uuid default null, p_price numeric default null, p_unit public.price_unit default null) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_date date := coalesce(p_for_date, public.ist_today() + 1);
  v_count int;
begin
  if p_status not in ('will_bring', 'cant_bring') then raise exception 'invalid_status'; end if;
  if p_status = 'will_bring' and (p_price is null or p_price < 1 or p_price > 999) then raise exception 'invalid_price'; end if;
  update public.requests q
     set status = case when p_status = 'cant_bring' and q.status = 'accepted' then 'vendor_cancelled'::public.request_status else p_status end,
         quoted_price = case when p_status = 'will_bring' then p_price else q.quoted_price end,
         quoted_unit = case when p_status = 'will_bring'
                            then coalesce(p_unit, (select i.default_unit from public.items i where i.id = q.item_id), 'kg')
                            else q.quoted_unit end,
         answered_at = now()
   where q.vendor_id = v_uid and q.for_date = v_date and (p_stop_id is null or q.stop_id = p_stop_id)
     and q.slot_start > now()
     and (q.status in ('open', 'will_bring', 'cant_bring') or (p_status = 'cant_bring' and q.status = 'accepted'))
     and (
       (p_item_key not like 'free:%' and q.item_id::text = p_item_key)
       or (p_item_key like 'free:%' and q.item_id is null and lower(trim(q.free_text)) = substr(p_item_key, 6))
     );
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'request_not_found'; end if;
  return v_count;
end $$;

-- ---------------------------------------------------------------- read models
create or replace function public.my_requests() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id, 'vendor_id', q.vendor_id, 'vendor_name', v.display_name, 'society_name', s.name,
      'item_id', q.item_id, 'item_name', coalesce(i.name, q.free_text), 'qty', q.qty, 'note', q.note,
      'for_date', q.for_date,
      'status', case when q.status in ('open', 'will_bring') and q.slot_start <= now() then 'expired' else q.status::text end,
      'quoted_price', q.quoted_price, 'quoted_unit', q.quoted_unit,
      'slot_start', q.slot_start, 'slot_end', q.slot_end, 'cutoff_at', q.cutoff_at, 'gate_name', g.name,
      'created_at', q.created_at, 'answered_at', q.answered_at, 'responded_at', q.responded_at
    ) order by q.slot_start desc, q.created_at desc), '[]'::jsonb)
  from public.requests q
  join public.vendors v on v.user_id = q.vendor_id
  join public.societies s on s.id = q.society_id
  left join public.items i on i.id = q.item_id
  left join public.stops st on st.id = q.stop_id
  left join public.gates g on g.id = st.gate_id
  where q.buyer_id = auth.uid() and q.status <> 'cancelled' and q.slot_start >= now() - interval '14 days'
$$;

-- New columns go at the end (create or replace view cannot reorder). Still first name + society only.
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
         where m.vendor_id = q.vendor_id and mi.item_id = q.item_id order by m.date desc limit 1) as last_unit
  from public.requests q
  join public.profiles p on p.user_id = q.buyer_id
  join public.societies s on s.id = q.society_id
  left join public.items i on i.id = q.item_id
  left join public.stops st on st.id = q.stop_id
  left join public.gates g on g.id = st.gate_id
 where q.vendor_id = auth.uid() and q.status <> 'cancelled';
grant select on public.v_vendor_requests to authenticated;
revoke insert, update, delete on public.v_vendor_requests from anon, authenticated;

-- ---------------------------------------------------------------- notifications
-- Buyer hears every vendor answer (and a changed price); the vendor's list refreshes on its own when buyers confirm.
create or replace function private.on_request_answer() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('will_bring', 'cant_bring', 'vendor_cancelled')
     and (old.status is distinct from new.status or (new.status = 'will_bring' and old.quoted_price is distinct from new.quoted_price)) then
    perform private.enqueue_notify('request_reply', new.id);
  end if;
  return null;
end $$;
drop trigger if exists requests_notify on public.requests;
create trigger requests_notify after update of status, quoted_price on public.requests for each row execute function private.on_request_answer();

-- New request → tell the vendor straight away (same-day slots), at most once per 30 minutes.
create table if not exists private.request_pings (vendor_id uuid primary key, last_at timestamptz not null);
create or replace function private.on_request_created() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  insert into private.request_pings as rp (vendor_id, last_at) values (new.vendor_id, now())
  on conflict (vendor_id) do update set last_at = now() where rp.last_at < now() - interval '30 minutes';
  get diagnostics n = row_count;
  if n > 0 then perform private.enqueue_notify('vendor_requests', new.vendor_id); end if;
  return null;
end $$;
drop trigger if exists requests_created_notify on public.requests;
create trigger requests_created_notify after insert on public.requests for each row execute function private.on_request_created();

-- The 16:00 digest now covers every upcoming slot with unanswered requests.
create or replace function private.enqueue_vendor_request_digests() returns void
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  for r in select distinct vendor_id from public.requests where slot_start > now() and status = 'open' loop
    perform private.enqueue_notify('vendor_requests', r.vendor_id);
  end loop;
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
        'for_date', q.for_date, 'price', q.quoted_price, 'unit', q.quoted_unit, 'slot_start', q.slot_start),
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
revoke execute on function public.request_cutoff(date, time), public.request_slots(uuid, uuid),
  public.create_request(uuid, uuid, uuid, text, text, text, uuid, date), public.respond_to_quote(uuid, boolean),
  public.cancel_request(uuid), public.answer_request(text, public.request_status, date, uuid, numeric, public.price_unit),
  public.my_requests(), public.notify_context(text, uuid) from public, anon;
grant execute on function public.request_slots(uuid, uuid), public.create_request(uuid, uuid, uuid, text, text, text, uuid, date),
  public.respond_to_quote(uuid, boolean), public.cancel_request(uuid),
  public.answer_request(text, public.request_status, date, uuid, numeric, public.price_unit), public.my_requests() to authenticated;
grant execute on function public.request_cutoff(date, time) to authenticated, service_role;
grant execute on function public.notify_context(text, uuid) to service_role;
revoke execute on function public.notify_context(text, uuid) from authenticated;
