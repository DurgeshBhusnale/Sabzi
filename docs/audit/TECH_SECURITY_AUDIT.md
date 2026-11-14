# Pheri v1 — Technical + Security Audit (pre-tester APK)

Date: 2026-11-14 · Scope: `main` @ `40cdb12` · Audit only: nothing was fixed in this pass.

---

## 0. Fix progress and owner actions (kept current by the fix PRs)

Code fixes land through `fix/<ids>` PRs; each row's Status in §2 says Fixed (PR) or Blocked (reason). The items below need **you**. Nothing here was done from the code sessions: no dashboard change, no deploy, no `eas build`/`eas update`.

### Owner actions (do in this order)

- [ ] **Deploy the hardened edge functions** (SEC-02, SEC-12, SEC-16): `npx supabase functions deploy notify send-sms-hook admin-invite --project-ref <ref>`
- [ ] **Set the notify secret in both places, same value** (SEC-02). From this deploy on, `notify` refuses every call without it, so pushes stop until both are set:
  ```bash
  SECRET=$(openssl rand -hex 32)
  npx supabase secrets set NOTIFY_SECRET=$SECRET --project-ref <ref>
  # SQL editor (hosted):
  insert into private.settings (key, value) values ('notify_secret', '<SECRET>')
    on conflict (key) do update set value = excluded.value;
  ```
  Check: `curl -s -o /dev/null -w '%{http_code}' -X POST https://<ref>.supabase.co/functions/v1/notify -d '{}'` prints `403`; a real "I've arrived" still pushes.
- [ ] `send-sms-hook` now rejects every call without `SEND_SMS_HOOK_SECRET`. Phone OTP is off, so nothing to do until SMS is turned on; then set the secret from Auth → Hooks.

---

## 1. Summary

### Verdict: **NO-GO as things stand. Likely GO tomorrow once the P0 list is cleared (all small).**

Email sign-in, one of the two ways to log in, fails for every user today (TECH-01). The fastest fix is one dashboard setting (1 minute, no new build). The other P0s are hosted-project settings I could not see from this session. The connected Supabase account has no Pheri project, so they are marked **Needs check**. Each takes minutes in a dashboard.

The code itself is in good shape for a 10–15 person test:
- `pnpm verify` passes (typecheck, lint, 256 mobile + 17 admin + shared tests).
- All 216 pgTAP tests pass.
- RLS is on for every table, and `anon` can only read `app_settings`.
- Every SECURITY DEFINER function pins `search_path=''`.
- The phone-number and rating rules are enforced in Postgres, not only in the UI.
- No real secret was ever committed to git history.

### P0 — must be done before the APK link goes out (5)

| ID | What | Who | Effort |
| --- | --- | --- | --- |
| TECH-01 | Email code is 8 digits on hosted Supabase; the app only accepts 6, so every email sign-in/sign-up fails | Owner (dashboard: set OTP length to 6) **or** code fix + OTA | S |
| SEC-01 | Email delivery: Supabase's built-in SMTP only sends to project team members and only ~2 emails/hour, so testers won't get codes | Owner (custom SMTP + rate limit) — **Needs check** | S |
| SEC-02 | `notify` edge function skips the secret check when `NOTIFY_SECRET` is unset; anyone can replay arrival/deal pushes to all followers | Owner (set the secret in 2 places) — **Needs check** | S |
| SEC-03 | Google sign-in: OAuth consent screen in "Testing" mode blocks non-listed testers; `pheri://auth/callback` must be in the Supabase redirect allow-list | Owner — **Needs check** | S |
| TECH-03 | Build/OTA env: `eas.json` profiles don't pin an EAS `environment`, and the app silently falls back to `http://10.0.2.2:54321` with an empty key; one wrong `eas update` can point every tester's app at nothing | Owner check + 1-line config | S |

The known back-navigation bug (TECH-02) is **P1**. It annoys people but blocks no one, and the fix is small and can ship over the air.

---

## 2. Issue table

