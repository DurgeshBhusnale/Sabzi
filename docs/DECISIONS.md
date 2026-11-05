# Decisions

Newest first. Short entries: date, decision, why. Do not reverse a decision without adding a new entry that explains why.

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
