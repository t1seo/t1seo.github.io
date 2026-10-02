# Recorded canine motion for painted Milky

This experiment keeps Milky's existing painted artwork and uses a short recorded
dog walk only as a motion reference. It does not include a 3D dog model, neural
controller, private photograph, or replacement character artwork.

The source is **Lei Han et al., _Lifelike Agility and Play in Quadrupedal Robots
using Reinforcement Learning and Generative Pre-trained Models_ (2024)**.
The authors describe a medium-sized Labrador recording. Their raw BVH files are
distinct from the robot-retargeted `_ret.txt` files; this experiment uses a BVH.

- [Versioned publisher dataset](https://doi.org/10.6084/m9.figshare.24968946.v1)
- [Publisher metadata API](https://api.figshare.com/v2/articles/24968946)
- [Authors' repository](https://github.com/Tencent-RoboticsX/lifelike-agility-and-play)
- [Authors' project and paper](https://tencent-roboticsx.github.io/lifelike-agility-and-play/)
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Rights and current scope

The publisher assigns **CC BY 4.0 to the dataset**. The repository README also
says its code and data are for research purposes only, while its software license
is MIT. These different statements are preserved in `provenance.json`; the MIT
software license is not presented as the data license. The current implementation
is a **local research prototype, not a deployment authorization**.

The derived JSON must retain the authors, dataset link, license link, and the
description of changes. The public path makes the JSON loadable in a local Vite
preview; it is not evidence that this experiment has been deployed.

## Changes made to the source

`dog_quad_walk_001.bvh`, zero-based source frames **10954 through 11047
inclusive**, supplies 94 samples at `0.00833333` seconds per sample. This is a
0.77499969-second interval. It was selected by comparing endpoint poses and
tangents, then checking that the four foot phases were separated. A lower-error
candidate with pace-like, nearly synchronous same-side leg motion was rejected.

The converter evaluates the original skeleton and projects 39 useful joints into
a side view. It performs **no temporal resampling, pose smoothing, enforced foot
locking, or loop-seam correction**. The final sample remains independent of the
first. The target renderer may fit these signals to Milky's proportions; that is
a separate change, not a property of the recording.

Source motion has small foot drift and imperfect marker-to-sole registration.
Contact intervals in the JSON are explicitly heuristic, not captured force-plate
labels. The distal hind toe can identify contact late. The fore/hind forward
extrema provide another useful phase reference, but do not independently prove
ground contact. Final rendered paws require their own contact validation.

## Coordinate and parser details

- Source world **Y is up**; the horizontal plane is XZ.
- Output `x` is `dot(jointWorld - hipsWorld, horizontalForward)`, with forward
  taken from hips to spine3 separately for each source frame.
- Output `y` is unmodified world Y. It is not normalized to a single ground plane.
- Units are unchanged. Centimeters are a scale inference from limb lengths and
  approximately 55-unit hip height; the dataset record does not state the units.
- All 61 animated nodes have six channels: XYZ position, then ZXY Euler rotation.
  Including terminal End Sites gives 76 nodes and 366 scalar channels.
- Position channels contain the **complete local translation**. Replace the
  corresponding OFFSET component; adding OFFSET again doubles limb lengths.
- Local rotation is `Rz * Rx * Ry`, in channel order. Normal parent-child forward
  kinematics follows.
- Excluded: `Bip01_Footsteps`, armor/helper nodes, the extra `Dog_LeftTail` chain,
  and terminal Nub/End nodes. These do not reliably identify anatomical contacts.

Root distance integrates signed hip displacement along the mean horizontal
heading of consecutive frames. The output retains each frame's heading change.
No backwards distance is silently clamped.

## Reproduce

Python 3 and NumPy are needed only for offline extraction. The website does not
require Python, NumPy, a neural network, or the 41 MB source clip.

```sh
python3 asset-sources/milky-natural-motion/extract.py \
  /path/to/dog_quad_walk_001.bvh \
  --output public/assets/cyberpunk/milky-natural-motion/walk-cycle.json
```

The full input hash is checked before conversion. A local 94-frame BVH excerpt
can also be used with `--source-frame-base 10954`; its hash is checked separately.
The original dataset archive and full BVH are intentionally not committed.

`validation.json` records the raw sample and boundary checks.
`walk-cycle-kinematics.png` shows eight actual projected poses and foot heights.
These checks validate the source conversion, not Milky's final visual quality.
