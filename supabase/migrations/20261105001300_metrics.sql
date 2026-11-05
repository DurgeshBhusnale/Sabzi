-- M11: pilot dashboard metrics (ADM-7, PRD §1). Computed in SQL from tables, never from PostHog.

-- One row per user per IST day the app was opened (buyer retention).
create table public.app_opens (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  date date not null,
  primary key (user_id, date)
);
alter table public.app_opens enable row level security;
revoke all on public.app_opens from anon, authenticated;
create policy app_opens_admin_select on public.app_opens for select to authenticated using (public.is_admin());

create or replace function public.record_app_open() returns void
language sql security definer set search_path = '' as $$
  insert into public.app_opens (user_id, date) select auth.uid(), public.ist_today() where auth.uid() is not null
  on conflict do nothing
$$;
revoke execute on function public.record_app_open() from anon;

insert into public.app_settings (key, value, is_public) values ('pilot_start_date', 'null', false) on conflict do nothing;

-- Societies in an area (null = all)
create or replace view public.v_metric_society_adoption with (security_barrier) as
select s.id as society_id, s.name, s.area, s.flats_count,
       (select count(distinct f.buyer_id) from public.follows f join public.profiles p on p.user_id = f.buyer_id and p.deleted_at is null where f.society_id = s.id) as followers,
       (select count(distinct st.vendor_id) from public.stops st join public.gates g on g.id = st.gate_id
          join public.vendors v on v.user_id = st.vendor_id and v.status = 'verified' where g.society_id = s.id and st.active) as vendors
  from public.societies s where s.active;

-- Arrival alerts per IST day with how many were opened within 15 minutes.
create or replace view public.v_metric_alerts_daily with (security_barrier) as
select (n.sent_at at time zone 'Asia/Kolkata')::date as date, so.area,
       count(*) as alerts,
       count(*) filter (where n.opened_at is not null) as opens,
       count(*) filter (where n.opened_at is not null and n.opened_at - n.sent_at <= interval '15 minutes') as opens_15m
  from public.notifications n
  left join public.societies so on so.id = (n.payload->>'society_id')::uuid
 where n.type = 'arrival'
 group by 1, 2;

revoke all on public.v_metric_society_adoption, public.v_metric_alerts_daily, public.app_opens from anon, authenticated;

-- Vendors whose stops touch an area.
create or replace function public.vendors_in_area(p_area public.pilot_area) returns setof uuid
language sql stable security definer set search_path = '' as $$
  select distinct v.user_id from public.vendors v
   where v.status = 'verified'
     and (p_area is null or exists (select 1 from public.stops st join public.gates g on g.id = st.gate_id join public.societies s on s.id = g.society_id
                                     where st.vendor_id = v.user_id and s.area = p_area))
$$;

