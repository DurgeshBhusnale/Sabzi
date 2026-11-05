# Progress log

Newest first. One entry per pull request. Claude updates this file in every PR.

| Date | Milestone | Status | PR | Notes |
| --- | --- | --- | --- | --- |
| 2026-11-05 | M1 Database schema, RLS and seed | Done (local) | not pushed — see QUESTIONS | 4 migrations (enums, 23 tables, triggers, RLS with column grants, buyer-safe views `v_vendor_public`/`v_review_public`/`v_vendor_requests`, `v_vendor_today()`, `get_vendor_phone()`, all §4.4 RPCs with `client_id` idempotency, storage buckets, app settings); seed with brief sample data and 44 items; 129 pgTAP tests (87 RLS allow/deny, 42 rules); `db.types.ts` generated |
| 2026-11-05 | M0 Repo foundation | Done (local) | not pushed — see QUESTIONS | pnpm monorepo: `packages/shared` (tokens, constants, format/IST, geo, status, Zod schemas, 33 Vitest tests), `apps/mobile` (Expo SDK 58 + expo-router, Jest), `apps/admin` (Next.js 16 + Tailwind 4 with shared tokens, Vitest), `supabase init` with test OTP numbers, CI with database and Deno jobs |
| 2026-11-05 | Setup | Done | — | Starter docs, CLAUDE.md, tech spec, build plan, cloud setup scripts |
