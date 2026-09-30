# Delivery checks — 2026-09-29

## Verified

- `npm run build`: TypeScript and Vite production build pass; active entry is the DOM/CSS paper studio.
- `npm test`: all 9 environment tests pass.
- Native Chrome: downward badge drag opens `#portfolio`; the return button restores the studio and badge focus. The final white/monochrome portfolio was visually inspected.
- Native Chrome: the name and role occupy separate rows at desktop size and at 390×844 and 760×844 iframe viewports. The complete name remains on one line.
- Native Chrome: radio activation reports a successfully started recorded track and exposes Chrome's media playback control. All 20 local MP3 files and their catalog sizes were checked. Every complete track was not listened through.
- Native Chrome: winter night and autumn afternoon were inspected after the matching prop replacement. The cat rests on the rug; miniature pumpkins sit on the desk. The duplicated iced-drink overlay is removed.
- Native Chrome: a discovered coffee note closes on click. The settings panel and portfolio entry are English.
- Axe 4.13: final mobile studio (390×844), 0 reported violations / 23 passes / 2 incomplete; final desktop monochrome portfolio (1440×900), 0 reported violations / 22 passes / 1 incomplete. Incomplete rules require manual judgment; this is not a claim of full accessibility certification.
- Separate code review checked route lifecycle, inactive-scene behavior, rapid music changes, stale async results and cleanup.
- Asset attribution separates current generated props from licensed public landscape, paper textures and music. Older rejected props remain archived, not rendered.

## Handoff

The portfolio projects and experience are sample content. Local previews and source packaging are complete; the public jieun.ai site has not been deployed or modified. See `README-DELIVERY.md` for setup and `public/assets/paper/decor/studio-matched/NOTICE.md` for the matching prop prompt set.
