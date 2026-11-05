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

select plan(87);

-- ids
\set ramesh '''10000000-0000-4000-8000-000000000001'''
\set sunita '''10000000-0000-4000-8000-000000000002'''
\set imran '''10000000-0000-4000-8000-000000000003'''
\set ganesh '''10000000-0000-4000-8000-000000000004'''
\set priya '''20000000-0000-4000-8000-000000000001'''
\set arjun '''20000000-0000-4000-8000-000000000002'''
\set owner '''30000000-0000-4000-8000-000000000001'''
\set field '''30000000-0000-4000-8000-000000000002'''
\set greenpark '''40000000-0000-4000-8000-000000000001'''
\set gate1 '''50000000-0000-4000-8000-000000000001'''

insert into public.notifications (user_id, type, payload) values (:priya, 'arrival', '{"vendor":"Ramesh"}');

-- ================= profiles
select tests.login(:priya);
select is((select count(*)::int from profiles), 1, 'buyer sees only own profile');
select is((select count(*)::int from profiles where user_id = :ramesh), 0, 'buyer cannot read a vendor profile');
select lives_ok($$ update profiles set name = 'Priya K' where user_id = '20000000-0000-4000-8000-000000000001' $$, 'buyer updates own name');
select throws_ok($$ update profiles set role = 'admin' where user_id = '20000000-0000-4000-8000-000000000001' $$, '42501', null, 'buyer cannot change own role column');
update profiles set name = 'Hacked' where user_id = :arjun;
select tests.logout();
select is((select name from profiles where user_id = :arjun), 'Arjun Deshpande', 'buyer cannot update another profile');
select tests.login(:owner);
select ok((select count(*) from profiles) >= 9, 'admin sees all profiles');
select tests.logout();

-- ================= vendors
select tests.login(:priya);
select is((select count(*)::int from vendors), 0, 'buyer cannot read vendors table');
select is((select count(*)::int from v_vendor_public), 3, 'buyer sees only verified vendors in v_vendor_public');
select is((select count(*)::int from v_vendor_public where id = :ganesh), 0, 'pending vendor hidden from buyers');
select throws_ok($$ insert into vendors (user_id, display_name, vehicle) values ('20000000-0000-4000-8000-000000000001', 'Fake', 'tempo') $$, '42501', null, 'buyer cannot create a vendor row');
select tests.login(:ramesh);
select is((select count(*)::int from vendors), 1, 'vendor sees only own vendor row');
select lives_ok($$ update vendors set display_name = 'Ramesh Sabzi' where user_id = '10000000-0000-4000-8000-000000000001' $$, 'vendor updates own profile');
select throws_ok($$ update vendors set status = 'verified' where user_id = '10000000-0000-4000-8000-000000000001' $$, '42501', null, 'vendor cannot change own status');
update vendors set display_name = 'Hijack' where user_id = :sunita;
select tests.logout();
select is((select display_name from vendors where user_id = :sunita), 'Sunita Fresh', 'vendor cannot update another vendor');
select tests.login(:field);
select is((select count(*)::int from vendors), 4, 'admin sees all vendors');
select tests.logout();

-- ================= societies / gates
select tests.login(:priya);
select ok((select count(*) from societies) = 4, 'buyer reads societies');
select ok((select count(*) from gates) = 5, 'buyer reads gates');
select throws_ok($$ insert into societies (name, area, lat, lng) values ('Fake', 'karve_nagar', 1, 1) $$, '42501', null, 'buyer cannot add a society');
select throws_ok($$ insert into gates (society_id, name, lat, lng) values ('40000000-0000-4000-8000-000000000001', 'X', 1, 1) $$, '42501', null, 'buyer cannot add a gate');
select tests.login(:ramesh);
select throws_ok($$ insert into societies (name, area, lat, lng) values ('Fake', 'karve_nagar', 1, 1) $$, '42501', null, 'vendor cannot add a society');
select tests.login(:field);
select lives_ok($$ insert into societies (name, area, lat, lng, flats_count) values ('Rohan Leher', 'sus_pashan', 18.54, 73.76, 200) $$, 'admin adds a society');
select lives_ok($$ insert into gates (society_id, name, lat, lng) values ('40000000-0000-4000-8000-000000000004', 'Gate B', 18.5446, 73.7553) $$, 'admin adds a gate');
select tests.logout();

-- ================= items
select tests.login(:priya);
select is((select count(*)::int from items where not approved), 0, 'buyer does not see unapproved custom items');
select throws_ok($$ insert into items (name, default_unit, is_custom, approved, created_by) values ('Kiwi', 'kg', true, false, '20000000-0000-4000-8000-000000000001') $$, '42501', null, 'buyer cannot add items');
select tests.login(:ramesh);
select is((select count(*)::int from items where not approved), 1, 'vendor sees own custom item');
select lives_ok($$ insert into items (name, default_unit, is_custom, approved, created_by) values ('Kohlrabi', 'kg', true, false, '10000000-0000-4000-8000-000000000001') $$, 'vendor adds a custom item (unapproved)');
select throws_ok($$ insert into items (name, default_unit, is_custom, approved, created_by) values ('Kale', 'kg', false, true, '10000000-0000-4000-8000-000000000001') $$, '42501', null, 'vendor cannot add an approved master item');
select tests.login(:sunita);
select is((select count(*)::int from items where not approved), 0, 'vendor cannot see another vendor''s custom item');
select tests.logout();

