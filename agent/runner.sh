#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root
cd "$(dirname "$0")/.."

# Good PATH for macOS/Homebrew
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Repeat forever: export env, run agent, nap
while true; do
  # Load agent/.env if present
  if [[ -f agent/.env ]]; then
    set -a
    # shellcheck disable=SC1091
    source agent/.env
    set +a
  fi

  # Default goal if none supplied
  : "${GOAL:=Continuous improvement: tests, UI, API, Render deploys}"

  make -C agent PY=python3 run GOAL="$GOAL" || true
  # Pause between runs (20 min default). Override with SLEEP_SECS=600 etc.
  : "${SLEEP_SECS:=1200}"
  sleep "$SLEEP_SECS"
done
