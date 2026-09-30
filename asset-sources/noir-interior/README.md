# Noir interior artwork

Generated with the built-in `image_gen` editing tool on 2026-09-30. `night.png`
and `day.png` are untouched generated originals. Runtime WebP copies use
`cwebp -q 92`. No original delivered room or Milky asset was overwritten.

The website does **not** use the generated skyline. A vector mask exposes the
original climate plate underneath, retaining its city, river, seasons and weather.
Milky and all interaction layers are separate. The original winter tree and gifts
are also exposed through the winter mask. See `scripts/build-noir-masks.ts`.

## Night edit prompt

Edit target: `public/assets/cyberpunk/climate/summer-night.webp`.

> Use case: precise-object-edit. Edit target: the supplied 1672 by 941 illustrated room image, a registered website scene. Restyle ONLY the INTERIOR MATERIALS to a dark luxury Korean 'gwanggong' penthouse study. Preserve the exact full composition, aspect ratio, camera, perspective, proportions and every furniture/object silhouette and position: no crop, no moving objects. Keep the entire outdoor Seoul river, skyline, mountains, buildings, bridge, sky and every window frame UNCHANGED. Keep the source's crafted 2.5D detailed illustration style, not a photoreal photograph. Change warm tan wall panels to graphite honed stone, shelf interiors and wood desk top to polished black stone with very fine restrained gray veins, cream lounge chair upholstery to rich matte black leather (same shape), cream rug to close-woven charcoal wool (same extent), floor to deep gray stone (same seams), gold metal details to brushed gunmetal. The existing white keyboard becomes charcoal, ceramic mug matte charcoal. Maintain all exact object silhouettes on desktop including monitor at x=891..1242 y=332..517, keyboard, speakers, cup, singing bowl, notebook, pen, and the mushroom lamp: its bulb MUST remain OFF, its shade stays exactly where it is. Shelf lights become subtle neutral-warm recessed strips, not bright amber floodlights. Reduce clutter only INSIDE the left shelves: replace hanging shelf vines with sparse black sculptural vessels and neatly aligned dark books. Keep the far-right standing plant same silhouette and position. Black must have readable texture and subtle silver/cool reflected highlights: luxurious, crisp, restrained, NOT a blacked-out image. No extra furniture, no text, no logos, no people, no pet or dog; the dog is rendered separately in the website. This image will be aligned pixel-for-pixel to the existing room; do not shift any edges.

## Day edit prompt

Edit target: generated `night.png`. Lighting reference:
`public/assets/cyberpunk/climate/summer-noon.webp`.

> Use case: lighting-weather. Image 1 is the EDIT TARGET, a registered 1672x941 dark luxury studio illustration. Image 2 is ONLY a DAYLIGHT LIGHTING REFERENCE and outdoor daytime view. Change Image 1 from night to neutral clear daytime lighting matching Image 2. Keep all of Image 1's dark luxury furniture/materials exactly: black leather lounge chair, graphite rug, black fine-veined stone desk, charcoal walls, sparse dark shelf decor, gunmetal mushroom lamp, charcoal keyboard. Do NOT restore Image 2's cream upholstery, wood desktop or warm beige colors. Everything stays precisely in the same pixel position and silhouette: camera, window frames, monitor, speakers, lamp, chairs, mug, bowl, notebook, floor lines. No cropping or shifting. Large windows admit soft cool daylight and believable brighter floor reflections, but black surfaces remain rich black and readable. Turn recessed shelf lights off in daylight. The desk mushroom lamp stays OFF. Preserve the same crafted 2.5D illustrated medium. No people, animals, text, logos, watermark. One full widescreen image matching the target aspect ratio.

## Backup

`backup/original-interior-20260930` is pushed to GitHub at pre-restyle commit
`924c42ec7d4587401db5765b228e121e428f044d`. The original interior is also reachable
on the current website at `/?interior=original`.
