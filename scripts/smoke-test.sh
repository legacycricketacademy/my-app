#!/usr/bin/env bash
# Smoke test script for Cricket Academy Management System
# Usage: ./scripts/smoke-test.sh [BASE_URL]

set -euo pipefail

BASE_URL="${1:-${BASE_URL:-https://cricket-academy.onrender.com}}"
TIMEOUT="${TIMEOUT:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo -e "${BLUE}🔎 Smoking ${BASE_URL} (timeout: ${TIMEOUT}s)${NC}"
echo ""

# Helper function for curl with timeout and retries
curl_safe() {
  local max_retries=3
  local retry=0
  
  while [[ $retry -lt $max_retries ]]; do
    if curl -sf --max-time "${TIMEOUT}" "$@"; then
      return 0
    fi
    retry=$((retry + 1))
    if [[ $retry -lt $max_retries ]]; then
      warn "Retry $retry/$max_retries for $*"
      sleep 2
    fi
  done
  return 1
}

# Test counter
tests_passed=0
tests_failed=0
tests_warned=0

# 1) Health Check
info "Testing health endpoint..."
if out="$(curl_safe "${BASE_URL}/api/health" 2>/dev/null)"; then
  if echo "$out" | grep -q '"status":"ok"'; then
    pass "/api/health returns ok"
    ((tests_passed++))
  else
    fail "/api/health failed"
    ((tests_failed++))
  fi
  
  if echo "$out" | grep -q '"environment":'; then
    pass "/api/health has environment"
    ((tests_passed++))
  else
    fail "/api/health missing environment"
    ((tests_failed++))
  fi
  
  if echo "$out" | grep -q '"authProvider":'; then
    pass "/api/health has authProvider"
    ((tests_passed++))
  else
    fail "/api/health missing authProvider"
    ((tests_failed++))
  fi
else
  fail "Health endpoint unreachable"
  ((tests_failed++))
fi

# 2) Version Check
info "Testing version endpoint..."
if ver="$(curl_safe "${BASE_URL}/api/version" 2>/dev/null)"; then
  echo "Version info: ${ver}" | sed 's/\\n//g' || true
  
  if echo "$ver" | grep -q '"appEnv":'; then
    pass "/api/version has appEnv"
    ((tests_passed++))
  else
    fail "/api/version missing appEnv"
    ((tests_failed++))
  fi
  
  if echo "$ver" | grep -q '"nodeEnv":'; then
    pass "/api/version has nodeEnv"
    ((tests_passed++))
  else
    fail "/api/version missing nodeEnv"
    ((tests_failed++))
  fi
  
  if echo "$ver" | grep -q '"version":'; then
    pass "/api/version has version"
    ((tests_passed++))
  else
    fail "/api/version missing version"
    ((tests_failed++))
  fi
else
  fail "Version endpoint unreachable"
  ((tests_failed++))
fi

# 3) Homepage Check
info "Testing homepage..."
if hdrs="$(curl -sI --max-time "${TIMEOUT}" "${BASE_URL}/" 2>/dev/null | head -n 1)"; then
  if echo "$hdrs" | grep -qi "200"; then
    pass "GET / returns 200"
    ((tests_passed++))
  else
    fail "GET / not 200"
    ((tests_failed++))
  fi
  
  if html="$(curl_safe "${BASE_URL}/" 2>/dev/null | head -n 20)"; then
    if echo "$html" | grep -qi "<!DOCTYPE html>"; then
      pass "HTML doctype present"
      ((tests_passed++))
    else
      fail "No HTML doctype"
      ((tests_failed++))
    fi
    
    if echo "$html" | grep -qi "<title>"; then
      pass "HTML has title"
      ((tests_passed++))
    else
      warn "HTML missing title"
      ((tests_warned++))
    fi
  else
    fail "Homepage content unreachable"
    ((tests_failed++))
  fi
else
  fail "Homepage unreachable"
  ((tests_failed++))
fi

# 4) Public API Endpoints
info "Testing public API endpoints..."
if curl_safe "${BASE_URL}/api/ping" >/dev/null 2>&1; then
  pass "/api/ping accessible"
  ((tests_passed++))
else
  fail "/api/ping failed"
  ((tests_failed++))
fi

# 5) Authentication Guards
info "Testing authentication guards..."
code_admin=$(curl -s -o /dev/null -w "%{http_code}" --max-time "${TIMEOUT}" "${BASE_URL}/api/admin/stats" 2>/dev/null || echo "000")
if [[ "$code_admin" == "401" || "$code_admin" == "403" ]]; then
  pass "/api/admin/stats properly guarded ($code_admin)"
  ((tests_passed++))
else
  fail "admin stats not guarded ($code_admin)"
  ((tests_failed++))
fi

code_schedule=$(curl -s -o /dev/null -w "%{http_code}" --max-time "${TIMEOUT}" "${BASE_URL}/api/schedule/parent" 2>/dev/null || echo "000")
if [[ "$code_schedule" == "401" || "$code_schedule" == "403" ]]; then
  pass "/api/schedule/parent properly guarded ($code_schedule)"
  ((tests_passed++))
else
  fail "schedule parent not guarded ($code_schedule)"
  ((tests_failed++))
fi

# 6) Static Assets
info "Testing static assets..."
if html="$(curl_safe "${BASE_URL}/" 2>/dev/null)"; then
  asset_path="$(echo "$html" | grep -oE '/assets/[^"]+\.js' | head -n 1 || true)"
  if [[ -n "${asset_path}" ]]; then
    if curl_safe "${BASE_URL}${asset_path}" >/dev/null 2>&1; then
      pass "Asset loads: ${asset_path}"
      ((tests_passed++))
    else
      fail "Asset missing: ${asset_path}"
      ((tests_failed++))
    fi
    
    # Check CSS assets too
    css_path="$(echo "$html" | grep -oE '/assets/[^"]+\.css' | head -n 1 || true)"
    if [[ -n "${css_path}" ]]; then
      if curl_safe "${BASE_URL}${css_path}" >/dev/null 2>&1; then
        pass "CSS asset loads: ${css_path}"
        ((tests_passed++))
      else
        warn "CSS asset missing: ${css_path}"
        ((tests_warned++))
      fi
    fi
  else
    warn "No asset links found on / (maybe SSR only). Skipping asset fetch."
    ((tests_warned++))
  fi
else
  fail "Cannot fetch homepage for asset testing"
  ((tests_failed++))
fi

# 7) Performance Check
info "Testing response times..."
start_time=$(date +%s)
if curl_safe "${BASE_URL}/api/health" >/dev/null 2>&1; then
  end_time=$(date +%s)
  response_time=$(( (end_time - start_time) * 1000 ))
  
  if [[ $response_time -lt 2000 ]]; then
    pass "Response time acceptable (${response_time}ms)"
    ((tests_passed++))
  elif [[ $response_time -lt 5000 ]]; then
    warn "Response time slow (${response_time}ms)"
    ((tests_warned++))
  else
    fail "Response time too slow (${response_time}ms)"
    ((tests_failed++))
  fi
else
  fail "Cannot measure response time"
  ((tests_failed++))
fi

# Summary
echo ""
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "   - Tests passed: ${tests_passed}"
echo "   - Tests failed: ${tests_failed}"
echo "   - Tests warned: ${tests_warned}"

if [[ $tests_failed -eq 0 ]]; then
  echo -e "${GREEN}🎉 All smoke tests passed for ${BASE_URL}${NC}"
  exit 0
else
  echo -e "${RED}💥 ${tests_failed} tests failed for ${BASE_URL}${NC}"
  exit 1
fi
