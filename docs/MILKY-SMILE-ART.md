# Milky v4 — smiling photo identity

## Delivered assets

The private reference is `/Users/cillian/Downloads/20150817_211702.JPG`. It shows Milky looking up, with bright round eyes, a small black nose and a relaxed open-mouth smile. The image was inspected directly. The private photograph is not copied into public assets.

This scoped change provides ten RGBA WebP images under `public/assets/cyberpunk/`:

- `milky-v4-idle.webp` and `milky-v4-blink.webp`: 1536 × 1024.
- `milky-v4-step-0.webp` through `milky-v4-step-7.webp`: 768 × 512.

Total encoded size is 1,070,746 bytes. Idle plus all eight walk images are the required identity set; blink is an optional micro-pose. Attend and sniff are intentionally not provided because maintaining body registration took priority over extra behaviors. The Fable worker separately owns the runtime; this commit does not modify code.

## Identity and pose decisions

The original happy photograph guides the face: natural dark eyes, compact black nose, softly drooping short ears, tousled white hair, a small pink tongue and an open happy mouth. The approved master keeps the established side-view body and curled plume tail. It is still a photo-derived generated approximation; it is not an exact photographic extraction from the new reference.

Each walk frame was edited independently from its corresponding verified v3 pose. Four anatomical legs, the differentiated front/hind contacts and the lifted recovering hind paws remain. These are whole-body raster frames, not a generated atlas, CSS limb rig, or a programmatically warped photograph.

The first walk batch changed head position too much. Targeted head-only revisions improved frames 0, 1 and 2. Revisions of frames 3 and 5 moved the torso and were rejected in favor of their earlier v4 versions. A frame-1 revision introduced a faint alpha wash and was re-extracted using native image generation. No frames were edited using Python, masking scripts or limb compositing.

## Registration and remaining limits

See `docs/milky-v4-registration.json` for dimensions, byte sizes, hashes, bounds, nose landmarks, expanded paw inspection windows, dorsal contours and alpha measurements.

The final idle nose centroid is (1145.39, 353.34), and blink is (1146.53, 352.79), in their native 1536 × 1024 coordinates. The nose measurement selects the largest connected dark component in a specified ROI; it differs from the old v3 all-dark-pixel ROI mean, so comparisons must not silently treat both methods as identical.

The eight walk frames still have a 20.35 px horizontal and 7.28 px vertical nose range at 768 × 512. The supporting front-paw bottom varies approximately 20 px across the selected poses. At the usual small scene rendering this is around 3 px, but it can still produce visible jitter. Four dorsal-contour measurements and their median are included to inspect the torso independently of the redrawn face.

**Do not blindly apply the entire nose-offset table to the whole dog.** The measured head changes are not all body translations. Moving the whole sprite to align a nose can move planted feet and worsen sliding. Prefer a shared body-space transform or carefully bounded corrections, with live replay used to judge the result. Do not align every frame by its alpha bounding box or lowest foot.

Independent static review found no severe anatomy or alpha blocker and accepted this best set for integration. It did not certify physically natural live motion. Chrome live playback remains unverified because the approved browser integration was unavailable; no Safari or alternative automation was used.

## Alpha verification

All ten final WebPs decode as RGBA with alpha minimum 0. All six established clear-space samples are zero in every file. Pixels above alpha 32 more than 20 exported pixels (40 in the 1536-wide files) from opaque fur are zero throughout.

Some image-tool previews show RGB colors retained under alpha 0 as a gray glow. Those colors do not form a visible backdrop in correct alpha compositing. Raw RGBA inspection distinguishes them from the real faint alpha regression that was removed from frame 1. The checks here are encoded alpha measurements, not a claim that a live Chrome composition was observed.

## Production method and prompts

Used the built-in `image_gen.imagegen` tool with `transparent_background: true`. Every local reference was viewed before use. Final WebPs are whole-image `cwebp -q 92 -alpha_q 100` conversions; walking frames also use `-resize 768 512`. Python/Pillow/NumPy/SciPy only read pixels and write measurement JSON.

Prompt set (the frame number and file references vary per call):

1. **Master**: Image 1 is the registered idle body target; image 2 is the real smiling dog. Keep exactly four grounded paws, body, tail, lighting and camera. Change only the head to the natural bright eyes, compact black nose, short ears and happy small open mouth with pink tongue of the photo. No giant teeth or toy eyes. True transparent alpha outside fine fur.
2. **Walk**: Image 1 is the matching v3 walking frame, image 2 the happy master. Change only the sad head to the master identity. Preserve the target torso, tail, exactly four leg poses and every lifted/planted paw. Do not adopt the master standing legs. Output one independent transparent full-body frame.
3. **Head correction**: Match the approved frame-7 head size, expression and location while preserving the target frame's body and four leg positions. For frame 2, specifically move the head about 19 px left and 3 px down in 768-wide coordinates.
4. **Alpha repair**: Edit only the background alpha; preserve the existing four-legged dog and all positions. Every pixel outside actual fur must become alpha 0, with only fine hair antialiasing.
5. **Blink**: Close both eyes naturally; keep smile, mouth, tongue, nose, fur, ears, tail, body, four paws and all positions unchanged.

## Selected native sources

Selected PNGs remain in `/Users/cillian/.codex/generated_images/01a0f047-5e2d-7041-b5b5-2b8999b45469/`. Public runtime assets are committed in the project and do not depend on these private source paths.

| Asset | Native PNG |
| --- | --- |
| 0 | `exec-4cb1976a-4701-4cd9-90fe-674517838409.png` |
| 1 | `exec-3a894f6c-cc09-48c6-a1d8-bd12560fdf45.png` |
| 2 | `exec-c998bbb5-d708-446d-903f-b03eb88cf315.png` |
| 3 | `exec-ddb3cce3-7d18-4d28-a37f-7936c358d779.png` |
| 4 | `exec-2fda74d2-ca59-410d-aeec-bc805cf1588a.png` |
| 5 | `exec-4d203e96-67cc-47e3-9dfc-d1a17a24b34f.png` |
| 6 | `exec-c238e761-8ac8-48e0-b767-b3226a4270a4.png` |
| 7 | `exec-1ea15d4b-5e67-4cc5-a88e-b266b3f48733.png` |
| idle | `exec-8de5b519-3be1-402e-8c18-4f29b0ebbbd4.png` |
| blink | `exec-b0d66e1a-ab88-44a5-b168-665dad37fcb3.png` |

## Concrete checks

- Decoded all ten final WebPs; verified expected dimensions, SHA-256 and encoded size.
- Checked each final file's six exterior alpha samples and distance-from-opaque-fur alpha statistics.
- Inspected all eight frames and the original v3 poses for leg count, supporting/recovering paws and identity.
- Independently reviewed the final ten images, including idle/blink alignment and known registration limits.
- No application tests or build were run in this asset-only branch; root performs integrated runtime checks.

