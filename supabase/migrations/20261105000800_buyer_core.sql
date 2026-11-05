-- M5: buyer read models (BUY-2, BUY-3), society switching (BUY-1), realtime for live status.

-- Realtime: buyers subscribe to stop_events (RLS limits rows to the last 24 h of verified vendors).
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.stop_events;
  end if;
end $$;

-- Top items of a vendor's menu for a date as jsonb (for cards and push copy).
create or replace function public.menu_json(p_vendor uuid, p_date date) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'menu_id', m.id,
    'published_at', m.published_at,
    'updated_at', m.updated_at,
    'stock_photo_path', m.stock_photo_path,
    'stock_photo_at', m.stock_photo_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'item_id', mi.item_id, 'name', i.name, 'price', mi.price, 'unit', mi.unit,
        'sold_out', mi.is_sold_out, 'deal_price', mi.deal_price, 'deal_at', mi.deal_at) order by mi.sort)
      from public.menu_items mi join public.items i on i.id = mi.item_id where mi.menu_id = m.id), '[]'::jsonb))
  from public.daily_menus m
  where m.vendor_id = p_vendor and m.date = p_date and m.published_at is not null
    and (public.is_verified_vendor(p_vendor) or p_vendor = auth.uid() or public.is_admin())
$$;

-- B-03 home for one society: every verified vendor serving it today, with status, card data and menu.
create or replace function public.buyer_home(p_society_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'vendor_id', t.vendor_id, 'stop_id', t.stop_id, 'gate_id', t.gate_id, 'gate_name', t.gate_name,
      'window_start', t.window_start, 'window_end', t.window_end, 'status', t.status, 'status_at', t.status_at,
      'is_following', t.is_following,
      'display_name', v.display_name, 'photo_path', v.photo_path, 'vehicle', v.vehicle,
      'delivery_available', v.delivery_available, 'avg_rating', v.avg_rating, 'rating_count', v.rating_count,
      'menu', public.menu_json(t.vendor_id, public.ist_today())
    ) order by t.window_start), '[]'::jsonb)
  from public.v_vendor_today(p_society_id) t
  join public.v_vendor_public v on v.id = t.vendor_id
$$;

-- B-05 vendor page. Never includes a phone number (use get_vendor_phone when allow_calls).
create or replace function public.vendor_page(p_vendor_id uuid, p_society_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_pub jsonb;
  v_status jsonb;
begin
  select to_jsonb(v) into v_pub from public.v_vendor_public v where v.id = p_vendor_id;
  if v_pub is null then
    return jsonb_build_object('available', false);
  end if;
  if p_society_id is not null then
    select to_jsonb(t) into v_status from public.v_vendor_today(p_society_id) t where t.vendor_id = p_vendor_id limit 1;
  end if;
  return jsonb_build_object(
    'available', true,
    'vendor', v_pub,
    'today', v_status,
    'menu', public.menu_json(p_vendor_id, public.ist_today()),
    'stops', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from public.vendor_public_stops(p_vendor_id) s),
    'reviews', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb)
                  from (select * from public.v_review_public where vendor_id = p_vendor_id and status = 'visible'
                         order by created_at desc limit 3) r),
    'following', (select coalesce(jsonb_agg(jsonb_build_object('society_id', f.society_id, 'notify_arrival', f.notify_arrival,
                    'notify_deals', f.notify_deals, 'notify_requests', f.notify_requests)), '[]'::jsonb)
                  from public.follows f where f.buyer_id = auth.uid() and f.vendor_id = p_vendor_id)
  );
end $$;

-- B-16 QR: resolve a public code to a vendor id (verified only).
create or replace function public.vendor_by_code(p_code text) returns uuid
language sql stable security definer set search_path = '' as $$
  select user_id from public.vendors where code = upper(trim(p_code)) and status = 'verified'
$$;

-- B-08 Following tab: followed vendors with today's status at that society.
create or replace function public.my_following() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'vendor_id', f.vendor_id, 'society_id', f.society_id, 'society_name', s.name,
      'notify_arrival', f.notify_arrival, 'notify_deals', f.notify_deals, 'notify_requests', f.notify_requests,
      'display_name', v.display_name, 'photo_path', v.photo_path, 'vehicle', v.vehicle, 'delivery_available', v.delivery_available,
      'avg_rating', v.avg_rating, 'rating_count', v.rating_count,
      'today', (select to_jsonb(t) from public.v_vendor_today(f.society_id) t where t.vendor_id = f.vendor_id limit 1),
      'followed_at', f.created_at
    ) order by v.display_name), '[]'::jsonb)
  from public.follows f
  join public.v_vendor_public v on v.id = f.vendor_id
  join public.societies s on s.id = f.society_id
  where f.buyer_id = auth.uid()
$$;

-- B-04: make one saved society the primary one.
create or replace function public.set_primary_society(p_society_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.buyer_societies where buyer_id = auth.uid() and society_id = p_society_id) then
    raise exception 'society_not_saved';
  end if;
  update public.buyer_societies set is_primary = false where buyer_id = auth.uid() and is_primary;
  update public.buyer_societies set is_primary = true where buyer_id = auth.uid() and society_id = p_society_id;
end $$;

-- B-01: save a society (first one becomes primary).
create or replace function public.save_society(p_society_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public.require_role('buyer');
begin
  if not exists (select 1 from public.societies where id = p_society_id and active) then raise exception 'society_not_found'; end if;
  insert into public.buyer_societies (buyer_id, society_id, is_primary)
  values (v_uid, p_society_id, not exists (select 1 from public.buyer_societies where buyer_id = v_uid))
  on conflict do nothing;
end $$;

-- Does a society have any active vendor stops? (B-02 "not served yet")
create or replace function public.society_served(p_society_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.stops s join public.gates g on g.id = s.gate_id
                  join public.vendors v on v.user_id = s.vendor_id and v.status = 'verified'
                  where g.society_id = p_society_id and s.active)
$$;

revoke execute on function public.menu_json(uuid, date), public.buyer_home(uuid), public.vendor_page(uuid, uuid),
  public.vendor_by_code(text), public.my_following(), public.set_primary_society(uuid), public.save_society(uuid),
  public.society_served(uuid) from anon;
