# Window fireworks and returning opening credits

## Scope and decisions

The user rejected the small procedural river boat, requested a fireworks festival outside the window, and asked for their name to return when the room is left alone. Remove the boat completely. Preserve the painted room, Milky, photographs, album soundtrack, weather, object interactions and existing music playback.

Root has authorized parallel implementation, scoped commits, integration into main, push and deployment under the user's standing instructions. No further preference or approval is required for this bounded change.

- Atmosphere provides an English, keyboard-accessible `Watch fireworks` / `Stop fireworks` button with a minimum 44px target. Starting closes the drawer and keeps the selected time and weather.
- The requested festival runs once for 60 seconds, with champagne/gold and muted rose chrysanthemum, willow and palm bursts, layered tapered trails and subtle river reflections. It uses the existing 30fps effects compositor and adaptive detail, with no additional sound or raster artwork. The later 2026-10-02 request also allows rare automatic starts in the selected Night scene, after 8–15 uninterrupted eligible minutes; manual Watch/Stop remains available at all times.
- Automatic waiting uses one cancellable timeout. Settings, a loading/open album, a running festival, hidden/still/reduced-motion states cancel it. Returning to eligibility starts a fresh interval, while equivalent climate/clock refreshes preserve the existing deadline. No background catch-up or added frame loop.
- Fireworks remain outside the room: glass panes and foreground occluders mask the effect, the skyline masks launches and blooms, and reflections stay within the river. Hidden, still or reduced-motion states cancel playback and refresh the control state.
- The existing Cormorant `TAEWON SEO` cinematic sequence reappears after 60 seconds of inactivity. Pointer, keyboard and wheel activity reset the wait. Settings, pending/open album, fireworks and hidden states suppress it; returning to an eligible room starts a fresh wait. Still/reduced-motion behavior stays static and brief; no typewriter animation is introduced in those modes.
- Destroy removes listeners, pending callbacks and drawing work. Ordinary site entry still has no audio autoplay.

## Grounding and gap review

Existing patterns: `src/penthouse-effects.ts` owns one bounded compositor; `src/penthouse-atmosphere.ts` exposes glass, skyline and furniture masks; `src/penthouse-quality.ts` supplies full/balanced/quiet densities. `src/penthouse-main.ts` owns modal, album, still-state and teardown integration. `src/penthouse-opening-credits.ts` supplies the existing finite title sequence. Tests use Node's test runner; `npm run build` runs TypeScript and Vite. `.github/workflows/deploy.yml` deploys main after site and guestbook checks.

The Metis role was unavailable; a separate read-only agent reviewed execution gaps. The key timing guardrail is to keep the festival's elapsed time separate from the compositor's clamped simulation delta and restart timestamps. Slow frames and ordinary lamp/plate changes must not stretch a promised one-minute show. Visual review must include daylight because the feature never forces night.

## Ownership and execution

All agents share the working tree and must preserve one another's changes. Owners stage only their assigned paths. Tasks 1–3 run in parallel; task 4 integrates them; tasks 5–6 follow integration.

| Task | Owner | Depends on |
| --- | --- | --- |
| 1. Boat removal and festival compositor | `fireworks_effect` | — |
| 2. Festival control and room integration | `fireworks_controls` | Agreed API from 1 and 3 |
| 3. Idle cinematic replay | `idle_window_credits` | — |
| 4. Integration and automated verification | Root | 1–3 |
| 5. Real Chrome visual and interaction QA | Root | 4 |
| 6. Scoped integration commit, main push and deployment | Root | 4–5 |

### 1. Boat removal and festival compositor

Own `src/penthouse-effects.ts`, the new `penthouse-fireworks-show.ts` and `penthouse-fireworks-paint.ts`, their tests, and effects test support/lifecycle tests. Delete the unused `penthouse-river-boat.ts` and its tests. Expose start, stop, current state and a change notification for the scene integration. Reuse the shared compositor and density tiers; precompute/cache particle data and glow textures rather than constructing gradients per spark per frame.

Acceptance and QA:

- Search active source for `RiverBoat`, `riverBoatPose` and `wakeBoat`: no runtime or test-support references remain.
- A clear daytime room has zero scheduled boat callbacks and no compositor frames until work is requested.
- Start twice, stop twice, natural completion and repeat start have one coherent active-state transition each.
- Use fake frames spaced 250ms apart, including workspace/plate restarts; the show ends after 60 seconds of real visible elapsed time rather than 60 seconds of clamped simulation time.
- At all density tiers, rendering is bounded. Hide, disable animation, enable reduced motion or destroy mid-burst: no late drawing, resumed show or stale active state.

Commit: scoped feature/removal commit with focused test results reported to root.

### 2. Festival control and room integration

Own `src/penthouse-fireworks-ui.ts`, its control tests, `src/penthouse-panel-markup.ts`, `src/penthouse-scene.ts` and `src/penthouse-main.ts`. Delegate events through the existing root, subscribe to the scene's active state, and retain drawer focus restoration. Bind credits suppression to actual settings, pending/open album and festival state; update it at both entry and exit boundaries.

Acceptance and QA:

- Clicking or pressing Enter on Watch starts exactly once and closes the drawer; reopening shows Stop while active. Stop ends promptly without changing climate or music.
- Hidden cancellation, natural completion and failed start restore accurate button text, pressed state and status text.
- Still/reduced-motion disables starting with an English explanation; returning to animation permits an explicit new start, never an automatic replay.
- Rebuilding/switching panel content and repeated opening do not accumulate listeners or duplicate starts. Teardown unsubscribes.
- Starting/ending the festival, opening/closing settings, and successful/failed/cancelled lazy album opening notify the credits lifecycle consistently.

