# Authored canine animation source

The runtime skeleton and animation tracks come from Quaternius's **Shiba Inu**
in the [Ultimate Animated Animal Pack](https://quaternius.com/packs/ultimateanimatedanimals.html)
(July 2021, CC0 1.0 Universal). The official pack page confirms the license and
the supplied walking and galloping animations. This is an artist-authored
animation source, not a Milky recording or a claim of breed-specific motion.

The official Drive archive was quota-limited during retrieval. The unchanged
source glTF and accompanying `License.txt` were retrieved from a
[public mirror](https://github.com/agentkaerf/FreeModels/tree/main/Ultimate%20Animated%20Animals%20-%20July%202021).
The exact download URL and source SHA-256 are in [provenance.json](provenance.json).
The pack's original license text is distributed beside the runtime GLB.

## Extraction

`extract.py` keeps the original 47 non-mesh nodes and the `Walk`, `Gallop`, and
`Idle` clips. It removes the Shiba mesh, materials, images, and skin, remaps
container indices, and deduplicates identical accessor data. It does not alter
any retained node transform, keyframe time, animation value, or interpolation
mode. The self-contained GLB is 369,004 bytes, versus 2,894,445 source bytes.

```sh
python3 asset-sources/milky-authored/extract.py /path/to/ShibaInu.gltf .
```

The extractor verifies the source hash before producing output. No source
texture or mesh is needed for playback of the animation skeleton.

## Playback and coordinate contract

`src/cyber-pet-authored-clip.ts` uses the existing Three.js dependency, specifically
[GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) and
[AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html).
It has no renderer, timer, or frame loop. The caller supplies absolute seconds
from its existing animation lifecycle.

`loadAuthoredCanine()` loads the local GLB. Passing an `ArrayBuffer` instead of a
URL uses `GLTFLoader.parseAsync`, allowing real-asset Node tests without browser
or network dependencies. Returned `sample(mode, seconds)` reuses one mutable
pose buffer, while `rest` is a separate bind-pose buffer. Callers retaining two
samples must copy values. `dispose()` stops and uncaches actions, releases node
references, and is idempotent. Sampling after disposal fails explicitly.

| Runtime mode | Original clip | Duration |
|---|---|---:|
| `walk` | `Walk` | 1.0666667223 s |
| `run` | `Gallop` | 0.5666666627 s |
| `idle` | `Idle` | 3.3333332539 s |

World axes are **+Y up, +Z toward the nose, +X toward the animal's left**.
The glTF armature root has no additional scale. The rest toe heights are about
0.07 source units; the source floor is not exactly toe-origin zero.

Pose keys preserve original names, including periods in `.L` and `.R`.
GLTFLoader's internal sanitized Object3D names are not exposed. Every entry
provides its world position and world quaternion.

| Limb | Source points in anatomical order |
|---|---|
| Fore | `FrontShoulder.L` → `FrontUpperLeg.L` (upper arm root) → `FrontLowerLeg.L` (elbow) → `IKFrontLeg.L` (wrist) → `FF.L` (toe) |
| Hind | `BackShoulder.L` → `BackLeg.L` (hip) → `BackUpperLeg.L` (knee) → `BackLowerLeg.L` (hock) → `IKBackLeg.L` (ankle) → `FFB.L` (toe) |

The right side uses `.R`. The IK and toe control nodes are separately parented
under the armature; their world positions are needed for the final limb
segments. Treating `FrontLowerLeg` as the paw would truncate the front leg.

Body points are `Body`, `Back`, `Torso`, `Torso2`, `Torso3`, `Neck1`, `Neck2`,
`Neck3`, and `Head`; tail points are `Tail1`, `Tail2`, and `Tail3`.

## Validation scope

Real-asset tests cover all three playable clips, original bone names, changing
poses, finite positions and rotations, deterministic seeks across clip
switches, periodic sampling, independent rest storage, foot/body animation,
coordinate direction, and disposal. These tests validate the source player;
the visible Milky retarget and final naturalness require separate browser QA.

The extracted GLB was also compared against the original source: all 414
retained animation channels, their input/output accessor bytes, interpolation
modes, and the retained node transforms match exactly.

### Source stride limitation

This source has in-place root motion and stylized, eased horizontal foot
tracks. It does **not** define a single physical locomotion speed. An audit of
480 evenly spaced samples per cycle selected toes in their lowest 10% of
height range, with vertical speed below 0.3 source units/s and negative forward
velocity. Median backward toe speeds were:

| Clip | `FF.L` | `FF.R` | `FFB.L` | `FFB.R` |
|---|---:|---:|---:|---:|
| Walk | 2.112 | 2.220 | 3.246 | 3.549 |
| Gallop | 5.534 | 7.969 | 10.955 | 10.955 |

Speeds are source units/s. The fore/hind disagreement and acceleration during
ground contact mean that one constant root speed cannot make every paw fixed
in world space. No physically exact stride length is published from these
tracks. Playback preserves the source; translation/retargeting needs visual
assessment and may require explicit contact correction. These observations
are not proof that the final rendered motion looks natural.
