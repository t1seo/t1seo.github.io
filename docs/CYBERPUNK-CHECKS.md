# Cyberpunk studio checks — 2026-09-30

## Current revision: a living companion, white Milky identity, and complete delivery

- The selected **A white-ear logo** is now the actual studio/header identity and 64×64 PNG favicon, with a 180×180 Apple Touch icon. B/C now use neutral white paper fur. Original B/C assets remain byte-identical. The standalone logo ZIP contains 13 files (10 image files plus offline preview, README and manifest), 5,763,788 bytes. All three variants remain individually downloadable; former direct/Logopia studies are preserved.
- The name reveals in a finite ~1.94-second sequence, with a restrained caret and delayed copy. Its complete layout is reserved from the start; screen readers retain one stable heading. Background-click dismissal and 45-second idle return remain. Loading, dialog and tab lifecycle is connected; returning to a tab preserves a completed name. Six controller tests and an independent integrated fake-DOM/clock review passed.
- Outdoor detail includes 44 independently paced lit windows, three-depth rain/snow, eight glass trails and flowing river glints. The effect stays behind measured furniture and the union of **actually mounted** seasonal plates, including Christmas decor while it fades out. Failed/stale image changes retain the correct visible-layer mask. Effects retain their 30fps cap, reduced-motion and hidden/dialog pause handling.
- Actual Claude **Fable 5** in Herdr authored the pet behavior/controller and review fixes: rest commits `10a22cc`/`176967c`; activity work `2e45a59`, `a6bd9b8`, `633df91`, `90e2f28`, `3b3319a`. Root integrated these and registered the final art. No Orca was used.
- Milky now sits, lies down, naps, eats from a stable bowl, plays with a rolling/bouncing ball, and performs short diagonal trots. The Desk panel exposes all six actions on desktop and mobile. Passive wandering/rest/play stays quiet and user greetings remain explicit. Walks use nine atomically loaded forward-gaze assets; resting sometimes looks toward the viewer. Food/toy poses look toward their targets. Brisk movement uses a separately authored four-frame diagonal trot; its common +28 native Y shift preserves airborne clearances rather than forcing every frame onto the ground.
- Root verified **22 new pet/prop assets, 2,556,056 bytes** against all delivered SHA-256 values: correct dimensions, RGBA decoding with genuine zero-alpha backgrounds, HTTP 200/image-webp and byte-identical served content. Root inspected representative forward, all activity, and all trot artwork. Independent static art reviews checked pose/anatomy and rejected misaligned heads, incorrect diagonal phases and an alpha haze before delivery.
- Independent actual-source review passed **11 activity scenarios**, **9 trot scenarios**, **36/36 actual-alpha meal cases**, and **36/36 actual-alpha ball contact cases**. It caught and drove fixes for low-framerate perpetual bouncing, early bowl removal, reduced-motion bowl reach, portrait prop scale, a bowl covering the face, and stale second-round ball contact. The old meal depth order fails the negative-control test in all 18 lowered-face cases. Final activity source was reviewed at Fable `3b3319a` / integration `ac6534c`. The later publication flag and shared trot Y registration received a separate local review and 2/2 focused checks.
- Final integration: **131/131 repository tests**, strict TypeScript and Vite production build passed. Build: 31 modules, 36.22 KB CSS and 88.60 KB JavaScript before compression. The shipped-asset test additionally checks that every default-requested image actually exists; the trot test checks measured floor registration and equal per-frame translation.
- Chrome/axe scans: studio 1440×900 and 320×740 returned **0 violations, 20 passes, 2 incomplete**. Logo gallery 320×740 and 1440×1000 returned **0 violations, 23 passes, 1–2 incomplete**. These automated checks are not complete accessibility or visual playback verification.
- Full source, fresh production `dist/`, standalone logos, active icons, licenses and beginner instructions are packaged by `scripts/package-studio.py` only from an explicit clean commit. Its manifest records source SHA and every payload hash. The script rereads the ZIP and verifies entry names, CRC, exact bytes and hashes. See `DELIVERY.md` for the fresh-extraction process; the final archive's manifest identifies the delivered revision.

### Remaining visual limits

