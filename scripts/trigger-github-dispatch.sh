#!/usr/bin/env bash
set -euo pipefail

GH_OWNER="${GH_OWNER:-}"
GH_REPO="${GH_REPO:-}"
GH_PAT="${GH_PAT:-}"

if [[ -z "$GH_OWNER" || -z "$GH_REPO" || -z "$GH_PAT" ]]; then
  echo "[dispatch] Skipping: GH_OWNER/GH_REPO/GH_PAT not set" 1>&2
  exit 0
fi

API="https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/dispatches"
echo "[dispatch] Sending repository_dispatch to ${GH_OWNER}/${GH_REPO} ..."

curl -sS -X POST \
  -H "Authorization: token ${GH_PAT}" \
  -H "Accept: application/vnd.github+json" \
  "${API}" \
  -d '{"event_type":"render_deploy_succeeded"}'

echo "[dispatch] Done"


