# Painted Milky bed and discoverable ball · 2026-10-01

## Outcome

Improve the bed's painted material quality and expose a small red toy ball directly in the room. Clicking the ball lets Milky approach, bow, touch it with a paw, and chase its bounded hop/roll using the existing genuine gait. Preserve the recently corrected head proportions.

## Decisions and constraints

- Use built-in ImageGen for a warm ivory short-plush bed and matte painted red ball. Save selected originals, exact prompts and prior-art references. Preserve all character sprites and room plates.
- Bed stays at source rect[1310,788,260,142], sleeping contact[1440,865], and the existing front-lip mask. Check both day/night and an occupied bed.
- The bed is outside normal roaming bounds. The single ball starts on reachable floor at normalized[.52,.977]; do not expand roaming across furniture. Chrome showed that the first .63 placement reached the right boundary too quickly, so the final central position gives the first game more room to roll and chase.
- Opt in only in penthouse through a tenth `mountCyberPet` argument `{ ballHome }`. Legacy rooms retain their original transient ball behavior.
- Reuse the existing ball element/state and existing approach/bow/paw-contact/nudge/chase code. No duplicate decorative ball, teleport on click, new perpetual animation or visible captions.
- A native button and at least44px hit area support pointer/Enter/Space without enlarging the painted sprite. Decorative images remain hidden from assistive technology; the button must not inherit `aria-hidden`.
- Preserve hidden/inactive, cropped-floor, reduced-motion, wake-from-bed, readiness/error and destroy behavior. Persistent means visible when usable, not an offscreen tab stop. Existing pet idle timers remain; add no resting ball RAF/timer.

## Pre-plan review

Read-only Metis consultation (specialized role unavailable, equivalent default-agent review) and flow audit identified the aria-hidden ancestor, clearSession erasure, beginPlay respawn, unreachable bed-adjacent floor and sprite registration as the main risks. These are explicit constraints above. User authorization to commit, push, integrate main and deploy persists from this session.

## Tasks and ownership

1. **painted_bed:** `public/assets/penthouse/objects/milky-bed.webp` and `asset-sources/seoul-studio/painted-milky-bed/`. Keep silhouette/perspective, compare on actual room plate, inspect alpha and sleep occlusion; scoped commit after root approval.
2. **painted_ball:** new `public/assets/penthouse/objects/milky-ball.webp` and `asset-sources/seoul-studio/painted-milky-ball/`. Maintain approximately60% visible diameter and bottom anchor80% of square canvas; report measured normalized512 anchor; scoped commit after root approval.
3. **persistent_ball:** `src/cyber-pet.ts`, `src/cyber-pet.css`, support fixture and focused new toy module/tests. Add optional config, accessible direct action and retained ball lifecycle. Red/green regressions cover initial single ball, contact/chase, completion/interruption, hidden/inactive/crop, reduced motion, errors, destroy and legacy behavior. No unrelated refactor.
4. **root:** `src/penthouse-main.ts`, project docs and this plan; enable the option and selected art/anchor, update intrinsic bed dimensions, inspect final integration, run full tests/build, use official Codex Computer Use in Chrome, commit/push/deploy and compare published files against dist.

Art and behavior tasks run in parallel; final integration/QA/deployment follow all three. Workers own only assigned paths and do not revert each other.

## Verification

- `npm test`: full regression suite passes, including the new persistent-ball behavior and existing bed/legacy behavior.
- `npm run build` and `git diff --check`: no errors. New TypeScript uses strict types; existing large controller gets only scoped integration.
- Asset checks: genuine RGBA alpha, matching registration, no halos or double contact shadow; scaled day/night and sleeping-Milky composites reviewed.
- Chrome at desktop: visible painted bed and exactly one ball, pointer and keyboard activation, real approach/contact/roll/chase, eventual stationary ball; no toast/hover label. Check narrow portrait fallback via runtime tests and Chrome if provider stable.
- Edge tests: cancel during rolling, activate after bed nap, hidden→visible and inactive→active, reduced motion, unavailable/failed images and destroy. No additional idle RAF or callback leak.
- After authorized main push, require successful Pages run for exact commit and HTTP200/SHA256 matches for HTML, bundles, bed and ball.

## Evidence

- Bed art approved on the actual room and occupied day/night crops. Runtime520×284 RGBA,48362bytes; selected source/prompt/QA in `asset-sources/seoul-studio/painted-milky-bed/` (32d6752).
- Ball art approved on neutral and room backgrounds. Runtime512×512 RGBA,30290bytes; opaque bounds[95,95,417,419], floor contact[256,419]. Source/prompt/QA in `asset-sources/seoul-studio/painted-milky-ball/` (fadc1fb). Original ball preserved.
- Persistent interaction and seventeen meaningful new regression cases landed in f493f1e/9949ca0. The painted seam rotates with horizontal travel using the existing RAF; it freezes at rest and does not mirror when Milky turns.
- Full suite:280/280 passed, no failures/skips. TypeScript/Vite production build and diff check passed; main integration LSP has no diagnostics. Character sprites and all twenty room plates are byte-for-byte unchanged from0fc751e.
- Independent read-only review found no must-fix issue. An additional real-controller scenario verified bed sleep→ball click→wake/walk back→paw contact→idle with the same retained ball.
- The final .52/.977 position passed a real-controller probe: two actual paw contacts, ball travel0.1700 (284px), chase travel0.1649 (276px) with eight gait frames,7.184sec to idle and zero remaining RAF. The .63 regression fixtures remain useful boundary coverage.
- Official Codex Computer Use in Chrome verified painted bed/one red ball, direct click, Tab focus and native Enter/Space play; approach/bow/paw reach/ball hop; same ball after completion; bed nap then ball-click wake/return; no captions/toast. Evidence: `/tmp/t1seo-ball-{before,after,enter-2,enter-3,space-3,bed-nap,wake-return}.jpg`.
- Final .52 placement was confirmed in `/tmp/t1seo-ball-final-before.jpg`. Before its next click the provider returned a different Chrome window, so GUI work stopped to avoid interfering with the user. Final-position long roll/chase was verified by the real-controller probe above, not a captured browser sequence. Earlier native pointer/keyboard/nap checks used .63 and remain relevant to the unchanged controller.
- Final position integration again passed all280tests, TypeScript/Vite and diff check. Deployment verification follows the authorized main push.