These are photo-derived 2.5D sprite motions. Small generated face/body differences remain between walk frames; the forward set records a 19.01×15.77 source-pixel nose range and about 24 source-pixel torso range. Direction changes use a pause and mirror rather than new turning-body footage. The four-frame run is a light diagonal trot, not a full gallop or motion capture.

Native Chrome was retried through CUA, but its inventory was empty and reported `Browser is not available: chrome` / `Sky Computer Use service startup request failed`. **Continuous animation and final click feel were not manually checked in Chrome.** No Safari or alternate browser-control workaround was used. Geometric checks use final sprite alpha plus actual controller transforms and CSS depth; they do not establish live visual smoothness.

See `CINEMATIC-NAME.md`, `CITY-WEATHER-DETAIL.md`, `SCENE-WEATHER-SYNC.md`, `MILKY-FABLE-REST.md`, `MILKY-FABLE-ACTIVITY.md`, `MILKY-ACTIVITY-ART.md`, `MILKY-FORWARD-ART.md`, `MILKY-TROT-ART.md`, `MILKY-WHITE-EARS.md`, `MILKY-WHITE-BC.md`, and `MILKY-LOGO-PACK.md`.

---

## Previous revision: smiling Milky and actual Claude Fable 5 animation

- The user completed the requested Claude login. Root verified the actual installed Claude CLI session in Herdr agent `milky-fable`, pane `wB:p2`, running **Fable 5 with high effort** (`--model claude-fable-5`). The dedicated worktree was `milky-fable-smile`. Safe mode kept unrelated local hooks/plugins out of this task; no Orca was used. Fable authored the controller/motion/idle-life changes, tests and documentation in commits `87d4946` and `698e121` (integrated as `3f90428` and `e8c2584`).
- New art is based on the supplied happy `20150817_211702.JPG`: bright dark eyes, small black nose, an open smiling mouth, short floppy ears and a curled white tail. Ten delivered RGBA WebPs include idle, blink and eight independent gait poses, totaling **1,070,746 bytes**. Root verified all hashes against metadata, image decoding/dimensions, six transparent sample points per file, HTTP 200/image-webp delivery, and byte equality in the production dist. Private source photos are not included in public assets.
- Fable added smooth acceleration/deceleration, distance-driven gait phase, bounded stride fitting toward the standing-like stop phase, varied rest timing and occasional/double blinks. Compatible repeated input preserves momentum. Nine required v4 images must decode before the dog becomes visible/interactive; failure falls back by complete identity tier. Only the delivered blink optional pose is requested. Attend/sniff behavior is implemented but not shipped or requested.
- Read-only independent review reproduced and resolved three issues: early v4 display/decode acceptance, missing fallback for malformed images, and a 12.68% speed drop on compatible retargeting. The final actual-source lifecycle harness passed **9/9** scenarios in the integration worktree; the numerical momentum regression now has **0% drop**. This includes rapid mixed input, hidden/reduced-motion cleanup, floor loss/restoration, late decode after disposal, and no passive greeting events.
- Root's final integration run: **75/75 repository tests**, strict TypeScript check and Vite production build passed. Build: 27 modules, 32.25 KB CSS and 68.87 KB JavaScript before compression. A later source change only finalized explanatory comments; runtime behavior was unchanged.
- New logo gallery at `/milky-logo-options.html` presents **three smiling-photo candidates**, 512×512 transparent WebPs totaling 111,886 bytes. Root inspected all three. The light/dark backgrounds, 16/32/48 CSS-pixel samples, comparison and local selection remain. A separate storage key prevents a previous letter choice from selecting a different new mark. The former direct/Logopia six-option page remains at `/milky-logo-options-archive.html`. The live studio logo/favicon have not been changed pending the user's choice.
- Gallery JavaScript syntax and local links/assets passed. HeadlessChrome 154 / axe-core 4.13 scans at **320×740 and 1440×1000** returned **0 violations, 23 passes, 1 incomplete**. Integrated studio scans at **320×740 and 1440×900** returned **0 violations, 20 passes, 2 incomplete**. Automated scans are not visual playback verification.

### Remaining visual limits

