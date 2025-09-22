#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://cricket-academy.onrender.com}"
TIMEOUT="${TIMEOUT:-10}"

pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; exit 1; }
warn() { echo "⚠️  $1"; }
info() { echo "ℹ️  $1"; }

echo "🔎 Smoking ${BASE_URL} (timeout: ${TIMEOUT}s)"
echo ""

# Helper function for curl with timeout
curl_safe() {
  curl -sf --max-time "${TIMEOUT}" "$@"
}

# 1) Health Check
info "Testing health endpoint..."
out="$(curl_safe "${BASE_URL}/api/health" | tr -d '\n')"
echo "$out" | grep -q '"status":"ok"' && pass "/api/health returns ok" || fail "/api/health failed"
echo "$out" | grep -q '"environment":' && pass "/api/health has environment" || fail "/api/health missing environment"
echo "$out" | grep -q '"authProvider":' && pass "/api/health has authProvider" || fail "/api/health missing authProvider"

# 2) Version Check
info "Testing version endpoint..."
ver="$(curl_safe "${BASE_URL}/api/version" | tr -d '\n')"
echo "Version info: ${ver}" | sed 's/\\n//g' || true
echo "$ver" | grep -q '"appEnv":' && pass "/api/version has appEnv" || fail "/api/version missing appEnv"
echo "$ver" | grep -q '"nodeEnv":' && pass "/api/version has nodeEnv" || fail "/api/version missing nodeEnv"
echo "$ver" | grep -q '"version":' && pass "/api/version has version" || fail "/api/version missing version"

# 3) Homepage Check
info "Testing homepage..."
hdrs="$(curl -sI --max-time "${TIMEOUT}" "${BASE_URL}/" | head -n 1)"
echo "$hdrs" | grep -qi "200" && pass "GET / returns 200" || fail "GET / not 200"
html="$(curl_safe "${BASE_URL}/" | head -n 20)"
echo "$html" | grep -qi "<!DOCTYPE html>" && pass "HTML doctype present" || fail "No HTML doctype"
echo "$html" | grep -qi "<title>" && pass "HTML has title" || warn "HTML missing title"

# 4) Public API Endpoints
info "Testing public API endpoints..."
curl_safe "${BASE_URL}/api/ping" >/dev/null && pass "/api/ping accessible" || fail "/api/ping failed"

# 5) Authentication Guards
info "Testing authentication guards..."
code_admin=$(curl -s -o /dev/null -w "%{http_code}" --max-time "${TIMEOUT}" "${BASE_URL}/api/admin/stats")
[[ "$code_admin" == "401" || "$code_admin" == "403" ]] && pass "/api/admin/stats properly guarded ($code_admin)" || fail "admin stats not guarded ($code_admin)"

code_schedule=$(curl -s -o /dev/null -w "%{http_code}" --max-time "${TIMEOUT}" "${BASE_URL}/api/schedule/parent")
[[ "$code_schedule" == "401" || "$code_schedule" == "403" ]] && pass "/api/schedule/parent properly guarded ($code_schedule)" || fail "schedule parent not guarded ($code_schedule)"

# 6) Static Assets
info "Testing static assets..."
asset_path="$(curl_safe "${BASE_URL}/" | grep -oE '/assets/[^"]+\.js' | head -n 1 || true)"
if [[ -n "${asset_path}" ]]; then
  curl_safe "${BASE_URL}${asset_path}" >/dev/null && pass "Asset loads: ${asset_path}" || fail "Asset missing: ${asset_path}"
  
  # Check CSS assets too
  css_path="$(curl_safe "${BASE_URL}/" | grep -oE '/assets/[^"]+\.css' | head -n 1 || true)"
  if [[ -n "${css_path}" ]]; then
    curl_safe "${BASE_URL}${css_path}" >/dev/null && pass "CSS asset loads: ${css_path}" || warn "CSS asset missing: ${css_path}"
  fi
else
  warn "No asset links found on / (maybe SSR only). Skipping asset fetch."
fi

# 7) CORS Headers (if applicable)
info "Testing CORS headers..."
cors_headers="$(curl -sI --max-time "${TIMEOUT}" -H "Origin: https://example.com" "${BASE_URL}/api/health" | grep -i "access-control" || true)"
if [[ -n "$cors_headers" ]]; then
  echo "$cors_headers" | grep -qi "access-control-allow-origin" && pass "CORS headers present" || warn "CORS headers incomplete"
else
  warn "No CORS headers found"
fi

# 8) Content Security (basic checks)
info "Testing content security..."
# Check that sensitive endpoints don't leak info
sensitive_response="$(curl_safe "${BASE_URL}/api/admin/stats" 2>/dev/null || true)"
if echo "$sensitive_response" | grep -qi "error\|unauthorized\|forbidden"; then
  pass "Sensitive endpoints return proper error messages"
else
  warn "Sensitive endpoints may be leaking information"
fi

# 9) Performance Check (basic)
info "Testing response times..."
start_time=$(date +%s)
curl_safe "${BASE_URL}/api/health" >/dev/null
end_time=$(date +%s)
response_time=$(( (end_time - start_time) * 1000 ))

if [[ $response_time -lt 2000 ]]; then
  pass "Response time acceptable (${response_time}ms)"
elif [[ $response_time -lt 5000 ]]; then
  warn "Response time slow (${response_time}ms)"
else
  fail "Response time too slow (${response_time}ms)"
fi

echo ""
echo "🎉 All smoke tests passed for ${BASE_URL}"
echo "📊 Summary:"
echo "   - Health endpoints: ✅"
echo "   - Version info: ✅"
echo "   - Homepage: ✅"
echo "   - API guards: ✅"
echo "   - Static assets: ✅"
echo "   - Response time: ${response_time}ms"
