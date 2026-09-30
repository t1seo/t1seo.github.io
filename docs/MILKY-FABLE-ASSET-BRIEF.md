# Milky v4 asset brief — happy photo identity (Fable worker contract)

Root's art worker produces these raster images; the runtime in this worktree is implemented
against this exact contract. Reserved path prefix: `public/assets/cyberpunk/milky-v4-*`.
Absent files are expected at first; the controller falls back to the verified v3 set until
every required v4 file decodes.

## Identity reference — REQUIRED expression change

Source photo: `/Users/cillian/Downloads/20150817_211702.JPG` (private; never copied into
public assets). It shows Milky mid-walk on a wooden floor, looking up at the camera and
visibly happy. The previous v3 face reads stern/sad; every v4 image must instead carry:

- round, natural dark eyes, open and bright, gaze slightly upward toward the viewer;
- compact black nose (small, not the broad flat v3 nose emphasis);
- small OPEN mouth with visible pink tongue — a relaxed happy pant, not a wide cartoon grin;
- short drooping furry ears blending into the head fur;
- fluffy white coat with slightly tousled head fur, clipped-short body length;
- curled white plume tail carried over the back.

## Global technical invariants (every file)

- RGBA WebP, true transparent alpha: alpha 0 everywhere outside the fur silhouette, only
  fine hair antialiasing partially transparent. No floor, cast shadow, gradient, halo,
  backdrop, fog or matting (v3's clear-space sample points must all read alpha 0).
- Exactly four anatomical dog legs. Consistent soft indoor lighting across all 12 files.
- Same dog, same body scale and proportions in all files. Do not restyle fur between poses.

## Required files

### 1. `milky-v4-idle.webp` — 1536×1024

Happy standing pose replacing `milky-awake.webp` as the rest identity. Three-quarter side
view, body facing right, head turned toward the viewer, gaze slightly up (the photo's mood),
all four paws planted.

DELIVERED (final metadata: `milky-v4-registration.json` in root's art worktree): alpha
bounds [197, 95, 1393, 970], nose max-connected-component centroid (1145.39, 353.34). The
runtime carries this registration in `MILKY_ART.v4` (`src/cyber-pet.ts`: center x795,
ground y970, scale .847 keeping the displayed body at ~66% of the button) — final, not
provisional. `milky-v4-blink.webp` measured near-identical (bounds [200, 96, 1394, 970],
nose (1146.53, 352.79)).

### 2–4. Idle micro-poses — 1536×1024 each, OPTIONAL but requested

Each is the idle pose with ONE change; legs, torso, tail, lighting and registration stay
pixel-stable against `milky-v4-idle.webp` (nose/eye region may move, body must not).

- `milky-v4-blink.webp`: eyes fully closed; nothing else changes. Used for 120–180 ms blinks.
- `milky-v4-attend.webp`: head lifted a little higher toward the camera, ears perked as far
  as drop ears allow, mouth open happy. Used as greeting/anticipation before a walk.
- `milky-v4-sniff.webp`: head and nose lowered toward the floor, mouth relaxed closed.
  Used briefly before quiet autonomous wanders.

If a micro-pose is missing or fails decode the runtime simply skips that behavior; blink,
attend and sniff are independently optional. The idle and all eight steps are required as a
set before any v4 art is shown (atomic nine-file readiness — the button stays hidden and
disabled until every required file decodes, and any required failure demotes the whole
display to the verified v3 set, never a mixed-face combination).

Per root, final delivery will likely include only `milky-v4-blink.webp`. The runtime
requests optional files strictly from the shipped list `MILKY_SHIPPED_POSES` in
`src/cyber-pet.ts` (currently `['blink']`), so omitted optional files cause no 404 requests
at all. Attend and sniff behaviors remain implemented; root enables each by adding its name
to that list when the file ships.

### 5. `milky-v4-step-0.webp` … `milky-v4-step-7.webp` — 768×512 each

The eight-frame side-view walk. PRESERVE the reviewed v3 leg anatomy exactly — same four leg
poses per frame, same contact order (near hind → near front → far hind → far front), same
paw positions within the inspection windows recorded in `docs/milky-v3-registration.json`.
Change ONLY the head/face to the happy identity above (open mouth, tongue, round bright
eyes, compact nose), matched consistently across all eight frames. Do not regenerate the
legs from scratch and do not pack frames into a sheet; deliver eight independent files.

- Nose registration — initial target vs delivered: the initial contract asked the eight
  step nose centroids to cluster within ±3 exported px of each other and of the idle nose
  in exported coordinates (v3 achieved a 0.64 px vertical range). The DELIVERED frames,
  whose heads were regenerated per frame for the happy expression, measure a nose spread of
  20.35 px horizontal and 7.28 px vertical in 768-space (`stepNoseRange` in
  `milky-v4-registration.json`; note its connected-component nose method is not comparable
  with the v3 all-dark-pixel ROI mean). The artwork reviewer accepted this with a common
  body-space transform and ZERO per-frame whole-body X offsets: translating whole bodies to
  align redrawn heads would shift the torso and stance paws instead of fixing the drawings.
  The runtime therefore keeps `stepOffsetX` at zero deliberately, and the residual head/nose
  variation remains visible in the sprites; it is documented, not corrected.
- Keep common torso/face registration; do not recenter per-frame silhouettes by alpha
  bounds and do not snap paws to a shared baseline.

## Delivered measurements — DONE

Root delivered `milky-v4-registration.json` (art worktree) covering all ten files: alpha
bounds, connected-component nose centroids and inspection windows, partial-alpha counts,
halo checks (`alphaAbove32FartherThan20ScaledPxFromOpaqueFur` = 0 everywhere) and six
clear-space alpha samples per file, all zero. Its diagnostic `idleMinusTwoTimesStepNoseX`
table (−43.75 … −3.05 source px) is intentionally NOT applied as runtime offsets — see the
nose registration note above; the runtime's v4 `stepOffsetX` values (`MILKY_ART` in
`src/cyber-pet.ts`) are deliberately zero, keeping a common body-space transform.

## Verification honesty

Static-frame, registration and unit/simulated-DOM checks run in this worktree. Chrome is
the only permitted browser and root's Chrome UI tool is currently unavailable, so live
Chrome playback review of the integrated v4 art is pending and is not claimed here.
