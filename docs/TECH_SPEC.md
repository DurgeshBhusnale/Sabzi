# Technical Specification — Sabzi Vendor App v1 (Pilot)

Status: approved for build · Date: 2026-11-05 · Owner: Durgesh

This spec turns `docs/PRD.md` into an implementation plan. Requirement IDs (`AUTH-1`, `VEN-6`, `BUY-5`, `NOT-2`, `ADM-3`…) come from the PRD; screen IDs (`S-03`, `B-05`, `V-08`, `X-04`, `A-07`…) come from `docs/DESIGN_BRIEF.md`.

---

## 1. Architecture

```
┌─────────────────────────┐        ┌─────────────────────────────┐
│ Mobile app (Expo RN)    │        │ Admin panel (Next.js)        │
│ buyer mode / vendor mode│        │ field team, web              │
└────────────┬────────────┘        └──────────────┬──────────────┘
             │ supabase-js (anon key + user JWT)  │ supabase-js (admin JWT)
             ▼                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│ Supabase                                                         │
│  Auth (phone OTP via SMS hook → MSG91; email OTP)                │
│  Postgres + RLS  (tables, views, RPC functions)                  │
│  Storage (vendor photos, stock photos, PMC ID docs)              │
│  Edge Functions (Deno): notify-stop-event, send-deal,            │
│     answer-request, send-sms-hook, qr-landing, sticker-pdf        │
│  Database webhooks / triggers → edge functions                   │
└──────────────┬───────────────────────────────────────────────────┘
               │ HTTPS
               ▼
     Expo Push Service → FCM → Android devices
```

Principles:

- **Thin client, strong database.** Business rules that protect data (who can edit what, rate limits, rating eligibility) live in Postgres (RLS policies, constraints, `security definer` functions). The app never trusts itself.
- **One write path per action.** Each vendor action is one RPC call (for example `rpc('vendor_arrive', …)`) so it can be queued offline and retried safely (idempotency key).
- **Push is fire-and-forget from the database.** Inserting a `stop_events` row triggers the `notify-stop-event` function, which fans out push messages. The vendor's tap returns as soon as the row is written.

## 2. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Mobile | Expo SDK (latest stable), React Native, TypeScript (strict), expo-router | Android first; iOS later from the same code |
| State / data | TanStack Query v5 + supabase-js v2 | Query cache persisted to storage for offline reads |
| Offline writes | Persisted mutation queue (TanStack Query `persistQueryClient` + paused mutations) on MMKV or AsyncStorage | See §8 |
| Forms / validation | react-hook-form + Zod (schemas from `packages/shared`) | |
| UI | Own component library in `apps/mobile/src/ui` built on tokens; react-native-reanimated for the "At the gate" pulse | No heavy UI kit |
| Icons | lucide-react-native | Matches design brief (outline, 1.75 stroke) |
| Fonts | Plus Jakarta Sans (headings), Inter (body) via expo-font | Noto Sans Devanagari later |
| Location | expo-location, foreground only | Never background |
| Camera / images | expo-image-picker (camera), expo-image-manipulator (compress to < 300 KB) | VEN-4 |
| Push | expo-notifications + Expo Push Service | FCM credentials configured in EAS |
| Deep links | expo-linking, Android App Links for `https://<domain>/v/<vendor_code>` | BUY-10 |
| Backend | Supabase (Postgres 15+, Auth, Storage, Edge Functions) | |
| SMS OTP | Supabase Auth "Send SMS" hook → edge function → MSG91 (DLT-registered template) | Local dev uses Supabase test OTPs |
| Admin | Next.js App Router + TypeScript + Tailwind (tokens mapped) + supabase-js | Deployed later (Vercel or similar) |
| Tests | Jest + React Native Testing Library (mobile), Vitest (shared, admin), pgTAP (`supabase test db`), Deno test (functions) | |
| Lint / format | ESLint + Prettier, TypeScript `strict` | |
| CI | GitHub Actions: install → `pnpm verify` | `.github/workflows/ci.yml` |
| Builds | EAS Build (Android APK/AAB) run by the user or CI, not inside cloud sessions | |
| Analytics | PostHog (React Native SDK), events in §10 | Added in M11 |

