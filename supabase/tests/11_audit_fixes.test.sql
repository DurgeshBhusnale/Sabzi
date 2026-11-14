-- Audit fixes (docs/audit/TECH_SECURITY_AUDIT.md): SEC-04 account delete, SEC-09 bucket listing, SEC-17 SVG.
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

\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set priya '''20000000-0000-4000-8000-000000000001'''

select plan(11);

-- ================= SEC-09: public buckets are not listable by others
insert into storage.objects (bucket_id, name) values
  ('vendor-photos', '10000000-0000-4000-8000-000000000001/face.jpg'),
  ('stock-photos', '10000000-0000-4000-8000-000000000001/2026-11-15.jpg');

select tests.anon();
select is((select count(*)::int from storage.objects where bucket_id in ('vendor-photos', 'stock-photos')), 0, 'anon cannot list public buckets');
select tests.login(:priya);
select is((select count(*)::int from storage.objects where bucket_id = 'vendor-photos'), 0, 'a buyer cannot list vendor photos');
select tests.login(:ramesh);
select is((select count(*)::int from storage.objects where bucket_id in ('vendor-photos', 'stock-photos')), 2, 'a vendor lists their own folder');
select tests.logout();

select ok(exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
  and policyname = 'report photos: reporter delete' and cmd = 'DELETE'), 'reporters can delete their own report photos');

-- ================= SEC-17
select ok(not ('image/svg+xml' = any (allowed_mime_types)), 'item-images no longer accepts SVG')
  from storage.buckets where id = 'item-images';

-- ================= SEC-04: account delete scrubs the vendor
insert into public.app_opens (user_id, date) values (:ramesh, current_date) on conflict do nothing;
insert into public.profile_phones (user_id, phone) values (:ramesh, '+919999900001') on conflict (user_id) do nothing;

select tests.login(:ramesh);
select lives_ok($$ select delete_my_account() $$, 'vendor deletes account');
select tests.logout();

select is((select display_name from public.vendors where user_id = :ramesh), 'Former vendor', 'vendor name scrubbed');
select is((select photo_path from public.vendors where user_id = :ramesh), null, 'vendor photo path cleared');
select is((select count(*)::int from public.daily_menus where vendor_id = :ramesh and stock_photo_path is not null), 0, 'stock photo paths cleared');
select is((select count(*)::int from public.app_opens where user_id = :ramesh), 0, 'app opens removed');
select is((select count(*)::int from public.profile_phones where user_id = :ramesh), 0, 'profile phone removed');

select * from finish();
rollback;
