#!/bin/sh
set -e
root="$(cd "$(dirname "$0")/.." && pwd)"
git -C "$root" config core.hooksPath .githooks
chmod +x "$root/.githooks/"*
echo "hooks: $root/.githooks (pre-commit + pre-push repo-weight)"
