# Detailed seasonal replacement assets

The room’s original fibrous paper illustration has substantially more material and lighting detail than the previous flat vector seasonal props. The five assets below are existing public raster illustrations chosen to replace those props. They were not drawn or generated for this project.

| Runtime file | Published work / contributor | Dimensions | License |
|---|---|---|---|
| `/assets/paper/decor/rich/winter-tree.webp` | [Vintage Christmas Tree](https://www.publicdomainpictures.net/en/view-image.php?image=547868&picture=vintage-christmas-tree) — Dorothe Wouters | 1392 × 1920 | CC0 1.0 |
| `/assets/paper/decor/rich/winter-wreath.webp` | [Christmas Wreath Transparent Png](https://www.publicdomainpictures.net/en/view-image.php?image=739892&picture=christmas-wreath-transparent-png) — freddy dendoktoor | 1834 × 1920 | CC0 1.0 |
| `/assets/paper/decor/rich/autumn-pumpkin.webp` | [Pumpkin](https://www.publicdomainpictures.net/en/view-image.php?image=470830&picture=pumpkin) — Ashira Shalom | 1920 × 1920 | CC0 1.0 |
| `/assets/paper/decor/rich/summer-palm.webp` | [Palm Plant Vintage Transparent](https://www.publicdomainpictures.net/en/view-image.php?image=377052&picture=palm-plant-vintage-transparent) — Andrea Stöckel | 1573 × 1920 | CC0 1.0 |
| `/assets/paper/decor/rich/spring-roses.webp` | [Teacup, Roses Vintage Clipart](https://www.publicdomainpictures.net/en/view-image.php?image=402121&picture=teacup-roses-vintage-clipart) — Karen Arnold | 1799 × 1920 | CC0 1.0 |

The tree already contains ribbon ornaments and wrapped gifts. Separate flat gift boxes should not be needed beneath it. Its watercolor-style foliage has varied local texture and overlapping detail. The wreath has dense flowers, needles and berries with dimensional shading. Neither is claimed to be an exact felt-paper match; final size, placement and scene lighting belong to the integration step.

The pumpkin has muted ochre shading, a desaturated green stem and a grainy cream outline that resembles soft fabric or pastel pigment. The palm offers individually detailed leaves and a terracotta flowerpot. Both are standalone transparent images, not extracted pieces of a larger scene. They retain the contributors’ existing shapes and colors. A separate watercolor garden sheet was researched but not included, because using its flowers or books would require extracting them from the sheet.

The spring decoration is a standalone arrangement of detailed red and yellow roses in a patterned blue teacup and saucer. Its fine printed texture is retained as supplied; the complete transparent original is used without extracting or altering individual flowers.

## Provenance and conversion

`public/assets/paper/decor/rich/manifest.json` records each author, original page, free-download page, direct original PNG URL, dimensions, original/output byte counts, SHA-256 hashes and conversion command. `NOTICE.md` records the CC0 statement and processing limits.

The PNG originals were converted with:

```sh
cwebp -near_lossless 80 -q 100 -m 6 -exact original.png -o output.webp
```

No image editing, repainting, resizing, cropping or new generation was performed. Near-lossless encoding only slightly quantizes RGB information. A read-only comparison of the decoded source and output confirmed equal dimensions and byte-for-byte equal alpha channels for all five files. Outputs are approximately 1.95 MB (tree), 3.24 MB (wreath), 2.39 MB (pumpkin), 2.30 MB (palm) and 1.25 MB (roses). Adding subsequent seasonal assets did not change the existing tree or wreath files.

The PNG source files are not duplicated in Git; their direct URLs and hashes allow the originals to be recovered and checked. The sources are the free standard-resolution downloads, not the paid premium originals.

## Integration checks still required

The image-viewing tool displayed colored bands in transparent areas of the source previews. Sampled outer pixels had alpha zero. The output alpha channels match the source exactly; actual browser composition still needs to confirm that no colored bands or edge artifacts are visible. This asset conversion task did not perform a browser check or claim one.

The original base-room image remains a separately identified generated asset. These five reused images are explicitly credited as public contributor assets; this distinction should remain in the public credits.
