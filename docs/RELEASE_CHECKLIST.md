# Release checklist — Sabzi pilot

For the owner. Do these in order. Nothing here needs code changes unless noted.

## 0. Get the code onto GitHub
- [ ] Reconnect GitHub for Claude (claude.ai → Settings → Connectors → GitHub) or push the branch `claude/adoring-johnson-tu32pu` yourself — the build session could not push (see `docs/QUESTIONS.md`). Open one PR to `main` and merge it once CI is green.

## 1. Supabase staging project
- [ ] Create a Supabase project in **Mumbai (ap-south-1)**, plan with PITR backups if possible.
- [ ] `npx supabase link --project-ref <ref>` then `npx supabase db push` (applies `supabase/migrations`). Do **not** run `seed.sql` on production; on staging only if you want sample data.
- [ ] Auth → Providers → Phone: enable; Email: enable (OTP length 6). Auth → MFA: enable TOTP.
- [ ] Auth → Hooks → **Send SMS hook** → HTTPS → `https://<ref>.supabase.co/functions/v1/send-sms-hook`; copy the generated secret.
- [ ] Deploy functions: `npx supabase functions deploy send-sms-hook otp-verify notify admin-invite`.
- [ ] Function secrets (`npx supabase secrets set …`): `SEND_SMS_HOOK_SECRET` (from the hook), `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `NOTIFY_SECRET` (random 32+ chars), optional `EXPO_ACCESS_TOKEN`.
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

## 2. MSG91 (SMS OTP)
- [ ] DLT registration (entity + sender ID + OTP template, e.g. "{#var#} is your Sabzi login code. Do not share it."). Put the MSG91 flow template id in `MSG91_TEMPLATE_ID`.
- [ ] Test with a real number on staging. Until this is done, use the test numbers in `supabase/config.toml` only locally.

## 3. Push notifications (FCM via Expo)
- [ ] Create a Firebase project, add Android app `in.sabzi.app`, download `google-services.json` (do not commit it).
- [ ] `eas credentials` → Android → upload the FCM V1 service-account key.
- [ ] `eas init` and put the real EAS project id in `apps/mobile/app.json` → `extra.eas.projectId` (replaces `REPLACE_WITH_EAS_PROJECT_ID`).

## 4. Domain, web pages and App Links
- [ ] Buy the domain. Replace `https://sabzi.example` in `packages/shared/src/constants.ts` (`PUBLIC_BASE_URL`) and the `host` in `apps/mobile/app.json` intent filters.
- [ ] Deploy `apps/admin` (Vercel or similar) on that domain with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANDROID_SHA256_CERT_FINGERPRINTS` (from `eas credentials`, release key). The same deployment serves the admin panel, `/v/<code>`, `/s/<id>`, `/privacy`, `/terms` and `/.well-known/assetlinks.json`.
- [ ] Check `https://<domain>/.well-known/assetlinks.json` returns your fingerprint.
- [ ] Have `/privacy` and `/terms` reviewed by a lawyer (DPDP Act); set a grievance officer email in `SUPPORT_EMAIL`. Also update `SUPPORT_PHONE`, `PLAY_STORE_URL`, `APP_NAME` when the brand is final.

## 5. App build (EAS)
- [ ] `apps/mobile/.env` for EAS: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_POSTHOG_KEY` (set as EAS environment variables).
- [ ] `cd apps/mobile && npx expo-doctor` (all 20 checks; the directory check needs internet).
- [ ] `eas build --profile preview --platform android` → install the APK on a 2 GB RAM phone.
- [ ] Manual pilot run (TECH_SPEC §12) on 3G throttling: buyer gets an arrival alert and opens the vendor page; vendor publishes the morning menu with "Yesterday" and taps "I've arrived"; offline: publish with mobile data off, turn it on, check it sends.
- [ ] `eas build --profile production --platform android` (AAB) → `eas submit --profile production` → Play Console **internal testing** track; add the pilot testers.

## 6. Pilot data
- [ ] In the admin panel: add the 10–15 societies with gates (coordinates from Google Maps), items (pictures optional), then vendors verify themselves in the app and you assign stops in the planner.
- [ ] Print stickers (A6, vendor page → "QR sticker (PDF)") and society posters (A4, society page).

## 7. Analytics
- [ ] PostHog project (EU host), key in `EXPO_PUBLIC_POSTHOG_KEY`. Dashboard numbers in the admin panel do not depend on PostHog.

## 8. Before each release
- [ ] `pnpm verify`, `npx supabase db reset && npx supabase test db`, `cd supabase/functions && deno test --allow-env --allow-read --allow-net`, integration tests (`pnpm --filter @sabzi/integration test:integration`) — all green in CI.
- [ ] Bump `version` in `apps/mobile/app.json`; set `latest_app_version` (and `min_app_version` if old apps must update) in admin **Settings**.
