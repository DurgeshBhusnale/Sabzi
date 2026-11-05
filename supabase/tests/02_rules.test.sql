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


select plan(42);

\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set sunita '''10000000-0000-4000-8000-000000000002'''
\set imran '''10000000-0000-4000-8000-000000000003'''
\set ganesh '''10000000-0000-4000-8000-000000000004'''
\set priya '''20000000-0000-4000-8000-000000000001'''
\set arjun '''20000000-0000-4000-8000-000000000002'''
\set meera '''20000000-0000-4000-8000-000000000003'''
\set owner '''30000000-0000-4000-8000-000000000001'''
\set field '''30000000-0000-4000-8000-000000000002'''

-- ================= arrival: one alert per stop per 2 hours (VEN-6)
select tests.login(:ramesh);
select is((vendor_arrive('50000000-0000-4000-8000-000000000001', 18.4896, 73.8216, 'aaaaaaaa-0000-4000-8000-000000000001'))->>'followers', '1', 'arrival returns follower count at that society');
select is((vendor_arrive('50000000-0000-4000-8000-000000000001', null, null, 'aaaaaaaa-0000-4000-8000-000000000001'))->>'duplicate', 'true', 'same client_id is idempotent');
select tests.logout();
select is((select count(*)::int from stop_events where client_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 1, 'duplicate send created one event');
select tests.login(:ramesh);
select throws_ok($$ select vendor_arrive('50000000-0000-4000-8000-000000000001', null, null, 'aaaaaaaa-0000-4000-8000-000000000002') $$, 'P0001', 'arrival_cooldown', 'second arrival at the same gate within 2 h is blocked');
select lives_ok($$ select vendor_arrive('50000000-0000-4000-8000-000000000003', null, null, 'aaaaaaaa-0000-4000-8000-000000000003') $$, 'arrival at a different stop is allowed');
select throws_ok($$ select vendor_arrive('50000000-0000-4000-8000-000000000004', null, null, null) $$, 'P0001', 'not_a_stop_today', 'cannot arrive at a gate that is not my stop');
select tests.logout();
update stop_events set created_at = now() - interval '2 hours 1 minute' where vendor_id = :ramesh and gate_id = '50000000-0000-4000-8000-000000000001';
select tests.login(:ramesh);
select lives_ok($$ select vendor_arrive('50000000-0000-4000-8000-000000000001', null, null, 'aaaaaaaa-0000-4000-8000-000000000004') $$, 'arrival allowed again after 2 hours');
select tests.login(:ganesh);
select throws_ok($$ select vendor_arrive('50000000-0000-4000-8000-000000000005', null, null, null) $$, 'P0001', 'vendor_not_verified', 'unverified vendor cannot send arrival alerts');
select tests.login(:priya);
select throws_ok($$ select vendor_arrive('50000000-0000-4000-8000-000000000001', null, null, null) $$, 'P0001', 'wrong_role', 'buyer cannot send arrival alerts');

-- leaving soon / left
select tests.login(:ramesh);
select lives_ok($$ select vendor_leaving_soon('50000000-0000-4000-8000-000000000001', null) $$, 'leaving soon after arrival');
select throws_ok($$ select vendor_leaving_soon('50000000-0000-4000-8000-000000000001', null) $$, 'P0001', 'already_sent', 'leaving soon only once per visit');
select lives_ok($$ select vendor_left('50000000-0000-4000-8000-000000000001', null) $$, 'left after arrival');
select throws_ok($$ select vendor_left('50000000-0000-4000-8000-000000000001', null) $$, 'P0001', 'already_left', 'cannot leave twice');
select tests.login(:priya);
select is((select status from v_vendor_today('40000000-0000-4000-8000-000000000001') where vendor_id = :ramesh), 'left', 'buyer home shows left');

-- undo within window
select tests.login(:sunita);
select lives_ok($$ select undo_stop_event(((vendor_arrive('50000000-0000-4000-8000-000000000004', null, null, null))->>'event_id')::uuid) $$, 'vendor can undo an arrival right away');
select tests.logout();
select is((select count(*)::int from stop_events where vendor_id = :sunita), 0, 'undo removed the event');

-- skip stop
select tests.login(:ramesh);
select is((skip_stop('60000000-0000-4000-8000-000000000002'))->>'followers', '1', 'skip returns followers told');
select tests.login(:arjun);
select is((select status from v_vendor_today('40000000-0000-4000-8000-000000000002') where vendor_id = :ramesh), 'not_coming', 'buyer sees not coming today');
select tests.login(:sunita);
select throws_ok($$ select skip_stop('60000000-0000-4000-8000-000000000002') $$, 'P0001', 'stop_not_found', 'vendor cannot skip another vendor''s stop');

-- ================= menu publish and sold out
select tests.login(:ramesh);
select is((publish_menu(ist_today(), '[{"item_id":"70000000-0000-4000-8000-000000000001","price":42,"unit":"kg"},{"item_id":"70000000-0000-4000-8000-000000000002","price":30,"unit":"kg"}]'::jsonb, 'bbbbbbbb-0000-4000-8000-000000000001'))->>'items', '2', 'publish replaces today''s menu');
select throws_ok($$ select publish_menu(ist_today(), '[{"item_id":"70000000-0000-4000-8000-000000000001","price":0,"unit":"kg"}]'::jsonb, null) $$, 'P0001', 'invalid_price', 'price 0 rejected');
select throws_ok($$ select publish_menu(ist_today(), '[{"item_id":"70000000-0000-4000-8000-000000000001","price":1000,"unit":"kg"}]'::jsonb, null) $$, 'P0001', 'invalid_price', 'price above 999 rejected');
select lives_ok($$ select set_sold_out('70000000-0000-4000-8000-000000000001', true, null) $$, 'mark sold out');

-- ================= deals: one per vendor per day (VEN-9)
select throws_ok($$ select send_deal('[{"item_id":"70000000-0000-4000-8000-000000000001","deal_price":30}]'::jsonb, null) $$, 'P0001', 'item_not_on_menu', 'cannot discount a sold-out item');
select throws_ok($$ select send_deal('[{"item_id":"70000000-0000-4000-8000-000000000002","deal_price":35}]'::jsonb, null) $$, 'P0001', 'deal_price_invalid', 'deal price must be lower');
select lives_ok($$ select send_deal('[{"item_id":"70000000-0000-4000-8000-000000000002","deal_price":25}]'::jsonb, 'cccccccc-0000-4000-8000-000000000001') $$, 'first deal of the day');
select lives_ok($$ select send_deal('[{"item_id":"70000000-0000-4000-8000-000000000002","deal_price":25}]'::jsonb, 'cccccccc-0000-4000-8000-000000000001') $$, 'retrying the same deal is idempotent');
select throws_ok($$ select send_deal('[{"item_id":"70000000-0000-4000-8000-000000000002","deal_price":20}]'::jsonb, null) $$, 'P0001', 'deal_limit', 'second deal on the same day blocked');

-- ================= ratings: 3-day follow rule, one per vendor (BUY-6)
select tests.login(:priya);
select throws_ok($$ select submit_review('10000000-0000-4000-8000-000000000003', 4, '{fresh}', 'Good') $$, 'P0001', 'rating_too_soon', 'cannot rate before following for 3 days');
select is(review_eligibility(:imran)->>'days_left', '2', 'eligibility shows days left');
select throws_ok($$ select submit_review('10000000-0000-4000-8000-000000000002', 4, '{}', null) $$, 'P0001', 'rating_not_following', 'cannot rate a vendor not followed');
select tests.logout();
update follows set created_at = now() - interval '3 days 1 minute' where buyer_id = :priya and vendor_id = :imran;
select tests.login(:priya);
select lives_ok($$ select submit_review('10000000-0000-4000-8000-000000000003', 4, '{fresh}', 'Good') $$, 'can rate after 3 days of following');
select throws_ok($$ select submit_review('10000000-0000-4000-8000-000000000003', 5, '{}', null) $$, 'P0001', 'review_locked', 'one rating per vendor; edit locked for 7 days');
select tests.logout();
select throws_ok($$ insert into reviews (vendor_id, buyer_id, stars) values ('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 3) $$, '23505', null, 'database enforces one review per buyer per vendor');
update reviews set updated_at = now() - interval '8 days' where buyer_id = :priya and vendor_id = :imran;
select tests.login(:priya);
select lives_ok($$ select submit_review('10000000-0000-4000-8000-000000000003', 5, '{}', null) $$, 'review editable after 7 days');

-- ================= requests: max 5 open per vendor (BUY-7)
select lives_ok($$ select create_request('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000015', null, '250 g', null) $$, '3rd open request');
select lives_ok($$ select create_request('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', null, 'Kokum', null, null) $$, '4th open request');
select lives_ok($$ select create_request('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000016', null, '1 kg', null) $$, '5th open request');
select throws_ok($$ select create_request('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000017', null, null, null) $$, 'P0001', 'request_limit', '6th open request blocked');

-- ================= role set once
select throws_ok($$ select set_role('vendor') $$, 'P0001', 'role_locked', 'buyer cannot switch to vendor');
select tests.logout();
insert into auth.users (id, phone, aud, role) values ('dddddddd-0000-4000-8000-000000000001', '919999900020', 'authenticated', 'authenticated');
select tests.login('dddddddd-0000-4000-8000-000000000001');
select lives_ok($$ select set_role('buyer') $$, 'new user picks a role');
select throws_ok($$ select set_role('vendor') $$, 'P0001', 'role_locked', 'role cannot be changed after it is set');

select * from finish();
rollback;
