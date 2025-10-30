// Optional post-deploy hook for Render to trigger GitHub Actions dispatch
import { spawn } from 'node:child_process';

const { GH_OWNER, GH_REPO, GH_PAT } = process.env;

if (!GH_OWNER || !GH_REPO || !GH_PAT) {
  console.log('[post-deploy] Skipping GitHub dispatch (GH_OWNER/GH_REPO/GH_PAT not set)');
  process.exit(0);
}

console.log(`[post-deploy] Triggering repository_dispatch for ${GH_OWNER}/${GH_REPO} ...`);

const child = spawn('bash', ['scripts/trigger-github-dispatch.sh'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  console.log(`[post-deploy] dispatch script exited with code ${code}`);
  process.exit(0);
});