-- ================= vendor_items
select tests.login(:ramesh);
select is((select count(*)::int from vendor_items), 12, 'vendor sees own usual items');
select lives_ok($$ insert into vendor_items (vendor_id, item_id) values ('10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000016') $$, 'vendor adds a usual item');
select throws_ok($$ insert into vendor_items (vendor_id, item_id) values ('10000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000016') $$, '42501', null, 'vendor cannot edit another vendor''s items');
select tests.login(:priya);
select is((select count(*)::int from vendor_items), 0, 'buyer cannot read vendor_items');
select tests.logout();

-- ================= buyer_societies
select tests.login(:priya);
select is((select count(*)::int from buyer_societies), 1, 'buyer sees own societies');
select lives_ok($$ insert into buyer_societies (buyer_id, society_id) values ('20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002') $$, 'buyer saves a second society');
select throws_ok($$ insert into buyer_societies (buyer_id, society_id) values ('20000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003') $$, '42501', null, 'buyer cannot add a society for someone else');
select tests.login(:ramesh);
select throws_ok($$ insert into buyer_societies (buyer_id, society_id) values ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003') $$, '42501', null, 'vendor cannot save buyer societies');
select is((select count(*)::int from buyer_societies), 0, 'vendor cannot read buyer societies');
select tests.logout();

-- ================= stops / stop_skips
select tests.login(:ramesh);
select is((select count(*)::int from stops), 2, 'vendor sees own stops');
select throws_ok($$ insert into stops (vendor_id, gate_id, days_of_week, window_start, window_end) values ('10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002', '{1}', '10:00', '10:30') $$, '42501', null, 'vendor cannot create stops');
select tests.login(:priya);
select is((select count(*)::int from stops), 0, 'buyer cannot read stops table');
select is((select count(*)::int from v_vendor_today('40000000-0000-4000-8000-000000000001')), 2, 'buyer reads today''s stops through v_vendor_today');
select tests.login(:field);
select lives_ok($$ insert into stops (vendor_id, gate_id, days_of_week, window_start, window_end) values ('10000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000003', '{1,3,5}', '19:00', '19:30') $$, 'admin creates stops');
select tests.login(:ramesh);
select throws_ok($$ insert into stop_skips (stop_id, date) values ('60000000-0000-4000-8000-000000000001', current_date) $$, '42501', null, 'vendor cannot write stop_skips directly');
select tests.logout();

-- ================= menus
select tests.login(:priya);
select is((select count(*)::int from daily_menus where date = ist_today()), 2, 'buyer reads today''s menus of verified vendors');
select is((select count(*)::int from menu_items mi join daily_menus m on m.id = mi.menu_id where m.date = ist_today() and m.vendor_id = :ramesh), 12, 'buyer reads menu items');
select tests.login(:ramesh);
select throws_ok($$ insert into daily_menus (vendor_id, date) values ('10000000-0000-4000-8000-000000000001', current_date + 5) $$, '42501', null, 'vendor cannot write menus directly (RPC only)');
select throws_ok($$ update menu_items set price = 1 $$, '42501', null, 'vendor cannot update menu items directly');
select tests.logout();
insert into daily_menus (vendor_id, date, published_at) values (:ganesh, ist_today(), now());
select tests.login(:priya);
select is((select count(*)::int from daily_menus where vendor_id = :ganesh), 0, 'menus of unverified vendors are hidden from buyers');
select tests.logout();

-- ================= stop_events
select tests.login(:ramesh);
select throws_ok($$ insert into stop_events (vendor_id, gate_id, type) values ('10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'arrived') $$, '42501', null, 'vendor cannot insert stop events directly');
select tests.logout();
insert into stop_events (vendor_id, gate_id, type, created_at) values (:ramesh, :gate1, 'arrived', now() - interval '30 hours');
insert into stop_events (vendor_id, gate_id, type, created_at) values (:ramesh, :gate1, 'left', now() - interval '1 hour');
select tests.login(:priya);
select is((select count(*)::int from stop_events), 1, 'buyer reads only last 24 h of stop events');

-- ================= follows
select is((select count(*)::int from follows), 2, 'buyer reads own follows');
select throws_ok($$ insert into follows (buyer_id, vendor_id, society_id) values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003') $$, '42501', null, 'buyer cannot insert follows directly');
select tests.login(:ramesh);
select is((select count(*)::int from follows), 0, 'vendor cannot read who follows him');
select ok((select sum(followers) from my_follower_counts()) = 2, 'vendor sees follower counts only');
select tests.logout();

-- ================= reviews
select tests.login(:priya);
select is((select count(*)::int from reviews), 1, 'buyer reads own review rows only from base table');
select is((select count(*)::int from v_review_public where vendor_id = :ramesh), 2, 'buyer reads public reviews via view');
select throws_ok($$ insert into reviews (vendor_id, buyer_id, stars) values ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 5) $$, '42501', null, 'buyer cannot insert reviews directly');
select tests.login(:ramesh);
select is((select count(*)::int from reviews), 0, 'vendor cannot read review base rows (buyer ids)');
select is((select reviewer_name from v_review_public where id = '90000000-0000-4000-8000-000000000001'), 'Priya', 'vendor sees reviewer first name only');
select is((select society_name from v_review_public where id = '90000000-0000-4000-8000-000000000001'), 'Green Park Residency', 'vendor sees reviewer society');
select hasnt_column('public', 'v_review_public', 'buyer_id', 'public review view has no buyer id');
select tests.logout();

-- ================= review_flags
select tests.login(:ramesh);
select lives_ok($$ insert into review_flags (review_id, vendor_id, reason) values ('90000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Not my customer') $$, 'vendor flags a review on his page');
select throws_ok($$ insert into review_flags (review_id, vendor_id, reason) values ('90000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'x') $$, '42501', null, 'vendor cannot flag another vendor''s review');
select tests.login(:priya);
select is((select count(*)::int from review_flags), 0, 'buyer cannot read review flags');
select tests.logout();

-- ================= requests
select tests.login(:priya);
select is((select count(*)::int from requests), 2, 'buyer reads own requests');
select tests.login(:ramesh);
select is((select count(*)::int from requests), 0, 'vendor cannot read request base rows');
select is((select count(*)::int from v_vendor_requests), 4, 'vendor reads requests addressed to him');
select is((select string_agg(distinct buyer_first_name, ',' order by buyer_first_name) from v_vendor_requests), 'Arjun,Priya', 'vendor sees first names only');
select hasnt_column('public', 'v_vendor_requests', 'buyer_id', 'vendor request view has no buyer id');
select tests.login(:sunita);
select is((select count(*)::int from v_vendor_requests), 0, 'vendor cannot see another vendor''s requests');
select tests.logout();

-- ================= reports
select tests.login(:priya);
select is((select count(*)::int from reports), 0, 'buyer cannot read other buyers'' reports');
select throws_ok($$ insert into reports (reporter_id, vendor_id, reason) values ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'rude') $$, '42501', null, 'buyer cannot report as someone else');
select tests.login(:arjun);
select is((select count(*)::int from reports), 1, 'reporter reads own report');
select tests.login(:field);
select is((select count(*)::int from reports), 1, 'admin reads reports');
select tests.logout();

-- ================= notifications / waitlist
select tests.login(:priya);
select is((select count(*)::int from notifications), 1, 'user reads own notifications');
select throws_ok($$ insert into notifications (user_id, type) values ('20000000-0000-4000-8000-000000000001', 'arrival') $$, '42501', null, 'users cannot create notifications');
select lives_ok($$ insert into waitlist (user_id, society_name) values ('20000000-0000-4000-8000-000000000001', 'Rohan Leher') $$, 'buyer joins waitlist');
select throws_ok($$ insert into waitlist (user_id, society_name) values ('20000000-0000-4000-8000-000000000002', 'Rohan Leher') $$, '42501', null, 'cannot join waitlist as someone else');
select tests.login(:ramesh);
select is((select count(*)::int from notifications), 0, 'vendor cannot read buyer notifications');
select tests.logout();

-- ================= app_settings
select tests.anon();
select ok((select count(*) from app_settings) > 0, 'anon reads public app settings (force update before login)');
select tests.login(:field);
update app_settings set value = '"9.9.9"' where key = 'min_app_version';
select tests.logout();
select is((select value #>> '{}' from app_settings where key = 'min_app_version'), '0.1.0', 'field staff cannot change settings');
select tests.login(:owner);
update app_settings set value = '"0.2.0"' where key = 'min_app_version';
select tests.logout();
select is((select value #>> '{}' from app_settings where key = 'min_app_version'), '0.2.0', 'owner changes settings');

-- ================= phone numbers
select tests.login(:ramesh);
select throws_ok($$ select phone from auth.users $$, '42501', null, 'vendor cannot read auth.users');
select tests.login(:priya);
select throws_ok($$ select phone from auth.users $$, '42501', null, 'buyer cannot read auth.users');
select is(get_vendor_phone(:sunita), null, 'no phone when allow_calls is off');
select is(get_vendor_phone(:ramesh), '+919999900001', 'phone returned when allow_calls is on');
select tests.logout();
select is((select count(*)::int from information_schema.columns where table_schema = 'public' and column_name ilike '%phone%'), 0, 'no public table or view exposes a phone column');

select * from finish();
rollback;
