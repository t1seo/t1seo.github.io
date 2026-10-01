# Six quiet moments and more natural walking for Milky

## Objective and authorization

The user approved all six motions suggested by Claude after viewing the 26 album photographs, and asked that Claude make them high quality and natural. The latest request explicitly includes the existing walking because its legs still look unnatural. Implement the complete photo motions and diagnose/correct the walking leg art and foot contact while preserving Milky’s likeness, physical scale, ball, bed hop, room plates and album. Actual Claude Fable owns the photo-motion runtime implementation in an isolated worktree; the image-generation team owns additive artwork. A separate actual Fable read-only gait review and independent gait diagnosis inform root’s walking correction decision. Root integrates, documents, commits, pushes main and verifies deployment under the user’s existing authorization. No additional approval interview is needed.

This is a brownfield extension of `src/cyber-pet.ts`, not a replacement pet engine. Effort: large; photo art/runtime and read-only gait diagnosis proceed in parallel. Critical path: common contract → approved photo art + tested photo runtime → evidence-selected gait correction and integration → release. Gait runtime edits wait until the isolated photo-motion runtime finishes, avoiding concurrent ownership of the controller.

## Grounded contract

| Kind / English action | Photo reference | Complete performance | Context |
| --- | --- | --- | --- |
| `tilt` / A curious little tilt | 17 | Neutral attention, a small head tilt through an intermediate pose, a quiet hold, then return | Greeting; explicit action |
| `chin-rest` / Rest your chin | 26 | Lower through a lying transition, place the chin on the actual cushion rim, rest, lift before exiting | Visible bed only |
| `sleepy-peek` / A sleepy little peek | 10, 17 | Sleep, eyelids open and head lifts slightly, brief look, head lowers, sleep | Nap variation; explicit action |
| `paws-rest` / Stretch out and rest | 22 | Lower the body, extend both front paws, hold comfortably, recover through the matching transition | Floor rest; explicit action |
| `belly-up` / A comfy little roll | 12, 21 | Lie down, turn onto the side, roll onto the back with folded front paws, hold, return through side-lying | Visible bed only |
| `pant` / Catch your breath | 20 | Rest after play, gently open the mouth with tongue visible, two or three small drawn breathing changes, relax | Successful play completion; explicit action |

- These are affectionate animation interpretations of visible poses, not claims about historical events or behavior. Use the existing public derivatives under `public/assets/penthouse/milky-album/photos/`; do not publish Downloads filenames or metadata.
- Add `photoMotion(kind): boolean` to the controller and an optional final mount option, enabled only by `src/penthouse-main.ts`. `true` means the intent was accepted, including a pending asset decode; `false` means unavailable. Archived rooms retain their current behavior and request no new assets.
- New artwork uses transparent independent frames, common logical canvas **1536×1024**, optionally exported at **768×512**, and the existing **.847** physical scale. Record measured support anchors, reference direction, torso/head landmarks and chin contact where applicable. Translate the support point to **(795,970)**; do not resize each silhouette to its bounds or warp/rotate the existing dog to manufacture a new pose.
- Root locks the reviewed art inventory and registration in the typed static `src/cyber-pet-photo-art.ts` module owned by Fable. Source prompts, frame order, hashes and measured registration remain in `asset-sources/milky-photo-motions/` group directories and registration JSON. Runtime images live in `public/assets/cyberpunk/milky-photo-motions/`. No network manifest is necessary.
- Load only the requested/selected group, at most two image decodes concurrently. A group appears only after every required frame decodes and its geometry passes validation. Deduplicate in-flight requests, retain bounded successful groups, and do not retry failures automatically. A later deliberate request may retry. Preserve the current pet while loading or on failure.
- Use `playPoseSteps`, the existing `actionTimer`, and `actionRevision` for finite sequences. Use existing roam/rest scheduling for subtle autonomous variants, with no independent interval or RAF. Every new pose joins the busy/rest classification and an appropriate exit/wake path before walking, ball interaction or bed departure.
- Motion must use distinct drawn intermediate poses and measured registration. No whole-body rotation, squash, blur, morph or crossfade of two different silhouettes. Existing sprites remain unchanged except the explicitly authorized walking-leg correction described below; preserve head/body likeness, proportions and physical scale throughout.
- Bed-only actions use the real approach → low hop → landing → `data-bed=true` path. Preserve contact **(1440,865)** and the existing front-lip visibility rule. Do not mirror a held lying pose or place a bed-only action on the floor. If the bed is cropped/unavailable, keep the current pose and communicate availability in the panel.
- Hidden tab, still/reduced motion, inactive modal, cancellation, resize loss of the bed and destruction invalidate pending starts and sequence callbacks. Never leave an airborne pose, show a late loaded frame, or start a stale sleep/ball callback. Still/reduced motion permits a single appropriate already-loaded static posture only where it requires no bed travel; no sequence or new automatic loading runs.
- Explicit controls are available for all six motions. Autonomous selection uses existing eligible greeting/rest/bed/play completion points, never interrupts active user intent, and includes a shared cooldown so quiet variations cannot repeatedly chain. No object caption, badge or new sound is added.

