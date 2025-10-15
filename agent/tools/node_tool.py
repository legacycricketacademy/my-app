import os, subprocess
class NodeTool:
    def __init__(self, client_dir='client', server_dir='server'):
        self.client_dir = client_dir; self.server_dir = server_dir
    def run_script(self, name:str):
        for d in [self.client_dir, self.server_dir]:
            if os.path.exists(os.path.join(d,'package.json')):
                print(f"Running {name} in {d}...")
                if subprocess.call(['npm','run',name], cwd=d) != 0:
                    return False
        return True
