# Render Deployment + GitHub Actions Dispatch

This app can notify GitHub Actions after a successful Render deploy to run smoke/E2E tests automatically.

## Environment variables (Render → Service → Environment)

Set these in your Render Web Service to enable the dispatch:

- `GH_OWNER` — your GitHub username or org (e.g., `legacycricketacademy`)
- `GH_REPO` — repository name (e.g., `my-app`)
- `GH_PAT` — Fine‑grained Personal Access Token with `repo` scope sufficient for `repository_dispatch`.

If any are missing, the post‑deploy script will skip dispatch safely.

## Trigger script

We include a helper script:

```bash
bash scripts/trigger-github-dispatch.sh
```

It calls:

```
POST https://api.github.com/repos/$GH_OWNER/$GH_REPO/dispatches
Headers: Authorization: token $GH_PAT, Accept: application/vnd.github+json
Body: { "event_type": "render_deploy_succeeded" }
```

## Post‑deploy hook

Configure your Render service “Post‑deploy” command to:

```bash
bash scripts/trigger-github-dispatch.sh
```

This will send the dispatch after each successful deploy. If env vars are not set, it logs and exits 0.

## GitHub Actions

The workflow `.github/workflows/e2e.yml` listens for:

```yaml
on:
  repository_dispatch:
    types: [render_deploy_succeeded]
```

It will wait for `/api/ping` to be healthy, then run smoke/E2E against your Render URL and upload artifacts.
