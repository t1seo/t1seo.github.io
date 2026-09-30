# Spring desk and hardware upgrade

Date: 2026-09-30.
Scope: only the five spring scene plates in `public/assets/cyberpunk/climate/`. App code is owned by the integration agent.

## Method and inputs

- Built-in `image_gen` edit mode, five independent requests in parallel. No API/CLI fallback.
- Approved geometry master/edit target: `public/assets/cyberpunk/desk-reference.webp` in the integration worktree `/Users/cillian/Downloads/landingpage-worktrees/cyberpunk-studio`.
- Master original built-in PNG: `/Users/cillian/.codex/generated_images/01a0ec28-a86f-7212-b864-067620f71e16/exec-4720305b-77e8-42dd-8dc1-f2dd1b3ca334.png`.
- Second reference for each request: the corresponding original spring scene plate at branch baseline `88288fc`, used only for spring decor and time-of-day lighting.
- Viewed the master and all five source plates before editing.
- All generated PNGs are 1672 × 941. Whole-image conversion only: `cwebp -q 88 INPUT.png -o public/assets/cyberpunk/climate/spring-TIME.webp`. No cropping, compositing, painting, or programmatic image edits.

## Selected generated outputs

| Time | Built-in output retained at original path |
| --- | --- |
| morning | `/Users/cillian/.codex/generated_images/01a0efe6-dd37-7ba3-846a-576345f44c18/exec-3dc33e27-4456-43d4-a039-55063faba25c.png` |
| noon | `/Users/cillian/.codex/generated_images/01a0efe6-dd37-7ba3-846a-576345f44c18/exec-b4ca89c4-14b4-48a7-839a-e8a9047bf7a5.png` |
| afternoon | `/Users/cillian/.codex/generated_images/01a0efe6-dd37-7ba3-846a-576345f44c18/exec-44f98aac-f535-431c-811a-e7182fc66787.png` |
| evening | `/Users/cillian/.codex/generated_images/01a0efe6-dd37-7ba3-846a-576345f44c18/exec-2bf73999-a13b-4958-a4ef-2940d8bf28fc.png` |
| night | `/Users/cillian/.codex/generated_images/01a0efe6-dd37-7ba3-846a-576345f44c18/exec-da23a1a0-4fc1-488f-8bf8-784e1b5f94bf.png` |

## Visual checks

All five selected images were inspected individually. Each preserves the master's thin walnut front edge, front/rear dark metal legs with floor contact, graphite mesh Aeron-style chair, ivory compact keyboard, aluminum monitor pedestal, walnut/linen speaker pair, singing bowl, ceramic cup, and one black-and-gold fountain pen on the notebook. The display remains blank dark teal, and the desk lamp remains unlit. Camera, mullions, bridge, desk object positions, and furniture silhouettes visually align with the master.

Spring changes include blush sofa cushion, pale pink blossom wall art, flowering bookshelf vase, blossoms on the right-side plant, and riverbank cherry blossoms. Morning has a low peach sunrise; noon has clear blue daylight; afternoon has gold-orange light; evening has a peach/indigo horizon and city illumination; night has a navy sky and illuminated windows/reflections.

This is visual comparison of raster source plates, not a claim of pixel-identical registration or browser UI verification. App interaction alignment is checked during root integration.

An independent read-only visual reviewer also inspected all six images and found no blocking geometry or object drift. Minor observation: the small white-pot shelf plant is sparser/darker in evening; afternoon is intentionally golden-hour but remains distinguishable from evening.

## Full prompts

Each request uses image 1 as the master and image 2 as that time's original spring plate.

### morning

```text
Use case: lighting-weather. Asset type: production 2.5D paper-textured illustrated room background plate, landscape 1672 x 941.
Input image 1 is the EDIT TARGET and the approved geometry master. Input image 2 is ONLY supporting reference for spring season decoration and morning lighting. EDIT IMAGE 1, do not recreate image 2 furniture.
Primary request: convert the approved master into SPRING MORNING using the lighting and seasonal decor of image 2, while retaining image 1 furniture exactly.
Lighting/mood: Early spring morning: pale peach low sunrise on left horizon, soft blue sky, gentle warm low-angle sunlight, cherry blossom banks pale pink. No bright noon lighting.
Spring interior changes: the wall artwork at far left becomes tasteful pale pink and white blossoms; sofa cushion soft dusty blush pink; a small bunch of cherry blossom stems in the bookshelf vase; delicate pink blossoms mixed into the right window-side plant. Keep flower placements matching the supporting reference without adding other decor.
STRICT INVARIANTS FROM IMAGE 1: exact camera, crop and perspective, all window mullion positions, all skyline/bridge geometry, the thin walnut desktop with slim front edge, the physically visible slim dark metal desk legs and realistic floor contact, the graphite Herman Miller Aeron mesh office chair at lower right, the thin aluminum Apple Studio Display-like monitor and its single aluminum pedestal, the small ivory HHKB 60-key keyboard, the two premium walnut and woven-linen speakers with rounded corners, the ONE black lacquer gold-trim fountain pen on the closed notebook, cup, singing bowl, mouse, lamp and every tabletop object's exact position and scale. Preserve desk geometry, chair geometry and screen inner rectangle precisely; image 2's thick wooden desk apron, old padded chair and black keyboard must NOT reappear.
Screen must remain completely blank uniform dark teal, no graphics or text. Desk lamp must remain OFF with NO glowing strip or light pool beneath shade; metallic reflections from ambient room light are okay. Night/evening bookshelf niche lights can remain on. Keep material polish and subtle tactile paper illustration texture consistent with master. No people, pets, text, logos, watermark, UI, weather particles or extra objects. Do not move anything or change composition. Only lighting, spring foliage and textiles change.
```

