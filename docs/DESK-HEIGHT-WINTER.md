# Winter raised-desk image replacement

Date: 2026-09-30
Branch: `fix/desk-height-winter`
Scope: only `public/assets/cyberpunk/climate/winter-{morning,noon,afternoon,evening,night}.webp` and this document.

## Request and method

Replace the five winter studio backgrounds using the approved raised ergonomic desk geometry. Preserve thin walnut slab, extended legs with unchanged floor anchors, all desk object positions, blank monitor, lamp OFF, floor/rug and Aeron chair. Keep visible Christmas tree, ornaments, fairy lights, wrapped gifts, wreath and winter textiles, with snowy Seoul and dormant snowy mountains at all five times.

Used only the built-in `image_gen.imagegen` tool, opaque outputs. Read the imagegen skill and inspected the master and all five original seasonal images using `view_image` before editing. No CLI/API image generation, raster compositing, region transforms or hand repainting.

Geometry master / first edit target:
`/Users/cillian/Downloads/landingpage-worktrees/studio-desk-height/public/assets/cyberpunk/desk-height-reference.webp`

Second image for each first-pass call (season and lighting reference only):
`/Users/cillian/Downloads/landingpage-worktrees/desk-height-winter/public/assets/cyberpunk/climate/winter-{time}.webp`, original branch version before this replacement.

Morning, noon, afternoon and evening first-pass outputs were accepted. Initial night output drifted toward the reference's lower desktop and was rejected:
`/Users/cillian/.codex/generated_images/01a0f00c-9b3a-78e1-ac27-b773fc7fd172/exec-fc5fefce-08cd-45f1-b1f8-c6aa03f4a219.png`.

Final night was created by relighting the accepted winter-noon PNG as the single edit target, after inspecting that PNG. This retained the already measured master geometry and winter decor without competition from the original low-desk night reference.

## Saved assets and source outputs

All accepted PNGs and final WebPs are exactly 1672 × 941.

| Time | Workspace asset | Built-in source PNG |
| --- | --- | --- |
| morning | `public/assets/cyberpunk/climate/winter-morning.webp` | `/Users/cillian/.codex/generated_images/01a0f00c-9b3a-78e1-ac27-b773fc7fd172/exec-f89f76a8-34fd-4142-adb5-9782c5fe5ef4.png` |
| noon | `public/assets/cyberpunk/climate/winter-noon.webp` | `/Users/cillian/.codex/generated_images/01a0f00c-9b3a-78e1-ac27-b773fc7fd172/exec-9555e550-2e37-478d-acd8-102c287bf510.png` |
| afternoon | `public/assets/cyberpunk/climate/winter-afternoon.webp` | `/Users/cillian/.codex/generated_images/01a0f00c-9b3a-78e1-ac27-b773fc7fd172/exec-5273444a-becd-4daf-afbd-a1d27c497027.png` |
| evening | `public/assets/cyberpunk/climate/winter-evening.webp` | `/Users/cillian/.codex/generated_images/01a0f00c-9b3a-78e1-ac27-b773fc7fd172/exec-444cea12-e6c5-4690-92d2-bc306d810d99.png` |
| night | `public/assets/cyberpunk/climate/winter-night.webp` | `/Users/cillian/.codex/generated_images/01a0f00c-9b3a-78e1-ac27-b773fc7fd172/exec-5e92fb5b-49e9-4dd7-b916-ad8372a53900.png` |

Each accepted PNG was converted as a whole image:
`cwebp -q 95 -m 6 SOURCE.png -o public/assets/cyberpunk/climate/winter-TIME.webp`

No resize, crop, geometric transform or localized pixel edits were applied.

## Checks

