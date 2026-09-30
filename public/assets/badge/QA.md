# Badge verification — 2026-09-29

Scope: `src/badge.ts`, `src/badge.css`, and `public/assets/badge/`.

## Checks completed

- Strict TypeScript check with TypeScript from the root workspace: `tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --strict --noUncheckedSideEffectImports false src/badge.ts` — passed.
- Native Google Chrome, separate Vite module harness at `http://127.0.0.1:4178`: front visual comparison against the supplied screenshot. Preserved card aspect ratio, cream paper texture, name, typography, dark mascot panel, original blue mascot, original QR, metal pin and black lanyard.
- Pointer click: back became visible; accessibility state changed to “현재 뒷면”, `aria-pressed=true`, and the front content disappeared from the accessibility tree.
- Enter: returned to the front once; the AI Class link disappeared from the accessibility tree.
- Pointer drag approximately 125 px to the right: the card rotated and settled; the face remained on the front (no accidental click/flip).
- Space: flipped to the back once. Tab then focused “AI Class 방문하기”; Chrome reported the destination `https://learn.jieun.ai` and a visible focus ring.
- Source review: tracks primary pointer ID; preserves the initial grab offset; uses maximum drag distance; handles pointer cancel, capture loss, resize, window blur and teardown. All event listeners have abortable cleanup; animation frames stop after settling and on destroy.
- Original-site audit by a separate read-only collaboration agent confirmed proportions, copy, front/back details, and input edge cases before implementation.

## Integration still to verify

Full-scene lighting, final desktop/mobile sizing, OS reduced-motion emulation and production build are root integration checks. This module responds to OS reduced motion and ancestor `data-motion="off"` / `data-motion="false"`.
