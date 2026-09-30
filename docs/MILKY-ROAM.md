# Milky — photo identity and unchoreographed floor walks

The controller uses the original photo-derived `milky-awake.webp` at rest and the matching
`milky-v3-step-0.webp` through `milky-v3-step-7.webp` independent side-view frames in motion. No v2 illustration, frontal walk,
or behavior sheet is requested. The gait filenames are versioned so old cached limbs cannot appear. All eight images must
finish decoding before either manual or automatic walking is enabled. A missing, malformed,
or undecodable frame leaves the photo still; it cannot show an incomplete gait.
Final frame registration is recorded below.

## Behavior

- Clicking Milky selects a new short destination from 24 varied safe candidates. There is no
  alternating left/right or front/back counter. Candidate distance and shallow depth change
  vary; continuing the previous horizontal heading receives more weight than reversing.
- The visible, cropped floor remains the source of bounds. A clipped candidate is rejected
  if it would become a largely vertical slide. Arrow up/down use an actual diagonal.
- While the intro is hidden, each rest schedules one random 9–18 second pause and then a
  quiet short wander. Autonomous walks emit no `cyber:pet` events, so they cannot announce
  themselves or reset the intro's inactivity timer.
- Distances drive all eight limb frames. Acceleration and deceleration use the existing
  physically scaled motion helper, with one cycle over 64% of the visible body length. This is calibrated from the
  near hind paw moving ~395 px backward through the stance half-cycle, against a
  ~1230 px body silhouette: 2 × 395 / 1230 ≈ .64.
- A fresh walk starts on phase 4, whose planted near hind paw matches the standing photo;
  it does not instantly stretch that paw ~400 px forward into phase 0.
- A same-heading interruption keeps its current speed and location. A reversal first pauses
  on the original three-quarter pose for 240 ms, then faces the other way. There is no fake
  3D squash, crossfade between different dogs, or static-image sliding fallback.
- Keyboard focus pauses autonomous wandering until blur; explicit arrow/click input still
  works. A hidden page, inactive scene/modal, reduced motion, missing original identity,
  malformed gait, or destroyed controller cannot retain an animation loop or roaming timer.

## Checks

`npm run build` passed. `npm test` passed all 60 tests, including destination variety,
continuation weighting, mobile containment, failed/undecodable-frame fallback, all eight
frame indices, phase-4 start, intro/focus/hidden/reduced-motion cleanup, and no automatic
announcement events. These are code and simulated-DOM checks, not a Chrome visual gait test.

The eight final WebP poses were individually viewed and their alpha/registration inspected.
All are 768×512 and together use approximately 630 KB. Alpha is genuinely transparent;
RGB blocks outside the furry silhouette in some image viewers have alpha zero and are not
visible browser pixels. Front and rear paw positions differ across the poses.

## Artwork registration

Original idle alpha >32 bounds are x194..1428, y78..973 on a 1536×1024 tile. Its scale .82
keeps apparent body width at ~66% of the pet button. The same .82 scale applies to every
walking image; no per-frame bounding-box scaling changes the head or torso size.

Using the same dark nose ROI on each final export, the original idle center is
(1174.01, 395.02) in 1536×1024 source coordinates. The final step nose positions, after
converting the 768×512 exports to source units, are:

| Frame | Nose x | Nose y | Horizontal correction |
| --- | ---: | ---: | ---: |
| 0 | 1174.50 | 395.64 | −0.49 px |
| 1 | 1174.02 | 396.39 | −0.01 px |
| 2 | 1173.81 | 395.40 | +0.20 px |
| 3 | 1174.94 | 395.63 | −0.93 px |
| 4 | 1179.74 | 395.85 | −5.73 px |
| 5 | 1176.16 | 397.71 | −2.15 px |
| 6 | 1176.45 | 396.15 | −2.44 px |
| 7 | 1176.09 | 396.96 | −2.08 px |

Only those small horizontal offsets are corrected. Vertical registration remains common;
foot heights vary with lifting and the three-quarter view. Forcing every paw silhouette
onto the same baseline would make the face/torso bob. The final face height deviation is
under 3 source pixels (less than 0.4 displayed pixels at the normal desktop pet size).

The controller uses independent still poses. Direction changes pause on the original
three-quarter photo before mirroring; this is not a fully modeled 3D turn. At a walk's end,
the dog returns to the original standing pose rather than playing a separate authored
feet-together transition. Those are limits of the delivered animation, not tested claims
of fully natural filmed locomotion.
