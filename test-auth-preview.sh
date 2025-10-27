#!/bin/bash

# Auth Testing Script for Preview Deployment
# Usage: BASE_URL=https://your-preview.onrender.com ./test-auth-preview.sh

set -e

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3002"}
COOKIE_FILE="/tmp/preview-cookies.txt"

echo "======================================"
echo "Testing Auth on: $BASE_URL"
echo "======================================"
echo ""

# Clean up old cookies
rm -f "$COOKIE_FILE"

echo "1️⃣ TEST: Diagnostic - Server Config"
echo "--------------------------------------"
curl -s "$BASE_URL/api/diag/config" | jq . || echo "❌ Failed to get config"
echo ""

echo "2️⃣ TEST: Health Check"
echo "--------------------------------------"
curl -s "$BASE_URL/api/healthz" | jq . || echo "❌ Failed health check"
echo ""

echo "3️⃣ TEST: Login (admin@test.com)"
echo "--------------------------------------"
echo "Request:"
echo "  POST $BASE_URL/api/dev/login"
echo "  Body: {\"email\":\"admin@test.com\",\"password\":\"password\"}"
echo ""
echo "Response (with headers):"
curl -i -X POST "$BASE_URL/api/dev/login" \
  -H "Content-Type: application/json" \
  -H "Origin: $BASE_URL" \
  -d '{"email":"admin@test.com","password":"password"}' \
  -c "$COOKIE_FILE" \
  2>&1 | head -30
echo ""
echo "--------------------------------------"
echo ""

echo "4️⃣ TEST: Cookies Saved"
echo "--------------------------------------"
if [ -f "$COOKIE_FILE" ]; then
  echo "Cookie file contents:"
  cat "$COOKIE_FILE"
  echo ""
else
  echo "❌ No cookie file created!"
fi
echo ""

echo "5️⃣ TEST: Session Check (with cookie)"
echo "--------------------------------------"
echo "Request: GET $BASE_URL/api/session"
echo ""
curl -i "$BASE_URL/api/session" \
  -H "Origin: $BASE_URL" \
  -b "$COOKIE_FILE" \
  2>&1 | head -20
echo ""
echo "--------------------------------------"
echo ""

echo "6️⃣ TEST: Diagnostic - Headers Check (with cookie)"
echo "--------------------------------------"
curl -s "$BASE_URL/api/diag/headers" \
  -H "Origin: $BASE_URL" \
  -b "$COOKIE_FILE" | jq . || echo "❌ Failed to get headers"
echo ""

echo "======================================"
echo "Test Complete!"
echo "======================================"
echo ""
echo "🔍 Key Things to Check:"
echo "1. Set-Cookie header present in login response"
echo "2. Cookie has: HttpOnly, Secure (if HTTPS), SameSite=None (if cross-origin)"
echo "3. Session endpoint returns authenticated: true"
echo "4. Headers diagnostic shows cookie and session"
echo ""
echo "🐛 Common Issues:"
echo "- Missing Set-Cookie → Check trust proxy, secure flag"
echo "- Cookie not sent → Check domain, SameSite, CORS"
echo "- Session not found → Check cookie name, store configuration"
echo ""