### Fixed art delivery: 15 independent 768×512 transparent WebP sprites

All filenames below are relative to the new runtime directory and end in `.webp`. Existing registered poses supply entry/exit endpoints; intermediate lists reverse on exit where anatomically appropriate. A held photo motion must not change facing until its drawn exit is complete.

| Atomic group | New frames, in forward order | Existing endpoint / transition contract |
| --- | --- | --- |
| `tilt` | `tilt-near`, `tilt-full` | Camera-facing neutral → slight tilt → full tilt → slight tilt → neutral |
| `pant` | `pant-soft`, `pant-open` | Standing → softly open mouth → fuller breath; two or three bounded cycles → standing |
| `paws-rest` | `paws-lower`, `paws-rest` | Sit/drowsy → lowering → forepaws extended → lowering → matching prior pose |
| `sleepy-peek` | `peek-low`, `peek-up`, `peek-blink` | Sleep → slight lift → look up → blink → look up → slight lift → sleep |
| `chin-rest` | `chin-lower`, `chin-rest` | Existing bed arrival/rest → lower toward rim → supported chin → lift through lower pose |
| `belly-up` | `roll-side`, `roll-half`, `belly-up`, `belly-relaxed` | Existing lying pose → side → halfway roll → belly up → relaxed → reverse to lying |

The standing, rest and bed art owners write only their groups. Each delivered frame records measured logical support coordinates; chin frames also record the chin contact landmark. A failed join requires a new art revision before shipment, never a change to existing source art. The 15-file inventory is fixed for the first delivery; any additional transition needed to pass visual review must be coordinated with root before enabling its runtime reference.

### Latest scope extension: diagnose and correct the walking legs

The user specifically requested that the existing walk also become natural because its legs still look awkward. This instruction creates a narrow exception to the previous gait-raster preservation rule. Before replacing any walking file, archive its exact prior bytes and SHA-256, then record an explicit changed-file allowlist and the reason for each replacement. Every unlisted existing asset, all room plates and album photos must retain its baseline hash. Repainting legs does not authorize changing Milky’s face, head/body ratio, coat, physical size, path endpoints, ball contact, bed hop or archived-room appearance.

Start with evidence, not a predetermined redraw count: actual Fable and the independent gait reviewer inspect the active eight-frame walk, registered support/swing paws, stance order, stride-distance mapping, loop boundary and existing arrival timing. Distinguish a source-art leg defect from whole-frame registration, timing, stride or controller defects. Root then records whether the evidence supports local frame repair or a coordinated 8/12/16-frame walk replacement, which active sets require it, and its exact runtime/asset scope. No frame-count decision is claimed before both reports arrive; this is an agent-executed diagnosis gate, not a request for user permission.

Acceptance focuses on the visible legs and world-space contact: identify each paw through a full cycle; show a coherent alternating support/swing sequence; keep a planted paw near its fixed floor location while the body advances, and lift/advance it during swing; avoid duplicate limbs, backward joint bends, toe dragging, stretched legs, sudden support-height changes and loop-boundary pops. Report the before/after foot drift and contact-height measurements in common coordinates for the same routes and speed. Do not substitute head alignment, increased frame count, faster playback, body bob, blurred blending or a new CSS deformation for correct leg anatomy/contact. Preserve the existing bounded acceleration and smooth arrival constraints unless the diagnosis demonstrates a directly related correction; the actual support frame must remain visible before idle, without marching after stopping.

### Evidence-selected implementation

The actual Fable review and independent source measurements found that held eight-frame artwork still drags the feet while the root advances, with large inter-frame paw jumps. Raising the number of independently drawn dogs would not remove that within-frame drift. The selected correction is three new painted layers (torso, foreleg, hindleg), with a small continuous articulated-leg renderer and a coordinated four-beat support plan. No old raster is overwritten: all 45 original Milky images and all 20 room plates retain their baseline hashes. New source art, rejected iterations, prompts and registration live in `asset-sources/milky-grounded-walk/`.

