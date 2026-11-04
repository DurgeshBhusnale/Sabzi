#!/bin/bash
# Setup script for the "sabzi-dev" Claude Code cloud environment.
# Paste this into: claude.ai/code → environment → Setup script.
# Runs as root on Ubuntu 24.04 before Claude starts. Result is cached (~7 days)
# when it finishes in under ~5 minutes. Must exit 0, so optional steps use `|| true`.

set -u

# pnpm via corepack (Node 22 is pre-installed)
corepack enable || true
corepack prepare pnpm@9 --activate || npm install -g pnpm@9 || true

# Supabase CLI (local Postgres/Auth/Storage stack in Docker) and Expo CLI helpers
npm install -g supabase@latest eas-cli || true

# Deno for Supabase edge function tests
if ! command -v deno >/dev/null 2>&1; then
  (curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh -s -- -y) || true
fi

# Start Docker and pre-pull Supabase images so `supabase start` is fast in sessions.
# Images are kept in the environment cache; running containers are not.
if ! pgrep dockerd >/dev/null 2>&1; then
  (dockerd > /tmp/dockerd.log 2>&1 &) || true
  sleep 5
fi
if [ -f supabase/config.toml ]; then
  (timeout 180 supabase start >/tmp/supabase-start.log 2>&1 && supabase stop) || true
fi

exit 0
