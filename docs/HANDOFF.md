# Handoff — Pheri v1 (pilot)

The app is now called **Pheri** (chosen 8 Nov; one constant, `APP_NAME`). The repository and internal package names (`@sabzi/*`) keep the working name.

Built in one unattended Claude Code session on 5 Nov 2026. All 13 milestones (M0–M12) are built and tested.

**Update 8 Nov 2026 — testing phase changes:**
- **Login is Google sign-in** (Supabase OAuth, PKCE) **or email sign-in/sign-up with a 6-digit code** (no password; new emails get an account), because SMS OTP needs DLT registration. Both sit behind the consent checkbox on the sign-in screen. The phone OTP screens, `otp-verify`, `send-sms-hook`, the 5-tries block and the MSG91 code are kept but switched off with `AUTH_METHODS.phoneOtp = false` in `packages/shared/src/constants.ts`.
- **The mobile number is collected in profile building** (S-07: name, prefilled from Google, + mobile number), stored without SMS verification in `profile_phones`, readable only by its owner (through functions) and admins. It feeds the vendor "Call" button (when the vendor allows calls) and the admin vendor pages; buyers' numbers are never shown to anyone. Users can change it from Profile.
- **Testing subdomain `https://pheri.anchorlit.in`** is the default base URL; QR links, App Links and the web pages can still be pointed elsewhere with `EXPO_PUBLIC_BASE_URL` / `NEXT_PUBLIC_BASE_URL`, so the launch domain later needs no code change.
- **App id `in.anchorlit.pheri`, deep-link scheme `pheri://`** (changed before any store release, when it is still free to change).

