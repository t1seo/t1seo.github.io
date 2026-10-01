# Living room delights

## Scope and decisions

Implement all eight accepted suggestions plus adaptive performance in the existing illustrated Seoul room. Keep the full-screen composition, current room plates, registered object positions, corrected Milky head proportions, one painted red ball, and the unobstructed lounge chair. No new labels or narrative toasts in the scene. Settings remain English, keyboard accessible, and available through the existing objects/dialog. The user already authorized implementation, scoped commits, main integration, push, and deployment; no further approval gate is required.

This is a brownfield change using plain TypeScript, CSS and the existing Node test runner. Root owns main/dialog integration and documentation; focus, storage, pet, sound and effects workers own their assigned modules. Workers are not alone in this shared codebase and must not revert each other's work. No package additions, full plate regeneration, new character art, or permanent animation loops for inactive features.

The `omo:ulw-plan` skill was read. Its Metis role was unavailable; a read-only default agent performed the same gap analysis. Critical findings: rain currently depends on music playback, every local clock update rewrites the clock display, and timer sound must be unlocked by the Start gesture. Clear-day scenes sleep entirely, so a boat requires a bounded wake scheduler; presets require atomic climate application to avoid redundant art/music changes. Existing hidden/still/reduced-motion and cleanup contracts must continue to hold.

## References

- `src/penthouse-main.ts`: scene mount, English native dialog, root event delegation, climate/workspace coordination and teardown.
- `src/penthouse-time-objects.ts`: `roomTimeObjectsMarkup`, `updateRoomTimeObjects`; all main/Desk-preview clock copies update together.
- `src/penthouse-singing-bowl.ts`: `SingingBowl`, `createSingingBowlSound`; short gesture sound closes its AudioContext afterward.
- `src/cyber-climate.ts`: `ClimateState`, enumerations, `createCyberClimate`; manual choices pause Auto, malformed/unavailable storage is tolerated, location stays in memory.
- `src/cyber-sound.ts`, `src/cyber-sound.test.ts`: local music decks, crossfade, asynchronous failure protection, rain generation and audio lifecycle.
- `src/cyber-pet.ts`, `src/cyber-pet-toy.ts`, `src/cyber-pet-activity.ts`, `src/cyber-pet-bed.ts`, `src/cyber-pet-rest.ts`: persistent toy, registered floor coordinates, real gait/ball physics, bed/wake stages and cancellation.
- `src/cyber-pet-test-support.ts`, `src/cyber-pet-toy-lifecycle.test.ts`: controller fixtures and exact scheduling assertions.
- `src/penthouse-effects.ts`, `src/penthouse-atmosphere.ts`, `src/penthouse-room-life.ts`: existing bounded compositor, glass panes/occluders, river region y433–495, finite object effects and weather simulation.
- `src/penthouse-effects-test-support.ts`, `src/penthouse-atmosphere.test.ts`, `src/penthouse-room-life.test.ts`: drawing/simulation/lifecycle fixtures.
- `src/penthouse-objects.ts`, `src/penthouse.css`, `src/penthouse-time-objects.css`: cached lighting and overlay shading/contact registration.
- `.github/workflows/deploy.yml`: main pushes run tests/build and deploy `dist` to GitHub Pages.

## Execution and ownership

| Task | Owner | Dependency |
|---|---|---|
| 1. Object light/contact polish | Effects worker; root integrates DOM CSS | Existing geometry |
| 2. Milky transition polish | Pet worker | Existing registered poses |
| 3. Drag ball | Pet worker | Task 2 cancellation contract |
| 4. Rare river boat | Effects worker | Existing compositor |
| 5. Focus clock | Focus worker; root UI | Bowl gesture unlock and clock display contract |
| 6. Pen memo | Storage worker; root UI | Existing dialog |
| 7. Independent sound mixer | Sound worker; root UI | Stable sound API |
| 8. Saved atmosphere presets | Storage worker; root UI | Task 7 mixer API |
| 9. Adaptive rendering | Effects worker | Tasks 1 and 4 |
| 10. Integration/release | Root | All tasks |