- The generated walking frames approximate the reviewed four-leg poses but do not preserve pixels exactly. Delivered nose landmarks vary **20.35 px horizontally and 7.28 px vertically in 768×512 source space**; support-paw height also varies about 20 source pixels (roughly a few pixels at room display scale). Body-distorting edits were rejected. The common body/floor transform deliberately avoids shifting the entire torso and stance feet to chase the redrawn nose. The metadata records these residual differences rather than claiming perfect registration.
- A direction change still uses a pause followed by mirroring, not separate turning-body footage. These are photo-based 2.5D sprite animations, not motion capture.
- Native Chrome was retried through both the browser and app entry points: `Browser is not available: chrome` and `Sky Computer Use service startup request failed`. Continuous animation, final visual composition and click feel were **not** manually verified in Chrome this revision. No Safari or alternate browser-control workaround was used. The original Jieun working tree remains clean at `adb2ffd`.

See [MILKY-FABLE-SMILE.md](MILKY-FABLE-SMILE.md), [MILKY-SMILE-ART.md](MILKY-SMILE-ART.md), [milky-v4-registration.json](milky-v4-registration.json), and [MILKY-SMILE-LOGOS.md](MILKY-SMILE-LOGOS.md).

---

## Previous revision: photo-based Milky, raised desk and selectable logo studies

- Milky now uses the established photo-derived idle and **eight independent 768×512 walking frames**, informed by the supplied photographs, including the seven added references. The new runtime no longer loads the rejected v2 behavior or front-walk artwork. Separate pose generation corrected the previously fixed hind legs; independent image review tracked both hind paws through stance and recovery and checked alternating front contacts across the loop.
- Root inspected the original photo-style idle, key poses and final corrected frames. Measured body/face registration is kept common across frames; frame-specific foot bounds do not move the whole dog up and down. The first walking pose matches the idle hind-paw position. Two real background-alpha halos and a front-foot forward jump at the loop boundary were caught and corrected before integration.
- Final gait exports total **633,642 bytes**. Root checked all eight SHA-256 values against the delivered metadata, RGBA decoding at 768×512, zero alpha at the previously faulty halo sample, and HTTP 200 with `image/webp` after integration.
- Travel follows distance-driven gait at a measured stride of 0.64 body lengths per cycle. Clicking selects a varied safe floor destination; after entering the room, passive wandering uses 9–18 second rest intervals, varied distance and shallow diagonals. It pauses for hidden tabs, dialogs, keyboard focus and reduced motion, and does not emit user greetings or reset the introduction during automatic walks. All eight poses must decode successfully before movement is enabled.
- Motion verification includes an independent rerun of **21 pet-related tests**. Visual limits remain: a direction change is a still pause followed by mirroring; there are no separate rotating-body or feet-gathering stop poses. These are improved photo-based sprite walks, not motion-captured three-dimensional locomotion. Native Chrome continuous playback remains unverified because the computer-use service is unavailable.

- All 20 seasonal/time plates use the raised desk master. The thin slab and every desktop item move upward together; legs extend while floor contacts, room camera and chair stay in place. Workers inspected all 20 final plates and root inspected the master plus one final plate per season. Independent gradient registration compared 9 equipment regions per plate (180 regions), with maximum axis displacement of 1 px relative to the approved master.
- Root decoded and fetched all 20 final WebPs: 1672×941, HTTP 200, `image/webp`; combined size **10,136,374 bytes**.
- `cyber-desk-layout.ts` centralizes measured object, screen, light and click coordinates. Outdoor canvas effects are cleared behind each foreground silhouette separately, so overlapping furniture masks do not reopen holes. Read-only integration review caught missing monitor-stand, small brass-container and plant-leaf masks; those are now included. Obsolete monitor/lamp cutouts were removed from the window outline. Foliage polygons approximate the major leaves, not a per-pixel alpha mask of every seasonal twig.
- `/milky-logo-options.html` presents **six optional candidates**: three original image-generation concepts and three produced through Logopia's actual helper workflow. All six are 512×512 transparent WebPs; the latter also include full-resolution generated PNG originals. Root inspected the delivered images. The page offers light/dark backgrounds, actual 16/32/48 CSS-pixel samples, up to two side-by-side comparisons, local selection persistence and a copyable selection code. The actual studio logo/favicon remain unchanged pending the user's choice. No private reference photos are bundled.
- The gallery worker verified all six local images over HTTP, JS syntax, local references and alpha. Final gallery Chrome/axe scans at **320×740 and 1440×1000** returned **0 violations, 22 passes, 1 incomplete/manual item**. Root's post-layout studio scan at **390×844** returned **0 violations, 20 passes, 2 incomplete/manual items**.
- After Milky integration, root repeated studio Chrome/axe scans at **1440×900 and 320×740**: both **0 violations, 20 passes, 2 incomplete/manual items**.
- Final integration checks: **60 tests passed** and strict TypeScript/Vite build passed (26 modules, 31.91 KB CSS and 65.89 KB JS before compression). The original Jieun working tree remains clean.
- Native Chrome access was retried: `Browser is not available: chrome` and `Sky Computer Use service startup request failed`. These results do not establish visual or audible browser verification. The local gallery URL was provided to the user; no Safari was used.

