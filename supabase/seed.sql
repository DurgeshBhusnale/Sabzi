-- Sample data from DESIGN_BRIEF §11. Local/dev only. Test OTP for every phone below is 123456 (config.toml).
-- Admin logins (local only): owner admin@sabzi.example / sabzi-admin-dev, field staff field@sabzi.example / sabzi-field-dev

-- ---------------------------------------------------------------- auth users
create or replace function pg_temp.seed_user(p_id uuid, p_phone text, p_email text default null, p_password text default null,
  p_created timestamptz default now() - interval '30 days') returns void language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, phone, phone_confirmed_at, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, phone_change, phone_change_token, email_change_token_current, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_phone,
    case when p_phone is not null then p_created end, p_email,
    case when p_password is not null then extensions.crypt(p_password, extensions.gen_salt('bf')) else '' end,
    case when p_email is not null then p_created end,
    jsonb_build_object('provider', case when p_phone is not null then 'phone' else 'email' end,
      'providers', jsonb_build_array(case when p_phone is not null then 'phone' else 'email' end)),
    '{}'::jsonb, p_created, p_created, '', '', '', '', '', '', '', '');
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (p_id::text, p_id,
    case when p_phone is not null then jsonb_build_object('sub', p_id::text, 'phone', p_phone)
         else jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true) end,
    case when p_phone is not null then 'phone' else 'email' end, p_created, p_created, p_created);
end $$;

-- Vendors
select pg_temp.seed_user('10000000-0000-4000-8000-000000000001', '919999900001'); -- Ramesh
select pg_temp.seed_user('10000000-0000-4000-8000-000000000002', '919999900002'); -- Sunita
select pg_temp.seed_user('10000000-0000-4000-8000-000000000003', '919999900003'); -- Imran
select pg_temp.seed_user('10000000-0000-4000-8000-000000000004', '919999900004', null, null, now() - interval '1 day'); -- Ganesh (new)
-- Buyers
select pg_temp.seed_user('20000000-0000-4000-8000-000000000001', '919999900011'); -- Priya
select pg_temp.seed_user('20000000-0000-4000-8000-000000000002', '919999900012'); -- Arjun
select pg_temp.seed_user('20000000-0000-4000-8000-000000000003', '919999900013'); -- Meera
-- Admins (email + password; TOTP enrolled on first login)
select pg_temp.seed_user('30000000-0000-4000-8000-000000000001', null, 'admin@sabzi.example', 'sabzi-admin-dev');
select pg_temp.seed_user('30000000-0000-4000-8000-000000000002', null, 'field@sabzi.example', 'sabzi-field-dev');

-- Profiles were auto-created by the trigger; fill them in (seed runs as postgres, so the role guard allows this).
update public.profiles set role = 'vendor', name = 'Ramesh Pawar' where user_id = '10000000-0000-4000-8000-000000000001';
update public.profiles set role = 'vendor', name = 'Sunita Jadhav' where user_id = '10000000-0000-4000-8000-000000000002';
update public.profiles set role = 'vendor', name = 'Imran Shaikh' where user_id = '10000000-0000-4000-8000-000000000003';
update public.profiles set role = 'vendor', name = 'Ganesh More' where user_id = '10000000-0000-4000-8000-000000000004';
update public.profiles set role = 'buyer', name = 'Priya Kulkarni' where user_id = '20000000-0000-4000-8000-000000000001';
update public.profiles set role = 'buyer', name = 'Arjun Deshpande' where user_id = '20000000-0000-4000-8000-000000000002';
update public.profiles set role = 'buyer', name = 'Meera Joshi' where user_id = '20000000-0000-4000-8000-000000000003';
update public.profiles set role = 'admin', admin_level = 'owner', name = 'Tushar Bhusnale' where user_id = '30000000-0000-4000-8000-000000000001';
update public.profiles set role = 'admin', admin_level = 'field_staff', name = 'Sachin Field' where user_id = '30000000-0000-4000-8000-000000000002';

