-- M1: read views/functions (TECH_SPEC §4.3) and write RPCs (§4.4).
-- Every RPC is security definer with explicit checks, search_path = ''.
-- Error codes are raised as the exception message (e.g. 'arrival_cooldown') so clients can map them to copy.

-- ================================================================ read side

-- Ratings summary per vendor (visible reviews only)
create or replace view public.v_vendor_rating with (security_barrier) as
select r.vendor_id,
       round(avg(r.stars)::numeric, 1) as avg_rating,
       count(*)::int as rating_count,
       count(*) filter (where r.stars = 5)::int as stars_5,
       count(*) filter (where r.stars = 4)::int as stars_4,
       count(*) filter (where r.stars = 3)::int as stars_3,
       count(*) filter (where r.stars = 2)::int as stars_2,
       count(*) filter (where r.stars = 1)::int as stars_1,
       coalesce((select jsonb_object_agg(t.tag, t.n) from (
          select tag, count(*) as n from public.reviews r2, unnest(r2.tags) tag
           where r2.vendor_id = r.vendor_id and r2.status = 'visible' group by tag) t), '{}'::jsonb) as tag_counts
  from public.reviews r
 where r.status = 'visible'
 group by r.vendor_id;

-- Buyer-safe vendor card. No phone, verified only. Runs with owner rights on purpose.
create or replace view public.v_vendor_public with (security_barrier) as
select v.user_id as id,
       v.display_name,
       v.photo_path,
       v.vehicle,
       v.delivery_available,
       v.allow_calls,
       v.code,
       v.verified_at,
       coalesce(r.avg_rating, 0) as avg_rating,
       coalesce(r.rating_count, 0) as rating_count,
       coalesce(r.tag_counts, '{}'::jsonb) as tag_counts,
       coalesce(r.stars_5, 0) as stars_5, coalesce(r.stars_4, 0) as stars_4, coalesce(r.stars_3, 0) as stars_3,
       coalesce(r.stars_2, 0) as stars_2, coalesce(r.stars_1, 0) as stars_1
  from public.vendors v
  left join public.v_vendor_rating r on r.vendor_id = v.user_id
 where v.status = 'verified';

revoke all on public.v_vendor_rating from anon, authenticated;
grant select on public.v_vendor_public to authenticated;

-- Public reviews: reviewer first name and society only, never buyer_id. "Former user" after deletion.
create or replace view public.v_review_public with (security_barrier) as
select r.id,
       r.vendor_id,
       case when p.deleted_at is not null or p.name is null then 'Former user'
            else split_part(trim(p.name), ' ', 1) end as reviewer_name,
       (select s.name from public.follows f join public.societies s on s.id = f.society_id
         where f.buyer_id = r.buyer_id and f.vendor_id = r.vendor_id order by f.created_at limit 1) as society_name,
       r.stars, r.tags, r.text, r.vendor_reply, r.vendor_replied_at, r.created_at, r.updated_at,
       (r.buyer_id = auth.uid()) as is_mine,
       r.status,
       case when r.buyer_id = auth.uid() then r.hidden_reason end as hidden_reason
  from public.reviews r
  join public.profiles p on p.user_id = r.buyer_id
 where (r.status = 'visible' and public.is_verified_vendor(r.vendor_id))
    or r.buyer_id = auth.uid()
    or (r.vendor_id = auth.uid() and r.status = 'visible');
grant select on public.v_review_public to authenticated;

-- Requests addressed to the calling vendor: buyer first name + society, never buyer_id.
create or replace view public.v_vendor_requests with (security_barrier) as
select q.id, q.vendor_id, q.item_id, i.name as item_name, i.default_unit, q.free_text, q.qty, q.note,
       q.for_date, q.status, q.created_at, q.answered_at,
       case when p.deleted_at is not null or p.name is null then 'Former user'
            else split_part(trim(p.name), ' ', 1) end as buyer_first_name,
       s.id as society_id, s.name as society_name
  from public.requests q
  join public.profiles p on p.user_id = q.buyer_id
  join public.societies s on s.id = q.society_id
  left join public.items i on i.id = q.item_id
 where q.vendor_id = auth.uid() and q.status <> 'cancelled';
