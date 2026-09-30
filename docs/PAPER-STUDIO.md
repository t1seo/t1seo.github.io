# Paper studio — latest direction

The user explicitly switched from the rejected Three.js prototype to a tactile 2.5D paper scene and asked us to actively reuse quality public assets. The later vintage public props were also rejected because their materials, palette and lighting did not match the room. The current correction uses six generated props referenced to the original room while retaining the public landscape, paper scans, fonts and licensed music. Three.js is preserved on branch `redesign/real-time-studio`; the current entry runs the DOM/CSS paper studio.

## Reused assets

- LudicArts / Franco Giachetti, Free Valley Background: five independently translated transparent layers, CC BY 4.0. Original source, layer registration and full license in `public/assets/paper/landscape/`.
- ambientCG / Lennart Demes: Paper001, Paper003, Paper006 Color scans, CC0. Source: `https://ambientcg.com/view?id=Paper001` (and other IDs); license: `https://docs.ambientcg.com/license/`. Original downloads in `asset-sources/paper/`, optimized 1024px texture WebP in `public/assets/paper/`.
- Existing brand art and OFL fonts are reused from `public/assets/badge/`.
- Cormorant Garamond, by the [Cormorant Project Authors](https://github.com/CatharsisFonts/Cormorant), is used for the introduction. Local font files and the SIL Open Font License 1.1 are in `public/assets/fonts/`.
- Twenty recorded music tracks by Kevin MacLeod and Scott Buckley are bundled under CC BY 4.0 in `public/assets/music/`. Source pages, exact downloads, hashes and encoding details are recorded in `SOURCES.json`; track-by-track attribution is available in `CREDITS.html` and `CREDITS.txt`.

## Archived public-prop experiments

The public props below are retained with their original source and license records, but are not the current runtime seasonal or character artwork. Their mismatched vintage/flat style was rejected during visual review.

- Public Domain Pictures: five archived CC0 seasonal illustrations in `public/assets/paper/decor/rich/`: Dorothe Wouters’s Christmas tree, freddy dendoktoor’s wreath, Ashira Shalom’s pumpkin, Andrea Stöckel’s potted palm and Karen Arnold’s roses in a teacup. The complete transparent originals were converted to WebP with alpha preserved. Exact source URLs, hashes and processing are recorded in that directory’s `manifest.json` and `NOTICE.md`, with an overview in `docs/PAPER-RICH-ASSETS.md`.
- Public Domain Pictures / Karen Arnold: two archived CC0 character illustrations, Blue Tit Bird Vintage and Sleeping Cat Porcelain Ornament, in `public/assets/paper/decor/characters-rich/`. The cat is a porcelain ornament, not a newly drawn animated animal. Source pages, licenses and conversion details are recorded in its `manifest.json`.
- Kitbitz: the 11 CC0 SVG props used in earlier prototypes are retained in `public/assets/paper/decor/` and `adapted/` with revision-pinned provenance. They have been replaced in the visible seasonal scene and character layers. An unused speaker image remains in hidden radio markup; it is not the visible radio artwork.

Public art credits: `/assets/paper/CREDITS.html`. Public music credits: `/assets/music/CREDITS.html`. No paid assets were purchased and no stock preview watermarks were removed.

## Generated room and matching props

The built-in imagegen tool produced the base room's transparent-window layer (`studio-interior-v1.png`, optimized to WebP). It is explicitly identified as generated in the public credits; it is not represented as an artist-provided public asset. Source generated file: `exec-9c47b199-9d70-4d85-ba97-5a208b629d29.png`.

The current six props in `public/assets/paper/decor/studio-matched/` were also made with the built-in imagegen tool, referencing that original room so the paper/felt texture, light and palette agree: `winter-tree.webp`, `winter-wreath.webp`, `autumn-pumpkins.webp`, `spring-flowers.webp`, `sleeping-cat.webp` and `sparrow.webp`. These are generated project assets, not public CC0 illustrations. Their provenance is recorded separately in `studio-matched/NOTICE.md`. The current cat depicts a sleeping felt-like living cat on the rug, replacing the archived porcelain ornament. Summer uses a small paper print inside an existing frame; there is no additional palm prop.

Base-room prompt (built-in tool, transparent background enabled):

> Use case: stylized-concept. Asset type: production multilayer website illustration, the INTERIOR FRONT LAYER of an interactive paper diorama. Create an exquisitely handmade layered cut-paper cozy developer's studio, landscape 3:2 composition, entire room filling the canvas. Everything is made of real fibrous dyed art paper, folded thick cardstock, washi paper, with visible imperfect cut edges and delicate physical contact shadows. A sophisticated collectible paper artwork photographed in soft diffuse light, rich detail, no plastic CGI and no vector clipart. Room layout: left third contains a tall walnut-brown paper bookcase absolutely full of thoughtfully arranged muted books, tiny ceramics, framed miniatures, trailing paper ivy; bottom has a long honey-brown wooden-paper work desk with curved edges, little cream keyboard, sage desk pad, a dark rectangular monitor slightly left of center, tiny stacked notebooks and a ceramic paper cup, a lovely curved warm brass-and-cream desk lamp at the left of the desk. Large architectural window on the upper center-right, occupying approximately x=35% to 84%, y=10% to 58%, with cream paper mullions and a deep layered arched-top surround. CRITICAL: through the window panes there must be COMPLETELY TRANSPARENT EMPTY ALPHA, no sky, no mountains, no scenery, no white fill and no checkerboard. This is a compositing asset so another landscape can be placed behind the actual transparent window holes. Opaque cream textured paper walls remain everywhere around this window. Desk and monitor partly overlap the lower window naturally; keep their alpha opaque. Right side includes a rich leafy paper plant in a terra-cotta folded pot and a cozy small terracotta reading chair with cream paper cushion, a small round side table. Add little wall-mounted paper shelves, hanging paper plants, framed abstract handmade prints, books and paper objects in a lived-in curated maximalist way. Foreground contains an oval woven-paper cream rug and a curved sage office chair. Front-left and front-right paper leaves frame the scene but do not block the desk. No people, no text, no typography, no interface, no logos, no badge, no seasonal decor yet. Perspective is gently front-on with a slight view down onto the desk, an elegant shallow 2.5D paper theater, not a videogame 3D room and not isometric floating dollhouse. Palette: buttercream, warm ochre, muted moss sage, terra cotta, tobacco brown, restrained dusty blue. Clear beautiful layer thickness, tactile cotton paper grain, intricate considered proportions, art-book cover quality. All opaque room surfaces and floor extend to all four canvas edges, transparency only in window openings.

## Runtime

`paper-main.ts` connects the existing tested Seoul calendar/preferences state to the accessible shell and the layered scene. `paper-scene.ts/css` use DOM layers; the active entry does not import the archived Three.js renderer. Source images are never the controls: interactive named buttons and the calendar’s equivalent object-list buttons drive real state. Local motion overrides the OS default only after an explicit user selection.

The outdoor original is a summer valley. Spring/autumn/winter interpretations recolor the layers and add separate petals/leaves/snow; interior seasons add distinct physical-looking decor layers. These are adaptations, not four independently sourced landscape drawings.

## Immersive room and object interactions

The paper room fills the viewport. The original jieun.ai ID badge remains a live component with drag-to-swing and click-to-flip behavior. Persistent bottom controls and hover tooltips have been removed so the room itself stays in view.

The wall calendar opens the environment controls for five times of day and four seasons, the accessible object list, motion and sound settings, art/music credits and an entry to the portfolio. The named object-list buttons provide a keyboard-accessible alternative to finding objects in the scene.

There are 18 scene hotspots:

- Desk and room: lamp, monitor, keyboard, cup, book, plant, curtain, calendar and music.
- Decorations and discoveries: seasonal decor (`tree`), weather, framed picture, bird, wall lights, shelf, cat, globe and pencils.

The earlier chair and drawer actions have been removed. Current interactions change lights and artwork, trigger finite monitor typing with key feedback, animate cup effects and reveal small notes. Notes close when clicked, with Escape or automatically after ten seconds. Globe and pencil interactions add travel notes and small idea discoveries. The base-room illustration itself remains intact beneath the separate effects.

The name-and-role introduction types “Jieun Jeon” and cycles through Software Engineer, Lifelong Learner, Builder of Little Things and Sharing What I Learn. Clicking or tapping the room hides the introduction; it returns after 30 seconds of inactivity while the studio is active and no settings dialog is open. Reduced-motion mode uses a static frame. The introduction does not intercept room clicks.

The radio plays the recorded track selected for the current season and time of day: four seasons × five time periods, with 20 distinct recordings. Playback starts only after a visitor explicitly enables music; a saved preference does not autoplay. Track changes crossfade. The procedural-audio prototype remains in the source archive but is not used by `paper-main.ts`.

## Portfolio route and sample content

Pulling the live ID badge downward opens `#portfolio`. Pressing ArrowDown while the badge has keyboard focus or choosing the calendar’s portfolio button provides the same route. Ordinary badge clicks still flip the card, and shorter drags retain its swing behavior. The second page has its own scrolling content and a return-to-studio button; leaving the studio pauses its scene lifecycle and switches music off. Its current presentation is a professional monochrome layout on pure white (`#fff`), with Work Sans headings and system-sans body text. It does not reuse the room’s ivory paper treatment.

`src/paper-portfolio.ts` deliberately contains placeholder content: three example projects (Quiet Notes, Seasonal Studio and Developer Toolbox) and two illustrative experience entries (Product team and Independent projects). They are labeled as samples and must be replaced with verified personal projects and career information before publishing them as a real portfolio. The introduction copy is in `src/paper-intro.ts`.

## Delivery

See `README-DELIVERY.md` for installation, local viewing and static-build instructions. This document describes the current source and asset provenance; browser QA results are recorded separately by the integration owner.
