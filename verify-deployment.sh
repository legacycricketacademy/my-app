#!/bin/bash
# Quick API verification script

BASE_URL="https://cricket-academy-app.onrender.com"

echo "🔍 Testing API endpoints..."

# Test health endpoint
echo "1. Health check:"
curl -s "$BASE_URL/healthz" && echo " ✅" || echo " ❌"

# Test debug endpoints
echo "2. Debug endpoints:"
curl -s "$BASE_URL/api/_debug/ping" && echo " ✅" || echo " ❌"

# Test session endpoint (should return 401 without auth)
echo "3. Session endpoint (expect 401):"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/session")
if [ "$STATUS" = "401" ]; then
  echo " ✅ (401 as expected)"
else
  echo " ❌ (Got $STATUS, expected 401)"
fi

# Test protected endpoints (should return 401 without auth)
echo "4. Protected endpoints (expect 401):"
for endpoint in "/api/sessions" "/api/announcements" "/api/payments" "/api/players"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
  if [ "$STATUS" = "401" ]; then
    echo "   $endpoint ✅ (401 as expected)"
  else
    echo "   $endpoint ❌ (Got $STATUS, expected 401)"
  fi
done

echo ""
echo "🎯 Next steps:"
echo "1. Open https://cricket-academy-app.onrender.com/auth"
echo "2. Log in with admin credentials"
echo "3. Test each dashboard page manually"
echo "4. Check browser console for debug logs"
echo "5. Verify Network tab shows 200 responses (not 401)"
