# Taewon Seo introduction

The existing name and two-line introduction now reveal in a short, deliberate sequence. Space Grotesk remains the name font. Nothing types into the desk monitor unless the visitor activates that separate interaction.

## Appearance and timing

- The entire final name is laid out from the beginning. Ten decorative glyphs change opacity; they are never appended while typing. The original two name lines remain fixed on normal-height screens.
- A thin, steady caret sits at the current glyph. There is a longer pause between the names and another before the final period. It disappears after the signature finishes, with no permanent blinking loop.
- The first character arrives at 180 ms, the final period at 1,325 ms. The existing copy reveals one line at a time at 1,455 and 1,575 ms, and everything finishes at 1,935 ms.
- Desktop type tops out at 116 px. Normal mobile screens use 52–74 px; short screens use a smaller single-row name so the header and controls retain room. The mobile intro width reserves 28 px on both sides.

## Integration

Import `mountCyberIntro` from `src/cyber-intro.ts`. All related styles are in the existing `src/cyber-studio.css`; no new stylesheet or library is required.

```ts
const introMotion = mountCyberIntro(intro);
introMotion.setVisible(false);

function syncIntroMotion() {
  introMotion.setVisible(
    studio.classList.contains('is-ready') && showIntro && !dialog.open,
  );
}
```

Run this synchronizer when the scene becomes ready, when the intro visibility changes, and when a dialog opens or closes. The controller handles document visibility internally, preserving a completed title when returning to a tab. This ensures the initial reveal is visible instead of running behind the scene-loading opacity. Root retains the background-click dismissal and 45-second idle-return behavior. Call `introMotion.destroy()` with the other controllers at disposal.

`setVisible(false)` immediately cancels timers and removes the caret. A false-to-true transition replays the signature. Repeating the current visibility is idempotent. The module additionally observes document visibility and reduced motion; enabling reduced motion immediately shows the whole name and copy with no remaining timer.

The native `h1` keeps its stable `aria-label="Taewon Seo"`. Its animated glyphs are hidden from assistive technology. The paragraph keeps its original text and line break in a visually hidden readable span; only its decorative twin animates. There are no live announcements, focus changes, or keyboard handlers. Destroy restores the original nodes and attributes, allowing clean remounts.

## Verification

- `node --experimental-strip-types --test src/cyber-intro.test.ts`: 6 passing controller tests covering reserved content/accessibility, cadence and finite completion, interrupted/rapid replay, stale callback cancellation, tab visibility, reduced motion, duplicate mounts, disposal, and remounting.
- `npm test`: 81 passing tests in this isolated branch.
- `npm run build`: TypeScript check and Vite production build pass. This scoped branch does not import the controller in `cyber-main.ts`; root performs and verifies that integration.
- Offline font-metric checks using the shipped Space Grotesk font estimate title widths including caret allowance below their available width at 320×568, 320×700, 390×844, 600×580, 768×1024, 1440×900, and 1920×1080. These are sizing estimates, not browser layout assertions.

Chrome CUA was unavailable for this task. No visual browser verification was performed, and no alternative browser automation was used. Root should verify the integrated initial reveal, repeated return, modal interruptions, 320 px layout, short landscape layout, and reduced-motion appearance in Chrome when available.
