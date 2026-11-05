# Decisions

Newest first. Short entries: date, decision, why. Do not reverse a decision without adding a new entry that explains why.

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
