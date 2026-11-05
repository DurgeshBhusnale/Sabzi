-- RLS: allowed and denied cases per role for every table (BUILD_PLAN M1).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

create schema tests;
create function tests.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
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

\set priya '''20000000-0000-4000-8000-000000000001'''
\set meera '''20000000-0000-4000-8000-000000000003'''
\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set sunita '''10000000-0000-4000-8000-000000000002'''
\set ganesh '''10000000-0000-4000-8000-000000000004'''
\set greenpark '''40000000-0000-4000-8000-000000000001'''

select tests.login(:priya);
select is(jsonb_array_length(buyer_home(:greenpark)), 2, 'home lists Ramesh and Imran at Green Park');
select is((buyer_home(:greenpark)->0->'menu'->'items'->0->>'name'), 'Tomato', 'home carries today''s menu items');
select is(jsonb_array_length(buyer_home('40000000-0000-4000-8000-000000000004')), 0, 'unverified Ganesh is not on Nandanvan home');
select is((vendor_page(:ganesh))->>'available', 'false', 'unverified vendor page is unavailable');
select is((vendor_page(:ramesh, :greenpark))->'today'->>'status', 'expected', 'vendor page shows status at my society');
select ok(position('9999900001' in vendor_page(:ramesh)::text) = 0, 'vendor page never includes the phone number');
select ok(position('9999900002' in vendor_page(:sunita)::text) = 0, 'vendor page has no phone when calls are off');
select is(get_vendor_phone(:sunita), null, 'call is unavailable when allow_calls is off');
select is(vendor_by_code('rmsh4k7p'), :ramesh::uuid, 'QR code resolves, case-insensitive');
select is(vendor_by_code('GNSH9B5W'), null, 'QR of an unverified vendor does not resolve');
select is(jsonb_array_length(my_following()), 2, 'following tab lists my follows');
select lives_ok($$ select save_society('40000000-0000-4000-8000-000000000002') $$, 'buyer saves another society');

select * from finish();
rollback;
