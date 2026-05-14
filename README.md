# Tech Stack Detector

Detect likely frameworks, CMSs, and analytics tooling from a public page.

## Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lindoai/tech-stack-detector)

## Features

- detects common frontend frameworks
- detects CMS/platform hints
- detects common analytics and tracking scripts
- returns simple JSON detections

## Local development

```bash
npm install
npm run dev
npm run typecheck
```

## Deploy

```bash
npm run deploy
```

## Production env

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## API

### GET `/api/detect?url=https://example.com`

Returns JSON detection results.