- Visually inspected all source outputs for raised desk, anchored feet, monitor/keyboard/object placement, dark blank monitor, lamp OFF, Christmas interior decor, snowy exterior and five distinct times.
- Independent read-only reviewer inspected each accepted original-size PNG.
- Gradient-edge registration checked seven fixed-object regions against the approved master. For each ROI, grayscale gradient magnitude was compared with candidate shifts at every integer dx/dy in [-8,8], using normalized mean-subtracted correlation.
- Regions (x0,y0,x1,y1), exclusive upper endpoints: monitor top (890,325,1247,355), monitor lower (883,494,1245,526), desk front (610,582,1510,625), left desk leg (525,603,564,828), lamp (1370,414,1545,565), right speaker (1264,468,1332,558), mouse (1190,550,1248,585).
- Morning/noon/afternoon/evening: all seven regions selected (0,0) best-fit shift against master. Correlation ranges: morning/noon together 0.752–0.982; afternoon 0.807–0.982; evening 0.819–0.978.
- Corrected night: monitor top (0,0), 0.811; monitor lower (0,0), 0.708; desk front (1,0), 0.861; left leg (0,0), 0.685; lamp (0,0), 0.708; right speaker (0,0), 0.830; mouse (0,0), 0.769.
- The measurements confirm sampled rigid alignment, not pixel identity of every contour.
- Lamp review: bronze ambient/specular reflections remain; underside is dark, without a luminous bulb/rim or lamp-emitted light pool. Christmas fairy lights remain lit.
- Parent agent independently viewed corrected night and accepted height, monitor, lamp OFF and Christmas interior.
- Known visual variation: the first-pass original time references produce small differences in tree ornaments/star height/gift arrangement between times. Fixed desk interaction objects retain their approved registration. Final night inherits the noon decor arrangement.
- WebP encoding reported successful 1672 × 941 dimensions for all five assets; final WebP decode verification completed.
- No source code or runtime interaction changes. Parent agent handles integrated Chrome UI verification.

## Complete prompt set

All first-pass calls used the geometry master as image 1 and the matching original winter-time asset as image 2, with `transparent_background: false`.

### First pass: morning

```text
Use case: lighting-weather.
Asset type: premium illustrated interactive studio website background, exact full-frame 1672 x 941 composition.
Input images: IMAGE 1 IS THE EDIT TARGET AND ABSOLUTE GEOMETRY MASTER (approved raised ergonomic desk). IMAGE 2 IS ONLY A WINTER DECOR AND TIME-OF-DAY LIGHTING REFERENCE. Never copy the lower desk geometry from image 2.
Primary request: Edit IMAGE 1 into winter Christmas at winter sunrise: warm peach and pale gold clouds, low sun on the far RIGHT above the horizon, cold pale blue atmosphere, gentle long sunlit shadows. Match image 2's morning lighting.. Keep the entire fixed camera, crop, perspective, all architecture, wall/window mullions, furniture geometry and object positions IDENTICAL TO IMAGE 1. Transfer only winter scenery, Christmas decor and lighting mood from image 2 onto image 1.
WINTER: snowy Seoul skyline, Han river and bridge in same exact arrangement, Namsan tower, snow-covered dormant pale mountains and winter trees, no summer green mountains. Rich actual Christmas interior: dimensional evergreen Christmas tree between bookshelf and window, gold star topper, red/gold ornaments, snowflake ornaments, warm tiny fairy lights, red/gold wrapped gifts at its base, wreath over left artwork, cream knitted throw and burgundy velvet pillow on lounge chair. Keep Christmas tree/gifts decor around the master furniture, without covering the raised desk or changing its position.
ABSOLUTE REGISTERED GEOMETRY: retain image 1's thin walnut desktop and its higher ergonomic height. At 1672x941, desktop left front top corner is (511,581), monitor inner display is x897..1238 y341..500. Keep monitor/stand at that height and the image 1 object positions: white keyboard center (1045,568), brass bowl (714,533), speakers (850,511) and (1297,515), ceramic cup center (1375,550), brass dome lamp TOP (1455,424), lamp BASE (1455,561). Pen cup, notebook, fountain pen, mouse, mat, small brass canister all stay on raised tabletop exactly as image 1. Keep the thin natural walnut slab and long metal legs down to the SAME anchored floor feet as image 1. Aeron mesh chair at bottom-right, chair scale, armrests, floor and rug boundaries all remain exactly image 1. Do not lower desk; do not translate the whole image; do not crop, stretch or change lens.
LIGHTING: winter sunrise: warm peach and pale gold clouds, low sun on the far RIGHT above the horizon, cold pale blue atmosphere, gentle long sunlit shadows. Match image 2's morning lighting.
LAMP MUST BE OFF: brass dome desk lamp remains an unlit reflective brass object with dark underside, no bulb glow, no glowing inner rim, no light cast from lamp on desk, even at night. Christmas fairy lights and bookshelf ambient lights may illuminate. Monitor stays completely blank deep-dark teal/navy with no interface, no text, no symbols.
Style/quality: Preserve the master's refined premium 2.5D tactile-paper illustration, fine layered grain, clean delicate edges, soft physical shadows, crisp details, no flat vector simplification, no smearing. No people, text, logo, watermark or added objects. Make only the specified winter decor/weather/lighting edits to image 1; keep geometry and high desk exactly.
```