All work is merged to `main` in [PR #1](https://github.com/DurgeshBhusnale/Sabzi/pull/1) (one commit per milestone on the branch, squash-merged; CI `verify`, `database` and `functions` jobs green).

## What was built

| Milestone | Status | Summary |
| --- | --- | --- |
| M0 Repo foundation | Done | pnpm monorepo (Node 22, TS 6), `packages/shared` (tokens, constants, IST/price formatting, geo, status, Zod schemas), Expo SDK 58 app, Next.js 16 admin, Supabase init, CI (verify, database, Deno). |
| M1 Database | Done | 23 tables, enums, triggers (role set once, max 3 societies, 5 open requests), RLS with column grants, buyer-safe views (no phones, no buyer ids), all RPCs with `client_id` idempotency, storage buckets, seed from the brief. |
| M2 Auth | Done | Google sign-in and email-code sign-in/sign-up (current) + profile mobile number; phone OTP with 5-tries block, SMS hook (MSG91) and email OTP built but switched off until DLT; account deletion ("Former user"). |
| M3 Mobile shell | Done | Theme (light/dark/system, buyer/vendor type scales), all 27 components with every state, dev gallery, navigation, auth & account screens S-01…S-16. |
| M4 Vendor | Done | V-01…V-16 (onboarding, Today, 3-tap "Same as yesterday" publish, price editor, camera stock photo < 300 KB, I've arrived with GPS ≤ 300 m, 2 h lock, 5 s undo, live mode, sold out, stops, me, QR, reviews). |
| M5 Buyer | Done | B-01…B-08, B-15, B-16 (society picker, home with live status via Realtime, vendor page, follow, following, notifications, QR route). |
| M6 Push | Done* | `notify` edge function (recipients, opt-outs, quiet hours, §9.1 copy, batches of 100, undo wait), pg_net triggers, 4 PM request digest, in-app banner, open tracking. *Needs FCM/EAS setup to reach real phones. |
| M7 Engagement | Done | Reviews (3-day rule, 7-day edit), requests for tomorrow + vendor grouped tab, evening deal (1/day), reports. |
| M8 Offline | Done | Persisted cache, vendor action queue (retry/backoff/idempotent/stale arrival), X-01…X-17 (dev route), force update/maintenance. |
| M9 Admin | Done | A-01…A-11 with TOTP login (enforced in the database), owner vs field staff. |
| M10 QR | Done* | Web fallback `/v/<code>`, society page, App Links config, A6 sticker & A4 poster PDFs. *Needs the real domain and release key fingerprint. |
| M11 Analytics | Done* | 15 PostHog events (no personal data), SQL pilot metrics, A-02 dashboard. *Needs a PostHog key (dashboard works without it). |
| M12 Release prep | Done | Contrast/a11y pass, EAS profiles, icons/splash, privacy & terms, release checklist. |

Nothing is marked Partial: every feature runs locally and is tested; the items marked * only need your accounts/secrets (listed below) to work in production. Screen-by-screen coverage is in `docs/STATE_COVERAGE.md`; choices are in `docs/DECISIONS.md`; open questions in `docs/QUESTIONS.md`.

### Tests (all passing at handoff)
- `pnpm verify`: shared 95 (Vitest), mobile 256 (Jest + RNTL), admin 12 (Vitest) — plus typecheck and lint.
- Database: 216 pgTAP tests in `supabase/tests` (every RLS policy allow/deny, all business rules, auth, Google sign-up and private mobile number, buyer, notifications, engagement, admin, QR, metrics).
- Edge functions: 20 Deno tests (`supabase/functions/tests`).
- Integration (needs the local stack): 9 tests in `packages/integration` — email sign-up with the code read from the local mail catcher, OTP login, role lock, realtime arrival < 5 s, admin TOTP login → verify vendor → buyer sees him.
- `expo export --platform android` bundles; `next build` passes; `expo-doctor` 19/20 (the last check needs internet access the sandbox didn't have — it runs in CI).

## How to run it locally

Requirements: Node 22, pnpm 9, Docker, Deno 2 (for function tests).

```bash
pnpm install
npx supabase start          # if image pulls fail behind a proxy: SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io npx supabase start
npx supabase db reset       # migrations + seed
pnpm verify
npx supabase test db
pnpm --filter @sabzi/integration test:integration
```

Mobile (needs a development build because of native modules):

```bash
cd apps/mobile
cp .env.example .env.local   # set EXPO_PUBLIC_SUPABASE_ANON_KEY from `npx supabase status`
npx expo run:android         # or: eas build --profile development
```

Admin panel and public QR pages:

```bash
cd apps/admin
cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_ANON_KEY from `npx supabase status`
pnpm dev                     # http://localhost:3001
```

Sample logins (local only). Email sign-in works locally: codes appear in the mail catcher at http://127.0.0.1:54324. Google sign-in works locally once you export the Google client id/secret (see the checklist). The seeded test users use phone OTP `123456`, which stays enabled on the local stack for development and tests even though the app hides it — flip `AUTH_METHODS.phoneOtp` to `true` in a dev build to use them: vendors Ramesh `+91 99999 00001`, Sunita `…02`, Imran `…03`, Ganesh (pending) `…04`; buyers Priya `…11`, Arjun `…12`, Meera `…13`. Admin: `admin@sabzi.example` / `sabzi-admin-dev` (owner), `field@sabzi.example` / `sabzi-field-dev` (field staff) — first login asks you to scan a TOTP QR. In a dev build, Settings → "Dev: components" and "Dev: system states" open the living style guide and X-01…X-17.

## Your to-do list

Full steps are in `docs/RELEASE_CHECKLIST.md`. In short:

1. **Supabase** staging project (Mumbai): `db push`, deploy the functions, set `NOTIFY_SECRET`, `private.settings` notify URL/secret, Google provider + redirect URLs, TOTP MFA, create the owner admin. Keep the Phone provider off.
2. **Email login**: custom SMTP (sender on `anchorlit.in`) and the two code email templates in Supabase.
3. **Google OAuth**: consent screen + Web client in Google Cloud, client id/secret in Supabase → Auth → Providers → Google, redirect `pheri://auth/callback`. *(MSG91/DLT only later, to turn phone OTP back on.)*
4. **FCM**: Firebase project + service-account key in EAS credentials; real EAS project id in `app.json`.
5. **Testing subdomain**: point it at the `apps/admin` deployment; set `NEXT_PUBLIC_BASE_URL` there and `EXPO_PUBLIC_BASE_URL` in EAS; set `ANDROID_SHA256_CERT_FINGERPRINTS`.
6. **Brand**: final name/logo → `APP_NAME`, `assets/brand/mark.svg` (regenerate icons), Play Store URL, support phone/email.
7. **Legal**: review `/privacy` and `/terms` (DPDP), name a grievance officer.
8. **PostHog** key (optional for the pilot).
9. **EAS builds**: preview APK on a 2 GB phone with 3G throttling, then production AAB to the internal testing track.
10. Answer the open questions in `docs/QUESTIONS.md`.
