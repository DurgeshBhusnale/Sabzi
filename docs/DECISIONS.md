# Decisions

Newest first. Short entries: date, decision, why. Do not reverse a decision without adding a new entry that explains why.

## 2026-11-08 — Brand Pheri, subdomain, email sign-in (owner decisions)
- **Name Pheri** in `APP_NAME` and the app name; user-facing strings read `APP_NAME`. Internal names (`@sabzi/*` packages, storage keys, repo) stay — renaming them would churn every import for no user benefit.
- **App id `in.anchorlit.pheri` and scheme `pheri://`** now, before any store upload, because the Android package name can never change after publishing. `APP_ID` / `APP_SCHEME` constants feed the Play Store link, App Links file and web "Open" links.
- **Default base URL `https://pheri.anchorlit.in`**, still overridable by env.
- **Email sign-in/sign-up uses a 6-digit code, not a password**: same screen pattern as the designed S-05, nothing to forget or reset, and Supabase links it with a Google identity on the same email. Email templates show the code (`supabase/templates/`); code expiry 10 minutes, one email per 30 s.

## 2026-11-08 — Google sign-in for the testing phase (owner decision)
- **Reverses "phone OTP mandatory"** (2026-11-05 product decisions) for now: SMS OTP in India needs DLT registration, which isn't done. Sign-in is Google via Supabase OAuth with PKCE (`expo-web-browser` auth session → `sabzi://auth/callback?code=…` → `exchangeCodeForSession`). No native Google SDK, so no extra Android config beyond the redirect URL.
- **Phone OTP is switched off, not removed**: a feature flag (`AUTH_METHODS.phoneOtp`) rather than commented-out code, so the screens, edge functions and tests keep compiling and passing and can be turned back on with one change. The local stack keeps the phone provider on so the seeded test users and integration tests still work.
- **Mobile number in profile building**, stored in `profile_phones` with no select grant to app users; owners read their own last 4 digits through `my_account`, admins through admin functions. `user_phone()` prefers a future OTP-verified number. Not unique while unverified (see QUESTIONS).
- **Base URL from env** (`EXPO_PUBLIC_BASE_URL`, `NEXT_PUBLIC_BASE_URL`; `app.config.ts` sets the App Links host) so the testing subdomain and the launch domain need no code change.

## 2026-11-05 — M12 hardening
- **New on-tint text tokens** (`onPrimaryTint`, `onErrorTint`, `onInfoTint`, `onDealAmber`): the design's primary/error/info text on their tints measured 4.3–4.49:1 and the dark-mode deal badge 1.14:1; small pill text needs 4.5:1. Brand colours themselves are unchanged.
- **Lists are not virtualised yet**: every list in v1 is bounded (≤ 50 items, a handful of vendors per society, 7 days of notifications) and rendered inside one scroll view per screen. Switch to `FlatList` if a list grows past ~100 rows.
- **Background location and storage permissions are blocked** in `app.json`; only foreground location, camera and notifications are requested.
- **Icons are generated** from `apps/mobile/assets/brand/mark.svg` (placeholder mark; regenerate when the brand is final).

## 2026-11-05 — M11 analytics
- **PostHog via its HTTP batch API, not the SDK**: no autocapture or session replay (privacy), no extra native modules, ~60 lines. Distinct id is a random per-install id.
- **Retention is measured server-side** from a one-row-per-day `app_opens` table (dashboard numbers come from SQL, per TECH_SPEC §10). Pilot start comes from `app_settings.pilot_start_date`, else the first buyer sign-up.
- **Active vendor** = published a menu on 5+ of the 7 days ending the selected date; **alert usefulness** = arrival notifications opened within 15 minutes / sent, from `notifications.opened_at`.
- **Charts are hand-written SVG** (2 series, primary + info, palette validated for colour-blind separation) to avoid a chart library in the admin bundle.

## 2026-11-05 — M10 QR
- **The web fallback lives in the Next.js app** (public routes `/v/[code]`, `/s/[id]`, `/.well-known/assetlinks.json`) rather than an edge function, so one deployment serves the admin panel, the QR pages and App Links verification.
- **PDFs are made in the admin's browser** with pdf-lib: no server route needs admin credentials, and the vendor photo comes from public storage. Helvetica is used (no ₹ needed on the sticker); QR uses error-correction level H with a 4-module quiet zone for outdoor stickers.
- **Society posters point to `/s/<society_id>`**, which lists that society's vendors and opens the app's `s/[id]` route (saves the society for a buyer).

## 2026-11-05 — M9 admin
- **2-step login is enforced in the database**: `is_admin()` / `is_owner()` require an `aal2` session (switch `private.settings.admin_require_mfa`), so a stolen admin password alone cannot read or change anything, whatever the client does.
- **Map pins are coordinates** (with a "Check pin on the map" link) instead of a draggable map widget: no map SDK, API key or tile costs in the pilot. A map picker can be added later.
- **Team invites go through an edge function** (`admin-invite`) because inviting needs the service-role key, which never reaches the browser.
- **Admin data hooks** are a 30-line `useData` helper instead of React Query, to keep the admin bundle small; pages are client components using the signed-in admin's JWT and RLS.

