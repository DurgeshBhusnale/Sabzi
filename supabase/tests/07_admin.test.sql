-- RLS: allowed and denied cases per role for every table (BUILD_PLAN M1).
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


create function tests.login_aal1(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
grant execute on function tests.login_aal1(uuid) to authenticated;

select plan(13);
\set owner '''30000000-0000-4000-8000-000000000001'''
\set field '''30000000-0000-4000-8000-000000000002'''
\set ganesh '''10000000-0000-4000-8000-000000000004'''
\set priya '''20000000-0000-4000-8000-000000000001'''

-- 2-step login is required for admin rights
select tests.login_aal1(:owner);
select is(is_admin(), false, 'password-only session is not admin');
select is((select count(*)::int from profiles), 1, 'without MFA the admin sees only own profile');
select is((admin_me())->>'mfa_ok', 'false', 'admin_me tells the panel MFA is pending');

-- field staff limits (ADM-8)
select tests.login(:field);
select ok(is_admin(), 'field staff with MFA is admin');
select throws_ok($$ select admin_team() $$, 'P0001', 'owner_only', 'field staff cannot open Team');
select throws_ok($$ select set_setting('maintenance', '{"enabled":true}') $$, 'P0001', 'owner_only', 'field staff cannot change Settings');
select ok(jsonb_array_length(admin_vendors()) = 4, 'field staff lists vendors');
select is((select v->>'phone_masked' from jsonb_array_elements(admin_vendors()) v where v->>'display_name' = 'Ramesh Sabzi'), '+91 ••••• •0001', 'list shows masked phones');
select is((admin_vendor('10000000-0000-4000-8000-000000000001'))->>'phone', '+919999900001', 'vendor record shows the full phone');

-- verify → visible to buyers (ADM-2)
select lives_ok($$ select verify_vendor('10000000-0000-4000-8000-000000000004') $$, 'field staff verifies Ganesh');
select tests.login(:priya);
select is((select count(*)::int from v_vendor_public where id = :ganesh), 1, 'verified vendor is visible to buyers');

select tests.login(:owner);
select ok(jsonb_array_length(admin_team()) = 2, 'owner opens Team');
select lives_ok($$ select set_setting('latest_app_version', '"0.2.0"') $$, 'owner changes settings');

select * from finish();
rollback;
