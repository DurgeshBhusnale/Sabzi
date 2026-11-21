-- Request flow v2, last step: vendor marks Delivered / Not delivered; buyer "I didn't get it".
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
create function tests.q(p_item text) returns uuid language sql security definer set search_path = '' as $$
  select id from public.requests where buyer_id = '20000000-0000-4000-8000-000000000001' and item_id = p_item::uuid
$$;
grant execute on function tests.q(text) to authenticated;

select plan(16);
\set priya '''20000000-0000-4000-8000-000000000001'''
\set arjun '''20000000-0000-4000-8000-000000000002'''
\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set i13 '''70000000-0000-4000-8000-000000000013'''
\set i14 '''70000000-0000-4000-8000-000000000014'''

-- Priya's two items on Ramesh's visit: confirmed at ₹45, and the visit is happening now.
update requests set status = 'accepted', quoted_price = 45, quoted_unit = 'kg',
       slot_start = now() - interval '30 minutes', slot_end = now() + interval '15 minutes'
 where buyer_id = :priya and vendor_id = :ramesh;
-- Arjun's order is for a visit three days ago: past the delivery window.
update requests set status = 'accepted', quoted_price = 45, slot_start = now() - interval '3 days', slot_end = now() - interval '3 days' + interval '45 minutes'
 where buyer_id = :arjun and vendor_id = :ramesh;

select is(delivery_deadline('2026-11-22 02:30:00+00'), '2026-11-23 18:30:00+00'::timestamptz, 'window ends at midnight IST after the next day');

select tests.login(:ramesh);
select throws_ok(format($$ select mark_delivery(array[%L]::uuid[], 'not_delivered') $$, tests.q(:i13)), 'P0001', 'reason_required', 'not delivered needs a reason');
select is(mark_delivery(array[tests.q(:i13), tests.q(:i14)], 'delivered'), 2, 'one tap marks the whole order (both items)');
select is(mark_delivery(array[tests.q(:i14)], 'not_delivered', 'buyer_not_there'), 1, 'vendor can change a mark');
select is(mark_delivery(array[tests.q(:i14)], 'reset'), 1, 'undo puts it back to confirmed');
select is((select count(*)::int from v_vendor_requests where status = 'delivered'), 1, 'vendor view shows the delivered row');
select ok((select count(distinct buyer_ref) from v_vendor_requests where buyer_first_name = 'Priya') = 1, 'buyer_ref groups one buyer''s items');
select hasnt_column('public', 'v_vendor_requests', 'buyer_id', 'still no buyer id in the vendor view');
select throws_ok($$ select mark_delivery((select array_agg(id) from v_vendor_requests where buyer_first_name = 'Arjun'), 'delivered') $$, 'P0001', 'delivery_window_closed', 'too late after the next day');

select tests.login(:arjun);
select throws_ok(format($$ select mark_delivery(array[%L]::uuid[], 'delivered') $$, tests.q(:i13)), 'P0001', 'wrong_role', 'a buyer cannot mark delivery');
select is((select r->>'status' from jsonb_array_elements(my_requests()) r limit 1), 'not_recorded', 'unmarked after the window reads "not recorded"');

-- ---------------------------------------------------------------- buyer: I didn't get it
select tests.login(:priya);
select is((select r->>'status' from jsonb_array_elements(my_requests()) r where (r->>'id')::uuid = tests.q(:i13)), 'delivered', 'buyer sees Delivered');
select lives_ok(format($$ select report_not_received(%L) $$, tests.q(:i13)), 'buyer reports not received');
select throws_ok(format($$ select report_not_received(%L) $$, tests.q(:i13)), 'P0001', 'dispute_closed', 'only once');
select throws_ok(format($$ select report_not_received(%L) $$, tests.q(:i14)), 'P0001', 'dispute_closed', 'only for delivered orders');
select tests.logout();
select is((select count(*)::int from reports where reporter_id = :priya and vendor_id = :ramesh and text like 'Request marked delivered but not received:%'), 1, 'files a report for the admin queue');

select * from finish();
rollback;