Why Expo instead of Flutter: the whole stack stays in TypeScript (shared types between app, admin and edge functions), it builds and tests on Node in a cloud session without an Android SDK, and it matches the owner's web skills. Recorded in `docs/DECISIONS.md`.

## 3. Repository layout

```
sabzi-app/
├── CLAUDE.md                     # rules for Claude
├── README.md
├── docs/                         # PRD, design brief, spec, plan, progress, decisions, questions
│   └── design/screens/           # exported screen images from Claude Design
├── apps/
│   ├── mobile/                   # Expo app
│   │   ├── app/                  # expo-router routes
│   │   │   ├── (auth)/           # S-01..S-09
│   │   │   ├── (buyer)/          # tabs: home, following, requests, profile
│   │   │   ├── (vendor)/         # tabs: today, stops, requests, me
│   │   │   └── v/[code].tsx      # QR deep link (B-16)
│   │   └── src/
│   │       ├── ui/               # components from design brief §4
│   │       ├── features/         # auth, menu, stops, follow, reviews, requests, deals, notifications
│   │       ├── lib/              # supabase client, query client, offline queue, analytics
│   │       └── i18n/en.ts        # all strings
│   └── admin/                    # Next.js admin (A-01..A-11)
├── packages/
│   └── shared/src/               # tokens.ts, schemas.ts (Zod), db.types.ts (generated), constants.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/               # timestamped SQL, never edited after merge
│   ├── functions/                # Deno edge functions
│   ├── tests/                    # pgTAP
│   └── seed.sql                  # sample data from design brief §11
├── scripts/                      # cloud setup, session start
└── .github/workflows/ci.yml
```

## 4. Data model

All tables in schema `public`, `id uuid primary key default gen_random_uuid()` unless noted, `created_at timestamptz not null default now()`. RLS enabled on every table.

### 4.1 Enums

```sql
create type user_role      as enum ('buyer','vendor','admin');
create type admin_level    as enum ('owner','field_staff');
create type vendor_status  as enum ('pending','needs_info','verified','rejected','suspended');
create type vehicle_type   as enum ('tempo','thela');
create type price_unit     as enum ('kg','g500','g250','bunch','piece');
create type pilot_area     as enum ('karve_nagar','sus_pashan');
create type stop_event_type as enum ('arrived','leaving_soon','left','not_going');
create type request_status as enum ('open','will_bring','cant_bring','cancelled');
create type review_status  as enum ('visible','hidden');
create type report_reason  as enum ('wrong_weight','bad_quality','rude','fake_listing','other');
create type report_status  as enum ('open','actioned','dismissed');
create type notif_type     as enum ('arrival','leaving_soon','deal','not_coming','request_reply','vendor_new_requests','vendor_new_rating');
```

### 4.2 Tables

