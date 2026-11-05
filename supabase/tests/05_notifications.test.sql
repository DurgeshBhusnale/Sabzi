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


select plan(9);

\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set gate1 '''50000000-0000-4000-8000-000000000001'''

-- Without configuration nothing is queued (local dev).
select tests.login(:ramesh);
select lives_ok($$ select vendor_arrive('50000000-0000-4000-8000-000000000001', null, null, 'eeeeeeee-0000-4000-8000-000000000001') $$, 'arrival works without notify configured');
select tests.logout();
select is((select count(*)::int from net.http_request_queue), 0, 'nothing queued when notify_url is not set');

insert into private.settings values ('notify_url', 'http://localhost:9/functions/v1/notify'), ('notify_secret', 'test');
update stop_events set created_at = now() - interval '3 hours' where vendor_id = :ramesh;
select tests.login(:ramesh);
select lives_ok($$ select vendor_arrive('50000000-0000-4000-8000-000000000001', null, null, 'eeeeeeee-0000-4000-8000-000000000002') $$, 'arrival with notify configured');
select tests.logout();
select is((select count(*)::int from net.http_request_queue), 1, 'arrival queues one notify call');
select is((select (convert_from(body, 'utf8')::jsonb)->>'kind' from net.http_request_queue limit 1), 'stop_event', 'call carries the stop event');

select is(jsonb_array_length(notify_context('stop_event', (select id from stop_events where client_id = 'eeeeeeee-0000-4000-8000-000000000002'))->'recipients'), 1,
  'arrival context lists Green Park followers of Ramesh (Priya)');
select is(notify_context('stop_event', (select id from stop_events where client_id = 'eeeeeeee-0000-4000-8000-000000000002'))->'gate'->>'name', 'Gate 1', 'context names the gate');

select tests.login('20000000-0000-4000-8000-000000000001');
select throws_ok($$ select notify_context('stop_event', gen_random_uuid()) $$, '42501', null, 'app users cannot call notify_context');
select throws_ok($$ select * from private.settings $$, '42501', null, 'app users cannot read private settings');

select * from finish();
rollback;
