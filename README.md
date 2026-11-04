# Sabzi Vendor App

An Android-first app for Pune that tells residents when their vegetable vendor is at the society gate, what he has today and at what price, and how good he is, and tells vendors who follows them and what buyers want tomorrow.

Pilot: Karve Nagar and Sus–Pashan. Version 1 scope is in `docs/PRD.md`.

## Repo map

| Path | What |
| --- | --- |
| `CLAUDE.md` | Rules for Claude Code (read first) |
| `docs/PRD.md` | Product requirements |
| `docs/DESIGN_BRIEF.md`, `docs/design/` | Brand system, every screen and state, screen images |
| `docs/TECH_SPEC.md` | Architecture, stack, schema, security |
| `docs/BUILD_PLAN.md` | Milestones and acceptance criteria |
| `docs/CLOUD_SESSIONS.md` | How to run development in Claude Code cloud sessions |
| `docs/PROMPTS.md` | Ready-to-paste prompts: unattended master, resume, watchdog, per milestone |
| `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/QUESTIONS.md` | Running log, decisions, open questions |
| `apps/mobile` | Expo (React Native) app, buyer and vendor modes |
| `apps/admin` | Next.js admin panel |
| `packages/shared` | Design tokens, Zod schemas, DB types, constants |
| `supabase/` | Migrations, RLS, seed, edge functions, tests |

## Getting started (local)

Requires Node 22, pnpm 9 and Docker.

```bash
pnpm install
npx supabase start
npx supabase db reset
pnpm verify
pnpm --filter mobile start
```

## Stack

Expo + TypeScript · Supabase (Postgres, RLS, Auth, Storage, Edge Functions) · Next.js admin · pnpm monorepo · Expo Push.
