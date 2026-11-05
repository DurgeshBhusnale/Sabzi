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


select plan(6);
select tests.anon();
select is((public_vendor_card('RMSH4K7P'))->>'display_name', 'Ramesh Sabzi', 'anyone can read the sticker card');
select ok(position('99999' in public_vendor_card('RMSH4K7P')::text) = 0, 'the public card has no phone number');
select is(public_vendor_card('GNSH9B5W'), null, 'unverified vendor has no public card');
select is(jsonb_array_length((public_society_card('40000000-0000-4000-8000-000000000001'))->'vendors'), 2, 'society poster lists its verified vendors');
select lives_ok($$ select record_qr_scan('RMSH4K7P', 'web') $$, 'web scans are recorded');
select throws_ok($$ select * from qr_scans $$, '42501', null, 'scans are not readable by the public');
select * from finish();
rollback;