### First pass: noon

```text
Use case: lighting-weather.
Asset type: premium illustrated interactive studio website background, exact full-frame 1672 x 941 composition.
Input images: IMAGE 1 IS THE EDIT TARGET AND ABSOLUTE GEOMETRY MASTER (approved raised ergonomic desk). IMAGE 2 IS ONLY A WINTER DECOR AND TIME-OF-DAY LIGHTING REFERENCE. Never copy the lower desk geometry from image 2.
Primary request: Edit IMAGE 1 into winter Christmas at crisp clear winter noon: bright blue sky with white clouds, strong clean daylight and cool snow, pleasant natural sunlit room. Match image 2's noon lighting.. Keep the entire fixed camera, crop, perspective, all architecture, wall/window mullions, furniture geometry and object positions IDENTICAL TO IMAGE 1. Transfer only winter scenery, Christmas decor and lighting mood from image 2 onto image 1.
WINTER: snowy Seoul skyline, Han river and bridge in same exact arrangement, Namsan tower, snow-covered dormant pale mountains and winter trees, no summer green mountains. Rich actual Christmas interior: dimensional evergreen Christmas tree between bookshelf and window, gold star topper, red/gold ornaments, snowflake ornaments, warm tiny fairy lights, red/gold wrapped gifts at its base, wreath over left artwork, cream knitted throw and burgundy velvet pillow on lounge chair. Keep Christmas tree/gifts decor around the master furniture, without covering the raised desk or changing its position.
ABSOLUTE REGISTERED GEOMETRY: retain image 1's thin walnut desktop and its higher ergonomic height. At 1672x941, desktop left front top corner is (511,581), monitor inner display is x897..1238 y341..500. Keep monitor/stand at that height and the image 1 object positions: white keyboard center (1045,568), brass bowl (714,533), speakers (850,511) and (1297,515), ceramic cup center (1375,550), brass dome lamp TOP (1455,424), lamp BASE (1455,561). Pen cup, notebook, fountain pen, mouse, mat, small brass canister all stay on raised tabletop exactly as image 1. Keep the thin natural walnut slab and long metal legs down to the SAME anchored floor feet as image 1. Aeron mesh chair at bottom-right, chair scale, armrests, floor and rug boundaries all remain exactly image 1. Do not lower desk; do not translate the whole image; do not crop, stretch or change lens.
LIGHTING: crisp clear winter noon: bright blue sky with white clouds, strong clean daylight and cool snow, pleasant natural sunlit room. Match image 2's noon lighting.
LAMP MUST BE OFF: brass dome desk lamp remains an unlit reflective brass object with dark underside, no bulb glow, no glowing inner rim, no light cast from lamp on desk, even at night. Christmas fairy lights and bookshelf ambient lights may illuminate. Monitor stays completely blank deep-dark teal/navy with no interface, no text, no symbols.
Style/quality: Preserve the master's refined premium 2.5D tactile-paper illustration, fine layered grain, clean delicate edges, soft physical shadows, crisp details, no flat vector simplification, no smearing. No people, text, logo, watermark or added objects. Make only the specified winter decor/weather/lighting edits to image 1; keep geometry and high desk exactly.
```

