# Milky 2.5D motion: build–inspect–correct loop

2026-10-02. Active work; not a release approval.

## User direction

The custom 3D character was explicitly rejected. Stop its modeling work. Preserve
the familiar painted Maltese appearance and build natural **2D/2.5D movement**.
Research game techniques, usable assets and libraries broadly, then implement and
validate. Work locally; the user's earlier no-deployment instruction still applies.
Use the existing Orca embedded browser, not Chrome or native Codex Computer Use.

The target is a believable Maltese with Milky's established appearance. Still
photographs identify Milky's shape; they do not establish his personal gait timing.

## Measured starting failures

The released authored path is `cyber-pet-grounded-walk` → `authored-controller` →
`authored-rig` → `grounded-render`. It applies another dog's world joint deltas
with different X/Y scales. A 481-sample inspection found near-hind ankle length
ratios of about **0.452–1.214 during Walk**, and still wider variation in Run.
The side-view painted ankle therefore visibly compresses and expands. This is
not a claim that all projected 3D bones must have constant 2D length; it is a
failure of this fixed-view artwork and this deformation mapping.

The active path also lacks planted-foot world locks, fades every joint's delta
toward zero during route endpoints, and treats most of the torso as one rigid
piece. Existing passing contact tests mostly exercise the inactive procedural
fallback. They cannot establish the active renderer's quality.

## Candidate decisions

| Candidate | What is being evaluated | Current disposition |
| --- | --- | --- |
| Released authored rig | Baseline, same art/size/root speed | Known deformation/contact failures; comparison only |
| Existing eight full-body walk frames | Frame animation / interpolation | Rejected as source: changing face/leg silhouettes, repeated poses, 17px sole-height spread at 768px canvas |
| Authored whole-body pose + 2D mesh + contact correction | Real canine motion as reference; Milky-specific lengths and protected face | Implement and inspect |
| New full-body corrected sprite cycle | Drawn corrections at poses a mesh cannot represent | Available follow-up if the mesh candidate fails at specific poses |
| Stock Maltese green-screen loop | Potential useful full-body reference | Evaluate creator license and actual contents; no purchase authorized by an open research budget |
| Generative video / interpolation | Candidate generation only | Must pass identity/contact/loop checks; never assumed production-ready |

Spine, Pixi, Rive, Live2D and Creature are tools, not ready-made Maltese movement.
Choose a runtime only when an actual rendering or authoring need justifies it.
The current Canvas renderer is sufficient for an initial controlled comparison.

## Iteration loop

1. **Fix the artwork reference.** Use the established painted Milky torso and
   limb assets. Protect the face as a rigid image region. No private album photo
   enters a public asset or external service by default.
2. **Author one coherent walk.** Use an inspected canine performance as reference
   for contact sequence, scapular motion, trunk motion and distal orientation.
   Fit that movement to this artwork's anatomy, not vice versa.
3. **Render the actual candidate.** Compare against the released baseline on the
   same background, at the same speed and at both ~132px and enlarged dog width.
4. **Measure the actual rendered path.** Collect contact drift, reach/length
   changes, mesh flips, face deformation and seam continuity from the same
   sampler/painter used by the browser. A test of a different fallback is invalid.
5. **Inspect continuous playback.** At least three cycles at 1× plus slow motion;
   inspect frame contact sheets as an additional aid, not a substitute.
6. **Name a concrete failure.** Record its phase, view and visible symptom. Change
   the smallest responsible part; preserve before/after evidence. Do not respond
   to an art failure by citing a passing numerical test.
7. **Add transitions only after the walk survives inspection.** Start, stop,
   short path, longer path, reverse direction, retarget, diagonal/depth travel,
   hide/resume and reduced motion each need their own checks.
8. **Keep the work local.** No default renderer switch or deployment on the basis
   of this workflow document. The final record must distinguish PASS, FAIL and
   NOT RUN and retain rejected evidence.

## Initial validation targets

These are engineering starting tolerances, not biological constants or automatic
proof of naturalness. Tighten or change them only with a recorded reason.

- Planted-paw drift: at most 0.75 screen px at a 132px-wide dog during the stable
  stance interval, excluding explicitly annotated toe roll/lift events.
- Side-view painted segment lengths: no unplanned collapse/stretch. Measure
  near/far lengths against each layer's own rest scale, with foreshortening only
  when the matching silhouette exists.
