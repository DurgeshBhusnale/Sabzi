# CLAUDE.md — Sabzi Vendor App

You are building a two-sided mobile app for Pune's local vegetable vendors and the residents of housing societies they serve. You usually work **unattended in a Claude Code cloud session**: nobody is watching, so make sensible decisions, record them, and keep going.

## 1. Read these first (source of truth, in this order)

1. `docs/BUILD_PLAN.md` — milestones, order and acceptance criteria. **This is your task list.**
2. `docs/TECH_SPEC.md` — architecture, stack, schema, security rules, conventions.
3. `docs/PRD.md` — what the product must do (requirement IDs like `VEN-6`, `BUY-5`).
4. `docs/DESIGN_BRIEF.md` and `docs/design/screens/*.dc.html` — every screen, component and state (screen IDs like `B-05`, `V-08`, `X-04`). Read `docs/design/README.md` for how to use the design files: they are a visual reference, never code to copy.
5. `docs/PROGRESS.md` — what previous sessions finished. `docs/DECISIONS.md` — choices already made.

If `docs/PRD.md` or `docs/DESIGN_BRIEF.md` still contains the line `PLACEHOLDER — replace with export`, stop and tell the user to add the real file. Do not invent requirements.

## 2. Stack (decided — see TECH_SPEC for details)

- **Mobile:** Expo (React Native) + TypeScript + expo-router, one app with buyer and vendor modes. Android first.
- **Backend:** Supabase (Postgres + Row Level Security + Auth + Storage + Edge Functions in Deno).
- **Admin:** Next.js (App Router) + TypeScript in `apps/admin`.
- **Shared:** `packages/shared` — Zod schemas, DB types, design tokens, constants.
- **Monorepo:** pnpm workspaces. Node 22.

## 3. Commands

```bash
pnpm install                 # install everything
pnpm verify                  # typecheck + lint + unit tests for all packages — run before every push
pnpm --filter mobile test    # one package
npx supabase start           # local Postgres/Auth/Storage in Docker (needs Docker running)
npx supabase db reset        # rebuild local DB from migrations + seed
npx supabase test db         # run pgTAP tests in supabase/tests
npx supabase gen types typescript --local > packages/shared/src/db.types.ts
```

In a cloud session, start Docker first if `supabase start` fails: `dockerd > /tmp/dockerd.log 2>&1 &` then wait a few seconds.

## 4. How to work in a session

1. Read `docs/PROGRESS.md`, then pick the milestone the user named. If none was named, take the first milestone in `BUILD_PLAN.md` that is not done and whose dependencies are done.
2. Work on a branch named `m<number>-<short-name>` (for example `m4-vendor-core`). Never commit straight to `main`.
3. Build in small steps. Commit after each working step with a clear message (`feat(vendor): publish today's menu`).
4. Write tests as you go. Every acceptance criterion in the milestone needs a test or a written manual check.
5. Run `pnpm verify` (and `npx supabase test db` when you touched the database). Fix failures before pushing.
6. Push the branch and open a pull request whose description lists: what was built, requirement and screen IDs covered, how it was tested, anything left undone.
7. Update `docs/PROGRESS.md` (date, milestone, status, PR link, notes) in the same PR.
8. If time and context remain, continue with the next milestone on a **new** branch stacked on this one, and say so in the PR.

### 4.1 Autonomous mode (when the prompt says `AUTONOMOUS MODE`)

The owner is away and cannot reply, review or merge. You own the whole loop:

1. Work through `docs/BUILD_PLAN.md` in this order: M0, M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12. Skip a milestone already marked Done in `docs/PROGRESS.md`.
2. For each milestone: branch from the latest `main` → build → tests → `pnpm verify` (and DB tests) → commit → push → open a PR → wait for CI → **merge it yourself** (squash) → `git checkout main && git pull` → next milestone.
3. GitHub from a cloud session: `gh pr …` and `gh issue …` use GraphQL, which the session proxy blocks. Use the built-in GitHub tools, or the REST API:
   - open PR: `gh api repos/{owner}/{repo}/pulls -f title="M4: Vendor core" -f head=m4-vendor-core -f base=main -F body=@/tmp/pr.md`
   - check CI: `gh api repos/{owner}/{repo}/commits/{sha}/check-runs`
   - merge: `gh api -X PUT repos/{owner}/{repo}/pulls/{number}/merge -f merge_method=squash`
   - get owner/repo from `git remote get-url origin`.
