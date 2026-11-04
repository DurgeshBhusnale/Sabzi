# Sabzi Vendor App — UI Design Brief for Claude Design

Nov 4, 2026 · @Durgesh Tushar Bhusnale

## 0. Instructions for the design AI

**Paste this whole document into Claude Design.** You are designing the complete mobile UI for a two-sided app that connects local vegetable vendors in Pune, India, with residents of housing societies. Design every screen and every state listed here, for both roles, plus a small admin web panel.

**Skills to use.** Load and follow these skills before and while designing:

- **ui-ux-pro-max** for palette checks, font pairing, UX guidelines and mobile layout rules
- **Impeccable** for visual polish and craft
- **design-taste-frontend** to avoid generic, templated "AI-made" looks
- **frontend-design** for typography and aesthetic direction
- **design-system** to build the tokens and components first and keep them consistent
- **accessibility-review** to check contrast, touch targets and screen-reader labels (WCAG 2.1 AA)
- **ux-copy** for button labels, empty states and error messages

If a skill is not available, follow the rules in this brief directly.

**Order of work**

1. Build the design system first: colour tokens (light and dark), type scale, spacing, radius, icons, and all components in section 4 with their states.
2. Then design the screens in this order: shared screens (section 5), buyer (section 6), vendor (section 7), system states (section 8), notifications and QR (section 9), admin web (section 10).
3. Use the realistic sample data in section 11. Never use lorem ipsum.
4. Run the final checklist in section 11 before handing over.

**Rules that must not be broken**

- Frame size: Android phone, 360 × 800 dp. Admin panel: 1440 × 900 desktop.
- Minimum touch target 48 × 48 dp; vendor primary buttons at least 56 dp tall.
- Every screen shown in light mode; key screens also in dark mode.
- English only in version 1, but leave room for Marathi and Hindi text, which runs about 30% longer.
- Prices always in ₹ with unit, for example "₹40 / kg".
- No payment or checkout screens. Buyers pay vendors in person.

## 1. Product context

Vegetable vendors drive tempos or push carts (thelas) to housing societies every day. Residents walk down to the gate to pick and buy. This app tells residents **when their vendor has arrived, what he has today, at what price, and how good he is**. It tells vendors **who follows them at each society and what buyers want tomorrow**.

- **Working name:** "Sabzi" (placeholder; the final brand name is not decided, so keep the wordmark easy to swap)
- **One app, two roles:** after phone OTP login, the user picks Buyer or Vendor once; each role has its own home and navigation
- **Admin web panel:** used by the field team to verify vendors, set up societies and stops, and moderate reviews
- **Pilot area:** Karve Nagar and Sus–Pashan in Pune

**Version 1 features to design**

| Role | Features |
| --- | --- |
| Buyer | Pick society; see vendors coming today with live status; vendor page with today's menu, prices and stock photo; follow vendors; arrival alerts; public 1–5 star ratings with tags; request an item for tomorrow; evening deal alerts; report a vendor |
| Vendor | Profile; pick usual items; publish today's menu in under 60 seconds; today's stock photo; my stops; "I've arrived" one-tap button; "Leaving in 10 min"; mark sold out; evening price drop; tomorrow's requests; my numbers (followers, alert opens, rating); my QR code; reply to reviews |
| Admin | Societies and gates, vendor verification, stops, QR sticker PDF, item master list, moderation queue, pilot dashboard |

**Not in version 1 (do not design):** reservations or "keep it aside", cart or checkout, online payment, delivery tracking, subscriptions, chat.

## 2. Brand system

The brand is a fresh, calm leaf green: bright enough to feel like fresh vegetables, never neon or loud. Green carries the brand and the main actions; a warm turmeric amber marks deals and ratings; everything else stays quiet and neutral.

**Personality:** fresh, honest, neighbourly, calm. It should feel like a trusted local sabziwala, not a flashy delivery app.

### 2.1 Colour palette (light mode)

| Token | Hex | Use |
| --- | --- | --- |
| brand-leaf | #24A05E | Logo, illustrations, large status pills, icons, the "At the gate" pulse. Contrast with white is about 3.4:1, so never use it behind small white text |
| primary | #178046 | Primary buttons, links, selected tab, toggles. White text on it is about 5:1 |
| primary-pressed | #12653A | Pressed state of primary |
| primary-tint | #EAF6EF | Selected chips, highlighted rows, success banners |
| primary-tint-strong | #CFEBDB | Selected item tiles in the vendor menu grid |
| deal-amber | #F2A93B | Evening deal badges, star ratings |
| deal-amber-tint | #FDF2DF | Deal banner background |
| deal-amber-text | #6B4300 | Text on amber backgrounds |
| error | #C93B3B | Errors, "sold out", destructive actions. White text on it is about 5:1 |
| error-tint | #FBEAEA | Error banners |
| warning | #B7791F | Weak network, pending states |
| info | #2F6FBF | Neutral info banners, links in admin |
| bg | #F8FAF7 | App background (very light, slightly green-warm) |
| surface | #FFFFFF | Cards, sheets |
| surface-2 | #F1F4F0 | Inputs, secondary cards, skeleton base |
| border | #DFE6DE | Card and input borders, dividers |
| text-primary | #17201A | Main text |
| text-secondary | #56625A | Supporting text |
| text-muted | #8A948C | Hints, timestamps |
| disabled | #C5CCC6 | Disabled controls |

