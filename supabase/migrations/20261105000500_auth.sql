-- M2: auth and accounts (AUTH-1 … AUTH-6).

-- ---------------------------------------------------------------- OTP attempt tracking (AUTH-2)
-- Phone in E.164 without '+', as GoTrue stores it. Not readable by any app user.
create table public.otp_attempts (
  phone text primary key,
  failures int not null default 0,
  first_failure_at timestamptz,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.otp_attempts enable row level security;
revoke all on public.otp_attempts from anon, authenticated;

create or replace function public.setting_int(p_key text, p_default int) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = p_key), p_default)
$$;

create or replace function public.normalize_phone(p_phone text) returns text
language sql immutable as $$ select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') $$;

-- Returns null when allowed, or the time the block ends.
create or replace function public.otp_blocked_until(p_phone text) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select blocked_until from public.otp_attempts
   where phone = public.normalize_phone(p_phone) and blocked_until > now()
$$;

create or replace function public.otp_record_failure(p_phone text) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_phone text := public.normalize_phone(p_phone);
  v_max int := public.setting_int('otp_max_failures', 5);
  v_block int := public.setting_int('otp_block_minutes', 60);
  v_row public.otp_attempts;
begin
  insert into public.otp_attempts (phone, failures, first_failure_at)
  values (v_phone, 1, now())
  on conflict (phone) do update
    set failures = case when public.otp_attempts.blocked_until is not null and public.otp_attempts.blocked_until <= now()
                        then 1 else public.otp_attempts.failures + 1 end,
        first_failure_at = case when public.otp_attempts.blocked_until is not null and public.otp_attempts.blocked_until <= now()
                        then now() else coalesce(public.otp_attempts.first_failure_at, now()) end,
        blocked_until = case when public.otp_attempts.blocked_until <= now() then null else public.otp_attempts.blocked_until end,
        updated_at = now()
  returning * into v_row;
  if v_row.failures >= v_max and v_row.blocked_until is null then
    update public.otp_attempts set blocked_until = now() + make_interval(mins => v_block) where phone = v_phone
    returning blocked_until into v_row.blocked_until;
  end if;
  return v_row.blocked_until;
end $$;

create or replace function public.otp_record_success(p_phone text) returns void
language sql security definer set search_path = '' as $$
  delete from public.otp_attempts where phone = public.normalize_phone(p_phone)
$$;

revoke execute on function public.otp_blocked_until(text), public.otp_record_failure(text), public.otp_record_success(text)
  from public, anon, authenticated;
grant execute on function public.otp_blocked_until(text), public.otp_record_failure(text), public.otp_record_success(text)
  to service_role;

-- ---------------------------------------------------------------- Send SMS hook (local / pg variant)
-- Production uses the HTTP hook → edge function send-sms-hook → MSG91. Locally this Postgres hook only
-- refuses blocked numbers; test numbers in config.toml never need a real SMS.
create or replace function public.hook_send_sms(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_until timestamptz := public.otp_blocked_until(event #>> '{user,phone}');
begin
  if v_until is not null then
    return jsonb_build_object('error', jsonb_build_object('http_code', 429,
      'message', 'otp_blocked:' || to_char(v_until at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')));
  end if;
  return '{}'::jsonb;
end $$;
revoke execute on function public.hook_send_sms(jsonb) from public, anon, authenticated;
grant execute on function public.hook_send_sms(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.otp_attempts to supabase_auth_admin;
grant execute on function public.otp_blocked_until(text), public.normalize_phone(text) to supabase_auth_admin;

-- Lets the app show "Try again in 59 min" before asking for an OTP (S-03 too-many-attempts state).
-- Only reveals whether a number is blocked, never anything else.
create or replace function public.otp_status(p_phone text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('blocked_until', public.otp_blocked_until(p_phone))
$$;
grant execute on function public.otp_status(text) to anon, authenticated;

-- ---------------------------------------------------------------- profile completion
create or replace function public.complete_profile(p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_name is null or char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 60 then
    raise exception 'invalid_name';
  end if;
  update public.profiles set name = trim(p_name) where user_id = auth.uid() and deleted_at is null;
end $$;

create or replace function public.save_push_token(p_token text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  -- A device belongs to one account at a time.
  update public.profiles set push_token = null where push_token = p_token and user_id <> auth.uid();
  update public.profiles set push_token = p_token where user_id = auth.uid();
end $$;

-- Is there a verified email login for this address? (S-05 "email not linked to any account")
create or replace function public.email_login_available(p_email text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u join public.profiles p on p.user_id = u.id
                  where lower(u.email) = lower(trim(p_email)) and u.email_confirmed_at is not null
                    and p.deleted_at is null and u.phone is not null)
$$;
grant execute on function public.email_login_available(text) to anon, authenticated;

-- My account summary for S-10 (masked phone, email state, role)
create or replace function public.my_account() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'user_id', p.user_id, 'role', p.role, 'name', p.name,
    'phone_last4', right(u.phone, 4),
    'email', u.email, 'email_verified', u.email_confirmed_at is not null,
    'pending_email', nullif(u.email_change, ''),
    'admin_level', p.admin_level, 'created_at', p.created_at)
  from public.profiles p join auth.users u on u.id = p.user_id
  where p.user_id = auth.uid()
$$;

-- ---------------------------------------------------------------- account deletion (AUTH-6)
-- Soft delete: scrub personal data, free the phone number, keep reviews (shown as "Former user").
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  update public.profiles set deleted_at = now(), name = null, email = null, email_verified = false, push_token = null
   where user_id = v_uid;
  delete from public.follows where buyer_id = v_uid;
  delete from public.buyer_societies where buyer_id = v_uid;
  delete from public.waitlist where user_id = v_uid;
  update public.requests set status = 'cancelled' where buyer_id = v_uid and status = 'open';
  update public.vendors set status = 'suspended', status_reason = 'account_deleted', allow_calls = false,
         vehicle_no = null, pmc_vendor_id = null, pmc_doc_path = null
   where user_id = v_uid;
  update public.stops set active = false where vendor_id = v_uid;
  delete from public.notifications where user_id = v_uid;
  update auth.users set phone = null, email = null, email_change = '', phone_change = '',
         raw_user_meta_data = '{}'::jsonb, banned_until = 'infinity'
   where id = v_uid;
  delete from auth.identities where user_id = v_uid;
  delete from auth.sessions where user_id = v_uid;
  delete from auth.refresh_tokens where user_id = v_uid::text;
end $$;

-- Deleted accounts no longer count for auth_role-based checks (already filtered by deleted_at in helpers).

revoke execute on function public.complete_profile(text), public.save_push_token(text), public.my_account(),
  public.delete_my_account() from anon;