create or replace function public.metrics_summary(p_area public.pilot_area default null, p_from date default null, p_to date default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_to date := coalesce(p_to, public.ist_today());
  v_from date := coalesce(p_from, v_to - 27);
  v_vendors int;
  v_active int;
  v_rated int;
  v_buyers int;
  v_flats int;
  v_followers int;
  v_alerts int;
  v_opens15 int;
  v_start date;
  v_cohort int;
  v_retained int;
begin
  perform public.require_admin();
  select count(*) into v_vendors from public.vendors_in_area(p_area);
  -- Active vendor: published a menu on at least 5 of the 7 days ending v_to (PRD §1).
  select count(*) into v_active from public.vendors_in_area(p_area) vid
   where (select count(*) from public.daily_menus m where m.vendor_id = vid and m.published_at is not null and m.date between v_to - 6 and v_to) >= 5;
  select count(*) into v_rated from public.vendors_in_area(p_area) vid
   where (select count(*) from public.reviews r where r.vendor_id = vid and r.status = 'visible') >= 10;
  select coalesce(sum(flats_count), 0), coalesce(sum(followers), 0) into v_flats, v_followers
    from public.v_metric_society_adoption where p_area is null or area = p_area;
  select count(distinct bs.buyer_id) into v_buyers from public.buyer_societies bs join public.societies s on s.id = bs.society_id
   join public.profiles p on p.user_id = bs.buyer_id and p.deleted_at is null
   where p_area is null or s.area = p_area;
  select coalesce(sum(alerts), 0), coalesce(sum(opens_15m), 0) into v_alerts, v_opens15
    from public.v_metric_alerts_daily where date between v_from and v_to and (p_area is null or area = p_area);
  -- Week-4 retention: buyers who joined in pilot week 1 and opened the app in week 4.
  v_start := coalesce((select (value #>> '{}')::date from public.app_settings where key = 'pilot_start_date' and value <> 'null'::jsonb),
                      (select min(created_at at time zone 'Asia/Kolkata')::date from public.profiles where role = 'buyer'));
  select count(*) into v_cohort from public.profiles p where p.role = 'buyer' and p.deleted_at is null
     and (p.created_at at time zone 'Asia/Kolkata')::date between v_start and v_start + 6;
  select count(*) into v_retained from public.profiles p where p.role = 'buyer' and p.deleted_at is null
     and (p.created_at at time zone 'Asia/Kolkata')::date between v_start and v_start + 6
     and exists (select 1 from public.app_opens o where o.user_id = p.user_id and o.date between v_start + 21 and v_start + 27);
  return jsonb_build_object(
    'from', v_from, 'to', v_to,
    'verified_vendors', v_vendors,
    'active_vendors', v_active,
    'active_vendor_pct', case when v_vendors > 0 then round(100.0 * v_active / v_vendors, 1) end,
    'buyers', v_buyers,
    'followers', v_followers,
    'flats', v_flats,
    'adoption_pct', case when v_flats > 0 then round(100.0 * v_followers / v_flats, 1) end,
    'alerts', v_alerts,
    'alert_open_rate_pct', case when v_alerts > 0 then round(100.0 * v_opens15 / v_alerts, 1) end,
    'pilot_start', v_start,
    'week4_cohort', v_cohort,
    'week4_retention_pct', case when v_cohort > 0 and public.ist_today() >= v_start + 27 then round(100.0 * v_retained / v_cohort, 1) end,
    'vendors_10_ratings', v_rated,
    'vendors_10_ratings_pct', case when v_active > 0 then round(100.0 * v_rated / v_active, 1) end
  );
end $$;

create or replace function public.metrics_daily(p_area public.pilot_area default null, p_from date default null, p_to date default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_to date := coalesce(p_to, public.ist_today());
  v_from date := coalesce(p_from, v_to - 27);
begin
  perform public.require_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'alerts', coalesce(a.alerts, 0), 'opens', coalesce(a.opens_15m, 0)) order by d), '[]'::jsonb)
    from generate_series(v_from, v_to, interval '1 day') d
    left join lateral (select sum(alerts) as alerts, sum(opens_15m) as opens_15m from public.v_metric_alerts_daily m
                        where m.date = d::date and (p_area is null or m.area = p_area)) a on true);
end $$;

create or replace function public.metrics_societies(p_area public.pilot_area default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object('society_id', society_id, 'name', name, 'area', area, 'flats', flats_count,
            'followers', followers, 'vendors', vendors,
            'adoption_pct', case when flats_count > 0 then round(100.0 * followers / flats_count, 1) else 0 end) order by followers desc), '[]'::jsonb)
          from public.v_metric_society_adoption where p_area is null or area = p_area);
end $$;

create or replace function public.metrics_vendors(p_area public.pilot_area default null, p_from date default null, p_to date default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_to date := coalesce(p_to, public.ist_today());
  v_from date := coalesce(p_from, v_to - 27);
begin
  perform public.require_admin();
  return (select coalesce(jsonb_agg(x order by (x->>'followers')::int desc), '[]'::jsonb) from (
    select jsonb_build_object('vendor_id', v.user_id, 'name', v.display_name,
      'followers', (select count(distinct f.buyer_id) from public.follows f where f.vendor_id = v.user_id),
      'menu_days', (select count(*) from public.daily_menus m where m.vendor_id = v.user_id and m.published_at is not null and m.date between v_from and v_to),
      'arrivals', (select count(*) from public.stop_events e where e.vendor_id = v.user_id and e.type = 'arrived' and (e.created_at at time zone 'Asia/Kolkata')::date between v_from and v_to),
      'rating_count', (select count(*) from public.reviews r where r.vendor_id = v.user_id and r.status = 'visible'),
      'avg_rating', (select round(avg(stars)::numeric, 1) from public.reviews r where r.vendor_id = v.user_id and r.status = 'visible')) as x
    from public.vendors v where v.user_id in (select public.vendors_in_area(p_area))) s);
end $$;

revoke execute on function public.metrics_summary(public.pilot_area, date, date), public.metrics_daily(public.pilot_area, date, date),
  public.metrics_societies(public.pilot_area), public.metrics_vendors(public.pilot_area, date, date), public.vendors_in_area(public.pilot_area) from anon;