| Table | Columns (beyond id, created_at) | Constraints and notes |
| --- | --- | --- |
| `profiles` | `user_id uuid pk → auth.users`, `role user_role`, `name text`, `email text null`, `email_verified bool`, `admin_level admin_level null`, `push_token text null`, `deleted_at timestamptz null` | Phone lives in `auth.users`; never copied to a readable column. Role set once (trigger blocks changes except by admin). |
| `vendors` | `user_id uuid pk → profiles`, `display_name text`, `photo_path text`, `vehicle vehicle_type`, `vehicle_no text null`, `pmc_vendor_id text null`, `pmc_doc_path text null`, `delivery_available bool`, `allow_calls bool`, `status vendor_status default 'pending'`, `status_reason text null`, `verified_by uuid null`, `verified_at timestamptz null`, `code text unique` | `code` = short public code for QR (8 chars, unambiguous alphabet). |
| `societies` | `name text`, `area pilot_area`, `address text`, `lat double`, `lng double`, `flats_count int`, `active bool` | |
| `gates` | `society_id uuid`, `name text`, `lat double`, `lng double` | |
| `buyer_societies` | `buyer_id uuid`, `society_id uuid`, `is_primary bool` | PK (buyer_id, society_id); max 3 per buyer (trigger). |
| `stops` | `vendor_id uuid`, `gate_id uuid`, `days_of_week smallint[]` (1=Mon…7=Sun), `window_start time`, `window_end time`, `active bool` | Admin-managed. |
| `stop_skips` | `stop_id uuid`, `date date` | "Not going today" for one date. Unique (stop_id, date). |
| `items` | `name text`, `image_path text`, `default_unit price_unit`, `is_custom bool`, `created_by uuid null`, `approved bool` | Master list + vendor custom items. |
| `vendor_items` | `vendor_id`, `item_id`, `sort int` | Vendor's usual items (VEN-2). PK (vendor_id, item_id). |
| `daily_menus` | `vendor_id`, `date date`, `stock_photo_path text null`, `published_at timestamptz null` | Unique (vendor_id, date). `date` = IST date. |
| `menu_items` | `menu_id`, `item_id`, `price numeric(7,2)`, `unit price_unit`, `is_sold_out bool`, `deal_price numeric(7,2) null`, `deal_at timestamptz null` | PK (menu_id, item_id). `price between 1 and 999`. |
| `stop_events` | `vendor_id`, `gate_id`, `type stop_event_type`, `lat double null`, `lng double null`, `client_id uuid unique` | `client_id` = idempotency key from the offline queue. |
| `follows` | `buyer_id`, `vendor_id`, `society_id`, `notify_arrival bool default true`, `notify_deals bool default true`, `notify_requests bool default true` | PK (buyer_id, vendor_id, society_id). |
| `reviews` | `vendor_id`, `buyer_id`, `stars smallint check 1..5`, `tags text[]`, `text text check length ≤ 300`, `vendor_reply text null`, `vendor_replied_at timestamptz null`, `status review_status`, `hidden_reason text null`, `updated_at timestamptz` | Unique (vendor_id, buyer_id). |
| `review_flags` | `review_id`, `vendor_id`, `reason text`, `status report_status` | RAT-3 |
| `requests` | `buyer_id`, `vendor_id`, `society_id`, `item_id null`, `free_text text null`, `qty text null`, `note text null`, `for_date date`, `status request_status` | Max 5 open per buyer per vendor (trigger). |
| `reports` | `reporter_id`, `vendor_id`, `reason report_reason`, `text text`, `photo_path text null`, `status report_status` | BUY-9 |
| `notifications` | `user_id`, `type notif_type`, `payload jsonb`, `sent_at timestamptz`, `opened_at timestamptz null` | In-app list (NOT-4) and alert-open metric. |
| `waitlist` | `user_id`, `society_name text`, `society_id uuid null` | B-02 |
| `app_settings` | `key text pk`, `value jsonb` | A-11: OTP limits, alert limits, quiet hours, min app version, maintenance flag. |

### 4.3 Views and functions (read side)

- `v_vendor_public` — vendor card data safe for buyers: id, display_name, photo, vehicle, delivery_available, allow_calls, code, avg rating, rating count, tag counts. **No phone.** Only `status = 'verified'`.
- `v_vendor_today(society_id)` — for buyer home (BUY-2): each vendor serving the society today with computed status: `at_gate` (arrived event in last 3 h and no `left` after), `leaving_soon`, `left`, `not_coming` (skip row for today), `expected` (window). SQL function returning a table, `security invoker`.
- `get_vendor_phone(vendor_id)` — `security definer`; returns phone only when `allow_calls` is true and caller is authenticated.

### 4.4 RPC functions (write side, all `security definer` with explicit checks)

| Function | Used by | Checks |
| --- | --- | --- |
| `publish_menu(date, items jsonb, client_id)` | VEN-3 | caller is the vendor; prices valid; upsert `daily_menus` + `menu_items` |
| `set_sold_out(item_id, sold_out, client_id)` | VEN-8 | today's menu belongs to caller |
| `vendor_arrive(gate_id, lat, lng, client_id)` | VEN-6 | vendor verified; gate is one of caller's stops today; no `arrived` at this gate in last 2 h; returns follower count |
| `vendor_leaving_soon(gate_id, client_id)` / `vendor_left(gate_id, client_id)` | VEN-7 | after an `arrived` |
| `skip_stop(stop_id, date)` | VEN-5 | stop belongs to caller; inserts `not_going` event |
| `send_deal(items jsonb, client_id)` | VEN-9 | one per vendor per IST day; deal_price < price |
| `answer_request(item_key, status)` | VEN-10 | requests for caller for tomorrow |
| `follow_vendor(vendor_id, society_id, prefs)` / `unfollow_vendor` | BUY-4 | vendor verified and serves that society |
| `submit_review(vendor_id, stars, tags, text)` | BUY-6 | follow ≥ 3 days; one per vendor; edit only if `updated_at` older than 7 days |
| `reply_review(review_id, text)` | VEN-13 | one reply |
| `create_request(...)` / `cancel_request(id)` | BUY-7 | ≤ 5 open per vendor |
| Admin: `verify_vendor`, `set_vendor_status`, `upsert_stop`, `hide_review`, `resolve_report` | ADM-* | `profiles.role = 'admin'`; field_staff cannot change `app_settings` or team |

