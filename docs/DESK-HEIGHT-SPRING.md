# Spring desk-height assets

## Scope

Replaced only five spring climate backgrounds with the approved raised ergonomic desk geometry. No source-code changes.

- Tool: built-in `image_gen__imagegen` (no CLI/API fallback).
- Master edit target: `/Users/cillian/Downloads/landingpage-worktrees/studio-desk-height/public/assets/cyberpunk/desk-height-reference.webp`.
- First-pass supporting inputs: pre-edit `public/assets/cyberpunk/climate/spring-{morning,noon,afternoon,evening,night}.webp`; spring decoration and lighting references only.
- Afternoon/evening/night retries used the master alone, as directed by coordinator, to prevent lower-desk geometry from the old images influencing the output.
- Final assets: 1672 × 941 WebP. Whole-image conversion/resizing only: `cwebp -quiet -q 94 -m 6 -resize 1672 941 SOURCE -o DESTINATION`.

## Final sources and destinations

| Time | Built-in output source | Workspace destination |
| --- | --- | --- |
| morning | `/Users/cillian/.codex/generated_images/01a0f00b-dd40-7eb2-9d00-e74eca491a91/exec-55419eff-d485-4c35-8e77-dc2a7ce9e311.png` | `public/assets/cyberpunk/climate/spring-morning.webp` |
| noon | `/Users/cillian/.codex/generated_images/01a0f00b-dd40-7eb2-9d00-e74eca491a91/exec-2aadfbc1-89da-400e-bee7-6be4c84046e5.png` | `public/assets/cyberpunk/climate/spring-noon.webp` |
| afternoon | `/Users/cillian/.codex/generated_images/01a0f00b-dd40-7eb2-9d00-e74eca491a91/exec-da29c3f5-0d9f-4248-8137-73207c4e80c2.png` | `public/assets/cyberpunk/climate/spring-afternoon.webp` |
| evening | `/Users/cillian/.codex/generated_images/01a0f00b-dd40-7eb2-9d00-e74eca491a91/exec-ed224e97-0e94-4c5c-9628-cbe2ad82d0d0.png` | `public/assets/cyberpunk/climate/spring-evening.webp` |
| night | `/Users/cillian/.codex/generated_images/01a0f00b-dd40-7eb2-9d00-e74eca491a91/exec-592b69f4-24cc-476c-bfc2-0a769ad493a5.png` | `public/assets/cyberpunk/climate/spring-night.webp` |

## Checks

- Inspected master, all original spring references, every generated output, and final assets.
- Rejected first afternoon pass because monitor top moved down about 8–9 px; rejected first night pass because desk and monitor moved down.
- First morning/noon passes preserved geometry; source output width was 1671 px and was normalized to 1672 px with whole-image cwebp resize.
- All selected images retain the thin raised walnut desktop, long black legs, Aeron chair, floor/rug, blank dark monitor, desk objects including the fountain pen, and an unlit brass desk lamp.
- Spring remains visible in pink blossom wall art, pink lounge cushion, blossom sprigs, flowering right plant, and cherry-blossom riverbanks; all five times of day remain distinct.
- Independent read-only review: selected afternoon/evening/night outputs matched desk edges, keyboard, bowl, both speakers, cup, lamp top/base, desk legs, chair arm and rug at dx=0/dy=0. Monitor boundaries differed from the master by at most 1 px. Selected morning/noon outputs had about 1 px horizontal offset before width normalization, with no vertical shift.
- Pillow decode check: all five final files successfully decoded as WebP at exactly 1672 × 941. Final WebP files were each visually inspected after conversion.
- Non-blocking decorative variation: the bookshelf blossom sprig sits on a different shelf in morning/noon versus afternoon/evening/night; interactive desk-object registration is unaffected.
- Browser interaction verification is left to root integration; this change contains assets only.