### First pass: afternoon

```text
Use case: lighting-weather.
Asset type: premium illustrated interactive studio website background, exact full-frame 1672 x 941 composition.
Input images: IMAGE 1 IS THE EDIT TARGET AND ABSOLUTE GEOMETRY MASTER (approved raised ergonomic desk). IMAGE 2 IS ONLY A WINTER DECOR AND TIME-OF-DAY LIGHTING REFERENCE. Never copy the lower desk geometry from image 2.
Primary request: Edit IMAGE 1 into winter Christmas at winter golden afternoon near sunset: golden orange sky and yellow clouds, low sun on the LEFT near the mountain horizon, amber river reflections and warm long shadows. Match image 2's afternoon lighting.. Keep the entire fixed camera, crop, perspective, all architecture, wall/window mullions, furniture geometry and object positions IDENTICAL TO IMAGE 1. Transfer only winter scenery, Christmas decor and lighting mood from image 2 onto image 1.
WINTER: snowy Seoul skyline, Han river and bridge in same exact arrangement, Namsan tower, snow-covered dormant pale mountains and winter trees, no summer green mountains. Rich actual Christmas interior: dimensional evergreen Christmas tree between bookshelf and window, gold star topper, red/gold ornaments, snowflake ornaments, warm tiny fairy lights, red/gold wrapped gifts at its base, wreath over left artwork, cream knitted throw and burgundy velvet pillow on lounge chair. Keep Christmas tree/gifts decor around the master furniture, without covering the raised desk or changing its position.
ABSOLUTE REGISTERED GEOMETRY: retain image 1's thin walnut desktop and its higher ergonomic height. At 1672x941, desktop left front top corner is (511,581), monitor inner display is x897..1238 y341..500. Keep monitor/stand at that height and the image 1 object positions: white keyboard center (1045,568), brass bowl (714,533), speakers (850,511) and (1297,515), ceramic cup center (1375,550), brass dome lamp TOP (1455,424), lamp BASE (1455,561). Pen cup, notebook, fountain pen, mouse, mat, small brass canister all stay on raised tabletop exactly as image 1. Keep the thin natural walnut slab and long metal legs down to the SAME anchored floor feet as image 1. Aeron mesh chair at bottom-right, chair scale, armrests, floor and rug boundaries all remain exactly image 1. Do not lower desk; do not translate the whole image; do not crop, stretch or change lens.
LIGHTING: winter golden afternoon near sunset: golden orange sky and yellow clouds, low sun on the LEFT near the mountain horizon, amber river reflections and warm long shadows. Match image 2's afternoon lighting.
LAMP MUST BE OFF: brass dome desk lamp remains an unlit reflective brass object with dark underside, no bulb glow, no glowing inner rim, no light cast from lamp on desk, even at night. Christmas fairy lights and bookshelf ambient lights may illuminate. Monitor stays completely blank deep-dark teal/navy with no interface, no text, no symbols.
Style/quality: Preserve the master's refined premium 2.5D tactile-paper illustration, fine layered grain, clean delicate edges, soft physical shadows, crisp details, no flat vector simplification, no smearing. No people, text, logo, watermark or added objects. Make only the specified winter decor/weather/lighting edits to image 1; keep geometry and high desk exactly.
```

### First pass: evening