### 2.2 Colour palette (dark mode)

| Token | Hex |
| --- | --- |
| brand-leaf | #45C57F |
| primary | #3CC17A, with text #08210F on it |
| primary-tint | #173324 |
| deal-amber | #F5B85A |
| error | #F07070 |
| bg | #0F1411 |
| surface | #161D18 |
| surface-2 | #1E2721 |
| border | #2B352E |
| text-primary | #ECF2ED |
| text-secondary | #A9B5AC |
| text-muted | #7D8980 |

Verify every pairing with the accessibility-review skill and adjust shades slightly if any falls below 4.5:1 for body text.

### 2.3 Status colours (used in pills and dots)

| Status | Colour | Example label |
| --- | --- | --- |
| At the gate now | brand-leaf with a soft pulsing dot | "At Gate 1 now" |
| Expected | text-secondary on surface-2 | "Expected 8:00–8:45 AM" |
| Leaving soon | deal-amber | "Leaving in 10 min" |
| Left | text-muted | "Left at 8:40 AM" |
| Not coming today | error text on error-tint | "Not coming today" |
| Verified | primary with a check icon | "Verified" |

### 2.4 Typography

| Style | Font | Size / line height | Weight |
| --- | --- | --- | --- |
| Display | Plus Jakarta Sans | 28 / 34 | 700 |
| Heading 1 | Plus Jakarta Sans | 22 / 28 | 700 |
| Heading 2 | Plus Jakarta Sans | 18 / 24 | 600 |
| Body | Inter | 16 / 24 | 400 |
| Body small | Inter | 14 / 20 | 400 |
| Caption | Inter | 12 / 16 | 500 |
| Price | Inter, tabular numbers | 18 / 24 | 700 |
| Button | Inter | 16 / 20 | 600 |

Vendor mode uses a larger scale: body 18, buttons 18, prices 22. Plan for Noto Sans Devanagari as the fallback for Marathi and Hindi later.

### 2.5 Spacing, shape, elevation

- 4-point grid: 4, 8, 12, 16, 20, 24, 32, 40, 48. Screen side padding 16.
- Corner radius: 8 for inputs and chips, 12 for cards, 20 for bottom sheets, full pill for status badges.
- Mostly flat: 1 px borders on cards. One soft shadow only for bottom sheets, the floating "I've arrived" button and snackbars.

### 2.6 Icons and imagery

- Icons: outline style (Lucide or Phosphor), 24 dp, 1.75 stroke; filled version for the selected bottom tab.
- Vegetable images: one consistent set of simple, original flat illustrations (2 to 3 colours each, soft shadow-free), shown on a light circle. They must read clearly at 48 dp.
- Vendor and stock photos: real photos with 12 dp rounded corners and a grey placeholder while loading.
- Empty and error illustrations: simple line-and-fill drawings in brand-leaf and amber, for example an empty crate, a tempo, a phone with no signal.

### 2.7 Logo direction

A simple mark combining a leaf and a location pin, in brand-leaf, beside a wordmark in Plus Jakarta Sans. Keep the wordmark text replaceable because the name is not final.

### 2.8 Voice and copy

- Short, plain, friendly Indian English. Talk like a helpful neighbour.
- Use the vendor's name and the gate: "Ramesh is at Gate 1 now" rather than "Vendor arrived".
- Errors say what happened and what to do: "No internet. Your menu will publish when you're back online."
- Never blame the user. No exclamation marks except in celebrations.

## 3. Design principles and layout

The vendor is busy, standing at a tempo, often in sunlight, with one free hand. The buyer is at home, glancing at a notification. Design each side for that moment.

### Vendor mode

1. **One thumb, one tap.** Primary actions are huge (56 dp+), at the bottom of the screen, reachable by the thumb.
2. **Pictures and numbers, not words.** Items are picture tiles; prices are big numbers with ± buttons. Typing only for prices.
3. **Sunlight-readable.** High contrast, larger type scale, no thin grey text for important information.
4. **Always show what happened.** Every tap gives clear feedback: "Sent to 42 followers", "Saved, will send when online".
5. **Forgiving.** Every broadcast has a 5-second "Undo" snackbar.

### Buyer mode

