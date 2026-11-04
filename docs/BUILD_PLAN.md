# Build Plan — Sabzi Vendor App v1

Each milestone is one branch and one pull request. Work top to bottom unless the user names a milestone. A milestone is **done** only when every acceptance criterion is tested and `pnpm verify` passes.

**Parallel lanes.** After M0 and M1 are merged, three lanes can run as separate cloud sessions at the same time:

- **Lane A (mobile):** M3 → M4 → M5 → M8
- **Lane B (backend):** M2 → M6 → M7 → M10
- **Lane C (admin):** M9 → M11

M12 runs last, after all lanes.

| # | Milestone | Depends on | Lane |
| --- | --- | --- | --- |
| M0 | Repo foundation | — | — |
| M1 | Database schema, RLS and seed | M0 | — |
| M2 | Auth and accounts | M1 | B |
| M3 | Mobile shell and component library | M0 | A |
| M4 | Vendor core flows | M1, M3 | A |
| M5 | Buyer core flows | M1, M3 | A |
| M6 | Push notifications | M1, M2 | B |
| M7 | Ratings, requests, deals, reports (backend + screens) | M4, M5, M6 | B |
| M8 | Offline queue and system states | M4, M5 | A |
| M9 | Admin panel | M1 | C |
| M10 | QR deep links, web landing, sticker PDF | M5, M9 | B |
| M11 | Analytics and pilot dashboard | M9 | C |
| M12 | Hardening and release prep | all | — |

---

## M0 — Repo foundation

Goal: a working pnpm monorepo that CI can verify.

- Root `package.json` scripts: `verify` (typecheck + lint + test across workspaces), `format`.
- `packages/shared`: TypeScript package with `tokens.ts` (all design brief §2 tokens, light and dark, buyer and vendor type scales), `constants.ts` (limits: arrival 2 h, 1 deal/day, 3-day rating rule, 5 open requests, 300-char review, price 1–999), `format.ts` (`formatPrice(40,'kg') → "₹40 / kg"`, IST helpers), Vitest tests.
- `apps/mobile`: create with `create-expo-app` (TypeScript, expo-router), strict TS, ESLint, Jest configured; app boots to a placeholder screen using tokens.
- `apps/admin`: create Next.js (App Router, TS, Tailwind) with tokens mapped into Tailwind config; boots to a placeholder page.
- `supabase/`: `npx supabase init`; test OTP numbers in `config.toml`.
- Record decisions in `docs/DECISIONS.md`.

Acceptance:
- [ ] `pnpm install && pnpm verify` passes from a clean clone
- [ ] CI workflow passes on the PR
- [ ] `formatPrice` and IST helpers covered by tests

## M1 — Database schema, RLS and seed

Goal: the full data model from TECH_SPEC §4–5, secure and testable.

- Migrations for all enums, tables, indexes, constraints and triggers (max 3 societies per buyer, 5 open requests, role set once, profile auto-create on sign-up).
- Views and read functions: `v_vendor_public`, `v_vendor_today(society_id)`, `get_vendor_phone`.
- All RPC functions from TECH_SPEC §4.4 with their checks and `client_id` idempotency.
- RLS policies from TECH_SPEC §5. Storage buckets and policies.
- `seed.sql` with the design brief sample data: 4 societies (with gates), 4 vendors (Ramesh, Sunita, Imran, Ganesh — Ganesh pending/new), 3 buyers, items master list (at least 40 common vegetables with default units), Ramesh's menu for today, sample reviews, follows, a few requests.
- Generate `packages/shared/src/db.types.ts`.

Acceptance:
- [ ] `npx supabase db reset` succeeds; seed loads
- [ ] pgTAP: every policy has an allowed and a denied test per role
- [ ] pgTAP: arrival 2-hour limit, one deal per day, 3-day rating rule, 5 open requests, one review per vendor, role set once
- [ ] A buyer cannot read any phone number; a vendor cannot read buyer identities beyond first name and society on reviews/requests

## M2 — Auth and accounts (S-01 … S-16 backend parts, AUTH-1 … AUTH-6)

- Phone OTP sign-in/verify, resend after 30 s, block after 5 failures (AUTH-2) using `app_settings`.
- `set_role` once; profile completion; push token save.
- Email add/verify and email OTP login for verified emails only.
- `send-sms-hook` edge function for MSG91 (works with env vars; skipped locally where test OTP is used).
- Account deletion (soft delete, scrub, reviews show "Former user").
- Mobile screens S-01 … S-16 wired to these (if M3 is merged; otherwise expose hooks and leave screens to M3/M4).

Acceptance:
- [ ] Test OTP login works end to end against local Supabase
- [ ] Wrong OTP 5 times blocks the number for 1 hour (test)
- [ ] Role cannot be changed after it is set (test)
- [ ] Deleted account's reviews show "Former user"

## M3 — Mobile shell and component library

- Theme provider (light/dark/system) from tokens; fonts; buyer vs vendor type scale switch by role.
- Every component in design brief §4 with every listed state, in `apps/mobile/src/ui`.
- Dev route `app/_dev/components.tsx` showing all components and states.
- Navigation skeleton: `(auth)`, `(buyer)` tabs (Home, Following, Requests, Profile), `(vendor)` tabs (Today, Stops, Requests, Me) with the floating "I've arrived" button on Today and Stops.
- Strings in `src/i18n/en.ts`.

Acceptance:
- [ ] Each component has a render test per state
- [ ] Touch targets ≥ 48 dp (buyer) and ≥ 56 dp for vendor primary buttons (test via style assertions)
- [ ] Dark mode renders with dark tokens (test)

## M4 — Vendor core flows (V-01 … V-16, VEN-1 … VEN-13 except deal/requests detail)