| Final file | Bytes | SHA-256 |
| --- | ---: | --- |
| spring-morning.webp | 462778 | 522aa12da4baf641cca7fb9ca1156fe08bad6f3efce3b89e2a3438072fb02bc2 |
| spring-noon.webp | 473168 | fcbc4a48cbc1112d38a9e1a27ab82e762e3b841a8cdfe1a3d3afc8c14a16b45b |
| spring-afternoon.webp | 544740 | e06e1f2026f46e5954bfb15b297f720934f3af15208b7db9f45ee2790e5e0e2b |
| spring-evening.webp | 522118 | 3c06d6e619fc69d67f0df0cb57b01b689e1febcc2ba873367d67693d69e5e43b |
| spring-night.webp | 514426 | c1048eda17dc34a17960328a002317e29c9116bf6ab7e70f6c995141786d8fd3 |

## Exact final prompts

### morning

Inputs: master + original spring-morning.webp.

```text
Use case: lighting-weather.
Asset type: interactive studio background; one single 1672x941 landscape image.
Primary request: Edit IMAGE 1 ONLY. It is the approved geometry MASTER. Transfer ONLY spring seasonal decorations and TIME lighting/sky atmosphere from IMAGE 2.
Input images: IMAGE 1 is edit target/master and controls 100% of camera, furniture and all object geometry. IMAGE 2 is LIGHTING + SPRING DECOR reference ONLY, never geometry.
Invariants: preserve IMAGE 1 exact composition pixel-registered, identical camera, perspective, horizon, windows, mountain/city and building locations. Keep the raised thin walnut desk and every desk object at IMAGE 1 coordinates. At 1672x941: tabletop left front corner(511,581); monitor inner display x897..1238 y341..500; keyboard center(1045,568); gold bowl(714,533); left speaker(850,511); right speaker(1297,515); ceramic cup(1375,550); brass mushroom lamp top(1455,424) base(1455,561). Desk has long visible black legs with same feet as MASTER. Keep dark empty blank screen, exact screen dimensions and position. All desk objects INCLUDING fountain pen on notebook, pen cup, keyboard, mouse, desk pad, speakers, gold bowl, lamp and cup stay exactly in MASTER locations. Aeron chair, lounge chair, floor, rug and table legs/feet remain identical geometry as MASTER. Do not copy IMAGE 2's lower desk or lower monitor.
Spring changes only: transfer pink cherry blossoms along both river banks and foreground streets; fresh green hills/trees; pink flowering right plant, blossom floral art on left wall, pink lounge cushion, subtle pink flower sprigs on bookshelf. Keep existing structures exactly.
Style/medium: maintain MASTER's fine hand-painted paper-textured illustration, premium subtle tactile detail. No photorealism, no 3D render.
Lamp MUST remain OFF, no light from beneath brass shade, no inner glow, no luminous underside even at night. Retain natural reflections on brass only.
Avoid: changed camera/crop, changed proportions, lower desk, moved/resized monitor or desk objects, extra or missing furniture, added text/UI/logo/watermark.
Lighting/mood: Soft spring morning sunrise: low sun in left sky as IMAGE 2, pale peach/yellow light fading into fresh pale blue overhead, warm slanting morning light on room and gold sunrise river reflection. Clearly early morning.
```

### noon

Inputs: master + original spring-noon.webp.

