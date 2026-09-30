# Milky resting poses — delivered artwork

## Delivered set

Three independent transparent RGBA WebP images are committed under `public/assets/cyberpunk/`:

| File | Canvas | Size |
| --- | --- | --- |
| `milky-rest-sit.webp` | 1536 × 1024 | 194,564 bytes |
| `milky-rest-drowsy.webp` | 1536 × 1024 | 202,736 bytes |
| `milky-rest-sleep.webp` | 1536 × 1024 | 138,606 bytes |

Total: 535,906 bytes. Optional sitdown/wake transitionals are not produced. The runtime should request only the three delivered names.

These are photo-derived generated poses of the same Milky identity as `milky-v4-idle.webp`, with the private happy photograph `/Users/cillian/Downloads/20150817_211702.JPG` used only as an identity reference. The private photograph was viewed, never copied into public assets.

## Visual decisions and review

- Sit: natural haunches and folded hind legs, two upright planted forelegs, a relaxed open-mouth smile and curled tail beside the haunch.
- Drowsy: real sternal lying posture, folded hindquarters and extended forepaws; closed mouth and open calm eyes. The head remains fairly alert, so it reads as comfortably awake rather than visibly falling asleep.
- Sleep: eyes and mouth fully closed, head resting on the forepaws, low relaxed silhouette. The first sleeping candidate enlarged the body slightly. One image-generation refinement reduced its width from 1,413 to 1,327 pixels, close to drowsy's 1,338 pixels, while preserving a natural sleeping pose.
- Independent read-only review accepted all three for identity, anatomy, physical scale and static alpha quality. It found no additional regeneration blocker.

The physical head, paws and torso remain approximately the same size; the sleeping silhouette is deliberately much lower. No height normalization, limb warping, body squashing, atlas packing, compositing or Python image editing was used. These are generated pose approximations, not exact photographic extractions or a kinematic rig.

## Registration required by the runtime

Exact measurements and methods are in `docs/milky-rest-registration.json`. All coordinates below are native 1536 × 1024 pixels. Bounding-box right/bottom values are exclusive; contact rows are inclusive.

| Pose | Alpha >32 bounds | Support-footprint center X | Lowest contact row Y | Translation to contract (795,970) |
| --- | --- | --- | --- | --- |
| Sit | [329,49,1317,978] | 889 | 977 | (-94,-7) |
| Drowsy | [146,240,1484,952] | 932 | 951 | (-137,+19) |
| Sleep | [112,475,1439,916] | 898 | 915 | (-103,+55) |

The support center is a manually reviewed midpoint spanning grounded folded hindquarters, belly where appropriate, and both forepaws. It excludes the curled tail. It is **not** the center of the last occupied alpha row, the head, or the full silhouette. A last-row-only method would incorrectly anchor the seated pose near X1030 because its closest front paw is lowest in this camera perspective.

The native outputs do not share an exact floor row. In particular, the sleeping refinement improved physical size but ignored the requested Y970 baseline; it needs a +55 native-pixel vertical registration correction. This is deliberately documented rather than described as pixel-perfect generation. Use the per-pose measured contact point at the existing v4 physical render scale, then verify held pose swaps in Chrome. Do not scale each image to the same silhouette height or use the full alpha-bounds center to register the pose.

## Alpha and conversion checks

- All final WebPs decode as 1536 × 1024 RGBA, alpha range 0..254.
- Whole-image conversion only: `cwebp -q 92 -alpha_q 100 SOURCE.png -o DESTINATION.webp`. No resize was needed.
- Final WebP alpha matches the selected source PNG alpha exactly.
- For every file, zero alpha >32 pixels lie more than 40 native pixels from alpha >200 fur.
- All six new exterior probe points are alpha 0 in all three poses.
- The existing v4 probe (900,360) falls **inside the head** for sit and drowsy (alpha 252 and 253 respectively), so it is recorded as occupied, not misreported as a halo. The other five legacy probes are clear in those poses. All six legacy probes are clear for sleep.
- Tool previews may display colored RGB beneath transparent pixels as a glow. The numeric alpha checks distinguish those invisible colors from a real backdrop. A small number of very faint alpha pixels outside the fine-fur neighborhood remain (22 sit, 30 drowsy, 18 sleep), all at alpha ≤32.

