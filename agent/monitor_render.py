#!/usr/bin/env python3
"""
Render Deployment Monitor
Tracks deployment status, pulls logs, and triggers fixes for build failures.
"""

import os
import sys
import time
import json
import requests
import subprocess
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class RenderDeploymentMonitor:
    def __init__(self):
        self.api_token = os.getenv('RENDER_API_TOKEN')
        self.service_id = os.getenv('RENDER_SERVICE_ID')
        self.deploy_hook_url = os.getenv('RENDER_DEPLOY_HOOK_URL')
        self.headers = {'Authorization': f'Bearer {self.api_token}'} if self.api_token else {}
        
    def get_deployment_status(self):
        """Get the latest deployment status from Render API"""
        if not self.api_token or not self.service_id:
            return {"error": "Render API not configured"}
            
        try:
            url = f"https://api.render.com/v1/services/{self.service_id}/deploys"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            deploys = response.json()
            if deploys:
                latest = deploys[0]
                return {
                    "status": latest.get('status'),
                    "id": latest.get('id'),
                    "commit": latest.get('commit', {}).get('id'),
                    "created_at": latest.get('createdAt'),
                    "finished_at": latest.get('finishedAt'),
                    "build_logs_url": latest.get('buildLogsUrl')
                }
            return {"status": "no_deploys"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_deployment_logs(self, deploy_id=None):
        """Get deployment logs for the latest or specific deployment"""
        if not self.api_token or not self.service_id:
            return {"error": "Render API not configured"}
            
        try:
            if not deploy_id:
                status = self.get_deployment_status()
                deploy_id = status.get('id')
                
            if not deploy_id:
                return {"error": "No deployment ID available"}
                
            # Get deployment details
            url = f"https://api.render.com/v1/services/{self.service_id}/deploys/{deploy_id}"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            deploy_data = response.json()
            
            # Try to get build logs if available
            logs_url = deploy_data.get('buildLogsUrl')
            logs = ""
            if logs_url:
                try:
                    logs_response = requests.get(logs_url, timeout=60)
                    logs = logs_response.text
                except Exception as e:
                    logs = f"Could not fetch logs: {e}"
            
            return {
                "deploy_id": deploy_id,
                "status": deploy_data.get('status'),
                "logs": logs,
                "error_message": deploy_data.get('errorMessage'),
                "created_at": deploy_data.get('createdAt'),
                "finished_at": deploy_data.get('finishedAt')
            }
        except Exception as e:
            return {"error": str(e)}
    
    def analyze_build_failure(self, logs):
        """Analyze build logs to identify specific TypeScript errors"""
        if not logs:
            return []
            
        errors = []
        lines = logs.split('\n')
        
        for line in lines:
            line = line.strip()
            if 'error TS' in line and ('server/' in line or 'db/' in line or 'shared/' in line):
                errors.append(line)
            elif 'Cannot find module' in line:
                errors.append(line)
            elif 'Property' in line and 'does not exist' in line:
                errors.append(line)
            elif 'Object literal may only specify known properties' in line:
                errors.append(line)
        
        return errors
    
    def trigger_fix_pr(self, errors):
        """Create a PR to fix the identified errors"""
        if not errors:
            return None
            
        # Categorize errors
        missing_deps = [e for e in errors if 'Cannot find module' in e]
        type_errors = [e for e in errors if 'error TS' in e]
        schema_errors = [e for e in errors if 'Property' in e and 'does not exist' in e]
        
        # Create a focused goal for fixing these specific issues
        goal_parts = []
        if missing_deps:
            goal_parts.append("install missing dependencies")
        if type_errors:
            goal_parts.append("fix TypeScript compilation errors")
        if schema_errors:
            goal_parts.append("fix Drizzle schema type mismatches")
        
        goal = "Fix Render build failures: " + ", ".join(goal_parts)
        
        try:
            # Use the agent to create a fix PR
            result = subprocess.run([
                'make', '-C', 'agent', 'PY=python3', 'run', 
                f'GOAL="{goal}"'
            ], capture_output=True, text=True, timeout=300)
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr,
                "goal": goal
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def monitor_deployment(self, max_attempts=10, check_interval=30):
        """Monitor deployment and automatically fix issues"""
        print(f"[{datetime.now()}] Starting Render deployment monitoring...")
        
        for attempt in range(max_attempts):
            print(f"[{datetime.now()}] Attempt {attempt + 1}/{max_attempts}")
            
            # Check deployment status
            status = self.get_deployment_status()
            print(f"Deployment status: {status}")
            
            if status.get('status') == 'live':
                print("✅ Deployment successful!")
                return True
            elif status.get('status') in ['failed', 'canceled']:
                print("❌ Deployment failed, analyzing logs...")
                
                # Get detailed logs
                logs_data = self.get_deployment_logs()
                if logs_data.get('error'):
                    print(f"Could not get logs: {logs_data['error']}")
                    continue
                
                # Analyze errors
                errors = self.analyze_build_failure(logs_data.get('logs', ''))
                print(f"Found {len(errors)} build errors")
                
                if errors:
                    print("Creating fix PR...")
                    fix_result = self.trigger_fix_pr(errors)
                    if fix_result.get('success'):
                        print("✅ Fix PR created successfully")
                        print(f"Goal: {fix_result.get('goal')}")
                    else:
                        print(f"❌ Failed to create fix PR: {fix_result.get('error')}")
                
                # Wait before next attempt
                time.sleep(check_interval)
            else:
                print(f"Deployment in progress: {status.get('status')}")
                time.sleep(check_interval)
        
        print("❌ Max monitoring attempts reached")
        return False

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--monitor':
        monitor = RenderDeploymentMonitor()
        monitor.monitor_deployment()
    elif len(sys.argv) > 1 and sys.argv[1] == '--status':
        monitor = RenderDeploymentMonitor()
        status = monitor.get_deployment_status()
        print(json.dumps(status, indent=2))
    elif len(sys.argv) > 1 and sys.argv[1] == '--logs':
        monitor = RenderDeploymentMonitor()
        logs_data = monitor.get_deployment_logs()
        print(json.dumps(logs_data, indent=2))
    else:
        print("Usage:")
        print("  python monitor_render.py --monitor  # Monitor deployment and auto-fix")
        print("  python monitor_render.py --status   # Check current status")
        print("  python monitor_render.py --logs     # Get latest logs")

if __name__ == "__main__":
    main()