The renderer runs only from the existing pet RAF. Its finite route planner holds stance paws in world coordinates, lifts and advances swing paws, and fits final steps to the destination without stretching bones or inventing contact flags. Normal cadence uses the new 360-native-pixel stride over about 720ms, rather than retaining the old long-stride speed. Brisk floor movement uses the same supported four-beat gait faster; the old authored trot remains the bed-hop artwork and an unavailable-renderer fallback. Three assets decode atomically and never switch renderer in the middle of a leg.

Independent neutral-pose comparison found that shared foot anchors do not make the reconstructed leg outlines identical to the old forward-idle raster (up to 8 screen pixels at the reviewed scale). Therefore normal grounded arrival keeps the final neutral canvas frozen, with no extra animation loop; deliberate greeting/rest/photo actions and lifecycle gates leave that state explicitly. Do not describe the old-to-new idle silhouettes as pixel-identical. Final controller integration and release checks are recorded separately in the evidence file.

## Review findings incorporated

The `omo:ulw-plan` workflow was used. The dedicated Metis role was unavailable, so a read-only gap reviewer inspected the current controller, bed and panel architecture. Its primary findings are addressed above: fixed busy/rest arrays need the new poses; bed chin alignment depends on facing and the front lip; asynchronous decode completion must respect cancellation; all six motions need deliberate accessible entry points; and apparent intermediate frames must actually render rather than only appear in a hidden dataset. Art consistency is the release gate, not frame count alone.

## Ownership and dependencies

| Task | Owner / files | Depends on |
| --- | --- | --- |
| 1. Freeze art/runtime handoff | Root + Claude: contract and registration inventory | None |
| 2. Produce and validate artwork | Art team: disjoint group subdirectories in the two new art roots | 1 |
| 3. Implement finite runtime and tests | Actual Claude Fable isolated worktree: `src/cyber-pet-photo-*`, `cyber-pet.ts`, `cyber-pet.css`, `cyber-pet-test-support.ts`; minimal `cyber-pet-bed.ts` callback extension if required | 1 |
| 3a. Diagnose, select and correct the gait | Actual Fable + independent read-only gait diagnosis, then root-assigned art/runtime owner; exact gait file allowlist recorded after diagnosis | Diagnosis parallel with 1–3; any gait runtime edits wait for 3 |
| 4. Integrate panel and scene | Root/UI owner: `penthouse-main.ts`, `penthouse-panel-markup.ts`, scoped panel styles/tests | 1, then 2–3 for final wiring |
| 5. Validate integrated behavior and art | Read-only QA + root | 2, 3, 3a, 4 |
| 6. Document and release | Root: README, DESIGN, AGENTS, evidence, main release | 5 |

Workers are not alone in the repository. They own only their assigned files and must not revert other workers. Root resolves the single runtime asset module using reviewed art measurements; art workers do not edit TypeScript. Shared-main commits are not cherry-picked; isolated Claude work is committed and merged normally.

## Execution and acceptance

### 1. Freeze the handoff

References: `src/cyber-pet.ts` registration constants and `registerArt`; `docs/milky-rest-registration.json`; `docs/milky-trot-registration.json`; `src/cyber-pet-bed.ts`.

Record each group’s exact filenames, order, entry/held/exit poses, support anchor, contact landmarks, facing and finite hold timings before enabling it. Root and Claude consume the same reviewed inventory. Save a baseline hash list of existing character and room assets.

Acceptance / QA: compare each inventory entry to an actual owned file, confirm 3:2 geometry and explicit support coordinates, and ensure no private source path enters runtime metadata. Deliberately omit an optional group in a test; it must cause no request or broken pose. Evidence: `plans/evidence/milky-photo-motions-20261002.json`. Commit with the scoped art/runtime delivery.

### 2. Produce additive art and verify contacts

References: existing `public/assets/cyberpunk/milky-v4-idle.webp`, `milky-forward-idle.webp`, `milky-rest-{sit,drowsy,sleep}.webp`; photo paths in the contract table; `docs/MILKY-REST-ART.md`; `src/cyber-pet.css` common transform.

Generate each sequence against the current illustrated Milky and the relevant real photographs. Preserve the soft white Maltese coat, face, ear length, nose, head/body ratio, camera and warm room material. Add enough true transition frames to show the action clearly; reject anatomically inconsistent joins rather than hiding them with interpolation. Render a contact sheet on a common grid and a composite on the real bed/floor at runtime scale, including the existing front lip.

