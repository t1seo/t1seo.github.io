# Milky — photo-based sprite remake

The active Seoul Studio uses a newly generated, painterly white Maltese based on the owner's private reference photographs. This replaces the earlier gait revisions while retaining the room, album, climate, audio, toys and movement controller.

## Artwork and motion

The eleven-row Pets atlas contains nine independently authored states and sixteen gaze directions. Rightward walking was generated as one coherent eight-pose strip, using the originally liked walking cadence and an orthographic eight-phase reference rendered from the existing CC0 Quaternius Walk animation. Leftward walking mirrors each approved frame without reversing time. The runtime uses all eight phases for both walking and brisk movement.

The final PNG is 1536×2288, RGBA, SHA-256 `279d0c1241e97964ec587262a51b37eb0b562ebbb74a7cbe8489fb0fe7de939d`. Bundled structural and visual-quality gates and the actual Pets MCP preflight passed. Three isolated blind reviewers agreed on all cardinal directions; two intermediate vertical cues remain subtle. This is an eight-frame illustrated animation, not motion capture or a claim of lifelike motion.

Six additional generated strips provide sitting, sleeping, waking, eating, play bow/reach, tilting, panting, paws/chin rest, sleepy peeking and rolling. Each strip has one calibrated scale. Grounded belly/paw postures receive documented whole-frame vertical registration; no limb is stretched or redrawn during extraction.

## Shared registration

The Pets cells use a common floor at y184. The website applies one global display size to every atlas row and matches supplement exports to the same size. The factor 196/128 preserves the previous site's frontal standing height. There are no independent walk/jump scale corrections.

Supplement source transforms register onto logical [795,970] in 1536×1024, exported as 768×512 lossless WebP. They compensate the existing 0.847 display transform. The atlas lands on the same button floor at 94%. During the existing bed hop, rigid whole-cell translation removes the atlas's own airborne offset so the physical path is counted only once.

New muzzle, forepaw and chin landmarks are measured from the exported art. Existing cancellation, still/reduced-motion, modal and hidden-tab behavior remains in the controller. The atlas presentation adds no requestAnimationFrame loop.

## Provenance and retained evidence

- Motion pose guide: [Quaternius Ultimate Animated Animal Pack](https://quaternius.com/packs/ultimateanimatedanimals.html), CC0. Existing provenance: ../milky-authored/provenance.json.
- Selected source strips, generation prompts, original and failed revisions, final previews, validation reports and full registration manifests remain in the owner's excluded local handoff bundle, `work/milky-astra-restart-20261003/run-01/`.
- Private photographs and private reference boards are not published.
- The original Codex account performs Library archival and the stable-ID ChatGPT pet update. The website release does not assert that account-side update has happened.

## Verification

Native Codex Computer Use in Chrome exercised the actual site at 1280×720, 390×844 and 320×740: directional walking, bed approach/hop/rest, waking into a meal, ball play, all six photo moments, still mode, reduced-motion controls and opening/closing the existing album. Final encoded state GIFs and the ordered look loop were inspected separately. Local site tests passed (769), as did the guestbook type check and tests (67), and the production build. Private QA recordings retain the initial smaller-site-scale failure and the corrected global calibration.
