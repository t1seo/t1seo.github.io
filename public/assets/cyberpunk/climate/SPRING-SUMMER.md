# Spring and summer room plates

Built-in image generation **edit mode** was used on 2026-09-30. No CLI/API fallback and no third-party downloaded asset was used. These are project-generated raster assets derived from the project's existing generated `../modern-studio-unlit.webp`. The provenance of that original is recorded in `../MODERN-ILLUSTRATION.md`. No independent third-party stock license is asserted; usage is governed by the image-generation service terms. No user reference photos or private photo metadata are embedded in this art set.

## Deliverables

Ten opaque WebP plates, each 1672 × 941 pixels, encoded with `cwebp -q 90` without cropping, scaling, retouching, or compositing. Room geometry is inherited from a common target. Spring/summer noon were generated first; all four other times for each season directly edit that seasonal noon base (not an accumulating edit chain).

- `spring-{morning,noon,afternoon,evening,night}.webp`
- `summer-{morning,noon,afternoon,evening,night}.webp`

Desk lamp is unlit in every plate; runtime lighting remains independent. Monitor remains blank dark teal for the registered live terminal. No dog is baked into any image; Milky is a separate interactive layer. No falling rain/snow is baked into the images; runtime weather remains independent.

Spring changes: pale cherry blossoms along the riverbanks, blossom shelf arrangement, pale botanical wall artwork, oatmeal chair textiles and blush cushion.

Summer changes: rich green riverbanks and indoor foliage, blue/sage botanical wall artwork, airy linen chair textiles and sage cushion. Five times each have separate outdoor and indoor relighting rather than one whole-image CSS color filter.

## Inspection

All ten generated assets were visually inspected using the image viewer. Desk corners, monitor bounds, keyboard, speakers, lamp, cup, notebook, window mullions and city/bridge geometry remain visually registered to the original. These generated images are not guaranteed mathematically pixel-identical at every object edge; runtime integration should verify hotspot alignment. Python/Pillow was used only to read dimensions/mode/byte counts, never to edit pixels.

## Source outputs

- `spring-afternoon.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-9568c017-5b17-4f42-9631-6d1325ed1c76.png`
- `spring-evening.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-8af5e166-3d39-405b-8fdd-2238272e5c50.png`
- `spring-morning.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-2f6f5e73-a711-4cfb-90ad-3171a4bd00db.png`
- `spring-night.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-5e6a84a3-16b6-4976-8ea3-9030230bdbb6.png`
- `spring-noon.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-e135f4d4-f500-4944-a38a-5d965de366d0.png`
- `summer-afternoon.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-f81d69de-d0d0-49e5-88d5-3f959f41a789.png`
- `summer-evening.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-52e3e0e4-eced-4730-9246-61078dd748e2.png`
- `summer-morning.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-820236ce-d002-4d8c-9b9e-69ae5e3cd7a9.png`
- `summer-night.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-36829849-6ff0-4e80-8dd3-b9eb9eed360d.png`
- `summer-noon.webp`: `/Users/cillian/.codex/generated_images/01a0efb5-d94e-7db2-ad00-e12bc144d6c8/exec-37fba79b-2fb6-4000-a4f5-e37435be9cb5.png`

## Exact prompts

### spring-noon

Input / edit target: `../modern-studio-unlit.webp`

```text
Use case: lighting-weather. EDIT the supplied image, which is the exact registered room scene target for an interactive website. Output same wide 1672×941 canvas and framing. Keep camera, perspective, wall edges, EVERY window mullion, all buildings and river bridge geometry fixed. Keep desk, monitor rectangle, keyboard, speakers, lamp silhouette, coffee cup, notebook, mouse, chairs, rug and floor boundaries at EXACT original pixel locations and shapes: clicking hotspots and animated overlays are already registered. The monitor remains completely blank very dark teal. The brass desk lamp on the right is SWITCHED OFF: no glowing bulb, no local lamp light pool. No humans, pets, extra screens, lettering, watermarks, rain or snow particles. Preserve refined 2.5D layered hand-painted matte paper illustration with tactile grain, soft edges and convincing depth, NOT a photograph or glossy 3D render. Contemporary Korean river city with apartments, ordinary commercial towers, river bridge and mountain tower, never science-fiction architecture. Change only season decor, outdoor vegetation, and time-of-day illumination as specified.
SEASON SPRING / TIME NOON: Turn this night scene into exquisite clear spring midday with a pale powder-blue sky, a few soft white clouds, gently sunlit ordinary city and blue river, almost all building/window/bridge electric lights off in daylight. Riverbanks have subtle bands of pale pink cherry blossom among fresh light green foliage. The interior receives abundant soft natural window daylight, readable warm walnut and dark charcoal materials, reduced neon floor glow. The left lounge cushion and throw become pale oatmeal linen with one muted blush cushion, preserving their shapes. The existing small vase on the bookshelf holds several airy pale cherry blossom branches within the shelf area; change the left framed artwork to a restrained abstract botanical composition with pale blossom/olive tones while keeping frame size/position. No new furniture or rearrangement. Tasteful spring interior details look painted with exactly the same material texture and lighting as the room. This is the canonical spring base to derive other times from.
```