Acceptance / QA: inspect neutral/entry/peak/exit next to the existing start/end art; verify paws/torso do not jump at each join, no duplicate limbs or painted background, and no unexplained head-size change. For chin-rest, overlay the measured chin on the actual rim; eyes and muzzle must remain visible. For belly-up, inspect both rotational intermediates and reverse exit. Confirm untouched baseline hashes. Save approved sheets, measurements and rejection/revision notes in the source archive; commit only the scoped new assets and metadata.

### 3. Implement runtime and meaningful regression tests

References: `src/cyber-pet.ts` `cancelAction`, `playPoseSteps`, `startAutonomousRest`, `wakeThenRun`, `playRound`, `syncActivity`, `demote` and `destroy`; `src/cyber-pet-bed.ts` `enter/leave/revalidate`; `src/cyber-pet-test-support.ts`; `src/cyber-pet-hop-runtime.test.ts`; `src/cyber-pet-transition-runtime.test.ts`; `src/cyber-pet-toy-lifecycle.test.ts`.

Add strict readonly typed sequence/asset data, bounded loading and controller entry. Reuse the existing finite timers and lifecycle revision. Pending intent must have its own invalidation tied to existing action cancellation; successful decode alone must not mutate a newer action. Bed callback extensions must preserve the current nap interface and archived behavior. On explicit action replacement, finish the appropriate drawn exit when motion is allowed, then transfer to the requested behavior without moving the endpoint. Immediate lifecycle stops settle safely instead of playing an exit while hidden.

Acceptance / QA: use the real-controller fake DOM/clock harness and failing-first tests for all six visible frame sequences, atomic decode, duplicate request coalescing, loading failure, late decode after cancellation and all lifecycle stops. Check the actually visible sprite state before hiding it; do not accept a dataset-only final-frame assertion. Test bed entry retains hop/landing, bed exit restores walking before departure, and replacement with ArrowLeft/Right or ball play never moves a resting silhouette. Prove legacy mounts request zero new files, initial page load requests zero photo-motion files, concurrent decodes stay ≤2 and destroy leaves zero timers/frames. Run `node --experimental-strip-types --test src/cyber-pet*.test.ts` and `npx tsc --noEmit`. Commit the scoped Fable work after independent review.

### 3a. Diagnose and repair walking anatomy and planted feet

References: `src/cyber-pet-motion.ts` gait stride/phase/frame sampling; `src/cyber-pet.ts` active walk-set selection and registration; `src/cyber-pet-walk-natural.test.ts`; `src/cyber-pet-motion.test.ts`; `docs/milky-forward-registration.json`; `docs/milky-v4-registration.json`; existing gait evidence in `plans/evidence/night-fireworks-fable-gait-20261002.json`.

First obtain the actual Claude Fable and independent reviewer’s frame/contact diagnosis and root’s recorded correction choice. Archive the affected previous files and their hashes before making the narrowly scoped correction. Recheck every revised frame against the existing head/body silhouette, physical scale and the neighboring frames, including the loop end/start. If a complete set changes, decode/swap it atomically and retain a coherent existing fallback; do not mix different-generation legs in one cycle. Photo-motion runtime work continues independently; gait runtime integration is serialized after it finishes.

Acceptance / QA: render matched before/after short `.066` walks left and right, a long bed approach, a reversal, a compatible retarget and a brisk ball chase using the real controller timing and chosen frame set. Capture visible support/swing frames, quantify registered/world-space paw contact drift and ground-height discontinuities, inspect the loop seam and verify exact endpoints. Brisk fallback, loading failure, hidden/still/reduced-motion/modal interruption and destroy must retain their existing safe behavior. The bed hop and real paw-to-ball contact remain intact. Independent art review must confirm materially improved leg coherence/contact rather than only changed timing or more frames. Save diagnosis, root’s chosen scope, before/after evidence and the gait-only preservation exceptions in the existing evidence JSON; commit scoped gait changes with their archived originals.

### 4. Integrate deliberate actions and restrained natural triggers

References: `src/penthouse-main.ts` current `mountCyberPet` and pet/bed click handling; `src/penthouse-panel-markup.ts` Milky panel; `src/penthouse-panels.css` existing 44px action controls.

