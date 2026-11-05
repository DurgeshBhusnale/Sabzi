-- M9: admin panel (ADM-1 … ADM-8). Admin rights need the admin role AND a 2-step (aal2) session.

insert into private.settings (key, value) values ('admin_require_mfa', 'true') on conflict (key) do nothing;

create or replace function public.admin_mfa_ok() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt()->>'aal', '') = 'aal2'
      or coalesce((select value from private.settings where key = 'admin_require_mfa'), 'true') <> 'true'
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.admin_mfa_ok() and exists (
    select 1 from public.profiles
     where user_id = auth.uid() and role = 'admin' and admin_active and deleted_at is null
  )
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.admin_mfa_ok() and exists (
    select 1 from public.profiles
     where user_id = auth.uid() and role = 'admin' and admin_level = 'owner' and admin_active and deleted_at is null
  )
$$;

-- Who am I in the admin panel (works before MFA so the login screen can route).
create or replace function public.admin_me() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('user_id', p.user_id, 'name', p.name, 'admin_level', p.admin_level,
                            'active', p.admin_active, 'mfa_ok', public.admin_mfa_ok())
  from public.profiles p where p.user_id = auth.uid() and p.role = 'admin' and p.deleted_at is null
$$;

-- A-05: vendor list with masked phone (full phone only on the vendor's own record).
create or replace function public.admin_vendors(p_status public.vendor_status default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'id', v.user_id, 'display_name', v.display_name, 'owner_name', p.name, 'status', v.status,
      'phone_masked', case when u.phone is null then null else '+91 ••••• •' || right(u.phone, 4) end,
      'vehicle', v.vehicle, 'code', v.code, 'created_at', v.created_at,
      'stops', (select count(*) from public.stops s where s.vendor_id = v.user_id and s.active),
      'followers', (select count(distinct f.buyer_id) from public.follows f where f.vendor_id = v.user_id),
      'avg_rating', (select round(avg(r.stars)::numeric, 1) from public.reviews r where r.vendor_id = v.user_id and r.status = 'visible'),
      'rating_count', (select count(*) from public.reviews r where r.vendor_id = v.user_id and r.status = 'visible'),
      'last_active', (select max(e.created_at) from public.stop_events e where e.vendor_id = v.user_id)
    ) order by v.created_at desc), '[]'::jsonb)
    from public.vendors v join public.profiles p on p.user_id = v.user_id left join auth.users u on u.id = v.user_id
    where p_status is null or v.status = p_status);
end $$;

-- A-06: one vendor, full phone (admins open the vendor's own record to call him).
create or replace function public.admin_vendor(p_vendor_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return (select jsonb_build_object(
      'vendor', to_jsonb(v), 'owner_name', p.name, 'phone', case when u.phone is null then null else '+' || u.phone end,
      'stops', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'gate_id', s.gate_id, 'gate_name', g.name, 'society_name', so.name,
                  'days_of_week', s.days_of_week, 'window_start', s.window_start, 'window_end', s.window_end, 'active', s.active) order by s.window_start), '[]'::jsonb)
                from public.stops s join public.gates g on g.id = s.gate_id join public.societies so on so.id = g.society_id where s.vendor_id = v.user_id),
      'menu', public.menu_json(v.user_id, public.ist_today()),
      'reviews', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) from public.v_review_public r where r.vendor_id = v.user_id),
      'reports', (select coalesce(jsonb_agg(jsonb_build_object('id', rp.id, 'reason', rp.reason, 'text', rp.text, 'status', rp.status, 'created_at', rp.created_at) order by rp.created_at desc), '[]'::jsonb)
                  from public.reports rp where rp.vendor_id = v.user_id))
    from public.vendors v join public.profiles p on p.user_id = v.user_id left join auth.users u on u.id = v.user_id
    where v.user_id = p_vendor_id);
end $$;

-- A-03: societies with gates, vendors serving, followers and adoption %.
create or replace function public.admin_societies() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'name', s.name, 'area', s.area, 'address', s.address, 'lat', s.lat, 'lng', s.lng,
      'flats_count', s.flats_count, 'active', s.active,
      'gates', (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'lat', g.lat, 'lng', g.lng) order by g.name), '[]'::jsonb) from public.gates g where g.society_id = s.id),
      'vendors', (select count(distinct st.vendor_id) from public.stops st join public.gates g on g.id = st.gate_id where g.society_id = s.id and st.active),
      'followers', (select count(distinct f.buyer_id) from public.follows f where f.society_id = s.id),
      'adoption_pct', case when s.flats_count > 0 then round(100.0 * (select count(distinct f.buyer_id) from public.follows f where f.society_id = s.id) / s.flats_count, 1) else 0 end
    ) order by s.name), '[]'::jsonb) from public.societies s);
