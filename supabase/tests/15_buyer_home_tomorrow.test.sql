-- Owner review 2026-11-21: "Coming tomorrow" on buyer home (buyer_home_tomorrow).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

create schema tests;
create function tests.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
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
\set gp '''40000000-0000-4000-8000-000000000001'''
\set stop1 '''60000000-0000-4000-8000-000000000001'''

-- Ramesh's Green Park stop only runs tomorrow
update public.stops set days_of_week = array[(public.ist_dow() % 7 + 1)]::smallint[] where id = :stop1;

select tests.login(:priya);
select ok((select bool_or(e->>'vendor_id' = :ramesh) from jsonb_array_elements(buyer_home_tomorrow(:gp)) e), 'a vendor whose stop runs tomorrow is listed');
select ok(not exists (select 1 from jsonb_array_elements(buyer_home(:gp)) e where e->>'stop_id' = :stop1), 'and is not in today''s list');
select is((select e->>'window_start' from jsonb_array_elements(buyer_home_tomorrow(:gp)) e where e->>'stop_id' = :stop1), '08:00:00', 'with its visit time');
select tests.logout();

-- Skipped tomorrow: not listed
insert into public.stop_skips (stop_id, date) values (:stop1, public.ist_today() + 1);
select tests.login(:priya);
select ok(not exists (select 1 from jsonb_array_elements(buyer_home_tomorrow(:gp)) e where e->>'stop_id' = :stop1), 'a stop skipped for tomorrow is not listed');
select tests.logout();

-- Only today: not listed
delete from public.stop_skips where stop_id = :stop1;
update public.stops set days_of_week = array[public.ist_dow()]::smallint[] where id = :stop1;
select tests.login(:priya);
select ok(not exists (select 1 from jsonb_array_elements(buyer_home_tomorrow(:gp)) e where e->>'stop_id' = :stop1), 'a stop that runs only today is not listed');
select tests.logout();

set local role anon;
select throws_ok($$ select public.buyer_home_tomorrow('40000000-0000-4000-8000-000000000001') $$, '42501', null, 'anon cannot call it');

select * from finish();
rollback;