### summer-noon

Input / edit target: `../modern-studio-unlit.webp`

```text
Use case: lighting-weather. EDIT the supplied image, which is the exact registered room scene target for an interactive website. Output same wide 1672×941 canvas and framing. Keep camera, perspective, wall edges, EVERY window mullion, all buildings and river bridge geometry fixed. Keep desk, monitor rectangle, keyboard, speakers, lamp silhouette, coffee cup, notebook, mouse, chairs, rug and floor boundaries at EXACT original pixel locations and shapes: clicking hotspots and animated overlays are already registered. The monitor remains completely blank very dark teal. The brass desk lamp on the right is SWITCHED OFF: no glowing bulb, no local lamp light pool. No humans, pets, extra screens, lettering, watermarks, rain or snow particles. Preserve refined 2.5D layered hand-painted matte paper illustration with tactile grain, soft edges and convincing depth, NOT a photograph or glossy 3D render. Contemporary Korean river city with apartments, ordinary commercial towers, river bridge and mountain tower, never science-fiction architecture. Change only season decor, outdoor vegetation, and time-of-day illumination as specified.
SEASON SUMMER / TIME NOON: Turn this night scene into exquisite luminous summer midday with clear saturated pale-blue sky, a few soft high white clouds, sunlit ordinary city, vivid deep turquoise blue river, almost all building/window/bridge electric lights off in daylight. Riverbanks have lush deep green summer trees. Existing indoor plants are lush rich green with full leaves but maintain their exact overall silhouettes/positions. The interior receives bright natural window daylight, readable warm walnut and dark charcoal materials, reduced neon floor glow. The left lounge cushion/throw become airy sand linen with a subtle muted sage-green cushion, preserving their shapes. Existing shelf vase carries a few simple summer green branches; change the left framed artwork to refined abstract blue-and-sage coastal botanical tones, same frame size/position. No new furniture or rearrangement. Tasteful summer details look painted with exactly the same material texture and lighting as the room. This is the canonical summer base to derive other times from.
```

### spring-morning

Input / edit target: `spring-noon` source PNG listed above.

```text
Use case: lighting-weather. EDIT TARGET: supplied canonical spring room illustration at noon. Create its morning lighting version. Preserve the EXACT same 1672×941 canvas, crop, perspective and pixel registration. Do not move, redraw, resize or add objects: identical window mullions, mountain skyline, buildings, bridge shape, desk corners, blank monitor rectangle, keyboard, speakers, coffee cup, lamp silhouette, notebook, mouse, chairs, rug and plants. Keep every spring decoration/material and outside vegetation from this target unchanged, including cushion, framed artwork and shelf vase. Only relight this exact scene and repaint the sky/reflections for the requested time. Style: preserve refined 2.5D matte hand-painted paper texture of input, no photo or glossy render. The brass desk lamp on right is OFF in every version; do not turn it on. Monitor stays blank very dark teal. No humans, animals, rain/snow particles, text, watermarks or additional objects. Contemporary real river city, not futuristic.
TIME AND LIGHT: EARLY MORNING shortly after sunrise. Soft pale peach at the horizon, cool powder blue upper sky, gentle low warm sunlight on city and interior. Long very soft shadows, fresh calm atmosphere, slightly mist-softened distant mountains but clear view. City and bridge electric lights OFF; natural cool-to-warm daylight. Not midday, not sunset. Interior naturally lit and quieter/dimmer than noon, lamp remains off.
```

### spring-afternoon

Input / edit target: `spring-noon` source PNG listed above.

```text
Use case: lighting-weather. EDIT TARGET: supplied canonical spring room illustration at noon. Create its afternoon lighting version. Preserve the EXACT same 1672×941 canvas, crop, perspective and pixel registration. Do not move, redraw, resize or add objects: identical window mullions, mountain skyline, buildings, bridge shape, desk corners, blank monitor rectangle, keyboard, speakers, coffee cup, lamp silhouette, notebook, mouse, chairs, rug and plants. Keep every spring decoration/material and outside vegetation from this target unchanged, including cushion, framed artwork and shelf vase. Only relight this exact scene and repaint the sky/reflections for the requested time. Style: preserve refined 2.5D matte hand-painted paper texture of input, no photo or glossy render. The brass desk lamp on right is OFF in every version; do not turn it on. Monitor stays blank very dark teal. No humans, animals, rain/snow particles, text, watermarks or additional objects. Contemporary real river city, not futuristic.
TIME AND LIGHT: LATE AFTERNOON golden hour before sunset. Honey-warm low sunlight enters from the window and creates long luminous warm patches on walnut desk and floor. Golden peach sun on building facades, warm blue river, pale warm sky retaining blue at top. Rich subtle interior warmth, natural sunlight only, city and bridge lights largely OFF. No visible giant sun. Lamp remains off.
```