```text
Use case: lighting-weather.
Asset type: premium illustrated interactive studio website background, exact full-frame 1672 x 941 composition.
Input images: IMAGE 1 IS THE EDIT TARGET AND ABSOLUTE GEOMETRY MASTER (approved raised ergonomic desk). IMAGE 2 IS ONLY A WINTER DECOR AND TIME-OF-DAY LIGHTING REFERENCE. Never copy the lower desk geometry from image 2.
Primary request: Edit IMAGE 1 into winter Christmas at winter blue-hour twilight: blue-violet sky, salmon-pink band on horizon, city windows and bridge lights on with beautiful blue and gold river reflections. Warm ambient interior and Christmas lights. Match image 2's evening lighting.. Keep the entire fixed camera, crop, perspective, all architecture, wall/window mullions, furniture geometry and object positions IDENTICAL TO IMAGE 1. Transfer only winter scenery, Christmas decor and lighting mood from image 2 onto image 1.
WINTER: snowy Seoul skyline, Han river and bridge in same exact arrangement, Namsan tower, snow-covered dormant pale mountains and winter trees, no summer green mountains. Rich actual Christmas interior: dimensional evergreen Christmas tree between bookshelf and window, gold star topper, red/gold ornaments, snowflake ornaments, warm tiny fairy lights, red/gold wrapped gifts at its base, wreath over left artwork, cream knitted throw and burgundy velvet pillow on lounge chair. Keep Christmas tree/gifts decor around the master furniture, without covering the raised desk or changing its position.
ABSOLUTE REGISTERED GEOMETRY: retain image 1's thin walnut desktop and its higher ergonomic height. At 1672x941, desktop left front top corner is (511,581), monitor inner display is x897..1238 y341..500. Keep monitor/stand at that height and the image 1 object positions: white keyboard center (1045,568), brass bowl (714,533), speakers (850,511) and (1297,515), ceramic cup center (1375,550), brass dome lamp TOP (1455,424), lamp BASE (1455,561). Pen cup, notebook, fountain pen, mouse, mat, small brass canister all stay on raised tabletop exactly as image 1. Keep the thin natural walnut slab and long metal legs down to the SAME anchored floor feet as image 1. Aeron mesh chair at bottom-right, chair scale, armrests, floor and rug boundaries all remain exactly image 1. Do not lower desk; do not translate the whole image; do not crop, stretch or change lens.
LIGHTING: winter blue-hour twilight: blue-violet sky, salmon-pink band on horizon, city windows and bridge lights on with beautiful blue and gold river reflections. Warm ambient interior and Christmas lights. Match image 2's evening lighting.
LAMP MUST BE OFF: brass dome desk lamp remains an unlit reflective brass object with dark underside, no bulb glow, no glowing inner rim, no light cast from lamp on desk, even at night. Christmas fairy lights and bookshelf ambient lights may illuminate. Monitor stays completely blank deep-dark teal/navy with no interface, no text, no symbols.
Style/quality: Preserve the master's refined premium 2.5D tactile-paper illustration, fine layered grain, clean delicate edges, soft physical shadows, crisp details, no flat vector simplification, no smearing. No people, text, logo, watermark or added objects. Make only the specified winter decor/weather/lighting edits to image 1; keep geometry and high desk exactly.
```

### First pass: night