| ID | Severity | Area | Flow | File:line | Status |
| --- | --- | --- | --- | --- | --- |
| TECH-01 | P0 | Auth | Email sign-in/up, add email | `apps/mobile/app/(auth)/email.tsx:46`, `apps/mobile/src/ui/OtpInput.tsx:18,68,72`, `apps/mobile/app/account/email.tsx:46` | Open |
| TECH-03 | P0 | EAS / config | Build, OTA | `apps/mobile/eas.json:9-18`, `apps/mobile/src/lib/supabase.ts:7-8` | Open (Needs check) |
| SEC-01 | P0 | Auth / email | Email sign-in/up | Hosted dashboard (Auth → SMTP) | Open (Needs check) |
| SEC-02 | P0 | Edge function | Push notifications | `supabase/functions/notify/handler.ts:136-137`, `supabase/migrations/20261105000900_notifications.sql:22,30` | Fixed in code (PR_LINK); owner: set secret, deploy |
| SEC-03 | P0 | Auth / Google | Google sign-in/up | Google Cloud console, Supabase Auth → URL config | Open (Needs check) |
| TECH-02 | P1 | Navigation | Onboarding → sign-in | `apps/mobile/app/(auth)/welcome.tsx:15,42-43`, `apps/mobile/src/features/auth/session.tsx:74-77`, `apps/mobile/app/(auth)/email.tsx:58` | Open |
| TECH-04 | P1 | Session | Cold start (signed in, bad network) | `apps/mobile/src/features/auth/session.tsx:41-46`, `apps/mobile/src/features/auth/api.ts:198-199` | Open |
| TECH-05 | P1 | Sign-out | Account → Log out / delete | `apps/mobile/src/features/auth/api.ts:186-195`, `apps/mobile/app/account/settings.tsx:62-67` | Open |
| TECH-06 | P1 | Stability | All screens | no `ErrorBoundary` export in `apps/mobile/app/**` | Open |
| TECH-07 | P1 | OTA | Updates to installed APKs | `apps/mobile/app.json` (`runtimeVersion.policy: appVersion`) | Open |
| TECH-08 | P1 | Kill switch | Force update (X-11) | `apps/mobile/src/features/system/AppStatusGate.tsx:22,28`, `packages/shared/src/constants.ts:20` | Open |
| TECH-09 | P1 | Push | Tap notification from killed app | `apps/mobile/src/features/notifications/NotificationsProvider.tsx:29-35,69` | Open (Needs check) |
| SEC-04 | P1 | Privacy | Account delete | `delete_my_account()` in `supabase/migrations/20261108000100_google_signin.sql` (current def), storage buckets | Open |
| SEC-05 | P1 | Privacy | Testers vs demo data | `supabase/seed.sql` on hosted DB | Open (Needs check) |
| SEC-06 | P1 | Privacy | Privacy policy reachable | `apps/mobile/app/account/settings.tsx:40`, `apps/mobile/app/(auth)/signin.tsx:59` → `https://pheri.anchorlit.in/privacy` | Open (Needs check) |
| SEC-07 | P1 | Admin | Admin login MFA | `public.admin_mfa_ok()` reads `private.settings.admin_require_mfa` | Open (Needs check) |
| SEC-08 | P2 | DB | Anon RPCs | `public.setting_int`, `public.email_login_available`, `public.otp_status`, `public.record_qr_scan` | Open |
| SEC-09 | P2 | Storage | Public bucket listing | policy "vendor photos: public read" (`supabase/migrations/20261105000400_storage_settings.sql`) | Open |
| SEC-10 | P2 | DB | Verified vendor can rename / change photo freely | `supabase/migrations/20261105000200_rls.sql:72-73,92-93` | Open |
| SEC-11 | P2 | Abuse | Open sign-up; multi-account fake reviews | Auth settings; `submit_review` | Open |
| SEC-12 | P2 | Edge function | `send-sms-hook` fails open without its secret | `supabase/functions/send-sms-hook/handler.ts:18-19` | Fixed (PR_LINK) |
| SEC-13 | P2 | App storage | Session tokens in AsyncStorage + Android backup | `apps/mobile/src/lib/supabase.ts:16`, `apps/mobile/app.json` (`android.allowBackup` unset) | Open |
| SEC-14 | P2 | Deep links | `v/[code]`, `s/[id]` params not validated | `apps/mobile/app/v/[code].tsx:24`, `apps/mobile/app/s/[id].tsx:17-21` | Open |
| SEC-15 | P2 | DB hygiene | `authenticated` holds TRUNCATE + write grants on views | Supabase default grants (see §3) | Open |
| SEC-16 | P2 | Edge function | `admin-invite` returns raw GoTrue error text; CORS `*` | `supabase/functions/admin-invite/handler.ts:25`, `supabase/functions/_shared/http.ts:2` | Fixed: error codes (PR_LINK); CORS `*` kept, bearer-auth only |
| SEC-17 | P2 | Storage | `item-images` allows `image/svg+xml` | bucket config | Open |
| TECH-10 | P2 | Session | No AppState start/stop of token auto-refresh | `apps/mobile/src/lib/supabase.ts:13-19` | Open |
| TECH-11 | P2 | Images | Compressor can return a file over the bucket limit | `apps/mobile/src/features/vendor/photos.ts:27-34` | Open |
| TECH-12 | P2 | Offline queue | Queued stock photo keeps a temp-cache URI | `apps/mobile/src/lib/offline/executor.ts:41` | Open |
| TECH-13 | P2 | Navigation | Sign-out fires two competing redirects | `apps/mobile/app/account/settings.tsx:66` + `apps/mobile/app/(buyer)/_layout.tsx:22` | Open |
| TECH-14 | P2 | Lint | Duplicate import warnings | `apps/mobile/__tests__/google-signin.test.tsx:4,23` | Open |

---

## 3. Issues in detail

### TECH-01 (P0): Email OTP is 8 digits, the app accepts 6. Every email sign-in fails.

**What happens.** A tester enters an email and receives an 8-digit code. The 6 boxes fill with the first 6 digits, and the app sends those 6 to Supabase. Supabase rejects them, and the tester sees "That code is wrong." Typing or pasting the full code makes no difference, because the input drops everything after digit 6. "Add email" in Account has the same bug.

**Reproduce.** Use a preview build against the hosted project: Sign in → tick consent → Continue with email → Send code → paste the 8-digit code from the email.

**Root cause.**
- The hosted project's **Auth → Providers → Email → Email OTP Length** is 8. `supabase/config.toml:234` (`otp_length = 6`) only configures the local stack and is never pushed to the hosted project.
- The app hard-codes 6 in four places:
  - `apps/mobile/src/ui/OtpInput.tsx:18` defaults `length = 6`.
  - `OtpInput.tsx:68` slices input to `length`, and `:72` sets `maxLength={length}`.
  - `apps/mobile/app/(auth)/email.tsx:46` (`if (v.length < 6) return;`) verifies at exactly 6.
  - `apps/mobile/app/account/email.tsx:46` does the same.
- `packages/shared/src/schemas.ts:22` `otpSchema` is `^\d{6}$`. Email verify doesn't use it, but the phone path does.
- Note: the line you cited, `otp.tsx:62`, is the **phone** OTP screen, which can't be reached while `AUTH_METHODS.phoneOtp=false`. The email flow uses `email.tsx`.
- Tests didn't catch this because every test assumes 6 digits.

**Exact fix.**
1. **Tonight (no build):** Supabase dashboard → Authentication → Sign In / Providers → Email → **Email OTP Length = 6** → Save. Also set **Email OTP Expiration = 600** to match the 10-minute copy in the templates. Codes already sent stay 8 digits, so ask testers to request a new one.
2. **Code hardening (ship by OTA):**
   - Add `EMAIL_OTP_LENGTH = 6` to `packages/shared/src/constants.ts` (`LIMITS`).
   - Pass `length={LIMITS.emailOtpLength}` to both email `OtpInput`s.
   - Replace `v.length < 6` with `v.length < LIMITS.emailOtpLength` in `email.tsx:46` and `account/email.tsx:46`.
   - Make the `OtpInput` accessibility label use `length` instead of the literal "6-digit".
   - Add a Jest test that renders `EmailLogin` with `length=8` and checks `verify` is called with all 8 digits.

**Effort.** S.

**Verify.** Hosted: send a code and confirm the email shows 6 digits; sign in on a preview build with a brand-new email and with an existing one. Code: the new Jest test passes.

---