- V-01 business details (photo upload to `vendor-photos`), V-02 usual items, V-03 verification states.
- V-04 Today with step cards, stops timeline, stats strip.
- V-05 set menu with "Same as yesterday", V-06 price editor bottom sheet, publish via `publish_menu`.
- V-07 stock photo (camera only, compress < 300 KB).
- V-08 I've arrived sheet: GPS suggests nearest stop within 300 m, manual fallback, 2-hour lock state, follower count, 5-second Undo (undo deletes the event before the push is sent — push is delayed 5 s server-side or the client delays the RPC 5 s).
- V-09 at-the-stop live mode, V-10 sold out, V-12 stops tab with "Not going today", V-14 Me, V-15 My QR, V-16 My reviews (reply, flag).

Acceptance:
- [ ] Publishing a 12-item menu from "Same as yesterday" takes ≤ 3 taps
- [ ] Arrival suggestion picks the nearest gate within 300 m (unit test with coordinates)
- [ ] Arrival is blocked within 2 hours at the same gate with the unlock time shown
- [ ] All V-xx states from the design brief exist

## M5 — Buyer core flows (B-01 … B-16, BUY-1 … BUY-5, BUY-10)

- B-01 pick society (GPS + search), B-02 not served + waitlist, B-04 society switcher (max 3).
- B-03 Home with sections: At the gate now, Coming today, Evening deals (after 17:00), Not coming today; pull to refresh; realtime updates via Supabase Realtime on `stop_events`.
- B-05 vendor page with all sections and states, B-06 photo viewer, B-07 follow sheet, B-08 Following tab, B-15 notifications list, B-16 opened from QR.

Acceptance:
- [ ] Home status updates within a few seconds of a new `stop_events` row (realtime test or manual check documented)
- [ ] Vendor page never shows a phone number unless `allow_calls` is on
- [ ] All B-xx states from the design brief exist

## M6 — Push notifications (NOT-1 … NOT-4)

- Expo push token registration; permission rationale S-08; blocked state X-08.
- Database webhook → `notify-stop-event` → Expo Push API; copy from design brief §9.1; `notifications` rows; batch of 100.
- Quiet hours for deals and request replies; in-app banner when the app is open; `mark_notification_opened`.

Acceptance:
- [ ] Deno tests: correct followers selected, opt-outs respected, quiet hours respected, message text matches spec
- [ ] Arrival → push request sent in under 2 s in local test (log timing)

## M7 — Ratings, requests, deals, reports

- B-09 all reviews, B-10 write review with eligibility states, BUY-6 rules.
- B-11 request for tomorrow, B-12 requests tab, V-13 vendor requests tab (visible from 16:00 IST, grouped by item), `answer_request` with buyer notification.
- V-11 evening price drop + B-13 deals sheet + deal alert.
- B-14 report vendor; vendor review flag.

Acceptance:
- [ ] Review not allowed before 3 days of following (UI state + DB test)
- [ ] Only one deal per vendor per day (UI state + DB test)
- [ ] Request grouping sums quantities correctly (unit test)

## M8 — Offline queue and system states

- Persisted query cache; offline banner X-02; weak network X-03.
- Vendor offline action queue with `client_id`, retry with backoff, X-04 pending list, stale arrival confirmation (> 30 min).
- System screens X-01 … X-17, all empty states (design brief §8.4), skeletons (§8.5), force update / maintenance from `app_settings`.

Acceptance:
- [ ] Queue tests: queued → sent; queued → failed → retry → sent; duplicate send is idempotent
- [ ] Every X-xx screen reachable from the dev route

## M9 — Admin panel (A-01 … A-11, ADM-1 … ADM-8)

- Admin login with email + password + TOTP.
- Societies + gates with map pins, vendors list and verification actions, stops planner with overlap warning, items master list and custom-item approval, moderation queue, team (owner vs field staff), settings.

Acceptance:
- [ ] Field staff cannot open Team or Settings (test)
- [ ] Verifying a vendor makes him visible to buyers (integration test against local DB)
- [ ] Overlapping stops show a warning (unit test)

## M10 — QR deep links, web landing, sticker PDF (VEN-12, BUY-10, ADM-4)

- Vendor `code` → URL `https://<domain>/v/<code>`; Android App Links config; app route `v/[code]`.
- `qr-landing` edge function or a Next.js public route rendering the web fallback page (design brief §9.4).
- Sticker PDF A6 and society poster A4 generation (design brief §9.3) from admin.

Acceptance:
- [ ] Scanning a code opens the vendor page in the app (manual check documented) or the web page without the app
- [ ] PDF renders with QR that decodes to the right URL (test)

## M11 — Analytics and pilot dashboard (ADM-7)

- PostHog events from TECH_SPEC §10 in the mobile app (no personal data).
- A-02 dashboard metrics computed in SQL views: active vendors, adoption % per society, alert open rate within 15 min, week-4 retention, vendors with 10+ ratings.

Acceptance:
- [ ] SQL metric views tested with seed data
- [ ] Event names match TECH_SPEC exactly

## M12 — Hardening and release prep

- Accessibility pass (labels, contrast, font scaling), performance pass (startup, list virtualisation, image sizes).
- EAS build profiles (`development`, `preview` APK, `production` AAB), app icon and splash from brand.
- Privacy policy and terms pages; consent at sign-up.
- `docs/RELEASE_CHECKLIST.md` for the owner: Supabase staging setup, secrets, MSG91 DLT, FCM, EAS build, internal testing track.

Acceptance:
- [ ] `eas build --profile preview` config validated (`npx expo-doctor` passes)
- [ ] Release checklist written and reviewed