- No flipped triangles in visible face/body regions. Large limb flexion requires
  inspecting silhouettes and may need a corrective drawing instead of more warp.
- Face landmark ratios invariant under a common rigid transform. Neck blending
  must not change eye spacing or muzzle width.
- No floor penetration or hovering visible at normal scene size. Report opaque
  paw geometry and fur fringe separately.
- Loop position and velocity continuity; a mathematically closed cycle can still
  have an implausible acceleration or duplicated support event.
- Start/stop settle the feet; do not simply shrink all joint motion while the
  root continues to move.
- Runtime respects one frame owner, visibility, reduced motion, cancellation,
  resource disposal and the existing bed/ball/photo behavior contract.

## Primary references inspected

- [Spine asset preparation](https://esotericsoftware.com/blog/How-to-cut-your-assets-for-animation): hidden overlap and separate layers.
- [Spine foot sliding discussion with staff guidance](https://en.esotericsoftware.com/forum/d/17130-character-walks-i-see-that-it-slides-): match authored displacement and root speed; inspect ghosted contacts.
- [Spine meshes](https://esotericsoftware.com/spine-meshes) and [deform/sequence keys](https://esotericsoftware.com/spine-keys): weighted deformation and drawn pose changes.
- [GDC: quadrupeds in The Flame in the Flood](https://www.gdcvault.com/play/1023209/Animating-Quadruped-Characters-in-The): public session description inspected; full talk not claimed as viewed.
- [Catavitello et al., canine limb coordination](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0133936): fore/hind differences and scapular contribution.
- [Fischer et al., breed-related kinematics](https://www.nature.com/articles/s41598-018-34310-0): another breed's amplitudes do not automatically fit a Maltese.
- [Holden, inverse kinematics and foot locking](https://theorangeduck.com/page/inverse-kinematics-foot-locking): small contact corrections while preserving the authored motion.
- [Kovar et al., footskate cleanup](https://graphics.cs.wisc.edu/Papers/2002/KSG02/): offline contact correction.
- [ARAP image deformation](https://www-ui.is.s.u-tokyo.ac.jp/~takeo/papers/rigid.pdf): shape preservation, not motion generation.
- [Pixi mesh rendering](https://pixijs.com/8.x/guides/components/scene-objects/mesh): optional GPU renderer, MIT runtime.
- [Spine runtime license](https://esotericsoftware.com/spine-runtimes-license), [Rive pricing](https://rive.app/docs/account-admin/pricing), [Live2D SDK terms](https://www.live2d.com/en/sdk/license/), [Creature runtimes](https://github.com/kestrelm/Creature_WebGL): authoring, runtime and sample-art rights differ.

Source prices and availability are observations on the research date. No paid
tool or asset was bought, and no motion-data license is inferred from a code
repository's license. Preserve the exact selected data's provenance separately.

## Implemented local candidate

- Comparison: `http://127.0.0.1:5173/experiments/milky-motion/index.html`.
- Room integration: `http://127.0.0.1:5173/?milky=natural`. The default remains
  the released renderer. Nothing in this work has been pushed or deployed.
- [Asset research](MILKY-2D-ASSETS-RESEARCH.md) compares available dog sprite,
  stock-footage and captured-motion sources. [Source provenance](../asset-sources/milky-natural-motion/README.md)
  preserves the publisher CC BY 4.0 declaration and the repository's different
  research-purpose wording. No paid asset or tool was purchased.
- `cyber-pet-natural-motion.ts` fits five periodic harmonics to the recorded
  canine performance. The **runtime fitting** closes the cycle; the raw extracted
  data has not been mislabelled a perfect loop. Authored contact windows, 370-art-unit
  stride and 1.04-second cycle retarget it to the painted character.
- `cyber-pet-natural-render.ts` keeps the face rigid, deforms chest and pelvis
  independently, preserves limb lengths and the painted sole anchors, and uses
  restrained cached shading on the far legs. It uses Canvas 2D, not a 3D dog.
- `cyber-pet-natural-journey.ts` plans finite world-space contacts. Each foot
  finishes its own landing. Start/stop do not shrink every leg toward an idle
  image while the root slides. Depth changes and diagonal paths use the same
  world contacts and fixed-length inverse kinematics.
- `cyber-pet-natural-walk.ts` uses the existing frame owner and asset lifecycle.
  New ordinary floor destinations queue until touchdown. Activity cancellation
  retains its existing priority. The last grounded pose remains visible.

## Iterations and actual results

| Check | Result | Evidence and limit |
| --- | --- | --- |
| Original active rig | FAIL | Near-hind ankle shrank to about 45% of its artwork length |
| First new mesh | FAIL | Up to 15 flipped triangles; visible bunched wrists |
| Revised mesh and retarget | Numerical PASS | Rotation interpolation, silhouette-aware mesh and reduced wrist flexion; min area ratio about 0.264, zero flips over 2,049 poses |
| Internal velocity continuity | First FAIL, revised PASS | Hard paw-angle cap produced about 131 art-units/s of velocity discontinuity; smooth bounded curves remove the observed kink |
| Actual submitted Canvas sole and face geometry | PASS | Sole error below 7e-13 art units, world stance drift below 2e-13; face pair-distance error below 8e-13 |
| Finite journey/lifecycle | PASS in automated checks | Both facings, diagonal/depth/short travel, final contacts, same-facing restart, cancellation and queued ordinary redirects |
| Full repository tests | PASS | 788 tests, zero failures |
| TypeScript/build | PASS | Project build and separate strict check of the comparison-page entry; external build output removed |
| Continuous Orca comparison | Executed | More than three cycles at 1× and 0.25×; 132/350px controls, actual Canvas pose inspection |
| Actual room traversal and stop | Executed | Focused Orca recorded 862 animation callbacks in 6.003s; median interval 6.9ms, p95 7.7ms; walking → settling → idle with final painted stance retained |
| Visual naturalness | Improved, subjective review remains | Face identity stable; wrist knot reduced; far-leg shading improves overlap. Close-up same-color fur and crossing legs are still limitations of three source layers |
| Fully animated turn, unique running clip | NOT IMPLEMENTED | Turns happen after landing with a 2D facing change; faster requests use this walk, capped at 1.2× |

The first room capture was **not** evidence of smooth playback: the unfocused
Orca surface was throttled to approximately one callback per second. After
activating this project's existing browser surface with Orca Computer Use,
foreground timing above was measured. These are observations on this machine,
not a mobile performance guarantee. A frame-rate measurement does not prove
anatomical or artistic quality.

Reports and images live in [plans/evidence/milky-natural](../plans/evidence/milky-natural).
The [initial failed numerical report](../asset-sources/milky-natural-motion/motion-validation-initial-fail.json)
is retained beside the [current report](../asset-sources/milky-natural-motion/motion-validation.json).
The GIF is a **32-pose deterministic capture of the actual Orca Canvas**; it is
not represented as a real-time screen recording. Room timing records distinguish
the throttled and foreground runs.

## Repeat the loop

1. Run `npm test` and `npx tsc --noEmit`. For a new motion/mesh revision, refresh
   the current geometry report with
   `MILKY_WRITE_VALIDATION=1 node --experimental-strip-types --test src/cyber-pet-natural-motion.test.ts`.
   Preserve earlier failed evidence when changing a threshold or implementation.
2. Reuse the existing Vite server and Orca page. On the comparison page, use
   132px travelling playback for at least three cycles, then 350px at 0.25×.
   Scrub through 0.125/0.25/0.625/0.75 where wrists and opposite legs overlap.
   `window.milkyMotionQA` exposes `state`, `seek`, `play`, `size`, `mode`,
   `overlays` and `dispose` for repeatable inspection.
3. Check the actual room with `?milky=natural`: focus Milky, use arrow keys,
   repeat/reverse a destination while moving, wait for the final landing, and
   inspect an activity interruption. Keep automated lifecycle results separate
   from scenarios actually observed in the browser.
4. Verify `document.hasFocus()` and callback intervals before drawing conclusions
   about smoothness. A successful background command or `document.hidden=false`
   alone did not establish an unthrottled Orca view in this session.
5. Name a visible failure and its phase before adjusting the corresponding
   curve, mesh or layer. Re-run the active geometry check and repeat the same
   visual comparison. Do not replace visual inspection with a green test suite.

For this revision, temporary builds and large unused motion downloads were
removed. The existing local Vite preview on port 5173 is retained for review.
The rejected 3D experiment and unrelated pre-existing changes were preserved.