1. **Status first.** The first thing a buyer sees is who is at the gate now or coming next.
2. **Trust is visible.** Rating, review count, verified badge and today's stock photo appear on every vendor card.
3. **Calm.** Few notifications, quiet colours, no urgency tricks.
4. **One screen to decide.** The vendor page answers "Is he here, what does he have, how much, is he good?" without scrolling past the fold for the first three.

### Layout specs

| Item | Spec |
| --- | --- |
| Frame | 360 × 800 dp Android; status bar 24 dp; gesture nav bar 48 dp |
| Top app bar | 56 dp; title left-aligned; back arrow on inner screens |
| Bottom navigation | 64 dp; 4 tabs max; label always visible |
| Side padding | 16 dp |
| Card | Full width, 12 dp radius, 1 px border, 16 dp inner padding |
| Touch target | 48 dp minimum (buyer), 56 dp minimum for vendor primary actions |
| Lists | 72 dp rows for vendor or item rows with an image |
| Bottom sheet | 20 dp top radius, drag handle, max 85% height |

### Navigation

- **Buyer bottom tabs:** Home, Following, Requests, Profile.
- **Vendor bottom tabs:** Today, Stops, Requests, Me. A floating "I've arrived" button sits above the tabs on Today and Stops.
- **Admin:** left sidebar: Dashboard, Societies, Vendors, Stops, Items, Moderation, Team, Settings.

## 4. Component library

Build these components first, each with every listed state, in light and dark mode. Screens in sections 5 to 10 must use only these components.

| Component | Variants | States to design |
| --- | --- | --- |
| Button | Primary, secondary (outline), tertiary (text), destructive, vendor XL (56 dp), floating action ("I've arrived") | Default, pressed, disabled, loading (spinner, label kept), success (check, 1 s) |
| Text input | Text, phone with +91 prefix, price (₹ prefix, numeric keypad), search, multiline | Empty, focused, filled, error with message, disabled |
| OTP input | 6 boxes, auto-advance, paste support | Empty, typing, error (shake + red), success, resend timer |
| Chip | Filter chip, selectable tag (for review tags), unit chip (kg, 500 g, 250 g, bunch, piece) | Default, selected, disabled |
| Status pill | At the gate, Expected, Leaving soon, Left, Not coming, Verified, Sold out, Deal | One each, plus pulsing-dot animation for "At the gate" |
| Vendor card (buyer) | Compact (list row), large (home hero for "At the gate now") | Live, expected, left, not coming, unverified hidden, loading skeleton |
| Menu item row (buyer) | Item image, name, price and unit, sold-out or deal state | Normal, sold out (greyed, strike price), deal (old price struck, new price in amber badge) |
| Item tile (vendor) | Square picture tile in a 3-column grid | Not selected, selected for today (tint + check), with price set, sold out |
| Price stepper (vendor) | Big price number with −5, −1, +1, +5 buttons and unit chip | Default, editing, changed from yesterday (small "was ₹35" hint), invalid |
| Stop row (vendor) | Society name, gate, time window, follower count | Upcoming, current (arrived), done, skipped ("Not going today") |
| Rating stars | Display (small) and input (large, 40 dp stars) | 0 to 5, half-star display, disabled |
| Review card | Avatar initial, name, society, stars, tags, text, date, vendor reply | Normal, with reply, hidden-by-admin (shown only to the author) |
| Request card | Item, quantity, note, buyer society, status | Open, will bring, can't bring |
| Stat tile (vendor) | Big number, label, small trend | Normal, zero, loading |
| Bottom sheet | Info, confirm, picker (society, unit), form | Open, dragging, with keyboard |
| Dialog | Confirm, destructive confirm, permission rationale | Default |
| Snackbar | Success, info, error, with "Undo" action | Default, with countdown for undo |
| Banner (inline) | Offline, weak network, pending send, info, deal, error | Each type with icon and optional action |
| Skeleton loader | Vendor card, menu row, stat tile, list | Shimmer |
| Empty state block | Illustration, title, one line, one action | Several, see section 8 |
| Avatar | Vendor photo, buyer initial | Image, initial fallback, loading |
| Photo uploader | Camera tile for today's stock photo | Empty, capturing, uploading with progress, uploaded, failed with retry |
| Bottom navigation | Buyer (4 tabs), vendor (4 tabs) | Selected, unselected, with badge count |
| Top app bar | Title, back, actions; society switcher variant | Default, scrolled (subtle border) |
| Toggle and checkbox | Notification settings, delivery available, allow calls | On, off, disabled |
| Segmented control | Unit selector, admin filters | Each option selected |
| QR code card | Vendor QR with name and "Scan to follow" | Default, share action |

## 5. Shared screens (both roles)

These screens come before the role split, or are the same for both roles. Phone number is mandatory; email is an optional second way to log in.