4. Wait for CI up to 15 minutes, checking every 2 minutes. Merge only when CI passes. If CI fails, fix it and push again. If CI is still failing after 3 fix attempts, or never starts because of a GitHub problem, merge only if `pnpm verify` and DB tests pass in the session, and note this in the PR and `docs/PROGRESS.md`.
5. Never ask a question and wait. Decide, record it in `docs/DECISIONS.md` or `docs/QUESTIONS.md`, and continue.
6. If a milestone is truly blocked (needs a real secret, an external account, or a decision only the owner can make): build everything you can behind a clear stub or feature flag, merge that, mark the milestone `Partial` in `docs/PROGRESS.md` with exactly what is missing, and move to the next milestone that doesn't depend on the missing part.
7. Keep `docs/PROGRESS.md` current after every merge. It is how you (after context compaction) and the next session know where things stand.
8. Never force-push, never rewrite `main` history, never merge a PR with failing local tests.
9. When everything is done, write `docs/HANDOFF.md`: what was built, what is Partial and why, how to run it, and the owner's to-do list (secrets, Supabase project, MSG91, FCM, EAS build).

## 5. Do's

- **Do** follow the design tokens in `packages/shared/src/tokens.ts`. No hard-coded colours, font sizes or spacing in components.
- **Do** build every state the design brief lists for a screen: loading skeleton, empty, error, offline, permission denied.
- **Do** keep vendor primary buttons at least 56 dp tall and every touch target at least 48 dp.
- **Do** write user-facing text in short, friendly Indian English, and keep all strings in `apps/mobile/src/i18n/en.ts` (Marathi and Hindi come later).
- **Do** enforce permissions with Row Level Security in Postgres, and test each policy with pgTAP.
- **Do** validate all input with the Zod schemas in `packages/shared`, on the client and in edge functions.
- **Do** store timestamps in UTC and show them in IST (`Asia/Kolkata`).
- **Do** use the sample data from the design brief (Ramesh Sabzi, Green Park Residency, and so on) in `supabase/seed.sql`.
- **Do** record any meaningful choice in `docs/DECISIONS.md` (one short entry: date, decision, why).
- **Do** put questions you cannot answer in `docs/QUESTIONS.md`, take the safest reasonable default, and keep working.

## 6. Don'ts

- **Don't** build anything outside version 1: no reservations / "keep it aside", no cart or checkout, no online payments or wallets, no subscriptions, no delivery tracking, no chat, no udhaar (credit), no AI features, no WhatsApp integration.
- **Don't** commit secrets, `.env` files, keystores, or the Supabase service-role key. Only `.env.example` is committed.
- **Don't** use the service-role key in the mobile or admin client. It belongs only in edge functions.
- **Don't** disable RLS or write a policy that lets a user read another user's phone number.
- **Don't** edit a migration that is already on `main`. Add a new migration instead.
- **Don't** track a vendor's location in the background. Location is read only when the vendor taps "I've arrived".
- **Don't** add a dependency without a reason; prefer what Expo and Supabase already provide. Note new dependencies in the PR.
- **Don't** change `docs/PRD.md` or `docs/DESIGN_BRIEF.md`. If they seem wrong, write it in `docs/QUESTIONS.md`.
- **Don't** delete or rewrite other people's work on `main`; never force-push.
- **Don't** mark a milestone done if `pnpm verify` fails or acceptance criteria are untested.

## 7. Product rules worth remembering

- One phone number = one account = one role (buyer or vendor). Phone OTP is mandatory; email is an optional second login.
- Vendors are visible to buyers only after an admin verifies them.
- Arrival alert: max one per stop per 2 hours. Evening deal alert: max one per vendor per day.
- A buyer can rate a vendor only after following for 3 days; one rating per buyer per vendor; ratings are public.
- English only in version 1. Prices shown as `₹40 / kg`.
- Pilot areas: Karve Nagar and Sus–Pashan, Pune.