Tasks 1–4, 5–6 and 7 run in parallel in their respective ownership areas. Root alone edits `penthouse-main.ts` and shared documentation; workers report explicit API changes before integration. Implementation and meaningful behavioral tests belong to the same scoped commit.

## Work and acceptance scenarios

- [x] **1. Unify object contact and light.** Refine bed, ball and calendar's subtle contact shadows and existing day/evening/night color response. Reuse original painted assets, anchors and footprint. The two lamps should influence nearby surfaces/objects without a room-wide filter or new expensive per-frame blur. Prefer cached textures or static CSS gradients. Do not add a second ball shadow or visible rectangular sprite edges.
  - Accept: daylight and night close-ups show objects resting on floor/desk, with no floating edge, dark halo or changed Milky proportions. Desk lamp off/on affects only its local region; front-lip bed masking remains aligned while Milky sleeps.
  - QA: official Codex Computer Use in Chrome, capture daylight/night and both lamps off/on; inspect bed, ball and calendar. Edge: portrait crop and reduced motion retain legible clock/calendar and their hit targets. Evidence: visual screenshots plus the worker's registered coordinates. Commit scoped object/CSS/effects files only.

- [x] **2. Smooth Milky's stop and wake transitions.** Reuse existing registered turn/attend/wake/play-bow poses for a short glance after a walk and a brief stretch when leaving bed. Preserve the real gait and original character files. New transitions must be finite, use existing scheduling/cancellation, and yield promptly to explicit commands. Missing optional artwork falls back to idle/wake without delay or invisible dog.
  - Accept: a walk ends in a brief registered glance before idle; waking from bed visibly stretches then reaches the floor using existing bed flow. No jump in head/body size or contact point. Hidden, inactive, cropped or reduced-motion states do not leave a scheduled transition.
  - QA: controller tests with fake time cover walk completion, bed wake, interrupted transition, missing pose, reduced motion, hide and destroy; Chrome observes a walk-to-stop and bed-to-play. Commit pet-owned modules and tests only.

- [x] **3. Roll the red ball by dragging.** Extend the one existing ball hit target with pointer capture, opted into through the tenth pet argument `{ ballHome, drag: true, transitions: true }`; preserve legacy rooms when omitted. A short click retains existing play behavior; movement above a small fixed threshold becomes a drag. Map viewport coordinates through the room rect and clamp to reachable floor bounds. On release, direction and drag distance select a bounded roll impulse using existing physics. Milky turns, watches/approaches, and chases using genuine gait. Keep Enter/Space play accessible; suppress only the synthetic click following a completed drag.
  - Accept: a longer drag in the same direction travels farther than a shorter one, neither escapes floor bounds, only one ball exists, and simulation returns to no active RAF at rest.
  - QA: unit/controller tests compare short/long drag displacement, both directions, room scaling, pointercancel/lost capture, release outside target, second pointer, crop/resize, hidden/reduced/destroy, and click/Enter/Space behavior. Chrome performs short/long throws and a bed wake chase. Commit pet/toy/physics files and tests only.

- [x] **4. Add a rare Han River boat.** Paint a small muted boat through the existing effects canvas, at a registered river height within y433–495. Reuse pane and foreground occlusion masks. A slow finite passage includes a restrained warm segmented reflection at evening/night; no daylight glow. Keep one boat at most with a quiet randomized gap of roughly one to three minutes. Use one lifecycle-aware next-passage timeout to wake sleeping clear-day scenes, then advance a finite voyage through the existing RAF and return to sleep. Cancel the timeout while hidden/still/reduced/destroyed; hidden time must not advance the voyage or accumulate passages.
  - Accept: no boat/light appears over window mullions, the monitor, lamp or room furniture. Boat has the room's small painted scale; its reflection stays below the hull and within the river. Still/reduced mode has no moving boat.
  - QA: seeded simulation/draw tests advance through spawn, traversal and expiry; prove one boat, clipping, night-only reflection, no hidden catch-up and deterministic teardown. Chrome captures a passage with daylight and night presets. Commit effects/boat modules and tests only.

