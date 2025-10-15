# Unattended Automation System

This system provides continuous development and deployment automation for the Legacy Cricket Academy app.

## 🚀 Quick Start

### Start Unattended Automation
```bash
LOG_DIR=agent/logs GOAL="Ship features + tests + deploy to Render" ./agent/runner.sh
```

### Manual Deployment
```bash
cd agent
python3 deploy_render.py
```

### Check Deployment Status
```bash
cd agent
python3 deploy_render.py status [deploy_id]
```

## 📁 System Components

### Core Files
- `agent/runner.sh` - Main automation runner (keeps system awake, runs cycles)
- `agent/deploy_render.py` - Render deployment entry point
- `agent/tools/render_tool.py` - Render API integration
- `.github/workflows/render-deploy.yml` - GitHub Actions deployment

### Configuration
- `agent/.env` - Environment variables (add your Render credentials)
- `agent/logs/` - Log files directory

## 🔧 Configuration

### Required Environment Variables

Add to `agent/.env`:
```bash
# Render Deployment (choose one method)
RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-xxxxx?key=xxxxx
# OR
RENDER_API_TOKEN=your_render_api_token
RENDER_SERVICE_ID=your_service_id

# Optional
RENDER_ENV=production
```

### GitHub Secrets

Add to your GitHub repository secrets:
- `RENDER_DEPLOY_HOOK_URL` - Render deploy hook URL
- `RENDER_API_TOKEN` - Render API token (if using API method)
- `RENDER_SERVICE_ID` - Render service ID (if using API method)

## 🔄 Automation Flow

### Continuous Loop (runner.sh)
1. **Prerequisites Check** - Git, Node, npm, dependencies
2. **Build & Test Cycle** - Install, migrate DB, lint, typecheck, test, build
3. **Deploy to Render** - Via hook or API
4. **AI Agent Goal** - Run specified goal with make
5. **Wait & Repeat** - 5-minute cycle

### GitHub Actions (render-deploy.yml)
1. **Trigger** - Push to main or merged PR
2. **Build & Test** - Install, lint, typecheck, test, build
3. **Deploy** - Via hook or API
4. **Status Check** - Monitor deployment

## 📊 Monitoring

### Log Files (agent/logs/)
- `runner.log` - Main automation log
- `npm-install.log` - Dependency installation
- `db-migrate.log` - Database migrations
- `lint.log` - Linting results
- `typecheck.log` - Type checking results
- `test-api.log` - API test results
- `test-e2e.log` - E2E test results
- `build.log` - Build process
- `deploy.log` - Deployment logs
- `agent.log` - AI agent execution

### System Requirements
- **macOS**: Uses `caffeinate` to keep system awake
- **Linux**: No special requirements
- **Windows**: Not supported (bash script)

## 🛠️ Troubleshooting

### Common Issues

1. **Render deployment fails**
   - Check credentials in `agent/.env`
   - Verify service ID and API token
   - Check Render service status

2. **Build failures**
   - Check `agent/logs/build.log`
   - Ensure database is accessible
   - Verify Node.js version (20+)

3. **AI agent fails**
   - Check `agent/logs/agent.log`
   - Verify GitHub token and repo access
   - Check OpenAI API key

### Manual Commands

```bash
# Check system status
ps aux | grep -E "(vite|tsx|runner)"

# View recent logs
tail -f agent/logs/runner.log

# Test deployment manually
cd agent && python3 deploy_render.py

# Stop automation
pkill -f runner.sh
```

## 🔐 Security

- Never commit secrets to git
- Use environment variables for credentials
- GitHub secrets for CI/CD
- Local `.env` files for development

## 📈 Performance

- **Cycle Time**: ~5 minutes between cycles
- **Build Time**: ~2-3 minutes
- **Deploy Time**: ~1-2 minutes
- **System Impact**: Minimal (keeps awake, runs in background)

## 🎯 Goals

The system supports any AI agent goal:
- `"Ship features + tests + deploy to Render"`
- `"Fix authentication and add dev login"`
- `"Add health monitoring endpoints"`
- `"Improve UI components and styling"`

Goals are executed via the existing AI agent system and automatically create PRs.
