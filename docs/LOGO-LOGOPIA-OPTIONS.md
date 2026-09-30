# Milky logo options — Logopia comparison

Created 2026-09-30. These are **three creative candidates awaiting the user’s choice**. No candidate was selected, installed in the live header, or approved as a final identity. The previous selected logo remains unchanged.

## Files

| Gallery ID | Candidate | Preview | Original |
| --- | --- | --- | --- |
| D | Quiet Companion | `public/assets/logo-options/logopia-01.webp` | `public/assets/logo-options/logopia-01.png` |
| E | Night Seal | `public/assets/logo-options/logopia-02.webp` | `public/assets/logo-options/logopia-02.png` |
| F | Little Portrait | `public/assets/logo-options/logopia-03.webp` | `public/assets/logo-options/logopia-03.png` |

All previews are 512×512 RGBA WebP. All originals are 1254×1254 RGBA PNG, copied without modifying the returned image bytes. Actual PNG alpha range: 0–255; WebP alpha range: 0–254. These are raster images, not SVG or editable vector artwork. WebPs use whole-image `cwebp -q 94 -alpha_q 100 -resize 512 512`; no scripted drawing, background removal, cropping, or retouching was used.

## Actual Logopia workflow

- Repository: [t1seo/logopia](https://github.com/t1seo/logopia), pinned commit `4d102c260ec1b65e086ab5f5699cee4ffcbdad01`.
- Read `skills/logo-land/SKILL.md` and native-image, project-files, logo-craft, color-workflow, visual-references and delivery-checks references. Used its Python helper in the locked uv environment.
- Private workspace: `tmp/logo-options-logopia` in the dedicated worktree. It is ignored by Git. Session ID: `milky-options`. It does not modify the earlier Milky identity session.
- `init` saved the brief at revision 0. `reference-add` imported the exact newly supplied face photographs at revisions 1 and 2. The references are user-owned photographs; only their identity hashes and observed traits are recorded here. No private photographs or video are included in public assets.
- `prompt` produced three distinct concept specifications and image-conditioning plans at revision 2. The native tool was actually called once per concept with the referenced photographs and `transparent_background: true`.
- The first three returned images each contained a three-up strip despite the one-logo instruction. Those originals were preserved privately as `l1-v1`, `l2-v1`, `l3-v1`; they are not used as gallery thumbnails. Imports advanced revisions 3–5. The revision was reconciled between imports; brief, palette intent and reference identity remained unchanged.
- For each parent, the helper built an edit prompt. The final native prompt was narrowed to the concrete single-image extraction/refinement instruction reproduced below, omitting the broad comparison-use wording that had induced a strip. Actual parent PNGs were supplied. No photograph references were substituted for edit parents.
- The three actual edited PNGs were imported with real parent links as `l1-v2`, `l2-v2`, `l3-v2`, revisions 6–8. Visual reviews were recorded through the helper, revisions 9–11.
- Final saved helper state: revision 11, `selected_id: null`, `exports: []`. Several review flags intentionally remain false; this is an honest creative comparison, not a forced approved export. User selection remains pending.
- Native generation provider: built-in `image_gen__imagegen`. No separate image API or API key was used. Runtime model identity was not independently exposed/verified.

## Observed strengths and limitations

| Candidate | Observed strength | Limit before production use |
| --- | --- | --- |
| D · Quiet Companion | Ivory frontal face, short dropped ears and broad nose read at 48px. | The result retains more hair detail than the intended sparse construction. At 32px the internal lines crowd. Use padded placement; simplifying further is a later refinement. |
| E · Night Seal | Distinct left-facing profile, charcoal disc and open ivory ring form a coherent emblem at 48px. | It became a filled engraved portrait rather than the intended monoline mark. Small fur cuts merge at 32px; its expression is more symbolic than photo-specific. |
| F · Little Portrait | Small eyes, broad nose, short muzzle and parted forehead closely reference the newly supplied photos. Paper grain belongs to the studio material language. | Fine texture disappears at 32px, white edges need surface contrast, and the native crop includes tight margins/low-alpha edge flecks. Best as a larger profile illustration; not yet a production favicon. |

Viewed each actual PNG at native size and whole-image 32px/48px diagnostic WebPs using the image viewer. This is not a claim of an independent Chrome light/dark-surface review. The gallery should provide equal padded light/dark contexts so the user can compare. Preview padding changes layout only, never source image pixels.

Colors are advisory descriptions. No strict exact-HEX conformance, monochrome delivery variant, trademark clearance, exclusive rights, font files or platform package is claimed.

## Reference evidence

- `milky-close`: SHA-256 `a2611f2fcd8a3f8643cd982705a0d29fcc0357c587309f95d54e9210d132f9c0`; original 3024×4032 JPEG. Observed white fine fur, forehead partially covering small dark eyes, broad black rounded-triangular nose, dropped ears and loose muzzle hair.
- `milky-four`: SHA-256 `9fc34bdbed704238dfc385ae5cda9791ad447614ec9b2df12c7473a35f91bd49`; original 512×512 JPEG. Observed white fine fur, forehead partially covering small dark eyes, broad black rounded-triangular nose, dropped ears and loose muzzle hair.

## Native call outputs and hashes

### Candidate 01

- Initial tool output basename: `exec-395a9fd9-600a-44ee-a136-d4d708e551c5.png`; saved privately as `l1-v1`.
- Edited tool output basename: `exec-533b6998-c008-462a-bca7-a5f3398e487f.png`; imported as `l1-v2`.
- `logopia-01.png`: 941,029 bytes; SHA-256 `9f3e974ecb4e842d1142ccff83246edd24ae6bf8b95fea5a59cfb1d73f265c1d`.
- `logopia-01.webp`: 32,064 bytes; SHA-256 `8726198c1450e70fa8018280a540f9bf7be84c46f4abd04d3fc674896c48423a`.

Initial exact native prompt:

```text
Create one mascot logo for Milky — Taewon Seo. Exact text (copy verbatim, no other words): ''. Exact slogan: ''.
Render only the supplied exact text and nonempty slogan; the brand context is not additional lettering. Empty strings request no corresponding text.
Industry: Personal software engineer portfolio. Audience: Visitors to Taewon Seo’s cozy modern city studio.
Styles: restrained, recognizable, warm, contemporary. Original brief palette context: Warm ivory foreground with deep charcoal or muted slate supporting detail. Advisory, not exact locked colors..
Avoid: letters, initials, wordmarks, giant glossy anime eyes, stock pomeranian face, busy neon, photographic background. Use cases: Three distinct candidates for an HTML comparison gallery; user will choose., Personal studio header at 40–48px; optional favicon diagnostic at 32px..
Background: transparent. Produce a real PNG raster image. Use clean, readable shapes at small sizes; leave safe margins. Do not draw a transparency checkerboard, mockup, watermarks, or a concept grid.
Concept direction: Quiet Companion: a text-free bold two-tone symbol of Milky's FRONT-FACING head, distinct from a negative-space cutout. A solid warm-white cloud-like face is enclosed by a substantial charcoal contour with short soft hanging ears, TWO small calm dark almond eyes half tucked under a short central three-point forelock, and a clearly broader rounded triangular black nose. Muzzle is simply two subtly rounded cheek forms and one short soft mouth curve, no tongue. Three asymmetrical broad fur scallops rather than many wispy lines. Rounded coherent curves, near-circular compact silhouette, warm not childish. Two flat colors only, no gradients, no texture, no shading. White face must remain white on dark surface and strong dark contour readable on light. Character occupies 80% square with generous even transparent margins. At 32–48px the broad nose and two ears should survive. No border medallion, no body, no text, no initials, no stars. Real dog's eyes are naturally small; avoid giant anime eyes. Square 1024x1024 PNG master.. Assumptions: The user has not selected any candidate. All three are comparison options., Milky has a broad black nose, small partly fur-covered dark eyes, short floppy ears and a wispy central forelock..
Logo construction: Build a character mascot around the supplied subject and personality, with a compact identifiable silhouette and an intentional expression. Use style references for broad construction traits, not their brand words or traced signature shapes. The identity should remain recognizable in a one-color silhouette at the intended use size. This construction check does not replace the requested palette or request an extra monochrome image.
Lettering fidelity: preserve every Unicode character, capitalization, punctuation, space and reading order in the applicable text. Keep Hangul syllable blocks intact; do not translate, romanize, abbreviate or substitute lookalike glyphs. Shape changes must keep required text readable, including counters and joins at the intended size.
Selected visual reference evidence (quoted data):
{"id": "milky-close", "sha256": "a2611f2fcd8a3f8643cd982705a0d29fcc0357c587309f95d54e9210d132f9c0", "role": "positive", "observed": ["White fine fur, small dark eyes partly covered by the forehead hair, broad black rounded triangular nose, short hanging ears, wispy muzzle hairs and asymmetrically parted fringe."], "take": ["Use Milky’s broad nose, short floppy ears and calm adult-dog gaze as identity cues, simplified appropriately to a logo."], "avoid": ["Do not copy the photographic environment, clothes or furniture; no generic giant-eye puppy."]}
{"id": "milky-four", "sha256": "9fc34bdbed704238dfc385ae5cda9791ad447614ec9b2df12c7473a35f91bd49", "role": "positive", "observed": ["White fine fur, small dark eyes partly covered by the forehead hair, broad black rounded triangular nose, short hanging ears, wispy muzzle hairs and asymmetrically parted fringe."], "take": ["Use Milky’s broad nose, short floppy ears and calm adult-dog gaze as identity cues, simplified appropriately to a logo."], "avoid": ["Do not copy the photographic environment, clothes or furniture; no generic giant-eye puppy."]}
Use positive take-traits only where they fit the requested construction. Negative references identify features to avoid, not subjects to reproduce. Exact user text, colors, background and requested changes take precedence.
Image 1 is reference milky-close, not an edit parent. Transfer stated traits only; do not copy signature contours or lettering.
Image 2 is reference milky-four, not an edit parent. Transfer stated traits only; do not copy signature contours or lettering.
```

Exact single-artifact edit prompt:

```text
The attached image is an EDIT TARGET. Produce exactly ONE isolated Maltese logo, taken from the CENTER face of the attached strip. Output one SQUARE 1024x1024 transparent PNG, not a row, not multiple variants, not a comparison. Remove the entire left and right faces. Enlarge the center face to 78% of the square canvas, with even generous margins. Simplify its existing contours: only six or seven broad flowing fur lobes around the silhouette, two small natural dark eyes without shiny catchlights, broad dark rounded-triangle nose and a single restrained mouth curve. Remove most of the many fine interior hair marks. Keep the dropped ears, small calm eyes, Milky's asymmetrical forehead part and compact muzzle. A sophisticated minimal two-tone character mark in solid warm ivory and charcoal, clean flat surfaces. Genuine alpha 0 exterior, no shadow, no background. No lettering. EXACTLY ONE HEAD ONLY.
```

Saved observed review:

```json
{
  "reviewer": "Codex visual inspection",
  "notes": "Viewed the actual 1254px PNG and whole-image 32px and 48px WebP diagnostics. One front face, no text, genuine transparent exterior. At 48px the broad nose and dropped ears are distinct; fine internal fur grooves crowd at 32px. Simplification preserved the head, but not the requested strict six-to-seven-lobe reduction: the result remains a detailed two-tone portrait. Native margins are close at left/right; place inside a padded UI box. CSS light/dark browser context was not independently verified. Creative option only, not user-approved.",
  "text_correct": true,
  "composition_ok": true,
  "small_size_ok": true,
  "preservation_ok": false,
  "background_checked": true
}
```

### Candidate 02

- Initial tool output basename: `exec-af034bec-2b7b-4a17-a04b-6c3664c54a9a.png`; saved privately as `l2-v1`.
- Edited tool output basename: `exec-62394d5b-6e13-4d08-9f49-3ce3eb7a5f15.png`; imported as `l2-v2`.
- `logopia-02.png`: 1,056,645 bytes; SHA-256 `c451751ae3a49c3a3451f72a49d8318c0650005dd85c29c54a23281c45b7a09d`.
- `logopia-02.webp`: 41,050 bytes; SHA-256 `6340f80ea46b3532ee429ab8c99101fa2620c70e26a966d68b5e4fb24a0a7c74`.

Initial exact native prompt:

```text
Create one mascot logo for Milky — Taewon Seo. Exact text (copy verbatim, no other words): ''. Exact slogan: ''.
Render only the supplied exact text and nonempty slogan; the brand context is not additional lettering. Empty strings request no corresponding text.
Industry: Personal software engineer portfolio. Audience: Visitors to Taewon Seo’s cozy modern city studio.
Styles: restrained, recognizable, warm, contemporary. Original brief palette context: Warm ivory foreground with deep charcoal or muted slate supporting detail. Advisory, not exact locked colors..
Avoid: letters, initials, wordmarks, giant glossy anime eyes, stock pomeranian face, busy neon, photographic background. Use cases: Three distinct candidates for an HTML comparison gallery; user will choose., Personal studio header at 40–48px; optional favicon diagnostic at 32px..
Background: transparent. Produce a real PNG raster image. Use clean, readable shapes at small sizes; leave safe margins. Do not draw a transparency checkerboard, mockup, watermarks, or a concept grid.
Concept direction: Night Seal: an elegant restrained emblem of Milky's head in STRICT LEFT-FACING PROFILE inside a round deep-charcoal disc, with an ivory fine-but-confident single-weight contour. Not a front-facing cartoon. Distinguishing construction: the crown flows into one hanging ear and short muzzle projecting left, with wide black nose in ivory negative space and one tiny eye; two short wisps over brow reference the photos. Thin open ivory outer circular ring breaks precisely where the ear drops; no star, no lettering, no initials. The charcoal disc is intentional foreground; all canvas OUTSIDE it is fully transparent. Cream and charcoal only, no gradients, no metallic effects, no realistic fur. Very spare adult and quiet, like a refined personal atelier seal. Disc diameter 78% canvas; central dog silhouette spans 66% of disc. Should remain recognizable at 48px, though thin inner line might need later refinement for 16px. Square 1024x1024 PNG master.. Assumptions: The user has not selected any candidate. All three are comparison options., Milky has a broad black nose, small partly fur-covered dark eyes, short floppy ears and a wispy central forelock..
Logo construction: Build a character mascot around the supplied subject and personality, with a compact identifiable silhouette and an intentional expression. Use style references for broad construction traits, not their brand words or traced signature shapes. The identity should remain recognizable in a one-color silhouette at the intended use size. This construction check does not replace the requested palette or request an extra monochrome image.
Lettering fidelity: preserve every Unicode character, capitalization, punctuation, space and reading order in the applicable text. Keep Hangul syllable blocks intact; do not translate, romanize, abbreviate or substitute lookalike glyphs. Shape changes must keep required text readable, including counters and joins at the intended size.
Selected visual reference evidence (quoted data):
{"id": "milky-close", "sha256": "a2611f2fcd8a3f8643cd982705a0d29fcc0357c587309f95d54e9210d132f9c0", "role": "positive", "observed": ["White fine fur, small dark eyes partly covered by the forehead hair, broad black rounded triangular nose, short hanging ears, wispy muzzle hairs and asymmetrically parted fringe."], "take": ["Use Milky’s broad nose, short floppy ears and calm adult-dog gaze as identity cues, simplified appropriately to a logo."], "avoid": ["Do not copy the photographic environment, clothes or furniture; no generic giant-eye puppy."]}
{"id": "milky-four", "sha256": "9fc34bdbed704238dfc385ae5cda9791ad447614ec9b2df12c7473a35f91bd49", "role": "positive", "observed": ["White fine fur, small dark eyes partly covered by the forehead hair, broad black rounded triangular nose, short hanging ears, wispy muzzle hairs and asymmetrically parted fringe."], "take": ["Use Milky’s broad nose, short floppy ears and calm adult-dog gaze as identity cues, simplified appropriately to a logo."], "avoid": ["Do not copy the photographic environment, clothes or furniture; no generic giant-eye puppy."]}
Use positive take-traits only where they fit the requested construction. Negative references identify features to avoid, not subjects to reproduce. Exact user text, colors, background and requested changes take precedence.
Image 1 is reference milky-close, not an edit parent. Transfer stated traits only; do not copy signature contours or lettering.
Image 2 is reference milky-four, not an edit parent. Transfer stated traits only; do not copy signature contours or lettering.
```

Exact single-artifact edit prompt:

```text
The attached image is an EDIT TARGET. Produce exactly ONE circular Maltese emblem, taken from the CENTER round emblem of the attached strip. Output one SQUARE 1024x1024 transparent PNG, not a row, not multiple variants, not a comparison. Remove left and right emblems completely. Enlarge center disc to 78% of square width with even margins. Preserve left-facing profile, short hanging ear, open outer ring where ear meets lower right, ivory and charcoal palette. Simplify the interior dramatically to a confident ivory contour and six broad ivory planes; no dozens of hair spikes, no fine etched hair lines. Naturally small eye, short muzzle, distinct wide nose. Understated mature personal atelier seal, not a cartoon badge with oversized eyes. Intentional charcoal disc is visible solid foreground; exterior outside disc is truly transparent alpha 0. No text, no star, no extra adornment. EXACTLY ONE EMBLEM ONLY.
```

Saved observed review:

```json
{
  "reviewer": "Codex visual inspection",
  "notes": "Viewed 1254px PNG plus 32px and 48px whole-image diagnostic renders. One circular foreground disc with transparent exterior; no text or star. Left-facing profile and open circular ring remain recognizable at 48px. Fine hair cuts lose separation at 32px, and the generated result is a filled engraved profile rather than the intended spare monoline emblem. Retained for an honest distinct creative comparison; no final production approval or user selection.",
  "text_correct": true,
  "composition_ok": true,
  "small_size_ok": true,
  "preservation_ok": false,
  "background_checked": true
}
```

### Candidate 03

- Initial tool output basename: `exec-682d4fae-0689-40a5-9626-fd861acc1267.png`; saved privately as `l3-v1`.
- Edited tool output basename: `exec-b47902e4-ac6e-4639-b493-d2becd1e38e5.png`; imported as `l3-v2`.
- `logopia-03.png`: 1,889,447 bytes; SHA-256 `8d4573b7da7a2fa3f05cc6f084b467c526ed21791d40335b0df46db0883fb6fa`.
- `logopia-03.webp`: 65,164 bytes; SHA-256 `697af93766dc819e3783ca91efc46ae04951955ba3374086cec5a6e07671056b`.

Initial exact native prompt:

```text
Create one mascot logo for Milky — Taewon Seo. Exact text (copy verbatim, no other words): ''. Exact slogan: ''.
Render only the supplied exact text and nonempty slogan; the brand context is not additional lettering. Empty strings request no corresponding text.
Industry: Personal software engineer portfolio. Audience: Visitors to Taewon Seo’s cozy modern city studio.
Styles: restrained, recognizable, warm, contemporary. Original brief palette context: Warm ivory foreground with deep charcoal or muted slate supporting detail. Advisory, not exact locked colors..
Avoid: letters, initials, wordmarks, giant glossy anime eyes, stock pomeranian face, busy neon, photographic background. Use cases: Three distinct candidates for an HTML comparison gallery; user will choose., Personal studio header at 40–48px; optional favicon diagnostic at 32px..
Background: transparent. Produce a real PNG raster image. Use clean, readable shapes at small sizes; leave safe margins. Do not draw a transparency checkerboard, mockup, watermarks, or a concept grid.
Concept direction: Little Portrait: a charming refined FRONT-FACING paper-relief mascot of ONLY Milky’s head, distinctly richer and softer than a flat icon, with natural small eyes, broad black nose, short dropped ears and loose central forelock derived from the exact photos. Build from only 6–8 broad matte cut-paper planes in warm ivory, oatmeal and very muted blue-gray shadows, plus ink-dark nose and eyes. No photoreal hair strands; the paper edge texture is extremely subtle and cannot crowd face. Main face has a gently square-rounded shape, ears just slightly lower than cheeks, natural subtly asymmetrical tuft at crown, short white muzzle with two sculpted planes, calm alert mouth closed. Straight-on head not three-quarter, no body, no collar, no stars, no circular background, no initials or letters. Warm handmade sophisticated identity for a tactile paper studio. Minimal shallow depth with soft INTERNAL shadows only; no cast shadow outside logo. At 40–48px nose/eye spacing remains main read; tiny grain may disappear. Head fills 79% square, even transparent margins. Square 1024x1024 PNG master.. Assumptions: The user has not selected any candidate. All three are comparison options., Milky has a broad black nose, small partly fur-covered dark eyes, short floppy ears and a wispy central forelock..
Logo construction: Build a character mascot around the supplied subject and personality, with a compact identifiable silhouette and an intentional expression. Use style references for broad construction traits, not their brand words or traced signature shapes. The identity should remain recognizable in a one-color silhouette at the intended use size. This construction check does not replace the requested palette or request an extra monochrome image.
Lettering fidelity: preserve every Unicode character, capitalization, punctuation, space and reading order in the applicable text. Keep Hangul syllable blocks intact; do not translate, romanize, abbreviate or substitute lookalike glyphs. Shape changes must keep required text readable, including counters and joins at the intended size.
Selected visual reference evidence (quoted data):
{"id": "milky-close", "sha256": "a2611f2fcd8a3f8643cd982705a0d29fcc0357c587309f95d54e9210d132f9c0", "role": "positive", "observed": ["White fine fur, small dark eyes partly covered by the forehead hair, broad black rounded triangular nose, short hanging ears, wispy muzzle hairs and asymmetrically parted fringe."], "take": ["Use Milky’s broad nose, short floppy ears and calm adult-dog gaze as identity cues, simplified appropriately to a logo."], "avoid": ["Do not copy the photographic environment, clothes or furniture; no generic giant-eye puppy."]}
{"id": "milky-four", "sha256": "9fc34bdbed704238dfc385ae5cda9791ad447614ec9b2df12c7473a35f91bd49", "role": "positive", "observed": ["White fine fur, small dark eyes partly covered by the forehead hair, broad black rounded triangular nose, short hanging ears, wispy muzzle hairs and asymmetrically parted fringe."], "take": ["Use Milky’s broad nose, short floppy ears and calm adult-dog gaze as identity cues, simplified appropriately to a logo."], "avoid": ["Do not copy the photographic environment, clothes or furniture; no generic giant-eye puppy."]}
Use positive take-traits only where they fit the requested construction. Negative references identify features to avoid, not subjects to reproduce. Exact user text, colors, background and requested changes take precedence.
Image 1 is reference milky-close, not an edit parent. Transfer stated traits only; do not copy signature contours or lettering.
Image 2 is reference milky-four, not an edit parent. Transfer stated traits only; do not copy signature contours or lettering.
```

Exact single-artifact edit prompt:

```text
The attached image is an EDIT TARGET. Produce exactly ONE isolated Milky paper portrait, taken from the CENTER face of the attached strip. Output one SQUARE 1024x1024 transparent PNG, not a row, not multiple variants, not a comparison. Remove the entire left and right faces. Enlarge center face to 78% of square width with even margins. Preserve its specific natural Maltese likeness: small calm dark eyes beneath the wispy part, short hanging ears, broad textured black nose, white short muzzle, closed mouth and gently square-rounded face. Keep paper-relief ivory fur planes and delicate grain, but use larger fewer planes and reduce tiny floating edge flecks. Fine detail can remain at nose, but do not make eyes bigger or glossier. Pure transparent exterior alpha 0, clean anti-aliased cutout, absolutely no external cast shadow, no floor, no lettering. EXACTLY ONE HEAD ONLY.
```

Saved observed review:

```json
{
  "reviewer": "Codex visual inspection",
  "notes": "Viewed 1254px PNG plus 32px and 48px whole-image diagnostics. Natural small dark eyes, wide nose and parted white fringe are closer to the supplied photos than the symbolic options. Paper grain and white fur remain visible at large size, while 32px appearance is faint and detailed grain disappears. Native portrait fills the canvas tightly and includes small low-alpha edge flecks; padded preview is needed and this is not favicon-ready. Genuine RGBA transparency is verified. No text. This is a creative option awaiting user selection and refinement, not an approved final export.",
  "text_correct": true,
  "composition_ok": false,
  "small_size_ok": false,
  "preservation_ok": true,
  "background_checked": true
}
```
