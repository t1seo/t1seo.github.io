# Winter desk and furniture art upgrade

## Scope and execution

Replaced only the five `public/assets/cyberpunk/climate/winter-{morning,noon,afternoon,evening,night}.webp` plates. No source-code or interaction changes.

Mode: **built-in image generation, edit**, five separate calls run concurrently. No fallback CLI/API, no Python image editing, no composited furniture rectangles.

Inputs for each call:

1. Edit target / geometry master: `public/assets/cyberpunk/desk-reference.webp` in the integration worktree, approved 2026-09-30.
2. Seasonal and time-of-day reference: corresponding previous winter plate at baseline commit `88288fc`.

Root confirmed that the existing tree position at the **left** window corner should remain; its initial instruction saying “RIGHT TREE” was a direction typo. Keeping this corner protects the desk, chair and monitor from occlusion.

## Preserved equipment and composition

- Thin walnut desktop, realistic front edge and exposed graphite metal legs touching the floor.
- Graphite Herman Miller Aeron-style mesh chair with ergonomic back support and adjustable arms.
- Silver Mac-display-style screen and stand, blank dark teal display retained for the real HTML terminal.
- Ivory HHKB-style compact 60-key keyboard and unchanged desk mat.
- Rounded walnut / linen premium desktop speakers.
- Cup, bronze singing bowl, notebook and a single black lacquer / gold trim fountain pen at the master positions.
- Exact framing, window mullions, bridge / skyline structure and furniture footprints.
- Desk lamp remains unlit; tree fairy lights and shelf accents are baked into seasonal scenery.

Christmas changes include dimensional evergreen tree, warm fairy lights, ornaments, wreath, wrapped gifts, burgundy pillow, thick ivory knit throw, snowy peaks and rooftops. Morning, noon, afternoon, evening and night each retain a distinct lighting state.

## Exact shared prompt

```text
Use case: lighting-weather / precise-object-edit. Edit IMAGE 1, the approved MASTER ROOM, into a richly decorated Christmas winter version at the requested time of day. IMAGE 2 is only a reference for seasonal decor and time-of-day mood; NEVER copy its old desk, old monitor, black keyboard, black cheap speakers or old chair.
CRITICAL GEOMETRY: keep image 1's exact 16:9 composition, camera, skyline, river, bridge, window mullions, shelves, walls, floor, rug footprint, desk coordinates and all desk-item positions. Keep the MASTER's thin 25mm walnut desktop with visible slender graphite metal legs and open air below; NEVER turn it into a thick floating wooden block. Keep exact premium graphite Herman Miller Aeron mesh office chair at bottom right with its authentic mesh, curved ergonomic lumbar back and adjustable padded arm. Keep exact Mac-style silver aluminum display and stand, inner screen rectangle stays at the same coordinates and is completely blank dark teal, no code or text. Keep compact ivory Happy Hacking 60-key keyboard on black mat, exactly as image 1; no full-size keyboard. Keep image 1's premium walnut rounded speakers with finely woven warm linen grilles, coffee cup, bronze singing bowl, elegant black lacquer gold-trim fountain pen lying across black notebook. Keep desk lamp OFF: dark unlit shade, no bulb emission, no pool of lamp light; seasonal shelf and tree fairy lights may glow.
SEASON: decorate left corner between bookcase and window with a dimensional lush evergreen Christmas tree like image 2 with refined red/gold ornaments, warm tiny fairy lights, delicate star topper; leave the desk/monitor/chair unoccluded. Add beautifully wrapped gifts at tree base. Wreath on left wall, burgundy lounge-chair pillow and chunky ivory cable-knit throw. Cool snowy mountain peaks and light snow on distant rooftops, winter bare riverside trees. Premium tactile hand-painted 2.5D paper illustration identical to image 1, not plastic CGI. Preserve crisp fine material detail and warm realism. No people or dogs; no text, logo, watermark. Exact wide crop, no border.
```

## Exact time-specific prompt suffixes

### morning

```text
WINTER MORNING: pale apricot sunrise, cool pale blue sky with warm peach clouds, soft low-angle eastern sunshine, city buildings softly catching warm light; quiet winter early morning. Use image 2's sunrise lighting but keep image 1's geometry.
```

### noon

```text
WINTER NOON: crisp pale blue winter sky and gentle bright clean midday sunlight, snowy mountain ridges, restrained cool silver-blue river, warm subtle Christmas fairy lights visible indoors. Use image 2's noon lighting but keep image 1's geometry.
```

### afternoon

```text
WINTER AFTERNOON: rich golden late afternoon sunlight, low warm sun glowing near left mountain horizon, amber reflections streaking across river, deep warm walnut surfaces with cooler shadow details. Use image 2's golden lighting but keep image 1's geometry.
```

### evening

```text
WINTER EVENING: blue-hour purple and rose twilight, last pink band over mountains, illuminated modern city windows and warm gold bridge lights reflecting in dark cobalt river, softly luminous tree fairy lights and warm shelf accents. Use image 2's dusk lighting but keep image 1's geometry.
```

### night

```text
WINTER NIGHT: deep midnight navy sky, dark snow-dusted mountains, glittering warm contemporary city apartment and office windows, gold bridge lights and river reflections. Subdued intimate room lit by tree fairy lights and shelf accents only; desk lamp still OFF. No giant moon or neon futuristic city. Use image 2's night lighting but keep image 1's geometry.
```

## Native generation sources

- morning: `/Users/cillian/.codex/generated_images/01a0efe7-9f62-7ec2-9b17-d5a7c9ef760a/exec-bf10c289-7030-43bd-903c-184712015e4b.png`
- noon: `/Users/cillian/.codex/generated_images/01a0efe7-9f62-7ec2-9b17-d5a7c9ef760a/exec-5a5bed5a-a34c-42f4-b309-64463fe5e252.png`
- afternoon: `/Users/cillian/.codex/generated_images/01a0efe7-9f62-7ec2-9b17-d5a7c9ef760a/exec-7b805297-b3e2-452c-bfa5-6fb21f62848b.png`
- evening: `/Users/cillian/.codex/generated_images/01a0efe7-9f62-7ec2-9b17-d5a7c9ef760a/exec-64f28000-8f76-4540-83cc-1f8929b8c8a8.png`
- night: `/Users/cillian/.codex/generated_images/01a0efe7-9f62-7ec2-9b17-d5a7c9ef760a/exec-946676d2-7b57-4955-b0eb-fb86a6ac7038.png`

Original generated PNGs remain in the native generation directory. All five project-bound deliverables are saved inside the worktree at the paths above.

Whole-image delivery conversion:

```sh
cwebp -quiet -q 88 -resize 1672 941 INPUT.png -o public/assets/cyberpunk/climate/winter-TIME.webp
```

## Validation

- Visually inspected approved master, all five previous winter references and all five generated outputs.
- Checked visible desk legs, thin tabletop, Aeron mesh silhouette, blank screen, consistent item placement, fountain pen, unlit desk lamp and left tree clearance.
- Verified all five final WebP images decode and are 1672 × 941 pixels.
- No browser interaction changes in this art-only commit; root performs integration / Chrome checks.

