# Raised studio desk

The previous desk looked too low compared with the Aeron chair. The replacement raises the thin walnut desktop and its equipment while retaining the original floor anchors for the metal legs. The chair, camera, room, window geometry, and skyline stay in place.

## Source and workflow

- Source: `public/assets/cyberpunk/desk-reference.webp` (retained unchanged).
- Approved geometry master: `public/assets/cyberpunk/desk-height-reference.webp`, 1672 × 941.
- Built-in image generation, `precise-object-edit`; no CLI or Python image editing.
- Original generated master: `/Users/cillian/.codex/generated_images/01a0f008-b2d3-7ad1-91bc-17eb39998a24/exec-0e8af1e3-2f77-4a45-b78a-fd9cf7e814eb.png`.
- Whole-image WebP conversion: `cwebp -q 91`.
- Four isolated seasonal workers derive their five lighting variants from the **raised master as edit target**. The previous seasonal/time image is a lighting and decoration reference, not the geometry target.
- The lamp is unlit in all source plates; interactive illumination remains a separate application effect.

## Master prompt

> Use case: precise-object-edit. Edit target is this exact 1672x941 modern Seoul river-view home studio illustration. Modify only the ergonomic DESK HEIGHT, raising its very thin walnut tabletop and ALL objects resting on it by exactly 55 pixels vertically, without changing any horizontal positions or object dimensions. The desktop is currently too low and looks like a coffee table. New front-left tabletop corner must be at x509 y593 (old x509 y648). Its right edge and all objects move upward the SAME 55px: monitor inner black screen originally x894 y395 to1238 y564 should become x894 y340 to1238 y509. Keep monitor width, height, Mac aluminum stand shape identical; raise whole monitor and stand. Raise both walnut/linen speakers, HHKB cream keyboard, black desk mat, mouse, notebook and black/gold fountain pen, hammered singing bowl and mallet, pencil holder, ceramic mug and saucer, brass mushroom lamp all exactly55px. Keep the desk slab thin. EXTEND the matte black metal legs downward so their existing feet stay EXACTLY at original floor anchors: front-left foot around x543 y821, rear-left foot x677 y765. Tall natural legs with physically correct perspective, room under desk. Chair must remain EXACTLY unchanged at original x/y and size: Herman Miller Aeron black mesh with its wheels and arms in same places. Do not move the foreground rug, floor seams, armchair, side table, shelving, plants, wall artwork, window mullions, city skyline, bridge, river or camera. Revealed area under raised tabletop should naturally show original stone wall and correctly cast desk shadow. This is a geometry correction, not a redesign. Preserve illustrated premium fine paper surface, crisp rich details, summer noon light/colors and all composition. Desk lamp remains OFF: no glowing bulb or gold halo. No text, no added furniture, no humans, no dog. Output exact original widescreen aspect ratio 1672:941.

## Measured anchor coordinates

The model did not produce a uniform 55px translation. The approved result raises the monitor about 58px, keyboard/table front about 66px, and lamp top about 50px. Application overlays must use the measured anchors below rather than a common wrapper translation. Measurements are image coordinates; minor raster edge antialiasing is approximate.

| Element | Pixel coordinates in 1672 × 941 master |
| --- | --- |
| Monitor inner quadrilateral | (896,339), (1237,337), (1237,503), (896,498) |
| Monitor overlay bounding box | x896, y339, width341, height164 |
| Left speaker | x826, y472, width55, height80 |
| Right speaker | x1269, y472, width56, height83 |
| Keyboard | x952, y548, width189, height36 |
| Cup rim | center (1371,525), ellipse46 × 10 |
| Cup interaction box | x1344, y519, width75, height54 |
| Singing bowl rim | center (715,530), ellipse48 × 10 |
| Singing bowl interaction box | x688, y523, width58, height28 |
| Notebook | x637, y541, width141, height38 |
| Fountain pen | x665, y548, width84, height18 |
| Lamp shade lower edge | x1380–1530, y475–484 |
| Lamp light center | (1455,483), suggested light line100 × 4 |
| Lamp base center | (1452,558) |
| Desktop back line | (611,536) to (1557,562) |
| Desktop front line | (511,581) to (1594,607) |

## Verification

The master was visually inspected and approved by the integration agent before seasonal rendering. Each seasonal worker records its prompt and output inspection in its own `DESK-HEIGHT-{SEASON}.md`. Integration checks the complete 20-image inventory, dimensions, decode integrity, and monitor registration. Browser interaction is the integration agent's responsibility.

### Completed integration checks

- All 20 final seasonal WebPs were viewed after integration. Higher tabletop, extended legs, fixed floor contacts, retained Aeron chair, all desk equipment, blank monitor, unlit brass lamp, and distinct seasonal/time lighting were checked.
- Full decode and exact `1672 × 941` dimensions: **20/20 pass**.
- Total encoded size for all 20 plates: **10,136,374 bytes**. The application continues to load selected plates lazily.
- Independent read-only pixel registration check: grayscale gradient magnitude, normalized cross-correlation in a ±4px search around nine fixed areas (monitor, keyboard, cup, bowl, lamp, two speakers, pen, front desk edge). Maximum best-match axis displacement was **1px** across all 180 comparisons. All other outputs/areas were zero displacement. This is a sampled registration check, not a claim of identical pixels under changed lighting.
- Nonzero registrations: autumn afternoon monitor (−1,0), pen (0,−1), desk front (0,−1); summer afternoon monitor (−1,0).
- Best-match NCC scores ranged from 0.653 to 1.000 as lighting and seasonal backgrounds change. Visual inspection supplemented the numeric comparison, including rejecting and regenerating initial drafts that reverted to the low desk.
- Spring decoration has a minor shelf-blossom placement difference between morning/noon and later times; desk geometry and interactions stay registered.
- No application behavior changed in this asset branch, so browser and application tests remain with the integration agent updating the corresponding interactive coordinates.
