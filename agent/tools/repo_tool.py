import os, re
from git import Repo

class RepoTool:
    def __init__(self, path:str='.') -> None:
        # search upward so running from agent/ still finds repo root
        self.repo = Repo(path, search_parent_directories=True)
        self.remote = os.getenv('GIT_REMOTE','origin')

    def start_feature_branch(self, title:str):
        slug = re.sub(r'[^a-z0-9]+','-', title.lower()).strip('-')
        branch = f"agent/{slug}"
        # if branch already exists, just check it out instead of failing
        existing = [h.name for h in self.repo.heads]
        if branch.split('/')[-1] in [n.split('/')[-1] for n in existing]:
            self.repo.git.checkout(branch)
        else:
            self.repo.git.checkout('HEAD', b=branch)
        return branch

    def apply_minimal_edits(self, files):
        for f in files:
            d = os.path.dirname(f)
            if d and not os.path.exists(d): os.makedirs(d, exist_ok=True)
            with open(f,'a') as fh: fh.write("\n// agent touch\n")

    def commit_all(self, message:str):
        self.repo.git.add(all=True)
        # commit only if there is something to commit
        if self.repo.is_dirty(untracked_files=True):
            self.repo.index.commit(message)
            try:
                self.repo.git.push(self.remote, self.repo.active_branch.name, set_upstream=True)
            except Exception as e:
                print(f"Push failed: {e}")
