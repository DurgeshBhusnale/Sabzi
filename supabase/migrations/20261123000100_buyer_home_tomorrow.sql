-- Owner review 2026-11-21: buyer home shows a "Coming tomorrow" list, so a vendor whose next visit is
-- tomorrow is not listed under "Coming today". Same card fields as buyer_home, without a menu or live status.

create or replace function public.buyer_home_tomorrow(p_society_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'vendor_id', s.vendor_id, 'stop_id', s.id, 'gate_id', s.gate_id, 'gate_name', g.name,
      'window_start', s.window_start, 'window_end', s.window_end, 'status', 'expected', 'status_at', null,
      'is_following', exists (select 1 from public.follows f where f.buyer_id = auth.uid() and f.vendor_id = s.vendor_id
                               and f.society_id = p_society_id),
      'display_name', v.display_name, 'photo_path', v.photo_path, 'vehicle', v.vehicle,
      'delivery_available', v.delivery_available, 'avg_rating', v.avg_rating, 'rating_count', v.rating_count,
      'menu', null
    ) order by s.window_start), '[]'::jsonb)
  from public.stops s
  join public.gates g on g.id = s.gate_id
  join public.vendors vv on vv.user_id = s.vendor_id and vv.status = 'verified'
  join public.v_vendor_public v on v.id = s.vendor_id
  where g.society_id = p_society_id
    and s.active
    and (public.ist_dow() % 7 + 1)::smallint = any(s.days_of_week)
    and not exists (select 1 from public.stop_skips k where k.stop_id = s.id and k.date = public.ist_today() + 1)
$$;

revoke execute on function public.buyer_home_tomorrow(uuid) from public, anon;
grant execute on function public.buyer_home_tomorrow(uuid) to authenticated;
