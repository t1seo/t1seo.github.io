# Milky logo comparison gallery

Open `/milky-logo-options.html` through the Vite development server or the built site. This standalone public page is copied to `dist` by Vite; it uses no framework, package, or external CDN.

## Scope

- A–C: three directly designed options from `public/assets/logo-options/direct-01.webp` through `direct-03.webp`.
- D–F: three Logopia workflow options from `public/assets/logo-options/logopia-01.webp` through `logopia-03.webp`.
- Existing `public/assets/cyberpunk/milky-logo.webp` is shown separately as a reference.
- Selecting a candidate does **not** change the landing-page logo. Selection is stored only under `taewon.milky-logo-gallery.v1`, along with the preview background preference.
- Each candidate has a large preview and exact 16, 32, and 48 CSS pixel samples. A shared light/dark control switches image backgrounds.
- Up to two candidates can be compared side by side with both backgrounds simultaneously.
- A selected logo appears in a header mock and a persistent selection strip. The copy button copies a human-readable selection code; if Clipboard API access is denied, a selected readonly text field supports manual copying.

## Accessibility and layout

Native buttons provide keyboard activation, `aria-pressed` exposes selection states, and a polite live region announces changes. Clearing a selection or comparison returns focus to its originating card. Focus outlines remain visible. All motion is removed for reduced-motion users. Cards collapse to a single column below 540 px; the selected strip uses a separate mobile row for its copy button.

## Integration and verification

This gallery worker owns only this HTML file and this document. The delivered images were inspected and the final names/descriptions were aligned with their art teams:

- A: 잉크 밀키 / B: 잠든 밀키 / C: 페이퍼 밀키 (`085bc4d5d44eaafc2399b5852b207348bb40960d`).
- D: Quiet Companion / E: Night Seal / F: Little Portrait (`e0a8deac7a0f440d4ceddbd664571e6590743d7b`).
- Portrait detail and tiny-size limitations are stated on the cards. Large comparison images receive 12% surrounding space; 16/32/48 px samples retain their exact canvas dimensions.

Verified on 2026-09-30:

- All six candidate URLs on the integrated Vite server (`127.0.0.1:5174`) return HTTP 200 and `image/webp`. Every image decodes as 512×512 RGBA, alpha range 0–254 (transparent backgrounds).
- Inline JavaScript passes `node --check`; static DOM IDs are unique and ARIA/label references resolve.
- A temporary local server served this exact HTML plus the delivered worktree assets. Purpose-built axe-core 4.13 / Headless Chrome 154 scans at 320×740 and 1440×1000 each reported **0 violations, 22 passes, 1 incomplete** for WCAG 2 A/AA and WCAG 2.1 AA.
- Independent read-only review found no blocking selection, comparison, or persistence issue. Its three minor findings were fixed: focus is brought back into view on clear, reaching the two-item comparison limit is visibly reflected in disabled controls, and clipboard feedback is ignored if the selection changes during the asynchronous copy.
- No new runtime dependencies or remote CDN requests.

Native Chrome visual inspection, physical click-through, and measured horizontal-scroll verification are not claimed: the native CUA service is unavailable. The static accessibility scans above are separate from those manual checks.
