#!/bin/bash
# Unattended Automation Runner
# Runs continuous development and deployment loop

set -e

# Configuration
LOG_DIR="${LOG_DIR:-agent/logs}"
GOAL="${GOAL:-Ship features + tests + deploy to Render}"
PYTHON="${PY:-python3}"
AGENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$AGENT_DIR/.." && pwd)"

# Create logs directory
mkdir -p "$LOG_DIR"

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/runner.log"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_DIR/runner.log" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$LOG_DIR/runner.log"
}

# Cleanup function
cleanup() {
    log "Cleaning up background processes..."
    jobs -p | xargs -r kill
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep system awake (macOS)
if command -v caffeinate >/dev/null 2>&1; then
    log "Starting caffeinate to keep system awake..."
    caffeinate -dimsu &
    CAFFEINATE_PID=$!
    trap "kill $CAFFEINATE_PID 2>/dev/null || true; cleanup" EXIT
fi

log "Starting unattended automation runner..."
log "Project root: $PROJECT_ROOT"
log "Log directory: $LOG_DIR"
log "Goal: $GOAL"

cd "$PROJECT_ROOT"

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if git is available
    if ! command -v git >/dev/null 2>&1; then
        log_error "Git not found"
        return 1
    fi
    
    # Check if node is available
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js not found"
        return 1
    fi
    
    # Check if npm is available
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm not found"
        return 1
    fi
    
    # Check if agent dependencies are installed
    if ! $PYTHON -c "import openai, git, requests" 2>/dev/null; then
        log "Installing agent dependencies..."
        $PYTHON -m pip install -q -r "$AGENT_DIR/requirements.txt"
    fi
    
    log_success "Prerequisites check passed"
    return 0
}

# Run build and test cycle
run_build_test() {
    log "Starting build and test cycle..."
    
    # Set up environment
    export DATABASE_URL="file:$(pwd)/dev.db"
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci > "$LOG_DIR/npm-install.log" 2>&1 || {
        log_error "npm ci failed"
        return 1
    }
    
    # Run database migrations
    log "Running database migrations..."
    npm run db:push > "$LOG_DIR/db-migrate.log" 2>&1 || {
        log_error "Database migration failed"
        return 1
    }
    
    # Run linting
    log "Running linting..."
    if npm run lint > "$LOG_DIR/lint.log" 2>&1; then
        log_success "Linting passed"
    else
        log "Linting issues found (non-blocking)"
    fi
    
    # Run type checking
    log "Running type checking..."
    if npm run typecheck > "$LOG_DIR/typecheck.log" 2>&1; then
        log_success "Type checking passed"
    else
        log "Type checking issues found (non-blocking)"
    fi
    
    # Run API tests if available
    if npm run test:api > "$LOG_DIR/test-api.log" 2>&1; then
        log_success "API tests passed"
    else
        log "API tests failed or not available"
    fi
    
    # Run E2E tests if available
    if npm run test:e2e > "$LOG_DIR/test-e2e.log" 2>&1; then
        log_success "E2E tests passed"
    else
        log "E2E tests failed or not available"
    fi
    
    # Build the application
    log "Building application..."
    if npm run build > "$LOG_DIR/build.log" 2>&1; then
        log_success "Build completed successfully"
        return 0
    else
        log_error "Build failed"
        return 1
    fi
}

# Deploy to Render
deploy_to_render() {
    log "Starting Render deployment..."
    
    # Check if Render configuration exists
    if [ -z "$RENDER_DEPLOY_HOOK_URL" ] && [ -z "$RENDER_API_TOKEN" ]; then
        log "No Render configuration found, skipping deployment"
        return 0
    fi
    
    # Run deployment
    if $PYTHON "$AGENT_DIR/deploy_render.py" > "$LOG_DIR/deploy.log" 2>&1; then
        log_success "Deployment to Render completed"
        return 0
    else
        log_error "Deployment to Render failed"
        return 1
    fi
}

# Run AI agent goal
run_agent_goal() {
    log "Running AI agent with goal: $GOAL"
    
    if make -C "$AGENT_DIR" PY="$PYTHON" run GOAL="$GOAL" > "$LOG_DIR/agent.log" 2>&1; then
        log_success "AI agent completed successfully"
        return 0
    else
        log_error "AI agent failed"
        return 1
    fi
}

# Main execution loop
main() {
    local cycle_count=0
    
    while true; do
        cycle_count=$((cycle_count + 1))
        log "=== Starting cycle $cycle_count ==="
        
        # Check prerequisites
        if ! check_prerequisites; then
            log_error "Prerequisites check failed, waiting 60 seconds..."
            sleep 60
            continue
        fi
        
        # Run build and test
        if run_build_test; then
            log_success "Build and test cycle completed"
            
            # Deploy to Render
            if deploy_to_render; then
                log_success "Deployment completed"
            fi
            
            # Run AI agent goal
            if run_agent_goal; then
                log_success "AI agent goal completed"
            fi
        else
            log_error "Build and test cycle failed, waiting 60 seconds..."
            sleep 60
            continue
        fi
        
        log "=== Cycle $cycle_count completed ==="
        log "Waiting 300 seconds (5 minutes) before next cycle..."
        sleep 300
    done
}

# Start main execution
main
