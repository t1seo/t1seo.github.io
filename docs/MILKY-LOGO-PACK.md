# Milky logo collection — white B/C update

Updated 2026-09-30. Artwork source: `a53c1a8`, integrated as `7914885`.

The comparison gallery now uses `smile-02-white` and `smile-03-white` for B/C. A remains the approved white-ear edition. Existing selection, two-item comparison, background switching, 16/32/48-pixel samples, clipboard fallback, and individual PNG/WebP download behavior are unchanged. The studio's primary logo and favicon are unchanged.

## Deliverables

- `/Users/cillian/Downloads/Milky-Logos-20260930/`
- `/Users/cillian/Downloads/Milky-Logos-20260930.zip`
- Identical website download: `public/assets/logo-options/milky-logo-pack.zip`
- Gallery: `/milky-logo-options.html`

The ZIP contains 13 entries under `Milky-Logos/`: 10 images, an offline `index.html`, `README.txt`, and `manifest.json`.

| Version | Filename stem | PNG | WebP |
| --- | --- | --- | --- |
| A, white ears | A-happy-milky-white-ears | 1254 × 1254 | 512 × 512 |
| B, white fur | B-paper-smile-white | 1254 × 1254 | 512 × 512 |
| C, white fur | C-hello-milky-white | 1254 × 1254 | 512 × 512 |
| B, preserved warm original | B-paper-smile | 1254 × 1254 | 512 × 512 |
| C, preserved warm original | C-hello-milky | 1254 × 1254 | 512 × 512 |

All dimensions were read from the files. All 10 images are RGBA with transparent pixels. The offline preview defaults to the new white A/B/C versions, includes light/dark background switching, and offers labeled original B/C download links. It needs no network connection. The original B/C files were verified before packaging and never overwritten. The source photograph is not included.

## Validation

- ZIP: **5,763,788 bytes**, 13 entries. CRC passed; each extracted entry was checked byte-for-byte against its source file.
- ZIP SHA-256: `99d00745976710f24ac579a3179408d265d58a3ca54d13485ff943f5e44ebe94`.
- Website ZIP matches the Downloads ZIP byte-for-byte.
- `manifest.json` hashes and byte lengths were verified for all 12 listed files. The manifest does not list itself.
- Existing B/C hashes still match the original project image assets; A also remains byte-identical to the approved asset.
- Both gallery and offline inline scripts passed `node --check`.
- Every static local gallery reference, all six primary image source paths, and every relative offline image/download reference resolves to a file.
- The comparison/selection/tiny-preview implementation is unchanged apart from new B/C option IDs and text. No new dependency was added.
- Live Chrome visual verification was not performed in this worktree because the available native browser service is unavailable. Root handles integrated accessibility checks.