### spring-evening

Input / edit target: `spring-noon` source PNG listed above.

```text
Use case: lighting-weather. EDIT TARGET: supplied canonical spring room illustration at noon. Create its evening lighting version. Preserve the EXACT same 1672×941 canvas, crop, perspective and pixel registration. Do not move, redraw, resize or add objects: identical window mullions, mountain skyline, buildings, bridge shape, desk corners, blank monitor rectangle, keyboard, speakers, coffee cup, lamp silhouette, notebook, mouse, chairs, rug and plants. Keep every spring decoration/material and outside vegetation from this target unchanged, including cushion, framed artwork and shelf vase. Only relight this exact scene and repaint the sky/reflections for the requested time. Style: preserve refined 2.5D matte hand-painted paper texture of input, no photo or glossy render. The brass desk lamp on right is OFF in every version; do not turn it on. Monitor stays blank very dark teal. No humans, animals, rain/snow particles, text, watermarks or additional objects. Contemporary real river city, not futuristic.
TIME AND LIGHT: EVENING BLUE-HOUR DUSK just after sunset. A graceful mauve/peach horizon fading into dusty periwinkle upper sky. The contemporary city windows and bridge lamps begin to glow warm yellow; softly shimmering reflections on the river. Interior darkens into charcoal/navy, with existing shelf inset lighting softly warm and thin under-desk ambient blue light; season decor remains recognizable. NO direct sunbeam on wall or floor. Desk lamp remains off.
```

### spring-night

Input / edit target: `spring-noon` source PNG listed above.

```text
Use case: lighting-weather. EDIT TARGET: supplied canonical spring room illustration at noon. Create its night lighting version. Preserve the EXACT same 1672×941 canvas, crop, perspective and pixel registration. Do not move, redraw, resize or add objects: identical window mullions, mountain skyline, buildings, bridge shape, desk corners, blank monitor rectangle, keyboard, speakers, coffee cup, lamp silhouette, notebook, mouse, chairs, rug and plants. Keep every spring decoration/material and outside vegetation from this target unchanged, including cushion, framed artwork and shelf vase. Only relight this exact scene and repaint the sky/reflections for the requested time. Style: preserve refined 2.5D matte hand-painted paper texture of input, no photo or glossy render. The brass desk lamp on right is OFF in every version; do not turn it on. Monitor stays blank very dark teal. No humans, animals, rain/snow particles, text, watermarks or additional objects. Contemporary real river city, not futuristic.
TIME AND LIGHT: LATE NIGHT. Deep midnight navy/indigo sky with very subtle clouds, shadowed mountain silhouette, contemporary city windows and bridge lights glow warm gold with precise painterly reflections on a dark navy river. Interior dim navy/charcoal, existing shelf inset lighting softly amber and thin under-desk muted cyan ambient light. No bright daylight patches anywhere, no visible sun or moon. The white/linen chair and seasonal objects remain dimly legible with naturally low night exposure. Desk lamp remains completely OFF: no bulb glow or localized warm pool from it.
```

### summer-morning

Input / edit target: `summer-noon` source PNG listed above.

```text
Use case: lighting-weather. EDIT TARGET: supplied canonical summer room illustration at noon. Create its morning lighting version. Preserve the EXACT same 1672×941 canvas, crop, perspective and pixel registration. Do not move, redraw, resize or add objects: identical window mullions, mountain skyline, buildings, bridge shape, desk corners, blank monitor rectangle, keyboard, speakers, coffee cup, lamp silhouette, notebook, mouse, chairs, rug and plants. Keep every summer decoration/material and outside vegetation from this target unchanged, including cushion, framed artwork and shelf vase. Only relight this exact scene and repaint the sky/reflections for the requested time. Style: preserve refined 2.5D matte hand-painted paper texture of input, no photo or glossy render. The brass desk lamp on right is OFF in every version; do not turn it on. Monitor stays blank very dark teal. No humans, animals, rain/snow particles, text, watermarks or additional objects. Contemporary real river city, not futuristic.
TIME AND LIGHT: EARLY MORNING shortly after sunrise. Soft pale peach at the horizon, cool powder blue upper sky, gentle low warm sunlight on city and interior. Long very soft shadows, fresh calm atmosphere, slightly mist-softened distant mountains but clear view. City and bridge electric lights OFF; natural cool-to-warm daylight. Not midday, not sunset. Interior naturally lit and quieter/dimmer than noon, lamp remains off.
```

