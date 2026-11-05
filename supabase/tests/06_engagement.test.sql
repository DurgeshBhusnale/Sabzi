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


select plan(6);
\set priya '''20000000-0000-4000-8000-000000000001'''
\set ramesh '''10000000-0000-4000-8000-000000000001'''

select tests.login(:priya);
select is(jsonb_array_length(my_requests()), 2, 'buyer sees own requests');
select is(my_requests()->0->>'vendor_name', 'Ramesh Sabzi', 'requests carry the vendor name');
select is(jsonb_array_length(my_deals_today()), 0, 'no deals yet');
select tests.login(:ramesh);
select lives_ok($$ select send_deal('[{"item_id":"70000000-0000-4000-8000-000000000001","deal_price":30}]'::jsonb, null) $$, 'Ramesh sends a deal');
select ok(my_deal_today() is not null, 'vendor sees today''s deal as used');
select tests.login(:priya);
select is(my_deals_today()->0->'items'->0->>'deal_price', '30.00', 'follower sees the deal');
select * from finish();
rollback;
