-- Google sign-in (Supabase OAuth) replaces phone OTP until DLT registration is done.
-- The mobile number is collected during profile building WITHOUT SMS verification, kept in its own
-- table that only the owner (through RPCs) and admins can read. Phone OTP code paths stay in place.

create table public.profile_phones (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  phone text not null check (phone ~ '^\+91[6-9][0-9]{9}$'),
  verified boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.profile_phones enable row level security;
-- No direct access for app users: the number is written and read only through the functions below.
revoke all on public.profile_phones from anon, authenticated;
create policy profile_phones_admin_select on public.profile_phones for select to authenticated using (public.is_admin());

-- A user's mobile number: verified auth phone (OTP, future) first, else the number given in the profile.
create or replace function public.user_phone(p_user_id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select '+' || u.phone from auth.users u where u.id = p_user_id and u.phone is not null and u.phone <> ''),
    (select pp.phone from public.profile_phones pp where pp.user_id = p_user_id))
$$;
revoke execute on function public.user_phone(uuid) from public, anon, authenticated;

create or replace function public.set_my_phone(p_phone text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_phone text := '+91' || right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if v_phone !~ '^\+91[6-9][0-9]{9}$' then raise exception 'invalid_phone'; end if;
  insert into public.profile_phones (user_id, phone) values (auth.uid(), v_phone)
  on conflict (user_id) do update set phone = excluded.phone, verified = false, updated_at = now();
end $$;
revoke execute on function public.set_my_phone(text) from anon;

-- Profile building (S-07): name + mobile number in one step.
create or replace function public.complete_profile_with_phone(p_name text, p_phone text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.complete_profile(p_name);
  perform public.set_my_phone(p_phone);
end $$;
revoke execute on function public.complete_profile_with_phone(text, text) from anon;

-- Prefill the name from Google (full_name / name) on sign-up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := nullif(left(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), 60), '');
begin
  insert into public.profiles (user_id, email, email_verified, name)
  values (new.id, new.email, new.email_confirmed_at is not null, case when char_length(coalesce(v_name, '')) >= 2 then v_name end)
  on conflict (user_id) do nothing;
  return new;
end $$;

-- S-10 summary now also reports whether a mobile number is on file.
create or replace function public.my_account() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'user_id', p.user_id, 'role', p.role, 'name', p.name,
    'phone_last4', right(public.user_phone(p.user_id), 4),
    'has_phone', public.user_phone(p.user_id) is not null,
    'email', u.email, 'email_verified', u.email_confirmed_at is not null,
    'pending_email', nullif(u.email_change, ''),
    'provider', coalesce(u.raw_app_meta_data->>'provider', 'phone'),
    'admin_level', p.admin_level, 'created_at', p.created_at)
  from public.profiles p join auth.users u on u.id = p.user_id
  where p.user_id = auth.uid()
$$;

-- Call button keeps working for vendors who signed in with Google (VEN-1 allow_calls).
create or replace function public.get_vendor_phone(p_vendor_id uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.vendors v where v.user_id = p_vendor_id and v.allow_calls and v.status = 'verified') then
    return null;
  end if;
  return public.user_phone(p_vendor_id);
end $$;
revoke execute on function public.get_vendor_phone(uuid) from anon;

-- Admin vendor list / detail read the same number (masked in the list).
create or replace function public.admin_vendors(p_status public.vendor_status default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'id', v.user_id, 'display_name', v.display_name, 'owner_name', p.name, 'status', v.status,
      'phone_masked', case when public.user_phone(v.user_id) is null then null else '+91 ••••• •' || right(public.user_phone(v.user_id), 4) end,
      'vehicle', v.vehicle, 'code', v.code, 'created_at', v.created_at,
      'stops', (select count(*) from public.stops s where s.vendor_id = v.user_id and s.active),
      'followers', (select count(distinct f.buyer_id) from public.follows f where f.vendor_id = v.user_id),
      'avg_rating', (select round(avg(r.stars)::numeric, 1) from public.reviews r where r.vendor_id = v.user_id and r.status = 'visible'),
      'rating_count', (select count(*) from public.reviews r where r.vendor_id = v.user_id and r.status = 'visible'),
      'last_active', (select max(e.created_at) from public.stop_events e where e.vendor_id = v.user_id)
    ) order by v.created_at desc), '[]'::jsonb)
    from public.vendors v join public.profiles p on p.user_id = v.user_id
    where p_status is null or v.status = p_status);
end $$;

create or replace function public.admin_vendor(p_vendor_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return (select jsonb_build_object(
      'vendor', to_jsonb(v), 'owner_name', p.name, 'phone', public.user_phone(v.user_id),
      'phone_verified', exists (select 1 from auth.users u where u.id = v.user_id and u.phone is not null and u.phone <> ''),
      'stops', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'gate_id', s.gate_id, 'gate_name', g.name, 'society_name', so.name,
                  'days_of_week', s.days_of_week, 'window_start', s.window_start, 'window_end', s.window_end, 'active', s.active) order by s.window_start), '[]'::jsonb)
                from public.stops s join public.gates g on g.id = s.gate_id join public.societies so on so.id = g.society_id where s.vendor_id = v.user_id),
      'menu', public.menu_json(v.user_id, public.ist_today()),
      'reviews', (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) from public.v_review_public r where r.vendor_id = v.user_id),
      'reports', (select coalesce(jsonb_agg(jsonb_build_object('id', rp.id, 'reason', rp.reason, 'text', rp.text, 'status', rp.status, 'created_at', rp.created_at) order by rp.created_at desc), '[]'::jsonb)
                  from public.reports rp where rp.vendor_id = v.user_id))
    from public.vendors v join public.profiles p on p.user_id = v.user_id
    where v.user_id = p_vendor_id);
end $$;

-- Account deletion also removes the profile number.
create or replace function public.delete_profile_phone_on_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    delete from public.profile_phones where user_id = new.user_id;
  end if;
  return new;
end $$;
create trigger profiles_delete_phone after update of deleted_at on public.profiles
for each row execute function public.delete_profile_phone_on_delete();
