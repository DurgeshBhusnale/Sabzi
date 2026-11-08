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


select plan(12);
\set g '''bbbbbbbb-0000-4000-8000-000000000001'''
\set g2 '''bbbbbbbb-0000-4000-8000-000000000002'''

-- A Google sign-up: email + full_name, no phone
insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values (:g, 'authenticated', 'authenticated', 'riya@example.com', now(), '{"provider":"google","providers":["google"]}', '{"full_name":"Riya Patil"}'),
       (:g2, 'authenticated', 'authenticated', 'kiran@example.com', now(), '{"provider":"google","providers":["google"]}', '{"name":"Kiran"}');

select is((select name from profiles where user_id = :g), 'Riya Patil', 'Google full_name prefills the profile name');
select tests.login(:g);
select is((my_account())->>'has_phone', 'false', 'no mobile number yet');
select is((my_account())->>'provider', 'google', 'provider is google');
select throws_ok($$ select set_my_phone('12345') $$, 'P0001', 'invalid_phone', 'invalid numbers are refused');
select lives_ok($$ select set_role('vendor') $$, 'Google user picks a role');
select lives_ok($$ select complete_profile_with_phone('Riya Patil', '+91 98765 43210') $$, 'profile building saves name and number');
select is((my_account())->>'phone_last4', '3210', 'my account shows the last 4 digits');
select throws_ok($$ select * from profile_phones $$, '42501', null, 'the phone table is not readable directly');
select tests.login(:g2);
select is((my_account())->>'has_phone', 'false', 'another user does not see Riya''s number');
select tests.logout();

-- Vendor who signed in with Google: Call uses the profile number only when calls are allowed
insert into vendors (user_id, display_name, vehicle, status, allow_calls) values (:g, 'Riya Fresh', 'thela', 'verified', true);
select tests.login('20000000-0000-4000-8000-000000000001');
select is(get_vendor_phone(:g), '+919876543210', 'Call button gets the profile number when calls are on');
select tests.logout();
update vendors set allow_calls = false where user_id = :g;
select tests.login('20000000-0000-4000-8000-000000000001');
select is(get_vendor_phone(:g), null, 'no number when calls are off');
select tests.logout();
update profiles set deleted_at = now() where user_id = :g;
select is((select count(*)::int from profile_phones where user_id = :g), 0, 'deleting the account removes the number');

select * from finish();
rollback;