- [x] **5. Add the clock focus timer.** Clock opens an English Focus panel with 25/50-minute choices and Start, Pause/Resume and Cancel. Use timer-specific action/state names because the existing `focus` action means Immerse. The desk clock and Desk preview display `MM:SS` while running/paused and resume local time on completion/cancel. Keep calendar/date updates intact. Use an absolute deadline rather than counting interval callbacks; refresh at most once per second while visible, reconcile elapsed time on return. Starting explicitly primes the completion sound; finish once with the existing bowl visual and a quiet bowl sound when the browser permits it. If it ends while hidden, surface completion once on return. No unexpected sound on reload or replay after hide/show.
  - Accept: pause holds the same remaining time, resume preserves it, restart replaces the old run, exact deadline completes once, both clock copies agree and are not overwritten by climate/local-info refresh. Completion/restored-state audio failure is harmless; all timers are disposed.
  - QA: fake-clock tests cover 25/50, pause/resume/cancel, hidden deadline, local clock update, stale completion, zero/invalid restored data and destroy. Chrome starts, pauses, resumes and cancels from clock using pointer and keyboard; use injected controller time in tests for completion rather than waiting 25 minutes. Commit focus/time-object/root integration files and tests.

- [x] **6. Add a local pen memo.** Fountain pen opens an English note panel with a labelled textarea, up to 2,000 characters, saved in this browser. Preserve access to Desk via panel navigation. Save plain text through a small versioned storage controller and restore on reopen/reload; show saved/unavailable status only inside the panel. Do not use `innerHTML` for user content or send note content over the network.
  - Accept: multiline Korean/English text survives close/reopen and reload, markup displays as text, and full/blocked/malformed localStorage keeps editing functional with an honest in-panel status. Dialog close returns focus to the pen or a visible fallback.
  - QA: storage/controller tests use multiline text, `<img src=x onerror=...>`, exactly 2,000 characters, oversized/malformed data and throwing storage. Chrome types/reopens/reloads a short note and checks keyboard close/focus. Commit note/root integration files and tests.

- [x] **7. Separate music and rain.** Add independently controlled 0–100% music/rain gains and an explicit rain playback toggle in the existing settings sound area. Independent mixing is an explicit penthouse opt-in; preserve legacy `setRain`/weather behavior for callers that omit it. Rain-only playback must work with music paused. Retain local licensed music, crossfades and music playback in background tabs. Weather changes may supply climate context but must never overwrite the opted-in user's explicit rain choice. Restored gain preferences do not authorize autoplay. Fade gain changes to avoid clicks, clamp invalid values, and preserve distinct music error state.
  - Accept: rain on/music off is audible, music off does not stop rain, rain off does not stop music, volumes update independently, tracks still change by climate, and silent state releases idle resources. No sound before a gesture.
  - QA: existing AudioContext mocks cover independent toggles, zero/max/clamped gains, rapid play/pause/track changes, delayed/rejected resume, one deck failure while rain continues, hidden/background, restore and destroy. Chrome hears each channel alone and combined and checks both sliders by keyboard. Commit sound module/tests; root owns UI.

- [x] **8. Save favorite room moods.** Add named local presets to Calendar/Atmosphere. Save season, time, weather, desk lamp, floor lamp, animation choice and the independent sound mix; do not save coordinates, note content or active focus timer. Limit to five named presets and 40-character plain-text names, provide apply and delete. Applying a preset explicitly pauses climate Auto, cancels pending location, applies all climate fields atomically through one update, and keeps plate decode-before-swap. Restore preferences without starting sound; applying by gesture may honor the saved enabled channels.
  - Accept: save/apply restores a distinguishable combination (winter/night/rain, desk off/lounge on, music low/rain high), labels cannot inject HTML, overwrite/delete are deterministic, invalid fields cannot escape known climate enums, and denied storage leaves current room usable.
  - QA: preset controller tests cover roundtrip, five-item bound, invalid JSON/version/enum/gain/name, duplicate names, delete, storage failure and no-autoplay restore. Chrome saves two contrasting moods, alters room, reapplies each, reloads and deletes one. Commit preset/root integration files and tests.

