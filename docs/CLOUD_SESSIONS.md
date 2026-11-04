# Running development in Claude Code cloud sessions

Cloud sessions run Claude Code on Anthropic's machines, not yours. Once a session starts, it keeps working while your laptop is shut, and you can check on it from the Claude mobile app.

Official docs: https://code.claude.com/docs/en/claude-code-on-the-web · Cloud environments: https://code.claude.com/docs/en/cloud-environments · Credit promo: https://support.claude.com/en/articles/17152539-cloud-sessions-bonus-credit-promotion

> **Credit deadline:** the $100 Pro promotional credit expires **November 4, 11:59 PM PT = November 5, 1:29 PM IST**. After that, cloud sessions keep working but count against your normal Pro plan limits.

## 1. One-time setup

### 1.1 Put the repo on GitHub

1. Create an **empty private** repo on GitHub, for example `sabzi-app` (no README, no .gitignore).
2. Unzip this starter folder.
3. Replace the two placeholders with the real documents (download each doc as Markdown from claude.ai):
   - `docs/PRD.md` ← "Sabzi Vendor App — PRD v1 (Pilot)"
   - `docs/DESIGN_BRIEF.md` ← "Sabzi Vendor App — UI Design Brief for Claude Design"
4. Copy your Claude Design `.dc.html` files into `docs/design/screens/`. If you can, rename them with the screen ID first (`B-03-home.dc.html`, `V-08-arrived.dc.html`); otherwise Claude finds screens by their titles.
5. Push:

```bash
cd sabzi-app
git init -b main
git add .
git commit -m "chore: starter docs and repo setup"
git remote add origin https://github.com/<your-username>/sabzi-app.git
git push -u origin main
```

### 1.2 Connect GitHub to Claude

1. Open **claude.ai/code** (or the **Code** tab in the Claude mobile or desktop app).
2. Follow the prompt to install the **Claude GitHub App** and give it access to `sabzi-app`.
3. Check the usage menu shows your cloud-session credit.

### 1.3 Create the cloud environment

At claude.ai/code, open the environment selector under the message box → **New environment**:

- **Name:** `sabzi-dev`
- **Network access:** **Custom**, tick **"Also include default list of common package managers"**, and add these domains (one per line):

```
expo.dev
*.expo.dev
exp.host
deno.land
*.deno.land
dl.deno.land
esm.sh
supabase.com
*.supabase.com
```

- **Environment variables:** none needed yet. Never put secrets here; anyone using the environment can read them. Use **Network secrets** later for API keys.
- **Setup script:** paste the contents of `scripts/cloud-setup.sh`.

Save. The first session builds and caches the environment; later sessions start faster.

## 2. Start working

### 2.0 Fully unattended (recommended when you are away)

1. In the GitHub repo, make sure `main` has **no** branch-protection rule requiring reviews (Settings → Branches). Claude merges its own PRs.
2. Start one session with the **master prompt** from `docs/PROMPTS.md`, then close the laptop.
3. Optional: add the **watchdog** scheduled task from `docs/PROMPTS.md` (claude.ai/code → scheduled tasks, every 3 hours) so work restarts if the session stops.
4. When you're back, read `docs/PROGRESS.md` and `docs/HANDOFF.md` on GitHub.

Sections 2.1–2.3 below are the manual alternative where you review and merge yourself.

### 2.1 First session: foundation (M0 + M1)

Choose the `sabzi-app` repo, the `sabzi-dev` environment, and a permission mode that lets Claude edit and run commands without stopping to ask. Paste:

```
Read CLAUDE.md, then docs/BUILD_PLAN.md, docs/TECH_SPEC.md, docs/PRD.md and docs/DESIGN_BRIEF.md.
Do milestone M0 (repo foundation) on branch m0-foundation and open a PR.
Then, on a new branch m1-database stacked on it, do M1 (database schema, RLS, seed, pgTAP tests) and open a second PR.
Work unattended: make reasonable decisions, record them in docs/DECISIONS.md, put open questions in docs/QUESTIONS.md, and keep going until both milestones meet their acceptance criteria. Update docs/PROGRESS.md in each PR.
```

### 2.2 Review and merge

When the session finishes (you get a notification on the phone app):

1. Open the session → **Changes** card → review the diff → **Create PR** if it hasn't already.
2. On GitHub, check CI is green, then **merge** M0, then M1.
3. To ask for changes, just reply in the session ("rename X", "the seed is missing Sahyadri Heights gates"), or comment on the PR and turn on **Auto-fix**.

### 2.3 Parallel lanes (after M0 and M1 are merged)

Start three separate sessions at the same time, each on `main`:

**Lane A — mobile**
```
Read CLAUDE.md and docs/BUILD_PLAN.md. Do Lane A in order: M3, then M4, then M5, then M8. One branch and one PR per milestone, each stacked on the previous. Work unattended and keep going until all four are done or you run out of context; update docs/PROGRESS.md in each PR.
```

**Lane B — backend**
```
Read CLAUDE.md and docs/BUILD_PLAN.md. Do Lane B in order: M2, then M6. One branch and one PR per milestone. Work unattended; update docs/PROGRESS.md in each PR. Do not edit apps/mobile UI screens beyond what M2 requires; Lane A owns them.
```

**Lane C — admin**
```
Read CLAUDE.md and docs/BUILD_PLAN.md. Do Lane C: M9 (admin panel). One branch, one PR. Work unattended; update docs/PROGRESS.md.
```

Merge lane PRs as they finish. When M4, M5 and M6 are merged, start M7, then M10, M11 and finally M12 the same way.

### 2.4 Keeping it running

- A session works until its task is done, then waits for you. It does **not** pick up new work by itself, so give each session a large, well-defined task (a whole lane), as above.
- If a session stops to ask a question, answer from your phone; it continues from there.
- If a session stops because its context filled up, start a new session with: `Read CLAUDE.md and docs/PROGRESS.md, then continue the unfinished milestone on its existing branch.`
- Avoid two sessions editing the same files at once. The lanes are split to prevent that.
- From the terminal you can also start sessions with `claude --cloud "<task>"` and send follow-ups with `claude -p "<message>" --cloud <session-id>`.

## 3. What cloud sessions can't do here

- Build the Android APK. Run `eas build` from your own laptop (or add a GitHub Action later). Cloud sessions verify with typecheck, lint and tests.
- Reach your live Supabase project. Sessions use a local Supabase in Docker. You push migrations to the real project after merging (`npx supabase link` then `npx supabase db push`).
- Use your laptop's skills or MCP servers. Only what is committed in the repo (CLAUDE.md, `.claude/`) reaches the session.
