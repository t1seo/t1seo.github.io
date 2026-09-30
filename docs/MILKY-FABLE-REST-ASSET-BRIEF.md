# Milky rest poses — asset brief (Fable worker contract)

Compact contract for the imagegen art worker. Reserved path prefix:
`public/assets/cyberpunk/milky-rest-*`. The controller is implemented against this
contract; missing or failed files gracefully remove only the behaviors that need them,
and the delivered v4 walk keeps working.

## Identity and global invariants (every file)

- The SAME individual happy Milky as the delivered `milky-v4-idle.webp` (reference for
  face, fur, lighting): white fluffy Maltese, round dark eyes, compact black nose, short
  drooping furry ears, curled white plume tail, clipped body coat. Private reference photo
  `20150817_211702.JPG` must never be copied into public assets.
- 1536×1024 RGBA WebP, true transparent alpha outside the fur (fine hair antialiasing
  only). No floor, cast shadow, halo, backdrop or matting. No cartoon overlays of any kind:
  no "Zzz", no text, no hearts, no sparkles, no thought bubbles.
- Natural dog anatomy for each posture; body facing right like the idle (the runtime
  mirrors for left). Consistent soft indoor lighting across all files.
- PHYSICAL body scale is common with the idle: the torso, head and paws are the same-sized
  dog, so a seated pose is taller-and-narrower and a lying pose is much lower and wider.
  Do NOT rescale each silhouette to equal canvas height or equal bounds.
- Common floor anchor: everything touching the ground (paws, haunches, lying belly/side)
  rests on the idle's ground line, canvas y ≈ 970. The dog should occupy roughly the same
  horizontal region as the idle silhouette (x ≈ 197..1393), centered near x ≈ 795, so pose
  swaps do not read as a teleport.

## Required files — 3 core poses

1. `milky-rest-sit.webp` — SEATED. Haunches on the ground, hind legs folded, front legs
   upright and planted, chest lifted, head up with the happy relaxed face (mouth may be
   gently open). Tail curled beside/behind the haunches.
2. `milky-rest-drowsy.webp` — LYING AWAKE, sternal ("sphinx"): belly and folded hind legs
   on the ground, front paws extended forward on the ground, head raised but relaxed,
   eyes open but soft/heavier than the idle (calm mouth, no wide pant).
3. `milky-rest-sleep.webp` — ASLEEP. Lying with head down resting on or beside the front
   paws (sternal-curled is fine), eyes fully closed, mouth closed, ears fallen naturally.
   Deliberately compact, restful silhouette. Stillness comes from the runtime (subtle
   breathing only); nothing in the art should suggest motion or effects.

## Optional files — at most 2 transitionals

4. `milky-rest-sitdown.webp` — mid "lowering onto haunches": hind quarters partly lowered
   between standing and seated, front legs planted. Bridges idle → sit for ~0.4 s.
5. `milky-rest-wake.webp` — mid "waking": lying body as in sleep but head lifted and eyes
   opening. Bridges sleep → awake for ~0.5 s.

If a transitional is not produced or not visually stable, the runtime swaps directly
between held poses (a brief still hold, not a crossfade); transitionals only soften the
change. Ship them only if they read cleanly at small size.

## What the runtime does (so art effort lands where it matters)

Pose changes are swaps between independently drawn, held raster poses at a fixed floor
point — no ghosted whole-dog crossfades, no sliding a static sitting/sleeping dog, no CSS
body squashing, no teleporting reposition. Sleep shows an extremely subtle CSS breathing
(≤ ~0.6% vertical, anchored at the ground; disabled for reduced motion). Poses are
requested only from an explicit shipped list (`MILKY_SHIPPED_REST` in `src/cyber-pet.ts`,
initially the 3 core files), so unproduced optional files cause no 404s; root adds a
transitional's name to the list when it ships.

## Measurements that feed layout after delivery

Generated art is not guaranteed pixel-perfect; the runtime aligns each pose with per-pose
offsets instead of trusting the canvas blindly. For each delivered file report, as in
`milky-v4-registration.json`:

1. alpha >32 bounds and the lowest ground-contact row (should be ≈ y970);
2. the horizontal center of the ground-contact footprint (the runtime keeps this point
   fixed across pose swaps via a per-pose x-offset, default 0, so the dog sits down and
   sleeps "in place" rather than jumping sideways);
3. the six clear-space alpha samples used for the v4 set (halo regression check).

Small deviations are corrected by those offsets; a ground line far from y970 or a strongly
off-center body should instead be re-generated. Chrome UI review is unavailable in this
session, so live playback inspection of the integrated poses remains with root.
