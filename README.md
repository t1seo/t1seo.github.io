# Taewon Seo — After Hours · GitHub Pages

Live site: **https://t1seo.github.io/**

The default experience is **The Penthouse**, rebuilt from scratch on 2026-09-30.
`src/entry.ts` loads `src/penthouse-main.ts`. Only explicit archive URLs load the
earlier studio entry and styles. The imported project and logo archives remain in Git.

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

## Local time and weather

Auto follows each visitor's device timezone immediately. The Atmosphere panel's
**Use my location** action asks for browser permission. With permission, the room follows the
location's timezone, northern/southern calendar seasons, sunrise/sunset, and
[Open-Meteo current conditions](https://open-meteo.com/en/docs). Weather updates
every 15 minutes while the page is visible. This is modeled current weather,
not a sensor measurement at the visitor's exact position.

Denied location or unavailable weather leaves the clock and room usable; the
Atmosphere panel explains the state and offers a retry. A manual time, season or
weather choice pauses Auto and persists across visits. Re-enable Auto to resume.
Coordinates are rounded to two decimal places, sent only to Open-Meteo after
browser permission, and kept in memory only. No API key or backend is needed.

## Background music

Click Music or the turntable to start playback. Music and the rain ambience continue
when switching browser tabs; returning to the studio does not restart the track.
Use Music again to stop playback. Object sounds remain tied to the visible scene,
and opening the site never starts audio automatically.

## The Penthouse and backups

New architecture, new skyline, low black leather sectional, stone block table,
concealed storage and audio wall. Navigation, panels and weather geometry are new.
Milky's character sprites and behavior are preserved. The default page does not
import old room/city artwork, masks, desk effects or typography.

Three original plates supply day, sunset and night; morning/afternoon adapt daylight.
Seasons subtly tint the glass view and select music, without interior decorations.
Weather is clipped to the new windows. Failed art loading retains the current view.

- [New penthouse](https://t1seo.github.io/)
- [Detailed design research](https://t1seo.github.io/design/research/penthouse-rebuild/report.html)
- [First Noir restyle](https://t1seo.github.io/?interior=noir): remote backup
  `backup/noir-restyle-20260930` at `caef110`.
- [Original interior](https://t1seo.github.io/?interior=original): remote backup
  `backup/original-interior-20260930` at `924c42e`.

The residence panel links both archives. Style selection preserves climate choices.
Raw new art/prompts: `asset-sources/penthouse/`. Runtime: `public/assets/penthouse/`.
Research: `design/research/penthouse-rebuild/`; the Vite build publishes it with
the site. Studio sync is pending because this personal project is not connected.

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