### TECH-03 (P0): Builds and OTA updates can bundle the wrong Supabase env (or none)

**What happens.** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are inlined into the JS bundle when it is built. If they are missing, the app silently uses `http://10.0.2.2:54321` and an empty key (`apps/mobile/src/lib/supabase.ts:7-8`), and every screen fails with "No internet." The `preview` profile in `apps/mobile/eas.json:9-14` has no `env` and no `environment`, so the values come from:
- EAS environment variables, for `eas build`;
- whatever `.env` is on the machine, for `eas update`, unless you pass `--environment`.

An `eas update --channel preview` run from a laptop with a local `.env` pointing at `127.0.0.1` would ship that URL to every tester over the air.

**Root cause.** The profile doesn't pin an EAS environment, and the client falls back silently instead of failing loudly.

**Exact fix.**
1. In `eas.json`, add `"environment": "preview"` to `build.preview`, `"environment": "production"` to `build.production`, and `"environment": "development"` to `build.development`.
2. Always publish with `eas update --channel preview --environment preview --message "…"`. Put that command in an npm script (`"update:preview"`) so nobody types it by hand.
3. In `supabase.ts`, make release builds fail loudly when the URL is missing or points at a local address. For example, when `!__DEV__ && (!process.env.EXPO_PUBLIC_SUPABASE_URL || url.includes('10.0.2.2') || url.includes('127.0.0.1'))`, show a blocking "Misconfigured build" system screen instead of falling back.

**Effort.** S.

**Verify.**
- `eas env:list --environment preview` lists `EXPO_PUBLIC_SUPABASE_URL` (`https://<ref>.supabase.co`) and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or publishable key), and nothing secret (see §4).
- After the build, open the app → Sign in with Google; it must reach Google.
- In the EAS dashboard → Updates, check the update's environment.

---

### SEC-01 (P0, Needs check): Email codes won't reach testers on Supabase's built-in SMTP

**What happens.** On the built-in email service, Supabase sends auth emails only to addresses that are members of the project's organisation, with a project-wide limit of about 2 emails per hour. You received codes because your address is on the team. Family and friends signing up tomorrow will get nothing, or hit "Too many requests" after the second email.

**Check.** Dashboard → Authentication → Emails → SMTP Settings. If "Enable custom SMTP" is off, this applies.

**Fix.**
- Turn on custom SMTP (Resend, Brevo, ZeptoMail or SES), with the sender on `anchorlit.in` and SPF/DKIM set up.
- Then Authentication → Rate Limits → "Rate limit for sending emails" ≈ 30/hour.
- Keep `max_frequency` (per-user resend) at 30–60 s.

**Effort.** S (about 30 min including DNS).

