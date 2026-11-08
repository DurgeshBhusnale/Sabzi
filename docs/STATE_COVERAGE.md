# Screen state coverage

Every screen and state from `docs/DESIGN_BRIEF.md`, where it lives in the code, and how it is checked.
**T** = automated test (Jest/RNTL unless noted), **M** = manual check in the dev build, **D** = database test (pgTAP).

## Vendor (V-01 … V-16) — milestone M4

| Screen | State | Where | Check |
| --- | --- | --- | --- |
| V-01 Business details | Empty, filled, photo uploading, error (name too short, photo failed) | `app/vendor-setup/details.tsx` | M |
| V-02 Usual items | None selected (Continue disabled), some selected (counter), search no results (add custom) | `app/vendor-setup/items.tsx` | M |
| V-03 Verification | Pending, needs more info (upload), rejected (reason + call), verified (first time only, `verified_seen_at`) | `app/vendor-setup/status.tsx`, gate in `app/(vendor)/_layout.tsx` | M |
| V-04 Today | Before menu, menu published, at a stop (live banner, FAB hidden), after all stops (deal prompt), not verified (banner, FAB disabled), loading | `src/features/vendor/TodayView.tsx` | T `vendor-screens.test.tsx` |
| V-04 Today | Offline with queued actions | M8 offline queue | T (M8) |
| V-05 Set menu | First time, copying yesterday, some prices missing, publishing, published (snackbar "Live for N followers"), offline note | `src/features/vendor/MenuEditor.tsx`, `app/vendor/menu.tsx` | T |
| V-06 Price editor | Default, changed ("was ₹35"), invalid (₹0 / >₹999), keyboard open (tap number) | `MenuEditor` + `ui/PriceStepper.tsx` | T |
| V-07 Stock photo | Camera, preview (Retake / Use photo), uploading, upload failed + retry, camera denied (X-10) | `app/vendor/photo.tsx`, `features/vendor/photos.ts` | M |
| V-08 I've arrived | GPS finding, stop suggested, none within 300 m, GPS off, already alerted (unlock time), sending, sent + 5 s undo, offline | `src/features/vendor/ArriveSheet.tsx` | T |
| V-09 At the stop | Live, leaving-soon sent, left | `app/vendor/live.tsx` | M |
| V-10 Mark sold out | Some sold out, all sold out (mark today done) | `app/vendor/soldout.tsx`, `SoldOutList.tsx` | M |
| V-11 Evening price drop | No items selected, ready (−10% / −20% / stepper, preview), sending, sent, already used today, no remaining stops | `src/features/engagement/DealComposer.tsx`, `app/vendor/deal.tsx` | T `engagement.test.tsx`, D |
| V-12 Stops | Today, this week, skip confirm, skipped (+ undo snackbar), no stops yet | `app/(vendor)/stops.tsx` | M, D `skip_stop` |
| V-13 Requests | Before 4 PM (so far), several (grouped, notes), all answered, none (share QR) | `src/features/engagement/VendorRequestsView.tsx` | T, Vitest grouping |
| V-14 Me | Normal, zeros (encouraging copy) | `app/(vendor)/me.tsx` | M |
| V-15 My QR | Default, share | `app/vendor/qr.tsx`, `ui/QrCard.tsx` | T (QrCard) |
| V-16 My reviews | Several, none, replying, reply posted, flagged | `app/vendor/reviews.tsx` | M, D `reply_review`/`flag_review` |
| X-15 | Vendor suspended | `app/(vendor)/_layout.tsx` | M |

Manual check steps (dev build against local Supabase, phone `+91 99999 00001`, OTP `123456`): open Today; set menu with "Yesterday"; publish; add photo; tap I've arrived near Green Park (or choose manually); undo; send again; open live mode; leaving soon; I've left; Stops → Not going today on Sahyadri → confirm; Me → My QR → Share; My reviews → reply to Arjun.

## Buyer (B-01 … B-16) — milestone M5