See [MILKY-PHOTO-GAIT.md](MILKY-PHOTO-GAIT.md), [MILKY-ROAM.md](MILKY-ROAM.md),
[DESK-HEIGHT.md](DESK-HEIGHT.md), [LOGO-DIRECT-OPTIONS.md](LOGO-DIRECT-OPTIONS.md),
[LOGO-LOGOPIA-OPTIONS.md](LOGO-LOGOPIA-OPTIONS.md), and [LOGO-GALLERY.md](LOGO-GALLERY.md).

---

## Previous revision: video Milky, furnished desk and music

- All 20 scene plates now share the thin walnut desktop, visible legs, graphite Aeron-inspired mesh chair, ivory HHKB-style keyboard, aluminum display, linen/walnut speakers and black/gold fountain pen. Workers inspected every output; root inspected the master and selected final plates. All 20 decode at 1672×941 and return HTTP 200. Combined scene size: 8,324,782 bytes.
- Four new Milky RGBA WebP assets are based on the supplied private walking video and photographs: six behavior cells (1881×836), eight side steps and eight front steps (each 2172×724), and a 1536×1024 neutral pose. Alpha has real zero-opacity backgrounds. White/red RGB blocks visible in one image viewer were sampled and confirmed to have alpha 0; they are not opaque image pixels. The behavior sheet's frame 0 is used at rest to avoid changing body size at the first interaction. Per-frame registration aligns paws and body centers.
- Milky locomotion uses distance-driven gait, short anticipation, gentle acceleration, stopping/sniffing and a frontal approach. Left-facing idle/behavior remain mirrored after leftward travel. The private video and photos are not copied to public assets.
- Climate-selected music uses 20 existing licensed recordings across 100 environment selections. Catalogue tests require changes to actual recordings for every weather/time/season change at fixed other fields. Playback is opt-in and downloads only selected tracks. On-page credits and playing title/artist are linked. Bowl/cup sound is a separate explicit gesture; the music button does not accidentally enable it.
- New desk effects are registered to actual bowl/cup/speaker positions. No moving image rectangles or duplicate cups are used. Pen opens a local-storage notebook. Both speakers toggle the same player.
- Building-window lights, bridge traffic, river reflections and indoor reflected light move gently, with a 30fps cap and reduced-motion/hidden-tab handling.
- `npm test`: **53 passed**. New tests cover music catalogue and asynchronous audio lifecycle, registered city motion, pet distance/gait and controller cleanup. Strict TypeScript/Vite build passes with 24 modules, about 33 KB CSS and 61 KB JS before compression.
- Chrome 154 / axe-core 4.13 automated scans: **0 violations, 20 passes, 2 incomplete/manual-review items** at 1440×900 and 390×844 after interaction integration, and at 320×740 after final logo integration. These are automated accessibility scans, not visual or audible verification.
- Logopia's actual local helper workflow produced the selected original Milky mark and favicon. The 256px transparent header WebP (5,408 bytes) and 64px opaque favicon PNG (4,031 bytes) decode correctly in both `public` and the final `dist`, and return HTTP 200. Root inspected both delivered images. Source PNG, exact prompts and verified helper exports are preserved; no private source photograph or video is bundled.
- Independent read-only integration review found a real overlap: the notebook hotspot covered the bottom of the singing bowl. Bowl now has higher stacking priority so that region strikes the bowl. No other blocking integration error was found in the source review.
- Parallel scoped worktrees covered art, pet motion, climate music, city animation, desk effects, four seasonal sets and Logopia branding. Each worker committed only assigned files; root cherry-picked commits and owns final integration. The original Jieun working tree is preserved.