**Verify.** Sign up with an address that is not on the team (a Gmail you don't use for Supabase). The code arrives within a minute and isn't in spam.

---

### SEC-02 (P0, Needs check): `notify` edge function accepts unauthenticated calls when `NOTIFY_SECRET` is unset

**What happens.** `notify` is deployed with `verify_jwt = false` (`supabase/config.toml:476`), and `handler.ts:136-137` only checks the header **if** the secret is set:

```ts
const secret = deps.env('NOTIFY_SECRET');
if (secret && req.headers.get('x-notify-secret') !== secret) return json({ error: 'forbidden' }, 403);
```

Without the secret, anyone who knows the function URL can POST `{"kind":"stop_event","ref":"<event id>"}` and re-send an "arrived" push to every follower of that stop, as often as they like. That bypasses the 2-hour and one-deal-a-day rules, which are only enforced when the event is created. The function URL is predictable: `https://<ref>.supabase.co/functions/v1/notify`. Event ids are visible to every signed-in user, because `stop_events_select` lets authenticated users read the last 24 h of verified vendors' events.

**Check.**
- Dashboard → Edge Functions → Secrets: `NOTIFY_SECRET` exists.
- SQL editor: `select key from private.settings;` lists `notify_url` and `notify_secret`. The trigger (`20261105000900_notifications.sql:22,30`) sends `coalesce(v_secret,'')`.

**Fix.**
- Owner: generate 32+ random bytes and set them as the function secret `NOTIFY_SECRET` and as `private.settings.notify_secret`, with the same value in both.
- Code: make the check **fail closed**: `if (!secret || !timingSafeEqual(header, secret)) return 403`. Add a Deno test for "no secret configured → 403".

**Effort.** S.

**Verify.** `curl -X POST https://<ref>.supabase.co/functions/v1/notify -d '{"kind":"stop_event","ref":"00000000-0000-0000-0000-000000000000"}'` returns 403. A real "I've arrived" still delivers a push.

---

### SEC-03 (P0, Needs check): Google sign-in configuration for outside testers

**Check and fix.**
1. Google Cloud console → APIs & Services → OAuth consent screen → **Publishing status**. If it is "Testing", only listed test users (up to 100) can sign in; everyone else sees "Access blocked." Add every tester's Gmail under Test users, or publish the app. With only email/profile/openid scopes, publishing needs no verification.
2. Supabase → Authentication → URL Configuration → Redirect URLs contains exactly `pheri://auth/callback`. Add `exp+pheri://auth/callback` only if you use dev builds. **Site URL** is `https://pheri.anchorlit.in`. Remove any `http://localhost*` or wildcard entries you don't need.
3. Supabase → Auth → Providers → Google: the Client ID/Secret match the **Web** OAuth client, and that client's Authorised redirect URI is `https://<ref>.supabase.co/auth/v1/callback`.

**Effort.** S.

**Verify.** A Gmail account that isn't yours, on a preview build, can sign in and land on role select.

---

### TECH-02 (P1): Back from sign-in returns to the onboarding carousel

**What happens.**
- Welcome (S-02) → Get started / Log in → Sign in. Hardware back, or the swipe gesture, goes back to the welcome carousel instead of leaving the app.
- Signed-out cold starts, sign-out, and session failures (TECH-04) always start at the carousel again, on slide 1.
- On the email screen, hardware back after "Send code" closes the whole screen. Only the header back arrow returns to the email field.

**Reproduce.** Preview build, signed out: open the app → Log in → press the system back button or swipe from the edge.

**Root cause.**
1. `apps/mobile/app/(auth)/welcome.tsx:42-43` uses `router.push('/(auth)/signin')`, so welcome stays underneath sign-in in the `(auth)` stack. `(auth)/_layout.tsx` has no `BackHandler` and no `gestureEnabled: false` / `unstable_settings`. Android back simply pops to welcome.
2. The app has no "onboarding seen" flag. `homeFor('phone')` (`src/features/auth/session.tsx:76-77`) always returns `/(auth)/welcome`, and so does `'admin'` (`:84-85`). The `(buyer)` and `(vendor)` layouts (`_layout.tsx:22` and `:73`) redirect signed-out users to welcome too. Every signed-out entry point therefore starts at the carousel.
3. The slide index is local state (`welcome.tsx:15`). Whenever welcome is remounted by one of those redirects, it restarts at slide 1. **Needs check on device:** whether a plain pop keeps the last slide (it should with native-stack) or a redirect remounts it. Either way, the fix below covers both.
4. `email.tsx:58` handles back only in the header (`sent ? setSent(false) : router.back()`); the hardware back button skips that logic.

**Exact fix.**
- Store `sabzi.onboardingSeen = '1'` in AsyncStorage on Get started, Log in, or Skip to the end.
- In welcome, call `router.replace('/(auth)/signin')` instead of `push`. Sign-in becomes the root of the signed-out stack, so back leaves the app, which is the normal Android behaviour.
- Make `homeFor('phone')` return `/(auth)/signin` when `onboardingSeen`. Point the `(buyer)` and `(vendor)` signed-out redirects at `'/'` so `index.tsx` decides.
- In `email.tsx`, add a focus-scoped `BackHandler` (`useFocusEffect`) that runs `setSent(false)` while `sent` is true. Optionally do the same for the welcome carousel so back goes to the previous slide.
- Add Jest tests: welcome → signin uses replace, and a hardware back on email with `sent=true` keeps the screen.

**Effort.** S. JS only, so it can ship by OTA.

**Verify.** On a device: fresh install → Log in → back exits the app. Reopen → Sign in shows directly, with no carousel. Email → Send code → back → the email field is still filled.

---

### TECH-04 (P1): A signed-in user with a network blip lands on onboarding

**What happens.** On cold start, `SessionProvider.load` (`session.tsx:41-46`) catches a failed `getMyAccount()` and sets `account = null` with `status = 'signedIn'`. `nextAuthStep(null)` (`api.ts:198-199`) then returns `'phone'`, so `index.tsx` sends a **signed-in** buyer or vendor to the welcome carousel. Opening the app on weak 2G at the gate (the vendor's normal case) can therefore look like "I got logged out."

**Fix.**
- Keep the last good `MyAccount` in AsyncStorage and use it when the fetch fails.
- Add a `status: 'error'` state that shows X-01/X-02 with a Retry button instead of routing.
- Never map `signedIn + account=null` to `'phone'`.

**Effort.** S–M.

**Verify.** Turn on airplane mode, cold-start while signed in → you see cached home or an offline screen, not the carousel. Jest: `load` with a rejecting `getMyAccount` doesn't produce step `'phone'`.

---

### TECH-05 (P1): Sign-out and account delete leave the previous user's data on the device

**What happens.** `signOut()` (`api.ts:193-195`) only clears the auth session. It leaves:
- the **push token on the profile**, so the device keeps getting the old account's arrival alerts after a family member logs in with another account (until the new login overwrites it);
- the **persisted React Query cache** (`sabzi.queryCache.v1`, 24 h): followed vendors, requests and notifications are briefly shown to the next account;
- the **offline action queue** (`sabzi.actionQueue.v1`), whose queued vendor actions would replay under the next account (the server rejects them by role, but they show as failures);
- the pending deep-link route.

`deleteAccount()` (`api.ts:186-190`) has the same gaps on the device side.

**Fix.** Add a `signOutEverywhereOnDevice()` that:
1. runs `rpc('save_push_token', { p_token: null })` (or a new `clear_push_token()` RPC) **before** `auth.signOut`;
2. runs `queryClient.clear()` and `AsyncStorage.multiRemove(['sabzi.queryCache.v1','sabzi.actionQueue.v1','sabzi.pendingRoute'])`;
3. clears the queue in `OfflineProvider`.

Use it in Settings (`settings.tsx:62-67`) and Delete. `save_push_token` would need to accept null, or add a dedicated RPC.

**Effort.** S.

**Verify.** Sign in as buyer A, follow a vendor, sign out, sign in as buyer B → B's Following tab is empty on first paint. Vendor "I've arrived" → A's device gets no push.

---

### TECH-06 (P1): No error boundaries

**What happens.** No route exports `ErrorBoundary`; `grep -rn ErrorBoundary apps/mobile/app` finds nothing. Any render-time exception, such as a null field in an RPC payload or a bad deep-link param, kills the JS tree. A release build shows a blank screen or closes, and testers will call it "the app crashes."

**Fix.**
- Export `ErrorBoundary` from `app/_layout.tsx`, using expo-router's `ErrorBoundaryProps`. It should show the X-xx "Something went wrong" system screen with **Try again** (`retry()`) and **Go home**.
- Add one in `(buyer)/_layout.tsx` and `(vendor)/_layout.tsx` so tabs survive.
- Optionally add Sentry (`@sentry/react-native` via the Expo plugin) with `sendDefaultPii: false`.

**Effort.** S.

**Verify.** A temporary throwing component in a dev build shows the boundary screen, and Try again recovers.

---

### TECH-07 (P1): `runtimeVersion: appVersion` lets a native change crash installed APKs

**What happens.** Installed APKs take an OTA update only when its runtime version matches the app version, and `version` is `0.1.0`. If anyone adds or upgrades a native module (an Expo SDK bump, a new `expo-*` package, a config plugin change) and runs `eas update` **without** bumping `version`, the new JS reaches old binaries that lack the native code. They crash on launch, and the only fix is reinstalling the APK.

**Fix.**
- Switch to `"runtimeVersion": { "policy": "fingerprint" }`. This needs `expo-updates` ≥ the SDK 52 line, which you have. The runtime then changes automatically whenever the native layer changes, and old APKs simply stop receiving incompatible updates.
- Then always ship a native change as a new APK (`eas build --profile preview`) and tell testers to reinstall.

**Effort.** S.

**Verify.** `npx expo-updates fingerprint:generate` before and after adding a native package gives different hashes. `eas update` output shows the fingerprint runtime.

---

### TECH-08 (P1): The kill switch exists but its button points to the Play Store

**What happens.**
- The good part: `AppStatusGate` reads `app_settings` (anon-readable) and can force-update (X-11), show an optional update (X-12) or put the app in maintenance (X-13). That is a real minimum-version and kill switch, controlled from the database.
- The problem: X-11 and X-12 send users to `PLAY_STORE_URL` (`AppStatusGate.tsx:28`, `packages/shared/src/constants.ts:20`). The app isn't on Play yet, so testers forced to update end up on a dead page. Also, `version` comes from `Constants.expoConfig.version` (`AppStatusGate.tsx:18`), which an OTA update doesn't change. That's correct for native-only force updates, but it can't force an OTA.

**Fix.**
- Add `app_settings.update_url` (public). Use it when set, otherwise Play. For testers, set it to the EAS internal-distribution install link.
- Know the levers: `min_version` (force a new APK), `maintenance` (stop everyone), and for JS-only emergencies, `eas update:rollback` or republishing a previous update.

**Effort.** S.

**Verify.** Set `min_version` above `0.1.0` on staging → X-11 → the button opens the APK link.

---

### TECH-09 (P1, Needs check): Tapping a push while the app is killed may open nowhere, or crash

**What happens.**
- `NotificationsProvider` only uses `addNotificationResponseReceivedListener` (`NotificationsProvider.tsx:69`). On a cold start from a notification tap, the response that launched the app can arrive before the listener is attached, or before the root navigator mounts. In the first case the tap opens Home instead of the vendor. In the second, `router.push` (`:35`) throws "navigate before mounting the Root Layout."
- The tap target is also pushed without checking that someone is signed in or what role they have.

**Fix.**
- Use `Notifications.useLastNotificationResponse()` (or `getLastNotificationResponseAsync()` once on mount).
- Route only when `status === 'signedIn'` and the role matches.
- Defer navigation until the router is ready (`useRootNavigationState()?.key`), or go through `setPendingRoute`, which index already consumes.

**Effort.** S.

**Verify.** Kill the app → send an arrival → tap it → the vendor page opens. Do the same while signed out → the sign-in screen opens and goes to the vendor page after login.

---

### SEC-04 (P1): Account delete keeps photos and the auth user row

**What happens.** `delete_my_account()` scrubs profile fields, follows, societies, waitlist, notifications, identities and sessions, and nulls the email and phone on `auth.users`. It also bans the user. It **doesn't**:
- delete Storage objects: vendor photo (`vendor-photos`, public), stock photos, PMC document (`pmc-docs`), report photos;
- delete the `auth.users` row, the vendor row (display name stays, status `suspended`), `profile_phones` (**Needs check**: the trigger `delete_profile_phone_on_delete` exists, so confirm it fires on this update path), `app_opens`, `qr_scans`, `vendor_page_views` or `action_log`.

Reviews stay public under "Former user", which is by design.

For a family-and-friends test, the gap that matters is that a vendor's face photo stays publicly readable after "delete."

**Fix.**
- Add an edge function `delete-account` (service role, `verify_jwt=true`). It should call the RPC, then `storage.from(b).remove()` everything under `<uid>/` in all four buckets, then `auth.admin.deleteUser(uid, true)` (soft delete).
- Alternatively, delete the vendor's `display_name` and `photo_path` and the `profile_phones` row in SQL now.
- Update the privacy policy text to say exactly what is kept.

**Effort.** M.

**Verify.** Make a test vendor with a photo → delete → its `photo_path` public URL returns 400/404, and `select * from profile_phones where user_id=…` is empty.

---

### SEC-05 (P1, Needs check): Testers' data mixed with seed/demo data

**Check.** Run `select count(*) from profiles;` and `select display_name, status from vendors;` on the hosted DB. If `supabase/seed.sql` was ever applied there, it contains demo vendors (Ramesh Sabzi…) on test numbers `+9199999000xx` and demo buyers. Testers would follow fake vendors, and the pilot metrics would include them.

**Fix.** Either don't seed the hosted DB and create the demo vendors through the real flow, or keep the seed vendors and mark them `status_reason='demo'` so they can be excluded from metrics. Never seed `auth.users` with real-looking numbers.

**Effort.** S.

---

### SEC-06 (P1, Needs check): The privacy policy must actually be reachable

In the app, Sign in (`signin.tsx:59`) and Settings → Privacy (`settings.tsx:40`) open `${PUBLIC_BASE_URL}/privacy` = `https://pheri.anchorlit.in/privacy`, which the Next.js admin app serves (`apps/admin/app/privacy/page.tsx`).

**Check.** That URL loads on a phone, and the text names the data you collect: name, mobile number, email, follows, reviews, photos, push token, PostHog anonymous events.

**Effort.** S.

---

### SEC-07 (P1, Needs check): Admin 2-step login must be enforced on hosted

`is_admin()` and `is_owner()` require `admin_mfa_ok()`: the JWT `aal = aal2`, **unless** `private.settings.admin_require_mfa` is not `'true'`.

**Check.** `select value from private.settings where key='admin_require_mfa';` returns `true`, and Auth → MFA has TOTP enabled.

Otherwise the server-side checks are solid. The admin panel is client-only, with no server actions, no service-role key, and no API routes except `assetlinks.json`. Every read and write goes through RLS or RPCs that call `require_admin()` (24 call sites), so a non-admin JWT gets nothing even with the UI guard bypassed.

---

### SEC-08 (P2): Anon-callable helper functions leak small facts

Every public function is executable by `anon`. Most check `auth.uid()` or the role, but these don't:

| Function | What it leaks |
| --- | --- |
| `setting_int(key)` | Returns **any** `app_settings` value castable to int, including non-public rows (RLS is bypassed by SECURITY DEFINER) |
| `email_login_available(email)` | Whether an email belongs to a verified account with a phone (account enumeration) |
| `otp_status(phone)` | Whether a phone is OTP-blocked |
| `record_qr_scan` | Unauthenticated inserts; can inflate scan metrics |

`vendor_page`, `v_vendor_today`, `menu_json` and `vendors_in_area` are also anon-callable. They return only verified-vendor public data, which is acceptable.

**Fix.**
- Add a new migration with `revoke execute on function … from anon, public;` for `setting_int`, `email_login_available`, `otp_status`, `follower_count`, `event_open_count`, `review_vendor`, `is_verified_vendor`, `vendors_in_area`, `menu_json`, `vendor_*` helpers. Keep `public_vendor_card`, `public_society_card` and `record_qr_scan` for the web pages.
- Also consider `alter default privileges in schema public revoke execute on functions from anon, public;`.
- Add pgTAP tests: `function_privs_are('anon', …)`.

**Effort.** S.

---

### SEC-09 (P2): Public buckets are listable, including unverified vendors' photos

The storage policy "vendor photos: public read" is `SELECT` for role `public` on `vendor-photos`, `stock-photos` and `item-images`. Public buckets already serve files by URL without a policy, so this policy only adds **listing**. Anyone with the anon key can enumerate every object, including photos of vendors who are not verified yet, and the folder names (user UUIDs).

**Fix.** Drop the policy (files stay readable by public URL). If the app lists anything, scope that to the owner's folder.

**Effort.** S.

---

### SEC-10 (P2): A verified vendor can change name and photo without re-verification

Column grants (`20261105000200_rls.sql:72-73`) let a vendor update `display_name`, `photo_path`, `vehicle_no` and so on at any time. Verification doesn't cover later edits.

**Fix.** Add a trigger that sets `status='pending'`, or flags for review, when a verified vendor changes `display_name`, `photo_path` or `pmc_*`. Alternatively, accept the risk for the test and note it.

**Effort.** S.

---

### SEC-11 (P2): Open sign-up means one person can create several buyers

Email sign-up creates an account for any address (`shouldCreateUser: true`, `api.ts:101`). The rating rules are enforced server-side, so `submit_review` uses `review_eligibility` and the `UNIQUE(vendor_id, buyer_id)` constraint. But one person with 3 Gmail addresses can still post 3 ratings after 3 days.

This is fine for a closed test. Before the public pilot, consider requiring a verified phone to rate.

Also turn on **Auth → Bot and Abuse Protection (CAPTCHA)** or keep the email rate limit low.

---

### SEC-12 (P2): `send-sms-hook` fails open without `SEND_SMS_HOOK_SECRET`

`handler.ts:18-19` has the same fail-open pattern as SEC-02. Phone OTP is off and MSG91 isn't configured, so there is no impact today.

**Fix.** Fail closed, or don't deploy the function until SMS is enabled.

---

### SEC-13 (P2): Session tokens in AsyncStorage, with Android backup allowed

The Supabase session, including the refresh token, is stored in plain AsyncStorage (`supabase.ts:16`). It sits inside the app sandbox, which is normal for Expo apps, but `android.allowBackup` isn't set to `false`. The token can therefore end up in a Google Drive or ADB backup and be restored onto another device.

**Fix.**
- Set `"android": { "allowBackup": false }`, which needs a new APK.
- Optionally use an `expo-secure-store` adapter for the auth storage key only. Note SecureStore's 2 KB value limit: use a chunked or LargeSecureStore adapter.

---

### SEC-14 (P2): Deep-link params aren't validated

- `v/[code].tsx:24` stores `/v/${code}` as the pending route without checking the code format.
- `s/[id].tsx:17-21` calls `saveSociety(id)` with any string and silently saves the society, with no confirmation.

The server validates both, so this is not exploitable today. Still, a crafted link such as `pheri://v/x%2F..%2Faccount%2Fdelete` turns into a stored redirect.

**Fix.** Validate `code` against `^[A-Z0-9]{4,10}$`, or the generator's format, and `id` as a UUID (Zod in `packages/shared`), and show X-14 otherwise. Let the buyer confirm "Add <society>?" before saving.

---

### SEC-15 (P2): Broad default grants

`authenticated` holds `TRUNCATE`, and `INSERT`/`UPDATE`/`DELETE` on the views `v_vendor_public`, `v_review_public` and `v_vendor_requests`. I checked both:
- The views are **not** updatable (`information_schema.views.is_updatable = NO`).
- PostgREST can't issue TRUNCATE.

So there is no exploit, only hygiene.

**Fix.** Add a new migration with `revoke truncate on all tables in schema public from authenticated, anon;` and `revoke insert, update, delete on v_vendor_public, v_review_public, v_vendor_requests from authenticated;`.

---

### SEC-16 (P2): `admin-invite` error text, and CORS `*`

- `handler.ts:25` returns GoTrue's raw `error.message` to the browser. That is minor and visible only to the owner.
- `Access-Control-Allow-Origin: *` on all functions (`_shared/http.ts:2`). The functions are bearer-token or secret based, so the risk is low.

**Fix.** Map errors to codes. Set the allowed origin to `https://pheri.anchorlit.in` for `admin-invite`.

---

### SEC-17 (P2): The `item-images` bucket accepts SVG

Only admins can upload, but SVG served from the storage domain can carry script. Drop `image/svg+xml` from the bucket's allowed types.

---

### TECH-10 (P2): Token auto-refresh isn't tied to AppState

Supabase's React Native guidance is to call `supabase.auth.startAutoRefresh()` when the app becomes active and `stopAutoRefresh()` when it goes to the background. Without that, the 1-hour access token can be expired on resume, and the first calls fail with 401 until the refresh catches up.

**Fix.** Add the AppState listener in `supabase.ts`, or in `SessionProvider`.

---

### TECH-11 (P2): The image compressor can return a file that's still too big

`compressUnder` (`photos.ts:27-34`) returns `kind: 'ok'` even after the last step if the file is still over `maxBytes`. The `stock-photos` bucket (300 KB limit) then rejects the upload with a generic error.

**Fix.** Return `{ kind: 'too_big' }`, or add a 480 px / 0.35 step, and show a clear message.

---

### TECH-12 (P2): The offline queue keeps a temporary photo URI

A queued stock photo stores the ImageManipulator cache URI (`executor.ts:41`). If Android clears the cache before the network comes back, the queued upload fails for good.

**Fix.** Copy the file into `FileSystem.documentDirectory` before enqueueing, and delete it after it is sent.

---

### TECH-13 (P2): Sign-out triggers two navigations at once

After `refresh()`, the `(buyer)` or `(vendor)` layout still mounted under Settings redirects to `/(auth)/welcome` (`(buyer)/_layout.tsx:22`), while Settings calls `router.replace('/')` (`settings.tsx:66`). Which one wins depends on timing, and this adds to TECH-02.

**Fix.** Do it as part of the TECH-02 fix: the layouts redirect to `'/'` only, and Settings doesn't navigate.

---

### TECH-14 (P2): Lint warnings

`pnpm verify` passes with 2 `import/no-duplicates` warnings: `apps/mobile/__tests__/google-signin.test.tsx` imports `src/features/auth/api.ts` twice, at lines 4 and 23.

**Fix.** Merge the two imports.

---

### Checked and OK (no issue)

- **RLS:**
  - All 27 tables have RLS enabled.
  - `anon` has table privileges only on `app_settings` (SELECT).
  - `profiles`, `vendors`, `follows`, `requests` and `reviews` base tables are own-row or admin only.
  - `profile_phones` is admin-only, and phone numbers come out only through `get_vendor_phone`: verified vendor, `allow_calls`, signed in.
  - Buyers can't write vendor data: column grants plus `vendors_insert_own` needs `auth_role()='vendor'`, and RPCs use `require_role`.
  - Unverified vendors are hidden: `v_vendor_public`, `vendor_by_code`, `v_vendor_today`, `menu_json`, `vendor_public_stops`, `follow_vendor`, and `notify` skips unverified vendors.
  - The rating rules are server-side: `submit_review` → `review_eligibility` (3 days from the first current follow) plus the `UNIQUE (vendor_id, buyer_id)` constraint.
- **SECURITY DEFINER:** every function in `public` has `search_path=''`. `user_phone`, `notify_context`, `make_admin`, `hook_send_sms` and the `otp_record_*` functions are not executable by `anon` or `authenticated`.
- **Views** run as owner with `security_barrier`, but expose no phone or email. Metric views aren't granted to `authenticated` and are reached only through `require_admin()` RPCs.
- **Storage:** private buckets `pmc-docs` and `report-photos` are owner or admin read only, writes go to the owner's `<uid>/` folder, and size limits and MIME lists are set (2 MB, 300 KB, 5 MB, 2 MB, 1 MB).
- **Location:** foreground only. `ACCESS_BACKGROUND_LOCATION` is in `blockedPermissions`. The vendor reads position only from the arrival sheet (`(vendor)/_layout.tsx:50-51`), and the buyer only in the society picker.
- **Camera:** camera only, `photosPermission: false`, EXIF stripped (`exif: false`), denied state X-10 with Open settings.
- **Logs:** there are no `console.*` calls in `apps/mobile/app` or `src`. The analytics sanitiser strips names, phones and free text.
- **Dev routes:** `_dev/*` redirect home when `!__DEV__` (`app/_dev/_layout.tsx:5`), and the Settings dev links are `__DEV__`-only. Preview and production builds have `__DEV__ = false`.
- **Timezones:** the DB uses `ist_today()` / `ist_now()` and `timestamptz`; the client formats in `Asia/Kolkata` (shared `format.ts`).
- **Google OAuth:** PKCE flow, `detectSessionInUrl:false`, and the code is exchanged in-app.

---

## 4. APK contents, git history, distribution

### Values bundled into the app

| Source | Value | Verdict |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL | OK |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key | OK |
| `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST` | PostHog project ingestion key (write-only, designed to be public) | Acceptable. It is a third-party key, but PostHog intends it to ship in clients. Don't put a PostHog *personal* API key here |
| `EXPO_PUBLIC_BASE_URL` | `https://pheri.anchorlit.in` | OK |
| `app.json` `extra.eas.projectId`, `updates.url`, `owner` | EAS project id / owner slug | OK (public) |
| `google-services.json` (EAS file var `GOOGLE_SERVICES_JSON`) | Firebase Android API key + project number | OK: restricted Android key, meant to ship. In Google Cloud, restrict it to package `in.anchorlit.pheri` plus the SHA-1 |

No `process.env` other than these is read in `apps/mobile`. `eas.json` has no `env` secrets; only `APP_VARIANT` is set, for development.

**Needs check:** run `eas env:list --environment preview`. **No** variable named `*SERVICE_ROLE*`, `*SECRET*`, `NOTIFY_*`, `MSG91_*` or `EXPO_ACCESS_TOKEN` may have `EXPO_PUBLIC_` in its name or plain/sensitive visibility in the app build. I couldn't read the local `.env` files (blocked by permission in this session).

### Secrets in git history

- The clone is not shallow. I scanned all 45 commits on all branches (`git log --all -p`, 8.4 MB) for JWTs, `sb_secret_`, `sb_publishable_`, Google API keys (`AIza…`), Google OAuth secrets (`GOCSPX-`), PostHog keys (`phc_`), webhook secrets (`whsec_`), private keys, GitHub tokens, Slack tokens and live Stripe keys.
- **No real secret was found.**
- Hits:
  - the local Supabase **demo** anon JWT (`iss: supabase-demo`, the same for every local install) in `packages/integration/test/client.ts`, which is public and harmless;
  - test-only `whsec_` strings built from `btoa('…test…')` in `supabase/functions/tests/`;
  - `local-placeholder` Twilio values and the demo JWT secret in `supabase/config.toml`.
- No `.env`, keystore, `google-services.json` or service-account file was ever added. Only the three `.env.example` files, which I couldn't open here, so confirm they hold placeholders only.
- Gitleaks/trufflehog couldn't run: pulling their container was blocked in this session. Run `gitleaks git .` once locally before making the repo private, for a second opinion.
- **Keys to rotate:** none required by the history. Rotate the Supabase anon key only if you ever pasted the **service-role** key anywhere public (an issue, a PR comment, a Vercel preview log); the repo shows no sign of that.

### Distribution and OTA

- **Signing keystore:** none is in the repo, and `.gitignore` blocks `*.jks` and `*.keystore`, so EAS-managed credentials are likely. **Needs check:** run `eas credentials -p android` → profile `preview` → "Keystore: Managed by Expo". Download a backup and keep it offline; losing it means testers must uninstall to update. Put its SHA-256 in `ANDROID_SHA256_CERT_FINGERPRINTS` for App Links (`apps/admin/app/.well-known/assetlinks.json/route.ts`).
- **Anyone with the APK link can install it and gets every future `preview` OTA update.** The anon key is extractable from any APK. The real gate is Supabase auth plus RLS, which holds up, so this is acceptable for a test.
  - Expire or regenerate the internal-distribution link after testers have installed.
  - Don't put anything in an OTA that you wouldn't show a stranger.
  - Kill switch: `app_settings` `maintenance` / `min_version` (TECH-08), or `eas channel:pause preview` / `eas update:rollback`.
- **When the repo goes private:**
  - EAS Build uploads your local working tree, so `eas build` and `eas update` keep working. If you connected EAS's GitHub integration, re-authorise the Expo GitHub app for the private repo.
  - Vercel (admin/website): the Vercel GitHub app must have access to the private repo, which is fine on a personal account.
  - GitHub Actions keeps working, but private repos use metered minutes (2,000/month free). The CI runs three jobs per push, including Docker Supabase, so watch usage.
  - No raw.githubusercontent.com URLs are used anywhere in the app, admin, docs or emails.

---

## 5. Owner actions (checklist)

**Tonight, before sharing the link**
- [ ] Supabase → Auth → Providers → Email: **OTP length 6**, OTP expiry **600 s** (TECH-01)
- [ ] Supabase → Auth → Emails → **custom SMTP** (Resend/Brevo/ZeptoMail on `anchorlit.in`, SPF+DKIM); Rate limits → emails ≈ 30/h (SEC-01)
- [ ] Test sign-up from a non-team Gmail with **email code** and with **Google** (SEC-01, SEC-03)
- [ ] Google Cloud → OAuth consent screen: **publish**, or add every tester as a Test user (SEC-03)
- [ ] Supabase → Auth → URL Configuration: Site URL `https://pheri.anchorlit.in`; Redirect URLs contain `pheri://auth/callback`; remove unused localhost/wildcards (SEC-03)
- [ ] Edge Functions → Secrets: `NOTIFY_SECRET` set; SQL: `private.settings` has `notify_url` and `notify_secret` with the **same** value (SEC-02)
- [ ] `eas env:list --environment preview`: only `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_BASE_URL`, optional `EXPO_PUBLIC_POSTHOG_*` and the `GOOGLE_SERVICES_JSON` file; nothing secret with an `EXPO_PUBLIC_` prefix (TECH-03, §4)
- [ ] Publish OTA updates only with `eas update --channel preview --environment preview` (TECH-03)
- [ ] `https://pheri.anchorlit.in/privacy` loads on a phone (SEC-06)

**Supabase dashboard checks (read-only; I couldn't reach the hosted project)**
- [ ] Advisors → Security: zero errors (RLS disabled, security definer views, mutable search_path)
- [ ] Table editor: every table shows "RLS enabled"; Storage → buckets: `pmc-docs` and `report-photos` **private**, size limits as in §3 "Checked and OK"
- [ ] SQL: `select key from private.settings;` → `admin_require_mfa = true` (SEC-07)
- [ ] Auth → MFA: TOTP enabled; your admin account has a TOTP factor
- [ ] Auth → Sessions: JWT expiry 3600 s, refresh-token rotation on, reuse interval 10 s; optional "time-box sessions" off for the test
- [ ] Auth → Rate limits: sign-ups/sign-ins ≈ 30 per 5 min per IP, token verifications ≈ 30 per 5 min; consider CAPTCHA (SEC-11)
- [ ] Auth → Providers: **Phone disabled** (OTP is off in the app), Anonymous sign-ins disabled
- [ ] Database: was `seed.sql` applied? If so, decide whether the demo vendors stay (SEC-05)
- [ ] Edge Functions: `notify`, `otp-verify` and `send-sms-hook` deployed with JWT verification off (expected); `admin-invite` with it **on**
- [ ] Check from outside with the anon key (curl), expecting `[]` or 401/permission errors:
  `GET /rest/v1/profiles`, `/rest/v1/profile_phones`, `/rest/v1/vendors`, `/rest/v1/follows`, `/rest/v1/reviews`; `POST /rest/v1/rpc/get_vendor_phone` (`not_authenticated`); `POST /rest/v1/rpc/admin_vendors` (`admin_only`). With a throwaway **buyer** account: `/rest/v1/vendors` returns `[]`, `/rest/v1/v_vendor_public` lists verified vendors only, `rpc/submit_review` on a vendor followed for < 3 days → `rating_too_soon`. Delete the throwaway account afterwards in-app (Settings → Delete account).

**Distribution**
- [ ] `eas credentials -p android`: keystore managed by Expo; download a backup; record the SHA-256
- [ ] Set `app_settings` `update_url` (after TECH-08) or keep a pinned message with the APK link for testers
- [ ] Run `gitleaks git .` locally once, then make the repo private; re-authorise the Expo/Vercel GitHub apps if they are used

**This week (code, mostly by OTA):** TECH-02, TECH-04, TECH-05, TECH-06, TECH-07 (needs a new APK), TECH-08, TECH-09, SEC-04. `android.allowBackup=false` (SEC-13) also needs a new APK, so batch it with TECH-07.

---

## 6. Test results

| Command | Result |
| --- | --- |
| `pnpm install` | OK (lockfile up to date) |
| `pnpm verify` — typecheck (all packages) | Pass |
| `pnpm verify` — lint | Pass, **2 warnings** (`import/no-duplicates`, apps/mobile; TECH-14) |
| `pnpm verify` — tests | Pass: shared 10 files, admin 6 files / 17 tests, mobile 13 suites / **256 tests** (31 s) |
| `npx supabase start` (Docker) | OK; all 14 migrations and seed applied |
| `npx supabase test db` | **Pass: 10 files, 216 tests** |
| Deno function tests, integration tests | Not run in this session (they run in CI's `functions` and `database` jobs) |

**There are no failing tests.** The suite is green while TECH-01 exists, because every OTP test assumes a 6-digit code. Add the 8-digit test from TECH-01's fix so this kind of mismatch is caught.
