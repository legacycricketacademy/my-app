#!/usr/bin/env python3
"""
Render Deployment Script
Entry point for triggering Render deployments via hook or API
"""
import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv
from tools.render_tool import RenderTool

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def log_message(message: str, level: str = "INFO"):
    """Log message with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def main():
    """Main deployment function"""
    log_message("Starting Render deployment process...")
    
    # Validate configuration
    deploy_hook = os.getenv('RENDER_DEPLOY_HOOK_URL')
    api_token = os.getenv('RENDER_API_TOKEN')
    service_id = os.getenv('RENDER_SERVICE_ID')
    
    if not deploy_hook and not (api_token and service_id):
        log_message("No Render deployment configuration found", "ERROR")
        log_message("Please set either RENDER_DEPLOY_HOOK_URL or both RENDER_API_TOKEN and RENDER_SERVICE_ID", "ERROR")
        return 1
    
    # Initialize Render tool
    render_tool = RenderTool()
    
    # Attempt deployment
    try:
        result = render_tool.deploy()
        
        if result['success']:
            log_message(f"Deployment successful via {result['method']}")
            if 'deploy_id' in result:
                log_message(f"Deploy ID: {result['deploy_id']}")
            if 'url' in result:
                log_message(f"Service URL: {result['url']}")
            log_message(result['message'])
            return 0
        else:
            log_message(f"Deployment failed: {result['error']}", "ERROR")
            return 1
            
    except Exception as e:
        log_message(f"Deployment error: {str(e)}", "ERROR")
        return 1

def check_status(deploy_id: str = None):
    """Check deployment status"""
    log_message("Checking deployment status...")
    
    render_tool = RenderTool()
    result = render_tool.get_deploy_status(deploy_id)
    
    if result['success']:
        log_message(f"Deploy Status: {result['status']}")
        log_message(f"Deploy ID: {result['deploy_id']}")
        log_message(f"Commit SHA: {result['commit_sha']}")
        if result['url']:
            log_message(f"Service URL: {result['url']}")
    else:
        log_message(f"Status check failed: {result['error']}", "ERROR")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "status":
        deploy_id = sys.argv[2] if len(sys.argv) > 2 else None
        check_status(deploy_id)
    else:
        exit_code = main()
        sys.exit(exit_code)
