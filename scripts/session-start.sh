#!/bin/bash
# SessionStart hook (see .claude/settings.json). Runs in cloud sessions only.
# Installs workspace dependencies when the lockfile or manifests changed.

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Docker for the local Supabase stack
if command -v dockerd >/dev/null 2>&1 && ! pgrep dockerd >/dev/null 2>&1; then
  (dockerd > /tmp/dockerd.log 2>&1 &)
fi

if [ ! -f package.json ]; then
  exit 0
fi

hashes=node_modules/.session-start.sha256
files="scripts/session-start.sh package.json"
[ -f pnpm-lock.yaml ] && files="$files pnpm-lock.yaml"

if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  rm -f "$hashes"
  if pnpm install --frozen-lockfile 2>/dev/null || pnpm install; then
    mkdir -p node_modules
    sha256sum $files > "$hashes" || rm -f "$hashes"
  fi
fi

echo "Session ready. Read CLAUDE.md, docs/PROGRESS.md and docs/BUILD_PLAN.md before starting."
exit 0
