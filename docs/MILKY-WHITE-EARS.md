# Milky A — white ears and reusable logo pack

2026-09-30. User approved all three smiling logos, requested white ears on A, and asked to save B/C for reuse.

- Edited A with the built-in image generation tool and `transparent_background: true`. Only ear color was requested to change; the existing simple silhouette, eyes, nose and pink smile remain. Root inspected the generated image. Both ear interior samples (160,650) and (1080,650) in the 1254px PNG are RGBA (252,252,250,253), a neutral soft white rather than beige.
- New project assets: `public/assets/logo-options/smile-01-white-ears.png` (1254×1254 RGBA) and `.webp` (512×512 RGBA). WebP is a whole-image `cwebp -q 94 -m 6 -resize 512 512` conversion; no programmatic painting or masking. Original A remains in its previous project filenames.
- B/C original PNGs and the existing WebPs were preserved byte-for-byte; see `MILKY-LOGO-EXPORT-BC.md`.
- Downloads export folder: `/Users/cillian/Downloads/Milky-Logos-20260930/`. Includes all six PNG/WebP assets, offline `index.html`, `README.txt`, and a checksum manifest.
- ZIP: `/Users/cillian/Downloads/Milky-Logos-20260930.zip`, also at `public/assets/logo-options/milky-logo-pack.zip` for the gallery download. All nine ZIP entries were CRC-tested and byte-compared to their exported source files.
- Gallery A uses the new versioned filename to avoid a stale cached beige-ear preview. Per-card PNG/WebP downloads and an all-three ZIP download are available; no main studio logo has been silently replaced.

## Generated source

`/Users/cillian/.codex/generated_images/01a0ec28-a86f-7212-b864-067620f71e16/exec-213a0cba-ef5e-4add-a1cd-ae780ca6cef6.png`

Edit target, viewed before generation:
`/Users/cillian/.codex/generated_images/01a0f044-b1fc-7fb0-b2fa-e4acef221388/exec-4d27d80e-e817-4449-b816-d12050f47849.png`

## Exact prompt

Use case: precise-object-edit. Edit target: the supplied existing Milky logo A, a minimal smiling Maltese face. Make ONE VERY PRECISE change only: recolor BOTH light beige/ivory floppy ear patches to soft WHITE, matching the off-white face. The user wants a white Maltese with white ears. Keep the ears readable with an extremely faint neutral light-gray edge or subtle neutral gray separation if essential, but absolutely no beige, yellow, tan or brown tint in the ears. Preserve the existing entire head silhouette and its three forehead tufts, ear shapes/positions/sizes, face proportions, two dark round eyes with the same tiny white highlights, same dark oval nose, same small happy open mouth and muted pink tongue. Do not redesign, add details, change expression, change framing, change scale, or add fur texture. Keep the exact same flat simple logo visual language. One centered square transparent PNG logo, no text, no border, no background, no mockup, no cast shadow. Preserve true alpha transparency outside the head.
