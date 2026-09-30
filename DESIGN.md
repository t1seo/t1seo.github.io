---
project: taewon-after-hours
platform: web
research:
  policy: studio-mobbin-21st
  ids: [penthouse-rebuild]
---

# Taewon Seo — The Penthouse

The user rejected the material-only Noir restyle. Rebuild architecture, furniture,
skyline, lighting, typography and UI from zero; preserve only Milky visual assets.
New default: src/penthouse-main.ts, selected by src/entry.ts.

## Spatial contract

Tall corner glazing, diagonal depth, low black leather sectional, monolithic stone
table, flush charcoal storage/audio wall, clear foreground for Milky. No frontal
desk, office chair, bookshelf, plants, patterned rug, RGB, chandelier or gold palace.
Palette: #111214, #292b2e, #62656a, #a9abad, #f0ede7. Material contrast and readable
shadows, not crushed blacks. Never apply scene filters to Milky.
New 1672×941 geometry is independent of the archived desk. Bottom-anchor the room
so the foreground floor remains visible on narrow screens.

## Interface and behavior

Small personal wordmark, Georgia serif welcome, edge controls, native right-side
dialogs, English settings. Use system sans/Georgia instead of old font assets.
Controls at least 44px, visible keyboard focus, native radios/checkboxes, dialog
focus restoration, Immerse with Return/Escape. Reduced motion disables animation;
hidden tabs stop visual animation while music continues.
Three original plates supply day/sunset/night; morning/afternoon adapt daylight.
Seasons tint the glass view and select music without interior decorations. New
weather clipping excludes furniture and floor. Failed loads retain the current room.

Device-local clock by default; an explicit location action adds browser-permitted
approximate location, hemisphere, sunrise/sunset and Open-Meteo weather. Manual
choices pause Auto. Coordinates stay in memory. Failures offer retry. The skyline
is an illustration, never described as the visitor's actual city. Music begins only
after a gesture and continues in background tabs. Existing licensed audio and
climate logic are functional carry-overs. Milky keeps hello/sit/nap/feed/play/run.

## Research

[Detailed report](design/research/penthouse-rebuild/report.html) ·
[Queries, IDs and decisions](design/research/penthouse-rebuild/research.json)

Current Studio neutral tokens inspected. Actual images from three Mobbin products
(Higgsfield, HoneyBook, Air) inspected via MCP. Two 21st component/demo sources
(19077, 9724) read via MCP. No component code copied or new runtime dependencies.
RIDI explains the cultural trope; architect/product primary texts inform layout,
material and furniture. Architecture photo retrieval failed and is not represented
as inspected evidence. This is a personal Taewon site, not a Studio-branded product.

Studio sync returned “Connect the project before synchronizing research”. Preserve
local evidence. No connected Studio research gate or synchronization pass is claimed.

## Archives

Explicit ?interior=original and ?interior=noir load the older composition. Backups
are pushed: original 924c42e on backup/original-interior-20260930; rejected restyle
caef110 on backup/noir-restyle-20260930. Older research remains in local-climate and
noir-interior directories for those scopes only.
