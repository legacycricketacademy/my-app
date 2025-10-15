import os, re
from git import Repo

class RepoTool:
    def __init__(self, path:str='.') -> None:
        self.repo = Repo(path, search_parent_directories=True)
        self.remote = os.getenv('GIT_REMOTE','origin')

    def _slug(self, s:str):
        return re.sub(r'[^a-z0-9]+','-', s.lower()).strip('-')

    def start_feature_branch(self, title:str):
        base = f"agent/{self._slug(title)}"
        existing = {h.name for h in self.repo.heads}
        branch = base
        i = 2
        while branch in existing:
            branch = f"{base}-{i}"
            i += 1
        if self.repo.is_dirty(untracked_files=True):
            self.repo.git.add(all=True)
            self.repo.index.commit(f"chore(agent): save work before branching {branch}")
        self.repo.git.checkout('HEAD', b=branch)
        return branch

    def apply_minimal_edits(self, files):
        for f in files:
            d = os.path.dirname(f)
            if d and not os.path.exists(d): os.makedirs(d, exist_ok=True)
            with open(f,'a') as fh: fh.write("\n// agent touch\n")

    def commit_all(self, message:str):
        self.repo.git.add(all=True)
        if self.repo.is_dirty(untracked_files=True):
            self.repo.index.commit(message)
        try:
            self.repo.git.push(self.remote, self.repo.active_branch.name, set_upstream=True)
        except Exception as e:
            print(f"Push failed: {e}")
