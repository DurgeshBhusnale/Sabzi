# Pheri v1 — UX audit

**Date:** 15 Nov 2026 · **Scope:** buyer, vendor, shared/onboarding, system states, admin (brief) · **Type:** audit only, no code or design changed.

**Sources.** All 187 frames in `docs/design/screens/Pheri v4 {Buyer,Vendor,Shared,System States,Admin}.dc.html`, rendered to PNG with Playwright at 375 × 812 and reviewed one by one. Also read: the matching screens in `apps/mobile/app` and `apps/mobile/src`, `packages/shared/src/tokens.ts`, `docs/PRD.md` and `docs/DESIGN_BRIEF.md`.

**Limits.** The downloaded Buyer and Vendor files stop at B-09 and V-12 (256 KB cut-off, see `docs/design/README.md`). For B-10–B-16 and V-13–V-16, this audit used the built code as the reference. Produce pictures are missing from the renders because the `uploads/` image pack isn't committed. That didn't affect layout findings. A few design frames have render glitches, such as squashed buttons and clipped toggles. Those are flagged only where the built app does the same thing.

**How to read the issue IDs.** Problem types: **1** content on the wrong page · **2** weak section separation · **3** flat hierarchy · **4** misplacement and bad order · **O** other (navigation, missing info, competing actions, states, touch targets, bugs). Severity: **P0** confuses the user or blocks the job · **P1** noticeable friction · **P2** polish.

---

## 1. Summary: top 10 changes by impact

| # | Change | Fixes | Why it matters |
|---|---|---|---|
| 1 | **Turn vendor Today into a one-next-action screen.** Show one big card with the vendor's next step (Set menu → I've arrived → At Gate 1 → Send evening deal). Move the stats strip to Me. Shrink the stops list to just "Next stop". | UX-30, 31, 32, 33 | Today currently opens on vanity numbers and a full stop timeline. The vendor has to work out the next step for himself, outdoors and in a hurry. |
| 2 | **Move "change society" off buyer Home into Profile → My societies.** Home keeps the society name as small context text. It's only tappable when the buyer has saved 2–3 societies. | UX-01, 02, 26 | A buyer changes society almost never. Right now it's the top-left control on the most-used screen, and the gate shown next to it is often wrong. |
| 3 | **Replace the full-height forest hero on Home with compact "At the gate now" cards.** Every vendor at the gate gets the same card. Coming today follows straight after. | UX-03, 04, 05 | One vendor takes ~45% of the screen. A second vendor at the gate drops to a plain row below, with the same weight as "Coming today". |
| 4 | **Put one primary action on the vendor page, and make it depend on state.** Follow when not following. Call when following and calls are allowed. Request for tomorrow becomes a secondary action in its own section. | UX-10, 15 | Today there are two dark primary buttons on screen: Follow in the header and a sticky "Request for tomorrow" footer. They compete. |
| 5 | **Add a section system: a `Section` component with surface contrast, a stronger section title and fixed spacing between sections.** Apply it to every screen. | UX-11, 50–55 (§5) | Every section today is an italic 20 pt regular title on the same cream ground, separated only by hairlines. That's the root cause of "everything looks equally important". |
| 6 | **Fix wrong destinations.** "Request for tomorrow" on Home and the Requests tab's empty-state button both go to the Following tab. Give the Requests tab a "New request" flow: pick a vendor, then B-11. | UX-07, 23 | The buyer taps "Request" and lands on a list of vendors with no request button. Dead end. |
| 7 | **Make live mode the vendor's at-stop home.** Full-width XL "I've left" as the primary. "Leaving in 10 min" as a full-width secondary. Sold-out rows where the whole 56 dp row is the toggle. A link to the evening deal. | UX-36, 37, 38 | The two equal half-width buttons invite mis-taps. In the design, sold-out toggles are tiny or clipped. |
| 8 | **Make Following a management screen, not a second Home.** Group by society. Add a visible 48 dp "Alerts" button per row that opens B-07 in edit mode, with Unfollow inside it. Drop the forest header. | UX-19, 20, 21 | It repeats Home's live status, hides unfollow behind a long-press, and shows alert state as an icon you can't tap. |
| 9 | **Bring vendor-only and buyer-only content to the right tab.** Vendor Me gains Profile (phone, email) and loses nothing. Buyer Profile and Settings stop duplicating Notifications and Help. | UX-27, 28, 41, 42 | Vendors can't reach their phone or email at all: nothing links to `/account/profile`, which blocks AUTH-4. Buyers see the same three links twice. |
| 10 | **Bring every vendor control up to 56 dp and every buyer control up to 48 dp.** That covers evening-deal steppers and %-chips, Stops "Not going today" switches, Home row Follow pills, chips and icon buttons. Make "Same as yesterday" an XL button. | UX-06, 34, 39, 44, 45 | Several controls are 32–36 dp. The brief's rule is 48 dp buyer and 56 dp vendor primary. Vendors use one thumb in sunlight. |

---

## 2. Screen inventory

Frequency: **D+** several times a day · **D** daily · **W** weekly · **R** rarely (once, or on change).

### Buyer