-- ---------------------------------------------------------------- societies and gates
insert into public.societies (id, name, area, address, lat, lng, flats_count) values
  ('40000000-0000-4000-8000-000000000001', 'Green Park Residency', 'karve_nagar', 'Lane 5, Karve Nagar, Pune 411052', 18.4895, 73.8215, 420),
  ('40000000-0000-4000-8000-000000000002', 'Sahyadri Heights', 'karve_nagar', 'Hingne Khurd Road, Karve Nagar, Pune 411052', 18.4935, 73.8186, 260),
  ('40000000-0000-4000-8000-000000000003', 'Tulsi Vihar', 'sus_pashan', 'Pashan–Sus Road, Pashan, Pune 411021', 18.5372, 73.7905, 310),
  ('40000000-0000-4000-8000-000000000004', 'Nandanvan Society', 'sus_pashan', 'Sus Gaon Road, Sus, Pune 411021', 18.5445, 73.7552, 180);

insert into public.gates (id, society_id, name, lat, lng) values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Gate 1', 18.4895, 73.8215),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'Gate 2', 18.4886, 73.8228),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000002', 'Main Gate', 18.4935, 73.8186),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000003', 'Gate 2', 18.5372, 73.7905),
  ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000004', 'Gate A', 18.5445, 73.7552);

-- ---------------------------------------------------------------- vendors
insert into public.vendors (user_id, display_name, vehicle, vehicle_no, pmc_vendor_id, delivery_available, allow_calls, status, verified_by, verified_at, code) values
  ('10000000-0000-4000-8000-000000000001', 'Ramesh Sabzi', 'tempo', 'MH12 AB 4521', 'PMC-HW-20431', true, true, 'verified', '30000000-0000-4000-8000-000000000001', now() - interval '25 days', 'RMSH4K7P'),
  ('10000000-0000-4000-8000-000000000002', 'Sunita Fresh', 'thela', null, 'PMC-HW-18822', false, false, 'verified', '30000000-0000-4000-8000-000000000001', now() - interval '25 days', 'SNTA8F3Q'),
  ('10000000-0000-4000-8000-000000000003', 'Imran Vegetables', 'tempo', 'MH12 KX 1190', null, true, true, 'verified', '30000000-0000-4000-8000-000000000002', now() - interval '20 days', 'IMRN6V2D'),
  ('10000000-0000-4000-8000-000000000004', 'Ganesh Bhaji Wala', 'tempo', 'MH14 GM 7765', null, false, true, 'pending', null, null, 'GNSH9B5W');

-- ---------------------------------------------------------------- stops (every day)
insert into public.stops (id, vendor_id, gate_id, days_of_week, window_start, window_end) values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '{1,2,3,4,5,6,7}', '08:00', '08:45'),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000003', '{1,2,3,4,5,6,7}', '09:00', '09:40'),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000004', '{1,2,3,4,5,6,7}', '07:30', '08:15'),
  ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000001', '{1,2,3,4,5,6,7}', '18:00', '18:45'),
  ('60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000005', '{1,2,3,4,5,6,7}', '17:30', '18:15');