Commit: scoped control/integration commit with focused test results.

### 3. Idle cinematic replay

Own `src/penthouse-opening-credits.ts`, associated CSS, fixture and tests. Preserve the existing title, typography and finite cinematic timing. Separate sequence completion from permanent disposal so completion can schedule another eligible idle wait. Avoid a perpetual frame loop; activity may update an idle deadline without repeatedly constructing expensive work.

Acceptance and QA:

- After the opening finishes, 59,999ms of eligible inactivity does not replay; at the 60-second threshold the sequence begins once. Pointer, key and wheel activity each reset the threshold.
- Activity during replay hides/cancels that replay cleanly and begins a new wait. No old letter-reveal or fade callback affects the next sequence.
- Leave settings/album/festival open beyond the threshold: no title appears through the overlay; after closure the full fresh wait applies.
- Hide during waiting or typing, then return: no burst of delayed letters and no immediate accumulated-idle replay. Still/reduced-motion yields the agreed static presentation and no animated typewriter.
- Destroy while waiting, typing and fading removes all callbacks/listeners and prevents subsequent activity from resurrecting the title.

Commit: scoped credits feature commit with focused test results.

### 4. Automated integration verification

Root reviews the combined diff and updates `AGENTS.md` / `DESIGN.md` with the latest boat, festival and idle-title contracts. Run `npm test`, then `VITE_GUESTBOOK_API_URL=https://taewon-guestbook.northstar-cloudflare.workers.dev npm run build`, and `git diff --check`. Record exact results and meaningful limitations in `plans/evidence/window-fireworks-idle-name-20261002.json`. Preserve all existing public room, Milky and photo raster files; confirm this from the scoped diff. Do not repeat passed broad suites without a new code change or unresolved failure.

Failure scenario: if a worker's API or lifecycle integration differs, fix the minimal affected scope and rerun the focused failing suite before the final build.

### 5. Official Chrome QA

Use the official Codex Computer Use runtime with Chrome only. Do not substitute Orca, Safari, CDP, Playwright or browser-script injection. Keep screenshots local if browser chrome includes unrelated user information.

| Scenario | Actions | Pass condition |
| --- | --- | --- |
| Night festival | Select a night view; open Atmosphere; Watch; observe launch, full bloom, trails and reflections; reopen and Stop | Warm restrained palette and depth fit the illustration; no square sprites, hard stencil edges, wall/furniture/window-frame bleed or audio change |
| Daylight festival | Choose noon without changing weather; start again | Fireworks remain readable; existing time/plate remains selected; no washed-out full-window flash |
| Responsive control | Check desktop and a 320px Chrome emulation; keyboard activate Watch/Stop | Label/status fits, target remains 44px, no clipped focus, drawer closes and focus returns correctly |
| Idle return | Finish opening, leave the foreground room untouched for 60s, then interact | Name slowly returns in its established position, cancels on activity and does not obstruct interactions |
| Suppression | Keep settings and then album open for more than 60s; test festival boundary and a background-tab return | No title through overlays/festival, no immediate catch-up replay; album audio continues its established behavior |
| Reduced/still | Toggle room animation off, and Chrome reduced-motion emulation if available | Festival stops and cannot start; credits contain no animated reveal; explanation and state stay accurate |

Automated fake-clock tests cover precise deadlines; record any actual GUI scenario that could not be exercised instead of claiming it passed. Prioritize actual painterly quality, foreground masking and smooth Chrome interaction over an unverified numerical FPS claim.

### 6. Release and final audit

Root checks goal compliance, code quality, real rendered evidence and scope fidelity, then commits only the integration/docs/evidence paths and pushes main under the user's existing authorization. Verify the final exact SHA in the remote main, successful site/guestbook/Pages jobs, and live built-asset parity at `https://t1seo.github.io/`. The final Korean response reports the removed boat, where to start the festival, the idle-name behavior, the verified deployment and final commit.

## Done means

The boat no longer exists, a requested bounded festival looks natural outside the window, the name returns only after an eligible idle interval, all relevant tests/build pass, Chrome evidence supports the visual claims, and the exact integrated commit is live. Any material verification limit is reported plainly rather than converted into a success claim.

## Execution evidence and remaining verification limit

Implemented and independently reviewed on 2026-10-02. The review reproduced and fixed pending-album suppression and failure/cancellation idle deadlines. Automated root lifecycle and race scenarios now pass. Final verification is recorded in `evidence/window-fireworks-idle-name-20261002.json`.

Official Codex Computer Use could not connect to Chrome: `Sky Computer Use native pipe startup failed` persisted after resetting the JavaScript kernel and restarting the official native service. The native process and configured socket existed, but the connection still failed. No other GUI provider was used. Actual browser interaction, mobile layout, elapsed idle replay and Chrome frame performance therefore remain unverified for this release.

The production canvas painter was separately rendered over the real night/noon artwork at 2, 3, 8, 15 and 52 seconds with full/quiet detail. This led to a second visual pass improving trails, radial depth and low-detail palm bursts. Pixel checks found no painted pixels outside the registered mask. These are native Canvas images, not Chrome screenshots or browser performance evidence. All existing public artwork and audio remain untouched.
