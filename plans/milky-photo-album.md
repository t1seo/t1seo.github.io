# Milky memorial photo album

## Outcome and fixed decisions

Add a painted album on the actual right bookcase. Clicking it opens a calm, tactile photograph album with the exact title **2011-2026 Milky**. Milky has passed away: keep the experience warm and dignified, with no invented dates, quotations, funny captions, automatic slideshow, or sound. Preserve the existing animated room, corrected Milky art, guestbook and redesigned settings sidebar.

The user explicitly requested their Downloads Milky photos on this website. Publish only optimized derivatives of the 26 visually verified Milky photographs; leave source files untouched. This specific request supersedes the earlier prohibition on bundling private reference photography for this album only.

## Evidence and scope

- Current room plate: `public/assets/penthouse/seoul/autumn/noon.webp`, source coordinates 1672×941. The real bookcase is at x1544..1672. The existing `.ph-hotspot--book` at 34%/54.5% is on the desk and continues to open About.
- Art target: full alpha rect `[1544,291,52,92]`, solid book x1548..1585, contact y378..383 on the third right-hand shelf. Validate final generated alpha against this target; do not regenerate any room plate.
- Inventory: `/tmp/t1seo-milky-photo-inventory.json`; 26 distinct files, 2,100,668 bytes total, visually checked as Milky photos with no visible people or sensitive text. Source dimensions include 360×480, 768×1024, 480×360 and 640×360. Do not upscale, fabricate detail, crop Milky, recolor, or stylize the photographs.
- Read `omo:ulw-plan`, `omo:frontend-ui-ux`, `omo:programming`, and `imagegen`. A targeted lifecycle auditor and gap reviewer examined modal races, photo privacy, responsive indices and motion. The specialized Metis role was unavailable; a read-only agent performed the same gap analysis.
- No new runtime dependency, new Cloudflare service, account, upload feature, photo tracking, or persistent browser storage.

## Ownership and dependency order

1. Art worker owns `public/assets/penthouse/objects/milky-photo-album.webp` and `asset-sources/seoul-studio/milky-photo-album/`. Generated originals and prompt are archived. Shelf artwork is a muted sage/olive linen book, quiet brass border, matte painted edges and contact shadow. The exact title is rendered in DOM rather than relying on generated lettering.
2. Photo inventory worker owns optimized `public/assets/penthouse/milky-album/photos/` and `public/assets/penthouse/milky-album/photos.json`. Use `01.webp` through `26.webp`, remove EXIF/XMP/ICC/private filenames and paths, normalize visual orientation, preserve aspect ratios. Manifest contract is `{photos:[{id,src,width,height,alt}]}`, with IDs `milky-01` through `milky-26` and public `/assets/penthouse/milky-album/photos/01.webp` paths. No dates inferred from filesystem metadata. All 26 photographs are included in the visually reviewed inventory order.
3. UI worker owns new `src/penthouse-album*.ts`, `src/penthouse-album.css` and behavioral tests. Parse the manifest once at its external boundary; no shared sidebar edits.
4. Root owns integration changes to `src/penthouse-main.ts`, `src/penthouse-room-markup.ts`, `src/penthouse-panel-markup.ts`, object registration/light CSS as needed, AGENTS/DESIGN evidence and final release. Workers are not alone in the repository and must preserve other changes.

## Album UI implementation contract