| ID | Screen | Route / file | Who opens it, why | Freq. | The ONE primary job |
|---|---|---|---|---|---|
| B-01 | Pick your society | `app/buyer-setup/society.tsx` · `features/buyer/SocietyPicker.tsx` | New buyer at sign-up; buyer adding a second society | R | Pick my society |
| B-02 | Society not served | `app/buyer-setup/not-served.tsx` | Buyer whose society has no vendors | R | Join the waitlist |
| B-03 | Home | `app/(buyer)/home.tsx` · `features/buyer/HomeView.tsx` | Every buyer, every morning and after an alert | D+ | **See who is at my gate now and who comes next** |
| B-04 | Society switcher (sheet) | `features/buyer/SocietySwitcher.tsx` (opened from Home) | Buyer with 2–3 saved societies (e.g. parents' home) | R | Switch the society I'm looking at |
| B-05 | Vendor page | `app/buyer/vendor/[id].tsx` · `features/buyer/VendorPageView.tsx` | From an arrival alert, a Home row, a QR scan | D | **Decide whether to go down: what he has, at what price, is he good** |
| B-06 | Stock photo viewer | `app/buyer/photo.tsx` | Tap on the vendor page photo | W | Check today's stock quality |
| B-07 | Follow (sheet) | `features/buyer/FollowSheet.tsx` | Tap Follow on the vendor page | R | Follow at the right society, set alerts |
| B-08 | Following tab | `app/(buyer)/following.tsx` | Buyer managing vendors and alerts | W | **Manage who I follow and what alerts I get** |
| B-09 | All reviews | `app/buyer/reviews.tsx` | "See all" on the vendor page | R | Judge a vendor's quality |
| B-10 | Write a review | `app/buyer/review.tsx` · `features/engagement/WriteReviewView.tsx` | Following buyer after 3 days | R | Rate the vendor |
| B-11 | Request for tomorrow | `app/buyer/request.tsx` | From the vendor page | W | Ask for one item for tomorrow |
| B-12 | Requests tab | `app/(buyer)/requests.tsx` | Evening and next morning, to see replies | W | **See whether my vendor will bring what I asked** |
| B-13 | Evening deals | `app/buyer/deals.tsx` | Deal alert, or the Home strip after 5 PM | D | See today's reduced prices |
| B-14 | Report vendor | `app/buyer/report.tsx` | Vendor page overflow menu | R | Report a problem |
| B-15 | Notifications list | `app/buyer/notifications.tsx` | Home bell | W | Catch up on missed alerts |
| B-16 | Opened from QR | `app/v/[code].tsx` | Scanning a sticker | R | Follow this vendor |
| S-10 (B) | Profile tab | `app/(buyer)/profile.tsx` · `features/account/ProfileScreen.tsx` | Buyer changing account details | R | **Manage my account and my societies** |

### Vendor

| ID | Screen | Route / file | Who opens it, why | Freq. | The ONE primary job |
|---|---|---|---|---|---|
| V-01 | Business details | `app/vendor-setup/details.tsx` | Onboarding; editing later from Me | R | Describe my business |
| V-02 | Usual items | `app/vendor-setup/items.tsx` | Onboarding; editing later from Me | R | Pick the items I usually sell |
| V-03 | Waiting for verification | `app/vendor-setup/status.tsx` | After onboarding | R | Know what happens next |
| V-04 | Today | `app/(vendor)/today.tsx` · `features/vendor/TodayView.tsx` | Every vendor, at 6 AM and between stops | D+ | **Do the next thing for today** |
| V-05 | Set today's menu | `app/vendor/menu.tsx` · `features/vendor/MenuEditor.tsx` | Every morning at the mandi or tempo | D | **Publish today's menu in under 60 s** |
| V-06 | Price editor (sheet) | inside `MenuEditor.tsx` | Tap a tile | D+ | Set one price |
| V-07 | Stock photo | `app/vendor/photo.tsx` | Morning, from Today | D | Add today's photo |
| V-08 | I've arrived (sheet) | `features/vendor/ArriveSheet.tsx` (FAB on Today/Stops) | At each society gate | D+ | **Tell followers I'm at this gate** |
| V-09 | At the stop (live) | `app/vendor/live.tsx` | Right after arriving | D+ | **Run the stop: sold out, leaving, left** |
| V-10 | Mark sold out | `app/vendor/soldout.tsx` · `SoldOutList.tsx` | Mid-route | D | Mark what's finished |
| V-11 | Evening price drop | `app/vendor/deal.tsx` · `features/engagement/DealComposer.tsx` | Late afternoon | D | Clear leftovers with one alert |
| V-12 | Stops tab | `app/(vendor)/stops.tsx` | Before leaving home; when skipping a stop | W | **Check or skip my stops** |
| V-13 | Requests tab | `app/(vendor)/requests.tsx` · `VendorRequestsView.tsx` | Evening, before the mandi | D | **Decide what to buy tomorrow** |
| V-14 | Me tab | `app/(vendor)/me.tsx` | Weekly, or when asked for the QR | W | **See how I'm doing; reach QR, reviews, profile** |
| V-15 | My QR | `app/vendor/qr.tsx` | Field team visit, sharing | R | Show or share my QR |
| V-16 | My reviews | `app/vendor/reviews.tsx` | After a rating alert | W | Read and reply to reviews |

### Shared, onboarding, system

| ID | Screen | Route / file | Primary job |
|---|---|---|---|
| S-01 | Splash | `features/system/Splash.tsx` | Show the app is starting |
| S-02 | Welcome | `app/(auth)/welcome.tsx` | Get started or log in |
| S-03/04 | Phone, OTP | `app/(auth)/phone.tsx`, `otp.tsx` | Sign in with phone |
| S-05 | Email login | `app/(auth)/email.tsx` | Sign in with email |
| S-06 | Choose role | `app/(auth)/role.tsx` | Pick buyer or vendor |
| S-07 | Your name | `app/(auth)/name.tsx` | Give my name |
| S-08/09 | Notification and location rationale | `app/(auth)/notify.tsx`, `location.tsx` | Allow, or skip |
| S-11 | Add email | `app/account/email.tsx` | Add a second login |
| S-12 | Settings | `app/account/settings.tsx` | App preferences, log out |
| S-13 | Notification settings | `app/account/notifications.tsx` | Turn alert types on or off |
| S-14 | Help | `app/account/help.tsx` | Get help |
| S-16 | Delete account | `app/account/delete.tsx` | Delete my account |
| X-01…X-17 | System states | `features/system/*` | Recover from the error in one tap |

---

## 3. Issue table

| ID | Sev | Screen | Type | Problem | Fix | Files affected | Status |
|---|---|---|---|---|---|---|---|
| UX-01 | P0 | B-03 Home | 1, 4 | Society switcher ("Green Park, Gate 1 ▾") is the top-left control on Home and opens B-04. A buyer lives in one society and changes it almost never. | Remove the dropdown. Show `Green Park Residency` as a small caption under the greeting or eyebrow. Make it tappable (opening B-04) **only** when 2+ societies are saved, with no chevron otherwise. Add the full manager to Profile (UX-26). **Needs owner decision** (brief B-03 names a top-bar switcher). | `app/(buyer)/home.tsx`, `src/ui/TopAppBar.tsx` (society variant), `features/buyer/SocietySwitcher.tsx` | Partly fixed (#21): header = society only; switcher kept until owner decides (§6 #1) |
| UX-02 | P1 | B-03 Home | O (wrong data) | The header gate comes from `home.data[0].gate_name`: whatever the first vendor uses. The design shows "Green Park, Gate 1" above vendors at Gate 2 and the Clubhouse. The code also hacks the name with `.replace(' Residency', '')`. | Header shows the society only. The gate belongs on each vendor row/card ("Gate 2"). | `app/(buyer)/home.tsx` | Fixed (#21) |
| UX-03 | P1 | B-03 Home | 3, 4 | The forest hero gives one at-gate vendor ~45% of the screen (name in 32 pt display, 3 price boxes, View menu). A second vendor at the gate becomes an ordinary row in "Also at the gate", with the same weight as "Coming today". | Replace the hero with an **"At the gate now" section** of equal compact live cards: avatar/photo, name, ✓ verified, rating, "Gate 1 · until 8:45", top 3 prices on one line, a "View menu" tap target. Use a slim forest top band (≤ 120 dp) for the greeting/eyebrow only, or none. | `features/buyer/HomeView.tsx`, `src/ui/VendorCard.tsx`, `src/ui/Layout.tsx` (`ForestHero`) | Fixed (#21) |
| UX-04 | P1 | B-03 Home | 4 | The evening deals strip sits *between* the hero and "Coming today", glued to the next section with no gap (design 10). After 5 PM deals are the main job, but the strip still sits below a hero for a vendor the buyer may not want. | Order Home by time of day: **morning** At gate → Coming today → Not coming; **evening (deals live)** Deals card first → At gate → Coming today; **all left** Deals → Request for tomorrow → Left today. Use section spacing tokens (§5). | `features/buyer/HomeView.tsx`, `features/buyer/homeLogic.ts` | Fixed (#21) |
| UX-05 | P1 | B-03 Home | O (missing info) | Compact rows show time, name and "Gate 2 · Fruits" (design) or "Gate 2 · 4.3 ★" (code). The brief's buyer principle 2 is "rating, review count, verified badge and today's stock photo appear on every vendor card". Those trust signals are missing. | Row: 40 dp avatar or stock-photo thumb, name + ✓, "4.3 ★ (128) · Gate 2", time on the left. Drop the category ("Fruits"); it isn't in the data model. | `features/buyer/HomeView.tsx` (`VendorTimeRow`), `src/ui/VendorCard.tsx` | Fixed (#21) |
| UX-06 | P1 | B-03 Home | O (false affordance) | "Follow" on Coming-today rows looks like a button but isn't one: it's a `View` inside the row's `Pressable`, so tapping it opens the vendor page. It's also 32 dp tall. | Either (a) make it a real button with a 48 dp hit area that opens B-07 for that vendor (recommended: follows drive the adoption metric), or (b) remove it and show a small "Following" tick only on followed vendors. | `features/buyer/HomeView.tsx` | Fixed (#21) |
| UX-07 | P0 | B-03 Home (all left) | 1 | "Request for tomorrow" routes to the **Following tab** (`requestTomorrow: () => router.push('/(buyer)/following')`). There's no request button there. Dead end. | Open a "Request from…" vendor picker sheet (vendors serving my society, followed first) → B-11. Reuse it on B-12 (UX-23). | `app/(buyer)/home.tsx`, new `features/engagement/VendorPickerSheet.tsx`, `app/buyer/request.tsx` | Fixed (#21) |
| UX-08 | P2 | B-03 Home | O (bug) | The "Updated …" caption prints the current time (`formatIstTime(now)`), not when the data was fetched. Offline it claims to be fresh. | Use `home.dataUpdatedAt`. | `features/buyer/HomeView.tsx` | Fixed (#21) |
| UX-09 | P2 | B-03 Home (no vendors) | 2, 4 | Empty state splits across the dark hero (title) and a blank cream sheet (two buttons, no illustration, ~60% empty). | Use the standard `EmptyState` block (illustration, title, one line, primary "Tell us your vendor's name", tertiary "Pick another society") on a plain background. | `features/buyer/HomeView.tsx` | Fixed (#21) |
| UX-10 | P1 | B-05 Vendor page | 3, O (competing actions) | Two primary (dark) buttons: Follow in the header and a sticky "Request for tomorrow" footer (code). Call is the same size as Follow. For a buyer opening this from an arrival alert, "Request for tomorrow" is the wrong action to push. | One sticky primary by state: **not following → Follow**; **following + calls allowed → Call**; **following, no calls → no footer**. In the header, Follow/Following becomes secondary when following. Request for tomorrow moves into its own "Tomorrow" section as a secondary button (UX-15). | `app/buyer/vendor/[id].tsx`, `features/buyer/VendorPageView.tsx` | Fixed (#22) |
| UX-11 | P1 | B-05 Vendor page | 2, 3 | Menu, Stops and Ratings all use the same italic 20 pt regular title on the same cream ground with hairline rows. Hard to tell where the menu ends and stops begin when scrolling. | Use the new `Section` component (§5): menu on a white surface card (primary weight); stops and ratings on flat cream (secondary); 32 dp between sections. | `features/buyer/VendorPageView.tsx`, `src/ui/Layout.tsx` | Fixed (#22) |
| UX-12 | P1 | B-05 Vendor page | 1, O (missing info) | "Stops and timings" lists **every** stop in every society (Sai Residency, Karve Heights…). The buyer needs "when is he at *my* gate", and that line isn't in the header. | Under the name: "**Usually at Gate 1, 8:00–8:45 AM** · Daily". Collapse the other societies under "Other stops (2) ▾" at the bottom. | `features/buyer/VendorPageView.tsx` | Fixed (#22) |
| UX-13 | P2 | B-05 Vendor page | 3 | The ratings block is heavier than the menu: a 44 pt number, 5 bars, tags and 3 full reviews take ~1.3 screens. | Compact summary row (4.3 ★ · 128 ratings · top 3 tags) + 2 latest reviews + "See all 128". Move the bar breakdown to B-09. **Needs owner decision** (brief B-05 lists the bar breakdown on this page). | `features/buyer/VendorPageView.tsx`, `app/buyer/reviews.tsx` | Partly fixed (#22): safe default (bars kept, 2 reviews); owner decision §6 #3 |
| UX-14 | P2 | B-05 Vendor page | 4 | "Write a review" is a secondary button at the very end, shown only to followers, with no hint for buyers who aren't eligible yet. | "Rate Ramesh" as a link at the right of the Ratings header. When not eligible: "You can rate after 3 days of following · 2 days left". | `features/buyer/VendorPageView.tsx` | Fixed (#22) |
| UX-15 | P2 | B-05 Vendor page | 4 | "Home delivery available" floats alone between the buttons and the menu. | Merge it into the meta line: "Verified · Tempo · Home delivery". Put "Request for tomorrow" in a small "Tomorrow" section after the menu: "Want something he doesn't have? Request for tomorrow". | `features/buyer/VendorPageView.tsx` | Fixed (#22) |
| UX-16 | P1 | B-05 Vendor page | 4 | A 200 dp photo, 72 dp avatar overlap, name, rating line, pill, 48 dp button row and delivery line push the menu's first row to ~520 dp. Brief principle 4 wants "is he here, what does he have, how much" above the fold. With no photo, a 200 dp grey "No photo today" block wastes the space. | Photo 160 dp. Status pill on the same line as the rating. No-photo state: drop the block and start with the avatar header. That gets 5–6 menu rows above the fold. | `features/buyer/VendorPageView.tsx` | Fixed (#22) |
| UX-17 | P2 | B-05 Vendor page | O (states) | The "Not coming today" alternatives list ("Coming instead") sits *above* the menu, which is right, but uses the same row style as stops. | Render alternatives as compact live vendor cards (same as Home UX-03) so they read as "go here instead". | `features/buyer/VendorPageView.tsx` | Fixed (#22) |
| UX-18 | P2 | B-05 Vendor page | O | The overflow menu is an absolutely positioned card with no scrim and no dismiss on outside tap. | Use the `BottomSheet` "info" variant (Report vendor, Share) or a proper menu with outside-tap dismiss. | `app/buyer/vendor/[id].tsx` | Fixed (#22) |
| UX-19 | P1 | B-08 Following | 1, O (duplication) | Live status per vendor duplicates Home. It isn't grouped (a Karve Heights follow sits between Green Park ones). The design gives a forest header with just "Following · 4 vendors" ~25% of the screen. | Make Following a **management** list grouped by society (section per society). Row: avatar, name, rating, small status text, trailing **Alerts** button. Standard light top bar, no forest band. | `app/(buyer)/following.tsx` | Fixed (#23) |
| UX-20 | P1 | B-08 Following | O (discoverability) | Unfollow is press-and-hold only (plus a hint line at the bottom). The bell icon shows alert state but can't be tapped, so per-vendor alert prefs (BUY-4) aren't editable from here. | Trailing 48 dp "Alerts" button (bell + on/off) opens B-07 in edit mode: arrival, deals, request replies, and **Unfollow** at the bottom. Keep long-press as a shortcut. | `app/(buyer)/following.tsx`, `features/buyer/FollowSheet.tsx` | Fixed (#23) |
| UX-21 | P2 | B-08 Following (empty) | O | The empty state "Find vendors" goes to Home, which may itself be empty. | Keep, but on Home make sure unfollowed vendors carry a real Follow button (UX-06), so "Find vendors" has a next step. | `app/(buyer)/following.tsx` | Fixed (#21) |
| UX-22 | P2 | B-08 / B-12 / V-12 | 2 | Forest header bands on list tabs that have no hero content (Following, Stops, design Requests) add a large dark block with only a title. They also blur the meaning of the forest colour, which should mean "live / now". | Reserve the forest ground for **live moments**: buyer Home "at the gate", vendor live mode, celebration screens. List tabs use the standard light `TopAppBar`. | `app/(buyer)/following.tsx`, `app/(vendor)/stops.tsx`, `src/ui/Screen.tsx` | Not changed: safe default, owner decision §6 #6 |
| UX-23 | P0 | B-12 Requests | 1, O | The tab has no way to create a request. The empty-state button "Request an item" routes to the Following tab (dead end, same as UX-07). | Header action and empty-state primary "New request" → vendor picker sheet → B-11. | `app/(buyer)/requests.tsx`, `features/engagement/VendorPickerSheet.tsx` | Fixed (#23) |
| UX-24 | P2 | B-12 Requests | 3 | Date groups ("Tomorrow") use the same italic h2 as everything else. Status (Waiting / Will bring / Can't bring) is the answer the buyer came for but is a small chip at the card's side. | Section label style for the dates (§5). Card leads with the status line: "✓ Ramesh will bring it" / "Waiting for Ramesh" / "Ramesh can't bring it", then the item and quantity. | `app/(buyer)/requests.tsx`, `src/ui/RequestCard.tsx` | Fixed (#23) |
| UX-25 | P2 | B-03 / B-08 / B-12 | O (navigation) | The buyer tab set is Home, Following, Requests, Profile. Following and Requests are weekly-at-most and partly duplicate Home. A 3-tab set (Home, Requests, Profile, with "Vendors I follow" in Profile) would be simpler. | Keep 4 tabs for the pilot (lowest risk) but give each a distinct job (UX-19, 23). Revisit with week-2 analytics (tab open counts). **Needs owner decision** if moving to 3 tabs. | `app/(buyer)/_layout.tsx` | Not changed: safe default (4 tabs), owner decision §6 #4 |
| UX-26 | P0 | S-10 Profile (buyer) | 1 | Profile has no "My society" entry. Today the only place to see, add, remove or make primary a saved society is the Home dropdown. | Add a **My societies** section at the top of Profile: the primary society with a star, up to 2 more, "Add society" (disabled with hint at 3), remove and make-primary. It replaces B-04 as the manager. | `features/account/ProfileScreen.tsx`, `features/buyer/SocietySwitcher.tsx` | Fixed (#23) |
| UX-27 | P1 | S-10 Profile / S-12 Settings | 1, O (duplication) | Notification settings and Help appear in **both** Profile and Settings. The Email row uses the **Bell** icon. | Profile = identity (name, phone, email) + My societies + Notification settings + Settings ›. Settings = appearance, language, help, legal, log out, delete. Help appears in exactly one place (Settings). Email uses a Mail icon. | `features/account/ProfileScreen.tsx`, `app/account/settings.tsx` | Fixed (#23) |
| UX-28 | P2 | S-10 Profile | 3 | The "Buyer" role badge reuses the green Verified pill. It tells the user nothing and looks like a verification. | Remove it for buyers. For vendors, show the real status: "Verified vendor" / "Waiting for verification". | `features/account/ProfileScreen.tsx` | Fixed (#23) |
| UX-29 | P2 | S-12 Settings | 2 | Log out and Delete account sit in an ordinary group with no extra separation. | A separate last group with section spacing; Delete account in error colour, no chevron. | `app/account/settings.tsx` | Fixed (#23) |
| UX-30 | P0 | V-04 Today | 4, 1 | The top of Today is a greeting + stats strip (followers, alert opens, rating). Those numbers are for reflection, not the morning task. The real next step (Set menu) sits below them. | Remove the stats strip from Today; it lives on Me (V-14). Header = date + short greeting, ≤ 96 dp. **Needs owner decision** (brief V-04 lists a stats strip). | `features/vendor/TodayView.tsx`, `app/(vendor)/me.tsx` | Open |
| UX-31 | P0 | V-04 Today | 3, 4 | There's no single "next action". "STEP 1 Set today's menu" is a card, "Add today's photo" is a plain row (no "Step 2"), the stops timeline has equal weight, and the floating "I've arrived" shows even before the menu is set. In the design's at-a-stop state it still says "I've arrived" (code hides it). | A **Next action card** at the top, driven by state: (1) no menu → "Set today's menu" XL; (2) menu live, not at a stop → "I've arrived" (FAB) plus "Next: Green Park Gate 1 at 8:00"; (3) at a stop → green live card "At Green Park, Gate 1 · 18 opened" → opens V-09; (4) all stops done → "Send an evening deal" XL. Below it, a small checklist: Menu ✓ · Photo (optional) · Stops 1/3. | `features/vendor/TodayView.tsx`, `app/(vendor)/_layout.tsx` (FAB rules) | Open |
| UX-32 | P1 | V-04 Today | 1 | The full stops timeline repeats the Stops tab. | Show only **Next stop** (or current) as one row with "All stops ›" to the Stops tab. | `features/vendor/TodayView.tsx` | Open |
| UX-33 | P1 | V-04 Today | O (missing actions) | Mid-day the vendor can't reach **Mark sold out** or **Evening deal** from Today. Sold out is only inside live mode; the deal only after all stops are done. | A "Quick actions" row of 56 dp tiles under the next-action card: Mark sold out · Evening deal (enabled after 4 PM or when stops are done) · Requests (count). | `features/vendor/TodayView.tsx` | Open |
| UX-34 | P1 | V-05 Set menu | 3, 4 | "Same as yesterday", the fastest path to the 60-second goal, is a small pill at the top right. The "2 items need a price" warning is small red text at the top while the disabled Publish button sits at the bottom. | When yesterday's menu exists, show a full-width secondary XL "Copy yesterday (12 items)" above the grid. It hides once something is selected. Move the missing-price message into the sticky footer above Publish: "Add a price for Potato, Carrot to publish". | `features/vendor/MenuEditor.tsx`, `app/vendor/menu.tsx` | Open |
| UX-35 | P2 | V-05 Set menu | 3 | On selected tiles the price is the same size as the item name. The vendor scans prices, not names. | Selected tile: name (label), **price in vendor price style (22 pt)**, "was ₹35" caption. | `src/ui/ItemTile.tsx` | Open |
| UX-36 | P1 | V-09 Live | 3, O (competing actions) | "Leaving in 10 min" and "I've left" are equal half-width buttons side by side (each ~160 dp wide), easy to mis-tap with one thumb. | Stack them: "Leaving in 10 min" full-width XL secondary, then "I've left" full-width XL primary at the very bottom. | `app/vendor/live.tsx` | Open |
| UX-37 | P1 | V-09 Live / V-10 Sold out | O (touch targets) | Sold-out toggles are small switches at the far right (clipped off-frame in the V-10 design). Rows are greyed when sold out, so the state reads as "disabled". | The whole 56 dp row is the toggle. Show a clear "Sold out" red pill when on and keep the row at full contrast. | `features/vendor/SoldOutList.tsx`, `src/ui/Toggle.tsx` | Open |
| UX-38 | P2 | V-09 Live | 2 | Top bar title "Live" and eyebrow "● LIVE" repeat. There's no way to the evening deal or to Today's quick actions. | Drop the top bar title. Add a tertiary "Evening deal ›" link under the sold-out list. | `app/vendor/live.tsx` | Open |
| UX-39 | P1 | V-11 Evening deal | O (touch targets) | Per-item steppers (− ₹32 +) and "-10%"/"-20%" chips are ~32 dp. The vendor rule is 56 dp primary and 48 dp minimum. | 48 dp chips, 56 dp stepper buttons. One item per row with the new price in vendor price style. | `features/engagement/DealComposer.tsx`, `src/ui/PriceStepper.tsx`, `src/ui/Chip.tsx` | Open |
| UX-40 | P2 | V-08 I've arrived | 3 | "Other stops today" rows show no follower counts, while the suggested stop shows "42 people will be told". | Add the follower count to each fallback row so the choice is equal. | `features/vendor/ArriveSheet.tsx` | Open |
| UX-41 | P1 | V-12 Stops | O (touch targets), 4 | Each row repeats a "Not going today" caption above a small switch (~32 dp tall). The design's "Ask team to change stops" is a huge empty bordered box that the "I've arrived" FAB overlaps. | Trailing 48 dp text button "Skip today" (turns into "Skipped · Undo"). "Ask team to change stops" becomes a tertiary link at the end of the list, with bottom padding equal to FAB height + spacing. | `app/(vendor)/stops.tsx` | Open |
| UX-42 | P1 | V-14 Me | 1, O (missing) | Nothing links to `/account/profile`, so a vendor can't see his phone or add or verify an email (AUTH-4). The design's vendor "Me" frame (S-10 vendor) is the buyer profile with a Vendor pill, without V-14's stats, QR or reviews. | Me = stats (moved from Today) → **My QR** (primary card, it's the growth tool) → My reviews → Business details → Usual items → **Profile (phone, email)** → Settings. | `app/(vendor)/me.tsx` | Open |
| UX-43 | P2 | V-04 Today | 1 | The bell in the Today header opens the Requests **tab**. That duplicates the tab bar and isn't a notification list. | Remove the bell. Show an unread badge count on the Requests tab instead. | `features/vendor/TodayView.tsx`, `src/ui/TabBar.tsx` | Open |
| UX-44 | P2 | All | O (touch targets) | `controlHeights.chip = 32` and `iconButton = 36`. Hit slop covers 48 dp on icon buttons but not on chips (review tags, filter chips, quantity chips). | Chips 40 dp visible with a 48 dp hit area; vendor chips 48 dp. | `packages/shared/src/tokens.ts`, `src/ui/Chip.tsx` | Fixed (#20) |
| UX-45 | P2 | V-02 / V-05 | O | Tile grids show the item name twice in the design (image alt text + label). Fine in code, but tiles have no visible "selected" state other than border colour, which is weak in sunlight. | Selected = strong tint (`primaryTintStrong`) + check badge + 2 dp border. | `src/ui/ItemTile.tsx` | Open |
| UX-46 | P2 | S-02 Welcome | 4 | "Get started" and "Log in" are stacked with nearly equal weight. | Get started = primary. "I already have an account · Log in" = tertiary text link. | `app/(auth)/welcome.tsx` | Open |
| UX-47 | P2 | S-06 Role | 3 | Role cards are large with a radio at the top-right. Both look like unselected options until one is tapped; Continue is disabled grey. | Keep; make the whole card the radio (it is), drop the separate radio circle, and auto-advance on tap (saves one tap). | `app/(auth)/role.tsx` | Open |
| UX-48 | P2 | S-08 / S-09 | 3 | Rationale screens show a large blank illustration circle with the copy below and two buttons; Allow is fine. | Keep; ensure the illustration is the actual art (missing in the renders) and the one-line benefit is at body size, not caption. | `features/system/PermissionRationale.tsx` | Open |
| UX-49 | P2 | X-04 Pending actions | 2 | The pending list replaces Today's content in the design frame. | Show it as a sheet from the chip, so Today stays visible. | `features/system/PendingActions.tsx` | Open |
| UX-50 | P1 | System | 2, 3 | `textMuted` (#5F665E) and `textSecondary` (#5A675E) are almost identical, so there are only two text levels in practice. | See §5: three distinct text levels. | `packages/shared/src/tokens.ts` | Fixed (#20): textMuted #666D65 (not #6A7169: AA on sectionBg) |
| UX-51 | P1 | System | 2 | `bg` #F6F5EF vs `surface2` #EEEDE5 and `border` #E4E2D6 are below 1.1:1 contrast, so tinted groups and dividers disappear on cheap phone screens and in sunlight. | See §5: a stronger `sectionBg`, `border`, `divider`. | `packages/shared/src/tokens.ts` | Fixed (#20) |
| UX-52 | P1 | System | 3 | The section header (`h2`) is Newsreader *italic* 20/26 **weight 400**, only 5 pt larger than body and lighter. It doesn't read as a header. | See §5: `sectionTitle` token, 20/26 weight 500 non-italic, plus an optional eyebrow. | `packages/shared/src/tokens.ts`, `src/ui/Layout.tsx` | Fixed (#20) |
| UX-53 | P1 | System | 2 | Spacing between sections equals spacing inside them: `SheetBody` gap 16, Home 20, vendor page 24, Today 12. | See §5: `sectionGap` 32, `stackGap` 12, `rowGap` 0 with dividers. | `packages/shared/src/tokens.ts`, `src/ui/Layout.tsx`, `src/ui/Screen.tsx` | Fixed (#20): tokens + Section/Sections |
| UX-54 | P2 | System | O (tokens) | Hard-coded values in screens: `paddingHorizontal: 16` (gutter is 24), `rgba(255,255,255,0.2)`, `#CFCDBF`, `fontSize: 44`, `fontSize: 18`, `gap: 14`. | Replace with tokens (CLAUDE.md §5). | `HomeView.tsx`, `VendorPageView.tsx`, `TodayView.tsx`, `stops.tsx`, `today.tsx`, `home.tsx`, `Layout.tsx` | Fixed (#20) |
| UX-55 | P2 | Admin A-02 | 1, 3 | The dashboard shows vanity counts (societies live, active vendors, buyers following, awaiting review) instead of the PRD §1 pilot metrics (adoption %, alert open rate, week-4 retention, vendors with 10+ ratings). "Add society" is the primary button on the dashboard. "Needs attention", the actionable part, is secondary. | Top row = the 6 PRD metrics with targets. "Needs attention" as the first full-width list. Move "Add society" to Societies. | `apps/admin` dashboard | Open |
| UX-56 | P2 | Admin A-05 | O (missing) | The Vendors filter tabs are Pending, Verified, Suspended. The brief also lists **Needs info**. | Add a Needs info tab. | `apps/admin` vendors list | Open |

---

## 4. Revised layouts (priority screens)

Legend: **Keep** · **Move → screen** · **Remove** · **Merge** · **New**. Weight: **P** primary · **S** secondary · **T** tertiary.

### B-03 Buyer Home

Morning order (deals not yet live):

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Slim header: "Good morning" + `Green Park Residency` caption + bell | Merge (society switcher → caption) | T | Caption tappable only with 2+ saved societies (UX-01). No gate in the header (UX-02). |
| 2 | Network / notifications-blocked banners | Keep | S | Only when relevant. |
| 3 | **At the gate now** — one compact live card per vendor (avatar/photo, name ✓, 4.3 ★ (128), "Gate 1 · until 8:45", top 3 prices, View menu) | New (replaces forest hero) | **P** | All at-gate vendors get equal cards (UX-03). Live-accent left edge + pulse dot. |
| 3b | Empty variant: "No one at the gate right now. Next: Ramesh around 8:00 AM." | Keep (as a one-line card) | S | Not a full hero. |
| 4 | **Evening deals** card | Move (to slot 3 after 5 PM, otherwise hidden) | P in the evening | UX-04. |
| 5 | **Coming today** — rows: time, avatar, name ✓, rating, gate, real Follow button or "Following" tick | Keep, restyle | S | UX-05, UX-06. |
| 6 | **Left today** | Keep | T | Muted. |
| 7 | **Not coming today (n) ▾** | Keep | T | Disclosure row. |
| 8 | "Updated 8:05 AM" | Keep, fix data | T | UX-08. |
| — | Society switcher sheet (B-04) from the header | Move → Profile › My societies | — | UX-26. |
| — | "Request for tomorrow" (all-left state) | Keep, re-route | S | → vendor picker → B-11 (UX-07). |

### B-05 Vendor page

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Stock photo 160 dp (tap → B-06); back + overflow | Keep, shrink | S | No-photo: no block (UX-16). |
| 2 | Identity: avatar, **Ramesh Sabzi ✓**, "4.3 ★ · 128 ratings · Tempo · Home delivery" | Merge (delivery line in) | **P** | UX-15. |
| 3 | **Status for my society**: pill "At Gate 1 now · until 8:45" + "Usually 8:00–8:45 AM, daily" | New line | **P** | UX-12. |
| 4 | Follow / Following (secondary when following) + Call | Keep | S | Only one sticky primary (row 10). |
| 5 | "Not coming today" card + **Coming instead** cards | Keep, restyle | P when shown | UX-17. |
| 6 | **Today's menu** on a white surface section; "Updated 6:42 AM" right; search if > 12 items | Keep, restyle | **P** | UX-11. |
| 7 | **Tomorrow** — "Want something he doesn't have?" + Request for tomorrow (secondary) | New section (moved from footer) | S | UX-10, UX-15. |
| 8 | **Ratings** — compact summary, top tags, 2 reviews, "See all", "Rate Ramesh" link | Keep, slim | S | UX-13, UX-14. |
| 9 | **Other stops (n) ▾** | Move (from the middle to the end, collapsed) | T | UX-12. |
| 10 | Sticky footer: Follow (not following) **or** Call (following + calls allowed) **or** none | Replace | **P** | UX-10. |

### B-08 Following

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Light top bar "Following" + count | Replace forest header | T | UX-22. |
| 2 | Section per society ("Green Park Residency", "Sai Residency") | New grouping | S | UX-19. |
| 3 | Row: avatar, name ✓, 4.3 ★, small status text ("At Gate 1 now" / "Expected 9:30"), trailing **Alerts** button (bell on/off, 48 dp) | Keep, restyle | P per row | Tap row → B-05; Alerts → B-07 edit mode with Unfollow (UX-20). |
| 4 | "Press and hold to unfollow" hint | Remove | — | Not needed once Unfollow is in the sheet. |
| 5 | Empty: "You aren't following anyone" + Find vendors | Keep | P | — |

### B-12 Requests

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Top bar "Requests" + **New request** (right) | New action | S | UX-23. |
| 2 | **Tomorrow** (section label) → cards leading with status: "✓ Ramesh will bring it" / "Waiting for Ramesh" / "Can't bring" | Keep, restyle | **P** | UX-24. |
| 3 | Earlier dates | Keep | T | Muted. |
| 4 | Cancel (open only) | Keep | T | Tertiary inside the card. |
| 5 | Empty: "No requests yet" + **New request** | Re-route | P | Not to Following. |

### Buyer Profile (S-10 buyer)

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Avatar + name + edit | Keep | S | Remove the "Buyer" pill (UX-28). |
| 2 | **My societies** — primary ★, others, Add society (max 3), remove / make primary | New (moved from Home / B-04) | **P** | UX-26. |
| 3 | Account — Phone (•••• 1736), Email (add/verify), Mail icon | Keep, fix icon | S | UX-27. |
| 4 | Notification settings › | Keep | S | — |
| 5 | Settings › | Keep | T | Help moves into Settings only. |

### V-04 Vendor Today

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Short header: "Tue, 10 Nov · Good morning, Ramesh" (≤ 96 dp) | Keep, shrink | T | No bell (UX-43). |
| 2 | Banners: not verified, offline / X-04 chip | Keep | S | — |
| 3 | **Next action card** (state machine: Set menu XL → Next stop + arrive → Live card → Send evening deal XL) | New | **P** | UX-31. |
| 4 | Day checklist: Menu ✓ 12 items (Edit) · Photo (Add / ✓) · Stops 1 of 3 | Merge (step cards + photo row) | S | One compact card. |
| 5 | Quick actions: Mark sold out · Evening deal · Requests (n) — 56 dp tiles | New | S | UX-33. |
| 6 | **Next stop** row + "All stops ›" | Replace full timeline | S | UX-32. |
| 7 | Stats strip (followers, opens, rating) | Move → Me | — | UX-30. |
| 8 | FAB "I've arrived" | Keep; hidden before the menu is published (menu-first) and while live | P | Before the menu the next-action card owns the screen. **Needs owner decision** on hiding it before the menu (some vendors may arrive first). |

### V-05 Set today's menu

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Top bar "Today's menu" + close | Keep | T | — |
| 2 | **Copy yesterday (12 items)** XL secondary | Move (from pill) | **P** until used | UX-34. |
| 3 | Search (only if > 15 usual items) | Keep | T | — |
| 4 | Tile grid, 3 columns; selected tiles show the price in 22 pt | Keep, restyle | **P** | UX-35, UX-45. |
| 5 | Sticky footer: missing-price hint + "Publish menu (12 items)" XL | Merge | **P** | UX-34. |

### V-09 At the stop (live)

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Forest live band: "● LIVE", "Green Park, Gate 1 since 8:05", "18 opened your alert" | Keep | **P** | No duplicate "Live" title (UX-38). |
| 2 | **Sold out today?** — 56 dp rows, whole row toggles, red "Sold out" pill | Keep, restyle | S | UX-37. |
| 3 | "Evening deal ›" link | New | T | UX-38. |
| 4 | Footer: "Leaving in 10 min" full-width XL secondary, then "I've left" full-width XL primary | Restack | **P** | UX-36. |

### V-12 Stops

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Light top bar "Stops" | Replace forest header | T | UX-22. |
| 2 | Today / This week segmented control | Keep | S | — |
| 3 | Stop rows: time (price style), society + gate, followers; trailing **Skip today** 48 dp → "Skipped · Undo" | Restyle | **P** | UX-41. |
| 4 | "Ask team to change stops" tertiary link | Shrink | T | Bottom padding for the FAB. |

### V-14 Me

| # | Section | Action | Weight | Notes |
|---|---|---|---|---|
| 1 | Top bar "Me" | Keep | T | — |
| 2 | Stats: followers (+ week change), alert opens today, profile views, rating | Keep (also receives Today's strip) | S | Zero state: "Put your QR sticker on the tempo" + My QR. |
| 3 | **My QR** card with a Share button | Promote | **P** | Growth tool. |
| 4 | Followers by stop (bar list) | Keep | S | — |
| 5 | My reviews · Business details · Usual items | Keep | S | — |
| 6 | **Profile (phone, email)** | New link | S | UX-42. |
| 7 | Settings (includes Help) | Merge | T | UX-27. |

### Onboarding / auth (S-02 → S-09, V-01 → V-03, B-01)

| Screen | Change | Weight |
|---|---|---|
| S-02 Welcome | Get started primary; "Log in" tertiary link (UX-46) | P / T |
| S-03 Phone | Keep: one field, Send OTP sticky footer, "Use email instead" tertiary | P |
| S-06 Role | Card tap = choose and continue (UX-47) | P |
| S-07 Name | Keep | P |
| S-08 / S-09 | Keep; real art; benefit line at body size (UX-48) | P |
| B-01 Society | Keep; this is where society choice belongs at sign-up | P |
| V-01 → V-03 | Keep "Step n of 3"; V-03 primary "Set up my menu", secondary "Call support" (already right) | P |

---

## 5. Design-system changes (tokens and components)

These fix separation and hierarchy everywhere at once. Each proposal names the exact token or component in `packages/shared/src/tokens.ts` and `apps/mobile/src/ui`.

### 5.1 Colour tokens — three real text levels, visible surfaces

| Token | Now (light) | Proposed (light) | Proposed (dark) | Why |
|---|---|---|---|---|
| `textSecondary` | #5A675E | **#4F5B53** | #A9B5AC | Supporting text. AA on `bg` and `sectionBg`. |
| `textMuted` | #5F665E | **#6A7169** (≈ 4.6:1 on #F6F5EF) | #8C988F | Timestamps and hints. Now visibly lighter than secondary (UX-50). |
| `border` | #E4E2D6 | **#D9D6C8** | #34413A | Card and input edges you can see outdoors. |
| new `divider` | — | **#E6E3D7** | #2A352E | Row hairlines inside a section (lighter than card borders). |
| new `sectionBg` | — | **#EFEDE4** | #141C17 | Ground behind flat (secondary) sections when the page ground is `surface`; see 5.4. |
| new `liveEdge` | — | `accent` #178046 | #6BE39C | 3 dp left edge on live cards ("at the gate", current stop). |

Rule: forest (`forest`, `onForest*`) is used **only** for live moments (buyer at-gate band, vendor live mode, celebrations, splash). List tabs never use it (UX-22).

### 5.2 Type scale — a real section title and a section label

Add to `TypeScale` (buyer / vendor):

| Token | Buyer | Vendor | Use |
|---|---|---|---|
| `h1` (page title) | Newsreader 28/32 **400** (keep) | 30/34 | One per screen, in the top bar or first line. |
| new `sectionTitle` | **Figtree 18/24 600**, not italic | 20/26 600 | Every section header. Replaces italic `h2` in `SectionHeader`. |
| new `sectionLabel` | Figtree 12/16 600, uppercase, letter-spacing 0.8, `textSecondary` | 13/18 | Sub-groups inside a section ("TOMORROW", "GREEN PARK RESIDENCY"). |
| `h2` | keep italic Newsreader 20/26 | 22/28 | Only for **editorial** moments (empty-state titles, welcome, done-for-today), never section headers. |
| `label` | 14/18 500 → **15/20 500** | 17/22 | Row titles a step above body-small. |
| `caption` | 12/16 500 | 14/18 | Meta only. |

Result: page title (serif) > section title (bold sans) > row title (medium sans) > meta (small, muted). That's four visibly different levels in place of today's two (UX-52).

### 5.3 Spacing — between sections vs inside them

Add to `spacing` (all on the 4 pt grid):

| Token | Value | Use |
|---|---|---|
| `sectionGap` | **32** (vendor 32) | Vertical space between two sections. The only gap between sections (UX-53). |
| `sectionHeaderGap` | **12** | Section title → its first row or card. |
| `stackGap` | **12** | Between cards inside one section. |
| `rowGap` | **0** | Rows inside a list are separated by `divider`, not space. |
| `inset` | 16 | Card inner padding (keep as `md`). |
| `screen` | 24 (keep) | Side gutter. Remove every hard-coded 16 (UX-54). |

`SheetBody`, `Screen` and every view stop using ad-hoc `gap` values (12/16/20/24) between sections and use `<Section>` (below) inside a `gap: sectionGap` stack.

### 5.4 Components

**`Section`** (new, `src/ui/Section.tsx`): the single building block for every screen body.

```
<Section
  title="Today's menu"            // sectionTitle style, accessibilityRole="header"
  meta="Updated 6:42 AM"          // caption, textMuted, right-aligned
  action={{ label: 'See all', onPress }}   // optional tertiary link, 48 dp hit area
  weight="primary" | "secondary" | "tertiary"
  collapsible? defaultOpen?
>
```

| Weight | Look | Use for |
|---|---|---|
| `primary` | White `surface` card, `border`, radius `card`, `inset` padding; rows inside use `divider` | The screen's main job: Home "At the gate now", vendor-page menu, vendor next-action card, Requests "Tomorrow". **At most one or two per screen.** |
| `secondary` | No card; flat on the page ground; title + rows with dividers | Supporting lists: Coming today, Ratings, Stops, Following groups |
| `tertiary` | Collapsed disclosure row (title + count + chevron), `textSecondary` | Not coming today, Other stops, Left today |

**Card vs flat list rule.** Use a card when the content is **one object you act on** (a vendor at the gate, the next action, a request). Use a flat list with dividers when the content is **many peers you scan** (menu rows, stops, reviews, settings links). Never put a card inside a card. Never use a card for a single link row.

**`SectionHeader`** (existing, `Layout.tsx`): switch from `h2` italic to `sectionTitle`. Add `meta` (muted) and `action` (link) slots. Remove `alignItems: 'baseline'` mixing two families.

**`LiveVendorCard`** (new or a `VendorCard` variant): compact at-gate card used on Home, Following and "Coming instead". `liveEdge` left border, pulse dot, name ✓, rating, gate and until-time, three prices in one line, whole card pressable, ≥ 96 dp.

**`NextActionCard`** (new, vendor): `primary` section with an eyebrow ("NEXT"), one-line context, and one XL (56 dp) button. Used only on vendor Today.

**`StatTile`**: keep. It now only appears on Me.

**`Chip`**: height 40 visible / 48 hit area (buyer), 48 (vendor). `controlHeights.chip` 32 → 40, new `controlHeights.vendorChip` 48 (UX-44).

**`ListRow`**: minimum height 56 → buyer 56 / vendor 64. Title uses `label`, subtitle `caption` in `textSecondary`, meta in `textMuted`. Trailing slot accepts a real `Button` (no fake pills, UX-06).

**`Screen` / `ForestHero`**: `tone="forest"` allowed only via a `live` prop on Home, live mode and celebrations. Default top bar is the light `TopAppBar` with `h1`.

**`ToggleRow`** (new): whole-row toggle, 56 dp vendor / 48 dp buyer, label left, state pill right. Used by sold-out lists, notification settings, Follow sheet (UX-37).

---

## 6. Needs owner decision

These fixes conflict with `docs/DESIGN_BRIEF.md` or `docs/PRD.md`, which this audit does not change. The safest default is listed. Nothing here is built yet.

| # | Issue | Brief / PRD says | Proposed | Safe default until decided |
|---|---|---|---|---|
| 1 | UX-01, UX-26 society switcher | Brief B-03: top bar "society switcher (Green Park, Gate 1 ▾)"; B-04 sheet opened from Home; §4 Top app bar "society switcher variant" | Society name as caption on Home (tappable only with 2+ saved); manager in Profile → My societies | Add My societies to Profile now (no conflict); keep the Home control until decided |
| 2 | UX-30 vendor stats on Today | Brief V-04: "Stats strip: followers, alert opens today, rating" | Move to Me (V-14) only | Keep a one-line stats strip *below* the next-action card |
| 3 | UX-13 ratings breakdown | Brief B-05: "Ratings and reviews summary (bar breakdown, top tags) with latest 3 reviews" | Compact summary + 2 reviews; bars on B-09 | Keep the bars, cut reviews to 2, move the section below the menu and Tomorrow |
| 4 | UX-25 buyer tabs | Brief §3 Navigation: "Home, Following, Requests, Profile" | Keep 4 for the pilot; consider 3 (Home, Requests, Profile) after week-2 analytics | Keep 4 tabs |
| 5 | UX-31 hide "I've arrived" before the menu is published | Brief V-04 shows the floating "I've arrived" in every state; §3: FAB on Today and Stops | Menu first: next-action card owns the screen until the menu is live | Keep the FAB visible but secondary-styled until the menu is live |
| 6 | UX-22 forest headers on list tabs | Design v4 frames (B-08, V-12) use forest bands | Light top bar on list tabs; forest only for live moments | Follow the design (no brief conflict; the design file is the look reference) until decided |
| 7 | UX-55 admin dashboard metrics | PRD ADM-7 / brief A-02: metric cards for the §1 pilot metrics | Replace the 4 v4 count cards with the 6 PRD metrics | Follow the PRD (the brief already agrees; the v4 design drifted) |
| 8 | UX-12 own-society stop line | PRD BUY-3: "stops and times" | Show my gate's time in the header, other stops collapsed | No conflict, listed for visibility |

---

*Method note: frames were rendered with Playwright (Chromium) from the `.dc.html` files at 375 × 812 and reviewed in groups of four; code was read for every priority screen to confirm the built app matches the design and to catch behaviour the frames can't show (wrong routes, fake buttons, unreachable screens).*
