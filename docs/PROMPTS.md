# Prompts for cloud sessions

Copy a prompt into a new session at claude.ai/code (repo `sabzi-app`, environment `sabzi-dev`, a permission mode that does not stop to ask for approval).

---

## 1. Master prompt — build everything unattended

Use this when you will be away. One session runs every milestone in order, opening and merging its own PRs.

```
AUTONOMOUS MODE. I am away and cannot reply, review or merge anything until I return.

Read CLAUDE.md fully, especially section 4.1 (Autonomous mode). Then read docs/PROGRESS.md, docs/BUILD_PLAN.md, docs/TECH_SPEC.md, docs/PRD.md, docs/DESIGN_BRIEF.md and the design files in docs/design/screens/ (.dc.html, see docs/design/README.md).

Build the whole app by working through docs/BUILD_PLAN.md in order: M0, M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12. For every milestone:
1. branch from the latest main,
2. build it with tests for every acceptance criterion,
3. run pnpm verify (and supabase db reset + supabase test db when the database changed) and fix all failures,
4. commit, push, open a PR using the GitHub REST API (gh api), wait for CI, and merge it yourself with squash,
5. update docs/PROGRESS.md, pull main, and start the next milestone immediately.

Never stop to ask me anything. Make the safest reasonable decision, record it in docs/DECISIONS.md or docs/QUESTIONS.md, and continue. If something needs a real secret or account I haven't provided, build it behind a stub or feature flag, mark the milestone Partial in docs/PROGRESS.md, and move on.

Keep going until all milestones are merged. Then write docs/HANDOFF.md with what was built, what is Partial, how to run it, and my to-do list.
```

---

## 2. Resume prompt — continue where the last session stopped

Use this if a session stopped (usage limit, error, context full).

```
AUTONOMOUS MODE. Read CLAUDE.md (section 4.1) and docs/PROGRESS.md. Check open PRs and unmerged branches with gh api. Finish and merge any milestone that was in progress, then continue with the next milestones in docs/BUILD_PLAN.md exactly as the master prompt in docs/PROMPTS.md describes. Don't ask me anything; keep going until all milestones are merged and docs/HANDOFF.md is written.
```

---

## 3. Watchdog — optional scheduled task

A scheduled task can restart work if the main session stops while you are away. Set it to run every 3 hours on the `sabzi-app` repo and `sabzi-dev` environment with this prompt. Scheduled tasks use your normal plan usage, not the cloud-session credit.

```
AUTONOMOUS MODE watchdog. Run: git fetch --all and look at the newest commit time across all branches.
If any branch has a commit from the last 60 minutes, another session is still working: do nothing and stop.
If docs/HANDOFF.md exists on main and docs/PROGRESS.md shows every milestone Done or Partial, do nothing and stop.
Otherwise, follow the resume prompt in docs/PROMPTS.md: read CLAUDE.md section 4.1 and docs/PROGRESS.md, finish any in-progress milestone, and continue through the build plan, merging each PR yourself.
```

---

## 4. Single-milestone prompts (when you want control)

Replace `M4` with any milestone. Add `AUTONOMOUS MODE.` at the start if it should merge its own PR.

```
Read CLAUDE.md, docs/PROGRESS.md and docs/BUILD_PLAN.md. Do milestone M4 only, on branch m4-vendor-core from the latest main. Meet every acceptance criterion with tests, run /verify, update docs/PROGRESS.md, push and open a PR. Record decisions in docs/DECISIONS.md and questions in docs/QUESTIONS.md instead of stopping.
```

| Milestone | Branch |
| --- | --- |
| M0 Repo foundation | `m0-foundation` |
| M1 Database, RLS, seed | `m1-database` |
| M2 Auth and accounts | `m2-auth` |
| M3 Mobile shell and components | `m3-mobile-shell` |
| M4 Vendor core flows | `m4-vendor-core` |
| M5 Buyer core flows | `m5-buyer-core` |
| M6 Push notifications | `m6-notifications` |
| M7 Ratings, requests, deals, reports | `m7-engagement` |
| M8 Offline queue and system states | `m8-offline` |
| M9 Admin panel | `m9-admin` |
| M10 QR, web landing, sticker PDF | `m10-qr` |
| M11 Analytics and dashboard | `m11-analytics` |
| M12 Hardening and release prep | `m12-release` |
