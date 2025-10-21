#!/bin/bash

# Continuous E2E Test Fix Loop for Render
# Runs tests repeatedly, shows progress, waits for manual fixes

MAX_ITERATIONS=50
ITERATION=1

echo "🚀 Starting Continuous E2E Fix Loop"
echo "Environment: https://cricket-academy-app.onrender.com"
echo "Max iterations: $MAX_ITERATIONS"
echo "============================================"

while [ $ITERATION -le $MAX_ITERATIONS ]; do
  echo ""
  echo "🔄 ITERATION $ITERATION/$MAX_ITERATIONS"
  echo "============================================"
  
  # Run tests
  BASE_URL=https://cricket-academy-app.onrender.com \
  E2E_EMAIL=admin@test.com \
  E2E_PASSWORD=password \
  npx playwright test --reporter=line --workers=2 --retries=1 2>&1 | tee /tmp/e2e-run-$ITERATION.txt
  
  EXIT_CODE=$?
  
  # Extract results
  PASSED=$(grep -E "[0-9]+ passed" /tmp/e2e-run-$ITERATION.txt | tail -1 | grep -oE "[0-9]+" | head -1)
  FAILED=$(grep -E "[0-9]+ failed" /tmp/e2e-run-$ITERATION.txt | tail -1 | grep -oE "[0-9]+" | head -1)
  
  echo ""
  echo "📊 Results: $PASSED passed, $FAILED failed"
  
  # Check if all passing
  if [ $EXIT_CODE -eq 0 ] && [ "$FAILED" = "" -o "$FAILED" = "0" ]; then
    echo "✅ SUCCESS! All tests passing!"
    exit 0
  fi
  
  echo "❌ Still have failures. Iteration $ITERATION/$MAX_ITERATIONS"
  echo ""
  echo "Next steps:"
  echo "1. Review failures above"
  echo "2. Fix code/tests"
  echo "3. Commit and push to trigger Render deploy"
  echo "4. Press Enter to continue (or Ctrl+C to stop)"
  
  read -p "Ready to run again? " -r
  ITERATION=$((ITERATION+1))
done

echo "⚠️ Reached maximum iterations ($MAX_ITERATIONS)"
echo "📊 Final: $PASSED passed, $FAILED failed"
exit 1

