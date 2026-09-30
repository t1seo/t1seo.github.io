# Milky — forward gaze artwork

## Delivered assets

The nine-file set under `public/assets/cyberpunk/` contains:

- `milky-forward-idle.webp`: 1536 × 1024.
- `milky-forward-step-0.webp` through `milky-forward-step-7.webp`: 768 × 512 each.

Total encoded size: **840,410 bytes**. All files decode as RGBA WebP. This change contains artwork and registration documentation only; the companion controller is owned by the integration worker.

The supplied private photograph `/Users/cillian/Downloads/20150817_211702.JPG` and the shipped v4 idle/eight walk frames were inspected before editing. The photograph remains private and is not copied into the project.

## Intended behavior and likeness

Milky now looks naturally toward screen right, along the body's travel direction. The near eye, compact muzzle, small black nose, short drooping ears and slight pant remain coherent across the set. The original happy, camera-facing v4 idle remains appropriate for greeting; this side-looking standing pose can be used before travel and during quiet attention. The runtime can mirror the entire sprite when walking left.

The forward idle was independently approved before generating the walk frames. Its body, tail and four standing paws remain closely registered to v4: the four sampled dorsal heights differ by at most one native pixel, and the lowest visible fur remains at source y970. This is a generated likeness of Milky, not an exact photographic extraction; the original reference is viewed from above/front and does not prove an exact side-profile likeness.

Each walk frame was edited from its matching v4 pose, preserving the four-leg gait phase. Frames 0 and 1 received head-only registration refinements after their initial heads projected too far right. Frame 2 was regenerated from the original full-resolution v4 source to improve body/floor registration. All eight retain distinct planted and recovering paws; frame 6's four legs were specifically reviewed for separation.

## Registration and honest limits

`milky-forward-registration.json` records final dimensions, hashes, byte counts, original and new alpha bounds, nose landmarks, dorsal contours and inherited paw inspection windows. Bounds are inclusive; inspection-window endpoints are exclusive. Step coordinates must be doubled for the shared 1536 × 1024 source space.

Use the existing common **center x795 / floor y970** body transform initially, with **zero per-frame whole-body offsets**. Do not recenter by silhouette bounds, align all noses using whole-body shifts, or vertically snap each frame to its lowest paw. A turned head's nose is not the same anatomical registration landmark as the original camera-facing nose.

The standing body is closely preserved, but generated walking edits also redraw small parts of the torso and fur. They are pose approximations, not pixel-locked body plates or motion capture. Final step nose spread is **19.01 px horizontally / 15.77 px vertically** at exported 768 × 512. The torso median height spans **24 px** across the eight poses; sampled dorsal changes from the matching v4 frames range from **−10 to +11 exported pixels**. These numbers describe residual frame variation, not approved correction offsets. Some head/body bob and fur variation remain.

The last refinements reduced frame 0→1's nose-height jump from about 19 to **6.36 exported pixels** without translating the body. Independent static review accepted identity, four-leg anatomy and transparency. It does not certify natural playback at the final CSS size. A Chrome preview was attempted explicitly, but the browser tool returned `Browser is not available: chrome`; live integrated gait smoothness remains unverified. No Safari or alternate browser automation was used.

## Transparency checks

All nine final files have alpha minimum 0 and maximum 254. All six established exterior samples are alpha 0. Pixels with alpha greater than 32, farther than 20 exported pixels from opaque fur (40 pixels for the native-size idle), are **zero in every file**. Fine-hair partial alpha remains around the animal.

Some image-tool previews expose stored RGB colors underneath fully transparent pixels as a glow. The recorded alpha samples and distance checks distinguish those hidden colors from a real background wash. No floor, shadow or background was painted into the selected assets.

## Production method and prompt set

Used only the built-in `image_gen.imagegen` tool for generation and edits, with `transparent_background: true`. Fourteen calls produced one master, eight initial walk frames, three revisions and two final registration refinements. Every local reference was viewed before it was used. Final export is a whole-image `cwebp -q 92 -alpha_q 100` conversion, adding `-resize 768 512` for walking frames. There was no Python image editing, masking, compositing, head replacement, limb rigging, bounding-box recentering or per-frame translation. Python/Pillow/NumPy/SciPy only read image pixels and wrote measurement JSON.

The prompt set used these constraints:

1. **Forward master:** Image 1 is the v4 standing edit target; image 2 is the real Milky identity reference. Change only head and upper-neck orientation toward screen right. Show a compact profile/soft three-quarter muzzle, mainly the near eye, and a content closed or slightly panting mouth. Preserve the same torso, tail, four paws, lighting, physical scale and fixed 1536 × 1024 composition. Keep body center x795 and source ground y970; true alpha outside fur, no floor, shadow, halo, text or props.
2. **Walk frames 0–7:** Image 1 is the matching v4 walking edit target; image 2 is the approved forward idle's head design only. Preserve image 1's torso, tail and each of its four planted/lifted leg poses at twice the 768 × 512 coordinates. Replace only the camera-facing head with the same right-looking Maltese head; aim for the reference head size and nose near source (1372,326), without recentering or moving the body. Do not copy standing legs. Preserve transparent margins and fine fur.
3. **First head registration correction:** Use initial forward frame 0 or 1 as the target and forward frame 4 as the design/placement reference. Request only a small head/upper-neck translation toward nose (1400,325): frame 0, 45 px left and 25 down; frame 1, 48 left and 10 up. Preserve all body and paw positions. These requested distances are prompt targets, not claims of exact achieved movement.
4. **Frame 2 body-preservation revision:** Use the original native 1536 × 1024 v4 frame 2 as the edit target and forward frame 4 as head reference. Replace only the head, keep original torso contour and all four paw coordinates, and avoid lifting the body. Preserve the right-looking compact head and actual alpha.
5. **Final small head corrections:** Use the revised frame as target and forward frame 4 as reference. Keep everything below y450 fixed; request nose near source (1400,326), frame 0 moving its head 15 px left/15 up, frame 1 moving 12 left/23 down. Preserve head scale, identity, rightward gaze, four legs and body registration. Final measured results, rather than requested translations, are recorded in the JSON.

Selected native PNG names and their generated-image directory are recorded under `nativeGenerationSources` in the registration JSON. Runtime files are committed in the project and do not depend on those local source paths.

## Concrete checks

- Viewed the private identity reference, v4 idle and all eight original poses.
- Independently reviewed the forward master before the eight-frame batch.
- Viewed all generated frames and reviewed final four-leg phases, short ears, compact muzzle and forward gaze.
- Decoded all nine exported WebPs and recorded dimensions, byte counts, hashes, alpha samples, fur-distance statistics and registration measurements.
- Kept source changes restricted to the nine new artwork files and these two documents.
- Application tests/build are not relevant to this asset-only change; root owns integrated loading, behavior and Chrome playback checks.
