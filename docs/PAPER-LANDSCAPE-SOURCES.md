# Public landscape assets for the paper studio

Retrieved and inspected 2026-09-29.

## Selected artist-made asset

**Free Valley Background** by **Franco Giachetti / LudicArts**.

- [Artist's original work](https://www.ludicarts.com/free-valley-background/)
- [Artist-published OpenGameArt download and CC BY 4.0 declaration](https://opengameart.org/content/free-valley-background)
- [Author profile](https://opengameart.org/users/ludicarts)
- [Itch.io artist listing](https://ludicarts.itch.io/free-valley-game-background)
- [Actual downloaded archive](https://opengameart.org/sites/default/files/background_free_valley_pack.zip)
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/)

This is a real hand-painted asset pack, with independent transparent scenery
layers. No image generation, traced substitute, or invented illustration was
used. The pack has atmospheric distant mountains, a rocky valley, a pine-tree
layer, meadow and foreground plants. It is a summer landscape, not four
separately painted seasons. Seasonal color, weather and independent foreground
decor must be provided by the application; do not claim otherwise.

The pack is painterly rather than literal cut paper. Moderate desaturation,
a shared warm paper texture, and short parallax travel can bring it into the
paper studio. Its detailed foliage is useful in a broad window. Avoid neon
saturation and avoid thick cartoon outlines.

## License and attribution

The specific OpenGameArt entry, uploaded by LudicArts, explicitly licenses this
asset under CC BY 4.0. The creator's own freebie listing also states this license.
It permits commercial use and modification with attribution. Include a visible
credits link containing the artist, original-work link, CC BY 4.0 link, and a
notice that the art was resized/adapted.

Suggested credit:

> Landscape: “Free Valley Background” by LudicArts / Franco Giachetti, CC BY 4.0. Resized and adapted for this website.

`public/assets/paper/landscape/` includes the original `AUTHOR-original.txt`,
the full `CC-BY-4.0.txt` legal code and an `ATTRIBUTION.txt` integration notice.
The archive's stale `Licence.url` points at a different LudicArts character pack;
it is not the license evidence used here.

## Optimized production files

Only the five optimized layers, attribution and metadata are shipped. The
4500-pixel source PNGs and 32 MB archive are not placed in the production tree.
Encoding: `cwebp -q 88 -m 6 -resize 1920 0`, transparent edges preserved.
Combined image payload: **459,624 bytes** (about 449 KiB).

| Back-to-front order | File | Pixels | Bytes | Source top Y / 3600 | Role |
| --- | --- | --- | ---: | ---: | --- |
| 1 | `valley-layer-05.webp` | 1920 × 1237 | 22,344 | 0 | Distant mountains + sky |
| 2 | `valley-layer-04.webp` | 1920 × 804 | 104,804 | 1001 | Rocky valley |
| 3 | `valley-layer-03.webp` | 1920 × 463 | 90,374 | 1404 | Pine trees |
| 4 | `valley-layer-02.webp` | 1920 × 631 | 178,988 | 2123 | Meadow |
| 5 | `valley-layer-01.webp` | 1920 × 407 | 63,114 | 2646 | Foreground plants |

The original assembled canvas is **4500 × 3600**. Individual source layers are
cropped to different heights; do not stretch all of them to cover the window.
`layers.json` records the exact percentage placement and relative height for
reconstructing the artist's composition. Offsets were verified against the
original composite by pixel matching (zero error at recorded offsets).

Recommended composition: create a stage with `aspect-ratio: 5 / 4`; absolutely
position layers at `left: 0; width: 100%`, using `topPercent` and `heightPercent`
from the manifest. Fill the window by scaling/cropping the whole stage. Keep
approximately 3–6% bleed to permit a few pixels of differential parallax.

**Sky note:** layer 05 includes an opaque off-white sky. To color the sky for
sunset/night, apply a full-stage color treatment or use the layer with a
controlled multiply blend onto a separate colored sky; putting a colored sky
behind it alone will not change its opaque pixels. Layers 01–04 have transparent
backgrounds. The foreground edge ends two pixels before the original canvas
bottom; give the stage a matching background or crop those final pixels.

## Other candidates checked

- [CraftPix Free Fantasy Cartoon Game Backgrounds](https://craftpix.net/freebies/free-fantasy-cartoon-game-backgrounds/): coherent four-season 1920 × 1080 art advertised, but the actual download requires sign-in. Not downloaded, not used. The style is more casual-cartoon than the selected painterly pack.
- [CraftPix freebie license](https://craftpix.net/file-licenses/): allows website use and modification, but the account requirement made this less suitable for an unattended public-asset import.

## Checks

- Downloaded archive successfully, inspected its file list and author text.
- Viewed the original composite and independent mountain/valley/tree layers.
- Checked every output WebP decodes to RGBA at its recorded size.
- Matched all source-layer vertical offsets against the artist's full composite.
- No application files changed; root owns runtime composition and credits UI.
