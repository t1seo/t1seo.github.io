# Detailed character assets

Verified 2026-09-29. These assets are optional integration candidates; no scene source or existing assets changed.

## Selected assets

Both are supplied by Karen Arnold on PublicDomainPictures, with the free standard download released under CC0. Source pages, direct PNG links, dimensions, transparent bounds, and original SHA-256 are recorded in `public/assets/paper/decor/characters-rich/manifest.json`. Original PNGs and whole-image WebP encodings are included. There was no cropping, redrawing, or AI image generation.

- **sleeping-cat-ornament.webp**: detailed warm white-and-ginger porcelain cat photograph. This is a ceramic ornament, not a living cat. Best placed on a shelf, desk, or side table; avoid treating it as a breathing animal on the rug. Visible subject bounds in 1920×1193 image: (129,376)–(1535,1068).
- **blue-tit-bird.webp**: vintage natural-history illustration with detailed feather work. One small bird, angled downward and perched on a short branch. Visible subject bounds in 1769×1920 image: (292,191)–(1525,1617). Wide transparent margins need to be considered when aligning its hotspot. A windowsill or outside branch suits the pose.

## Verification

Downloaded the publicly linked free standard PNGs with normal `curl -fLsS`. Inspected both via `view_image`. PIL checked RGBA channels, dimensions and alpha bounding boxes. WebP conversion retains the complete original dimensions; alpha comparison against original PNG is pixel-identical. `view_image` may show opaque-looking streaks in transparent RGB areas of the PNG preview; pixel alpha inspection confirms those areas are transparent. Final Chrome compositing must still be checked during integration.

## Rejected candidates

- Anthony Poynton, Retro Mid-Century Radio, PublicDomainPictures image 611603: CC0 and genuine transparent PNG, but the artwork is flat vector and does not improve the current visual mismatch; intentionally not shipped.
- Maria Alvedro, Bird Sticker Transparent Background, image 606214: genuine alpha, but the heavy black outlines and sticker border clash with the room; intentionally not shipped.
- O Sulvia, Sleeping Cat and Butterflies, image 692840: complete opaque scene rather than a transparent object; intentionally not shipped.
- Andrea Stöckel, Vintage Clipart Art Cat, image 454424: black-only palette artwork, unsuitable as a detailed room character; intentionally not shipped.
- OnlyGFX radio: custom design-use license with standalone redistribution restriction, not the requested CC0/CC BY asset; not shipped.

A high-quality redistribution-safe transparent radio matching this room has not been verified. Do not describe the flat radio candidate as a visual upgrade.