- Use a separate native `.ph-album-dialog` with unique title ID, outside `.ph-dialog`. Do not inherit the settings navigation/footer. Center a linen-bound, ivory-paper book over a restrained dark room backdrop. Reuse the existing local `Opening Cormorant` typeface and existing neutral body typography; no font download.
- Opening header and album cover use the literal `2011-2026 Milky` (ASCII hyphen), followed only by a restrained photo count. Photos remain real photographs displayed with `object-fit: contain` inside paper mats, with a faint print border and realistic binding/gutter shadow. Never stretch a low-resolution photo beyond its natural size; grow its matte instead.
- Desktop uses two photographs per spread. At viewport width below 720px or height below 520px, use a single page. State retains the active photo index, so resize/orientation changes keep that photograph visible. Show `Photos 1–2 of 26` or `Photo 1 of 26` with polite, non-repeating announcements. The final empty page for an odd count is plain paper, not a fabricated photograph.
- Previous/Next buttons are always reachable, at least 44px, explicitly labeled and disabled at boundaries; no wrapping. Left/Right, Home/End work only inside the album and ignore editable targets/modifiers. Escape uses the native dialog cancel behavior. An optional horizontal swipe shares the same navigation function and cancels on vertical intent, pointercancel or multi-touch.
- Page turn is one finite, understated 420ms fold/opacity transition with a shallow page shadow. No RAF loop, parallax, automatic advance or added sound. During a turn accept at most one latest pending navigation direction. Still mode, reduced motion, hidden document, resize and teardown finish/cancel the visual transition synchronously without leaving the controls locked; never rely only on `animationend`.
- Agreed UI/root API is `createMilkyAlbum({host?,onOpen?,onClose?,isStill?})` returning `{open(trigger?),close,destroy}`. Root supplies host, open/close callbacks and current still-mode getter; controller owns focus restoration with a visible room fallback. Lazy-import the heavy album module/CSS and fetch manifest only on first explicit open; display an accessible loading shell immediately. Failed import or image load has a visible retry action.
- Use an open-generation counter and open-lifetime AbortController. Late import/decode/image events cannot overwrite another page, reopen a closed dialog or steal focus. Destroy releases listeners, timers, animation and image references without restoring focus.
- Before first open, request zero album photos. Once open, load current spread plus the next spread only (maximum four photo sources); replace bounded DOM nodes as pages change and release obsolete image references. Do not render a hidden full gallery. Previous photos may use the browser cache. Closing stops scheduling preloads and ignores any already-running decode.

## Room and modal integration

- Draw the album sprite independently of its transparent `.ph-hotspot--album` button. Otherwise existing Immerse CSS would make the physical book disappear. Register `[1544,291,52,92]` through `ROOM_OBJECTS` in `src/penthouse-objects.ts` to reuse cached ambient lighting, or use a separate non-interactive DOM image with equivalent ambient variables. The exact cover title is tiny registered DOM print on the book, with no floating object label or plus badge.
- Add a true button with `data-action="album"`, `aria-label="Open 2011-2026 Milky photo album"`, `aria-haspopup="dialog"`; include it in the existing visible-hotspot observer. It becomes inert when the shelf is cropped. Preserve the original desk-book/About interaction.
- Add an `Open Milky’s album` action in the Milky sidebar so portrait visitors can reach the cropped shelf object. Keep all product text English.
- Change main's generic `$('dialog')` selection to `$('.ph-dialog')` before adding another native dialog.
- When opened from Milky settings, leave the existing sidebar open underneath the album's top-layer modal. Closing the album returns focus to its still-connected opener in that sidebar. This avoids the existing sidebar's queued close handler stealing focus or reactivating Milky. When opened from the shelf, return to that visible hotspot, or the existing visible clock/calendar fallback if the viewport changed.
- Keep Milky inactive while either modal is open. Album close calls `pet.setActive(!settingsDialog.open)`; it does not alter music, climate, lamp or private-note state. Main's global Escape/Immerse handler does nothing while either modal is open. Root teardown destroys the album controller and all resources.
- Read `isStill()` for each transition, so the manual animation control and saved-preset application are respected. Reduced-motion preference changes and visibility are handled inside the album controller and settle any active turn.

## Verification and release

Use existing `node --experimental-strip-types --test` infrastructure for page boundaries, 0/1/odd/26 photo counts, responsive active-photo preservation, rapid input, loader close/reopen races, error/retry and cleanup. Use the existing real DOM QA harness where available; do not add a browser automation dependency.

Root performs actual Chrome checks through official Codex Computer Use: (1) shelf click and keyboard opening, several page turns, close/focus restoration; (2) Milky sidebar → album → same sidebar; (3) desktop spread and 320px portrait/short landscape with reachable controls; (4) resize while viewing a middle photo; (5) Still/reduced motion, hidden tab and rapid close/reopen; (6) failed image/import retry without losing navigation; (7) daytime/nighttime shelf contact, exact memorial title, matte photo quality and unobscured existing vase/frame. No Orca, Safari, CDP or substitute GUI provider.

Validate no first-load photo requests, only bounded current/next images, no EXIF/XMP/private path/source filename in derivatives or public manifest, original Downloads files untouched and all 20 room-plate hashes unchanged. Run `npm test` and `npm run build`. Record screenshots and objective results in `plans/evidence/milky-photo-album-20261001.json`. Commit only scoped files, integrate into main, push and verify the existing GitHub Pages deployment under the user's standing authorization.

Done means the exact memorial title, all 26 real photos, visible painted shelf album, accessible page turns and responsive fallback work on the deployed site; existing guestbook/private memo/audio/climate/Milky interactions remain intact. Do not claim unperformed Chrome or production verification.
