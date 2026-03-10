# Note

A lightweight note-taking app built with **TypeScript**, deployed on **Cloudflare Workers**, and stored in **R2**.

## Features

- simple editor with autosave
- shareable note URLs
- 5-character note IDs
- curl-friendly read/write behavior
- delete note by clearing content
- print support
- responsive UI
- single Worker deployment on `workers.dev`

## Tech Stack

- Cloudflare Workers
- TypeScript
- R2
- vanilla HTML/CSS/JS
- Vitest
- Wrangler

## Project Structure

```text
.
├── src/
│   ├── index.ts
│   ├── html.ts
│   ├── note.ts
│   ├── response.ts
│   ├── storage.ts
│   └── types.ts
├── test/
│   ├── index.test.ts
│   └── note.test.ts
├── .github/workflows/
│   ├── test.yml
│   └── deploy-worker.yml
├── DEPLOY.md
├── package.json
├── tsconfig.json
└── wrangler.toml
```

## Requirements

- Node.js 22+
- npm
- Cloudflare account
- R2 bucket(s)

## Local Development

```bash
npm ci
npm run verify
npm run dev
```

## Available Scripts

```bash
npm run dev
npm run test
npm run typecheck
npm run deploy:dry-run
npm run verify
npm run deploy
```

## Behavior

### Routes

- `GET /` — open a blank note
- `GET /noteid/:id` — open an existing note
- `POST /` — create a new note
- `POST /noteid/:id` — update or delete an existing note
- `GET /favicon.ico` — favicon

### Save behavior

JSON request body:

```json
{
  "noteId": "ABCDE",
  "content": "hello"
}
```

Rules:

- note IDs are alphanumeric
- generated note IDs are 5 characters
- max note size is 256 KB
- empty content deletes the note
- curl GET returns raw note text
- curl POST returns the full note URL
- the app header links to the GitHub repository
- app version defaults to `vdev` and tag deploys replace it with the release tag

## Testing

```bash
npm run verify
```

This runs:

- TypeScript typecheck
- Vitest suite
- Wrangler deploy dry-run

## CI/CD

### Test workflow

`.github/workflows/test.yml` runs:

- `npm ci`
- `npm run typecheck`
- `npm run test`
- `npm run deploy:dry-run`

### Deploy workflow

`.github/workflows/deploy-worker.yml` uses `cloudflare/wrangler-action@v3` and deploys the Worker when you push a tag beginning with `v`, for example `v0.0.1`.

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Optional repository variable:

- `CLOUDFLARE_WORKER_NAME`

Release a deploy tag example:

```bash
git tag v0.0.1
git push origin v0.0.1
```

## Deployment

See [DEPLOY.md](./DEPLOY.md).

## Cloudflare setup commands

Create the default R2 buckets:

```bash
npx wrangler login
npx wrangler whoami
npx wrangler r2 bucket create note-prod
npx wrangler r2 bucket create note-preview
```

Set GitHub Actions secrets with GitHub CLI:

```bash
gh secret set CLOUDFLARE_API_TOKEN --body 'YOUR_CLOUDFLARE_API_TOKEN'
gh secret set CLOUDFLARE_ACCOUNT_ID --body 'YOUR_CLOUDFLARE_ACCOUNT_ID'
gh variable set CLOUDFLARE_WORKER_NAME --body 'note'
```
