#!/bin/bash
# Status Dashboard for Automation System

echo "🚀 AUTOMATION SYSTEM STATUS DASHBOARD"
echo "======================================"
echo

# Check running processes
echo "📊 ACTIVE PROCESSES:"
echo "-------------------"
if pgrep -f "runner.sh" > /dev/null; then
    echo "✅ Automation Runner: RUNNING"
    echo "   PID: $(pgrep -f 'runner.sh')"
else
    echo "❌ Automation Runner: NOT RUNNING"
fi

if pgrep -f "monitor.sh" > /dev/null; then
    echo "✅ Monitor: RUNNING"
    echo "   PID: $(pgrep -f 'monitor.sh')"
else
    echo "❌ Monitor: NOT RUNNING"
fi

if pgrep -f "caffeinate" > /dev/null; then
    echo "✅ Caffeinate: RUNNING (system awake)"
else
    echo "⚠️  Caffeinate: NOT RUNNING"
fi

echo

# Check recent logs
echo "📋 RECENT ACTIVITY:"
echo "------------------"
if [ -f "agent/logs/runner.log" ]; then
    echo "Last 5 runner entries:"
    tail -5 agent/logs/runner.log | sed 's/^/   /'
else
    echo "No runner log found"
fi

echo

# Check build status
echo "🔧 BUILD STATUS:"
echo "---------------"
if [ -f "agent/logs/build.log" ]; then
    if grep -q "Build failed\|error TS" agent/logs/build.log; then
        echo "❌ Build: FAILED (TypeScript errors)"
        echo "   Latest errors:"
        grep -E "error TS|Build failed" agent/logs/build.log | tail -3 | sed 's/^/   /'
    elif grep -q "built successfully\|Build completed" agent/logs/build.log; then
        echo "✅ Build: SUCCESS"
    else
        echo "⚠️  Build: UNKNOWN STATUS"
    fi
else
    echo "No build log found"
fi

echo

# Check deployment status
echo "🚀 DEPLOYMENT STATUS:"
echo "--------------------"
if [ -f "agent/logs/deploy.log" ]; then
    if grep -q "Deployment successful\|deploy hook triggered" agent/logs/deploy.log; then
        echo "✅ Deployment: SUCCESS"
        echo "   Last success:"
        grep "Deployment successful\|deploy hook triggered" agent/logs/deploy.log | tail -1 | sed 's/^/   /'
    elif grep -q "Deployment failed\|deploy failed" agent/logs/deploy.log; then
        echo "❌ Deployment: FAILED"
        echo "   Latest error:"
        grep -E "Deployment failed|deploy failed" agent/logs/deploy.log | tail -1 | sed 's/^/   /'
    else
        echo "⚠️  Deployment: UNKNOWN STATUS"
    fi
else
    echo "No deployment log found"
fi

echo

# Check active PRs
echo "🔀 ACTIVE PRs:"
echo "-------------"
echo "✅ PR #26: Fix TypeScript errors in server/storage.ts and server/utils/api-response.ts"
echo "✅ PR #25: Fix Firebase auth initialization error and dev login bypass"
echo "✅ PR #24: Simple dev login bypass endpoint"
echo "✅ PR #23: Add dev login bypass for testing"
echo "✅ PR #22: Fix Firebase auth initialization"
echo "✅ PR #21: Update README Quickstart"
echo "✅ PR #20: Add pre-push hook for lint + typecheck + test:api"
echo "✅ PR #19: Add render.yaml for web service deployment"
echo "✅ PR #18: Add single script npm run dev:all"
echo "✅ PR #17: Ensure Drizzle config supports sqlite locally and Postgres"
echo "✅ PR #16: Add Playwright with 1-2 happy-path flows"
echo "✅ PR #15: Add Vitest + Supertest for auth, coach approval, dashboard endpoints"
echo "✅ PR #14: Add /api/healthz endpoint with React health badge"

echo

# Check system resources
echo "💻 SYSTEM RESOURCES:"
echo "-------------------"
echo "CPU Usage: $(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')"
echo "Memory: $(ps -o pid,rss,comm -p $(pgrep -f 'runner.sh\|monitor.sh' 2>/dev/null | tr '\n' ' ') 2>/dev/null | awk 'NR>1 {sum+=$2} END {print sum/1024 " MB"}' || echo "N/A")"

echo

# Render deployment hook status
echo "🌐 RENDER DEPLOYMENT:"
echo "--------------------"
if [ -n "$RENDER_DEPLOY_HOOK_URL" ]; then
    echo "✅ Hook URL: Configured"
    echo "   Environment: ${RENDER_ENV:-production}"
else
    echo "❌ Hook URL: Not configured"
fi

echo

# Next actions
echo "🎯 NEXT ACTIONS:"
echo "---------------"
echo "1. Monitor PR #26 for TypeScript fixes"
echo "2. Wait for build errors to be resolved"
echo "3. Monitor automatic retry cycles"
echo "4. Check Render deployment after successful build"

echo
echo "📱 QUICK COMMANDS:"
echo "-----------------"
echo "View logs:    tail -f agent/logs/runner.log"
echo "Check status: ./agent/status.sh"
echo "Manual deploy: cd agent && python3 deploy_render.py"
echo "Stop system:  pkill -f 'runner.sh\|monitor.sh'"

echo
echo "🕐 Last Updated: $(date)"
echo "======================================"
