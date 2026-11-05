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
\set owner '''30000000-0000-4000-8000-000000000001'''
\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set priya '''20000000-0000-4000-8000-000000000001'''

-- Seed-based expectations
select tests.login(:owner);
select is((metrics_summary())->>'verified_vendors', '3', '3 verified vendors in the seed');
select is((metrics_summary())->>'active_vendors', '0', 'nobody has 5 menu days yet');
select is((metrics_summary())->>'buyers', '3', '3 buyers');
-- followers: Green Park 1 (Priya), Sahyadri 1 (Arjun), Tulsi 1 (Meera) over 420+260+310+180 flats
select is((metrics_summary())->>'adoption_pct', '0.3', 'adoption = 3 followers / 1170 flats');
select is((metrics_summary('karve_nagar'))->>'buyers', '2', 'area filter: Karve Nagar buyers');
select tests.logout();

-- Make Ramesh active: menus on 5 of the last 7 days
insert into daily_menus (vendor_id, date, published_at)
select :ramesh, ist_today() - d, now() from generate_series(2, 4) d;
-- Arrival alerts: 4 sent, 2 opened within 15 min, 1 opened late
insert into notifications (user_id, type, payload, sent_at, opened_at) values
  (:priya, 'arrival', '{"society_id":"40000000-0000-4000-8000-000000000001"}', now() - interval '1 hour', now() - interval '55 minutes'),
  (:priya, 'arrival', '{"society_id":"40000000-0000-4000-8000-000000000001"}', now() - interval '1 hour', now() - interval '50 minutes'),
  (:priya, 'arrival', '{"society_id":"40000000-0000-4000-8000-000000000001"}', now() - interval '1 hour', now() - interval '10 minutes'),
  (:priya, 'arrival', '{"society_id":"40000000-0000-4000-8000-000000000001"}', now() - interval '1 hour', null);
-- 10 reviews for Ramesh: add 8 more fake buyers' reviews
insert into auth.users (id, aud, role) select ('aaaaaaaa-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'authenticated', 'authenticated' from generate_series(1, 8) n;
update profiles set role = 'buyer', name = 'Test' where user_id::text like 'aaaaaaaa-0000-4000-8000-%';
insert into reviews (vendor_id, buyer_id, stars) select :ramesh, ('aaaaaaaa-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 4 from generate_series(1, 8) n;

select tests.login(:owner);
select is((metrics_summary())->>'active_vendors', '1', 'Ramesh counts as active with 5 menu days in 7');
select is((metrics_summary())->>'alert_open_rate_pct', '50.0', 'alerts opened within 15 minutes: 2 of 4');
select is((metrics_summary())->>'vendors_10_ratings', '1', 'Ramesh has 10 ratings');
select is((metrics_summary())->>'vendors_10_ratings_pct', '100.0', 'share of active vendors with 10+ ratings');
select is((select (x->>'alerts')::int from jsonb_array_elements(metrics_daily()) x where x->>'date' = ist_today()::text), 4, 'daily alerts series');
select is((metrics_societies())->0->>'name', 'Green Park Residency', 'societies sorted by followers');
select tests.login(:priya);
select throws_ok($$ select metrics_summary() $$, 'P0001', 'admin_only', 'buyers cannot read metrics');

select * from finish();
rollback;