| Screen | State | Where | Check |
| --- | --- | --- | --- |
| B-01 Pick society | Loading nearby, results (near you by distance), no search results, location off (search only), selected | `src/features/buyer/SocietyPicker.tsx`, `app/buyer-setup/society.tsx` | T `buyer-screens.test.tsx` |
| B-02 Not served | Default, after joining waitlist | `app/buyer-setup/not-served.tsx` | M |
| B-03 Home | One vendor at the gate, nobody at the gate yet, evening with deals, all left, no vendors here, loading, pull to refresh, realtime update, not-coming collapsed, coach mark (on vendor page Follow) | `src/features/buyer/HomeView.tsx`, `app/(buyer)/home.tsx` | T; realtime: `packages/integration/test/realtime.test.ts` |
| B-04 Society switcher | 1 saved, 3 saved (add disabled with hint), make primary, remove | `src/features/buyer/SocietySwitcher.tsx` | T |
| B-05 Vendor page | At the gate, expected, leaving soon, left, not coming (+ coming instead), menu not posted, all sold out, no photo, new vendor, loading, unavailable, menu search > 12, call only when allowed | `src/features/buyer/VendorPageView.tsx` | T |
| B-06 Photo viewer | Loaded, loading, failed | `app/buyer/photo.tsx` | M |
| B-07 Follow sheet | Default (pre-selects current society), notifications blocked (Turn on), unfollow | `src/features/buyer/FollowSheet.tsx` | T |
| B-08 Following | Several, none (Find vendors), loading, unfollow | `app/(buyer)/following.tsx` | M, D `my_following` |
| B-15 Notifications | Several, unread markers, empty | `app/buyer/notifications.tsx` | M |
| B-16 From QR | Logged in → vendor page; logged out → S-03 then back (pending route); unknown code → X-14 | `app/v/[code].tsx`, `src/lib/pendingRoute.ts` | M, D `vendor_by_code` |
| B-09 All reviews | Many, filter with no results, none; author sees own hidden review | `app/buyer/reviews.tsx` | M, D |
| B-10 Write a review | Empty, stars chosen, submitting, submitted, not eligible (days left), not following, already reviewed (locked 7 days) | `src/features/engagement/WriteReviewView.tsx` | T, D |
| B-11 Request for tomorrow | Empty, item chosen / something else, sending, sent, limit reached | `app/buyer/request.tsx` | M, D |
| B-12 Requests tab | Several (by date), none, loading, cancel | `app/(buyer)/requests.tsx` | M, D `my_requests` |
| B-13 Evening deals | Deals available (where he is now), deals ended | `app/buyer/deals.tsx` | M, D `my_deals_today` |
| B-14 Report vendor | Empty, submitting, submitted | `app/buyer/report.tsx` | M, D `report_vendor` |

Realtime manual check: log in as Priya (`+91 99999 00011`) in one emulator and Ramesh (`…00001`) in another; tap I've arrived at Green Park Gate 1; Priya's home moves Ramesh into "At the gate now" within ~1–2 s.

## System (X-01 … X-17) — milestone M8

All 17 are listed and openable in the dev route `app/_dev/states.tsx` (Settings → "Dev: system states", dev builds only); `__tests__/system-states.test.tsx` opens each one.

| ID | Where in the real app |
| --- | --- |
| X-01 | Buyer home when offline with nothing cached |
| X-02 | `NetworkBanner` on buyer home, vendor page, vendor Today, set menu (time from the cached query) |
| X-03 | `NetworkBanner` on 2G/3G |
| X-04 | `PendingActionsChip` on vendor Today (queued, sending, sent, failed + retry, stale arrival confirm) |
| X-05 / X-06 | `SystemStates.tsx` (server error / timeout) |
| X-07 | S-03 with `expired=1` banner |
| X-08 | `NotificationsBlockedBanner` (M6) |
| X-09 | Arrive sheet "Location is off" + B-01 location-off state; full screen in `SystemStates.tsx` |
| X-10 | `app/vendor/photo.tsx` camera denied |
| X-11 / X-12 / X-13 | `AppStatusGate` from `app_settings` (min/latest version, maintenance) |
| X-14 | `app/+not-found.tsx`, vendor page unavailable, unknown QR code |
| X-15 | `app/(vendor)/_layout.tsx` suspended |
| X-16 | S-03 "Too many tries" + `X16OtpLimit` |
| X-17 | B-02 waitlist |