### noon

```text
Use case: lighting-weather. Asset type: production 2.5D paper-textured illustrated room background plate, landscape 1672 x 941.
Input image 1 is the EDIT TARGET and the approved geometry master. Input image 2 is ONLY supporting reference for spring season decoration and noon lighting. EDIT IMAGE 1, do not recreate image 2 furniture.
Primary request: convert the approved master into SPRING NOON using the lighting and seasonal decor of image 2, while retaining image 1 furniture exactly.
Lighting/mood: Fresh spring noon: clear pale blue sky with small white clouds, crisp natural daylight, lively fresh green mountain foliage and pale pink cherry blossom riverbanks.
Spring interior changes: the wall artwork at far left becomes tasteful pale pink and white blossoms; sofa cushion soft dusty blush pink; a small bunch of cherry blossom stems in the bookshelf vase; delicate pink blossoms mixed into the right window-side plant. Keep flower placements matching the supporting reference without adding other decor.
STRICT INVARIANTS FROM IMAGE 1: exact camera, crop and perspective, all window mullion positions, all skyline/bridge geometry, the thin walnut desktop with slim front edge, the physically visible slim dark metal desk legs and realistic floor contact, the graphite Herman Miller Aeron mesh office chair at lower right, the thin aluminum Apple Studio Display-like monitor and its single aluminum pedestal, the small ivory HHKB 60-key keyboard, the two premium walnut and woven-linen speakers with rounded corners, the ONE black lacquer gold-trim fountain pen on the closed notebook, cup, singing bowl, mouse, lamp and every tabletop object's exact position and scale. Preserve desk geometry, chair geometry and screen inner rectangle precisely; image 2's thick wooden desk apron, old padded chair and black keyboard must NOT reappear.
Screen must remain completely blank uniform dark teal, no graphics or text. Desk lamp must remain OFF with NO glowing strip or light pool beneath shade; metallic reflections from ambient room light are okay. Night/evening bookshelf niche lights can remain on. Keep material polish and subtle tactile paper illustration texture consistent with master. No people, pets, text, logos, watermark, UI, weather particles or extra objects. Do not move anything or change composition. Only lighting, spring foliage and textiles change.
```

### afternoon

```text
Use case: lighting-weather. Asset type: production 2.5D paper-textured illustrated room background plate, landscape 1672 x 941.
Input image 1 is the EDIT TARGET and the approved geometry master. Input image 2 is ONLY supporting reference for spring season decoration and afternoon lighting. EDIT IMAGE 1, do not recreate image 2 furniture.
Primary request: convert the approved master into SPRING AFTERNOON using the lighting and seasonal decor of image 2, while retaining image 1 furniture exactly.
Lighting/mood: Late spring afternoon: golden amber sunlight on room wall and tabletop, warm orange-peach clouds, luminous river reflections and pale pink blossom banks; still daytime.
Spring interior changes: the wall artwork at far left becomes tasteful pale pink and white blossoms; sofa cushion soft dusty blush pink; a small bunch of cherry blossom stems in the bookshelf vase; delicate pink blossoms mixed into the right window-side plant. Keep flower placements matching the supporting reference without adding other decor.
STRICT INVARIANTS FROM IMAGE 1: exact camera, crop and perspective, all window mullion positions, all skyline/bridge geometry, the thin walnut desktop with slim front edge, the physically visible slim dark metal desk legs and realistic floor contact, the graphite Herman Miller Aeron mesh office chair at lower right, the thin aluminum Apple Studio Display-like monitor and its single aluminum pedestal, the small ivory HHKB 60-key keyboard, the two premium walnut and woven-linen speakers with rounded corners, the ONE black lacquer gold-trim fountain pen on the closed notebook, cup, singing bowl, mouse, lamp and every tabletop object's exact position and scale. Preserve desk geometry, chair geometry and screen inner rectangle precisely; image 2's thick wooden desk apron, old padded chair and black keyboard must NOT reappear.
Screen must remain completely blank uniform dark teal, no graphics or text. Desk lamp must remain OFF with NO glowing strip or light pool beneath shade; metallic reflections from ambient room light are okay. Night/evening bookshelf niche lights can remain on. Keep material polish and subtle tactile paper illustration texture consistent with master. No people, pets, text, logos, watermark, UI, weather particles or extra objects. Do not move anything or change composition. Only lighting, spring foliage and textiles change.
```

