# Open questions

Claude adds questions here when something is unclear, notes the default it chose, and keeps working. The owner answers inline.

| Date | Question | Default taken | Answer |
| --- | --- | --- | --- |
| 2026-11-05 | Final app name and brand? | "Sabzi" placeholder, kept in one constant `APP_NAME` | Owner is choosing (shortlist 8 Nov: Aaya, Pheri, Haatu — to check domains/trademarks). |
| 2026-11-05 | Public domain for QR links? | `https://sabzi.example/v/<code>` from one constant `PUBLIC_BASE_URL` | Testing phase uses a subdomain (8 Nov). Base URL now comes from `EXPO_PUBLIC_BASE_URL` / `NEXT_PUBLIC_BASE_URL`. Which subdomain exactly? |
| 2026-11-05 | GitHub refuses every write from this cloud session (git push, REST and the GitHub MCP all return 403 "Resource not accessible by integration"). The Claude GitHub App needs write access to `DurgeshBhusnale/Sabzi` (reconnect at https://claude.ai/connect-github or install the app). | Kept building all milestones as local commits on `claude/adoring-johnson-tu32pu`, retrying the push at each milestone. If the session ends before a push succeeds, the work stays in this container only. | Resolved: owner connected GitHub; all milestones merged in #1 (CI green). |
| 2026-11-05 | Supabase Auth's own `/verify` endpoint can still be called directly, bypassing the 5-failure counter in `otp-verify`. | Accepted for the pilot: Supabase rate-limits verifications per IP (`token_verifications`), OTPs expire, and blocked numbers get no new codes. A stricter fix needs a GoTrue change or a proxy in front of Auth. | |
| 2026-11-05 | Edge functions could not boot inside this cloud session (the edge runtime container cannot reach npm through the session proxy). | Edge function logic is covered by Deno unit tests with injected dependencies; CI and a normal laptop run them for real. | |
| 2026-11-08 | Mobile numbers are collected without SMS verification while phone OTP is off. Should two accounts be allowed to enter the same number? | Allowed (no uniqueness), because an unverified number could block its real owner. "One phone = one account" returns when OTP is turned back on (OTP numbers are unique in Supabase Auth). | |
| 2026-11-08 | Google users who later get phone OTP: link the verified phone to the same account or keep them separate? | Not built yet. Plan: sign in with Google, then verify the number with an OTP from the profile (Supabase `updateUser({ phone })`), which marks `profile_phones.verified`. | |
| 2026-11-08 | Should the vendor "Call" button use an unverified number? | Yes, when the vendor turns on "Buyers can call me" — he typed it himself in profile building and can change it in Profile. The field team checks it during verification. | |
| 2026-11-08 | Email OTP login (S-05) is also hidden — Google sign-in covers email users. Keep it off? | Off (`AUTH_METHODS.emailOtp = false`); the screen and API are kept. | |