### Verification limitation for this revision

Native `cua.getState()` returned empty apps/browsers and `Sky Computer Use service startup request failed`. Therefore the final composited room, sprite transitions, object animation and audible loudness could not be manually checked in Chrome. No Safari or alternate browser was used. Source tests, image inspection and the Chrome accessibility tool are the evidence available; they do not establish a complete visual/audio QA pass.

See [DESK-MASTER.md](DESK-MASTER.md), [CYBER-MUSIC.md](CYBER-MUSIC.md),
[DESK-EFFECTS.md](DESK-EFFECTS.md) and [LOGOPIA-MILKY.md](LOGOPIA-MILKY.md)
for prompts, source attribution and module-specific checks.

---

## Previous revision: climate and Milky

- 20 locally hosted 1672×941 WebP scenes: 4 seasons × morning/noon/afternoon/evening/night. All decoded, matched expected dimensions and returned HTTP 200 with `image/webp`. Total seasonal art is 8,364,264 bytes; scenes are loaded on selection rather than preloading all 20.
- Spring and summer change flowers, plants, cushions and artwork. Autumn adds dried branches, pumpkins and knit textiles. Winter adds a decorated tree, gifts, wreath and winter textiles. Time variants change the sky, city lights, room illumination and reflections.
- Five independently selected weather states: clear/cloudy/rain/snow/mist. Canvas precipitation stays inside the window polygon; mullions and the monitor are masked. Indoor reflected light changes separately. Automatic season/time follows Asia/Seoul; weather is not fetched from a forecast service.
- Milky's three generated alpha assets were inspected against the supplied photographs. Rest/awake are 1536×1024; the six-frame walk sheet is 1881×836 with 627×418 cells. Alpha minimum is 0 and maximum is 254 for the poses, 255 for the sheet. A check initially assumed an exact maximum of 255 for every file; inspection confirmed the 254 maximum is valid near-opaque art, not a missing alpha channel. The private source photographs are not bundled.
- Strict TypeScript/Vite production build passes: 18 modules, about 27 KB CSS and 38 KB JavaScript before compression. No runtime Three.js import.
- `npm test`: **25 passed** — 9 preserved environment tests, 7 new climate tests, 5 Milky geometry/motion tests, 4 asynchronous scene-loading tests.
- The scene loader ignores superseded requests, keeps the visible picture during decoding, retains it on errors, deduplicates pending downloads and prevents late updates after disposal.
- Worker actual-source lifecycle harnesses passed for all 100 climate combinations, canvas clipping, RAF pause/resume, reduced motion, DPR limits, cleanup; and for Milky frame advancement, travel, settling, hidden/inactive/reduced-motion behavior, image failure and disposal. These are mocked runtime checks, not browser visual checks.
- Independent integration review found an ultrawide crop could lift Milky onto the desk. Fixed: Milky is hidden when the floor is outside the viewport, and returns when a normal aspect ratio is restored. A separate compact-phone regression preserves Milky at 320×568 above the footer. Normal portrait floor clearance and desktop furniture bounds are unit-tested.
- Chrome 154 / axe-core 4.13 automated scans passed with **0 violations, 19 passes, 2 incomplete manual-review items** at 1440×900 and 320×740 after asset integration. A 390×844 scan also passed during integration. This is not a claim of complete accessibility.

### Current verification limitation

Native Chrome visual/interaction verification could not run in this revision. `cua.getApp('com.google.Chrome')` repeatedly returned `Sky Computer Use service startup request failed`; reconnect/reset did not recover it, and the browser provider returned `Browser is not available: chrome`. Safari or a different browser was not used. The new art files were visually inspected, but the final composed UI, lamp overlay, controls and Milky's gait still need a human Chrome visual pass. The prior native Chrome results below apply only to the previous version.