```text
Use case: lighting-weather.
Asset type: interactive studio background; one single 1672x941 landscape image.
Primary request: Edit IMAGE 1 ONLY. It is the approved geometry MASTER. Transfer ONLY spring seasonal decorations and TIME lighting/sky atmosphere from IMAGE 2.
Input images: IMAGE 1 is edit target/master and controls 100% of camera, furniture and all object geometry. IMAGE 2 is LIGHTING + SPRING DECOR reference ONLY, never geometry.
Invariants: preserve IMAGE 1 exact composition pixel-registered, identical camera, perspective, horizon, windows, mountain/city and building locations. Keep the raised thin walnut desk and every desk object at IMAGE 1 coordinates. At 1672x941: tabletop left front corner(511,581); monitor inner display x897..1238 y341..500; keyboard center(1045,568); gold bowl(714,533); left speaker(850,511); right speaker(1297,515); ceramic cup(1375,550); brass mushroom lamp top(1455,424) base(1455,561). Desk has long visible black legs with same feet as MASTER. Keep dark empty blank screen, exact screen dimensions and position. All desk objects INCLUDING fountain pen on notebook, pen cup, keyboard, mouse, desk pad, speakers, gold bowl, lamp and cup stay exactly in MASTER locations. Aeron chair, lounge chair, floor, rug and table legs/feet remain identical geometry as MASTER. Do not copy IMAGE 2's lower desk or lower monitor.
Spring changes only: transfer pink cherry blossoms along both river banks and foreground streets; fresh green hills/trees; pink flowering right plant, blossom floral art on left wall, pink lounge cushion, subtle pink flower sprigs on bookshelf. Keep existing structures exactly.
Style/medium: maintain MASTER's fine hand-painted paper-textured illustration, premium subtle tactile detail. No photorealism, no 3D render.
Lamp MUST remain OFF, no light from beneath brass shade, no inner glow, no luminous underside even at night. Retain natural reflections on brass only.
Avoid: changed camera/crop, changed proportions, lower desk, moved/resized monitor or desk objects, extra or missing furniture, added text/UI/logo/watermark.
Lighting/mood: Spring noon, clean bright blue sky and white clouds, clear fresh neutral daylight and bright blue Han river. Match IMAGE 2 spring blossoms and noon light.
```

### afternoon

Inputs: master only.

```text
Use case: lighting-weather.
Edit the supplied image. Keep every object, camera angle and all geometry pixel-registered exactly as supplied. This image is a 1672x941 MASTER of a room with a raised ergonomic walnut desk. Output same aspect ratio. Change ONLY spring decoration and time-of-day lighting.
CRITICAL: NEVER move the desk or any desk object. Monitor screen must remain exactly the same size and position as the supplied image. Inner screen quadrilateral at 1672x941 is (896,339),(1237,337),(1237,503),(896,498). Keep its TOP at y337-339; do not lower it or shorten its height! The display stays completely blank dark teal, with no content or glow. Tabletop left-frontcorner stays x511 y581. Keep long black desk legs and feet. Keyboard center1045,568; bowl ellipsecenter715,530width48height10; leftspeaker850,511; rightspeaker1297,515; cupellipsecenter1371,525width46height10; lampfoot1452,558; lampdometop1455,424. Keep notebook with visible fountainpen, penholder, bowl, keyboard, mouse, mat, speakers, cup, smallroundbrasscontainer, brasslamp identical. Maintain fixed loungechair and Aeronchair, floor and rug geometry, all shelf and window geometry.
Spring decoration: change left framed wallart to pale pink cherry blossom art; loungechair cushion soft blush pink; add small cherryblossom sprigs to bookshelf dark vase and blossoms to existing right-side green plant. Fill riverside tree rows and foreground streets with delicate pink cherry blossoms among fresh green leaves; mountains fresh springgreen when visible. Do not move buildings, river, bridge or city structures.
Keep the supplied painted finepaper illustration style, premium tactile paper texture. No photo or 3Drender, no text/logo/watermark, no extra objects.
The brass desk lamp is powered OFF in all lighting. Its inner shade and underside are dark unlit metal, never a light source. No light pool or innerglow. Brass only reflects ambient room light.
Lighting/mood: Spring late-afternoon golden hour, warm apricot-gold clouds and blue above, warm sunlight across room with long soft window shadows, golden reflections on river. 
Final priority: same exact MASTER raised tabletop and monitor size/top edge, only spring decorations and afternoon light.
```

### evening

Inputs: master only.

