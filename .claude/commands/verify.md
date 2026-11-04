---
description: Run every check before pushing
---

Run these and fix any failure before reporting success:

1. `pnpm install` (only if dependencies changed)
2. `pnpm verify` — typecheck, lint and unit tests in every workspace
3. If `supabase/` changed: start Docker if needed, then `npx supabase db reset` and `npx supabase test db`
4. If `supabase/migrations/` changed: regenerate `packages/shared/src/db.types.ts` and confirm `pnpm verify` still passes
5. If `supabase/functions/` changed: `deno test` inside `supabase/functions`

Report a short table: check, result, notes.
