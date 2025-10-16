#!/bin/bash
# Continuous Monitoring and Auto-Retry Script
# Monitors build status and automatically retries failed deployments

set -e

LOG_DIR="${LOG_DIR:-agent/logs}"
MONITOR_LOG="$LOG_DIR/monitor.log"
FAILURE_COUNT=0
MAX_RETRIES=10
RETRY_DELAY=300  # 5 minutes

# Logging functions
log_monitor() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MONITOR: $1" | tee -a "$MONITOR_LOG"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$MONITOR_LOG" >&2
}

# Check if build is failing
check_build_status() {
    local build_log="$LOG_DIR/build.log"
    
    if [ -f "$build_log" ]; then
        # Check for TypeScript errors
        if grep -q "error TS" "$build_log"; then
            log_monitor "TypeScript errors detected in build log"
            return 1
        fi
        
        # Check for build failure
        if grep -q "Build failed" "$build_log"; then
            log_monitor "Build failure detected"
            return 1
        fi
        
        # Check for successful build
        if grep -q "built successfully\|Build completed successfully" "$build_log"; then
            log_monitor "Build appears successful"
            return 0
        fi
    fi
    
    return 1
}

# Check if deployment is failing
check_deploy_status() {
    local deploy_log="$LOG_DIR/deploy.log"
    
    if [ -f "$deploy_log" ]; then
        # Check for deployment failure
        if grep -q "Deployment failed\|deploy failed" "$deploy_log"; then
            log_monitor "Deployment failure detected"
            return 1
        fi
        
        # Check for successful deployment
        if grep -q "Deployment successful\|deploy hook triggered successfully" "$deploy_log"; then
            log_monitor "Deployment appears successful"
            return 0
        fi
    fi
    
    return 1
}

# Trigger a new automation cycle
trigger_automation_cycle() {
    log_monitor "Triggering new automation cycle (attempt $((FAILURE_COUNT + 1)))"
    
    # Kill existing runner if running
    pkill -f "runner.sh" || true
    sleep 2
    
    # Start new automation cycle
    cd "$(dirname "$0")/.."
    LOG_DIR="$LOG_DIR" GOAL="Fix build errors and deploy to Render" ./agent/runner.sh &
    
    log_monitor "New automation cycle started (PID: $!)"
}

# Main monitoring loop
main() {
    log_monitor "Starting continuous monitoring..."
    log_monitor "Max retries: $MAX_RETRIES, Retry delay: ${RETRY_DELAY}s"
    
    while true; do
        sleep 60  # Check every minute
        
        # Check build status
        if ! check_build_status; then
            log_monitor "Build issues detected"
            
            # Check deployment status
            if ! check_deploy_status; then
                log_error "Both build and deployment issues detected"
                FAILURE_COUNT=$((FAILURE_COUNT + 1))
                
                if [ $FAILURE_COUNT -le $MAX_RETRIES ]; then
                    log_monitor "Triggering retry cycle $FAILURE_COUNT/$MAX_RETRIES"
                    trigger_automation_cycle
                    
                    log_monitor "Waiting ${RETRY_DELAY}s before next check"
                    sleep $RETRY_DELAY
                else
                    log_error "Max retries ($MAX_RETRIES) exceeded. Stopping monitoring."
                    break
                fi
            else
                log_monitor "Build issues but deployment OK - continuing monitoring"
                FAILURE_COUNT=0  # Reset counter on partial success
            fi
        else
            # Build is OK, check deployment
            if check_deploy_status; then
                log_monitor "Both build and deployment are healthy"
                FAILURE_COUNT=0  # Reset counter on success
            else
                log_monitor "Build OK but deployment issues detected"
                FAILURE_COUNT=$((FAILURE_COUNT + 1))
                
                if [ $FAILURE_COUNT -le $MAX_RETRIES ]; then
                    log_monitor "Triggering deployment retry $FAILURE_COUNT/$MAX_RETRIES"
                    trigger_automation_cycle
                    sleep $RETRY_DELAY
                fi
            fi
        fi
        
        # Log current status
        log_monitor "Status: Build=$(check_build_status && echo 'OK' || echo 'FAIL'), Deploy=$(check_deploy_status && echo 'OK' || echo 'FAIL'), Failures=$FAILURE_COUNT"
    done
}

# Cleanup on exit
cleanup() {
    log_monitor "Monitoring stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start monitoring
main
