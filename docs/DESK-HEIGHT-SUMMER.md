# Summer ergonomic desk-height assets

## Scope and workflow

- Branch: `fix/desk-height-summer` (isolated worktree).
- Replaced only five `public/assets/cyberpunk/climate/summer-*.webp` assets.
- Used built-in `image_gen.imagegen` in lighting-weather edit mode; no CLI/API fallback.
- Input image 1 / absolute geometry master: `/Users/cillian/Downloads/landingpage-worktrees/studio-desk-height/public/assets/cyberpunk/desk-height-reference.webp`.
- Input image 2 / lighting-only reference: the corresponding original `/Users/cillian/Downloads/landingpage-worktrees/desk-height-summer/public/assets/cyberpunk/climate/summer-{time}.webp` at baseline commit `f537063b5afb869700c0c04a9da84cb1d7fbbecf`.
- All source images were inspected before generation.
- `summer-noon.webp` is a byte-for-byte copy of the approved master, requiring no generation.
- Generated four other time variants, then used only whole-image WebP format conversion with `cwebp -q 95 -m 6 -resize 1672 941`.
- No cropping, compositing, geometry transforms, pixel corrections, source code edits, or browser UI changes.

## Exact common prompt

```text
Use case: lighting-weather. Asset type: premium layered tactile paper studio website background. INPUT IMAGE 1 IS THE ONLY EDIT TARGET AND ABSOLUTE GEOMETRY MASTER. INPUT IMAGE 2 IS A LIGHTING / TIME OF DAY REFERENCE ONLY. Make an extremely faithful lighting-only edit of image 1: transfer the summer time-of-day illumination, sky colors, river reflections and exterior city light state of image 2 onto image 1. Image 2 has INCORRECT LOW DESK GEOMETRY, so NEVER borrow any furniture or object positions from image 2. Preserve image 1 exactly: same fixed camera, crop, perspective, window frames, city buildings, hills, chair, lounge chair, plants, rug, floor, all furniture silhouettes, every small object, all edges. Particularly preserve the RAISED ergonomic thin walnut desktop with left-front top corner (511,581), monitor inner screen x897..1238 y341..500, keyboard center (1045,568), desktop bowl center (714,533), left speaker (850,511), right speaker (1297,515), cup center (1375,550), brass desk lamp top (1455,424) base (1455,561). Coordinate values refer to the 1672x941 source canvas. These landmarks must remain pixel registered to image 1. Preserve fountain pen, notebook, pen holder, mouse, desk feet, extended desk legs, underside, Aeron chair and rug geometry of image 1. Monitor screen remains completely dark blank teal with no glow, UI, text or graphics. The brass desk lamp MUST STAY OFF, no bulb glow, no light cast below shade, even for evening and night. Preserve all summer lush green foliage and fine premium paper grain, textured edges, illustrated materials, detailed high quality. Do not introduce objects, change proportions, move anything or alter interior styling. Deliver exactly 1672x941 aspect ratio, full uncropped landscape image. Change lighting ONLY.
```

## Exact time-specific prompt additions

### morning

```text
Summer MORNING: low soft warm sunrise on the left over green hills, pale peach/pink and blue morning sky with light clouds, golden sun reflection on river, gentle warm morning window light and long shadows as in image 2. Keep summer foliage richly green.
```

### afternoon

```text
Summer AFTERNOON: rich golden late-afternoon sun, orange-gold cloud edges against blue upper sky, strongly warm sunlit city facades and golden river reflections, warm interior daylight and shadows as in image 2. Keep summer foliage green.
```

### evening

```text
Summer EVENING: purple-blue twilight sky with narrow peach-orange sunset band at horizon, warm city and bridge lights glowing and reflecting in blue river, gentle warm shelf accent lighting, dim cool interior ambient with warm details as in image 2. Brass desk lamp remains OFF and blank monitor remains dark.
```

### night

