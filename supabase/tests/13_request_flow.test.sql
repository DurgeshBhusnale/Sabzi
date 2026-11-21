-- Request flow v2 (DECISIONS 2026-11-21): slots, cutoffs, vendor price, buyer confirmation.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

create schema tests;
create function tests.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function tests.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;
grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;
-- Priya's tomato-type request (item 13) on Ramesh's Green Park visit tomorrow morning (from seed.sql)
create function tests.q() returns uuid language sql security definer set search_path = '' as $$
  select id from public.requests where buyer_id = '20000000-0000-4000-8000-000000000001' and item_id = '70000000-0000-4000-8000-000000000013'
$$;
grant execute on function tests.q() to authenticated;

select plan(17);
\set priya '''20000000-0000-4000-8000-000000000001'''
\set arjun '''20000000-0000-4000-8000-000000000002'''
\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set gp '''40000000-0000-4000-8000-000000000001'''
\set stop1 '''60000000-0000-4000-8000-000000000001'''
\set item13 '''70000000-0000-4000-8000-000000000013'''

-- ---------------------------------------------------------------- cutoffs
select is(request_cutoff('2026-11-22', '08:00'), '2026-11-21 17:00:00+00'::timestamptz, 'morning visit: closes 10:30 PM IST the night before');
select is(request_cutoff('2026-11-22', '18:00'), '2026-11-22 07:30:00+00'::timestamptz, 'evening visit: closes 5 hours before (1:00 PM IST)');

-- ---------------------------------------------------------------- slots
select tests.login(:priya);
select ok(jsonb_array_length(request_slots(:ramesh, :gp)) between 1 and 3, 'next 1–3 visits to the society');
select ok((select bool_and((e->>'cutoff_at')::timestamptz > now()) from jsonb_array_elements(request_slots(:ramesh, :gp)) e), 'only visits still open for requests');
select is((request_slots(:ramesh, :gp)->0->>'stop_id')::uuid, :stop1::uuid, 'Green Park slot is Ramesh''s Gate 1 stop');
select is(jsonb_array_length(request_slots('10000000-0000-4000-8000-000000000002', :gp)), 0, 'a vendor who does not visit the society has no slots');
select lives_ok($$ select create_request('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', null, '1 kg', null) $$, 'no slot given: uses the next open visit');
select throws_ok($$ select create_request('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', null, null, null, '60000000-0000-4000-8000-000000000001', '2020-01-01') $$, 'P0001', 'slot_closed', 'a closed or unknown visit is refused');

-- ---------------------------------------------------------------- vendor accepts with a price
select tests.login(:ramesh);
select throws_ok(format($$ select answer_request(%L, 'will_bring', public.ist_today() + 1, %L) $$, :item13, :stop1), 'P0001', 'invalid_price', 'accepting needs a price');
select is(answer_request(:item13, 'will_bring', ist_today() + 1, :stop1, 45), 1, 'accept applies to that item on that visit only');

select tests.login(:priya);
select is((select r->>'status' from jsonb_array_elements(my_requests()) r where (r->>'id')::uuid = tests.q()), 'will_bring', 'buyer sees the quote');
select is((select (r->>'quoted_price')::numeric from jsonb_array_elements(my_requests()) r where (r->>'id')::uuid = tests.q()), 45::numeric, 'with the price');

-- ---------------------------------------------------------------- buyer confirms
select tests.login(:arjun);
select throws_ok(format($$ select respond_to_quote(%L, true) $$, tests.q()), 'P0001', 'request_not_found', 'another buyer cannot answer the quote');
select tests.login(:priya);
select lives_ok(format($$ select respond_to_quote(%L, true) $$, tests.q()), 'buyer confirms the order');
select tests.logout();
select is((select status::text from requests where id = tests.q()), 'accepted', 'status accepted — no second vendor confirmation');

-- ---------------------------------------------------------------- vendor backs out after confirmation
select tests.login(:ramesh);
select is(answer_request(:item13, 'cant_bring', ist_today() + 1, :stop1), 1, 'vendor denies after confirmation');
select tests.logout();
select is((select status::text from requests where id = tests.q()), 'vendor_cancelled', 'confirmed order becomes vendor_cancelled');

select * from finish();
rollback;