This asset-only branch does not change application code or claim Chrome playback verification. Root owns integration, browser checks and the scene's runtime shadow/breathing. No floor, cast shadow, accessories, text, Zzz or cartoon effects are baked into these assets.

## Selected native generation sources

Built-in `image_gen.imagegen` with `transparent_background: true` was used for every generation. Every local reference was inspected before use. The public WebPs are self-contained and do not depend on these native source paths.

Source directory: `/Users/cillian/.codex/generated_images/01a0f0a4-a1c1-7873-9fcd-12762774855b/`.

| Result | Native source |
| --- | --- |
| Selected sit | `exec-eb93f8b7-1401-47dc-bbc5-9516aea2a1cc.png` |
| Selected drowsy | `exec-2c670665-a68e-4762-b761-a6d53f01df6f.png` |
| Initial sleep, rejected for relative size | `exec-4687fb44-88f8-441d-9d30-7afacab23e9c.png` |
| Selected sleep refinement | `exec-fec2ccc4-d97b-43fe-a56a-26dd528a20c6.png` |

## Actual prompts

### Seated identity pose

```text
Use case: identity-preserve.
Asset type: one photo-real transparent full-body dog pose for a 2.5D studio website, milky-rest-sit.
Input 1 is the current full-body Milky and determines this SAME dog's exact face, fur, proportions, indoor lighting and photographic style. Input 2 is the private photograph of the same real dog and further guides his friendly expression. Output only the dog, never the photograph's room or furniture.
Primary request: genuinely re-pose this specific small white Maltese into a comfortable anatomically correct SEATED pose. Body points right in the same three-quarter side view; face turns gently toward the viewer. Hindquarters and folded hind legs rest on the ground, chest upright, two natural front legs straight and planted; exactly four anatomical legs total (folded hind legs can be partly occluded). White plume tail curls beside/behind the left haunch, not a second limb. Happy relaxed round dark eyes, compact black nose, short drooping furry ears, slightly tousled white head hair and clipped-short white body coat. Small relaxed open mouth, a little pink tongue, natural smile.
Registration: output a 1536 x 1024 landscape transparent canvas, at the SAME PHYSICAL DOG SCALE as input 1. Keep the head, torso, paws the same real size as input 1. Seated dog is naturally narrower, not stretched or uniformly shrunk to fit. Ground-contact row approximately y970 with comfortable margin below; ground footprint centered approximately x795, allowing normal forward front paws at right. Keep the full head, tail and all paws inside canvas. Preserve camera distance and soft lighting, realistic fine fur.
Transparent background: actual alpha zero in all empty space with fine fur antialiasing only. No floor, cast/contact shadow, backdrop, fog, halo, glow, color wash, border, mat, scene, text, cartoon symbols, clothing or accessory. Do not render a checkerboard. Do not turn into an illustration, 3D toy or plush. Do not create a standing dog compressed by scaling; draw a real seated dog. One single dog, one pose.
```

### Lying awake pose

```text
Use case: identity-preserve.
Asset type: milky-rest-drowsy, a single photoreal full-body transparent dog sprite for a 2.5D studio website.
Input 1 is the accepted seated Milky identity; input 2 is this SAME dog's existing standing image and physical-size reference. Preserve this particular dog's face, short floppy ears, compact black nose, natural round dark eyes, tousled white head fur, clipped white body fur and curly white plume tail. Preserve photographic realism, camera angle/distance and soft indoor lighting.
Change pose to a real relaxed sternal LYING AWAKE / sphinx position. Body faces right, face three-quarter toward viewer. Belly, chest and folded hindquarters rest comfortably on the invisible ground, both forelegs extend forward along the ground to the right with natural separate forepaws. Four anatomical dog legs only; hind legs are naturally folded and partly occluded, not extra front paws. The head is raised comfortably above the forepaws, mouth gently closed, eyes soft and slightly heavy but still open. Tail lies curled beside the left haunch. This is a content dog settling down, not sick or sad.
Registration: one 1536 x 1024 landscape canvas with true transparent background. Match PHYSICAL head/body/paw size of the reference, never stretch or squash the standing photograph. Because this dog is lying, the silhouette must be much shorter in height than the sitting/standing poses, with plenty of clear empty space ABOVE the dog. The head remains approximately the same 450-480px wide as reference (not enlarged to fill canvas); head top around y350-420, relaxed back around y620, contact paws and belly end around y970. Entire resting body including curled tail and forward paws stays within roughly x200..1390, support footprint centered around x795. No extremity cropped.
True alpha zero everywhere outside actual fur, with only fine hair antialiasing. No ground/floor, contact/cast shadow, backdrop, gray halo, fog or wash; no pillow, bed, rug, collar, accessory, lettering, Zzz, hearts or other cartoon effects. One single dog, one pose. Do not redraw as a toy, plush or illustration.
```