```text
Summer NIGHT: deep blue night sky and dim clouds, warm lit city windows, bridge lights and river reflections, gentle warm bookshelf accent lights against cool dim blue ambient, matching image 2. No sunlight or sunset. Brass desk lamp remains completely OFF and blank monitor remains dark.
```

## Night retry

The first night result was rejected because the monitor moved approximately 20px down and nearby objects drifted. It was not installed. Rejected source output:

`/Users/cillian/.codex/generated_images/01a0f00c-18fa-7e13-853f-3319f4ed1c03/exec-104db6d2-e456-4a4a-bc3d-63e68d5b5917.png`

The successful retry used the same master and original summer-night lighting reference, the common and night prompts above, followed by:

```text
CRITICAL REGISTRATION: the monitor top must remain at y335, inner screen top y339, screen bottom y503, outer silver bezel bottom y517 on the exact source 1672x941 canvas. Do not move it down. Do not shrink screen. Lamp apex y423 and base y561 stay fixed, cup top opening y525, bowl top y529, keyboard bottom y580. Exact copied geometry is more important than lighting style. Image 1 absolutely governs every furniture boundary. Match it almost pixel-for-pixel with only color/illumination changes.
```

## Installed output sources

| Time | Built-in output PNG | Installed asset |
| --- | --- | --- |
| morning | `/Users/cillian/.codex/generated_images/01a0f00c-18fa-7e13-853f-3319f4ed1c03/exec-3df78af5-3c4c-4166-9859-6a1e3af4376a.png` | `public/assets/cyberpunk/climate/summer-morning.webp` |
| afternoon | `/Users/cillian/.codex/generated_images/01a0f00c-18fa-7e13-853f-3319f4ed1c03/exec-ac55227d-60dc-474f-a1e3-8a9357e4ce26.png` | `public/assets/cyberpunk/climate/summer-afternoon.webp` |
| evening | `/Users/cillian/.codex/generated_images/01a0f00c-18fa-7e13-853f-3319f4ed1c03/exec-b59568ad-c3db-4afd-8d08-785394465e02.png` | `public/assets/cyberpunk/climate/summer-evening.webp` |
| night | `/Users/cillian/.codex/generated_images/01a0f00c-18fa-7e13-853f-3319f4ed1c03/exec-ddfe93d6-539f-4da1-b28e-cacf7f26a987.png` | `public/assets/cyberpunk/climate/summer-night.webp` |
| noon | Approved master copied without conversion | `public/assets/cyberpunk/climate/summer-noon.webp` |

## Verification

- Target canvas: 1672 × 941 for all five assets.
- Approved raised desk preserved: left-front corner approximately (511,581); fixed feet around (543,823) and (678,765).
- Monitor screen remains blank and dark; desk lamp remains OFF in every time variant.
- Fountain pen, notebook, bowl, cup, keyboard, mouse, speakers, desk legs, chairs, and rug retained.
- Summer greenery and five distinct time-of-day treatments retained.
- Independent read-only QA inspected original-resolution outputs and compared gradient-NCC landmark shifts against the master in a ±6px search region.
- Morning/evening: all measured monitor, lamp foot, cup rim, bowl rim, and desk-corner offsets (0,0).
- Afternoon: monitor (-1,0); all other measured landmarks (0,0).
- For these first three results the measured edge correlations ranged from 0.831 to 0.973.
- Night retry: all five measured landmark offsets (0,0). NCC values: monitor 0.8211, lamp foot 0.9371, cup rim 0.7906, bowl rim 0.8341, desk corner 0.8926. Independent visual review confirmed blank screen, lamp OFF, retained geometry, and dark-blue night sky without a sunset band.
- Final WebP decode checks: all five files are WEBP, 1672 × 941. Each encoded output was visually inspected again.
- Noon byte-for-byte master equality: PASS. SHA-256: `106997af96d1df3961c8a2fc6179ad82c37cbb874e5c226b412447751d236816`.
- No application tests were run because this scoped change replaces raster assets only; no application code or behavior changed.