grant select on public.v_vendor_requests to authenticated;

-- Today's stops for verified vendors at a society, with live status (BUY-2).
create or replace function public.v_vendor_today(p_society_id uuid)
returns table (
  vendor_id uuid,
  stop_id uuid,
  gate_id uuid,
  gate_name text,
  window_start time,
  window_end time,
  status text,
  status_at timestamptz,
  is_following boolean
)
language sql stable security definer set search_path = '' as $$
  with todays as (
    select s.id as stop_id, s.vendor_id, s.gate_id, g.name as gate_name, s.window_start, s.window_end
      from public.stops s
      join public.gates g on g.id = s.gate_id
      join public.vendors v on v.user_id = s.vendor_id and v.status = 'verified'
     where g.society_id = p_society_id
       and s.active
       and public.ist_dow() = any(s.days_of_week)
  ),
  ev as (
    select t.*,
           (select e.created_at from public.stop_events e
             where e.vendor_id = t.vendor_id and e.gate_id = t.gate_id and e.type = 'arrived'
               and (e.created_at at time zone 'Asia/Kolkata')::date = public.ist_today()
             order by e.created_at desc limit 1) as arrived_at,
           exists (select 1 from public.stop_skips k where k.stop_id = t.stop_id and k.date = public.ist_today()) as skipped
      from todays t
  ),
  st as (
    select ev.*,
           (select e.created_at from public.stop_events e
             where e.vendor_id = ev.vendor_id and e.gate_id = ev.gate_id and e.type = 'left'
               and e.created_at > ev.arrived_at order by e.created_at limit 1) as left_at,
           (select e.created_at from public.stop_events e
             where e.vendor_id = ev.vendor_id and e.gate_id = ev.gate_id and e.type = 'leaving_soon'
               and e.created_at > ev.arrived_at order by e.created_at desc limit 1) as leaving_at
      from ev
  )
  select st.vendor_id, st.stop_id, st.gate_id, st.gate_name, st.window_start, st.window_end,
         case
           when st.skipped then 'not_coming'
           when st.arrived_at is null then 'expected'
           when st.left_at is not null then 'left'
           when st.arrived_at < now() - interval '3 hours' then 'left'
           when st.leaving_at is not null then 'leaving_soon'
           else 'at_gate'
         end as status,
         case
           when st.skipped then null
           when st.left_at is not null then st.left_at
           else st.arrived_at
         end as status_at,
         exists (select 1 from public.follows f where f.buyer_id = auth.uid() and f.vendor_id = st.vendor_id
                  and f.society_id = p_society_id) as is_following
    from st
   order by st.window_start
$$;
revoke execute on function public.v_vendor_today(uuid) from anon;

