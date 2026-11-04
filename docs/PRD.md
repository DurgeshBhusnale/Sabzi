# Sabzi Vendor App — PRD v1 (Pilot)

Nov 4, 2026 · @Durgesh Tushar Bhusnale

**Version 1 is one Android-first app where local vegetable vendors post today's items, prices and a stock photo, tap "I've arrived" at each society, and buyers who follow them get notified, see the menu, and rate the vendor's quality.** The pilot runs in Karve Nagar and Sus–Pashan. It must prove that residents follow vendors and that vendors keep using the app daily.

- **Working name:** Sabzi Vendor App (brand not fixed yet)
- **Platform:** one app with two roles (buyer, vendor), plus a web admin panel for the field team
- **Login:** phone number with OTP, required for everyone; email optional
- **Language:** English for version 1
- **Payments:** none in the app; buyers pay the vendor in person (cash or UPI)
- **Ratings:** public from day one
- **Out of version 1:** reservations ("keep it aside"), subscriptions, home-delivery ordering
- **Background:** [Market & Competitor Research](https://claude.ai/artifact/HYhQLEWuEg9Sp979ieBF56) and [Idea Discovery](https://claude.ai/artifact/CqfAhRSNYgfafvnXB7kMC3). Idea codes (B1, V2…) refer to the Ideas doc.

## 1. Problem, goals and success metrics

**Problem.** Residents in Pune societies buy vegetables from tempo and thela vendors who come by. They learn about the vendor's arrival by word of mouth, cannot see today's stock or prices before going down, and judge quality only by asking neighbours. Vendors buy stock at Market Yard before sunrise without knowing demand, serve only the residents who happen to hear about them, and carry leftover stock home.

**Goals for version 1**

1. Buyers know when their vendor is at the gate and what he has today.
2. Buyers can choose vendors by quality, using public ratings.
3. Vendors reach more residents per stop and clear more stock with evening deals.
4. Vendors hear what buyers want tomorrow, so they buy better at the mandi.

**Non-goals for version 1:** online payment, reservations, delivery logistics, our own stock, monetisation.

**Pilot success metrics (proposed targets; adjust after week 2)**

| Metric | Definition | Target by end of pilot |
| --- | --- | --- |
| Active vendors | Vendors who post today's menu on at least 5 days a week | 70% of onboarded vendors |
| Society adoption | Residents following at least one vendor, as a share of flats in a pilot society | 15% of flats |
| Alert usefulness | Share of arrival alerts opened within 15 minutes | 30% |
| Buyer retention | Buyers who open the app in week 4 out of those who joined in week 1 | 40% |
| Ratings | Vendors with 10 or more ratings | 50% of active vendors |
| Vendor value | Vendors who say they sold more or wasted less (asked by the field team at week 4) | 60% |

## 2. Users and roles

There are three roles. Buyers and vendors use the same mobile app; the role is chosen once at sign-up and decides which home screen they see. Admins use a web panel.

| Role | Who | What they need | Where they use it |
| --- | --- | --- | --- |
| Buyer | Any resident of a served society: working professionals, homemakers, elderly residents | Know when the vendor arrives, see today's stock and prices, pick a good vendor, ask for items | Mobile app, buyer mode |
| Vendor | Tempo or thela vegetable vendor buying at Market Yard, 10 to 15 items a day, fixed routes | Set up today's menu fast, tell residents he has arrived, clear leftovers, know what people want tomorrow | Mobile app, vendor mode |
| Admin | Your father and the field team | Onboard and verify vendors, add societies and stops, handle complaints and ratings disputes, see pilot numbers | Web admin panel |

**Role rules**

- One phone number = one account = one role in version 1. A vendor who also wants to buy uses a second number, or we add role switching later.
- Vendors are only visible to buyers after an admin verifies them (V8).
- A vendor may have a helper; in version 1 the helper does not get a login.

## 3. Scope

Version 1 covers 13 product ideas from the Ideas doc. Reservations (B5) moved to version 2 as you decided, so the vendor's demand sheet (V3) ships in a lighter form built only from buyers' requests (B7).

| Area | In version 1 | Out of version 1 |
| --- | --- | --- |
| Accounts | Phone + OTP login, optional email, buyer or vendor role | Role switching, helper logins |
| Vendor | V1 morning menu setup with pictures, V2 one-tap "arrived" / "leaving soon" / "sold out", V3-lite tomorrow's requests list, V4 evening price drop, V5 followers and alert opens per stop, V7 QR page and sticker, V8 verified badge | V6 sales book, V9 helper delivery list, V10 repeat-customer list, full V3 demand sheet with reservations |
| Buyer | B1 arrival alert, B2 today's menu and prices, B3 public ratings and reviews, B4 today's stock photo, B6 evening deals alert, B7 request for tomorrow | B5 keep it aside, B8 standing order, B9 order for parents, B10 compare view, B11 freshness badge |
| Delivery | Vendor profile shows "home delivery: yes or no" and a call button | Delivery orders in the app |
| Payments | None; buyer pays the vendor in person | Wallet, UPI checkout, subscriptions |
| Admin | Web panel: vendors, societies, stops, verification, moderation, metrics | Billing, ads |
| Languages | English | Marathi, Hindi |

Growth tactics G1, G2, G4, G5, G7 and G8 run outside the app through the field team; the app supports them with QR codes (V7), verified badges (V8) and society pages.

## 4. Core flow

One vendor day touches the buyer four times: the morning menu, the arrival alert, the evening deal and the next-day request.

&#91;embedded content: core flow · one day for a vendor and a buyer\]

The sale itself happens in person and outside the app. The app's job is to get the buyer to the gate at the right time and to bring the buyer's wishes back to the vendor before his next trip to Market Yard.

## 5. Functional requirements

Each requirement has an ID so we can track it in development and testing. Priority: **P0** = pilot cannot launch without it; **P1** = needed during the pilot.

### 5.1 Login and accounts

| ID | Requirement | Priority |
| --- | --- | --- |
| AUTH-1 | Sign up with an Indian mobile number and a 6-digit OTP. Phone number is mandatory for every account | P0 |
| AUTH-2 | Resend OTP after 30 seconds; block a number for 1 hour after 5 failed attempts | P0 |
| AUTH-3 | Choose role at sign-up: Buyer or Vendor. The role decides the home screen | P0 |
| AUTH-4 | Optional email in profile. Once verified, the user can log in with an email OTP instead of a phone OTP | P1 |
| AUTH-5 | Stay logged in until the user logs out; refresh sessions silently | P0 |
| AUTH-6 | Delete account from settings; reviews stay but show "Former user" | P1 |

### 5.2 Vendor features

| ID | Requirement | Priority |
| --- | --- | --- |
| VEN-1 | Profile: name, photo, tempo or thela, vehicle number (optional), PMC vendor ID (optional), home delivery yes or no, "allow calls" toggle | P0 |
| VEN-2 | One-time item setup: pick usual items from a master list of vegetables with pictures; add a custom item if missing | P0 |
| VEN-3 | Morning menu (V1): grid of usual items; tap to mark available today; price per unit (kg, 500 g, 250 g, bunch, piece); yesterday's price pre-filled; buttons for ±₹1 and ±₹5; one "Publish today's menu" button. Target: under 60 seconds | P0 |
| VEN-4 | Today's stock photo (B4): optional, camera only, compressed under 300 KB, replaces yesterday's | P0 |
| VEN-5 | My stops: list of societies and expected time windows set by the admin; vendor can mark a stop "Not going today", which updates buyers' screens | P0 |
| VEN-6 | "I've arrived" button (V2): suggests the nearest stop using GPS within 300 m, with manual choice as fallback; sends an arrival alert to that society's followers. Limit: one arrival alert per stop per 2 hours | P0 |
| VEN-7 | "Leaving in 10 minutes" button: sends a short reminder to followers at the current stop who opened the arrival alert or have not yet seen it | P1 |
| VEN-8 | Sold out: tap an item to mark it sold out; the menu updates instantly; no notification | P0 |
| VEN-9 | Evening price drop (V4): choose items and a new price; sends one deal alert to followers at today's remaining stops. Limit: one deal alert per day | P1 |
| VEN-10 | Tomorrow's requests (V3-lite): list of buyer requests grouped by item, with counts and societies, visible from 4 PM; vendor marks each item "Will bring" or "Can't bring", and buyers are notified | P1 |
| VEN-11 | My numbers (V5): followers per stop, alert opens today, profile views this week, average rating | P1 |
| VEN-12 | My QR (V7): shows the vendor's QR code; the same code is printed on the sticker by the admin | P0 |
| VEN-13 | Reply once to each review | P1 |

### 5.3 Buyer features

| ID | Requirement | Priority |
| --- | --- | --- |
| BUY-1 | Choose my society from a list (GPS suggests the nearest). A buyer can save up to 3 societies, for example home and parents' home | P0 |
| BUY-2 | Home screen: vendors serving my society today with live status: Expected (time window), At the gate now, Left, Not coming today | P0 |
| BUY-3 | Vendor page: photo, verified badge, average rating and count, today's menu with prices and "updated at" time, today's stock photo, stops and times, home delivery yes or no, call button (if allowed), Follow button, reviews | P0 |
| BUY-4 | Follow or unfollow a vendor for a society. Notification settings per vendor: arrival, evening deals, request replies | P0 |
| BUY-5 | Arrival alert (B1): "Ramesh Sabzi is at Gate 1, Green Park. Tomato ₹40/kg, Onion ₹30/kg and 10 more". Tapping opens the vendor page | P0 |
| BUY-6 | Ratings (B3): 1 to 5 stars plus optional tags (fresh, correct weight, fair price, polite) and text. Public from day one. One rating per buyer per vendor, editable after 7 days. Only buyers who have followed the vendor for 3+ days can rate | P0 |
| BUY-7 | Request for tomorrow (B7): choose a vendor, an item (from the list or free text), optional quantity and note; see the vendor's reply | P1 |
| BUY-8 | Evening deals alert (B6): receive the vendor's price-drop alert; tapping shows the reduced items | P1 |
| BUY-9 | Report a vendor: wrong weight, rude behaviour, fake listing, other; goes to the admin | P1 |
| BUY-10 | Open a vendor page from a scanned QR code; if the app is not installed, a small web page shows the vendor and a Play Store link | P0 |

### 5.4 Notifications

| ID | Requirement | Priority |
| --- | --- | --- |
| NOT-1 | Push notifications through Firebase Cloud Messaging for: arrival, leaving soon, evening deal, request reply | P0 |
| NOT-2 | Arrival alerts must reach followers within 10 seconds of the vendor's tap | P0 |
| NOT-3 | No promotional notifications between 9 PM and 6 AM; arrival alerts are allowed at any time the vendor is genuinely there | P1 |
| NOT-4 | In-app notification list for the last 7 days | P1 |

### 5.5 Ratings and moderation

| ID | Requirement | Priority |
| --- | --- | --- |
| RAT-1 | Vendor page shows average rating, count and tag counts; newest reviews first | P0 |
| RAT-2 | Admin can hide a review that is abusive or fake; the reviewer is told why | P0 |
| RAT-3 | Vendor can flag a review for admin attention | P1 |

### 5.6 Admin web panel

| ID | Requirement | Priority |
| --- | --- | --- |
| ADM-1 | Societies: name, area (Karve Nagar or Sus–Pashan), address, map pin, gates (one or more), number of flats | P0 |
| ADM-2 | Vendors: review sign-ups, verify (with photo of PMC ID or other proof), activate, suspend | P0 |
| ADM-3 | Stops: assign a vendor to a society gate with days of the week and a time window | P0 |
| ADM-4 | QR stickers: generate a printable PDF sticker per vendor | P0 |
| ADM-5 | Master item list: vegetable names, pictures and default units | P0 |
| ADM-6 | Moderation queue: reported vendors, flagged reviews | P0 |
| ADM-7 | Pilot dashboard: the metrics in section 1, per society and per vendor | P1 |
| ADM-8 | Admin roles: owner (your father) and field staff with limited rights | P1 |

## 6. Data model

Fifteen tables cover version 1. A daily menu is stored per vendor per date, so price history comes for free and helps the demand sheet in version 2.

| Entity | Key fields | Notes |
| --- | --- | --- |
| users | id, phone (unique), email (optional, unique), email\_verified, role (buyer, vendor, admin), name, created\_at | Phone is the identity; never shown to other buyers |
| buyer\_societies | buyer\_id, society\_id, is\_primary | Up to 3 per buyer |
| vendors | user\_id, display\_name, photo\_url, vehicle\_type, vehicle\_no, pmc\_vendor\_id, delivery\_available, allow\_calls, status (pending, verified, suspended), verified\_by, verified\_at | Visible to buyers only when verified |
| societies | id, name, area, address, lat, lng, flats\_count | Areas: Karve Nagar, Sus–Pashan |
| gates | id, society\_id, name, lat, lng | Arrival is at a gate, not just a society |
| stops | id, vendor\_id, gate\_id, days\_of\_week, window\_start, window\_end, active | Set by admin |
| items | id, name, image\_url, default\_unit, is\_custom, created\_by | Master list plus vendor custom items |
| daily\_menus | id, vendor\_id, date, stock\_photo\_url, published\_at | One per vendor per day |
| menu\_items | menu\_id, item\_id, price, unit, is\_sold\_out, deal\_price, deal\_at | Deal fields filled by the evening price drop |
| stop\_events | id, vendor\_id, gate\_id, type (arrived, leaving\_soon, left, not\_going), created\_at, lat, lng | Drives live status and alerts |
| follows | buyer\_id, vendor\_id, society\_id, notify\_arrival, notify\_deals, created\_at | Rating rule uses created\_at |
| reviews | id, vendor\_id, buyer\_id, stars, tags, text, vendor\_reply, status (visible, hidden), created\_at, updated\_at | One per buyer per vendor |
| requests | id, buyer\_id, vendor\_id, society\_id, item\_id or free\_text, qty, note, for\_date, status (open, will\_bring, cant\_bring) | V3-lite |
| reports | id, reporter\_id, vendor\_id, reason, text, status | Admin queue |
| notifications | id, user\_id, type, payload, sent\_at, opened\_at | Needed for the alert-open metric |

All timestamps are stored in UTC and shown in IST.

## 7. Non-functional requirements and proposed tech stack

The app must work on cheap Android phones, on patchy mobile data, at 6 AM in a moving tempo. Speed of the vendor's morning setup and of the arrival alert matter more than anything else.

### Non-functional requirements

| Area | Requirement |
| --- | --- |
| Devices | Android 9 and above, 2 GB RAM phones; app size under 30 MB. iOS for buyers in a later release |
| Speed | App opens in under 3 seconds on 4G; vendor menu publishes in under 2 seconds; arrival alert delivered in under 10 seconds |
| Weak network | Vendor actions (publish menu, arrived, sold out) queue offline and send when the network returns, with a visible "sending" state |
| Usability | Vendor screens use large buttons, pictures and numbers; no screen needs typing except price |
| Privacy | Buyer phone numbers never shown to vendors or other buyers. Vendor phone shown only if "allow calls" is on. Location is read only when the vendor taps "I've arrived"; no background tracking in version 1 |
| Security | OTP rate limits; row-level access rules so a vendor can edit only his own menu and a buyer only his own reviews; admin panel behind admin role and 2-step login |
| Data protection | Follows India's Digital Personal Data Protection Act basics: consent at sign-up, a privacy policy, account deletion |
| Reliability | 99% uptime during 5 AM to 10 PM IST in the pilot |
| Cost | Stay within free or low tiers during the pilot |

### Proposed tech stack (to confirm)

| Layer | Proposal | Why |
| --- | --- | --- |
| Mobile app | Flutter (or React Native), one codebase for buyer and vendor modes | One app, Android first, iOS later from the same code |
| Backend and database | Supabase: Postgres, row-level security, storage for photos, edge functions | Fast to build; Postgres handles the relational data well; Supabase is already connected to this workspace |
| Phone OTP | Supabase Auth with an Indian SMS provider such as MSG91 (DLT-registered template) | Indian SMS rules require DLT registration |
| Email OTP | Supabase Auth email OTP | Free, built in |
| Push | Firebase Cloud Messaging, triggered from an edge function on each stop event | Reliable on Android |
| Maps and GPS | Device GPS with distance calculation to gate coordinates; map tiles only on the society picker | Keeps map costs near zero |
| Admin panel | Next.js web app on the same Supabase project | Reuses auth and data |
| QR | Deep links that open the vendor page in the app, or a small web page if not installed | Supports G1 stickers |
| Analytics | PostHog or Firebase Analytics | Event tracking for section 8 |

## 8. Analytics and pilot plan

The pilot runs in two areas, Karve Nagar and Sus–Pashan, with the field team onboarding vendors and societies by hand. Every success metric in section 1 must be measurable from these events.

### Events to track

| Event | Fired when | Feeds metric |
| --- | --- | --- |
| signup\_completed | OTP verified and role chosen | Society adoption |
| society\_selected | Buyer saves a society | Society adoption |
| vendor\_followed / unfollowed | Buyer taps Follow or Unfollow | Society adoption |
| menu\_published | Vendor publishes today's menu | Active vendors |
| stock\_photo\_added | Vendor adds today's photo | Active vendors |
| vendor\_arrived | Vendor taps "I've arrived" | Alert usefulness |
| alert\_opened | Buyer opens an arrival or deal alert | Alert usefulness |
| vendor\_page\_viewed | Buyer opens a vendor page | Buyer retention |
| review\_submitted | Buyer rates a vendor | Ratings |
| request\_created / answered | Buyer requests an item; vendor replies | Vendor value |
| deal\_sent | Vendor sends an evening price drop | Vendor value |
| qr\_scanned | QR sticker opened, in app or on the web page | Growth channel |
| app\_opened | Any session start | Buyer retention |

### Pilot plan (proposed)

1. **Prepare.** Field team lists 10 to 15 large societies across Karve Nagar and Sus–Pashan, their gates, and the tempo and thela vendors who serve them. Committee meetings start.
2. **Closed test.** 3 to 5 vendors and the founding team's own families use the app in one society for one week. Fix bugs and slow screens.
3. **Launch wave 1.** Karve Nagar societies first: QR stickers on tempos, notice-board posters, launch week at the gate (G7).
4. **Launch wave 2.** Sus–Pashan societies, using what wave 1 taught.
5. **Week 4 review.** Check the section 1 metrics, interview vendors, decide on version 2 features (reservations first).

Karve Nagar and Sus–Pashan are several kilometres apart, so each needs its own vendor set. Do not expect one vendor's route to cover both.

## 9. Version 2 backlog, open questions and risks

### Version 2 backlog (in proposed order)

1. B5 Keep it aside (reservations), with a cancel window and pay on the spot
2. V3 full demand sheet: reservations plus requests, summed per item for tomorrow
3. B8 Standing weekly order
4. Marathi and Hindi
5. M1 vendor subscription (about ₹99 a month) and M2 boosted listing
6. B9 order for parents with V9 helper delivery list
7. B10 compare vendors, B11 freshness promise badge
8. iOS app for buyers

### Open questions

- [ ] App name and brand
- [ ] Which 10 to 15 societies in Karve Nagar and Sus–Pashan
- [ ] Flutter or React Native (depends on what you build faster in)
- [ ] Who signs society committee agreements, and is any written approval needed
- [ ] Should buyers be able to rate without following for 3 days, to get early ratings faster?

### Risks

| Risk | Mitigation in version 1 |
| --- | --- |
| Public ratings upset vendors early | Vendor can reply (VEN-13) and flag (RAT-3); admin moderation (RAT-2); explain ratings during onboarding |
| Vendors forget to tap "I've arrived" | Field team trains each vendor; GPS suggestion makes it one tap; follower count (VEN-11) shows the payoff |
| Too many notifications annoy buyers | Per-vendor settings (BUY-4); one deal alert per day (VEN-9); quiet hours (NOT-3) |
| Fake or spam vendors | Admin verification before a vendor is visible (ADM-2) |
| SMS OTP cost and delivery | DLT-registered templates; email OTP as a fallback for users who add email |
| MyGate or NoBrokerHood copy the feature | Speed in one cluster; vendor tools and ratings they do not offer |
