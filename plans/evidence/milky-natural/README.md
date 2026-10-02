# Local painted Milky motion review — 2026-10-02

This is a local candidate, not a deployment or a claim that numerical tests can
certify naturalness. See [the workflow](../../../docs/MILKY-2D-MOTION-WORKFLOW.md)
and [asset research](../../../docs/MILKY-2D-ASSETS-RESEARCH.md).

- `first-candidate-poses.png`: actual early Orca Canvas poses. Wrist bunching
  and overlapping legs led to another renderer/retargeting iteration.
- `walk-poses.png`, `walk-sampled.gif`: final shaded candidate, sampled from the
  actual Orca Canvas at 32 equal phases. The GIF is not a live screen recording.
- `playback.json`: continuous comparison playback observed before deterministic
  capture, including 1×/0.25× and 132px review.
- `room-playback.json`, `room-poses.png`: first room attempt. This unfocused
  browser was throttled to about 1 fps; do not use it as smooth-playback evidence.
- `room-foreground-playback.json`, `room-foreground-poses.png`: after the same
  Orca surface was focused. 862 callbacks over 6.003s, median 6.9ms/p95 7.7ms.
  Frames include walk, settling and the retained final grounded pose. The images
  are captured Canvas artwork; CSS facing/room translation is recorded separately.
- `room-stopped.png`: actual full-room screenshot after a completed leftward walk.
- `comparison.png`: final comparison interface in the existing Orca browser.

Validation completed: 788 repository tests, project TypeScript/build, and a
separate strict TypeScript check of the experiment entry. The temporary build
directory was removed. No browser console errors/warnings were returned by the
final 100-message query (28 messages, all Vite connection diagnostics).

Geometric results and their source hashes are in
[`motion-validation.json`](../../../asset-sources/milky-natural-motion/motion-validation.json).
The failed first report is retained separately. This geometry check includes
the submitted Canvas triangles, facial landmarks and sole anchors, rather than
only an unused skeleton or alternative renderer.

Remaining scope limits: a single walk performance, faster walking capped at
1.2×, no dedicated run or fully animated turn. Ordinary redirection waits for
touchdown. A facing reversal still uses the existing 2D turn pause/flip. Crossed
furry legs remain less expressive than separately painted corrective poses.
None of these have been labelled solved by the passing numerical checks.

Resource handling: reused the existing Vite server (PID 36175, port 5173) and
Orca page `c68a41ef-2022-42a9-be82-df3d0cc89891`; no additional browser/server
was created. One-shot builds, unused large source downloads and temporary
captures were removed. Small conversion provenance and the selected BVH excerpt
remain on the external developer volume. The paused preview/server remain for
user review; stop the existing `npm run dev` terminal with Ctrl+C when finished.
