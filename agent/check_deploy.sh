#!/bin/bash

# Simple Render deployment status checker
# This script checks if the app is accessible and triggers fixes if needed

set -euo pipefail

# Configuration
APP_URL="https://cricket-academy-app.onrender.com"
LOG_DIR="${LOG_DIR:-agent/logs}"
PROJECT_ROOT=$(dirname "$(dirname "$(realpath "$0")")")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_DIR}/deploy-check.log"
}

check_app_health() {
    log_message "Checking app health at ${APP_URL}..."
    
    # Check if the app responds
    if curl -s -f "${APP_URL}/health" > /dev/null 2>&1; then
        log_message "${GREEN}✅ App is healthy and responding${NC}"
        return 0
    elif curl -s -f "${APP_URL}/api/ping" > /dev/null 2>&1; then
        log_message "${GREEN}✅ App is responding via API${NC}"
        return 0
    else
        log_message "${RED}❌ App is not responding${NC}"
        return 1
    fi
}

trigger_new_deploy() {
    log_message "Triggering new deployment..."
    
    if python3 "${PROJECT_ROOT}/agent/deploy_render.py" 2>&1 | tee -a "${LOG_DIR}/deploy-trigger.log"; then
        log_message "${GREEN}✅ Deployment triggered successfully${NC}"
        return 0
    else
        log_message "${RED}❌ Failed to trigger deployment${NC}"
        return 1
    fi
}

main() {
    log_message "Starting deployment health check..."
    
    if check_app_health; then
        log_message "${GREEN}✅ Deployment is successful - app is running${NC}"
        exit 0
    else
        log_message "${YELLOW}⚠️  App is not responding - triggering new deployment${NC}"
        
        if trigger_new_deploy; then
            log_message "${YELLOW}⏳ Deployment triggered - waiting 2 minutes before rechecking...${NC}"
            sleep 120
            
            if check_app_health; then
                log_message "${GREEN}✅ Deployment successful after retry${NC}"
                exit 0
            else
                log_message "${RED}❌ Deployment still failing after retry${NC}"
                exit 1
            fi
        else
            log_message "${RED}❌ Failed to trigger deployment${NC}"
            exit 1
        fi
    fi
}

# Run main function
main "$@"
