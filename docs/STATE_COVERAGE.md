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
| V-11 Evening price drop | — | M7 | — |
| V-12 Stops | Today, this week, skip confirm, skipped (+ undo snackbar), no stops yet | `app/(vendor)/stops.tsx` | M, D `skip_stop` |
| V-13 Requests | — | M7 | — |
| V-14 Me | Normal, zeros (encouraging copy) | `app/(vendor)/me.tsx` | M |
| V-15 My QR | Default, share | `app/vendor/qr.tsx`, `ui/QrCard.tsx` | T (QrCard) |
| V-16 My reviews | Several, none, replying, reply posted, flagged | `app/vendor/reviews.tsx` | M, D `reply_review`/`flag_review` |
| X-15 | Vendor suspended | `app/(vendor)/_layout.tsx` | M |

Manual check steps (dev build against local Supabase, phone `+91 99999 00001`, OTP `123456`): open Today; set menu with "Yesterday"; publish; add photo; tap I've arrived near Green Park (or choose manually); undo; send again; open live mode; leaving soon; I've left; Stops → Not going today on Sahyadri → confirm; Me → My QR → Share; My reviews → reply to Arjun.
