# Milky identity — Logopia workflow

Created 2026-09-30 for Taewon Seo’s personal studio. The user explicitly requested a Milky logo using [t1seo/logopia](https://github.com/t1seo/logopia), and delegated design selection. This is an original **raster** identity, not editable vector artwork.

## Production assets

| File | Purpose | Facts |
| --- | --- | --- |
| `public/assets/cyberpunk/milky-logo.webp` | Header | 256×256 RGBA, 5,408 bytes; use a 48–52px image box |
| `public/milky-favicon.png` | Browser favicon | 64×64 RGB, 4,031 bytes, opaque charcoal background |
| `public/assets/cyberpunk/milky-logo.png` | Unmodified selected master `a-v3` | 1254×1254 RGBA; actual alpha range 0–255 |
| `public/assets/cyberpunk/milky-logo-header-package.zip` | Logopia verified header export | Original PNG, manifest, brand guide |
| `public/assets/cyberpunk/milky-logo-favicon-package.zip` | Logopia verified favicon export | Original 1254×1254 PNG, manifest, brand guide |
| `public/assets/cyberpunk/milky-logo-process.zip` | Creative history | All six generated originals, exact prompts, brief and observed reviews |

The private photographs and video are **not** included in public assets or archives. Only generated artwork is distributed. The imported photo’s identity hash was recorded privately by the helper.

## Actual toolchain

Logopia pinned commit: `4d102c260ec1b65e086ab5f5699cee4ffcbdad01`.

Read `README.md`, `skills/logo-land/SKILL.md`, and its native-image, logo-craft, project-files, color-workflow, visual-references and delivery-checks references. Cloned to a task-local checkout and ran `uv sync --locked` (Python 3.13.7). No global plugin installation or image API was used.

The helper was actually invoked, with this command prefix:

```sh
uv run --locked --project /tmp/logopia-milky-logo python \
  /tmp/logopia-milky-logo/skills/logo-land/scripts/logo_project.py \
  --workspace /tmp/milky-logopia-workspace
```

Executed flow:

1. `init --session milky --brief …/brief.json`
2. `reference-add` for an inspected user photograph; saved an image-conditioned reference plan with SHA-256 and specific observations.
3. Three `prompt --reference-plan` calls, followed by three separate native image-generation calls and real `import` operations (`a-v1`, `b-v1`, `c-v1`).
4. `prompt --parent a-v1 --changes …` → native edit → `import --parent a-v1` (`a-v2`). Simplified detailed fur into a small number of paper shapes.
5. `prompt --parent a-v2 --changes …` → native edit → `import --parent a-v2` (`a-v3`). Added transparent clear space and shortened crown tufts.
6. `prompt --parent a-v3 --changes …` → native edit → `import --parent a-v3 --background opaque` (`favicon-v1`). Made a separately generated enlarged-face opaque favicon variant.
7. For **both** selected variants: `select`, evidence-based `review`, and `export`. Header export revision 10; favicon export revision 13. Verified that each ZIP’s `logo.png` SHA-256 equals its manifest and that each package contains exactly PNG, manifest and brand guide.

Generation mode: built-in `image_gen__imagegen`. Actual model identity was not reported by the runtime. Each image call used its exact saved prompt and inspected parent/reference path; transparent marks used `transparent_background: true`, the favicon used `false`. The helper generates prompts and packages files; the native tool generated every original image.

## Selection and refinement

- `a-v1`: Frontal head. Clear symmetrical eyes/nose, but individual paper-fur layers were too busy for a tiny header.
- `b-v1`: Three-quarter head. Friendly asymmetry, but less balanced small-size weight.
- `c-v1`: Resting face. Calm expression, but small-size eyes were less distinct.
- `a-v2`: Simplified `a-v1` into solid eyes/nose and broad paper shapes. Better small-size reading; needed more exterior margin.
- **`a-v3` selected for header:** warm ivory Maltese face, short floppy ears, small charcoal eyes, broad nose, wispy crown. No initials, text, body or extra badge.
- **`favicon-v1` selected for tab:** same identity enlarged on a midnight charcoal square.

These are assistant selections under the user’s delegation, not a claim that the user separately approved a specific candidate.

## Final prompt record

Exact prompts for all calls are in `milky-logo-process.zip/prompts/`. The selected header’s complete final prompt is also in `milky-logo-header-manifest.json`; the favicon’s is in its corresponding manifest. The authoritative final header change was:

> Keep this simple six-piece paper face design, ivory and gray colors, small solid eyes, broad solid charcoal nose and the same two floppy ears. Improve only two things: shrink the WHOLE head so every part fits comfortably inside the central 76 percent of a square canvas, leaving at least 12 percent truly transparent clear margin on ALL FOUR sides including ears; and shorten the tall top wisps by about 30 percent so the crown is flatter and has three small characteristic Milky tufts. Retain all facial spacing, ear proportions, muzzle and matte paper surface. No added text, background, shadow or other objects. Edges must be clean anti-aliased RGBA cutout, alpha zero in the exterior. Return a 1024 square transparent PNG.

The tool returned 1254×1254, not the requested 1024 square; the original dimensions and bytes are preserved. Actual opaque face width is approximately 69% of the header canvas, so the recommended 48–52px image box yields an approximately 33–36px visible mark.

## Checks and limitations

- Opened all four supplied photos, room art, all three candidates, both refinements and the favicon original.
- Inspected actual whole-frame 40px/48px header and 32px/16px favicon previews. An independent read-only reviewer checked the same originals and previews and agreed that 48–52px is suitable for the header.
- Short ears, broad nose and eyes remain distinguishable at 32px; the white dog silhouette and dark central face marks remain readable at 16px. Paper texture disappears at that size, as expected.
- Header PNG contains actual alpha 0–255; the production WebP contains alpha 0–254 (transparent exterior and near-opaque visible face). The original contains sparse very-low-alpha edge residue; it was not conspicuous on dark 40px/48px previews. No scripted background removal or recoloring was performed.
- Colors are advisory design roles. Logopia correctly reports **color-unverified** because no structured exact palette was imposed; no exact HEX, CMYK or color certification is claimed.
- Chrome page compositing was not independently checked by this asset worker. The root integration owns UI testing. Browser light/dark comparison is distinct from the completed local-image inspection.
- Production derivatives were made with whole-frame `cwebp -resize` conversion; `dwebp` encoded the 64px favicon PNG. No cropping, recoloring, compositing or artwork repainting was done in scripts. Generated masters remain unchanged.

Master SHA-256: `5ed9278a3c64318451beedd91880b86189760369c5ca6d6c1bfc28a029dc01ab`.
WebP SHA-256: `ba6308742255b50f6fcf64e76b8d87fb2cce1a476877bbbaaabfa16e6783cca6`.
Favicon SHA-256: `6a0edd49dda5b0ecd4bac304088ce9ff0fa033686bb2d9bb4e777d827f79e783`.
