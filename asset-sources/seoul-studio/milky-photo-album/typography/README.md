# Milky's closing-letter typography

The closing letter uses **Nothing You Could Do**, Kimberly Geswein's regular 400 handwriting face. Its thin, slightly irregular pen strokes are gentler than the previous Caveat 600 marker-like text. Its largely open, unconnected letters also remain readable through the full English letter.

The font is self-hosted as the unmodified Google Fonts Latin WOFF2 (16,072 bytes). The SIL Open Font License 1.1 is included alongside it. The production site needs no request to Google Fonts or other external font service. Source URLs and checksums are recorded in `provenance.json`; the downloaded Google Fonts CSS is provenance only, not a runtime import.

## Selection

Three official Google Fonts candidates were compared using the actual letter at 30 px and a smaller 24 px sample:

- **Nothing You Could Do:** selected for fine pen strokes, open letter shapes and an informal but calm rhythm. Its official description identifies it as based on a person's handwriting.
- **La Belle Aurore:** a warmer, more connected script, but the loops and tighter word shapes were less clear at the small size.
- **Cedarville Cursive:** naturally handwritten but its round, upright schoolbook forms felt more youthful than the album's quiet memorial tone.

These are visual judgments for this particular letter, rather than claims that the alternatives are universally less readable. The comparison is a static font specimen; real Chrome layout and zoom verification belong to the integration pass.

## Roles and implementation guidance

- Keep the existing Cormorant Garamond for the cover, viewer header and memorial footer.
- Use this regular 400 face for the letter prose and salutation. Do not synthesize bold or italic.
- Suggested body size: 25–27 px on desktop, 24 px on narrow screens, line-height about 1.6, max-width 38–40 ch. Preserve ordinary paragraph spacing and the letter's scrollable content.
- Retain Caveat 600 for the short photo annotations, whose compact two-line treatment is already sized independently.
- Use `font-display: swap` and a handwriting/system fallback. Do not preload this secondary font into the room: let its first actual letter usage request it.
- The asset decodes correctly with weight 400 and 210 mapped characters. All characters in the final letter and `Milky 2011-2026` are present.

Final CSS was inspected in real Chrome through the official Codex Computer Use runtime on 2026-10-02. At 100% and 200% browser zoom, the prose keeps readable spacing, the photo annotations remain separate from the images, and the closing letter scrolls to the cutout and final memorial line while navigation remains reachable. The 320 × 740 responsive photograph layout was also visually checked. Captures remain local under /tmp/milky-*-materials-*.png because browser chrome contains unrelated personal tab titles. These checks cover Chrome on this Mac, not other browser engines or physical mobile devices.

## Official sources

- [Nothing You Could Do specimen](https://fonts.google.com/specimen/Nothing+You+Could+Do)
- [Pinned font metadata](https://github.com/google/fonts/blob/cb3271a955200f72557673e25eced6f5521f2cca/ofl/nothingyoucoulddo/METADATA.pb)
- [Pinned font description](https://github.com/google/fonts/blob/cb3271a955200f72557673e25eced6f5521f2cca/ofl/nothingyoucoulddo/DESCRIPTION.en_us.html)
- [Pinned SIL OFL 1.1 license](https://github.com/google/fonts/blob/cb3271a955200f72557673e25eced6f5521f2cca/ofl/nothingyoucoulddo/OFL.txt)
- [La Belle Aurore description](https://github.com/google/fonts/blob/main/ofl/labelleaurore/DESCRIPTION.en_us.html)
- [Cedarville Cursive description](https://github.com/google/fonts/blob/main/ofl/cedarvillecursive/DESCRIPTION.en_us.html)