Enable the optional feature only in the active penthouse. Add the six named actions in a compact Milky panel group, preserving album access and existing controls. Accepted actions close the drawer and reactivate Milky just like current pet actions. Bed-only controls expose an English availability explanation when the bed is cropped, with an accessible status for load failures. Preserve keyboard focus restoration and keep the scene free of narrative labels. Wire each natural trigger through the same controller path; loading must never unexpectedly interrupt a subsequent action.

Acceptance / QA: all six buttons are keyboard reachable with accessible names, fit the current drawer at 320px, and dispatch the intended kind. Bed-only actions do not teleport on portrait crops. Double activation has bounded loading and one final intent. Opening settings or the album while assets load prevents a late start. Failed art leaves existing Milky controls usable. Test the panel/controller wiring and capture Chrome evidence if the approved tool works; commit only scoped integration files.

### 5. Independent final verification

References: all tests above; `plans/evidence/night-fireworks-fable-gait-20261002.json` for existing gait/release evidence; current `AGENTS.md` and `DESIGN.md` contracts.

Run the integrated `npm test`, `npx tsc --noEmit`, `git diff --check`, and production `VITE_GUESTBOOK_API_URL=https://taewon-guestbook.northstar-cloudflare.workers.dev npm run build`. Audit unchanged existing rasters against baseline hashes, except the documented walking-leg allowlist whose prior bytes are archived; room plates, audio rules, album photos and dependency files remain unchanged. Review every new group and the corrected gait in timed native renders/contact sheets at the real registration scale, on light/dark room backgrounds, and composite bed actions with the front lip.

Browser QA uses **Chrome through official Codex Computer Use only**. Verify six explicit actions, subtle natural triggers, corrected walking legs and planted feet at ordinary/brisk speed in both directions, a full bed entry/exit, ball chase ending in pant, rapid replacement, settings/album interruptions, still/reduced motion, desktop and portrait crop. If the known Sky native-pipe startup failure persists, record the failed attempt and distinguish native/controller evidence from browser evidence; never claim actual Chrome playback passed or switch providers. A demonstrated art or runtime defect must be fixed before release even if all tests pass.

Acceptance / QA: independent reviewers approve goal coverage, lifecycle/code quality and art/scope fidelity; all six are implemented rather than stubbed or disabled to mask incomplete art. Report any residual visual limitation precisely. Store actual commands/results, inventory hashes, image evidence paths and the browser limitation in the one evidence JSON. No user review gate is added to already authorized release work.

### 6. Document, commit and verify deployment

References: `README.md` Milky interaction section, `DESIGN.md` latest motion contract, `AGENTS.md` latest requirements, `.github/workflows/deploy.yml`.

Update README with the six actions, natural contexts, bed visibility behavior, lazy loading, reduced-motion behavior and the actual walking correction. Record the exact implemented contract, gait allowlist/archive and actual Claude model provenance in technical evidence without exposing account or private photo information. Integrate the reviewed Claude branch and scoped art/UI/gait commits on main, then push normally.

Acceptance / QA: confirm the remote main SHA, the corresponding successful GitHub Actions and Pages deployment, and compare live HTML plus all referenced JS/CSS hashes with the final local production build. Request a sample of each new published group and verify its exact hash, content type and non-404 response without posting guestbook data. Final report includes concrete behavior, commit SHA, checks, live URL and any actual Chrome limitation. Documentation/release commit is root-owned.

## Done means

All six complete, visibly distinct motions and the evidence-led walking correction preserve Milky’s likeness and existing interactions; leg anatomy and planted-foot contact visibly improve; art and runtime agree on registration; every action can be deliberately reached; background behavior remains quiet and bounded; failure/cancellation cannot resurrect an old action; previous gait originals are archived, unlisted art hashes and legacy behavior remain intact; documentation is current; and the exact reviewed build is confirmed live. No unsupported claim of photorealism, perfect gait or completed browser QA is required or permitted.

## Implementation verification

Runtime integration `83bce7a` passes all **716 tests**, TypeScript and the production Vite build. Independent review covers 62 actual floor routes and 96 carried keyboard routes with no reach/support failures. The actual Canvas adapter passes seven timed routes and holds its final drawing without another draw. All 65 baseline character/room assets retain their hashes; 20 new runtime images are additive. Source commits and exact artifact hashes are recorded in [the verification report](evidence/milky-photo-motions-20261002.json), with a [native walking preview](evidence/milky-photo-motions/grounded-walk.mp4).

Official Chrome Computer Use still fails at native-pipe startup. Native composites and controller tests support this release; browser playback and browser performance remain unverified. The authorized main push and exact Pages deployment are checked after the release commit and reported separately.
