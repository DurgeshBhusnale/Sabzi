-- Owner review 2026-11-21: buyer's full name for the vendor, vendor's note for the buyer.
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

select plan(8);
\set priya '''20000000-0000-4000-8000-000000000001'''
\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set stop1 '''60000000-0000-4000-8000-000000000001'''
\set item13 '''70000000-0000-4000-8000-000000000013'''

-- Vendor sees the full name, never a phone number
select tests.login(:ramesh);
select is((select buyer_name from v_vendor_requests where item_id = :item13 limit 1),
          'Priya Kulkarni', 'vendor sees the buyer''s full name');
select ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'v_vendor_requests'
                        and column_name ilike '%phone%'), 'the view has no phone column');

-- Accept with a note
select is(answer_request(:item13, 'will_bring', ist_today() + 1, :stop1, 45, null, '  Fresh stock arriving, may be 10 min late  '), 1, 'accept with a note');
select is((select vendor_note from v_vendor_requests where item_id = :item13 limit 1), 'Fresh stock arriving, may be 10 min late', 'note is trimmed and stored');
select throws_ok(format($$ select answer_request(%L, 'will_bring', public.ist_today() + 1, %L, 45, null, repeat('x', 141)) $$, :item13, :stop1),
                 'P0001', 'note_too_long', 'notes over 140 characters are refused');
select tests.logout();

-- Buyer sees it
select tests.login(:priya);
select is((select e->>'vendor_note' from jsonb_array_elements(my_requests()) e where e->>'item_id' = :item13 limit 1),
          'Fresh stock arriving, may be 10 min late', 'buyer sees the vendor''s note');
select tests.logout();

-- A later answer without a note clears it; deny can carry a note too
select tests.login(:ramesh);
select is(answer_request(:item13, 'cant_bring', ist_today() + 1, :stop1, null, null, 'Not in season this week'), 1, 'deny with a note');
select is((select vendor_note from v_vendor_requests where item_id = :item13 limit 1), 'Not in season this week', 'deny note replaces the earlier one');
select tests.logout();

select * from finish();
rollback;
