# Milky's measured walk and game-animation references

The runtime keeps Milky's painted likeness and uses a 2.5D skeletal deformation.
A measured canine cycle provides pose guidance; exact world-space footprints
constrain the feet. No new character raster, game engine, neural network, or
third-party runtime is required.

## Evidence and application

| Primary reference | Inspected material | Application here |
| --- | --- | --- |
| [Catavitello, Ivanenko & Lacquaniti, 2015](https://doi.org/10.1371/journal.pone.0133936) | Paper, methods, figures and [S1 Dataset](https://doi.org/10.1371/journal.pone.0133936.s001) | Separate fore/hind segment and toe-clearance curves, rotating scapula, trunk height, lateral footfall sequence. |
| [Daniel Holden: Motion-Matching](https://github.com/orangeduck/Motion-Matching/blob/main/controller.cpp) | `contact_update`, `ik_two_bone`, and [skinning source](https://github.com/orangeduck/Motion-Matching/blob/main/character.h) | Lock planted feet in world space, preserve contact state across redirection, and leave a small reach margin to prevent a straight-knee snap. The existing footprint planner and independent TypeScript solver implement these principles; the demo's motion database is not imported. |
| [Spine IK implementation](https://github.com/EsotericSoftware/spine-runtimes/blob/4.2/spine-ts/spine-core/src/IkConstraint.ts) and [IK documentation](https://esotericsoftware.com/spine-ik-constraints) | Two-bone constraint, softness, authored-pose/IK mixing | A pose curve guides the distal joint; analytic IK solves the other two links under the contact constraint. Bone lengths remain fixed. No Spine code or runtime is copied. |
| [Unreal Engine pose warping](https://dev.epicgames.com/documentation/en-us/unreal-engine/pose-warping-in-unreal-engine) | Stride warping and limb-extension limits | Keep root speed proportional to the step length, including the shorter steps used when moving into the room. |
| [GDC: Animating Quadruped Characters in The Flame in the Flood](https://www.gdcvault.com/play/1023209/Animating-Quadruped-Characters-in-The) | Public session abstract only; full talk not watched | Context for authored quadruped poses, blending and foot-slide problems. Not evidence for an uninspected implementation. |
| [Martin & Neff: Interactive Quadruped Animation](https://web.cs.ucdavis.edu/~neff/papers/CAT_MiG.pdf) | Paper | Footprint-driven locomotion with pose guidance and secondary movement; this paper's animal is a cat. |

The game-code references support the implementation strategy, not a claim that
Milky reproduces a particular shipped game's animation. Motion matching selects
poses from a suitable database; it does not create good canine poses by itself.
A full 3D rig would also need suitable anatomy, skinning and animation data.
The current side-view room does not justify replacing Milky's established art
with an unrelated 3D model.

## Runtime options considered

The user explicitly permits animation libraries and a 3D implementation. The
choice here is based on the existing illustrated character and measured result,
not a restriction against dependencies.

| Option | Official documentation inspected | Decision |
| --- | --- | --- |
| Three.js (already installed in this repository) | [SkinnedMesh](https://threejs.org/docs/pages/SkinnedMesh.html): skeleton, bind pose, skin indices and weights | Suitable for a future authored 3D Milky rig. The current defect is the pose/weight mapping, which a renderer change would preserve. |
| PixiJS | [Mesh](https://pixijs.com/8.x/guides/components/scene-objects/mesh): dynamic positions, UVs and indices | A suitable GPU rendering path if mesh submission becomes a measured bottleneck. It still needs the same gait and deformation geometry. |
| Spine with PixiJS | [Official runtime](https://esotericsoftware.com/spine-pixi) and [runtime license](https://esotericsoftware.com/spine-runtimes-license) | Strong authoring workflow for a new skeletal asset. No existing Spine asset or project license was found; no Spine runtime code is incorporated. |

The selected implementation keeps the existing Canvas surface and frame owner,
uses measured curves with contact-constrained IK, and improves its skinning.
This avoids changing character appearance or introducing a second rendering
lifecycle while addressing the observed motion defects directly.

## Dataset attribution and derivation

Copyright © 2015 Giovanna Catavitello, Yuri P. Ivanenko and Francesco Lacquaniti.
“Planar Covariation of Hindlimb and Forelimb Elevation Angles during Terrestrial
and Aquatic Locomotion of Dogs,” PLOS ONE 10(7): e0133936.
Dataset and derived tables are licensed under
[Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
Public runtime attribution is also in
[`public/assets/cyberpunk/milky-grounded-walk/CREDITS.md`](../../public/assets/cyberpunk/milky-grounded-walk/CREDITS.md).

`extract.py` reads 30 forelimb and 30 hindlimb walking strides from six subjects.
It aligns touchdown/toe-off to a 60% stance interval, removes the endpoint drift,
centers root heights and normalizes them by the trial's mean SCA–GTR length, averages strides within each dog and then weights dogs
equally. It exports 33 samples including a repeated endpoint, rounded to 0.001.
Toe-marker heights (DPF/DPH) are separately sampled from toe-off to touchdown,
detrended between the ground-contact endpoints, normalized by trunk length,
averaged with equal subject weights, and rounded to 0.0001. These preserve an
early, higher forepaw return and a later, lower hindpaw return. The runtime
eases the first and last eighth of each swing to zero contact velocity, scales
clearance down for short steps, and preserves inherited velocity on redirection.
`provenance.json` records the six input hashes and transformations. The runtime
uses periodic cubic interpolation with continuous velocity at the cycle seam.

Angles are degrees from downward vertical, positive toward the animal's front.
`ROOT_Y` is normalized against the trial's mean SCA–GTR trunk length, positive upward. A
585-art-unit trunk retargets the height channel. Fore columns are scapula, upper
arm, lower arm, hand, root height; hind columns are thigh, shank, foot, root
height. Currently only scapula, distal elevation and root height guide the pose;
proximal angles are reconstructed by contact-constrained IK.

The measured subjects are Golden/Labrador Retrievers, not Maltese dogs. This is
an artistic retarget, not a recording of Milky. The 480-art-unit stride, paw curl,
reach margin, neck stabilization and delayed tail follow-through are authored
choices. The original source lengths, textures and contact coordinates remain.
The normal four-beat walk uses 0, .14, .50, .64 footfall offsets and 60% support;
entry, exit and depth routes adapt their contact schedule to avoid overreach.
The Run/chase action remains an accelerated walk, not a measured trot or gallop.

Reproduce the tables after downloading and extracting S1 DataSet:

```sh
uv run --with scipy python asset-sources/milky-walk-kinematics/extract.py /path/to/S1_DataSet .
```

SciPy is only an offline extraction dependency. No private photograph or raw
motion dataset is bundled in the website.

## Verification

The automated checks exercise exact planted soles, preserved bone lengths,
continuous joints, mirrored/depth routes, carried poses on redirection, cycle
seams, support timing, and cancellation through the existing single frame loop.
Browser observations and limitations are recorded in `VERIFICATION.md`.
