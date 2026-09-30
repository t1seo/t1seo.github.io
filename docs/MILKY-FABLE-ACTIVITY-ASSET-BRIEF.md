# Milky activity poses & props — asset brief (Fable worker contract)

Compact contract for the activity art worker: 4 dog poses + 2 props, 6 files total, under
`public/assets/cyberpunk/`. Same individual happy Milky as the delivered
`milky-v4-idle.webp`; identity/alpha/lighting invariants exactly as in
`docs/MILKY-FABLE-REST-ASSET-BRIEF.md` (1536×1024 dog canvases, true alpha, no floor or
shadow baked in, no overlays/text/effects, natural anatomy, physical body scale common
with the idle — never normalize silhouette heights). Body faces right; runtime mirrors.
The runtime keeps working without any of these files; missing art only removes the
behaviors that need it.

## Dog poses (1536×1024 each)

All four look AT their target (bowl or ball), never at the camera.

1. `milky-eat-low.webp` — EATING, head lowered to a bowl. Standing, all four paws planted
   at ground y ≈ 970, neck and muzzle lowered forward-down. MUZZLE TIP AIM: (1330, 880)
   ± 50 native px — just above and ahead of the forepaws, leaving room for the bowl rim
   below the muzzle. Mouth toward the bowl; eyes soft, gaze down into it.
2. `milky-eat-lift.webp` — CHEWING, head slightly lifted. IDENTICAL body, legs, tail and
   paw positions to `milky-eat-low` (closely registered pair; only head/neck rise), muzzle
   around (1280, 760) ± 60, mouth gently working, gaze still toward the bowl below.
3. `milky-play-bow.webp` — PLAY BOW. Chest and forelegs lowered to the ground, elbows
   near the floor, hindquarters up, tail up, ears lively, happy open mouth, gaze forward
   at a ball on the ground ahead (gaze target direction ≈ (1350, 930)).
4. `milky-play-reach.webp` — PLAYFUL REACH. Standing with one raised forepaw reaching
   forward toward the ball; nose pointed at it. RAISED PAW AIM: (1330, 800) ± 60; the paw
   and muzzle must clearly address a ball that the runtime renders ahead at the floor
   line, roughly (1380, 940) in this canvas's terms — nothing may look attached to or
   floating in the face.

Report for each pose (as for the rest set): alpha bounds, lowest ground-contact row,
support-footprint center X, and — for eat-low/eat-lift — the measured muzzle tip point;
for play-reach the raised paw tip point. The runtime translates each pose onto the shared
floor anchor (795, 970) at scale .847 and places props from these measurements.

## Props (separate transparent files, 512×512 canvas each)

Props are separate art the runtime positions, moves and mirrors independently on the real
floor; never bake them into a dog pose, never draw them huge.

5. `milky-prop-bowl.webp` — small ceramic food bowl, three-quarter view, simple solid
   color, visible kibble inside. Outer width ≈ 400 px on its canvas; drawn resting on its
   own implied ground with the base's bottom-center at the canvas bottom-center (anchor
   (256, 500) ± 12). No shadow (runtime adds a soft contact shadow). Physical size intent:
   outer width ≈ 0.30 × Milky's body length (reads as a small dog's bowl).
6. `milky-prop-ball.webp` — small matte ball (felt/rubber look, one calm accent color, no
   glossy highlights or logos), diameter ≈ 300 px centered at (256, 256), bottom of the
   ball at (256, 406). Physical size intent: diameter ≈ 0.16 × body length (a small
   dog's toy ball). Report the exact drawn diameter and center.

## Running / trot — honesty contract

For brisk playful running the runtime first reuses the existing eight v4 gait frames at a
faster, still distance-linked cadence (~1.4×). At the small on-screen size this reads as a
light hurried trot, and the docs say exactly that: brisk stepping of the walk poses, not
authored running anatomy. If root wants a true trot, an OPTIONAL separate set may ship:
`milky-trot-0..3.webp`, 768×512 each — a 4-frame diagonal-pair trot cycle (left-fore +
right-hind grounded ↔ right-fore + left-hind grounded, with two brief suspension-ish
in-between frames), forward-looking head, same body scale and registration rules as the
v4 steps. The runtime will use it only when all 4 decode; until then the faster cadence
stands and no "running" anatomy is claimed. Good anatomy matters more than frame count —
do not ship the trot set unless the four frames genuinely read.

## Related forward-look set (separate worker, for reference)

`milky-forward-idle.webp` (1536×1024) and `milky-forward-step-0..7.webp` (768×512): the
SAME v4 body and reviewed step poses with the head looking ahead in the travel direction.
The runtime integrates that set atomically (all nine decode or none are used) for
locomotion and quiet idle gaze; the camera-look idle remains the greeting face. Eating and
play poses above already look at their targets, so they are unaffected.

## Runtime behavior these assets feed (context for the artist)

Meals: Milky walks to a stable bowl, alternates lowered/lifted head while eating, pauses
with head raised, and the bowl leaves only after she steps away — the bowl never slides
while she eats. Play: a ball rolls and bounces modestly on the real floor with a contact
shadow; Milky approaches, play-bows, nudges with the reach pose and trots after it; the
ball never teleports while the dog stands static. Props respect the floor crop, depth
scale and mirroring. Reduced motion shows static poses with a static prop. Chrome UI is
unavailable in this session, so live playback review of integrated art remains with root,
along with the post-delivery measurements listed above.
