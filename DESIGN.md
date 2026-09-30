---
project: taewon-after-hours
platform: web
research:
  policy: studio-mobbin-21st
  ids: [penthouse-rebuild, penthouse-atmosphere]
---

# Taewon Seo — The Penthouse

The user rejected the material-only Noir restyle. Rebuild architecture, furniture,
skyline, lighting, typography and UI from zero; preserve only Milky visual assets.
New default: src/penthouse-main.ts, selected by src/entry.ts.

## Spatial contract

Latest user direction: keep the concept but relieve the overly dark palette and add
a computer workspace. Tall corner glazing, low black leather sectional, ivory
travertine table, warm grey limestone floor and greige wall. A thin walnut/aluminum
desk occupies the right wall, with a silver monitor, low-back black leather chair,
articulated task lamp and warm cove/under-desk lighting. Keep the foreground clear
for Milky. No gaming furniture, RGB, plants or gold palace ornament.
Palette: #242527, #81766b, #a69a89, #d5c5ad, #efe4d1. Milky is unchanged; only the
ball has a new coral-red asset and measured contact anchor. Archived props stay intact.
New 1672×941 geometry is independent of the archived desk. Bottom-anchor the room
so the foreground floor remains visible on narrow screens.

## Interface and behavior

Small personal wordmark, Georgia serif welcome, edge controls, native right-side
dialogs, English settings. Use system sans/Georgia instead of old font assets.
Controls at least 44px, visible keyboard focus, native radios/checkboxes, dialog
focus restoration, Immerse with Return/Escape. Reduced motion disables animation;
hidden tabs stop visual animation while music continues.
Five independently generated matching plates supply morning/noon/afternoon/evening/night.
Overcast daytime uses diffuse noon art to avoid a painted sun behind precipitation.
Seasons tint the glass view and select music without interior decorations. New
weather clipping intersects eight measured panes with the sofa silhouette, excluding
mullions, furniture and floor. Night has slow facade lights, river glints, reflections
and sparse clear-night meteors. Rain has two depths, refractive glass beads, coalescing
rivulets and 22-second drying. Snow drifts at two scales; mist/clouds drift softly.
The compositor is capped at 30 fps and stops for hidden tabs or still/reduced-motion
mode; clear static daylight does not run a frame loop. Failed loads retain the room.
Monitor coding begins only on click. Desk light has a separate switch and a registered
light pool. A Desk dialog includes a live close-up so mobile can access the workstation.

Device-local clock by default; an explicit location action adds browser-permitted
approximate location, hemisphere, sunrise/sunset and Open-Meteo weather. Manual
choices pause Auto. Coordinates stay in memory. Failures offer retry. The skyline
is an illustration, never described as the visitor's actual city. Music begins only
after a gesture and continues in background tabs. Existing licensed audio and
climate logic are functional carry-overs. Milky keeps hello/sit/nap/feed/play/run.

## Research

[Workspace & atmosphere report](design/research/penthouse-atmosphere/report.html) ·
[New queries, IDs and decisions](design/research/penthouse-atmosphere/research.json)

Current-session MCP images: Stitch, Emergent and Headspace. Full 21st sources and demos:
Shooting Stars (924), Background Pixel Stars (18484). Studio neutral tokens inspected.
Norm Architects primary material research, Herman Miller chair construction and Flos
task-light specifications inform the new room. Nagano material photograph inspected;
the Kolon facade photograph is not interior evidence. Original TS canvas implementation;
no reference component code copied. Unconnected Studio synchronization remains pending.

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
Pre-workspace penthouse cf48a43 is also pushed on backup/penthouse-before-workspace-20260930.
Its art remains in asset-sources/penthouse and public/assets/penthouse. New master art,
prompts and ball registration are in asset-sources/penthouse-workspace; delivered files
are in public/assets/penthouse/workspace.
