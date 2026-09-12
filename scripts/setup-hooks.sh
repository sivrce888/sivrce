#!/bin/sh
set -e
root="$(cd "$(dirname "$0")/.." && pwd)"
# Vercel/CI clones without a usable parent .git for Root Directory=app.
if [ -n "$VERCEL" ] || [ -n "$CI" ] || ! git -C "$root" rev-parse --git-dir >/dev/null 2>&1; then
  echo "hooks: skip (ci/no-git)"
  exit 0
fi
git -C "$root" config core.hooksPath .githooks
chmod +x "$root/.githooks/"*
echo "hooks: $root/.githooks (pre-commit + pre-push repo-weight + 96MiB/100MiB caps)"
