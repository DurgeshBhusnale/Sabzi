-- M4: vendor read helpers (VEN-11 numbers, V-03 first-time celebration, V-09 live count).

-- Stats for the calling vendor. Counts only, never identities.
create or replace function public.my_vendor_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('vendor');
begin
  return jsonb_build_object(
    'followers', (select count(distinct buyer_id) from public.follows where vendor_id = v_uid),
    'followers_week_change', (select count(distinct buyer_id) from public.follows where vendor_id = v_uid and created_at > now() - interval '7 days'),
    'alert_opens_today', (select count(*) from public.notifications n
                           where n.type in ('arrival', 'leaving_soon', 'deal') and (n.payload->>'vendor_id')::uuid = v_uid
                             and n.opened_at is not null and (n.opened_at at time zone 'Asia/Kolkata')::date = public.ist_today()),
    'profile_views_week', (select count(*) from public.vendor_page_views where vendor_id = v_uid and created_at > now() - interval '7 days'),
    'avg_rating', coalesce((select round(avg(stars)::numeric, 1) from public.reviews where vendor_id = v_uid and status = 'visible'), 0),
    'rating_count', (select count(*) from public.reviews where vendor_id = v_uid and status = 'visible')
  );
end $$;

-- Opens of the alerts sent for one stop event (V-09 "18 opened your alert").
create or replace function public.event_open_count(p_event_id uuid) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.notifications n
   where (n.payload->>'event_id')::uuid = p_event_id and n.opened_at is not null
     and exists (select 1 from public.stop_events e where e.id = p_event_id and e.vendor_id = auth.uid())
$$;

-- V-03 verified celebration shows once.
create or replace function public.mark_verified_seen() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.vendors set verified_seen_at = now() where user_id = auth.uid() and verified_seen_at is null;
end $$;

-- Today's stops for the calling vendor with live state and follower counts (V-04, V-08, V-12).
create or replace function public.my_stops_today()
returns table (stop_id uuid, gate_id uuid, gate_name text, society_id uuid, society_name text,
               gate_lat double precision, gate_lng double precision, window_start time, window_end time,
               followers int, skipped boolean, arrived_at timestamptz, left_at timestamptz, leaving_at timestamptz,
               last_arrival_at timestamptz, arrival_event_id uuid)
language sql stable security definer set search_path = '' as $$
  select s.id, g.id, g.name, so.id, so.name, g.lat, g.lng, s.window_start, s.window_end,
         (select count(*)::int from public.follows f where f.vendor_id = s.vendor_id and f.society_id = so.id),
         exists (select 1 from public.stop_skips k where k.stop_id = s.id and k.date = public.ist_today()),
         a.created_at,
         (select min(e.created_at) from public.stop_events e where e.vendor_id = s.vendor_id and e.gate_id = g.id and e.type = 'left' and e.created_at > a.created_at),
         (select max(e.created_at) from public.stop_events e where e.vendor_id = s.vendor_id and e.gate_id = g.id and e.type = 'leaving_soon' and e.created_at > a.created_at),
         (select max(e.created_at) from public.stop_events e where e.vendor_id = s.vendor_id and e.gate_id = g.id and e.type = 'arrived'),
         a.id
    from public.stops s
    join public.gates g on g.id = s.gate_id
    join public.societies so on so.id = g.society_id
    left join lateral (
      select e.id, e.created_at from public.stop_events e
       where e.vendor_id = s.vendor_id and e.gate_id = g.id and e.type = 'arrived'
         and (e.created_at at time zone 'Asia/Kolkata')::date = public.ist_today()
       order by e.created_at desc limit 1
    ) a on true
   where s.vendor_id = auth.uid() and s.active and public.ist_dow() = any(s.days_of_week)
   order by s.window_start
$$;

-- All my stops for "This week" (V-12).
create or replace function public.my_stops_week()
returns table (stop_id uuid, gate_name text, society_name text, days_of_week smallint[], window_start time, window_end time)
language sql stable security definer set search_path = '' as $$
  select s.id, g.name, so.name, s.days_of_week, s.window_start, s.window_end
    from public.stops s join public.gates g on g.id = s.gate_id join public.societies so on so.id = g.society_id
   where s.vendor_id = auth.uid() and s.active
   order by s.window_start
$$;

revoke execute on function public.my_vendor_stats(), public.event_open_count(uuid), public.mark_verified_seen(),
  public.my_stops_today(), public.my_stops_week() from anon;