Every RPC that can be queued offline accepts `client_id uuid` and is idempotent on it.

## 5. Security (Row Level Security)

Helper functions: `auth_role()` returns caller's role, `is_admin()`, `is_owner()`.

| Table | Select | Insert / update / delete |
| --- | --- | --- |
| `profiles` | own row; admins all | own row (name, email, push_token); role changes only via admin |
| `vendors` | own row; admins all; buyers only through `v_vendor_public` | own row except `status*`, `verified_*`, `code`; admins all |
| `societies`, `gates`, `items` (approved) | everyone authenticated | admins only (vendors may insert custom items with `approved = false`) |
| `stops`, `stop_skips` | vendor own; buyers via `v_vendor_today`; admins all | admins (stops); vendor own via `skip_stop` |
| `daily_menus`, `menu_items` | everyone authenticated, only for verified vendors | via RPC only |
| `stop_events` | everyone authenticated for last 24 h | via RPC only |
| `follows` | buyer own; vendor sees counts only via function; admins all | buyer own via RPC |
| `reviews` | everyone: `status = 'visible'`; author also sees own hidden review | via RPC |
| `requests` | buyer own; vendor those addressed to him; admins | via RPC |
| `reports`, `review_flags` | reporter own; admins | insert own; admins update |
| `notifications` | own | system only (service role) |
| `app_settings` | everyone read (non-secret keys) | owner only |

Other rules:

- Buyer phone numbers are never readable by vendors, other buyers or the admin UI list (admins see masked `+91 ••••• •4321` unless they open a vendor's own record).
- Storage buckets: `vendor-photos` (public read), `stock-photos` (public read, path `vendor_id/date.jpg`, vendor writes own folder), `pmc-docs` (private, vendor writes own, admins read), `report-photos` (private).
- Rate limits: OTP per number (5 failures → 1 h block, AUTH-2) via Auth hook + `app_settings`; arrival and deal limits in RPCs.
- Admin panel: `role = 'admin'` required; email + password + TOTP MFA (A-01).
- DPDP basics: consent checkbox at sign-up (terms + privacy link), account deletion (AUTH-6) soft-deletes profile, scrubs name, keeps reviews as "Former user".

## 6. Authentication flow

1. S-03 phone → `supabase.auth.signInWithOtp({ phone: '+91…' })`. Production SMS goes through the Send SMS hook → edge function `send-sms-hook` → MSG91 with a DLT template. Local and cloud dev: Supabase `[auth.sms.test_otp]` in `config.toml` (for example `+919999900001 = "123456"`).
2. S-04 OTP → `verifyOtp`. On first login a trigger creates `profiles` with `role = null`.
3. S-06 role choice → `rpc('set_role', { role })`, allowed once.
4. Vendor → V-01 business details → V-02 usual items → V-03 waiting for verification. Buyer → B-01 pick society.
5. Email (AUTH-4): add email in S-11 → `updateUser({ email })` → verify code. Later logins can use `signInWithOtp({ email })` only if that email is verified on an existing account (`shouldCreateUser: false`).

## 7. Notifications

- Device registers Expo push token after S-08 permission; saved in `profiles.push_token`.
- Trigger `after insert on stop_events` → `pg_net` HTTP call to edge function `notify-stop-event` with the event id (use Supabase Database Webhooks).
- `notify-stop-event` loads followers of that vendor at that society with the right `notify_*` flag, builds the message from today's menu (top 3 items + "N more"), inserts `notifications` rows, and sends to Expo Push API in batches of 100. Target: delivered < 10 s after tap (NOT-2).
- `send-deal`, `answer-request`, review alerts work the same way.
- Quiet hours 21:00–06:00 IST for deal and request messages (NOT-3); arrival alerts are always allowed.
- Message copy comes from design brief §9.1.
- Opening a notification calls `rpc('mark_notification_opened', { id })` for the alert-open metric.

## 8. Offline behaviour

- Reads: TanStack Query cache persisted to storage; screens show cached data with banner X-02 ("Offline · showing data from 7:12 AM").
- Vendor writes (`publish_menu`, `set_sold_out`, `vendor_arrive`, `vendor_leaving_soon`, `vendor_left`, `send_deal`, stock photo upload) go through an offline queue: each action gets a `client_id` at tap time, is stored, retried with backoff when connectivity returns (`@react-native-community/netinfo`), and shown in X-04 ("2 actions waiting to send").
- Arrival queued offline shows a warning that the alert may arrive late (V-08). If it is more than 30 minutes old when the network returns, ask the vendor before sending.
- Buyer writes (follow, review, request) are not queued; they show an error with Retry.

## 9. Design system implementation

- `packages/shared/src/tokens.ts` holds colours (light + dark), type scale (buyer and vendor), spacing, radius, elevation exactly as design brief §2. Admin maps the same tokens to Tailwind config.
- Components in `apps/mobile/src/ui` match design brief §4 one to one (`Button`, `TextInput`, `OtpInput`, `Chip`, `StatusPill`, `VendorCard`, `MenuItemRow`, `ItemTile`, `PriceStepper`, `StopRow`, `RatingStars`, `ReviewCard`, `RequestCard`, `StatTile`, `BottomSheet`, `Dialog`, `Snackbar`, `Banner`, `Skeleton`, `EmptyState`, `Avatar`, `PhotoUploader`, `TopAppBar`, `Toggle`, `SegmentedControl`, `QrCard`).
- A dev-only route `app/_dev/components.tsx` renders every component in every state (acts as a living style guide; excluded from production builds).
- Vegetable illustrations: placeholders (initial letter on a tinted circle) until real art is added in `apps/mobile/assets/items/`.

## 10. Analytics events (M11)

`signup_completed`, `society_selected`, `vendor_followed`, `vendor_unfollowed`, `menu_published`, `stock_photo_added`, `vendor_arrived`, `alert_opened`, `vendor_page_viewed`, `review_submitted`, `request_created`, `request_answered`, `deal_sent`, `qr_scanned`, `app_opened`. Properties never include phone numbers or names. Server-side metrics for the admin dashboard (A-02) are computed in SQL from the tables, not from PostHog.

## 11. Environments and configuration

| Variable | Where | Secret? |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile | No (public) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | admin | No |
| `SUPABASE_SERVICE_ROLE_KEY` | edge functions only (Supabase secrets) | **Yes** |
| `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` | edge function secrets | **Yes** |
| `EXPO_ACCESS_TOKEN` | edge functions (push), EAS | **Yes** |
| `POSTHOG_KEY` | mobile | No |

Environments: **local** (Supabase CLI in Docker, used by cloud sessions and CI), **staging** (Supabase cloud project, pilot testing), **production** (pilot launch). Cloud sessions work against local only; the owner pushes migrations to staging (`supabase db push`) after merging.

## 12. Testing strategy

- **Database:** pgTAP tests for every RLS policy (allowed and denied cases per role) and every RPC rule (2-hour arrival limit, 1 deal per day, 3-day rating rule, 5 open requests, role set once).
- **Shared:** Vitest for Zod schemas, price formatting (`₹40 / kg`), IST date helpers, status computation.
- **Mobile:** Jest + RNTL for components (each state renders), hooks, offline queue (queued → sent → failed → retry), and screen tests for the critical flows: publish menu, I've arrived, follow, review eligibility.
- **Edge functions:** Deno tests with mocked Expo push.
- **Manual pilot checklist** before release: install APK on a 2 GB RAM Android phone, run the two key journeys on 3G throttling.

## 13. Performance targets

App open < 3 s on 4G; menu publish < 2 s; arrival alert delivered < 10 s; APK < 30 MB; vendor Today screen usable offline.
