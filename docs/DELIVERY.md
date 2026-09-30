# Final studio delivery

The delivery is created **after** every requested source, art, logo, and animation change has been integrated, checked, and committed. Do not run the final Downloads packaging step while another worker is still changing the integration worktree.

`scripts/package-studio.py` uses Python's standard library. It requires an explicit full final commit SHA and a clean tracked worktree. It does not install packages, build the app, upload, or open a browser.

## Final preparation

In the integrated `cyberpunk-studio` worktree, finish the normal test/build checks. The build must happen after the last source or public asset change so that `dist/` represents the delivery revision.

```sh
npm test
npm run build
git rev-parse HEAD
```

The standalone `/Users/cillian/Downloads/Milky-Logos-20260930/` folder must contain the final A white-ear logo, the whiter B/C variants, preserved original B/C variants, and its offline preview. Update that folder before packaging if a logo changes.

Then run this command, replacing `FULL_FINAL_COMMIT_SHA` with the full value printed above:

```sh
python3 scripts/package-studio.py \
  --source /Users/cillian/Downloads/landingpage-worktrees/cyberpunk-studio \
  --logos /Users/cillian/Downloads/Milky-Logos-20260930 \
  --expected-sha FULL_FINAL_COMMIT_SHA \
  --output /Users/cillian/Downloads/Taewon-Seo-Milky-Studio-20260930.zip
```

The command prints the actual archive path, byte count, ZIP SHA-256, entry count, source SHA, and verification result. Record that output with the final checks. If the destination already exists, it is preserved as a sibling with `.previous-<UTC timestamp>.zip` in its name. Replacement happens only after archive verification succeeds.

## Archive contents

```text
Taewon-Seo-Milky-Studio/
  START-HERE.md
  MANIFEST.json
  project/
    [tracked source, assets, licenses, docs, package.json, package-lock.json]
    dist/
  logos/
    [standalone A/B/C PNG/WebP files, previous B/C versions, preview, metadata]
    active-icons/
      milky-a-favicon.png
      milky-a-apple-touch.png
```

The project payload comes from `git ls-files`, plus the fresh production `dist/`. This retains source and asset history already present in this project, including older Jieun files. The existing public logo-download ZIP is included when tracked. The separate `logos/` folder is copied from the prepared standalone logo folder; it is not reconstructed from thumbnails.

Untracked research/debug files are not included. Symlinks are not followed. Dependencies, Git metadata, local `.claude`/`.codex`/`.agents`/`.herdr`/`.orca` configuration, editor settings, temporary directories, `.env*`, private key files, and camera-original filenames such as `20150817_211702.JPG` are excluded. Excluded tracked files are reported in `MANIFEST.json`. These rules do not strip original licensing or asset provenance documents.

Every payload file, including `dist/`, has its bytes and SHA-256 recorded in `MANIFEST.json`; the manifest excludes its own hash. The ZIP is read back to check CRC, entry names/count, exact byte counts, and every hash. All paths stay inside the single wrapper; symlink entries are disallowed. Source files are checked again before publishing the ZIP to detect concurrent edits. Entry timestamps use the source commit time, names are sorted, and permissions are fixed, so identical inputs on the same Python/zlib version produce identical ZIP bytes.

## Fresh-extraction verification

Only after the final archive exists, extract it into a **new temporary directory**, outside both the integration worktree and Downloads logo folder. Do not test by pointing a new folder back to an existing `node_modules` symlink.

1. Use Python `zipfile` or a normal ZIP utility to extract the verified archive into the new directory.
2. From the extracted `Taewon-Seo-Milky-Studio/project`, run `npm ci`, `npm test`, and `npm run build` as separate commands. This confirms the archive contains the package lock, source, and build assets needed by a clean installation.
3. Start the extracted production build with `python3 -m http.server 5175 --bind 127.0.0.1 --directory dist` and inspect it in **Chrome** at `http://127.0.0.1:5175/`.
4. Verify the A logo/favicon, intro typing, climate controls, exterior motion, explicit monitor coding, Milky actions, and `/milky-logo-options.html`. Keep audio user-triggered.
5. Report any unavailable browser checks honestly; a successful HTTP response does not prove visual animation quality. Stop the temporary server afterward.

The extraction/build checks do not modify the delivered ZIP. The handoff includes `START-HERE.md` both at wrapper level and in the tracked project source.

## Packager verification

The packaging utility was exercised against a tiny temporary Git repository, without creating the final Downloads delivery. Checks passed for CRC, every payload hash and byte count, repeated byte-identical output, preservation of an existing archive, local/private/symlink exclusions, untracked-file exclusion, extraction, wrong-SHA rejection, and dirty-source rejection. An independent review also verified rejection of a symlinked `dist/index.html` and a symlinked output parent that would otherwise write inside the source tree. These utility checks do not replace the final project build and Chrome verification above.
