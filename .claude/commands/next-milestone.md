---
description: Pick up the next unfinished milestone from the build plan and complete it
---

1. Read `CLAUDE.md`, `docs/PROGRESS.md`, `docs/BUILD_PLAN.md`, `docs/DECISIONS.md` and `docs/QUESTIONS.md`.
2. Find the first milestone that is not done and whose dependencies are merged. If $ARGUMENTS names a milestone or lane, use that instead.
3. Create branch `m<number>-<short-name>` from the right base.
4. Build it in small committed steps, with tests for every acceptance criterion.
5. Run `/verify`. Fix every failure.
6. Update `docs/PROGRESS.md`, push, and open a PR describing what was built, requirement and screen IDs covered, how it was tested, and anything left undone.
7. If context remains, continue with the next milestone in the same lane on a new stacked branch.
