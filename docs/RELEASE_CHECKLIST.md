# Release checklist — Sabzi pilot

For the owner. Do these in order. Nothing here needs code changes unless noted.

## 1. Supabase staging project
- [ ] Create a Supabase project in **Mumbai (ap-south-1)**, plan with PITR backups if possible.
- [ ] `npx supabase link --project-ref <ref>` then `npx supabase db push` (applies `supabase/migrations`). Do **not** run `seed.sql` on production; on staging only if you want sample data.
- [ ] Auth → Providers → **Google**: enable, paste the Google OAuth client id and secret (see section 2). Email: enable (needed by admin logins). **Phone: leave disabled for now** (no DLT yet). Auth → MFA: enable TOTP.
- [ ] Auth → URL Configuration → Site URL: your testing subdomain (e.g. `https://test.<domain>`); Redirect URLs: add `sabzi://auth/callback` (and `exp+sabzi://auth/callback` for development builds).
- [ ] *(Later, with phone OTP)* Auth → Hooks → **Send SMS hook** → HTTPS → `https://<ref>.supabase.co/functions/v1/send-sms-hook`; copy the generated secret.
- [ ] Deploy functions: `npx supabase functions deploy send-sms-hook otp-verify notify admin-invite`.
- [ ] Function secrets (`npx supabase secrets set …`): `NOTIFY_SECRET` (random 32+ chars), optional `EXPO_ACCESS_TOKEN`. *(Later, with phone OTP: `SEND_SMS_HOOK_SECRET`, `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`.)*
- [ ] SQL editor:
  ```sql
  insert into private.settings values
    ('notify_url', 'https://<ref>.supabase.co/functions/v1/notify'),
    ('notify_secret', '<same as NOTIFY_SECRET>')
  on conflict (key) do update set value = excluded.value;
  update public.app_settings set value = '"2026-12-01"' where key = 'pilot_start_date'; -- your real start
  ```
- [ ] Database → Extensions: `pg_net` and `pg_cron` enabled (the migrations try; check the `vendor-request-digest` job exists in `cron.job`).
- [ ] Storage: buckets were created by migrations; check `stock-photos` max size 300 KB.
- [ ] Create the owner admin: invite yourself in Auth → Users, then in SQL: `select public.make_admin('<user id>', 'owner', 'Your name');` (run as service role / SQL editor). Log in to the admin panel and enrol your authenticator app. Invite field staff from **Team**.

## 2. Google sign-in (current login)
- [ ] Google Cloud console → APIs & Services → OAuth consent screen: app name, support email, your testing subdomain as an authorised domain; publish (or add testers while in "Testing").
- [ ] Credentials → Create OAuth client ID → **Web application**. Authorised redirect URI: `https://<ref>.supabase.co/auth/v1/callback`. Copy the client id and secret into Supabase → Auth → Providers → Google.
- [ ] Local development (optional): a second Web client with redirect `http://127.0.0.1:54321/auth/v1/callback`; export `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` before `npx supabase start`. Without them Google sign-in is inactive locally; the seeded test phone logins still work for development and tests.
- [ ] On a phone: sign in with Google → choose role → profile (name + mobile number) → home. The mobile number is stored without SMS verification (shown masked in the profile, used for vendor "Call" and by the field team).

### Later: phone OTP (SMS) — when DLT registration is done
- [ ] DLT registration with MSG91 (entity + sender ID + OTP template, e.g. "{#var#} is your Sabzi login code. Do not share it."). Put the flow template id in `MSG91_TEMPLATE_ID`.
- [ ] Enable the Phone provider and the Send SMS hook (section 1), set the three SMS secrets, then set `AUTH_METHODS.phoneOtp = true` in `packages/shared/src/constants.ts` and release a new app version. The screens, `otp-verify`, `send-sms-hook` and the 5-tries block are already built and tested.

## 3. Push notifications (FCM via Expo)
- [ ] Create a Firebase project, add Android app `in.sabzi.app`, download `google-services.json` (do not commit it).
- [ ] `eas credentials` → Android → upload the FCM V1 service-account key.
- [ ] `eas init` and put the real EAS project id in `apps/mobile/app.json` → `extra.eas.projectId` (replaces `REPLACE_WITH_EAS_PROJECT_ID`).

## 4. Testing subdomain, web pages and App Links
- [ ] Create the testing subdomain (e.g. `test.<domain>`) pointing at the web deployment below. No code change: set `EXPO_PUBLIC_BASE_URL=https://test.<domain>` as an EAS environment variable (QR links and the Android App Links host follow it, via `apps/mobile/app.config.ts`) and `NEXT_PUBLIC_BASE_URL=https://test.<domain>` on the web deployment. At launch, change both values to the main domain and print new stickers.
- [ ] Deploy `apps/admin` (Vercel or similar) on that subdomain with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_URL`, `ANDROID_SHA256_CERT_FINGERPRINTS` (from `eas credentials`, release key). The same deployment serves the admin panel, `/v/<code>`, `/s/<id>`, `/privacy`, `/terms` and `/.well-known/assetlinks.json`.
- [ ] Check `https://<domain>/.well-known/assetlinks.json` returns your fingerprint.
- [ ] Have `/privacy` and `/terms` reviewed by a lawyer (DPDP Act); set a grievance officer email in `SUPPORT_EMAIL`. Also update `SUPPORT_PHONE`, `PLAY_STORE_URL`, `APP_NAME` when the brand is final.

## 5. App build (EAS)
- [ ] `apps/mobile/.env` for EAS: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_BASE_URL`, `EXPO_PUBLIC_POSTHOG_KEY` (set as EAS environment variables).
- [ ] `cd apps/mobile && npx expo-doctor` (all 20 checks; the directory check needs internet).
- [ ] `eas build --profile preview --platform android` → install the APK on a 2 GB RAM phone.
- [ ] Manual pilot run (TECH_SPEC §12) on 3G throttling: sign in with Google and complete the profile with a mobile number; buyer gets an arrival alert and opens the vendor page; vendor publishes the morning menu with "Yesterday" and taps "I've arrived"; offline: publish with mobile data off, turn it on, check it sends.
- [ ] `eas build --profile production --platform android` (AAB) → `eas submit --profile production` → Play Console **internal testing** track; add the pilot testers.

## 6. Pilot data
- [ ] In the admin panel: add the 10–15 societies with gates (coordinates from Google Maps), items (pictures optional), then vendors verify themselves in the app and you assign stops in the planner.
- [ ] Print stickers (A6, vendor page → "QR sticker (PDF)") and society posters (A4, society page).

## 7. Analytics
- [ ] PostHog project (EU host), key in `EXPO_PUBLIC_POSTHOG_KEY`. Dashboard numbers in the admin panel do not depend on PostHog.

## 8. Before each release
- [ ] `pnpm verify`, `npx supabase db reset && npx supabase test db`, `cd supabase/functions && deno test --allow-env --allow-read --allow-net`, integration tests (`pnpm --filter @sabzi/integration test:integration`) — all green in CI.
- [ ] Bump `version` in `apps/mobile/app.json`; set `latest_app_version` (and `min_app_version` if old apps must update) in admin **Settings**.
