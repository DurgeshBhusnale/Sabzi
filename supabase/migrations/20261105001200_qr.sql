-- M10: QR web fallback (BUY-10, VEN-12) and society poster page. Readable without login, so they expose
-- only what a printed sticker already shows: name, photo, rating, today's status and a menu preview.

create table public.qr_scans (
  id bigint generated always as identity primary key,
  vendor_id uuid references public.vendors(user_id) on delete cascade,
  society_id uuid references public.societies(id) on delete cascade,
  source text not null check (source in ('web', 'app')),
  created_at timestamptz not null default now()
);
alter table public.qr_scans enable row level security;
revoke all on public.qr_scans from anon, authenticated;
create policy qr_scans_admin_select on public.qr_scans for select to authenticated using (public.is_admin());

create or replace function public.public_vendor_card(p_code text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', v.code, 'display_name', v.display_name, 'photo_path', v.photo_path, 'vehicle', v.vehicle,
    'delivery_available', v.delivery_available, 'avg_rating', p.avg_rating, 'rating_count', p.rating_count,
    'menu', (select jsonb_build_object('updated_at', m.updated_at, 'stock_photo_path', m.stock_photo_path,
               'items', (select coalesce(jsonb_agg(jsonb_build_object('name', i.name, 'price', mi.price, 'unit', mi.unit, 'sold_out', mi.is_sold_out) order by mi.sort), '[]'::jsonb)
                         from public.menu_items mi join public.items i on i.id = mi.item_id where mi.menu_id = m.id))
             from public.daily_menus m where m.vendor_id = v.user_id and m.date = public.ist_today() and m.published_at is not null),
    'stops', (select coalesce(jsonb_agg(jsonb_build_object('society', s.society_name, 'gate', s.gate_name, 'window_start', s.window_start,
               'window_end', s.window_end, 'skipped_today', s.skipped_today) order by s.window_start), '[]'::jsonb)
              from public.vendor_public_stops(v.user_id) s),
    'arrived_at', (select max(e.created_at) from public.stop_events e where e.vendor_id = v.user_id and e.type = 'arrived'
                    and e.created_at > now() - interval '3 hours'
                    and not exists (select 1 from public.stop_events l where l.vendor_id = v.user_id and l.type = 'left' and l.created_at > e.created_at))
  )
  from public.vendors v join public.v_vendor_public p on p.id = v.user_id
  where v.code = upper(trim(p_code)) and v.status = 'verified'
$$;

create or replace function public.public_society_card(p_society_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', s.id, 'name', s.name, 'area', s.area,
    'vendors', (select coalesce(jsonb_agg(distinct jsonb_build_object('code', v.code, 'display_name', v.display_name, 'photo_path', v.photo_path,
                  'avg_rating', p.avg_rating, 'rating_count', p.rating_count)), '[]'::jsonb)
                from public.stops st join public.gates g on g.id = st.gate_id join public.vendors v on v.user_id = st.vendor_id
                join public.v_vendor_public p on p.id = v.user_id
                where g.society_id = s.id and st.active))
  from public.societies s where s.id = p_society_id and s.active
$$;

create or replace function public.record_qr_scan(p_code text, p_source text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_source not in ('web', 'app') then return; end if;
  insert into public.qr_scans (vendor_id, source)
  select user_id, p_source from public.vendors where code = upper(trim(p_code)) and status = 'verified';
end $$;

grant execute on function public.public_vendor_card(text), public.public_society_card(uuid), public.record_qr_scan(text, text) to anon, authenticated;
