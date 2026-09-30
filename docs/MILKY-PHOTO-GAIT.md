# Milky photo gait — v3

## Scope and output

The user preferred the original photograph-derived `milky-awake.webp` to the v2 illustrated dog and reported frozen hind legs. This revision keeps that photo identity and replaces the walking artwork with eight independently generated, inspected frames:

`public/assets/cyberpunk/milky-v3-step-0.webp` through `milky-v3-step-7.webp`.

Each exported frame is 768 × 512, RGBA WebP, q92 / alpha q100. Total: 633,642 bytes. The original `milky-awake.webp` remains the idle artwork. No v2 front-facing or behavior artwork is needed by this gait. Eight decoded frames use approximately 12.6 MB of RGBA pixel storage instead of approximately 50 MB for eight full-resolution sources.

## Identity and reference review

Read the original four supplied photographs and the seven subsequently supplied photographs, including the 2016/2017 outdoor portraits, Milky 1–4 and the Santa image. The established awake cutout is the registration and rendering reference. Real-photo features retained include the broad black nose, natural dark eyes under irregular forehead hair, short floppy ears, clipped white torso and curled plume tail. The user-supplied photos and video are not included in public assets.

## Production method

Built-in `image_gen.imagegen`, always with `transparent_background: true`; no external image API and no programmatic drawing, masking or limb warping. Final exports are whole-image `cwebp -q 92 -alpha_q 100 -resize 768 512` conversions. Python/Pillow/NumPy were used only to read pixel statistics and write JSON, not to edit images.

A generated four-pose sheet and an eight-pose sheet were rejected: they repeated extended hind-leg silhouettes. A single forward-reaching hind-leg edit successfully changed the actual joint/paw pose. All further frames were edited individually and kept as separate files, preventing an atlas regeneration from overwriting approved poses.

Independent review tracked both hind paws through forward contact, stance, push-off and recovery. Subsequent edits corrected the opposite front-leg landing at the loop boundary, uneven planted-foot positions, and a 31 px upper-body registration error in an earlier frame 6. Two frames with real translucent background halos were re-extracted using native image generation, then measured again.

## Final prompt set

The invariant instruction for every pose was: preserve the exact photographic Milky face, head, neck, body, ears, curled tail, lighting and 1536 × 1024 canvas; change only the specified leg pose; exactly four anatomical dog legs; no floor, cast shadow, gradient or halo; true transparent alpha outside fur. Short clipped body fur and the original broad nose were explicit constraints. References were inspected before being supplied to the tool.

The movement brief was a calm four-legged walk, with intended contact order near hind → near front → far hind → far front. The table records the final targeted edits in original 1536 × 1024 coordinates. These are editing targets rather than a claim of pixel-exact anatomical motion capture.

| Frame | Final pose / targeted correction |
| --- | --- |
| 0 | Near hind reaches forward under belly; far hind behind; near front rearward stance; far front lowered to forward ground contact, removing the 7→0→1 lifted-paw interruption. |
| 1 | Near hind progresses rearward in stance; far hind begins recovery; near front rearward stance; far front forward stance. |
| 2 | Near hind continues stance; far hind recovers; near front paw lifted under chest; far front planted forward. |
| 3 | Far hind visibly raised under belly; near hind planted foot moved toward x465; near front forward contact extended toward x1380; opposite front remains planted. |
| 4 | Near hind rearward stance, far hind forward contact, near front forward stance, far front rearward stance. |
| 5 | Near hind begins push-off; far hind planted foot advanced through stance; near front planted foot retracted toward x1220; far front rearward stance. |
| 6 | Near hind and opposite front paws visibly recovering; far hind planted foot retracted toward x470; near front planted. Head/body aligned to the same reference as frame 0. |
| 7 | Near hind reaches forward while raised; far hind rearward stance; near front planted foot retracted toward x1050; far front reaches forward to land near x1380/y950. |

Background extraction prompt for the rejected halo versions of 5/6: “DO NOT REDRAW OR CHANGE THE DOG. Preserve exact photographic Milky and all four walking leg poses, head, nose, torso, tail, fur, scale, pixel positions and 1536×1024 canvas. Fix ALPHA MASK ONLY: remove all black/grey gradient backdrop and large cloudy white glow. Every pixel not part of the actual fine fur silhouette must have alpha 0. Keep only fine hair antialiasing; no wide halo, shadow, matting, smoke, fog or floor.” Subsequent single-paw edits preserved this clean alpha.

## Selected native sources

All selected PNGs remain in `/Users/cillian/.codex/generated_images/01a0f007-906f-7bb1-8ded-98e0fd29b345/`.

| Frame | Final PNG |
| --- | --- |
| 0 | `exec-8348cbc2-e08f-43ef-9060-b2413b7eba86.png` |
| 1 | `exec-bc0edd93-07c2-443a-b4f1-ba03b7065f8a.png` |
| 2 | `exec-03ec3662-99e2-46ee-b11e-b17986771ab9.png` |
| 3 | `exec-eb2c02c9-fd1e-4ed8-8208-a7e716f0147d.png` |
| 4 | `exec-4e70573d-3526-4dce-a4a2-4cdb1d3d233a.png` |
| 5 | `exec-38c1028c-2b2a-42f1-9cfe-5f512bb7f3ae.png` |
| 6 | `exec-bc510051-a2d5-40f2-9f69-1247d5ef4b0a.png` |
| 7 | `exec-50ca36c3-9c33-4f4e-80ec-32a77649c79f.png` |

## Checks and integration

`milky-v3-registration.json` records dimensions, byte sizes, SHA-256, alpha bounds, dark-nose ROI centroids, partial-alpha counts, manually selected paw inspection-window bounds and six clear-space alpha samples for all eight final WebPs. Every external sample is zero, including (450,180), the previous halo failure. Partial-alpha pixels are now 15,183–24,654 per frame, confined around fine fur rather than the former approximately 210,000 background pixels. Dark-nose centroid vertical range is only 0.64 exported pixels with the recorded ROI method.

Use common torso/face registration and the same display scale as the awake artwork. Do not recenter each silhouette based on its alpha bounds: moving feet and tail change those bounds. Do not vertically snap every frame to its lowest paw, which would move the stable head. Runtime preloads and decodes all eight assets before walking.

Static-frame review verifies distinct four-leg poses and the corrected rear-leg movement. This is an eight-frame generated approximation, not a physically rigged or captured skeletal animation. Chrome playback assessment remains separate from static-frame and pixel checks; no unavailable browser review is claimed here.

Independent final review accepted the eight assets for integration after the last frame-0 contact correction. The rightmost front-paw contact centers for frames 7→0→1→2 were measured at x676.8→664.4→662.3→630.0, with bottom y478→475→473→476 in exported coordinates, removing the previous forward jump. No extra leg, severe loop regression or background-alpha regression remained in static-frame review.
