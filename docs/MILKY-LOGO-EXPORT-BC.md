# Milky B/C original logo exports

Date: 2026-09-30

The user requested preservation of the liked B and C smile logos. These exports are direct, byte-identical copies of the existing generated PNG originals and shipped WebP assets. No regeneration, image editing, resizing, conversion, cropping or alpha changes were performed for this export.

## Original generated sources

Source directory: `/Users/cillian/.codex/generated_images/01a0f044-b1fc-7fb0-b2fa-e4acef221388/`

| Option | Original PNG filename | Repository copy | Native dimensions | Format | Bytes |
| --- | --- | --- | --- | --- | --- |
| B — Paper Smile | `exec-bec19a3f-5ac7-4839-aa2a-c8f8ca909458.png` | `public/assets/logo-options/smile-02.png` | 1254 × 1254 | PNG, RGBA | 1,680,074 |
| C — Hello, Milky | `exec-4c8112e5-4b92-4841-9bfd-3ecf146a9b11.png` | `public/assets/logo-options/smile-03.png` | 1254 × 1254 | PNG, RGBA | 898,983 |

These native PNG sizes are 1254 × 1254; the existing website WebPs are 512 × 512.

## Download copies

Export directory: `/Users/cillian/Downloads/Milky-Logos-20260930/`

| Download filename | Copied from | Dimensions | Format | Bytes |
| --- | --- | --- | --- | --- |
| `B-paper-smile.png` | Original B PNG above | 1254 × 1254 | PNG, RGBA | 1,680,074 |
| `B-paper-smile.webp` | `public/assets/logo-options/smile-02.webp` | 512 × 512 | WebP, RGBA | 60,970 |
| `C-hello-milky.png` | Original C PNG above | 1254 × 1254 | PNG, RGBA | 898,983 |
| `C-hello-milky.webp` | `public/assets/logo-options/smile-03.webp` | 512 × 512 | WebP, RGBA | 34,280 |

## SHA-256

All copies listed for the same format and option have the corresponding identical hash.

| File group | SHA-256 |
| --- | --- |
| B original PNG, repository PNG and download PNG | `95172cbb554f40ee93ed2355eddec432b2905c1bc0e5eaf4ee9217c6fee27f56` |
| C original PNG, repository PNG and download PNG | `e99bc8ae2763fa1791005fd1b50de6e91412e4091b8974fc21d73f1985aad69c` |
| B existing WebP and download WebP | `ad4e812345f7c0959b073b8475414e0669c949b300c48b5b320bbd580ceef2bc` |
| C existing WebP and download WebP | `bc26cdc1f5c943f90edaae892e28f89b0e7fa3b5540cb5baf5df42bc7f7fbf0a` |

## Verification

- Pillow decoded both original PNGs, both existing WebPs and all six new copies successfully. Every image is RGBA with real transparent pixels and a nonempty subject.
- Both PNG originals have alpha values from 0 to 255. B has 702,706 fully transparent pixels; C has 919,791.
- Both existing WebPs have alpha values from 0 to 254. B has 116,586 fully transparent pixels; C has 152,852. Their existing alpha values were preserved unchanged.
- Inspected the original PNG and corresponding shipped WebP for each option with `view_image`; B retains the same smiling tilted paper-cut head, and C retains the same full-body smiling Maltese pose and curled tail.
- Confirmed the repository and download PNGs are byte-identical to the original generated sources, and the download WebPs are byte-identical to the existing repository WebPs.
- Compared existing `smile-02.webp` and `smile-03.webp` bytes against their Git `HEAD` blobs after copying; both remained unchanged.
- No source-code or gallery changes were included. Browser verification was unnecessary for direct asset preservation.

Generation and refinement provenance remains in `docs/MILKY-SMILE-LOGOS.md`.