- [x] **9. Adapt effects to actual rendering cost.** Measure compositor paint duration and visible frame pressure inside the existing bounded loop. After a sustained slow sampling window, lower precipitation/drop and river-reflection density; restore only after a longer stable window (hysteresis). Keep 30fps maximum and bounded canvas resolution; do not slow Milky's elapsed-time physics, blur room plates, alter user sound choices or add a polling loop. Reset samples across hidden/still/reduced states so a resumed tab is not falsely classified as slow. Quality policy is automatic and unobtrusive.
  - Accept: injected sustained expensive paints reduce effect counts, short isolated spikes do not oscillate quality, sustained cheap paints restore gradually, hidden gaps are excluded, and stopped/destroyed scenes retain zero scheduled RAF.
  - QA: pure governor tests feed fast/slow/spike sequences; effects fixture checks bounded density and lifecycle. Chrome records a repeatable rain/night sample with performance summary and compares default/adaptive settings without claiming arbitrary real-device FPS improvements. Commit performance/effects modules and tests.

- [ ] **10. Integrate, review and deploy.** Root consumes reported APIs, updates `DESIGN.md` and authoritative `AGENTS.md` entries without reviving retired textiles, and confirms no cross-module regression. Run `npm test`, `npm run build` and `git diff --check` after final integration. Use official Codex Computer Use for Chrome desktop and portrait verification; if provider is unavailable, report the actual limitation and do not switch to Orca/Safari/Playwright. Have a read-only reviewer inspect requirement fidelity and cleanup/resource behavior. Scope commits explicitly, integrate on main, push once checks pass, verify the exact main SHA's GitHub Pages workflow succeeds and live JS/CSS match local build.
  - Accept: all requested behaviors implemented, all existing/new tests pass, no new console/runtime error discovered in exercised flows, no new persistent scene captions/header, latest chair removal and prior interactions remain, deployment serves the exact checked commit.
  - QA: Chrome combined scenario starts rain only, saves/applies a mood, writes/reopens a note, starts/pauses/cancels focus, drags ball, rings bowl, toggles both lamps and closes/reopens settings. Repeat keyboard basics and portrait access. Verify live responses with HTTP hashes after Actions success. Evidence: logs, screenshot paths, review notes, final commit and deployment run URL.

## Final verification record

Root appends actual evidence here or links a concise release evidence file. No checkbox may be marked complete solely because implementation exists. Keep unit evidence separate from observed Chrome evidence; do not claim a real-time 25-minute wait or performance gain that was not measured.

- Plan/scope review: complete; final independent read-only audit found no release-blocking bugs. Timer control keyboard-focus issue was corrected before final integration.
- Tests/build/diff: 390 tests passed, TypeScript/Vite build and diff check passed at implementation808588f. Twelve actual-root DOM integration scenarios also passed (scene/pet/audio boundary spies; not browser rendering).
- Chrome functional/visual evidence: official Codex Computer Use verified focus Start/Pause/Resume/Cancel, physical-clock countdown/restoration, safe memo entry and close/reopen. Root inspected the focus/memo screenshots. The provider selected another user window after reload, so remaining GUI flows were stopped; no alternate provider was used.
- Teardown/storage/audio edge-case review: covered by controller tests and independent audit; native rain renderer median39.31→23.73ms under simulated sustained frame pressure, explicitly not a Chrome FPS measurement.
- Full evidence and limitations: [living-room-20261001.json](evidence/living-room-20261001.json). Existing room, Milky, ball/bed artwork and dependencies are unchanged.
- Main implementation commit:808588f. Deployment/live verification follows the release documentation commit.
