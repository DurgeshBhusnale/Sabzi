-- Audit fixes SEC-08 (function grants), SEC-15 (table/view grants), SEC-10 (re-verify on detail changes).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

create schema tests;
create function tests.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function tests.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end $$;
create function tests.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;
grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set admin '''30000000-0000-4000-8000-000000000001'''

select plan(16);

-- ================= SEC-08: anon runs only the public functions
select ok(not has_function_privilege('anon', 'public.setting_int(text, int)', 'execute'), 'anon cannot read settings through setting_int');
select ok(not has_function_privilege('anon', 'public.email_login_available(text)', 'execute'), 'anon cannot probe emails');
select ok(not has_function_privilege('anon', 'public.vendor_page(uuid, uuid)', 'execute'), 'anon cannot call vendor_page');
select ok(not has_function_privilege('anon', 'public.follower_count(uuid, uuid)', 'execute'), 'anon cannot call follower_count');
select ok(has_function_privilege('anon', 'public.public_vendor_card(text)', 'execute'), 'anon can read the QR vendor card');
select ok(has_function_privilege('anon', 'public.record_qr_scan(text, text)', 'execute'), 'anon can record a web scan');
select ok(has_function_privilege('authenticated', 'public.buyer_home(uuid)', 'execute'), 'signed-in users keep their RPCs');
select ok(not has_function_privilege('authenticated', 'public.setting_int(text, int)', 'execute'), 'setting_int is internal only');
select ok(not has_function_privilege('authenticated', 'public.user_phone(uuid)', 'execute'), 'user_phone stays private');
select ok(has_function_privilege('service_role', 'public.notify_context(text, uuid)', 'execute'), 'the notify function keeps notify_context');
select tests.anon();
select ok((select count(*) from app_settings) > 0, 'anon still reads public app settings');
select tests.logout();

-- ================= SEC-15
select ok(not has_table_privilege('authenticated', 'public.profiles', 'truncate'), 'no truncate for app users');
select ok(not has_table_privilege('authenticated', 'public.v_vendor_public', 'insert'), 'no writes on public views');

-- ================= SEC-10
select tests.login(:ramesh);
update vendors set photo_path = '10000000-0000-4000-8000-000000000001/new.jpg' where user_id = :ramesh;
select is((select status::text from vendors where user_id = :ramesh), 'verified', 'a new photo keeps the vendor verified');
update vendors set display_name = 'Ramesh Fresh' where user_id = :ramesh;
select is((select status::text || '/' || status_reason from vendors where user_id = :ramesh), 'pending/details_changed', 'a new shop name goes back for checking');
select tests.logout();
update vendors set status = 'verified', status_reason = null where user_id = :ramesh;
select tests.login(:admin);
update vendors set display_name = 'Ramesh Sabzi' where user_id = :ramesh;
select is((select status::text from vendors where user_id = :ramesh), 'verified', 'admin edits do not trigger re-verification');
select tests.logout();

select * from finish();
rollback;
