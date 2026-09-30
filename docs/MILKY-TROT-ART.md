# Milky: optional diagonal trot art

Four transparent assets add a distinct light trot, with alternating diagonal supports and two short suspension poses. The approved forward-looking Milky master supplied identity, body proportions, fur, lighting and gaze. No app/controller files are changed by this asset commit.

## Delivered assets

`public/assets/cyberpunk/milky-trot-0.webp` through `milky-trot-3.webp`, each 768 × 512 RGBA; total **285,220 bytes**. Use all four atomically, in numerical order, or keep the existing gait fallback.

| Frame | Leg phase | Lowest opaque body pixel Y | Clearance from observed floor |
| --- | --- | ---: | ---: |
| 0 | Near fore + far hind support; other pair lifted | 471 | 0 |
| 1 | Suspension; near fore back, near hind forward | 429 | 42 |
| 2 | Far fore + near hind support; other pair lifted | 469 | 2 |
| 3 | Suspension; near fore forward, near hind back | 446 | 25 |

“Near” means the side nearest the camera. Far paws naturally project slightly higher in the three-quarter view. Measurements use alpha > 200 to exclude faint fur fringes, and are not collision geometry.

## Registration

The generated set's common contact floor is **Y ≈ 471**, versus the requested Y 485; canvas center remains X 397.5. The source files are **not shifted or warped**. Keep one shared floor anchor and scale for all four frames. If the runtime aligns to its existing Y 485, the corresponding set-wide adjustment is +14 delivered pixels (+28 in the 1536-source coordinate system), applied equally to all four. Never bottom-align each frame: that would erase suspension and cause the torso to slide. Do not translate whole-body frames to chase the nose.

The first suspension deliberately rises more than the second. Its nose is about 9 delivered pixels higher, with the body following a modest hop; the other three nose positions remain approximately stable. Fur and small limb details are generated rather than physically rigged, so there is residual frame variation. This is a compact four-pose trot, not a full gallop or motion-captured run.

Exact file hashes, alpha statistics, source paths and manually inspected paw/nose landmarks are in `milky-trot-registration.json`.

## Production and prompt set

Built-in **image_gen** was used for every generation/edit, with `transparent_background: true`. The final images were whole-image converted/downsampled using `cwebp -q 92 -alpha_q 100 -resize 768 512`. No Python image editing, masks, collage, limb warping or manually painted fixes were used. Pillow was used only to read image metadata and validate alpha.

Master: `milky-forward-idle.webp` from the separate forward-gaze worktree. The exact common production direction was:

> Use case: precise-object-edit. Deliver exactly ONE animation frame of Milky, an existing small white Maltese, on a genuinely transparent RGBA background. Image 1 is the sole identity/shape/lighting/registration master: maintain the EXACT same forward-right looking face, black nose, tiny relaxed pink tongue, short silky white ears, curled plume tail, body proportions, white fur texture and photographic lighting. It is for a four-frame brisk DIAGONAL TROT loop, not a walking loop or a leap. Lock head, torso, rump and tail at exactly their reference positions. Change ONLY all four leg articulation into the requested trot phase; preserve four anatomically attached legs, distinct far legs naturally occluded by near ones, no extra limbs. Body faces screen-right, eyes look ahead to screen-right, never toward viewer. Camera and body are the same slight three-quarter side view as master. Canvas 1536x1024: maintain head at upper-right and tail at upper-left, same body scale and unchanged torso pixels where possible. Imagined floor is y970, body anchor center795. No actual floor, NO shadow, no environment, no text, no border, no collage, no guides. Leave transparent margin. Crisp fur edges and restrained natural limb flex, no smeared paws.

Four initial calls requested: (0) near fore/far hind contact; (1) short collected suspension after that pair; (2) far fore/near hind contact; (3) complementary suspension returning to frame 0. Initial frames 0/1 did not reverse the near/far hind leg pattern clearly enough. The independent reviewer rejected that loop; those candidates were not shipped.

The final targeted frame-0 edit kept head, torso, tail and both front legs unchanged, and explicitly requested:

> Bend this large NEAR hind leg FORWARD beneath the belly, its fluffy lifted paw ending around x670,y840, clearly ABOVE the floor. The smaller FAR hind leg should now extend BACK toward the left, passing BEHIND the near thigh, with its smaller paw PLANTED at x300,y945. Forelegs remain as image: large near fore planted far-right at x1280,y945, small far fore folded in air. Thus contact is NEAR FORE plus FAR HIND only; the large visible near hind and small far fore are both suspended.

The final targeted frame-1 edit kept the head, torso and tail unchanged and requested:

> LARGE NEAR FORELEG bends BACK under the chest and paw curls rearward toward x960,y850. SMALL FAR FORELEG extends FORWARD from behind it toward x1320,y885. LARGE NEAR HIND leg swings FORWARD beneath belly, bent stifle, lifted paw reaches x730,y865. SMALL FAR HIND leg extends BACK from behind the near thigh with lifted paw at x260,y895. All four paws visibly off the common floor y945, a restrained 40–95px clearance; no giant leap or gallop, no full-body shift. This must visibly reverse the near-side limb reaches from original: near fore BACK, near hind FORWARD.

Frame 1 then received a **background-extraction-only** edit to remove low-alpha haze while preserving canvas registration, identity and every paw position. Empty-space alpha improved from 4.4% completely transparent to 63.6%; final independent review confirmed that the pose and identity remained intact. All final sampled corners and empty regions have alpha 0.

## Verification and limits

- Independent visual reviewer approved the final 0 → 1 → 2 → 3 sequence's static anatomy, alternating supports, forward gaze and identity continuity, then separately reapproved alpha-clean frame 1.
- All four files decode as 768 × 512 RGBA, have alpha range 0–254 and over 60% fully transparent pixels. The seven sampled empty-space positions per asset are alpha 0. No baked floor/shadow was requested or observed in the dog silhouettes.
- Final files were re-opened visually after conversion. Dimensions, hashes and total bytes were recorded locally.
- **Actual Chrome playback/cadence was not verified by this asset worker.** Root must assess the four-frame timing in the integrated controller and may retain the faster walk fallback if the trot cadence is not convincing. Do not claim rigged realism from static-frame approval.
- No further network requests were made after the root reported network permission revocation; final conversion, alpha checks, metadata and commit used already-saved local images only.
