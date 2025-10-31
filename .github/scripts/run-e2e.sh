#!/bin/bash
# E2E Test Runner Script
# This script handles health checks, test execution, and failure summary generation
# for both mobile and desktop viewports.

set -e  # Exit immediately if any command fails

# Configuration: Default to Render production URL if not set
BASE_URL="${BASE_URL:-https://cricket-academy-app.onrender.com}"
FAILURES_FILE="e2e-failures.txt"

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 E2E Test Runner - Render Production"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Target URL: $BASE_URL"
echo "Test Accounts: ${ADMIN_EMAIL:-admin@test.com}"
echo ""

# Health Check: Wait for Render service to be ready
echo "🔍 Waiting for Render service to be healthy..."
HEALTH_CHECK_PASSED=false
for i in {1..24}; do
  echo "  Health check attempt $i/24..."
  if curl -fsS "$BASE_URL/api/ping" >/dev/null 2>&1; then
    echo "  ✅ Service is healthy!"
    HEALTH_CHECK_PASSED=true
    break
  fi
  if [ $i -lt 24 ]; then
    sleep 5  # Wait 5 seconds between attempts
  fi
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
  echo ""
  echo "❌ Service did not become healthy in time (2 minutes)"
  {
    echo "E2E Test Summary - $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "❌ HEALTH CHECK FAILED"
    echo ""
    echo "Base URL: $BASE_URL"
    echo "Status: Service failed health checks after 24 attempts (2 minutes)"
    echo ""
    echo "The Render service may be:"
    echo "  - Still starting up (cold start)"
    echo "  - Experiencing issues"
    echo "  - Temporarily unavailable"
    echo ""
    echo "Please check Render dashboard for service status."
  } > "$FAILURES_FILE"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🧪 Running Playwright E2E tests..."
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Viewports:"
echo "  • Desktop Chrome (1280x720)"
echo "  • Mobile Chrome - Pixel 5 (393x851)"
echo ""
echo "Config: playwright.multi.config.ts"
echo ""

# Run tests using multi-config (mobile + desktop) and capture output
# The config file includes both Desktop Chrome and Mobile Chrome (Pixel 5) projects
# Generate both list reporter (console) and JSON reporter (for email parsing)
TEST_START_TIME=$(date +%s)
if npx playwright test --config=playwright.multi.config.ts --reporter=list --reporter=json --reporter-json-output=e2e-report.json 2>&1 | tee test-output.log; then
  TEST_END_TIME=$(date +%s)
  TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))
  
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "✅ All tests passed!"
  echo "═══════════════════════════════════════════════════════════════"
  echo "Duration: ${TEST_DURATION}s"
  echo ""
  
  # Generate success summary
  {
    echo "E2E Test Summary - $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "✅ ALL TESTS PASSED"
    echo ""
    echo "Base URL: $BASE_URL"
    echo "Test Duration: ${TEST_DURATION} seconds"
    echo ""
    echo "Viewports Tested:"
    echo "  • Desktop Chrome (1280x720)"
    echo "  • Mobile Chrome - Pixel 5 (393x851)"
    echo ""
    echo "All E2E tests completed successfully on both mobile and desktop viewports."
    echo ""
    echo "To view detailed report:"
    echo "  1. Go to GitHub Actions → Workflow run → Artifacts"
    echo "  2. Download 'playwright-e2e-results'"
    echo "  3. Extract and open playwright-report/index.html"
  } > "$FAILURES_FILE"
  
  echo "📝 Success summary written to $FAILURES_FILE"
else
  TEST_EXIT_CODE=$?
  TEST_END_TIME=$(date +%s)
  TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))
  
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "❌ Some tests failed (exit code: $TEST_EXIT_CODE)"
  echo "═══════════════════════════════════════════════════════════════"
  echo "Duration: ${TEST_DURATION}s"
  echo ""
  
  # Generate detailed failure summary
  {
    echo "E2E Test Summary - $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "❌ TEST FAILURES DETECTED"
    echo ""
    echo "Base URL: $BASE_URL"
    echo "Test Duration: ${TEST_DURATION} seconds"
    echo "Exit Code: $TEST_EXIT_CODE"
    echo ""
    echo "Viewports Tested:"
    echo "  • Desktop Chrome (1280x720)"
    echo "  • Mobile Chrome - Pixel 5 (393x851)"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "Failed Tests:"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    # Extract failed test information from test output
    if [ -f "test-output.log" ]; then
      # Look for failed test patterns in the output
      grep -E "^\s*\d+\)|FAILED|Error:|✘|×" test-output.log | head -100 || echo "Failed to parse test output"
      
      # Count failures by viewport if possible
      DESKTOP_FAILS=$(grep -c "Desktop Chrome" test-output.log 2>/dev/null || echo "0")
      MOBILE_FAILS=$(grep -c "Pixel 5\|Mobile Chrome" test-output.log 2>/dev/null || echo "0")
      
      if [ "$DESKTOP_FAILS" != "0" ] || [ "$MOBILE_FAILS" != "0" ]; then
        echo ""
        echo "Failure Count by Viewport:"
        echo "  • Desktop: ${DESKTOP_FAILS} failure(s)"
        echo "  • Mobile: ${MOBILE_FAILS} failure(s)"
      fi
    else
      echo "Test output log not found"
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "Next Steps:"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "1. Review full test output in GitHub Actions logs"
    echo "2. Download test artifacts (screenshots, videos, traces)"
    echo "3. Open playwright-report/index.html for detailed HTML report"
    echo "4. Check Render service logs for server-side errors"
    echo ""
    echo "Artifact Location:"
    echo "  GitHub Actions → Workflow run → Artifacts → playwright-e2e-results"
  } > "$FAILURES_FILE"
  
  echo "📝 Failure summary written to $FAILURES_FILE"
  # Don't exit with error code - let workflow continue to send email
fi

echo ""
echo "✅ Test execution complete"
