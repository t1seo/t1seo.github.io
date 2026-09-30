# Milky rest behaviors — sitting, lying, napping (Fable worker)

Implements calm rest behavior against the contract in
`docs/MILKY-FABLE-REST-ASSET-BRIEF.md`. Art (3 core poses: `milky-rest-sit.webp`,
`milky-rest-drowsy.webp`, `milky-rest-sleep.webp`) is produced by root's imagegen worker;
the optional `sitdown`/`wake` transitionals are implemented but dormant until root confirms
them in `MILKY_SHIPPED_REST` (`src/cyber-pet.ts`). Only listed files are requested — no
404s for unproduced art.

## Behavior

- Autonomous cycle: when a rest pause elapses, `planMilkyRestCycle`
  (`src/cyber-pet-rest.ts`) may deepen the pause into sit → lying drowsy → nap instead of
  another wander, weighted so sitting appears naturally within about the first minute and a
  nap within a couple of minutes, without constant state churn. Holds: sit 7–15 s, drowsy
  6–14 s, sleep 14–30 s; a cycle only deepens, never ping-pongs, and plenty of pauses stay
  walks. All autonomous rest is silent (no `cyber:pet` events, no intro resets).
- Every rest state is one independently drawn raster pose held at the current floor point.
  No whole-dog crossfades, no sliding a static sitting/sleeping dog, no CSS body squashing,
  no teleporting. Sleep stillness is broken only by a subtle CSS breathing (scaleY ≤ 1.006,
  anchored at the ground line, disabled under reduced motion).
- Waking is gentle: pointer/keyboard activation, keyboard focus on an autonomous rest, or
  an intro overlay first restores standing (via the `wake` transitional when shipped, plus
  a short still beat on all fours) before any walk can begin; gait frames can never play
  from a resting silhouette (an explicit safety net in `requestWalk` stands the dog up even
  on a direct call).
- Explicit controls for root's desk panel: `sit()` and `sleep()` on `CyberPetController`
  (idempotent requests; `sleep()` uses the deepest delivered pose, falling back
  drowsy → sit when sleep art is missing; both are quiet no-ops until their art decodes).
  Keyboard: S toggles sitting, N toggles napping, without emitting events. `pet()`,
  `setActive()`, `destroy()` and the greet/walk event semantics are unchanged.
- Reduced motion: no autonomous resting or animation; explicit sit/sleep/S/N perform a
  still posture change with no timers and no auto-progression, and activation restores
  standing instantly.
- Safety: hidden tab, inactive scene, intro, resize or floor loss settles to standing and
  cancels every timer; rapid or interleaved commands keep exactly one action (revision
  guard + single action timer); a demoted v3 identity disables all v4 rest art; a missing
  or undecodable rest file removes only the behaviors that need it while the v4 walk keeps
  working.

## Layout expectation for delivered art

Poses share the idle registration (`MILKY_ART.v4`) and the same ground line (canvas
y ≈ 970). After delivery root reports, per file: alpha bounds, lowest ground-contact row,
horizontal center of the ground-contact footprint, and the six clear-space alpha samples.
Small horizontal footprint drift will be corrected with per-pose x offsets in a follow-up;
art far off the ground line should be regenerated instead (see the brief).

## Checks

- `npm run build` (tsc + vite) passes.
- `npm test`: 84/84 pass — new coverage: rest planner bounds/ordering/variety and
  availability filtering; autonomous sit/sleep observed with a fixed transform (no
  sliding), silence, and walking resuming; gentle wake standing before a greet walk (no
  gait frames or movement while waking); S/N toggles plus 40 rapid interleaved commands
  holding ≤1 timer and settling clean; reduced-motion still posture changes with zero
  timers; missing/failed rest art no-ops and drowsy fallback with the walk intact; hidden
  tab cancelling a nap; and the demoted v3 identity never showing rest art.
- Chrome is the only permitted browser and its UI tool is unavailable in this session, so
  live playback of the integrated rest art is NOT verified here; root reviews playback and
  sends final measurements after delivery.
