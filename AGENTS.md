# Agent Guidelines for Note App

## Project Overview

A lightweight note-taking web app built for **Cloudflare Workers** with **R2** storage.

## Architecture

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Storage**: R2 bucket binding (`NOTES_BUCKET`)
- **Frontend**: Plain HTML/CSS/JS rendered by the Worker
- **No frontend framework**

## Key Files

| File | Purpose |
|---|---|
| `src/index.ts` | Worker entrypoint, routing, GET/POST handlers |
| `src/html.ts` | Full HTML document template |
| `src/storage.ts` | R2 storage helpers |
| `src/note.ts` | Note ID generation/validation and escaping helpers |
| `src/response.ts` | Response helper functions |
| `wrangler.toml` | Worker and R2 binding config |
| `test/*.test.ts` | Unit/integration tests |

## Important Conventions

1. Keep the app **framework-free**.
2. Keep the UI **vanilla HTML/CSS/JS**.
3. Escape dynamic content before inserting into HTML.
4. Preserve the route format: `/noteid/:id`.
5. Tests must pass before finishing work.
6. Default deployment target is **workers.dev**.

## Local Development

```bash
npm ci
npm run verify
npm run dev
```

## Testing

```bash
npm run verify
```
