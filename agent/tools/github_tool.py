import os, requests
class GitHubTool:
    def __init__(self, repo_slug:str):
        self.repo = repo_slug
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f"Bearer {os.getenv('GITHUB_TOKEN','')}",
            'Accept': 'application/vnd.github+json'
        })
    def open_pr(self, branch:str, title:str, body:str):
        if not self.repo: return "(no repo set)"
        url = f"https://api.github.com/repos/{self.repo}/pulls"
        data = {'title': title, 'head': branch,
                'base': os.getenv('GITHUB_DEFAULT_BRANCH','main'),
                'body': body or ''}
        r = self.session.post(url, json=data)
        # print diagnostic info on failure
        if r.status_code >= 400:
            try: print("GitHub error:", r.status_code, r.json())
            except: print("GitHub error:", r.status_code, r.text)
        r.raise_for_status()
        return r.json().get('html_url')