```text
Use case: lighting-weather.
Asset type: premium illustrated interactive studio website background, exact full-frame 1672 x 941 composition.
Input images: IMAGE 1 IS THE EDIT TARGET AND ABSOLUTE GEOMETRY MASTER (approved raised ergonomic desk). IMAGE 2 IS ONLY A WINTER DECOR AND TIME-OF-DAY LIGHTING REFERENCE. Never copy the lower desk geometry from image 2.
Primary request: Edit IMAGE 1 into winter Christmas at deep winter NIGHT: dark navy sky, snowy mountains dark blue with visible snow ridges, illuminated city windows, tower, bridge and golden river reflections, cosy warm ambient interior and Christmas fairy lights. Match image 2's nighttime darkness, absolutely no sunset or sun.. Keep the entire fixed camera, crop, perspective, all architecture, wall/window mullions, furniture geometry and object positions IDENTICAL TO IMAGE 1. Transfer only winter scenery, Christmas decor and lighting mood from image 2 onto image 1.
WINTER: snowy Seoul skyline, Han river and bridge in same exact arrangement, Namsan tower, snow-covered dormant pale mountains and winter trees, no summer green mountains. Rich actual Christmas interior: dimensional evergreen Christmas tree between bookshelf and window, gold star topper, red/gold ornaments, snowflake ornaments, warm tiny fairy lights, red/gold wrapped gifts at its base, wreath over left artwork, cream knitted throw and burgundy velvet pillow on lounge chair. Keep Christmas tree/gifts decor around the master furniture, without covering the raised desk or changing its position.
ABSOLUTE REGISTERED GEOMETRY: retain image 1's thin walnut desktop and its higher ergonomic height. At 1672x941, desktop left front top corner is (511,581), monitor inner display is x897..1238 y341..500. Keep monitor/stand at that height and the image 1 object positions: white keyboard center (1045,568), brass bowl (714,533), speakers (850,511) and (1297,515), ceramic cup center (1375,550), brass dome lamp TOP (1455,424), lamp BASE (1455,561). Pen cup, notebook, fountain pen, mouse, mat, small brass canister all stay on raised tabletop exactly as image 1. Keep the thin natural walnut slab and long metal legs down to the SAME anchored floor feet as image 1. Aeron mesh chair at bottom-right, chair scale, armrests, floor and rug boundaries all remain exactly image 1. Do not lower desk; do not translate the whole image; do not crop, stretch or change lens.
LIGHTING: deep winter NIGHT: dark navy sky, snowy mountains dark blue with visible snow ridges, illuminated city windows, tower, bridge and golden river reflections, cosy warm ambient interior and Christmas fairy lights. Match image 2's nighttime darkness, absolutely no sunset or sun.
LAMP MUST BE OFF: brass dome desk lamp remains an unlit reflective brass object with dark underside, no bulb glow, no glowing inner rim, no light cast from lamp on desk, even at night. Christmas fairy lights and bookshelf ambient lights may illuminate. Monitor stays completely blank deep-dark teal/navy with no interface, no text, no symbols.
Style/quality: Preserve the master's refined premium 2.5D tactile-paper illustration, fine layered grain, clean delicate edges, soft physical shadows, crisp details, no flat vector simplification, no smearing. No people, text, logo, watermark or added objects. Make only the specified winter decor/weather/lighting edits to image 1; keep geometry and high desk exactly.
```

### Final accepted night correction

Single referenced image: `/Users/cillian/.codex/generated_images/01a0f00c-9b3a-78e1-ac27-b773fc7fd172/exec-9555e550-2e37-478d-acd8-102c287bf510.png`. `transparent_background: false`.

```text
Use case: lighting-weather.
Edit the ONE supplied winter studio image. Change ONLY the time of day from noon to deep winter NIGHT. It already has the correct approved raised desk and Christmas decor. Preserve all geometry and every object's exact pixels and scale; this is a pure relighting operation.
Night lighting: deep dark navy night sky with subtle clouds, no sun, no sunset or pink horizon. Dark bluish snow-covered dormant mountains with Namsan tower lit. Turn on the city windows and warm bridge lights, with blue and gold reflections across the Han river. Soft warm ambient bookshelf lights and the existing warm Christmas fairy lights illuminate the room; leave interior luxuriously readable. Preserve exactly the Christmas tree and ornaments, star, wreath, gifts, knitted cream throw, burgundy cushion, all positions and arrangements in input.
ABSOLUTELY DO NOT MOVE OR RESCALE ANYTHING: keep raised thin walnut desk left front top corner at (511,581) with long dark legs and floor anchors unchanged. Monitor inner corners are (896,339),(1237,337),(1237,503),(896,498). Keep monitor y339, never lower. White keyboard center (1045,568); bowl (715,530); speakers (850,511)/(1297,515); cup ellipse center (1371,525), brass dome lamp top (1455,424), foot (1452,558). Preserve notebook and fountain pen, pen cup, mouse, desk mat and brass jar. Aeron chair, lounge chair, architecture, window mullions, floor and rug match unchanged. Full frame 1672x941.
DESK LAMP OFF: dark underside of the brass dome, no bulb visible, absolutely no emitted light or glowing underside/rim and no lamp light pool on desk; subtle metallic reflections from room allowed. Monitor remains blank dark teal, no text or screen UI. Preserve refined tactile paper illustration quality with crisp fine edges and grain. Change lighting only, keep exact desk and monitor positions, do not introduce geometric drift, no perspective change, crop or stretching.
```
