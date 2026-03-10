# Deploying Note to Cloudflare Workers

## Quick start

Run these from the project root.

## 1) Log in to Cloudflare

```bash
npx wrangler login
npx wrangler whoami
```

## 2) Create R2 buckets

```bash
npx wrangler r2 bucket create note-prod
npx wrangler r2 bucket create note-preview
npx wrangler r2 bucket list
```

## 3) Confirm `wrangler.toml`

This project is already configured for:

```toml
name = "note"
main = "src/index.ts"
compatibility_date = "2026-03-10"
workers_dev = true

[[r2_buckets]]
binding = "NOTES_BUCKET"
bucket_name = "note-prod"
preview_bucket_name = "note-preview"
```

If you want different names, update them before deploy.

## 4) Install and verify locally

```bash
npm ci
npm run verify
```

## 5) Deploy manually

```bash
npx wrangler deploy
```

After deploy, Wrangler will print your `workers.dev` URL.

## 6) Smoke test manually

Replace `YOUR-WORKER.workers.dev` below.

### Open the app

```bash
curl -I https://YOUR-WORKER.workers.dev/
```

### Create a note

```bash
curl -X POST https://YOUR-WORKER.workers.dev/ \
  -H 'Content-Type: application/json' \
  -H 'User-Agent: curl/8.0.0' \
  -d '{"content":"hello from workers"}'
```

This returns a URL like:

```text
https://YOUR-WORKER.workers.dev/noteid/ABCDE
```

### Read a note

```bash
curl https://YOUR-WORKER.workers.dev/noteid/ABCDE
```

### Delete a note

```bash
curl -X POST https://YOUR-WORKER.workers.dev/noteid/ABCDE \
  -H 'Content-Type: application/json' \
  -d '{"noteId":"ABCDE","content":""}'
```

## 7) GitHub Actions deployment setup

The deploy workflow uses `cloudflare/wrangler-action@v3`.

### Required GitHub repository secrets

Set these secrets in GitHub Actions:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Optional GitHub repository variable

- `CLOUDFLARE_WORKER_NAME`

If omitted, the workflow deploys as `note`.

## 8) Set GitHub secrets with `gh`

If you use GitHub CLI and have access to the repo:

```bash
gh secret set CLOUDFLARE_API_TOKEN --body 'YOUR_CLOUDFLARE_API_TOKEN'
gh secret set CLOUDFLARE_ACCOUNT_ID --body 'YOUR_CLOUDFLARE_ACCOUNT_ID'
gh variable set CLOUDFLARE_WORKER_NAME --body 'note'
```

## 9) Recommended Cloudflare token permissions

Create an API token with at least:

- Workers Scripts: Edit
- Workers R2 Storage: Edit

Use the Cloudflare dashboard to create the token, then store it as `CLOUDFLARE_API_TOKEN`.

## 10) Trigger deploy from GitHub

### Automatic

Create and push a tag beginning with `v`:

```bash
git tag v0.0.1
git push origin v0.0.1
```

### Manual

Run the `Deploy Worker` workflow from the GitHub Actions UI.

## 11) Post-deploy checks

- open `/`
- create a note in the browser
- confirm URL changes to `/noteid/:id`
- reload the note URL
- clear content and confirm delete behavior
- test curl GET and curl POST
