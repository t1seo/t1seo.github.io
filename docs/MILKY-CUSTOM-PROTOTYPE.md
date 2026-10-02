# Milky custom character — first local prototype

2026-10-02 · Implemented locally · Not deployed

## Result

An original editable character now exists, built using the 27 owner-supplied
reference photographs. It has a connected body, separately shaped facial parts,
thin drop ears, a curled tail, directional white coat geometry, a 33-bone skin,
and baked **Idle** and **Walk** clips. The source is
[`milky-master.blend`](../asset-sources/milky-custom/milky-master.blend).
The [source README](../asset-sources/milky-custom/README.md) explains provenance,
rebuilding, animation conventions and the limitations of the checks.

Local review:
`http://127.0.0.1:5173/experiments/milky-custom/index.html?autoplay=0&clip=Walk`

The page supports orbit/zoom, front/side/rear/three-quarter cameras, clay and
wireframe inspection, clip selection, pause, scrubbing and playback speed.
The optional room image is only a material/background comparison; the character
is not yet registered to the live room's floor, scale, lighting or occluders.

This implements a **first likeness/deformation/walk study**, rather than declaring
the proposal's visual milestones accepted. No production pet code was changed by
this work. No deployment or push was performed.

## Reference interpretation and revisions

The standing full-body and trimmed front-face photographs are the main shape
references. The model uses a light adult torso, relatively slender legs, a visible
neck, a short muzzle, dark eyes without exposed white sclera, thin drop ears and
a high curled tail. These are visual estimates, not physical measurements.
Private photographs and the contact sheet remain outside Git and the web assets.

Five model/render iterations corrected an overly high forehead, heavy cheek and
chin volumes, thick circular ears, protruding eyes, a very bent resting hind leg,
and a sparse tail plume. The mouth line was reduced from a broad cartoon smile.
The result remains stylized: the eyelid/eye transition, cheek fur, ear silhouette
and tail plume still need likeness refinement against the photographs.

The browser initially discarded almost all coat cards. Investigation found that
the fine strand atlas averages approximately 0.106 alpha in distant mip levels,
below the original 0.28 mask cutoff. Testing 0.06/0.08/0.10, with and without
alpha-to-coverage and mipmaps, selected **0.08 with mipmaps and no alpha-to-coverage**
for this prototype. The source and exported GLB both retain that choice. Smooth
emitter normals and corrected card winding reduced the appearance of separately
shaded opaque feathers. This does not eliminate all silhouette aliasing.

## Motion implementation

The body and clips are original, with no retargeted stock Shiba mesh or motion.
An explicit anatomical armature replaces the proposal's optional Rigify starting
point so that the script can reproduce its exact rest transforms. This is an
engineering choice for the study; it is not a finished artist-facing control rig.

The 1.4-second walk uses four offset contacts, a 0.64 stance fraction and 0.46 model
units of virtual root travel. During stance, paw targets move at constant speed;
the swing trajectory joins smoothly with matching endpoint velocity. Fixed-length
limb solves, moving scapulae, chest/pelvis motion, restrained neck/head counter-motion
and ear/tail follow-through are baked at 60 Hz. Idle is 3.2 seconds.

The review clip stays in place. A future route controller must apply the recorded
root-distance curve to make planted feet stationary in world space. Starting,
stopping, turning, running, bed/ball actions and the existing photo moments are
not implemented. There is no claim of a fully natural or production-complete gait.

## Validation performed

| Check | Observed result |
| --- | --- |
| Blender source rig/action checks | PASS: fixed bone lengths, reach bounds, action replay, loop closure and sampled contact continuity |
| Independent actual-GLB geometry check | PASS: both clips, raw and loaded weights, all skinned vertices, finite transforms, duration, loop seam and contact paths |
| Actual opaque body floor bound | Minimum Y approximately +0.00305 model units during Walk; no sampled opaque-body penetration |
| Walk loop vertex seam | Approximately 1.46e-7 model units |
| Walk contact-position deviation | Approximately 0.000447 model units |
| Walk stance-speed deviation | Approximately 0.002989 model units/second |
| Orca embedded-browser visuals | Four camera screenshots, original/clay restoration, and 12 real rendered walk poses inspected |
| Orca native controls/playback | Actual Animation selector and Play button used; 15 observations over 5.61 seconds showed advancing time and four loop wraps |
| TypeScript | Strict check of the isolated preview passed |
| Repository build | TypeScript and Vite build passed; temporary output stayed on Nebula |
| Repository tests | 761 passed, zero failed/skipped |

The GLB verifier removes image/material references **in memory only** so Node can
evaluate geometry without a renderer. It cannot validate appearance. Small negative
fur-card extents are distinct from opaque paw geometry. None of these numerical
checks certifies likeness, natural movement or performance on other devices.

Initial automated page captures were blank because the embedded surface was not
servicing its queued animation frame. Synchronous `renderNow()` captured actual
Three.js poses without advancing time. After native page interaction, normal
requestAnimationFrame playback advanced and was recorded separately. The pose
contact sheet is not presented as a real-time performance measurement.

A final reload was requested after the shadow-map setting was updated to the
installed Three.js `PCFShadowMap` value. The subsequent wait/snapshot calls ended
with `runtime_unavailable`; a later inspection call stalled and was cancelled.
The existing Orca app was not restarted. This final reload was not visually
verified. The prior screenshots/playback observations remain valid, and a final
HTTP check returned 200 for the preview and the exact validated GLB hash.

Evidence:

- [Front](../plans/evidence/milky-custom/front.png),
  [side](../plans/evidence/milky-custom/side.png),
  [rear](../plans/evidence/milky-custom/rear.png),
  [three-quarter](../plans/evidence/milky-custom/three-quarter.png).
- [Twelve sampled walk poses](../plans/evidence/milky-custom/walk-poses.jpg).
- [Continuous playback observations](../plans/evidence/milky-custom/continuous-playback.json).
- [Actual export validation](../asset-sources/milky-custom/export-validation.json),
  including the exact model SHA-256 and detailed bounds.

## Remaining production work

The exported study contains **62,510 triangles, 57,190 vertices, 33 bones,
20 skinned meshes and a 3,461,092-byte GLB**. The triangle/material/draw-call costs
are above the proposal's initial targets. No mobile performance claim is made.
Optimize the groom/topology after the likeness is settled; premature removal of
silhouette geometry would make it harder to judge the face and coat.

Next, refine the face/ear/coat at close and room scale, review the walk against
appropriate moving reference footage, and author grounded start/stop/turn
transitions. Complete the remaining behaviors before any default renderer switch.
Room integration, ground registration, 2D failure fallback and device profiling
remain separate implementation work.

## Local resources

Blender 4.5.9 is retained under `/Volumes/Nebula/Developer/Tools/Blender-4.5.9/` for
editing/rebuilding. Its verified installer, extraction leftovers and disposable
build output were removed after the checks. The small private reference board
and comparison captures remain in `/Volumes/Nebula/Developer/Temp/milky-custom/`.

The existing Orca page was reused; no separate Chrome session was opened.
The local Vite server remains available on port 5173 for review. At handoff its
Vite PID was 36175 (npm parent 36139). Stop it with Ctrl-C in its owning terminal,
or verify those PIDs still identify this server before terminating them.