-- All stops of a verified vendor (vendor page "Stops and timings")
create or replace function public.vendor_public_stops(p_vendor_id uuid)
returns table (stop_id uuid, society_id uuid, society_name text, gate_id uuid, gate_name text,
               days_of_week smallint[], window_start time, window_end time, skipped_today boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, so.id, so.name, g.id, g.name, s.days_of_week, s.window_start, s.window_end,
         exists (select 1 from public.stop_skips k where k.stop_id = s.id and k.date = public.ist_today())
    from public.stops s
    join public.gates g on g.id = s.gate_id
    join public.societies so on so.id = g.society_id
   where s.vendor_id = p_vendor_id and s.active
     and (public.is_verified_vendor(p_vendor_id) or p_vendor_id = auth.uid() or public.is_admin())
   order by s.window_start
$$;
revoke execute on function public.vendor_public_stops(uuid) from anon;

-- Phone only when allow_calls is on and caller is signed in.
create or replace function public.get_vendor_phone(p_vendor_id uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_phone text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  select '+' || u.phone into v_phone
    from public.vendors v join auth.users u on u.id = v.user_id
   where v.user_id = p_vendor_id and v.allow_calls and v.status = 'verified';
  return v_phone;
end $$;
revoke execute on function public.get_vendor_phone(uuid) from anon;

-- Follower counts for the calling vendor per gate (VEN-11). Counts only, never identities.
create or replace function public.my_follower_counts()
returns table (society_id uuid, society_name text, followers int)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, count(f.buyer_id)::int
    from public.follows f join public.societies s on s.id = f.society_id
   where f.vendor_id = auth.uid()
   group by s.id, s.name
   order by count(f.buyer_id) desc
$$;

-- Count of followers of a vendor at a society (used by "42 people will be told")
create or replace function public.follower_count(p_vendor_id uuid, p_society_id uuid default null) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.follows f
   where f.vendor_id = p_vendor_id
     and (p_society_id is null or f.society_id = p_society_id)
     and (p_vendor_id = auth.uid() or public.is_admin() or public.is_verified_vendor(p_vendor_id))
$$;

-- ================================================================ write side helpers

create or replace function public.require_role(p_role public.user_role) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.profiles where user_id = v_uid and role = p_role and deleted_at is null) then
    raise exception 'wrong_role' using hint = 'This action needs a ' || p_role || ' account';
  end if;
  return v_uid;
end $$;

-- Returns stored result when the client_id was already processed (offline queue retries).
create or replace function public.action_seen(p_client_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select result from public.action_log where client_id = p_client_id and user_id = auth.uid()
$$;

create or replace function public.action_record(p_client_id uuid, p_action text, p_result jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if p_client_id is not null then
    insert into public.action_log (client_id, user_id, action, result)
    values (p_client_id, auth.uid(), p_action, p_result)
    on conflict (client_id) do nothing;
  end if;
  return p_result;
end $$;
revoke execute on function public.action_record(uuid, text, jsonb) from anon, authenticated;
revoke execute on function public.action_seen(uuid) from anon;

-- ================================================================ account RPCs

create or replace function public.set_role(p_role public.user_role) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_current public.user_role;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_role not in ('buyer', 'vendor') then raise exception 'invalid_role'; end if;
  select role into v_current from public.profiles where user_id = auth.uid();
  if v_current = p_role then return; end if;
  if v_current is not null then raise exception 'role_locked' using hint = 'Role can be set only once'; end if;
  update public.profiles set role = p_role where user_id = auth.uid();
end $$;

-- ================================================================ vendor RPCs

create or replace function public.vendor_active_id() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('vendor');
  v_status public.vendor_status;
begin
  select status into v_status from public.vendors where user_id = v_uid;
  if v_status is null then raise exception 'vendor_profile_missing'; end if;
  if v_status in ('suspended', 'rejected') then raise exception 'vendor_suspended'; end if;
  return v_uid;
end $$;

create or replace function public.publish_menu(p_date date, p_items jsonb, p_client_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_seen jsonb := public.action_seen(p_client_id);
  v_menu uuid;
  v_count int;
  v_item jsonb;
  v_sort int := 0;
begin
  if v_seen is not null then return v_seen; end if;
  if p_date is null or p_date < public.ist_today() - 1 or p_date > public.ist_today() + 1 then
    raise exception 'invalid_date';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'menu_empty';
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    if (v_item->>'price')::numeric is null or (v_item->>'price')::numeric < 1 or (v_item->>'price')::numeric > 999 then
      raise exception 'invalid_price';
    end if;
    if not exists (select 1 from public.items i where i.id = (v_item->>'item_id')::uuid
                    and (i.approved or i.created_by = v_uid)) then
      raise exception 'invalid_item';
    end if;
  end loop;

  insert into public.daily_menus (vendor_id, date, published_at)
  values (v_uid, p_date, now())
  on conflict (vendor_id, date) do update set published_at = now()
  returning id into v_menu;

  delete from public.menu_items mi
   where mi.menu_id = v_menu
     and mi.item_id not in (select (e->>'item_id')::uuid from jsonb_array_elements(p_items) e);

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_sort := v_sort + 1;
    insert into public.menu_items (menu_id, item_id, price, unit, sort)
    values (v_menu, (v_item->>'item_id')::uuid, (v_item->>'price')::numeric, (v_item->>'unit')::public.price_unit, v_sort)
    on conflict (menu_id, item_id) do update
      set price = excluded.price, unit = excluded.unit, sort = excluded.sort,
          deal_price = case when public.menu_items.deal_price < excluded.price then public.menu_items.deal_price end;
  end loop;

  select count(*) into v_count from public.menu_items where menu_id = v_menu;
  return public.action_record(p_client_id, 'publish_menu', jsonb_build_object(
    'menu_id', v_menu, 'items', v_count,
    'followers', (select count(distinct buyer_id) from public.follows where vendor_id = v_uid)));
end $$;

create or replace function public.set_sold_out(p_item_id uuid, p_sold_out boolean, p_client_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_seen jsonb := public.action_seen(p_client_id);
  v_menu uuid;
begin
  if v_seen is not null then return v_seen; end if;
  select id into v_menu from public.daily_menus where vendor_id = v_uid and date = public.ist_today();
  if v_menu is null then raise exception 'menu_not_found'; end if;
  update public.menu_items set is_sold_out = p_sold_out where menu_id = v_menu and item_id = p_item_id;
  if not found then raise exception 'item_not_on_menu'; end if;
  update public.daily_menus set updated_at = now() where id = v_menu;
  return public.action_record(p_client_id, 'set_sold_out', jsonb_build_object('item_id', p_item_id, 'sold_out', p_sold_out));
end $$;

create or replace function public.set_stock_photo(p_path text, p_client_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_seen jsonb := public.action_seen(p_client_id);
begin
  if v_seen is not null then return v_seen; end if;
  if p_path is null or split_part(p_path, '/', 1) <> v_uid::text then raise exception 'invalid_path'; end if;
  insert into public.daily_menus (vendor_id, date, stock_photo_path, stock_photo_at)
  values (v_uid, public.ist_today(), p_path, now())
  on conflict (vendor_id, date) do update set stock_photo_path = excluded.stock_photo_path, stock_photo_at = now();
  return public.action_record(p_client_id, 'set_stock_photo', jsonb_build_object('path', p_path));
end $$;

-- Stop of the calling vendor at a gate that runs today
create or replace function public.vendor_stop_today(p_vendor uuid, p_gate uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select s.id from public.stops s
   where s.vendor_id = p_vendor and s.gate_id = p_gate and s.active and public.ist_dow() = any(s.days_of_week)
   limit 1
$$;

create or replace function public.vendor_arrive(p_gate_id uuid, p_lat double precision default null,
  p_lng double precision default null, p_client_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_existing public.stop_events;
  v_last timestamptz;
  v_event uuid;
  v_society uuid;
begin
  if p_client_id is not null then
    select * into v_existing from public.stop_events where client_id = p_client_id;
    if found then
      if v_existing.vendor_id <> v_uid then raise exception 'invalid_client_id'; end if;
      return jsonb_build_object('event_id', v_existing.id, 'followers',
        (select count(*) from public.follows f join public.gates g on g.society_id = f.society_id
          where g.id = v_existing.gate_id and f.vendor_id = v_uid and f.notify_arrival), 'duplicate', true);
    end if;
  end if;
  if not public.is_verified_vendor(v_uid) then raise exception 'vendor_not_verified'; end if;
  if public.vendor_stop_today(v_uid, p_gate_id) is null then raise exception 'not_a_stop_today'; end if;

  select max(created_at) into v_last from public.stop_events
   where vendor_id = v_uid and gate_id = p_gate_id and type = 'arrived' and created_at > now() - interval '2 hours';
  if v_last is not null then
    raise exception 'arrival_cooldown' using detail = (v_last + interval '2 hours')::text,
      hint = 'One arrival alert per stop every 2 hours';
  end if;

  insert into public.stop_events (vendor_id, gate_id, type, lat, lng, client_id)
  values (v_uid, p_gate_id, 'arrived', p_lat, p_lng, p_client_id)
  returning id into v_event;

  select society_id into v_society from public.gates where id = p_gate_id;
  return jsonb_build_object('event_id', v_event, 'followers',
    (select count(*) from public.follows f where f.vendor_id = v_uid and f.society_id = v_society and f.notify_arrival),
    'duplicate', false);
end $$;

-- Undo within 10 s of the tap (V-08 shows a 5-second Undo; push is delayed until the window closes).
create or replace function public.undo_stop_event(p_event_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
begin
  delete from public.stop_events
   where id = p_event_id and vendor_id = v_uid and created_at > now() - interval '10 seconds';
  if not found then raise exception 'undo_expired'; end if;
end $$;

create or replace function public.vendor_stop_event(p_gate_id uuid, p_type public.stop_event_type, p_client_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_arrived timestamptz;
  v_event uuid;
begin
  if p_client_id is not null and exists (select 1 from public.stop_events where client_id = p_client_id and vendor_id = v_uid) then
    return jsonb_build_object('event_id', (select id from public.stop_events where client_id = p_client_id), 'duplicate', true);
  end if;
  select max(created_at) into v_arrived from public.stop_events
   where vendor_id = v_uid and gate_id = p_gate_id and type = 'arrived' and created_at > now() - interval '3 hours';
  if v_arrived is null then raise exception 'not_arrived'; end if;
  if exists (select 1 from public.stop_events where vendor_id = v_uid and gate_id = p_gate_id and type = 'left' and created_at > v_arrived) then
    raise exception 'already_left';
  end if;
  if p_type = 'leaving_soon' and exists (select 1 from public.stop_events where vendor_id = v_uid and gate_id = p_gate_id
       and type = 'leaving_soon' and created_at > v_arrived) then
    raise exception 'already_sent';
  end if;
  insert into public.stop_events (vendor_id, gate_id, type, client_id)
  values (v_uid, p_gate_id, p_type, p_client_id) returning id into v_event;
  return jsonb_build_object('event_id', v_event, 'duplicate', false);
end $$;
revoke execute on function public.vendor_stop_event(uuid, public.stop_event_type, uuid) from anon, authenticated;

create or replace function public.vendor_leaving_soon(p_gate_id uuid, p_client_id uuid default null) returns jsonb
language sql security definer set search_path = '' as $$
  select public.vendor_stop_event(p_gate_id, 'leaving_soon', p_client_id)
$$;

create or replace function public.vendor_left(p_gate_id uuid, p_client_id uuid default null) returns jsonb
language sql security definer set search_path = '' as $$
  select public.vendor_stop_event(p_gate_id, 'left', p_client_id)
$$;

create or replace function public.skip_stop(p_stop_id uuid, p_date date default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_date date := coalesce(p_date, public.ist_today());
  v_gate uuid;
  v_society uuid;
begin
  select s.gate_id, g.society_id into v_gate, v_society
    from public.stops s join public.gates g on g.id = s.gate_id
   where s.id = p_stop_id and s.vendor_id = v_uid;
  if v_gate is null then raise exception 'stop_not_found'; end if;
  if v_date < public.ist_today() then raise exception 'invalid_date'; end if;
  insert into public.stop_skips (stop_id, date) values (p_stop_id, v_date) on conflict do nothing;
  if found and v_date = public.ist_today() then
    insert into public.stop_events (vendor_id, gate_id, type) values (v_uid, v_gate, 'not_going');
  end if;
  return jsonb_build_object('followers',
    (select count(*) from public.follows f where f.vendor_id = v_uid and f.society_id = v_society));
end $$;

create or replace function public.unskip_stop(p_stop_id uuid, p_date date default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
begin
  delete from public.stop_skips k using public.stops s
   where k.stop_id = s.id and s.id = p_stop_id and s.vendor_id = v_uid
     and k.date = coalesce(p_date, public.ist_today());
  delete from public.stop_events e using public.stops s
   where s.id = p_stop_id and s.vendor_id = v_uid and e.vendor_id = v_uid and e.gate_id = s.gate_id
     and e.type = 'not_going' and (e.created_at at time zone 'Asia/Kolkata')::date = coalesce(p_date, public.ist_today());
end $$;

create or replace function public.send_deal(p_items jsonb, p_client_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_seen jsonb := public.action_seen(p_client_id);
  v_menu uuid;
  v_item jsonb;
  v_price numeric;
  v_deal uuid;
begin
  if v_seen is not null then return v_seen; end if;
  if not public.is_verified_vendor(v_uid) then raise exception 'vendor_not_verified'; end if;
  if exists (select 1 from public.deals where vendor_id = v_uid and date = public.ist_today()) then
    raise exception 'deal_limit' using hint = 'You can send one deal a day';
  end if;
  select id into v_menu from public.daily_menus where vendor_id = v_uid and date = public.ist_today() and published_at is not null;
  if v_menu is null then raise exception 'menu_not_found'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'deal_empty'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select price into v_price from public.menu_items
     where menu_id = v_menu and item_id = (v_item->>'item_id')::uuid and not is_sold_out;
    if v_price is null then raise exception 'item_not_on_menu'; end if;
    if (v_item->>'deal_price')::numeric >= v_price or (v_item->>'deal_price')::numeric < 1 then
      raise exception 'deal_price_invalid';
    end if;
    update public.menu_items set deal_price = (v_item->>'deal_price')::numeric, deal_at = now()
     where menu_id = v_menu and item_id = (v_item->>'item_id')::uuid;
  end loop;

  insert into public.deals (vendor_id, date, client_id) values (v_uid, public.ist_today(), p_client_id)
  returning id into v_deal;
  return public.action_record(p_client_id, 'send_deal', jsonb_build_object('deal_id', v_deal,
    'followers', (select count(distinct buyer_id) from public.follows where vendor_id = v_uid and notify_deals)));
end $$;

-- item_key: item uuid as text, or 'free:<lowercased text>' for free-text requests (VEN-10)
create or replace function public.answer_request(p_item_key text, p_status public.request_status,
  p_for_date date default null) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.vendor_active_id();
  v_date date := coalesce(p_for_date, public.ist_today() + 1);
  v_count int;
begin
  if p_status not in ('will_bring', 'cant_bring') then raise exception 'invalid_status'; end if;
  update public.requests q
     set status = p_status, answered_at = now()
   where q.vendor_id = v_uid and q.for_date = v_date and q.status in ('open', 'will_bring', 'cant_bring')
     and (
       (p_item_key not like 'free:%' and q.item_id::text = p_item_key)
       or (p_item_key like 'free:%' and q.item_id is null and lower(trim(q.free_text)) = substr(p_item_key, 6))
     );
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'request_not_found'; end if;
  return v_count;
end $$;

create or replace function public.reply_review(p_review_id uuid, p_text text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('vendor');
begin
  if p_text is null or char_length(trim(p_text)) = 0 or char_length(p_text) > 300 then raise exception 'invalid_text'; end if;
  update public.reviews set vendor_reply = trim(p_text), vendor_replied_at = now()
   where id = p_review_id and vendor_id = v_uid and vendor_reply is null;
  if not found then raise exception 'reply_not_allowed' using hint = 'You can reply once to each review'; end if;
end $$;

create or replace function public.flag_review(p_review_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('vendor');
begin
  if not exists (select 1 from public.reviews where id = p_review_id and vendor_id = v_uid) then
    raise exception 'review_not_found';
  end if;
  insert into public.review_flags (review_id, vendor_id, reason) values (p_review_id, v_uid, p_reason)
  on conflict (review_id, vendor_id) do nothing;
end $$;

-- ================================================================ buyer RPCs

create or replace function public.vendor_serves_society(p_vendor uuid, p_society uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.stops s join public.gates g on g.id = s.gate_id
                  where s.vendor_id = p_vendor and g.society_id = p_society and s.active)
$$;

create or replace function public.follow_vendor(p_vendor_id uuid, p_society_id uuid, p_prefs jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
begin
  if not public.is_verified_vendor(p_vendor_id) then raise exception 'vendor_not_found'; end if;
  if not public.vendor_serves_society(p_vendor_id, p_society_id) then raise exception 'vendor_not_serving_society'; end if;
  insert into public.follows (buyer_id, vendor_id, society_id, notify_arrival, notify_deals, notify_requests)
  values (v_uid, p_vendor_id, p_society_id,
          coalesce((p_prefs->>'notify_arrival')::boolean, true),
          coalesce((p_prefs->>'notify_deals')::boolean, true),
          coalesce((p_prefs->>'notify_requests')::boolean, true))
  on conflict (buyer_id, vendor_id, society_id) do update
    set notify_arrival = coalesce((p_prefs->>'notify_arrival')::boolean, public.follows.notify_arrival),
        notify_deals = coalesce((p_prefs->>'notify_deals')::boolean, public.follows.notify_deals),
        notify_requests = coalesce((p_prefs->>'notify_requests')::boolean, public.follows.notify_requests);
end $$;

create or replace function public.unfollow_vendor(p_vendor_id uuid, p_society_id uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
begin
  delete from public.follows where buyer_id = v_uid and vendor_id = p_vendor_id
     and (p_society_id is null or society_id = p_society_id);
end $$;

-- Rating eligibility (BUY-6): followed 3+ days; one per vendor; editable after 7 days.
create or replace function public.review_eligibility(p_vendor_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_since timestamptz;
  v_review public.reviews;
begin
  select min(created_at) into v_since from public.follows where buyer_id = v_uid and vendor_id = p_vendor_id;
  select * into v_review from public.reviews where buyer_id = v_uid and vendor_id = p_vendor_id;
  if v_review.id is not null then
    return jsonb_build_object('state', case when v_review.updated_at <= now() - interval '7 days' then 'can_edit' else 'locked' end,
      'review_id', v_review.id, 'unlocks_at', v_review.updated_at + interval '7 days');
  end if;
  if v_since is null then
    return jsonb_build_object('state', 'not_following');
  end if;
  if v_since > now() - interval '3 days' then
    return jsonb_build_object('state', 'too_soon', 'unlocks_at', v_since + interval '3 days',
      'days_left', ceil(extract(epoch from (v_since + interval '3 days' - now())) / 86400)::int);
  end if;
  return jsonb_build_object('state', 'eligible');
end $$;

create or replace function public.submit_review(p_vendor_id uuid, p_stars int, p_tags text[] default '{}', p_text text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
  v_elig jsonb := public.review_eligibility(p_vendor_id);
  v_id uuid;
begin
  if p_stars is null or p_stars < 1 or p_stars > 5 then raise exception 'invalid_stars'; end if;
  if p_text is not null and char_length(p_text) > 300 then raise exception 'review_too_long'; end if;
  case v_elig->>'state'
    when 'not_following' then raise exception 'rating_not_following';
    when 'too_soon' then raise exception 'rating_too_soon' using detail = v_elig->>'unlocks_at';
    when 'locked' then raise exception 'review_locked' using detail = v_elig->>'unlocks_at';
    when 'can_edit' then
      update public.reviews set stars = p_stars, tags = coalesce(p_tags, '{}'), text = nullif(trim(p_text), ''),
             updated_at = now(), status = 'visible', hidden_reason = null
       where id = (v_elig->>'review_id')::uuid returning id into v_id;
    else
      insert into public.reviews (vendor_id, buyer_id, stars, tags, text)
      values (p_vendor_id, v_uid, p_stars, coalesce(p_tags, '{}'), nullif(trim(p_text), ''))
      returning id into v_id;
  end case;
  return v_id;
end $$;

create or replace function public.create_request(p_vendor_id uuid, p_society_id uuid, p_item_id uuid default null,
  p_free_text text default null, p_qty text default null, p_note text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
  v_id uuid;
begin
  if not public.is_verified_vendor(p_vendor_id) then raise exception 'vendor_not_found'; end if;
  if not exists (select 1 from public.buyer_societies where buyer_id = v_uid and society_id = p_society_id) then
    raise exception 'society_not_saved';
  end if;
  insert into public.requests (buyer_id, vendor_id, society_id, item_id, free_text, qty, note, for_date)
  values (v_uid, p_vendor_id, p_society_id, p_item_id, nullif(trim(p_free_text), ''), nullif(trim(p_qty), ''),
          nullif(trim(p_note), ''), public.ist_today() + 1)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.cancel_request(p_request_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
begin
  update public.requests set status = 'cancelled' where id = p_request_id and buyer_id = v_uid and status = 'open';
  if not found then raise exception 'request_not_found'; end if;
end $$;

create or replace function public.report_vendor(p_vendor_id uuid, p_reason public.report_reason,
  p_text text default null, p_photo_path text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
  v_id uuid;
begin
  if not exists (select 1 from public.vendors where user_id = p_vendor_id) then raise exception 'vendor_not_found'; end if;
  insert into public.reports (reporter_id, vendor_id, reason, text, photo_path)
  values (v_uid, p_vendor_id, p_reason, nullif(trim(p_text), ''), p_photo_path) returning id into v_id;
  return v_id;
end $$;

create or replace function public.record_vendor_view(p_vendor_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_verified_vendor(p_vendor_id) or auth.uid() = p_vendor_id then return; end if;
  insert into public.vendor_page_views (vendor_id, viewer_id) values (p_vendor_id, auth.uid());
end $$;

create or replace function public.mark_notification_opened(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.notifications set opened_at = coalesce(opened_at, now()) where id = p_id and user_id = auth.uid();
end $$;

-- ================================================================ admin RPCs

create or replace function public.require_admin(p_owner_only boolean default false) returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if p_owner_only and not public.is_owner() then raise exception 'owner_only'; end if;
  if not public.is_admin() then raise exception 'admin_only'; end if;
  return auth.uid();
end $$;

create or replace function public.verify_vendor(p_vendor_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := public.require_admin();
begin
  update public.vendors set status = 'verified', status_reason = null, verified_by = v_admin, verified_at = now()
   where user_id = p_vendor_id;
  if not found then raise exception 'vendor_not_found'; end if;
end $$;

create or replace function public.set_vendor_status(p_vendor_id uuid, p_status public.vendor_status, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := public.require_admin();
begin
  if p_status = 'verified' then
    perform public.verify_vendor(p_vendor_id);
    return;
  end if;
  if p_status in ('needs_info', 'rejected', 'suspended') and coalesce(trim(p_reason), '') = '' then
    raise exception 'reason_required';
  end if;
  update public.vendors set status = p_status, status_reason = nullif(trim(p_reason), '') where user_id = p_vendor_id;
  if not found then raise exception 'vendor_not_found'; end if;
end $$;

create or replace function public.upsert_stop(p_id uuid, p_vendor_id uuid, p_gate_id uuid, p_days smallint[],
  p_start time, p_end time, p_active boolean default true) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := public.require_admin();
  v_id uuid;
begin
  if p_id is null then
    insert into public.stops (vendor_id, gate_id, days_of_week, window_start, window_end, active)
    values (p_vendor_id, p_gate_id, p_days, p_start, p_end, p_active) returning id into v_id;
  else
    update public.stops set vendor_id = p_vendor_id, gate_id = p_gate_id, days_of_week = p_days,
           window_start = p_start, window_end = p_end, active = p_active
     where id = p_id returning id into v_id;
    if v_id is null then raise exception 'stop_not_found'; end if;
  end if;
  return v_id;
end $$;

create or replace function public.hide_review(p_review_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := public.require_admin();
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason_required'; end if;
  update public.reviews set status = 'hidden', hidden_reason = trim(p_reason) where id = p_review_id;
  if not found then raise exception 'review_not_found'; end if;
  update public.review_flags set status = 'actioned' where review_id = p_review_id and status = 'open';
end $$;

create or replace function public.keep_review(p_review_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := public.require_admin();
begin
  update public.review_flags set status = 'dismissed' where review_id = p_review_id and status = 'open';
end $$;

create or replace function public.resolve_report(p_report_id uuid, p_status public.report_status, p_note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := public.require_admin();
begin
  if p_status = 'open' then raise exception 'invalid_status'; end if;
  update public.reports set status = p_status, resolution_note = p_note where id = p_report_id;
  if not found then raise exception 'report_not_found'; end if;
end $$;

create or replace function public.approve_item(p_item_id uuid, p_name text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_admin uuid := public.require_admin();
begin
  update public.items set approved = true, is_custom = false, name = coalesce(nullif(trim(p_name), ''), name)
   where id = p_item_id;
  if not found then raise exception 'item_not_found'; end if;
end $$;

-- Lock down: no RPCs for anon.
revoke execute on all functions in schema public from anon;
grant execute on function public.ist_now(), public.ist_today(), public.ist_dow() to anon;
revoke all on public.v_vendor_public, public.v_review_public, public.v_vendor_requests, public.v_vendor_rating from anon;
