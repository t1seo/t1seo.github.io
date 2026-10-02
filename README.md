# Taewon Seo — Seoul Studio

Live site: **https://t1seo.github.io/**

A quiet, illustrated room above the Han River, with a walnut desk facing Seoul,
warm shelves, changing weather and a small Maltese named Milky. The room fills
the viewport; its objects open the controls without a permanent navigation bar.

The current experience uses plain TypeScript, CSS and Vite. `src/entry.ts` loads
`src/penthouse-main.ts`; the earlier studio and its styles load only through the
explicit archive URLs below. [DESIGN.md](DESIGN.md) records the current visual
direction and the history of earlier iterations.

## Explore the room

| Object or panel | Interaction |
| --- | --- |
| Desk calendar | Atmosphere settings and up to five browser-local saved atmospheres |
| Digital clock | Local time and 25- or 50-minute focus sessions with pause, resume and cancel |
| Fountain pen | Public guestbook; the separate private desk note lives in **Desk** |
| Monitor and lamps | Independent switches; the monitor starts on, and off/on replays its editor typing |
| Desktop speaker | Play or pause music; **Atmosphere** contains independent music and rain controls |
| Coffee, diffuser and singing bowl | Brief steam, fragrance and resonance effects, with no object captions |
| Milky, red ball and cushion | Say hello, walk, play, or rest; drag the ball to invite a chase |
| Shelved photo album | Open **Milky’s Photo Album**, also available from the **Milky** panel |

Milky walks with four continuously animated painted legs: planted paws stay at
their floor contact while the body advances, with eased starts and stops. Run
and ball chases use a faster stepping rhythm. After a completed walk, the final
neutral pose stays still without switching to a different idle image. Her small
hop into the cushion retains its drawn airborne poses. The new walking artwork
loads as one complete three-part set, with the original sprites kept as a fallback.

The gait uses measured canine pose curves, separate wrist/ankle and paw joints,
weight transfer, and subtle neck/tail follow-through. Foot contacts remain fixed
while the limb pose adapts around them. See the [research and implementation
notes](asset-sources/milky-walk-kinematics/README.md) and [motion-data
credits](public/assets/cyberpunk/milky-grounded-walk/CREDITS.md).

With Milky focused, use the arrow keys to walk, **S** to sit and **N** to nap.
The Desk panel provides a close-up when room objects are cropped on a narrow
screen.

The warm charcoal settings drawer groups **Atmosphere**, **Desk**, **Milky**,
**Guestbook** and **About**. Controls are in English, support keyboard access,
and respect still mode and reduced motion. **Immerse** clears the controls from
the view.

## Milky’s little moments

Open **Milky → Little moments** for six quiet animations inspired by the album
photographs:

| Action | Moment |
| --- | --- |
| A curious little tilt | A small head tilt, a brief attentive pause, then a return to neutral |
| Stretch out and rest | Milky lies down with both front paws stretched out |
| A sleepy little peek | A drowsy head lift and a short look before settling back to sleep |
| Catch your breath | A gentle pant with a little tongue showing, sometimes also seen after completed play or a run |
| Rest your chin | Milky rests her chin on the cushion rim |
| A comfy little roll | A slow roll onto her back in the bed, then back onto her side |

Occasional variations also accompany greetings, quiet rests and naps. The two
bed moments are unavailable when the cushion is outside the visible room crop;
a wider window brings them back. All six controls are disabled while still mode
or reduced motion is enabled. Lying moments also wait until the required rest
poses are ready.

Their illustrated frame groups load only for a requested motion or an eligible
autonomous moment, with no more than two photo-frame decodes running at once
across groups. Each complete group is ready before it appears, and a failed load
leaves the existing Milky pose intact. See the
[motion implementation guide](docs/MILKY-PHOTO-MOTIONS.md) for registration and
lifecycle details.

## Fireworks and window credits

Choose **Atmosphere → Watch fireworks** for a one-minute festival over the Han
River, or **Stop fireworks** to end it early. Gold, champagne and muted rose
trails appear behind the window frames and room silhouettes, with soft water
reflections. Manual playback is available at every time of day while animation
is enabled and reduced motion is off. The previous procedural river boat has
been removed.

In the selected **Night** scene, a festival may also start after a random
**8–15 uninterrupted eligible minutes**. Settings, a loading or open album,
another festival, a hidden tab, still mode or reduced motion prevent an automatic
start. Returning to an eligible view begins a fresh full interval; missed time
never accumulates, and routine climate refreshes do not reset the countdown.
Automatic scheduling uses one cancellable timeout and the existing bounded
effects renderer. It does not change the weather, time or soundtrack.

A running festival ends after one minute, or immediately when the tab is hidden,
still mode is selected or reduced motion is enabled. The cinematic **TAEWON SEO**
window credit returns after 60 seconds without interaction. Settings, album
loading/viewing and fireworks suppress it and begin a fresh idle interval when
they end.

## Milky’s Photo Album

