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


select plan(17);

\set priya '''20000000-0000-4000-8000-000000000001'''
\set arjun '''20000000-0000-4000-8000-000000000002'''
\set ramesh '''10000000-0000-4000-8000-000000000001'''

-- ================= AUTH-2: 5 wrong OTPs block for 1 hour
select is(otp_record_failure('+919999900021'), null, 'failure 1 does not block');
select is(otp_record_failure('+919999900021'), null, 'failure 2');
select is(otp_record_failure('+919999900021'), null, 'failure 3');
select is(otp_record_failure('+919999900021'), null, 'failure 4');
select ok(otp_record_failure('+919999900021') between now() + interval '59 minutes' and now() + interval '61 minutes', '5th failure blocks for 1 hour');
select ok(otp_blocked_until('919999900021') is not null, 'number is blocked (any phone format)');
select is((hook_send_sms('{"user":{"phone":"919999900021"},"sms":{"otp":"123456"}}'::jsonb)) #>> '{error,http_code}', '429', 'SMS hook refuses to send to a blocked number');
select is(hook_send_sms('{"user":{"phone":"919999900022"},"sms":{"otp":"123456"}}'::jsonb), '{}'::jsonb, 'SMS hook allows other numbers');
update otp_attempts set blocked_until = now() - interval '1 second' where phone = '919999900021';
select is(otp_blocked_until('919999900021'), null, 'block lifts after the hour');
select is(otp_record_failure('919999900021'), null, 'counter restarts after the block');
select tests.anon();
select throws_ok($$ select otp_record_failure('919999900099') $$, '42501', null, 'anon cannot record OTP failures');
select throws_ok($$ select * from otp_attempts $$, '42501', null, 'anon cannot read OTP attempts');
select is((otp_status('919999900021'))->>'blocked_until', null, 'anon can check whether a number is blocked');
select tests.logout();

-- ================= AUTH-6: deleted account reviews show "Former user"
select tests.login(:arjun);
select lives_ok($$ select delete_my_account() $$, 'buyer deletes account');
select tests.login(:priya);
select is((select reviewer_name from v_review_public where id = '90000000-0000-4000-8000-000000000002'), 'Former user', 'deleted account''s review shows Former user');
select tests.logout();
select is((select phone from auth.users where id = :arjun), null, 'phone number is freed on deletion');

-- ================= profile completion
select tests.login(:priya);
select throws_ok($$ select complete_profile('A') $$, 'P0001', 'invalid_name', 'name must be at least 2 characters');

select * from finish();
rollback;