| ID | Screen | What is on it | States to design |
| --- | --- | --- | --- |
| S-01 | Splash | Logo mark and wordmark on brand-leaf or bg; tiny version number | Default; slow start (after 3 s show "Getting fresh things ready…") |
| S-02 | Welcome | 3 short slides: "Know when your sabziwala arrives", "See today's vegetables and prices", "Pick vendors by quality". Buttons: Get started, Log in | Each slide; skip |
| S-03 | Enter phone number | +91 prefix, 10-digit field, "Send OTP" button, terms and privacy line, link "Use email instead" (only works for users who already added email) | Empty, valid, invalid number, sending, too many attempts ("Try again in 59 min") |
| S-04 | Enter OTP | 6-box OTP input, number shown with "Edit", resend timer (30 s), auto-read SMS hint | Waiting, auto-filled, wrong OTP, expired OTP, verifying, success |
| S-05 | Email login | Email field, "Send code", then 6-digit code | Empty, invalid email, email not linked to any account, code sent, wrong code |
| S-06 | Choose your role | Two large cards: "I buy vegetables" (home icon) and "I sell vegetables" (tempo icon), one-line description each, Continue | Nothing selected, buyer selected, vendor selected |
| S-07 | Your name | Name field, optional profile photo (vendor) | Empty, filled, error |
| S-08 | Notification permission (rationale) | Illustration of a phone buzzing; "Get told when your vendor is at the gate" (buyer) or "Know when buyers request items" (vendor); Allow and Not now | Default; after denial (see section 8) |
| S-09 | Location permission (rationale) | Buyer: "Find societies near you"; Vendor: "Tap 'I've arrived' and we'll pick the right gate". Allow and Not now | Default; after denial |
| S-10 | Profile | Photo or initial, name, phone (masked except last 4), email (add or verify), role badge, links to settings | Buyer and vendor versions; email not added; email unverified |
| S-11 | Add and verify email | Email field, send code, code input | Empty, sent, verified (success snackbar), error |
| S-12 | Settings | Notifications, language (English only, others "coming soon"), dark mode (system, light, dark), help, privacy policy, terms, app version, log out, delete account | Default |
| S-13 | Notification settings | Buyer: arrival, deals, request replies (global toggles); vendor: request alerts, rating alerts | All on, some off, system notifications blocked (banner with "Open settings") |
| S-14 | Help and contact | FAQ list (6 to 8 questions), call support, WhatsApp support link, email | Default |
| S-15 | Log out confirm | Dialog | Default |
| S-16 | Delete account | Explanation of what is deleted, type "DELETE" to confirm, destructive button | Default, confirming, deleted (farewell screen) |

## 6. Buyer screens

The buyer's home must answer "Who is at my gate now, and who is coming?" in one glance. The vendor page must answer "What does he have, at what price, and is he good?".