## 2026-11-05 — M8 offline
- **Own small queue instead of TanStack paused mutations**: vendor actions need visible per-item status (X-04), stale-arrival confirmation and supersede rules, which are clearer in a 150-line tested class persisted to AsyncStorage.
- **Online first, queue on network failure**: an action is tried at once when online; only a network error (not a server "no") puts it in the queue. Server refusals such as `arrival_cooldown` are permanent and shown, never retried.
- **Buyer writes are not queued** (TECH_SPEC §8); they show an error with retry.
- **Weak network = 2G/3G** from NetInfo; there is no reliable bandwidth probe on Android without extra traffic.

## 2026-11-05 — M7 engagement
- **Vendor requests tab shows requests before 4 PM** with the "Requests so far" note (the design file shows this state); the push digest goes out at 4 PM. Answering is allowed any time.
- **Quantities are free text** ("500 g", "1 kg", "2 pieces"); the vendor tab parses and sums grams/kg, pieces and bunches separately and lists anything it can't parse.
- **Deal default is −20 %** when an item is picked, rounded down to a whole rupee, never below ₹1.

## 2026-11-05 — M6 notifications
- **One `notify` edge function for every kind**, called by Postgres triggers through `pg_net` with `{kind, ref}`. Triggers read the function URL and a shared secret from `private.settings` (no grants to app roles); when not configured (local dev) nothing is queued and the vendor's tap never fails.
- **SQL gathers context, TypeScript decides**: `notify_context` returns followers with all flags; recipient rules, quiet hours and copy live in tested TS shared with the app.
- **Quiet hours keep the in-app row** (NOT-4 list) but skip the push for deals, request replies and vendor digests. Arrival, leaving-soon and not-coming are always pushed.
- **Leaving soon goes to all arrival-alert followers at that society** (VEN-7's "opened or not yet seen" covers everyone in practice).
- **Vendor "new requests" is one digest at 16:00 IST** (pg_cron) instead of one push per request, matching V-13 opening at 4 PM.
- **Foreground alerts** use our own banner (§9.2), not the system heads-up.

## 2026-11-05 — M5 buyer flows
- **One RPC per buyer screen** (`buyer_home`, `vendor_page`, `my_following`) returning JSON, so a screen loads in one round trip on 3G and caches as one query.
- **Realtime invalidates, does not patch**: any `stop_events` change refetches buyer queries. Simple and correct; the payload is small.
- **Distance to societies is computed on the phone** from the (small) society list, so B-01 works with location off and needs no PostGIS.
- **The B-03 coach mark is shown on the vendor page next to Follow** (first visit only, stored on the device), because Follow lives there, not on home cards.
- **Pinch zoom in B-06** uses ScrollView zoom (iOS) — Android shows the full photo; a gesture library can be added later if pilots ask.

## 2026-11-05 — M4 vendor flows
- **Stock photo uses the system camera** (`expo-image-picker` `launchCameraAsync`, gallery not offered) instead of a custom `expo-camera` viewfinder; the "Fit your tempo in the frame" guide is shown before opening the camera. Saves a native module and works on low-end phones. Compression steps down size/quality until the JPEG is under 300 KB.
- **Undo for arrival is server-side**: the RPC writes the event at once; `undo_stop_event` deletes it within 10 s; the push sender (M6) waits for the 5 s undo window and skips deleted events. The app never delays the RPC, so a killed app cannot lose an arrival.
- **Menu publish has no undo** (only a "Live for N followers" snackbar); re-publishing replaces the menu, which covers mistakes. "Not going today" has a 5 s undo (unskip).
- **"Mark today as done"** (V-10, all sold out) skips the remaining upcoming stops, which tells those followers the vendor is not coming.
- **Vendor routing**: `(vendor)` layout redirects to V-01 when no vendor row exists, to V-03 once for the verified celebration, and shows X-15 when suspended.

## 2026-11-05 — M3 mobile shell
- **No UI kit and no reanimated**: components use React Native primitives and the built-in `Animated` API (pulse, shimmer); bottom sheets use `Modal`. Fewer native modules for a 2 GB RAM phone and the 30 MB APK target.
- **Icons: lucide-react-native** (TECH_SPEC) instead of Phosphor used in the design file; same outline style, 24 dp, 1.75 stroke. Jest maps lucide to its CJS build.
- **QR codes** are always black on white (`qrColors` token) so every scanner reads them in dark mode.
- **Global notification toggles** (S-13) live in `profiles.notify_prefs`; per-vendor toggles stay on `follows`. The push sender must respect both (M6).
- **Vendor photo on S-07** is collected on V-01 (business details) instead, so S-07 is name only.

## 2026-11-05 — M2 auth
- **Wrong-OTP counting lives in an edge function** (`otp-verify`). Supabase Auth has no hook for failed verifications, so the app verifies through `otp-verify`, which checks/records failures in `otp_attempts` (SQL functions, service role only) and returns the session. The send-SMS hook also refuses blocked numbers, so a blocked number cannot get new codes.
- **Local SMS hook is a Postgres function** (`hook_send_sms`); production points the Auth "Send SMS" HTTP hook at the `send-sms-hook` edge function (MSG91 flow API with a DLT template). Without `MSG91_AUTH_KEY`/`MSG91_TEMPLATE_ID` the function logs a stub line and returns success.
- **Account deletion** scrubs the profile, frees the phone and email in `auth.users`, bans the auth user, removes follows/societies/notifications, cancels open requests and suspends a vendor; reviews stay and show "Former user".
- **Auth screens (S-01…S-16) are built in M3** with the component library; M2 ships the data layer they call.
- **Integration tests** live in `packages/integration` (`pnpm --filter @sabzi/integration test:integration`) and need the local stack, so they run in CI's database job, not in `pnpm verify`.

## 2026-11-05 — M1 database design
- **Buyer-safe read models are owner-rights views** (`v_vendor_public`, `v_review_public`, `v_vendor_requests`) and `security definer` functions (`v_vendor_today`, `vendor_public_stops`, `my_follower_counts`). Base `reviews` and `requests` rows (which carry `buyer_id`) are readable only by their author and admins, so vendors see a buyer's first name and society and nothing else.
- **Column-level grants** stop users changing protected columns (`profiles.role`, `vendors.status`, `vendors.code`…); a trigger also blocks role changes once set (only an owner admin may change one).
- **Extra tables** beyond TECH_SPEC §4.2: `deals` (one row per vendor per IST day enforces the 1-deal limit), `action_log` (idempotency results for queued RPCs), `vendor_page_views` (VEN-11 profile views). `vendors.verified_seen_at` supports the one-time "verified" celebration.
- **`stop_events.created_at` defaults to `clock_timestamp()`** so events written in one transaction still order correctly.
- **Undo**: `undo_stop_event` deletes an arrival up to 10 s after it was written; the push sender waits for the 5 s undo window (M6).
- **RPC errors** are raised with a machine code as the message (`arrival_cooldown`, `deal_limit`, `rating_too_soon`…) and details (like the unlock time) in `detail`; the app maps codes to copy.
- **Test OTP phones** `+91 99999 000xx` with code `123456` for seeded users (config.toml, local only).

## 2026-11-05 — M0 tooling choices
- **One working branch per session.** The cloud session can only push to its assigned branch (`claude/adoring-johnson-tu32pu`), so each milestone is built on that branch, opened as its own PR to `main`, squash-merged, and then `main` is merged back into the branch before the next milestone. Milestone names (`m0-foundation`, …) are used in PR titles instead of branch names.
- **pnpm `node-linker=hoisted`** (`.npmrc`). React Native/Metro and Expo autolinking are most reliable with a flat `node_modules` in a monorepo.
- **TypeScript 6.0** (what Expo SDK 58 templates pin) everywhere; **ESLint 9** because `eslint-plugin-react` (used by `eslint-config-expo` and `eslint-config-next`) does not yet run on ESLint 10.
- **Expo SDK 58**, routes in `apps/mobile/app/` as TECH_SPEC §3 says (expo-router supports `app/` and `src/app/`).
- **Shared package imports use explicit `.ts` extensions** (`allowImportingTsExtensions`) so the same files run unchanged in Deno edge functions, Metro, Next.js and Vitest.
- **Tailwind v4 with a JS config** (`@config`) so the admin maps tokens from `packages/shared` instead of repeating hex values in CSS.
- **Design tokens follow the design system file** where it differs from the brief: `text-muted` #616B63 and `warning` #8A5A12 (adjusted by the designer for AA contrast), plus the full dark palette from the file.
- **Local Supabase in cloud sessions** pulls images from Docker Hub (`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`) because the ECR CDN is not reachable from the session network. CI uses the default registry.

## 2026-11-05 — Expo (React Native) instead of Flutter
The PRD left Flutter or React Native open. Chose Expo + TypeScript so app, admin, shared types and edge functions share one language, so the app can be built and tested on Node in cloud sessions without an Android SDK, and because it matches the owner's web skills.

## 2026-11-05 — Supabase as the backend
Postgres with Row Level Security, built-in phone and email OTP, storage and edge functions cover v1 without a custom server.

## 2026-11-05 — Expo Push Service for notifications
Simpler than calling FCM directly; uses FCM underneath on Android.

## 2026-11-05 — Product decisions carried from planning
- One app, two roles; phone OTP mandatory, email optional
- English only in v1; ratings public from day one
- Reservations ("keep it aside") moved to v2; vendor demand sheet in v1 uses only buyer requests
- Pilot areas: Karve Nagar and Sus–Pashan
- No payments, no WhatsApp, no AI features in v1

- **2026-11-09 — Admin: no Tailwind sizing classes named after spacing tokens.** Our spacing tokens (xs, sm, md, …, screen) are mapped into Tailwind's `spacing`, which in v4 also drives `max-w-*`/`min-h-*`, so `max-w-sm` became 12px and squashed the login card on Vercel. Use `max-w-[24rem]`, `max-w-[28rem]`, `min-h-dvh`; `apps/admin/test/tailwind-collisions.test.ts` enforces it.
