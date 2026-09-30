# Taewon Seo — After Hours · GitHub Pages

Live site: **https://t1seo.github.io/**

The 2026-09-30 Milky Studio delivery is imported into this repository. The active
entry point is `src/cyber-main.ts`; the original site design and assets are retained.

## Develop and deploy

Use Node.js 26 (see `.node-version`), then run:

```sh
npm ci
npm run dev
```

Validate changes with `npm test` and `npm run build`. Each push to `main` runs
these checks in `.github/workflows/deploy.yml`, then publishes `dist/` to GitHub
Pages. The repository's Pages source must be **GitHub Actions**. Build outputs and
`node_modules/` stay out of Git.

## Imported files

- `src/`, `public/`, and `asset-sources/`: original source and site assets.
- `assets/milky-latest-logos-20260930/`: all files extracted from the separately
  supplied latest-logo archive, including PNG, WebP, favicons, and manifest.
- `assets/milky-logo-archive/`: the full logo collection from the site delivery.
- `docs/delivery/`: the delivery's original instructions and SHA-256 manifest.
  Manifest paths describe the original ZIP layout: `project/` maps to this
  repository root, and `logos/` maps to `assets/milky-logo-archive/`.

The root `assets/` collections are source archives kept in Git. Runtime assets
are served from `public/`. The older [delivery documentation](docs/delivery/PROJECT-README.md) and the
preserved Jieun studio files describe earlier iterations; the deployed homepage
is Taewon Seo's Milky Studio. Keep all supplied asset credits and licenses.