-- ---------------------------------------------------------------- items master list (40+)
insert into public.items (id, name, default_unit) values
  ('70000000-0000-4000-8000-000000000001', 'Tomato', 'kg'),
  ('70000000-0000-4000-8000-000000000002', 'Onion', 'kg'),
  ('70000000-0000-4000-8000-000000000003', 'Potato', 'kg'),
  ('70000000-0000-4000-8000-000000000004', 'Bhindi (okra)', 'kg'),
  ('70000000-0000-4000-8000-000000000005', 'Methi (fenugreek)', 'bunch'),
  ('70000000-0000-4000-8000-000000000006', 'Palak (spinach)', 'bunch'),
  ('70000000-0000-4000-8000-000000000007', 'Coriander', 'bunch'),
  ('70000000-0000-4000-8000-000000000008', 'Cauliflower', 'piece'),
  ('70000000-0000-4000-8000-000000000009', 'Cabbage', 'piece'),
  ('70000000-0000-4000-8000-000000000010', 'Green chilli', 'g250'),
  ('70000000-0000-4000-8000-000000000011', 'Capsicum', 'kg'),
  ('70000000-0000-4000-8000-000000000012', 'Brinjal', 'kg'),
  ('70000000-0000-4000-8000-000000000013', 'Drumsticks', 'g500'),
  ('70000000-0000-4000-8000-000000000014', 'Broccoli', 'piece'),
  ('70000000-0000-4000-8000-000000000015', 'Baby corn', 'g250'),
  ('70000000-0000-4000-8000-000000000016', 'Carrot', 'kg'),
  ('70000000-0000-4000-8000-000000000017', 'Beetroot', 'kg'),
  ('70000000-0000-4000-8000-000000000018', 'Radish (mooli)', 'kg'),
  ('70000000-0000-4000-8000-000000000019', 'Cucumber', 'kg'),
  ('70000000-0000-4000-8000-000000000020', 'Bottle gourd (dudhi)', 'piece'),
  ('70000000-0000-4000-8000-000000000021', 'Bitter gourd (karela)', 'kg'),
  ('70000000-0000-4000-8000-000000000022', 'Ridge gourd (dodka)', 'kg'),
  ('70000000-0000-4000-8000-000000000023', 'Snake gourd (padwal)', 'kg'),
  ('70000000-0000-4000-8000-000000000024', 'Pumpkin (lal bhopla)', 'kg'),
  ('70000000-0000-4000-8000-000000000025', 'Green peas (matar)', 'kg'),
  ('70000000-0000-4000-8000-000000000026', 'French beans (farasbi)', 'kg'),
  ('70000000-0000-4000-8000-000000000027', 'Cluster beans (gavar)', 'kg'),
  ('70000000-0000-4000-8000-000000000028', 'Ginger', 'g250'),
  ('70000000-0000-4000-8000-000000000029', 'Garlic', 'g250'),
  ('70000000-0000-4000-8000-000000000030', 'Lemon', 'piece'),
  ('70000000-0000-4000-8000-000000000031', 'Curry leaves', 'bunch'),
  ('70000000-0000-4000-8000-000000000032', 'Mint (pudina)', 'bunch'),
  ('70000000-0000-4000-8000-000000000033', 'Spring onion', 'bunch'),
  ('70000000-0000-4000-8000-000000000034', 'Dill (shepu)', 'bunch'),
  ('70000000-0000-4000-8000-000000000035', 'Sweet potato', 'kg'),
  ('70000000-0000-4000-8000-000000000036', 'Raw banana', 'piece'),
  ('70000000-0000-4000-8000-000000000037', 'Sweet corn', 'piece'),
  ('70000000-0000-4000-8000-000000000038', 'Mushroom', 'g250'),
  ('70000000-0000-4000-8000-000000000039', 'Lettuce', 'piece'),
  ('70000000-0000-4000-8000-000000000040', 'Zucchini', 'kg'),
  ('70000000-0000-4000-8000-000000000041', 'Tondli (ivy gourd)', 'kg'),
  ('70000000-0000-4000-8000-000000000042', 'Amaranth (rajgira)', 'bunch'),
  ('70000000-0000-4000-8000-000000000043', 'Red capsicum', 'kg'),
  ('70000000-0000-4000-8000-000000000044', 'Yam (suran)', 'kg');

-- A vendor custom item waiting for approval (A-08)
insert into public.items (id, name, default_unit, is_custom, created_by, approved) values
  ('70000000-0000-4000-8000-000000000099', 'Kantola (spiny gourd)', 'kg', true, '10000000-0000-4000-8000-000000000001', false);