### evening

```text
Use case: lighting-weather. Asset type: production 2.5D paper-textured illustrated room background plate, landscape 1672 x 941.
Input image 1 is the EDIT TARGET and the approved geometry master. Input image 2 is ONLY supporting reference for spring season decoration and evening lighting. EDIT IMAGE 1, do not recreate image 2 furniture.
Primary request: convert the approved master into SPRING EVENING using the lighting and seasonal decor of image 2, while retaining image 1 furniture exactly.
Lighting/mood: Spring evening blue hour: peach-violet horizon fading into indigo blue sky, warm city windows and bridge lights, glimmering gold water reflections; room softly dim with warm bookshelf lights, no direct sun.
Spring interior changes: the wall artwork at far left becomes tasteful pale pink and white blossoms; sofa cushion soft dusty blush pink; a small bunch of cherry blossom stems in the bookshelf vase; delicate pink blossoms mixed into the right window-side plant. Keep flower placements matching the supporting reference without adding other decor.
STRICT INVARIANTS FROM IMAGE 1: exact camera, crop and perspective, all window mullion positions, all skyline/bridge geometry, the thin walnut desktop with slim front edge, the physically visible slim dark metal desk legs and realistic floor contact, the graphite Herman Miller Aeron mesh office chair at lower right, the thin aluminum Apple Studio Display-like monitor and its single aluminum pedestal, the small ivory HHKB 60-key keyboard, the two premium walnut and woven-linen speakers with rounded corners, the ONE black lacquer gold-trim fountain pen on the closed notebook, cup, singing bowl, mouse, lamp and every tabletop object's exact position and scale. Preserve desk geometry, chair geometry and screen inner rectangle precisely; image 2's thick wooden desk apron, old padded chair and black keyboard must NOT reappear.
Screen must remain completely blank uniform dark teal, no graphics or text. Desk lamp must remain OFF with NO glowing strip or light pool beneath shade; metallic reflections from ambient room light are okay. Night/evening bookshelf niche lights can remain on. Keep material polish and subtle tactile paper illustration texture consistent with master. No people, pets, text, logos, watermark, UI, weather particles or extra objects. Do not move anything or change composition. Only lighting, spring foliage and textiles change.
```

### night

```text
Use case: lighting-weather. Asset type: production 2.5D paper-textured illustrated room background plate, landscape 1672 x 941.
Input image 1 is the EDIT TARGET and the approved geometry master. Input image 2 is ONLY supporting reference for spring season decoration and night lighting. EDIT IMAGE 1, do not recreate image 2 furniture.
Primary request: convert the approved master into SPRING NIGHT using the lighting and seasonal decor of image 2, while retaining image 1 furniture exactly.
Lighting/mood: Spring late night: deep navy sky, illuminated city windows and bridge, gold river reflections, spring pink cherry blossom banks subtly illuminated, dim navy room balanced by warm bookshelf niche lighting; no sunlight or bright sky.
Spring interior changes: the wall artwork at far left becomes tasteful pale pink and white blossoms; sofa cushion soft dusty blush pink; a small bunch of cherry blossom stems in the bookshelf vase; delicate pink blossoms mixed into the right window-side plant. Keep flower placements matching the supporting reference without adding other decor.
STRICT INVARIANTS FROM IMAGE 1: exact camera, crop and perspective, all window mullion positions, all skyline/bridge geometry, the thin walnut desktop with slim front edge, the physically visible slim dark metal desk legs and realistic floor contact, the graphite Herman Miller Aeron mesh office chair at lower right, the thin aluminum Apple Studio Display-like monitor and its single aluminum pedestal, the small ivory HHKB 60-key keyboard, the two premium walnut and woven-linen speakers with rounded corners, the ONE black lacquer gold-trim fountain pen on the closed notebook, cup, singing bowl, mouse, lamp and every tabletop object's exact position and scale. Preserve desk geometry, chair geometry and screen inner rectangle precisely; image 2's thick wooden desk apron, old padded chair and black keyboard must NOT reappear.
Screen must remain completely blank uniform dark teal, no graphics or text. Desk lamp must remain OFF with NO glowing strip or light pool beneath shade; metallic reflections from ambient room light are okay. Night/evening bookshelf niche lights can remain on. Keep material polish and subtle tactile paper illustration texture consistent with master. No people, pets, text, logos, watermark, UI, weather particles or extra objects. Do not move anything or change composition. Only lighting, spring foliage and textiles change.
```