Empty states (§8.4) and skeletons (§8.5) are part of each screen above (`EmptyState`, `SkeletonBlock`).

## Admin (A-01 … A-11) — milestone M9

| Screen | States | Where | Check |
| --- | --- | --- | --- |
| A-01 Login | Default, wrong password, code step (enrol QR first time), locked (rate limit) | `apps/admin/app/login/page.tsx` | Integration (password + TOTP), M |
| A-02 Dashboard | Placeholder counts (metrics in M11) | `app/(panel)/dashboard` | M |
| A-03 Societies | Normal, empty, search no results | `app/(panel)/societies` | M |
| A-04 Society detail | New, edit, saving, validation errors, gates | `app/(panel)/societies/[id]` | M |
| A-05 Vendors | Each status tab, empty; masked phones | `app/(panel)/vendors` | D `07_admin` |
| A-06 Vendor detail | Pending / verified / suspended, confirm dialogs, PMC ID (signed URL), full phone | `app/(panel)/vendors/[id]` | D, integration |
| A-07 Stops planner | Normal, conflict (double booked / shared gate), empty | `app/(panel)/stops` | Vitest `stops.test.ts` |
| A-08 Items | Normal, editing, custom items pending (approve) | `app/(panel)/items` | M |
| A-09 Moderation | Items pending, all clear; hide (reason), keep, warn, suspend | `app/(panel)/moderation` | M, D |
| A-10 Team | Normal, invite, deactivate (owner only) | `app/(panel)/team` | Vitest guard, D, Deno `admin-invite` |
| A-11 Settings | Normal, confirm for maintenance (owner only) | `app/(panel)/settings` | Vitest guard, D |

## QR, web page, sticker — milestone M10

| Item | Where | Check |
| --- | --- | --- |
| QR URL `https://sabzi.example/v/<code>` (one constant `PUBLIC_BASE_URL`) | `packages/shared/src/constants.ts`, `ui/QrCard.tsx`, `apps/admin/lib/pdf.ts` | Vitest (QR decodes) |
| App route `v/[code]` (B-16) and `s/[id]` (poster) | `apps/mobile/app/v/[code].tsx`, `app/s/[id].tsx`; Android App Links intent filter in `app.json` | Manual (below) |
| Web fallback §9.4 | `apps/admin/app/v/[code]/page.tsx` (public, no login) | Vitest render + curl against local stack |
| Society page (poster QR) | `apps/admin/app/s/[id]/page.tsx` | curl |
| `/.well-known/assetlinks.json` | `apps/admin/app/.well-known/assetlinks.json/route.ts` (needs `ANDROID_SHA256_CERT_FINGERPRINTS`) | curl |
| Sticker A6 + poster A4 PDF | `apps/admin/lib/pdf.ts`, buttons on A-06 and A-04 | Vitest (page size, QR decodes to URL) |

Manual check — app installed: on the Android phone open `adb shell am start -a android.intent.action.VIEW -d "https://sabzi.example/v/RMSH4K7P"` (or scan the sticker); the app opens Ramesh's page (or asks to log in, then returns to it). App not installed: the same URL opens the web page with "Get the app to follow Ramesh". App Links need the real domain, the hosted `assetlinks.json` and the release key fingerprint (owner to-do).

## Sign-in (testing phase, 8 Nov)

| Screen | States | Where | Check |
| --- | --- | --- | --- |
| Sign-in (replaces S-03) | Consent needed, signing in, cancelled, failed, offline | `app/(auth)/signin.tsx` | T `google-signin.test.tsx` |
| S-07 Profile building | Name prefilled from Google, mobile number (invalid / valid), saving, error | `app/(auth)/name.tsx` | T |
| Change mobile number | Add, change, saved | `app/account/phone.tsx` | M, D `10_google_signin` |
| S-03/S-04/S-05 phone and email OTP | Built, hidden (`AUTH_METHODS`) | `app/(auth)/phone.tsx`, `otp.tsx`, `email.tsx` | T (M3 tests still run) |