-- Ramesh's usual items (12) + Sunita, Imran
insert into public.vendor_items (vendor_id, item_id, sort)
select '10000000-0000-4000-8000-000000000001', ('70000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid, n
  from generate_series(1, 12) n;
insert into public.vendor_items (vendor_id, item_id, sort)
select '10000000-0000-4000-8000-000000000002', ('70000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid, n
  from unnest(array[1,2,5,6,7,31,32,16]) with ordinality as t(n, ord);
insert into public.vendor_items (vendor_id, item_id, sort)
select '10000000-0000-4000-8000-000000000003', ('70000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid, n
  from unnest(array[1,2,3,16,17,19,25,26]) as t(n);

-- ---------------------------------------------------------------- menus: Ramesh today and yesterday (for "Same as yesterday")
insert into public.daily_menus (id, vendor_id, date, published_at, stock_photo_path, stock_photo_at) values
  ('80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', public.ist_today(),
   date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata' + interval '6 hours 42 minutes', null, null),
  ('80000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', public.ist_today() - 1,
   now() - interval '1 day', null, null),
  ('80000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', public.ist_today(), now() - interval '2 hours', null, null);

insert into public.menu_items (menu_id, item_id, price, unit, is_sold_out, sort) values
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 40, 'kg', false, 1),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', 30, 'kg', false, 2),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000003', 35, 'kg', false, 3),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000004', 60, 'kg', false, 4),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000005', 15, 'bunch', false, 5),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000006', 15, 'bunch', false, 6),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000007', 10, 'bunch', true, 7),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000008', 40, 'piece', false, 8),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000009', 30, 'piece', false, 9),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000010', 20, 'g250', false, 10),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000011', 80, 'kg', false, 11),
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000012', 50, 'kg', false, 12);

insert into public.menu_items (menu_id, item_id, price, unit, sort)
select '80000000-0000-4000-8000-000000000002', item_id, case when price > 10 then price - 5 else price end, unit, sort
  from public.menu_items where menu_id = '80000000-0000-4000-8000-000000000001';

insert into public.menu_items (menu_id, item_id, price, unit, sort) values
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000001', 38, 'kg', 1),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000005', 12, 'bunch', 2),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000006', 15, 'bunch', 3),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000031', 5, 'bunch', 4);

-- ---------------------------------------------------------------- buyers: societies and follows
insert into public.buyer_societies (buyer_id, society_id, is_primary) values
  ('20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', true),
  ('20000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', true),
  ('20000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', true);

insert into public.follows (buyer_id, vendor_id, society_id, created_at) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', now() - interval '20 days'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', now() - interval '1 day'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', now() - interval '15 days'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003', now() - interval '18 days');

-- ---------------------------------------------------------------- reviews (design brief samples)
insert into public.reviews (id, vendor_id, buyer_id, stars, tags, text, vendor_reply, vendor_replied_at, created_at, updated_at) values
  ('90000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 5,
   '{fresh,correct_weight}', 'Vegetables are always fresh and he never cheats on weight.', 'Thank you, didi.', now() - interval '9 days',
   now() - interval '10 days', now() - interval '10 days'),
  ('90000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 3,
   '{fair_price}', 'Good quality but a bit costly compared to others.', null, null, now() - interval '5 days', now() - interval '5 days'),
  ('90000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', 5,
   '{polite}', 'Sunita tai keeps methi aside for me if I''m late.', null, null, now() - interval '7 days', now() - interval '7 days');

-- ---------------------------------------------------------------- requests for tomorrow
insert into public.requests (buyer_id, vendor_id, society_id, item_id, free_text, qty, note, for_date) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000013', null, '500 g', null, public.ist_today() + 1),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000013', null, '1 kg', 'Fresh ones please', public.ist_today() + 1),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000014', null, null, null, public.ist_today() + 1),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', null, 'Baby spinach', '250 g', null, public.ist_today() + 1);

-- ---------------------------------------------------------------- a sample report for the moderation queue
insert into public.reports (reporter_id, vendor_id, reason, text) values
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'wrong_weight', 'Half kilo of tomatoes weighed 420 g at home.');
