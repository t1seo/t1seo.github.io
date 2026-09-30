# Milky B / C — neutral white refinements

User requested the approved B and C logo options to read as a whiter Maltese. These are sibling image edits: the original approved PNG/WebP files stay unchanged. Root handles the gallery and download pack integration.

## B — Paper Smile

- Input: `public/assets/logo-options/smile-02.png` (1254 × 1254, RGBA).
- Built-in imagegen edit, `transparent_background: true`; no CLI fallback and no raster recoloring/postprocessing.
- Generated source: `/Users/cillian/.codex/generated_images/01a0f0b4-3751-7d82-8bf0-5151c58c5da4/exec-8593b604-5bf0-4933-8108-0919d02e2a27.png`.
- Saved PNG: `public/assets/logo-options/smile-02-white.png` (1254 × 1254, 1,488,763 bytes).
- Whole-image WebP conversion: `cwebp -q 92 -alpha_q 100 -resize 512 512`, saved `public/assets/logo-options/smile-02-white.webp` (512 × 512, 49,078 bytes).
- PNG SHA-256: `b0dc4d04f3be55fbc3c72132ccff4caf3af25b65b287139bee27ebbf6c9562ee`.
- WebP SHA-256: `60b4517d59ec3548bf521af1930becd76bf1d3adc4ae5f9461326c25d67c72cc`.

### Exact B prompt

> Use case: precise-object-edit. Edit the supplied approved Milky B paper portrait logo only by neutralizing the fur color: the user wants the dog much whiter, less yellow/beige/ivory. Keep the EXACT same smiling Maltese face identity, glossy dark brown eyes and highlights, black nose, pink tongue and mouth, head tilt, ear shapes, every layered paper fur silhouette, composition, scale and framing. Change only the warm fur and paper-edge shading to beautiful neutral white paper with very gentle neutral pale-gray layered shadows. Preserve the tactile paper grain and dimensional overlapping paper-cut strands, especially the ears and lower cheeks; do not flatten or blow out texture. Fur surfaces are clean soft white, no yellow cast, no blue/cyan cast, and no harsh gray. Keep actual transparent alpha outside the head, no background color, no checkerboard, no text, no new props. This is a color-only refinement of the existing logo, NOT a redesign. Keep all facial features and their colors unchanged. Output a high quality square transparent PNG, same uncropped head and edge padding.

### Checks

- Original and final full-resolution art inspected; exported 512 px WebP inspected. Same happy expression, head tilt, face placement, ear silhouette, and paper-strand style remain visually consistent. Generated edits are not claimed pixel-identical.
- True transparency: PNG alpha 0–255; 700,299 fully transparent pixels. WebP alpha 0–254 with transparent exterior (116,651 fully transparent pixels). Alpha channel is preserved from generation.
- Read-only pixel check on bright, high-alpha fur: median RGB moved from (243, 236, 226) to (238, 238, 238); median R–B warmth moved from 17 to 1. Texture and light-gray layer shadows remain visible instead of clipped white.
- Existing `smile-02.png` SHA-256 remains `95172cbb554f40ee93ed2355eddec432b2905c1bc0e5eaf4ee9217c6fee27f56`.

## C — Hello Milky

Created 2026-09-30 with the built-in image generation edit tool; transparent background enabled. The user requested B and C to look whiter. This subsection records the C edit. Original C remains untouched.

## Files

- `public/assets/logo-options/smile-03-white.png`: generated PNG copied whole, 1254 × 1254 RGBA, 847,835 bytes.
- `public/assets/logo-options/smile-03-white.webp`: whole-image cwebp conversion, 512 × 512 RGBA, quality 94, alpha quality 100, 32,434 bytes.
- Edit target: `public/assets/logo-options/smile-03.png`.
- Generated source: `/Users/cillian/.codex/generated_images/01a0f0b5-a751-77c1-bc2c-336f2de76aaa/exec-4a3dcb4e-22f6-468b-8df8-448a08de34ec.png`.

## Validation

Inspected the original, generated PNG, and final WebP. The smiling face, pose, raised paw, curled tail, and paper-layer styling remain faithful. Fur is visibly neutral white with soft gray paper-layer shading. No raster painting, masking, or recoloring scripts were used. Python/Pillow was used only for read-only measurements.

- PNG alpha range: 0–255; 919,286 fully transparent pixels.
- WebP alpha range: 0–254 after whole-image downsampling; 152,990 fully transparent pixels.
- Among opaque light pixels (`alpha > 240`, RGB channels > 180), mean R−B changed from 24.30 in the original to 0.94 in the new PNG. This confirms the strong ivory/yellow cast is removed while shaded paper layers remain.
- PNG SHA-256: `ce962cff0ed417b60f07b98814d790ba1b1fe9c7e724f33d41c2c497972051b7`.
- WebP SHA-256: `716580ba33a967c4c63fd9a60a7f442c5d0c49b03d5239da67ab2940467ac290`.
- Original C PNG SHA-256, unchanged: `e99bc8ae2763fa1791005fd1b50de6e91412e4091b8974fc21d73f1985aad69c`.

## Exact prompt

```
Use case: precise-object-edit.
Asset type: transparent raster mascot logo, C / Companion Study.
Input image 1 is the EDIT TARGET. Change ONLY the fur color, making this exact Milky dog much more clearly white instead of cream/ivory/beige-yellow.
Preserve exactly the happy open-mouth face, eyes and catchlights, nose, pink tongue, head tilt, short drooping ears, whole body pose, raised front paw, curly lifted tail, silhouette, existing composition and empty margins.
Preserve the sophisticated layered paper-cut fur texture and soft edge shadows. Base paper fur should be neutral white (#FAFAF8 to #FFFFFF), with delicate neutral pearl/light-gray shadows defining the layers rather than warm beige, yellow, tan or blue. Make ears, body, paws and tail all visibly white too. Keep enough gentle tonal separation for the paper layers to read; no flat blown-out white.
Keep original dark brown eyes, dark nose and pink tongue colors, natural proportions and identity. No added objects, text, collar, outline, drop shadow, background or border.
Output a single square image with genuine transparent alpha background, preserving the original artwork's composition. Do not add a checkerboard pattern.
```



C was generated in parallel in isolated `assets/milky-white-c` (source commit `6531518`), then consolidated into this five-file B/C handoff. Both full-resolution edits were reviewed again in the integration worktree for the same approved facial identity and neutral fur. No application code, gallery, download bundle, or original logos changed in this commit.
