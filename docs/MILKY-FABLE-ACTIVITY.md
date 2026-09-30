# Milky activities — eating, ball play, brisk trot, forward gaze (Fable worker)

Implements the behaviors contracted in `docs/MILKY-FABLE-ACTIVITY-ASSET-BRIEF.md` plus the
forward-look locomotion set. All art is optional and requested only from explicit shipped
lists; anything missing quietly removes just the behaviors that need it while the v4 walk
and the rest cycle keep working.

## API / event / keyboard contract (for root's desk panel wiring)

`mountCyberPet(host)` returns `CyberPetController`:

| Method | Behavior | Requirements | No-op when |
| --- | --- | --- | --- |
| `pet()` | greet: camera look-up, then a small walk | v4 or v3 set | unavailable |
| `sit()` | settle onto haunches, later stands again | `milky-rest-sit` | art missing |
| `sleep()` | lie down and nap (deepest delivered pose) | rest art | art missing |
| `feed()` | walk to a real bowl, eat, raised pause | eat poses + bowl | art missing |
| `play()` | approach, play-bow, nudge, chase rolling ball | play poses + ball | art missing |
| `run()` | brisk multi-leg trot (faster cadence) | gait | reduced motion |
| `setActive(bool)` / `destroy()` | unchanged | | |

Events on `host` (`cyber:pet`, `detail.kind`): explicit actions announce accurately —
`'greet'` (click/`pet()`), `'walk'` (arrow keys), `'feed'`, `'play'`, `'run'` (their
methods, fired only when the action actually starts; an art-missing no-op emits nothing).
`sit()`/`sleep()` and the S/N keys stay silent, as wired earlier. Passive/autonomous
behavior NEVER emits events or resets the intro timer. No audio anywhere.

Keyboard on the pet button: arrows walk, S toggles sitting, N toggles napping (unchanged).
Feed/play/run have no keyboard shortcut — root's desk panel calls the methods.

All commands are interrupt-coherent: a new command (or a pointer greet) collapses to the
last intent, wakes/stands first when resting (never walking from a lying pose), keeps at
most one action timer plus one shared animation frame, and clears a superseded session's
props. Reduced motion: explicit feed/play show a still pose with a static prop and zero
timers; run is an honest no-op; autonomous motion is off entirely.

## Behavior details

- **Meals** (explicit only — autonomy never feeds): the bowl appears ahead on the floor,
  Milky walks to it (stand point derived from the measured muzzle reach), turns to it and
  alternates lowered bites with brief chewing lifts, ends with a raised-head pause; the
  bowl never slides while she eats. She then stands and takes a short bounded step away
  (turning back the way she came, or past the bowl at a wall), and the bowl is removed
  only after that clearance. Under reduced motion the meal stays a static pose with a
  static bowl and no forced walk.
- **Play**: the ball appears ahead; Milky approaches (1.15× cadence), play-bows, nudges
  with the reach pose — the nudge is the contact moment — and the ball hops and rolls with
  modest gravity, rolling friction, wall reflection inside the actual visible floor, and a
  grounded contact shadow that fades as the ball lifts. Milky trots after it (1.4×);
  1–2 rounds, then rest. The ball moves only through its physics; it never teleports.
- **Run**: 2–3 longer legs at 1.32–1.48× cadence, using the separately authored four-frame
  diagonal trot when all four images decode. Two opposite diagonal contact poses alternate
  with two brief airborne poses; gait remains linked to distance. This is a light trot,
  not a full gallop. Missing or incomplete trot art falls back to brisk walking.
- **Autonomy**: pauses rarely turn playful (~5% ball game when art shipped, ~5% single
  trot leg), rest cycles stay common, wandering continues; all silent.
- **Forward gaze**: the optional 9-file forward-look set is atomic (all decode or none is
  used; any failure disables the set without touching the v4 gait). When active, walks use
  the forward frames (one set per walk, never mixed), quiet idle favors the forward gaze
  ~75% of settles, greeting always returns the camera look, and camera-face micro-poses
  (blink/attend/sniff) never land on a forward gaze.

## Registration status

- Rest poses: final, per delivered `milky-rest-registration.json`.
- Activity poses: FINAL, per the delivered `milky-activity-registration.json`
  (`offsetToSharedAnchor` onto (795, 970) at scale .847): eat-low (+104, +19), eat-lift
  (+101.5, +17), play-bow (−22, +2), play-reach (+125.5, +32). Interaction reaches are
  calculated from the JSON's registered landmarks: eat-low muzzle tip x 1474 − 795 = 679
  native px drives the bowl stand point; the registered raised paw tip (1511.5, 812) −
  795 = 716.5 native px drives where Milky stands so the reach pose actually contacts the
  ball (approach and chase both use it — no fixed screen offsets).
- Props: final measured 512² anchors (bowl base (257.5, 506), ball bottom (255, 406))
  shift each image onto the wrapper's floor origin; wrapper widths account for drawn
  extents so the visible bowl ≈ .30 and ball ≈ .16 of body length in both orientations
  (portrait applies the same 11/14 factor as the dog's button).
- Forward set: FINAL, per the delivered `milky-forward-registration.json`: canonical center
  x795 / floor y970 with NO per-frame global offsets ("preserve shared body transform; do
  not align by nose/bounds") — exactly what the runtime does. Residual nose variation
  (19.01×15.77 px native) and ~24 px torso variation are documented sprite limits, not
  corrected by whole-body shifts; the delivered final frames reduced the worst 0→1 nose
  height delta from 19 to 6.36 px. All nine assets are integrated and
  `MILKY_SHIPPED_FORWARD` stays true.
- Depth ordering: the pet button paints at z-index 1 above the props layer (z-index 0), so
  the lowered eating face reads over the bowl rim and the eyes stay visible; DOM order and
  art unchanged.
- Trot set: DELIVERED in `milky-trot-registration.json`, atomic four-frame tier for brisk
  legs only (cadence > 1.25), fixed for each leg. `MILKY_SHIPPED_TROT` is true. Root applies
  one common +28 native-pixel Y translation (+14 in 768px export space) so the measured
  contact floor471 maps to485. No individual frame is aligned by its lowest foot, preserving
  the airborne clearances [0,42,2,25] export pixels. All four frames retain the v4 scale and
  center. Failure still falls back to brisk walking.

## Checks

- Fable checkpoint `3b3319a` passed its build and 101 tests; root integration results are in `CYBERPUNK-CHECKS.md`. New coverage: meal/play/run planners; ball
  physics trajectory bounds, wall reflection, and dt-robust settling regressions at 60, 30,
  20 and 10 fps (fixing the reviewer-reproduced ground-bounce Euler fixed point that
  previously kept `vh ≈ BOUNCE·G·dt/(1+BOUNCE)` oscillating forever); feed/play/run flows
  with prop stability, bounds and cleanup; interrupt coherence and last-intent collapse;
  reduced motion; missing-art no-ops; forward-set atomicity and gaze rules; hidden-tab and
  destroy cleanup including the prop layer.
- Chrome is unavailable in this session (no Playwright/CDP used), so live playback of the
  integrated activity art is NOT verified here. Final measurements, actual-alpha geometry
  checks and independent code review are complete; those do not replace browser playback.