```text
Use case: lighting-weather.
Edit the supplied image. Keep every object, camera angle and all geometry pixel-registered exactly as supplied. This image is a 1672x941 MASTER of a room with a raised ergonomic walnut desk. Output same aspect ratio. Change ONLY spring decoration and time-of-day lighting.
CRITICAL: NEVER move the desk or any desk object. Monitor screen must remain exactly the same size and position as the supplied image. Inner screen quadrilateral at 1672x941 is (896,339),(1237,337),(1237,503),(896,498). Keep its TOP at y337-339; do not lower it or shorten its height! The display stays completely blank dark teal, with no content or glow. Tabletop left-frontcorner stays x511 y581. Keep long black desk legs and feet. Keyboard center1045,568; bowl ellipsecenter715,530width48height10; leftspeaker850,511; rightspeaker1297,515; cupellipsecenter1371,525width46height10; lampfoot1452,558; lampdometop1455,424. Keep notebook with visible fountainpen, penholder, bowl, keyboard, mouse, mat, speakers, cup, smallroundbrasscontainer, brasslamp identical. Maintain fixed loungechair and Aeronchair, floor and rug geometry, all shelf and window geometry.
Spring decoration: change left framed wallart to pale pink cherry blossom art; loungechair cushion soft blush pink; add small cherryblossom sprigs to bookshelf dark vase and blossoms to existing right-side green plant. Fill riverside tree rows and foreground streets with delicate pink cherry blossoms among fresh green leaves; mountains fresh springgreen when visible. Do not move buildings, river, bridge or city structures.
Keep the supplied painted finepaper illustration style, premium tactile paper texture. No photo or 3Drender, no text/logo/watermark, no extra objects.
The brass desk lamp is powered OFF in all lighting. Its inner shade and underside are dark unlit metal, never a light source. No light pool or innerglow. Brass only reflects ambient room light.
Lighting/mood: Spring evening twilight: orange-pink narrow horizon and purple/indigo sky, dark blue hills, illuminated skyline and bridge creating warm river reflections. Cozy subtle warm shelf lighting, desk lamp still OFF. 
Final priority: same exact MASTER raised tabletop and monitor size/top edge, only spring decorations and evening light.
```

### night

Inputs: master only.

```text
Use case: lighting-weather.
Edit the supplied image. Keep every object, camera angle and all geometry pixel-registered exactly as supplied. This image is a 1672x941 MASTER of a room with a raised ergonomic walnut desk. Output same aspect ratio. Change ONLY spring decoration and time-of-day lighting.
CRITICAL: NEVER move the desk or any desk object. Monitor screen must remain exactly the same size and position as the supplied image. Inner screen quadrilateral at 1672x941 is (896,339),(1237,337),(1237,503),(896,498). Keep its TOP at y337-339; do not lower it or shorten its height! The display stays completely blank dark teal, with no content or glow. Tabletop left-frontcorner stays x511 y581. Keep long black desk legs and feet. Keyboard center1045,568; bowl ellipsecenter715,530width48height10; leftspeaker850,511; rightspeaker1297,515; cupellipsecenter1371,525width46height10; lampfoot1452,558; lampdometop1455,424. Keep notebook with visible fountainpen, penholder, bowl, keyboard, mouse, mat, speakers, cup, smallroundbrasscontainer, brasslamp identical. Maintain fixed loungechair and Aeronchair, floor and rug geometry, all shelf and window geometry.
Spring decoration: change left framed wallart to pale pink cherry blossom art; loungechair cushion soft blush pink; add small cherryblossom sprigs to bookshelf dark vase and blossoms to existing right-side green plant. Fill riverside tree rows and foreground streets with delicate pink cherry blossoms among fresh green leaves; mountains fresh springgreen when visible. Do not move buildings, river, bridge or city structures.
Keep the supplied painted finepaper illustration style, premium tactile paper texture. No photo or 3Drender, no text/logo/watermark, no extra objects.
The brass desk lamp is powered OFF in all lighting. Its inner shade and underside are dark unlit metal, never a light source. No light pool or innerglow. Brass only reflects ambient room light.
Lighting/mood: Spring deep night: dark navy sky, dark hills, fully illuminated city buildings and bridge casting gold reflections on deep blue river. Pink cherry blossom riverbanks visible in city lights. Dim cool room with subtle warm shelf lighting. Desk lamp explicitly OFF, no bright underside. 
Final priority: same exact MASTER raised tabletop and monitor size/top edge, only spring decorations and night light.
```