end $$;

-- A-08: items with usage counts; pending custom items first.
create or replace function public.admin_items() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id, 'name', i.name, 'default_unit', i.default_unit, 'image_path', i.image_path, 'approved', i.approved,
      'is_custom', i.is_custom, 'created_by_name', (select v.display_name from public.vendors v where v.user_id = i.created_by),
      'used_by', (select count(*) from public.vendor_items vi where vi.item_id = i.id)
    ) order by i.approved, i.name), '[]'::jsonb) from public.items i);
end $$;

-- A-09: moderation queue.
create or replace function public.admin_moderation() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return jsonb_build_object(
    'reports', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'vendor_id', r.vendor_id, 'vendor_name', v.display_name, 'vendor_status', v.status, 'reason', r.reason, 'text', r.text,
        'photo_path', r.photo_path, 'reporter', coalesce(split_part(p.name, ' ', 1), 'Former user'), 'created_at', r.created_at, 'status', r.status
      ) order by r.created_at desc), '[]'::jsonb)
      from public.reports r join public.vendors v on v.user_id = r.vendor_id join public.profiles p on p.user_id = r.reporter_id
      where r.status = 'open'),
    'flags', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', f.id, 'review_id', f.review_id, 'vendor_name', v.display_name, 'reason', f.reason, 'created_at', f.created_at,
        'stars', rv.stars, 'text', rv.text, 'reviewer', coalesce(split_part(p.name, ' ', 1), 'Former user')
      ) order by f.created_at desc), '[]'::jsonb)
      from public.review_flags f join public.reviews rv on rv.id = f.review_id join public.vendors v on v.user_id = f.vendor_id
      join public.profiles p on p.user_id = rv.buyer_id
      where f.status = 'open'));
end $$;

-- A-10: team (owner only).
create or replace function public.admin_team() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin(true);
  return (select coalesce(jsonb_agg(jsonb_build_object('user_id', p.user_id, 'name', p.name, 'email', u.email,
            'admin_level', p.admin_level, 'active', p.admin_active, 'created_at', p.created_at) order by p.created_at), '[]'::jsonb)
          from public.profiles p join auth.users u on u.id = p.user_id where p.role = 'admin');
end $$;

create or replace function public.set_admin_active(p_user_id uuid, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin(true);
  if p_user_id = auth.uid() then raise exception 'cannot_change_self'; end if;
  update public.profiles set admin_active = p_active where user_id = p_user_id and role = 'admin';
  if not found then raise exception 'not_found'; end if;
end $$;

create or replace function public.set_admin_level(p_user_id uuid, p_level public.admin_level) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin(true);
  if p_user_id = auth.uid() then raise exception 'cannot_change_self'; end if;
  update public.profiles set admin_level = p_level where user_id = p_user_id and role = 'admin';
  if not found then raise exception 'not_found'; end if;
end $$;

-- Used by the admin-invite edge function (service role) after inviting by email.
create or replace function public.make_admin(p_user_id uuid, p_level public.admin_level, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set role = 'admin', admin_level = p_level, name = coalesce(nullif(trim(p_name), ''), name), admin_active = true
   where user_id = p_user_id;
end $$;
revoke execute on function public.make_admin(uuid, public.admin_level, text) from public, anon, authenticated;
grant execute on function public.make_admin(uuid, public.admin_level, text) to service_role;

-- "Warn vendor" from the moderation queue: resolves the report with a note.
create or replace function public.warn_vendor(p_report_id uuid, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin();
  update public.reports set status = 'actioned', resolution_note = coalesce(nullif(trim(p_note), ''), 'Vendor warned') where id = p_report_id;
  if not found then raise exception 'report_not_found'; end if;
end $$;

-- A-11 settings writes go through RLS (owner only); this exposes the private MFA switch too.
create or replace function public.set_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_admin(true);
  insert into public.app_settings (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

revoke execute on function public.admin_me(), public.admin_vendors(public.vendor_status), public.admin_vendor(uuid), public.admin_societies(),
  public.admin_items(), public.admin_moderation(), public.admin_team(), public.set_admin_active(uuid, boolean),
  public.set_admin_level(uuid, public.admin_level), public.warn_vendor(uuid, text), public.set_setting(text, jsonb), public.admin_mfa_ok() from anon;