The linen-bound scrapbook holds 26 photographs, handwritten English notes and
small painted stickers. Its front cover reads **Milky**; a closing letter ends
with **Milky 2011-2026**, beside a contour-cut photograph and flower/heart details.
Page controls and keyboard navigation support both single-photo and spread views.

Opening the album starts or gently switches to Scott Buckley's **Childhood**.
Closing restores the previous room track, playback position and play state,
unless the visitor explicitly changed Play/Pause in the album. The recording is
reused from the existing local catalogue; attribution and its CC BY 4.0 license
are in the [music credits](public/assets/music/CREDITS.html#milky-album).

The viewer and photographs load only when needed, with bounded preparation of
the current and next spread. Published photographs are metadata-free WebP
derivatives with their original aspect ratios and native size limits. Source
photographs and private filenames are not published.

## Develop and deploy

Use Node.js 26 (see `.node-version`), then run:

```sh
npm ci
npm run dev
```

Check the code and preview a production build with:

```sh
npm test
npm run build
npm run preview
```

Each push to `main` runs the site tests/build and the guestbook Worker type and
protection tests in [.github/workflows/deploy.yml](.github/workflows/deploy.yml),
then publishes `dist/` to GitHub Pages. The repository's Pages source must be
**GitHub Actions**. Build outputs and `node_modules/` stay out of Git.

The Pages build receives the public `VITE_GUESTBOOK_API_URL` repository variable.
For another environment, copy `.env.example` to `.env.local` and configure its
public Worker URL before building. Keep Cloudflare credentials and Turnstile
secrets out of Vite variables. The Worker has its own authenticated deployment;
pushing this website does not deploy Worker changes. See the
[guestbook operator guide](workers/guestbook/README.md) for local setup,
migrations, checks and deployment commands.

## Local time and weather

Twenty aligned room paintings cover four seasons and five times of day, with
small seasonal shelf decorations. Rain, snow, haze, city lights and river glints
are clipped to the window and surrounding objects. Effects reduce their detail
under sustained rendering load; hidden tabs stop visual work. A failed room-art
request keeps the current view in place.

Auto starts enabled on every visit and follows each visitor's device timezone
immediately. The Atmosphere panel's
**Use my location** action asks for browser permission. With permission, the room follows the
location's timezone, northern/southern calendar seasons, sunrise/sunset, and
[Open-Meteo current conditions](https://open-meteo.com/en/docs). Weather updates
every 15 minutes while the page is visible. This is modeled current weather,
not a sensor measurement at the visitor's exact position.

Denied location or unavailable weather leaves the clock and room usable; the
Atmosphere panel explains the state and offers a retry. A manual time, season or
weather choice pauses Auto for the current visit. Re-enable Auto to resume, or
reload to return to automatic local time. Save a named atmosphere preset to reuse
a favorite manual scene.
Coordinates are rounded to two decimal places, sent only to Open-Meteo after
browser permission, and kept in memory only. Weather needs no API key or backend.

## Background music

Click **Play music** or the desktop speaker to start playback. Music and rain ambience continue
when switching browser tabs; returning to the studio does not restart the track.
Use **Pause music** or the speaker again to pause. The Atmosphere mixer controls
music and rain separately. Object sounds remain tied to the visible scene, and
ordinary site entry never starts audio automatically. Opening Milky's album is
the explicit gesture that starts its soundtrack.

## Public guestbook and private notes

The pen and Guestbook panel connect to the deployed **Cloudflare Worker + D1**
guestbook. Visitors leave a nickname and message without an account. Turnstile
is loaded when writing begins and verified on the server; durable posting
limits, duplicate detection and bounded input checks reduce spam. The static
website remains on GitHub Pages.

**Your desk note** is separate: its text and saved atmosphere presets remain in
the visitor's browser and are never uploaded to the guestbook. Deployment,
privacy, moderation and abuse-control details are documented in
[workers/guestbook/README.md](workers/guestbook/README.md).

## Artwork and preserved versions

Current room paintings live in `public/assets/penthouse/seoul/{season}/{time}.webp`;
object, album and seasonal accents live alongside them under
`public/assets/penthouse/`. Generated source art and prompts are preserved under
`asset-sources/seoul-studio/`, with earlier penthouse iterations retained in their
own source directories. Existing Milky character artwork is preserved.

- [Seoul Studio](https://t1seo.github.io/)
- [Current room composition and research](https://t1seo.github.io/design/research/penthouse-layout/report.html)
- [Objects and materials](https://t1seo.github.io/design/research/penthouse-objects/report.html)
- [First Noir restyle](https://t1seo.github.io/?interior=noir): remote backup
  `backup/noir-restyle-20260930` at `caef110`.
- [Original interior](https://t1seo.github.io/?interior=original): remote backup
  `backup/original-interior-20260930` at `924c42e`.

**About → Behind the room** links both archives and the design research. Style
selection preserves climate choices. The Vite build publishes the research
reports with the site; historical reports describe earlier versions.

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
is Taewon Seo's Seoul Studio. Keep all supplied asset credits and licenses.
