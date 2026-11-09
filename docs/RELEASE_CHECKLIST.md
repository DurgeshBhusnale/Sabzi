# Release checklist — Pheri pilot

Brand: **Pheri** (`APP_NAME`), app id `in.anchorlit.pheri`, deep-link scheme `pheri://`, testing site `https://pheri.anchorlit.in`.

For the owner. Do these in order. Nothing here needs code changes unless noted.

## 1. Supabase staging project
- [ ] Create a Supabase project in **Mumbai (ap-south-1)**, plan with PITR backups if possible.
- [ ] `npx supabase link --project-ref <ref>` then `npx supabase db push` (applies `supabase/migrations`). Do **not** run `seed.sql` on production; on staging only if you want sample data.
- [ ] Auth → Providers → **Google**: enable, paste the Google OAuth client id and secret (see section 2). Email: enable — it is both the admin login and the **email-code sign-in/sign-up** for buyers and vendors. **Phone: leave disabled for now** (no DLT yet). Auth → MFA: enable TOTP.
- [ ] Auth → URL Configuration → Site URL: your testing subdomain (e.g. `https://pheri.anchorlit.in`); Redirect URLs: add `pheri://auth/callback` (and `exp+pheri://auth/callback` for development builds).
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
- [ ] Google Cloud console → APIs & Services → OAuth consent screen: app name **Pheri**, support email; **Authorised domains: `anchorlit.in`** (Google accepts only the registered/top-level domain; it covers `pheri.anchorlit.in`). App home page `https://pheri.anchorlit.in`, privacy policy `https://pheri.anchorlit.in/privacy`, terms `https://pheri.anchorlit.in/terms`. Keep it in "Testing" and add tester Gmail addresses for the pilot; publish later (Google may then ask about the `supabase.co` redirect — a Supabase custom domain such as `auth.anchorlit.in` avoids that).
- [ ] Credentials → Create OAuth client ID → **Web application**. (Authorised JavaScript origin: `https://pheri.anchorlit.in`.) Authorised redirect URI: `https://<ref>.supabase.co/auth/v1/callback`. Copy the client id and secret into Supabase → Auth → Providers → Google.
- [ ] Local development (optional): a second Web client with redirect `http://127.0.0.1:54321/auth/v1/callback`; export `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` before `npx supabase start`. Without them Google sign-in is inactive locally; the seeded test phone logins still work for development and tests.
- [ ] On a phone: sign in with Google → choose role → profile (name + mobile number) → home. The mobile number is stored without SMS verification (shown masked in the profile, used for vendor "Call" and by the field team).

### Later: phone OTP (SMS) — when DLT registration is done
- [ ] DLT registration with MSG91 (entity + sender ID + OTP template, e.g. "{#var#} is your Sabzi login code. Do not share it."). Put the flow template id in `MSG91_TEMPLATE_ID`.
- [ ] Enable the Phone provider and the Send SMS hook (section 1), set the three SMS secrets, then set `AUTH_METHODS.phoneOtp = true` in `packages/shared/src/constants.ts` and release a new app version. The screens, `otp-verify`, `send-sms-hook` and the 5-tries block are already built and tested.

## 2b. Email sign-in / sign-up (current login, next to Google)
- [ ] **Custom SMTP is required**: Supabase's built-in mailer only sends a few emails an hour. Auth → SMTP Settings: use a provider (Resend, Amazon SES, Brevo, Zoho…) with a sender like `no-reply@anchorlit.in`; add its SPF/DKIM records to the `anchorlit.in` DNS.
- [ ] Auth → Email Templates → **Magic Link** and **Confirm signup**: paste `supabase/templates/magic_link.html` and `supabase/templates/confirmation.html` (they show the 6-digit `{{ .Token }}`, not a link). Subject: "Your Pheri code".
- [ ] Auth → Providers → Email: OTP expiry 600 s, OTP length 6. Rate limits → email sent per hour: raise to match your SMTP plan.
- [ ] Test: enter a new email in the app → code arrives → role → profile (name + mobile) → home.

## 3. Push notifications (FCM via Expo)
- [ ] Create a Firebase project, add Android app `in.anchorlit.pheri`, download `google-services.json` (do not commit it).
- [ ] `eas credentials` → Android → upload the FCM V1 service-account key.
- [ ] `eas init` and put the real EAS project id in `apps/mobile/app.json` → `extra.eas.projectId` (replaces `REPLACE_WITH_EAS_PROJECT_ID`).

## 4. Testing subdomain, web pages and App Links
- [ ] DNS for `anchorlit.in`: add `pheri` as a CNAME to the web deployment below (e.g. Vercel `cname.vercel-dns.com`) and add the domain in the host's settings. No code change: set `EXPO_PUBLIC_BASE_URL=https://pheri.anchorlit.in` as an EAS environment variable (QR links and the Android App Links host follow it, via `apps/mobile/app.config.ts`) and `NEXT_PUBLIC_BASE_URL=https://pheri.anchorlit.in` on the web deployment. At launch, change both values to the main domain and print new stickers.
- [ ] Deploy `apps/admin` (Vercel or similar) on that subdomain with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_URL`, `ANDROID_SHA256_CERT_FINGERPRINTS` (from `eas credentials`, release key). The same deployment serves the admin panel, `/v/<code>`, `/s/<id>`, `/privacy`, `/terms` and `/.well-known/assetlinks.json`.
- [ ] Check `https://<domain>/.well-known/assetlinks.json` returns your fingerprint.
- [ ] Update `SUPPORT_EMAIL` / `SUPPORT_PHONE` in `packages/shared/src/constants.ts` (still placeholders). Have `/privacy` and `/terms` reviewed by a lawyer (DPDP Act); set a grievance officer email in `SUPPORT_EMAIL`. (`APP_NAME` is now Pheri; `PLAY_STORE_URL` follows the app id.)

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
