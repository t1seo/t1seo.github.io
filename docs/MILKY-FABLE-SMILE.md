# Milky v4 — happy photo identity and companion behavior (Fable worker)

Rebuilds Milky's on-screen behavior around the new happy reference photograph
(`20150817_211702.JPG`, private, never copied into public assets): the smiling look up at
the camera with round dark eyes, compact black nose, open mouth with pink tongue, short
drooping ears, fluffy white coat and curled plume tail. Raster art is produced by root's
art worker to the contract in `docs/MILKY-FABLE-ASSET-BRIEF.md`; nothing here draws a
substitute dog, warps photo pieces, or crossfades between different dogs.

## Asset tiers and atomic readiness

- The controller requests `/assets/cyberpunk/milky-v4-idle.webp` plus
  `milky-v4-step-0..7.webp`. This nine-file set is atomic: until every file loads, decodes
  and passes the 3:2 ratio check, the pet button stays hidden and disabled, so a decoded v4
  idle can never appear over an unproven gait (and vice versa).
- Any required v4 failure — load error, rejected `decode()`, or malformed dimensions —
  demotes the entire display to the verified v3 set (`milky-awake.webp` +
  `milky-v3-step-*.webp`) with its recorded registration and nose-offset table. Faces are
  never mixed across tiers. The v3 tier keeps its historical behavior: idle first, walking
  gated on the eight decoded frames; a further idle failure falls back to
  `maltese-alert.webp` (no gait), and a final failure hides the pet.
- Optional micro-poses load only from the explicit shipped list `MILKY_SHIPPED_POSES` in
  `src/cyber-pet.ts` (currently `['blink']`, confirmed by root), so omitted optional files
  cause no 404 requests. Attend and sniff behaviors are implemented and dormant; root
  enables each by adding its filename to the list. A failed optional pose is skipped
  silently and independently.

## Motion changes

- Velocity ramps use smoothstep acceleration/deceleration (same integral area as the
  previous linear ramps, so durations are unchanged) — walks depart and arrive without a
  jerk, and frames stay distance-driven so nothing skates.
- The gait now accumulates phase (cycles) rather than raw distance, so a stride change
  between chained walks can never jump a limb frame.
- `milkyGaitStride` fits the stride (within ±14–16% of the measured nominal) so a walk that
  starts on phase 4 — the stance closest to the standing photo — also ends on phase 4,
  removing the stop pop at settle. Short shuffles keep the honest nominal stride.
- A compatible same-heading retarget carries its momentum: the cruise speed rises to meet
  the carried speed instead of clamping it, so the join has no visible speed discontinuity
  (independent reviewer measured 0% drop; previously 12.68%).
- Rests vary: after a finished walk there is a 30% chance of a short 3.2–6.6 s curious
  pause, otherwise the usual 9–18 s. Autonomous wanders sometimes hold a brief nose-down
  sniff (when shipped) before stepping off; reversals keep the still three-quarter glance
  (240 ms) before mirroring. A click greeting holds the happy look-up pose (when shipped)
  for ~0.4 s before walking.
- Idle life between walks (v4 only, reduced motion off): blinks of 120–180 ms every
  2.6–8.2 s with occasional double blinks, plus rare attend/sniff glances when shipped.
  These swap independently drawn raster poses only — the body, floor anchor and scale never
  move, no CSS deformation, no announcements, no events.

## Registration (final)

`MILKY_ART` in `src/cyber-pet.ts` carries per-version anchors. v3 keeps the reviewed values
from `docs/MILKY-ROAM.md`. v4 uses the delivered final metadata
(`milky-v4-registration.json` in root's art worktree): idle bounds [197, 95, 1393, 970],
nose (1145.39, 353.34); center x795, ground y970, scale .847 keeps the displayed body at
~66% of the button.

The v4 per-frame `stepOffsetX` values are ZERO deliberately, on the artwork reviewer's
recommendation, not as a placeholder. The delivered step heads were regenerated per frame,
so their nose landmarks spread 20.35 px horizontally and 7.28 px vertically in 768-space;
translating whole bodies to cancel that would shift the torso and stance paws to compensate
for redrawn heads. The common body-space transform is kept instead, and the residual
head/nose variation remains visible in the sprites. Honest limits: the v4 frames are
four-legged pose approximations aligned to the v3 gait plan, not pixel-locked v3 limbs, and
registration is not pixel-perfect; the metadata's nose method (largest dark connected
component) also differs from v3's ROI mean, so v3/v4 centroids are not directly comparable.

## Contracts preserved

`mountCyberPet(host)` is unchanged (an optional second argument injects the shipped-pose
list, defaulting to `MILKY_SHIPPED_POSES`). Explicit `cyber:pet` greet/walk events fire only
for clicks and keyboard walks; autonomous movement and micro-poses emit nothing. Keyboard
access, reduced motion, resize/visible-floor safety, hidden-tab and intro/dialog pause,
image decode gating and destroy cleanup all remain covered by tests.

## Checks

- `npm run build` (tsc + vite) passes.
- `npm test`: 75/75 pass, including new coverage for atomic v4 readiness, whole-tier
  demotion on load/decode/malformed failures, v3 decode gating, momentum continuity
  (numeric ±5% px/frame regression), stride-fitted walk ending near frame 4, shipped-pose
  request list, blink/attend/sniff rest behavior, silence of autonomous behavior, and
  reduced-motion/hidden cleanup.
- Independent reviewer harnesses (`/tmp/milky-fable-runtime-review.mjs` 9/9 pass;
  `/tmp/milky-fable-gait-review.mjs` 0% continuation speed drop) pass against this tree.
- Final art metadata is delivered and applied (see Registration above); all per-file
  clear-space alpha samples and halo checks in it are clean.
- Chrome is the only permitted browser and root's Chrome UI tool is unavailable in this
  session, so live Chrome playback of the integrated v4 art has NOT been verified here.
  The remaining check for root is real playback review after art integration — the
  metadata's own guidance is to "inspect live playback" for the zero-offset registration.
