# Open questions

Claude adds questions here when something is unclear, notes the default it chose, and keeps working. The owner answers inline.

| Date | Question | Default taken | Answer |
| --- | --- | --- | --- |
| 2026-11-05 | Final app name and brand? | "Sabzi" placeholder, kept in one constant `APP_NAME` | |
| 2026-11-05 | Public domain for QR links? | `https://sabzi.example/v/<code>` from one constant `PUBLIC_BASE_URL` | |
| 2026-11-05 | GitHub refuses every write from this cloud session (git push, REST and the GitHub MCP all return 403 "Resource not accessible by integration"). The Claude GitHub App needs write access to `DurgeshBhusnale/Sabzi` (reconnect at https://claude.ai/connect-github or install the app). | Kept building all milestones as local commits on `claude/adoring-johnson-tu32pu`, retrying the push at each milestone. If the session ends before a push succeeds, the work stays in this container only. | |