### Initial sleeping pose (not shipped)

```text
Use case: identity-preserve.
Asset type: milky-rest-sleep, one photoreal transparent full-body asleep dog sprite.
Image 1 is the accepted LYING AWAKE Milky target. Image 2 is the same dog's seated identity reference. Re-pose image 1 minimally into peaceful comfortable SLEEP: lower the head fully onto or immediately beside the two front paws, naturally folding the neck; both eyes fully closed and mouth fully closed. The head must truly rest down at paw level, not remain upright with eyes merely shut. Short drooping ears fall naturally. Keep a low, subtly curled sternal sleeping dog, belly, chest and folded hindquarters already comfortably down. Keep the four-legged anatomy, curled plume tail beside left haunch, exact physical head/body/paw size and camera distance. Body still points right and face is visible in three-quarter view toward viewer. Do not change the dog into a puppy, toy or different Maltese.
Match image 1's entire torso, hindquarters, tail and their positions as closely as possible; changes concentrate on relaxed forelegs/neck/head. Legs stay natural and folded, never straight standing legs compressed or squashed. Preserve realistic white fur, same short ears, compact black nose, lighting, and face identity. Restful stillness with no motion indicator.
Registration: 1536 x 1024 landscape canvas and true transparent alpha. All ground contacts remain near y970 (allow about ±20px) and footprint around x795; maintain roughly the existing lying body region. Head moves DOWN to rest physically on the paws, producing a compact silhouette only roughly 430-500px tall in the LOWER canvas with abundant empty alpha above. Do NOT enlarge or rescale the dog to fill the upper space. All fur, tail and paws fully inside the canvas.
Every empty pixel must be alpha 0, fine fur antialiasing only. Absolutely no floor or cast/contact shadow, background, halo, glow, wash, fog, bed, pillow, blanket, collar, text, Zzz, bubbles, hearts, cartoon effects or accessories. A single sleeping dog only, photographic detail.
```

### Selected sleeping size refinement

```text
Use case: identity-preserve.
Image 1 is a very good sleeping Milky pose; retain that exact comfortable sleeping posture, closed eyes, closed mouth, head resting on front paws, folded hind legs, curled plume tail, face identity, photographic fur and natural anatomy.
Image 2 is this same dog's lying-awake physical-size/camera reference. Image 1 accidentally enlarged the dog slightly and left its paws too high above the required baseline. Correct ONLY the size and canvas registration of image 1: make the entire dog approximately 92% of its present physical size, preserving all proportions, and place its lowest substantial paw-contact row at y970 on an unchanged 1536x1024 canvas. Keep the complete dog approximately centered x795. Aim resulting alpha bounds about x140..1440 and y540..972. This is camera-size calibration, not a new pose. Do NOT lift the head, open the eyes, stretch the body, crop extremities or make a different dog. The head/ears must be the same physical size as image 2, with only their lying-down orientation changed; do not make a giant round puppy head.
True transparent alpha outside fine fur. Absolutely no floor, contact shadow, cast shadow, backdrop, haze, glow, halo, colored wash, texture in empty space, bed, pillow, accessory, text or cartoon symbols. Preserve abundant empty transparent space above the low sleeping silhouette. One single whole dog.
```