### summer-afternoon

Input / edit target: `summer-noon` source PNG listed above.

```text
Use case: lighting-weather. EDIT TARGET: supplied canonical summer room illustration at noon. Create its afternoon lighting version. Preserve the EXACT same 1672×941 canvas, crop, perspective and pixel registration. Do not move, redraw, resize or add objects: identical window mullions, mountain skyline, buildings, bridge shape, desk corners, blank monitor rectangle, keyboard, speakers, coffee cup, lamp silhouette, notebook, mouse, chairs, rug and plants. Keep every summer decoration/material and outside vegetation from this target unchanged, including cushion, framed artwork and shelf vase. Only relight this exact scene and repaint the sky/reflections for the requested time. Style: preserve refined 2.5D matte hand-painted paper texture of input, no photo or glossy render. The brass desk lamp on right is OFF in every version; do not turn it on. Monitor stays blank very dark teal. No humans, animals, rain/snow particles, text, watermarks or additional objects. Contemporary real river city, not futuristic.
TIME AND LIGHT: LATE AFTERNOON golden hour before sunset. Honey-warm low sunlight enters from the window and creates long luminous warm patches on walnut desk and floor. Golden peach sun on building facades, warm blue river, pale warm sky retaining blue at top. Rich subtle interior warmth, natural sunlight only, city and bridge lights largely OFF. No visible giant sun. Lamp remains off.
```

### summer-evening

Input / edit target: `summer-noon` source PNG listed above.

```text
Use case: lighting-weather. EDIT TARGET: supplied canonical summer room illustration at noon. Create its evening lighting version. Preserve the EXACT same 1672×941 canvas, crop, perspective and pixel registration. Do not move, redraw, resize or add objects: identical window mullions, mountain skyline, buildings, bridge shape, desk corners, blank monitor rectangle, keyboard, speakers, coffee cup, lamp silhouette, notebook, mouse, chairs, rug and plants. Keep every summer decoration/material and outside vegetation from this target unchanged, including cushion, framed artwork and shelf vase. Only relight this exact scene and repaint the sky/reflections for the requested time. Style: preserve refined 2.5D matte hand-painted paper texture of input, no photo or glossy render. The brass desk lamp on right is OFF in every version; do not turn it on. Monitor stays blank very dark teal. No humans, animals, rain/snow particles, text, watermarks or additional objects. Contemporary real river city, not futuristic.
TIME AND LIGHT: EVENING BLUE-HOUR DUSK just after sunset. A graceful mauve/peach horizon fading into dusty periwinkle upper sky. The contemporary city windows and bridge lamps begin to glow warm yellow; softly shimmering reflections on the river. Interior darkens into charcoal/navy, with existing shelf inset lighting softly warm and thin under-desk ambient blue light; season decor remains recognizable. NO direct sunbeam on wall or floor. Desk lamp remains off.
```

### summer-night

Input / edit target: `summer-noon` source PNG listed above.

```text
Use case: lighting-weather. EDIT TARGET: supplied canonical summer room illustration at noon. Create its night lighting version. Preserve the EXACT same 1672×941 canvas, crop, perspective and pixel registration. Do not move, redraw, resize or add objects: identical window mullions, mountain skyline, buildings, bridge shape, desk corners, blank monitor rectangle, keyboard, speakers, coffee cup, lamp silhouette, notebook, mouse, chairs, rug and plants. Keep every summer decoration/material and outside vegetation from this target unchanged, including cushion, framed artwork and shelf vase. Only relight this exact scene and repaint the sky/reflections for the requested time. Style: preserve refined 2.5D matte hand-painted paper texture of input, no photo or glossy render. The brass desk lamp on right is OFF in every version; do not turn it on. Monitor stays blank very dark teal. No humans, animals, rain/snow particles, text, watermarks or additional objects. Contemporary real river city, not futuristic.
TIME AND LIGHT: LATE NIGHT. Deep midnight navy/indigo sky with very subtle clouds, shadowed mountain silhouette, contemporary city windows and bridge lights glow warm gold with precise painterly reflections on a dark navy river. Interior dim navy/charcoal, existing shelf inset lighting softly amber and thin under-desk muted cyan ambient light. No bright daylight patches anywhere, no visible sun or moon. The white/linen chair and seasonal objects remain dimly legible with naturally low night exposure. Desk lamp remains completely OFF: no bulb glow or localized warm pool from it.
```

