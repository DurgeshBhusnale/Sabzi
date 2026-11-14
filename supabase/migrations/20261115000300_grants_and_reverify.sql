-- Audit fixes SEC-08 (anon could execute every function), SEC-15 (broad default grants),
-- SEC-10 (verified vendor could change name / PMC details without re-verification).

-- ---------------------------------------------------------------- SEC-08
-- Postgres grants EXECUTE on new functions to PUBLIC, so earlier `revoke ... from anon` lines had no effect:
-- anon still inherited it from PUBLIC. Revoke PUBLIC, but first give every real role an explicit grant for exactly
-- what it can run today, so the app, edge functions and the auth hook keep working unchanged.
do $$
declare
  f record;
  r text;
begin
  for f in
    select p.oid, p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
  loop
    foreach r in array array['authenticated', 'service_role', 'supabase_auth_admin'] loop
      if exists (select 1 from pg_roles where rolname = r) and has_function_privilege(r, f.oid, 'execute') then
        execute format('grant execute on function %s to %I', f.sig, r);
      end if;
    end loop;
    execute format('revoke execute on function %s from public, anon', f.sig);
  end loop;
end $$;

-- What a logged-out caller really needs: QR web pages, the phone-OTP block check (phone sign-in, off for now),
-- the date helpers, and is_owner() because the app_settings policy evaluates it for anon.
grant execute on function public.public_vendor_card(text), public.public_society_card(uuid), public.record_qr_scan(text, text),
  public.otp_status(text), public.is_owner(), public.ist_now(), public.ist_today(), public.ist_dow() to anon;

-- Internal helper: read any setting (public or not) as an int. Only other definer functions call it.
revoke execute on function public.setting_int(text, int) from authenticated;

-- Future functions are not executable by PUBLIC/anon unless granted.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;

-- ---------------------------------------------------------------- SEC-15
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on public.v_vendor_public, public.v_review_public, public.v_vendor_requests from anon, authenticated;

-- ---------------------------------------------------------------- SEC-10
-- A verified vendor who changes the shop name or PMC details goes back to "pending" until an admin checks again.
-- Photo and vehicle changes stay live (docs/DECISIONS.md 2026-11-15). Admin edits and status changes are not affected.
create or replace function public.vendor_details_reverify() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'verified' and new.status = 'verified' and not public.is_admin()
     and (new.display_name is distinct from old.display_name
          or new.pmc_vendor_id is distinct from old.pmc_vendor_id
          or new.pmc_doc_path is distinct from old.pmc_doc_path) then
    new.status := 'pending';
    new.status_reason := 'details_changed';
    new.verified_seen_at := null;
  end if;
  return new;
end $$;
revoke execute on function public.vendor_details_reverify() from public, anon, authenticated;

create trigger vendors_details_reverify before update on public.vendors
for each row execute function public.vendor_details_reverify();