| ID | Screen | What is on it | States to design |
| --- | --- | --- | --- |
| B-01 | Pick your society | Search field; "Near you" list from GPS (name, area, distance); "My society isn't listed" link | Loading nearby, results, no search results, location off (search only), selected |
| B-02 | Society not served yet | Illustration of an empty gate; "We're not in Rohan Leher yet"; "Notify me when vendors join" button; option to pick another society | Default, after joining waitlist |
| B-03 | Home | Top bar: society switcher ("Green Park, Gate 1 ▾") and notification bell. **At the gate now:** large vendor card(s) with pulsing status, top 3 items with prices, "View menu". **Coming today:** compact vendor cards sorted by expected time. **Evening deals** strip (amber) after 5 PM. **Not coming today** collapsed section. First-run coach marks on the follow button | Morning with one vendor at the gate; nobody at the gate yet; evening with deals; all vendors left for the day; no vendors serve this society (see section 8); loading skeleton; pull to refresh |
| B-04 | Society switcher (bottom sheet) | Up to 3 saved societies with a primary star; "Add society" | 1 saved, 3 saved (add disabled with hint) |
| B-05 | Vendor page | Header: today's stock photo (tap to enlarge) with vendor avatar overlapping; name; Verified badge; rating (4.3 ★, 128 ratings); status pill; buttons: Follow / Following, Call (if allowed); "Home delivery available" or "Pickup at gate only". Sections: **Today's menu** (updated 6:42 AM; item rows with price per unit; sold-out and deal states; search if more than 12 items); **Stops and timings** for this vendor; **Ratings and reviews** summary (bar breakdown, top tags) with latest 3 reviews and "See all"; "Request for tomorrow" button; overflow menu: Report vendor, Share | At the gate; expected; left; not coming today; menu not published yet ("Ramesh hasn't posted today's menu yet"); everything sold out; no photo today; new vendor with no ratings ("New on Sabzi"); loading; vendor suspended (unavailable page) |
| B-06 | Stock photo viewer | Full-screen photo, pinch zoom, time taken ("Today 6:38 AM") | Loaded, loading, failed |
| B-07 | Follow (bottom sheet) | "Follow Ramesh at which society?" (pre-selects current); toggles: arrival alerts, evening deals; Follow button | Default; notifications blocked at system level (warning with "Turn on") |
| B-08 | Following tab | List of followed vendors with live status, society, notification icons; swipe or menu to unfollow | Several vendors; none followed (empty state with "Find vendors"); loading |
| B-09 | All reviews | Summary at top, filter chips (5★…1★, tags), review cards with vendor replies | Many reviews; filter with no results; no reviews yet |
| B-10 | Write a review | Large star input, tags (Fresh, Correct weight, Fair price, Polite, Clean), optional text (300 characters), "Your review is public" note, Submit | Empty, stars chosen, submitting, submitted (thank-you), not eligible yet ("You can rate Ramesh after following him for 3 days — 2 days left"), already reviewed (shows edit, locked until 7 days pass) |
| B-11 | Request for tomorrow | Vendor shown at top; item picker (grid of item pictures plus search plus "Something else" free text); quantity chips (250 g, 500 g, 1 kg, 2 kg, custom); note; Send | Empty, item chosen, sending, sent ("Ramesh will see this before he goes to the market"), request limit reached (max 5 open requests per vendor) |
| B-12 | Requests tab | My requests grouped by date: item, vendor, status (Waiting, Will bring, Can't bring); cancel open request | Several; none yet (empty with "Request an item"); loading |
| B-13 | Evening deals (bottom sheet from alert or home strip) | Followed vendors' deals: item, old price struck, new price in amber, vendor, where he is now | Deals available; deals ended |
| B-14 | Report vendor | Reason chips (Wrong weight, Bad quality, Rude behaviour, Fake listing, Other), text, optional photo, Submit | Empty, submitting, submitted ("Our team will look into this within 24 hours") |
| B-15 | Notifications list | Last 7 days: arrivals, deals, request replies; tap opens the right screen | Several, unread markers, empty |
| B-16 | Opened from QR scan | Vendor preview card with rating and today's status; "Follow Ramesh" primary button; pick society if not set | Logged in; not logged in (goes to S-03, then returns here) |

## 7. Vendor screens

The vendor's two critical moments are the morning menu (target under 60 seconds) and the "I've arrived" tap. Both need the biggest, simplest UI in the app. Use the larger vendor type scale everywhere here.

| ID | Screen | What is on it | States to design |
| --- | --- | --- | --- |
| V-01 | Business details (onboarding) | Display name ("Ramesh Sabzi"), photo, Tempo or Thela (two picture cards), vehicle number (optional), PMC vendor ID number and photo (optional), "I can deliver to homes" toggle, "Buyers can call me" toggle | Empty, filled, photo uploading, error |
| V-02 | Choose your usual items | 3-column picture grid of vegetables with search; tap to select; counter "14 selected"; "Add an item not listed"; Continue | None selected (Continue disabled), some selected, search no results (offer to add custom) |
| V-03 | Waiting for verification | Illustration of a handshake; "Our team will call you within 1 day to verify"; checklist of what happens next; "You can set up your menu now. Buyers will see you after verification." Call support button | Pending; needs more info (what is missing + upload); rejected (reason + contact); verified (celebration, first-time only) |
| V-04 | Today (home) | Header: "Good morning, Ramesh" and date. **Step card 1:** "Set today's menu" (XL button) or, when done, "Menu live · 12 items · updated 6:42 AM" with Edit. **Step card 2:** "Add today's photo" or the photo thumbnail. **Today's stops:** vertical timeline with time windows and follower counts, current stop highlighted. **Stats strip:** followers, alert opens today, rating. Floating XL button "I've arrived" | Before menu (6 AM); menu published; at a stop (live banner); after all stops ("Done for today. Send an evening deal?"); offline with queued actions; not yet verified (banner); loading |
| V-05 | Set today's menu | Sticky top: "Today's menu" and a "Same as yesterday" quick button. Grid of usual items as picture tiles; tapping selects and opens price. Selected tiles show the price ("₹40 / kg") and a small "was ₹35" hint when changed. Sticky bottom: "Publish menu (12 items)" XL button | First time (no yesterday, prices empty); copying yesterday; some prices missing (tiles with red outline, publish disabled with hint); publishing; published (snackbar "Live for 186 followers"); offline (publish saved, "Will go live when online") |
| V-06 | Price editor (bottom sheet) | Item picture and name; big price number; −5, −1, +1, +5 buttons; numeric keypad on tap; unit chips (kg, 500 g, 250 g, bunch, piece); Save | Default, changed, invalid (₹0 or above ₹999), keyboard open |
| V-07 | Today's stock photo | Camera viewfinder with a frame guide "Fit your tempo in the frame"; capture; preview with Retake and Use photo | Camera, preview, uploading with progress, uploaded, upload failed with retry, camera permission denied |
| V-08 | I've arrived (bottom sheet) | Suggested stop from GPS: "Green Park · Gate 1 · 180 m away" with followers count "42 people will be told"; other today's stops list as fallback; XL button "Send arrival alert" | GPS finding; stop suggested; no stop within 300 m (choose manually); GPS off (manual list + "Turn on location"); already alerted here in the last 2 hours (button disabled, explains when it unlocks); sending; sent (big check, "Sent to 42 people", Undo for 5 s); offline ("Will send when online" with warning that it may arrive late) |
| V-09 | At the stop (live mode) | Large green banner "You're at Green Park, Gate 1 since 8:05 AM"; buttons: "Leaving in 10 min" and "I've left"; quick sold-out list of today's items with toggles; live count "18 opened your alert" | Live; leaving-soon sent; left (returns to Today) |
| V-10 | Mark sold out | Today's items as rows with big toggles | Some sold out; all sold out (prompt: "Everything sold out? Mark today as done") |
| V-11 | Evening price drop | Select items (only today's unsold); for each: new price stepper or quick "-10%", "-20%"; preview of the buyer alert; "Send to 96 followers at your remaining stops" | No items selected; ready; sending; sent; already used today ("You can send one deal a day. Next tomorrow."); no remaining stops today |
| V-12 | Stops tab | Today and This week toggle; stop rows: society, gate, time window, followers; switch "Not going today" per stop (with confirm: "42 followers will be told"); "Ask team to change stops" button | Normal; a stop skipped; no stops assigned yet (empty: "Our team will add your stops after verification") |
| V-13 | Requests tab | Header: "For tomorrow"; items grouped with picture, total quantity, number of buyers, societies; expand for notes; per item: "Will bring" or "Can't bring" | Before 4 PM ("Requests so far" with note that more may come); several requests; all answered; no requests (empty: "No requests yet. Share your QR so more buyers follow you") |
| V-14 | Me tab | Stats: followers by stop (bar list), alert opens today, profile views this week, average rating; links: My QR, My reviews, Business details, Usual items, Settings, Help | Normal; new vendor with zeros (encouraging copy) |
| V-15 | My QR | Large QR card with name and "Scan to follow me"; Share and Save image; "Ask the team for a printed sticker" | Default |
| V-16 | My reviews | Rating summary; review cards; Reply (one reply each); Flag review (reason) | Several; no reviews yet; replying; reply posted; flagged ("Our team will check") |

## 8. System and edge-case screens

These are the screens most products forget. Design each one with an illustration, a one-line title, one line of help, and one clear action. Show buyer and vendor variants where the copy differs.

### 8.1 Network and server

| ID | Screen or pattern | Copy and action |
| --- | --- | --- |
| X-01 | No internet (full screen, when nothing is cached) | "You're offline. Check your mobile data or Wi-Fi." Retry |
| X-02 | No internet (banner, when cached data is shown) | Top banner: "Offline · showing data from 7:12 AM" |
| X-03 | Weak network | Banner: "Slow connection. Things may take longer." |
| X-04 | Vendor actions waiting to send | Persistent chip on Today: "2 actions waiting to send" with a list (menu publish, sold out); each item shows queued, sending, sent, failed with retry |
| X-05 | Server error | "Something went wrong on our side. Please try again." Retry, Contact support |
| X-06 | Request timed out | "This is taking too long." Retry |
| X-07 | Session expired | "Please log in again to continue." goes to S-03 with the number pre-filled |

### 8.2 Permissions

| ID | Screen | Copy and action |
| --- | --- | --- |
| X-08 | Notifications blocked | Buyer: "You won't know when vendors arrive." Vendor: "You won't hear about requests." Open settings |
| X-09 | Location denied | Buyer: search societies by name instead. Vendor: "Choose your stop from the list." Open settings |
| X-10 | Camera denied | "Allow camera to add today's photo." Open settings, Skip for today |

### 8.3 App status

| ID | Screen | Copy and action |
| --- | --- | --- |
| X-11 | Force update | "A new version is needed to continue." Update (opens Play Store) |
| X-12 | Optional update | Dismissable banner: "New version available." Update |
| X-13 | Maintenance | "We're improving things. Back by 6:00 AM." No action |
| X-14 | Page not found | Vendor removed or broken link: "This vendor isn't available any more." Go home |
| X-15 | Vendor account suspended (vendor view) | "Your account is paused. Our team will call you." Call support |
| X-16 | OTP limit reached | "Too many tries. Try again in 59 minutes." Use email instead |
| X-17 | Society outside pilot area | Same as B-02 waitlist |

### 8.4 Empty states (design each)

| Where | Title | Action |
| --- | --- | --- |
| Buyer home, no vendors for this society | "No vendors here yet" | Tell us your vendor's name (opens a short form), Switch society |
| Buyer home, nobody at the gate | "No one at the gate right now. Next: Ramesh around 8:00 AM." | none |
| Buyer home, all vendors done for the day | "All vendors have left for today" | See evening deals, Request for tomorrow |
| Following tab | "You aren't following anyone" | Find vendors |
| Requests tab (buyer) | "No requests yet" | Request an item |
| Notifications list | "Nothing new" | none |
| Reviews | "No reviews yet. Be the first after 3 days of following." | none |
| Vendor Today before menu | "Start your day: set today's menu" | Set today's menu |
| Vendor Requests | "No requests yet" | Share my QR |
| Vendor Stops | "Stops will appear after verification" | Call support |
| Vendor stats at zero | "Your followers will show here. Put your QR sticker on the tempo." | My QR |
| Search with no results | "No match for 'drumstik'" | Clear search; vendor: add as custom item |

### 8.5 Loading

Design skeleton versions of: buyer home, vendor page, Following list, vendor Today, Requests. Use shimmer on surface-2. Buttons that start actions show an inline spinner and keep their label. No full-screen spinners except the splash.

## 9. Notifications, QR sticker and web page

The push notification is the product's most-seen screen. Design it as carefully as any app screen.

### 9.1 Push notifications (Android notification shade, collapsed and expanded)

| Type | Title | Body |
| --- | --- | --- |
| Arrival | Ramesh is at Gate 1 now | Tomato ₹40/kg · Onion ₹30/kg · Methi ₹15/bunch + 9 more |
| Leaving soon | Ramesh leaves Gate 1 in 10 min | Still has tomato, bhindi, palak |
| Evening deal | Evening deal from Ramesh | Tomato now ₹30/kg (was ₹40) · Coriander ₹5/bunch |
| Not coming | Ramesh isn't coming to Green Park today | We'll tell you when he's back |
| Request reply | Ramesh will bring drumsticks tomorrow | Your request for 500 g |
| Vendor: new requests | 6 requests for tomorrow | Drumsticks ×3, Broccoli ×2, Baby corn ×1 |
| Vendor: new rating | New 5★ rating from Green Park | "Always fresh, correct weight" |

Expanded arrival notification shows the vendor's stock photo as a large image. Use the app icon (leaf + pin) in brand-leaf.

### 9.2 In-app banner

When the app is open and an alert arrives, show a top banner card with vendor avatar, message and "View" button, auto-hiding after 5 seconds.

### 9.3 QR sticker (print)

- Size: A6 portrait (105 × 148 mm), to stick on a tempo or thela.
- Content: logo; large QR; vendor name and photo; "Scan to know when I'm at your gate"; "See today's vegetables and prices"; small Verified mark; vendor code.
- Design for outdoor reading: high contrast, brand-leaf header band, white QR area with a quiet margin.
- Also design an A4 poster for society notice boards: "Your vegetable vendors are now on Sabzi" with a QR to the society page and photos of 3 vendors.

### 9.4 Web fallback page (QR opened without the app)

Mobile web page: vendor card (photo, name, rating, today's status and menu preview), "Get the app to follow Ramesh" button to the Play Store, and a line "Already have the app? Open".

## 10. Admin web panel (desktop, 1440 × 900)

The admin panel is a working tool for the field team: dense, clear tables and fast forms, in the same brand colours but with a quieter, neutral layout. Left sidebar navigation, top bar with search and the admin's name.

| ID | Screen | What is on it | States to design |
| --- | --- | --- | --- |
| A-01 | Admin login | Email and password, then a 6-digit code (2-step) | Default, wrong password, code step, locked |
| A-02 | Dashboard | Filter by area (Karve Nagar, Sus–Pashan, All) and date range. Metric cards: active vendors, buyers, society adoption %, alert open rate, buyer week-4 retention, vendors with 10+ ratings. Charts: daily arrival alerts and opens (line), followers by society (bar). Tables: top vendors, societies needing attention | Normal, loading, no data yet (pilot not started) |
| A-03 | Societies list | Table: name, area, gates, flats, vendors serving, followers, adoption %; Add society | Normal, empty, search no results |
| A-04 | Society detail and edit | Form: name, area, address, map with draggable pin, gates (add multiple pins), number of flats; tabs: vendors, followers trend; button: print society poster | New, edit, saving, validation errors |
| A-05 | Vendors list | Table with status filter tabs: Pending, Verified, Needs info, Suspended; columns: name, phone, vehicle, stops, followers, rating, last active | Each filter, empty |
| A-06 | Vendor detail | Profile, documents (PMC ID photo), verification actions (Verify, Ask for info with reason, Reject, Suspend), stops, today's menu, reviews, reports, QR sticker download (PDF) | Pending, verified, suspended, confirm dialogs for each action |
| A-07 | Stops planner | Pick vendor; add stop: society, gate, days (M–Su chips), time window; weekly grid view of a vendor's stops; conflicts warning (two stops overlapping) | Normal, conflict, empty |
| A-08 | Items master list | Grid or table of vegetables: picture, name, default unit, used by N vendors; add or edit item with image upload; review vendor custom items (approve to master list) | Normal, editing, custom items pending |
| A-09 | Moderation queue | Tabs: Reported vendors, Flagged reviews. Each row: content, reporter, date; actions: Hide review (with reason sent to reviewer), Keep, Warn vendor, Suspend vendor | Items pending, all clear (empty) |
| A-10 | Team | Admin users with roles (Owner, Field staff); invite by email; deactivate | Normal |
| A-11 | Settings | App-wide settings: OTP limits, alert limits, quiet hours, force-update version, maintenance mode toggle | Normal, confirm for maintenance mode |

## 11. Sample data, checklist and deliverables

Use this sample data on every screen so the designs feel real. All names are fictional, and prices are realistic examples.

### Sample vendors

| Vendor | Type | Rating | Stops |
| --- | --- | --- | --- |
| Ramesh Sabzi (Ramesh Pawar) | Tempo, home delivery yes | 4.4 ★ (128) | Green Park Residency Gate 1, 8:00–8:45 AM; Sahyadri Heights Main Gate, 9:00–9:40 AM |
| Sunita Fresh (Sunita Jadhav) | Thela, pickup only | 4.7 ★ (64) | Tulsi Vihar Gate 2, 7:30–8:15 AM |
| Imran Vegetables (Imran Shaikh) | Tempo, home delivery yes | 3.9 ★ (41) | Green Park Residency Gate 1, 6:00–6:45 PM |
| Ganesh Bhaji Wala (Ganesh More) | Tempo, new, no ratings yet | New | Nandanvan Society Gate A, 5:30–6:15 PM |

**Societies:** Green Park Residency (Karve Nagar, 420 flats), Sahyadri Heights (Karve Nagar, 260 flats), Tulsi Vihar (Pashan, 310 flats), Nandanvan Society (Sus, 180 flats).

**Buyers:** Priya Kulkarni (Green Park, B-wing), Arjun Deshpande (Sahyadri Heights), Meera Joshi (Tulsi Vihar).

### Sample menu (Ramesh, today)

| Item | Price |
| --- | --- |
| Tomato | ₹40 / kg (deal in evening: ₹30) |
| Onion | ₹30 / kg |
| Potato | ₹35 / kg |
| Bhindi (okra) | ₹60 / kg |
| Methi (fenugreek) | ₹15 / bunch |
| Palak (spinach) | ₹15 / bunch |
| Coriander | ₹10 / bunch (sold out) |
| Cauliflower | ₹40 / piece |
| Cabbage | ₹30 / piece |
| Green chilli | ₹20 / 250 g |
| Capsicum | ₹80 / kg |
| Brinjal | ₹50 / kg |

### Sample reviews

- Priya Kulkarni, 5 ★, tags Fresh and Correct weight: "Vegetables are always fresh and he never cheats on weight." Vendor reply: "Thank you, didi."
- Arjun Deshpande, 3 ★, tag Fair price: "Good quality but a bit costly compared to others."
- Meera Joshi, 5 ★, tag Polite: "Sunita tai keeps methi aside for me if I'm late."

### Final checklist before handing over

- [ ] Every screen in sections 5 to 10 is designed, including every listed state
- [ ] Light mode for all screens; dark mode for buyer home, vendor page, vendor Today, set menu, I've arrived, and notifications
- [ ] Contrast meets WCAG 2.1 AA; no small white text on brand-leaf (#24A05E)
- [ ] Touch targets: 48 dp buyer, 56 dp vendor primary
- [ ] Only components from section 4 are used; no one-off styles
- [ ] Copy follows section 2.8 and was checked with the ux-copy skill
- [ ] Text containers survive 30% longer strings (future Marathi and Hindi)
- [ ] No checkout, cart or payment screens
- [ ] Brand name appears only as a replaceable wordmark

### Deliverables

1. Design system page: colours (light and dark), type, spacing, icons, every component with states.
2. Buyer flow: S-01 to S-16 where relevant, B-01 to B-16.
3. Vendor flow: S-01 to S-16 where relevant, V-01 to V-16.
4. System states: X-01 to X-17, empty states, skeletons.
5. Notifications, QR sticker (A6), society poster (A4), web fallback page.
6. Admin panel: A-01 to A-11.
7. A clickable prototype of the two key journeys: buyer receives an arrival alert and opens the vendor page; vendor publishes the morning menu and taps "I've arrived".
