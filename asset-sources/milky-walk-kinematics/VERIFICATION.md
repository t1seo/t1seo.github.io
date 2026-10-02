# Milky gait verification — 2026-10-02

## Automated checks

- `npm test`: **725 passed, 0 failed** (Node's test runner).
- `npm run build`: **PASS**, including `tsc --noEmit` and Vite production build.
- `git diff --check`: **PASS**.
- Measured-profile tests cover periodic position/velocity, four-beat support
  timing, speed/stride coupling and distinct fore/hind swing peaks.
- Footprint tests cover pinned contacts, short walks, arrival, carried airborne
  poses, mirrored/depth routes and velocity continuity during redirection.
- Articulation tests sample 20 room routes at 1,801 positions each, checking
  reach, fixed bone lengths, bounded joint displacement and neutral arrival.
- The renderer regression samples 10 routes at 601 positions each. It inspects
  submitted forepaw triangles for positive orientation and rigid sole area.
- Existing scheduler/interaction tests cover still/reduced-motion states,
  hidden-page cancellation, resize, pending assets, teardown, bed and chase.

## Orca browser

Target: `http://127.0.0.1:5173/tmp/milky-gait-qa/index.html`.

The comparison uses the original renderer/planner from `fbff469` in the upper
row and current source modules in the lower row, driven by the same travelled
distance. This is a pose comparison; the old row is not a separately timed
recording of the old release. Floor ticks show movement under a centered dog.

Final browser checks used Orca's page-targeted browser commands with page ID
`c68a41ef-2022-42a9-be82-df3d0cc89891`. Native Codex Computer Use was used earlier
to reveal the embedded browser; after the user's backend correction it was
stopped. Subsequent verification did not switch the user's workspace or tabs.
The Orca Computer Use provider was also available and used for cleanup of the
earlier Chrome comparison tab; that tab's absence was read back afterward.

| Final check | Observed result |
| --- | --- |
| Normal walk, right | Reached 180/180 px; 0 drawing failures; cumulative counter 391 samples. |
| Brisk walk, left | Reached 180/180 px; 0 drawing failures; cumulative counter 667 samples. |
| Canvas submission timing | Cumulative p95 0.40 ms in the comparison harness. This is JavaScript draw submission time, not GPU, full-frame or mobile performance. |
| Pose inspection | Orca screenshots inspected at travelled distances 48, 74, 100 and 161.4 px. Face/coat remain recognizable and the new forepaw spike is absent after the skinning correction. |
| Final still | Four feet settle at the planned endpoint; the drawing remains displayed. |

See [the final comparison screenshot](orca-comparison.png). The comparison tab
and development server on port 5173 remain available for the user's review.

## Problems found and resolved

The first measured-pose candidate folded painted triangles near the forepaw
when flexing the ankle. This produced a visible downward-pointing spike at
161.4 px. The narrow 24-unit transition was replaced by a composed 140-unit
transition, keeping the pad and sole fully rigid. The new renderer test failed
before this correction and passes afterward. Existing upper-leg mesh folding
is not covered by a blanket claim of elimination.

An earlier browser wait timed out while the QA harness awaited `Image.decode()`
in an inactive embedded page. The harness now waits for image load events and
keeps playback controls disabled until ready. Page-targeted reload and subsequent
normal/brisk playback both succeeded without manual workspace switching.

## Limits

Naturalness remains a visual judgment; tests do not establish photorealism or
user acceptance. These are retargeted retriever measurements, not recorded
Maltese/Milky motion. Proximal joints are solved by IK rather than directly
reproducing their measured angles. Head, tail and paw-curl amounts are authored.
Run/chase is an accelerated walk, not a measured trot/gallop. Final visual checks
were on the requested comparison page, not a mobile device or deployed site.
No push or deployment was performed.
