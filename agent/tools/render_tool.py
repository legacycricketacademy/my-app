import os
import requests
import json
from typing import Dict, Any, Optional

class RenderTool:
    def __init__(self):
        self.deploy_hook_url = os.getenv('RENDER_DEPLOY_HOOK_URL', '')
        self.api_token = os.getenv('RENDER_API_TOKEN', '')
        self.service_id = os.getenv('RENDER_SERVICE_ID', '')
        self.env = os.getenv('RENDER_ENV', 'production')
        
        self.session = requests.Session()
        if self.api_token:
            self.session.headers.update({
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json'
            })

    def deploy_via_hook(self) -> Dict[str, Any]:
        """Deploy using Render Deploy Hook URL"""
        if not self.deploy_hook_url:
            return {
                'success': False,
                'method': 'hook',
                'error': 'RENDER_DEPLOY_HOOK_URL not configured'
            }
        
        try:
            print(f"Triggering deploy via hook: {self.deploy_hook_url}")
            response = requests.post(self.deploy_hook_url, timeout=30)
            response.raise_for_status()
            
            return {
                'success': True,
                'method': 'hook',
                'status_code': response.status_code,
                'message': 'Deploy hook triggered successfully'
            }
        except Exception as e:
            return {
                'success': False,
                'method': 'hook',
                'error': str(e)
            }

    def deploy_via_api(self) -> Dict[str, Any]:
        """Deploy using Render API"""
        if not self.api_token or not self.service_id:
            return {
                'success': False,
                'method': 'api',
                'error': 'RENDER_API_TOKEN and RENDER_SERVICE_ID required for API deployment'
            }
        
        try:
            # Get current deploy
            url = f"https://api.render.com/v1/services/{self.service_id}/deploys"
            
            print(f"Triggering deploy via API for service: {self.service_id}")
            response = self.session.post(url, json={
                'clearCache': 'clear',
                'commitSha': os.getenv('GIT_SHA', 'latest')
            }, timeout=30)
            response.raise_for_status()
            
            deploy_data = response.json()
            return {
                'success': True,
                'method': 'api',
                'deploy_id': deploy_data.get('id'),
                'status': deploy_data.get('status'),
                'url': deploy_data.get('serviceUrl'),
                'message': 'Deploy triggered via API successfully'
            }
        except Exception as e:
            return {
                'success': False,
                'method': 'api',
                'error': str(e)
            }

    def deploy(self) -> Dict[str, Any]:
        """Try hook first, fallback to API"""
        print("Starting Render deployment...")
        
        # Try deploy hook first (faster and simpler)
        if self.deploy_hook_url:
            result = self.deploy_via_hook()
            if result['success']:
                return result
            print(f"Hook deployment failed: {result['error']}, trying API...")
        
        # Fallback to API
        result = self.deploy_via_api()
        if result['success']:
            return result
        
        return {
            'success': False,
            'method': 'both',
            'error': f"Hook failed: {result.get('error', 'unknown')}, API failed: {result.get('error', 'unknown')}"
        }

    def get_deploy_status(self, deploy_id: str = None) -> Dict[str, Any]:
        """Get deployment status"""
        if not self.api_token or not self.service_id:
            return {
                'success': False,
                'error': 'API credentials not configured'
            }
        
        try:
            if deploy_id:
                url = f"https://api.render.com/v1/deploys/{deploy_id}"
            else:
                url = f"https://api.render.com/v1/services/{self.service_id}/deploys"
                response = self.session.get(url)
                response.raise_for_status()
                deploys = response.json()
                if deploys:
                    deploy_id = deploys[0]['id']
                    url = f"https://api.render.com/v1/deploys/{deploy_id}"
                else:
                    return {
                        'success': False,
                        'error': 'No deployments found'
                    }
            
            response = self.session.get(url)
            response.raise_for_status()
            deploy_data = response.json()
            
            return {
                'success': True,
                'deploy_id': deploy_data.get('id'),
                'status': deploy_data.get('status'),
                'commit_sha': deploy_data.get('commitSha'),
                'created_at': deploy_data.get('createdAt'),
                'finished_at': deploy_data.get('finishedAt'),
                'url': deploy_data.get('serviceUrl')
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
