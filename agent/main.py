import argparse, os, json
from dotenv import load_dotenv
from rich import print
from planner import plan_from_goal
from tools.repo_tool import RepoTool
from tools.node_tool import NodeTool
from tools.github_tool import GitHubTool

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

p = argparse.ArgumentParser()
p.add_argument('--goal')
p.add_argument('--plan')
args = p.parse_args()

# RepoTool will search upward for the real .git
repo = RepoTool(path='.')
node = NodeTool(client_dir=os.getenv('CLIENT_DIR','client'),
                server_dir=os.getenv('SERVER_DIR','server'))
gh   = GitHubTool(repo_slug=os.getenv('GITHUB_REPO',''))

tasks = json.load(open(args.plan)) if args.plan else plan_from_goal(args.goal or "Hello Agent — wiring PR")

print(f"Planned {len(tasks)} task(s)")
for i, t in enumerate(tasks, 1):
    b = repo.start_feature_branch(t['title']); print(f"\nTask {i}: {t['title']} -> {b}")
    repo.apply_minimal_edits(t.get('files', []))
    for s in t.get('npmScripts', []):
        if not node.run_script(s):
            print(f"Script failed: {s}"); break
    repo.commit_all(f"feat(agent): {t['title']}")
    print(f"PR opened: {gh.open_pr(b, t['title'], t.get('acceptance',''))}")
