#!/bin/bash

# Test loop script for Render e2e tests
# Runs tests repeatedly, deploying fixes until all pass

MAX_ITERATIONS=20
ITERATION=1

while [ $ITERATION -le $MAX_ITERATIONS ]; do
  echo "============================================"
  echo "Iteration $ITERATION of $MAX_ITERATIONS"
  echo "============================================"
  
  # Run tests
  BASE_URL=https://cricket-academy-app.onrender.com \
  E2E_EMAIL=admin@test.com \
  E2E_PASSWORD=password \
  npx playwright test --reporter=list
  
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
  fi
  
  echo "❌ Tests failed. Iteration $ITERATION/$MAX_ITERATIONS"
  echo "Failures remain. Check output above."
  
  # Ask if user wants to continue
  read -p "Fix code and deploy, then press Enter to rerun (or Ctrl+C to stop)..." 
  
  ITERATION=$((ITERATION+1))
done

echo "Reached max iterations ($MAX_ITERATIONS). Stopping."
exit 1