### Parallel work and sources

Worktrees: `cyber-climate`, `cyber-weather`, `milky-motion`, `cyber-spring-summer`, `cyber-autumn-winter`, integrated in `cyberpunk-studio` with a separate read-only review. Original Jieun worktree remains unchanged. Art was made with built-in image generation; prompt sets and generation provenance live in `public/assets/cyberpunk/climate/SPRING-SUMMER.md`, `AUTUMN-WINTER.md`, and `public/assets/cyberpunk/MILKY.md`.

---

## Previous revision record (before climate and Milky)

## Scope and isolation

- New personal page: Taewon Seo — After Hours.
- Integration branch: `concept/cyberpunk-studio` in `landingpage-worktrees/cyberpunk-studio`.
- Separate worker worktrees: `cyber-atmosphere`, `cyber-terminal`, `cyber-sound`.
- Original `/Users/cillian/Downloads/landingpage`, branch `redesign/paper-studio`, remains at `adb2ffd` and was not modified.
- No Slack messages, uploads, or deployment in this task.

## Verified

- TypeScript strict check and Vite production build pass. Final active bundle approximately 21 KB CSS / 25 KB JS before compression, with no runtime third-party UI or 3D dependency.
- Existing project tests: 9 passed (these cover preserved paper environment behavior, not new cyberpunk interactions).
- Worker terminal lifecycle harness: click-only start, finite completion, snippet rotation, hidden/inactive pause/resume, reduced motion, cleanup.
- Worker atmosphere harness: 13 lifecycle checks and 60/120Hz travel equivalence, reduced motion, hidden pause, polygon update, rain toggle, cleanup.
- Worker audio mock checks: silent creation, synchronous user-gesture resume, rapid toggles, hidden/return behavior, resume failure, node teardown.
- Read-only integration review found and led to fixes for sound choice vs temporary suspension and mobile offscreen hot spots. User preference is now read through `isEnabled()`. Narrow screens expose a desk panel, offscreen physical hotspots leave the tab order, and the portrait crop retains the monitor.
- Re-review verified the sound fix with 4 actual-source mock scenarios. Compact mobile icon controls prevent overflow at 320px; changing from the desk menu to the notebook explicitly focuses the new heading while preserving the original dialog trigger.
- Axe-core 4.13 using installed Google Chrome: 0 violations at 1440×900, 390×844 and final 320×740; each 18 passes and 2 incomplete/manual-review items. Automated checks do not establish complete accessibility.
- Generated lamp-on and lamp-off room assets were visually inspected. Matching dimensions: 1672×941. All actual font and image assets are hosted locally.

## Final native Chrome checks

Initial Chrome capture access was intermittent. Reconnecting the app and selecting the correct preview tab restored native screenshots and AX inspection. Safari was not used.

- Desktop rendered room/title/monitor registration visually inspected in Chrome. Intro becomes hidden when an object is clicked. Lamp off changed both the lamp and the nearby pool of light in the first plate iteration; the modern replacement uses the same registered layout and crossfade.
- Notebook was opened through the actual object; native dialog heading/content and focused Close button verified. Its dialog closing/return-focus implementation is unchanged in the modern revision.
- Latest direction implemented: 2.5D painterly materials, modern Korean-style river/bridge/apartment skyline, no sci-fi megatowers or floating traffic. Both updated plates visually inspected.
- White Maltese is composited on the floor in a separate alpha layer. Actual dog click verified in native Chrome: eyes open/head lifts, live message emitted, intro hides. Rest and alert sources have true alpha and matching canvases.
- Native Chrome iframe previews at 320×650 and 390×650 found an overlap between the pet and bottom controls. Fixed portrait pet placement/size and visually rechecked: pet remains fully above the control strip. Temporary QA preview was removed after inspection.
- Final automated Chrome accessibility scan after modern/Maltese changes at 390×844: zero violations, 18 passes, 2 incomplete manual-review items.

The audio state/lifecycle is mock-tested; actual audible sound quality was not listened to in this session. The entire 45-second idle interval and every optional object combination were not manually exercised.
