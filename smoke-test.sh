#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://cricket-academy.onrender.com}"

pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; exit 1; }

echo "🔎 Smoking ${BASE_URL}"

# 1) Health
out="$(curl -sf "${BASE_URL}/api/health" | tr -d '\n')"
echo "$out" | grep -q '"status":"ok"' && pass "/api/health ok" || fail "/api/health failed"

# 2) Version
ver="$(curl -sf "${BASE_URL}/api/version" | tr -d '\n')"
echo "ℹ ${ver}" | sed 's/\\n//g' || true
echo "$ver" | grep -q '"appEnv":' && pass "/api/version ok" || fail "/api/version failed"

# 3) Homepage serves HTML
hdrs="$(curl -sI "${BASE_URL}/" | head -n 1)"
echo "$hdrs" | grep -qi "200" && pass "GET / 200" || fail "GET / not 200"
html="$(curl -sf "${BASE_URL}/" | head -n 20)"
echo "$html" | grep -qi "<!DOCTYPE html>" && pass "HTML served" || fail "No HTML doctype"

# 4) Public ping endpoint (if you kept it)
curl -sf "${BASE_URL}/api/ping" >/dev/null && pass "/api/ping ok" || fail "/api/ping failed"

# 5) Auth guards (no token)
code_admin=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/admin/stats")
[[ "$code_admin" == "401" || "$code_admin" == "403" ]] && pass "/api/admin/stats guarded ($code_admin)" || fail "admin stats not guarded ($code_admin)"

# 6) Static assets (basic check) – looks for at least one asset link and tries to fetch it
asset_path="$(curl -sf "${BASE_URL}/" | grep -oE '/assets/[^"]+\.js' | head -n 1 || true)"
if [[ -n "${asset_path}" ]]; then
  curl -sf "${BASE_URL}${asset_path}" >/dev/null && pass "Asset loads ${asset_path}" || fail "Asset missing ${asset_path}"
else
  echo "⚠ No asset link found on / (maybe SSR only). Skipping asset fetch."
fi

echo "🎉 Smoke passed for ${BASE_URL}"
