-- Owner review 2026-11-21: society requests (name + address), admin list, mark as added → notify batch.
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

select plan(15);
\set priya '''20000000-0000-4000-8000-000000000001'''
\set arjun '''20000000-0000-4000-8000-000000000002'''
\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set admin '''30000000-0000-4000-8000-000000000001'''
\set gp '''40000000-0000-4000-8000-000000000001'''

-- ---------------------------------------------------------------- buyer side
select tests.login(:priya);
select throws_ok($$ select request_society('Suyash Towers', '') $$, 'P0001', 'invalid_society_address', 'address is required');
select throws_ok($$ select request_society('S', 'Paud Road, Kothrud, Pune') $$, 'P0001', 'invalid_society_name', 'name is required');
select lives_ok($$ select request_society('  Suyash   Towers ', 'Paud Road, Kothrud, Pune') $$, 'buyer requests a society');
select is((select society_name || ' | ' || society_address from waitlist where user_id = :priya and status = 'open' and society_name ilike 'suyash%'),
          'Suyash Towers | Paud Road, Kothrud, Pune', 'name and address are tidied and stored');
select request_society('Green Park Residency', '', :gp);
select is((select society_address from waitlist where user_id = :priya and society_id = :gp),
          (select address from societies where id = :gp), 'a listed society without vendors uses its known address');
select is(request_society('suyash towers', 'Paud Road, Kothrud, Pune 411038'),
          (select id from waitlist where user_id = :priya and society_name = 'Suyash Towers'), 'asking again updates the same request');
select is((select count(*)::int from buyer_societies where buyer_id = :priya), (select count(*)::int from buyer_societies where buyer_id = :priya and society_id = :gp),
          'a request never adds a society to the buyer (Priya still has only Green Park)');
select tests.logout();

select tests.login(:arjun);
select lives_ok($$ select request_society('Suyash Towers', 'Paud Road, Pune') $$, 'a second buyer asks for the same society');
select tests.logout();

select tests.login(:ramesh);
select throws_ok($$ select request_society('Suyash Towers', 'Paud Road, Pune') $$, 'P0001', null, 'vendors cannot request societies');
select throws_ok($$ select admin_society_requests() $$, 'P0001', 'admin_only', 'only admins see requests');
select tests.logout();

-- ---------------------------------------------------------------- admin side
select tests.login(:admin);
select is((select (e->>'same_name_count')::int from jsonb_array_elements(admin_society_requests()) e where e->>'society_name' = 'Suyash Towers' limit 1), 2,
          'admin sees the requests with how many asked');
select ok((select bool_and(e ? 'requester' and e ? 'society_address') from jsonb_array_elements(admin_society_requests()) e), 'with requester name and address');
select throws_ok(format($$ select resolve_society_requests(array(select id from waitlist where society_name = 'Suyash Towers'), %L) $$, '00000000-0000-4000-8000-000000000000'),
                 'P0001', 'society_not_found', 'must link a real society');
select is(resolve_society_requests(array(select id from waitlist where society_name = 'Suyash Towers'), :gp), 2, 'mark both as added');
select tests.logout();

-- the notification context for that batch names the society and both buyers
select is((select jsonb_array_length(notify_context('society_added', (select resolve_batch from waitlist where society_name = 'Suyash Towers' limit 1))->'recipients')), 2,
          'notify batch reaches both buyers');

select * from finish();
rollback;
