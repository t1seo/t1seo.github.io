# Dog animation source audit — 2026-10-02

## Selected motion candidate

Use existing painted Milky art, with motion characteristics fitted from the real Labrador recording described by Tencent RoboticsX. This is not permission to replace Milky with the source animal. No source mesh, robot controller, trained model, or photograph has been copied.

Primary sources:
- Publisher data record: https://springernature.figshare.com/articles/dataset/Lifelike_Agility_and_Play_in_Quadrupedal_Robots_using_Reinforcement_Learning_and_Generative_Pre-trained_Models/24968946
- Versioned DOI: https://doi.org/10.6084/m9.figshare.24968946.v1
- Exact machine-readable record: https://api.figshare.com/v2/articles/24968946
- Authors’ project: https://tencent-roboticsx.github.io/lifelike-agility-and-play/
- Authors’ repository: https://github.com/Tencent-RoboticsX/lifelike-agility-and-play
- Software license: https://raw.githubusercontent.com/Tencent-RoboticsX/lifelike-agility-and-play/master/LICENSE.txt

The publisher describes raw BVH clips captured by a motion capture system. The authors identify the animal as a medium-sized Labrador and list walking, running, jumping, playing, and sitting. The BVH is already mapped onto a named animation skeleton with helper/armor nodes. It is not untouched raw marker trajectories; exclude those helper nodes and retain only meaningful anatomy. The `_ret.txt` robot clips were not used.

## License evidence and scope

Publisher API explicitly declares `CC BY 4.0`, with file `raw_bvh_data.zip`, 73,545,752 bytes, MD5 `746d592726eb7411f084518bfa1f3791`. The publisher webpage independently shows the same license. CC BY permits sharing and adaptation, including commercial uses, with attribution, license link, and change identification. However, the GitHub README separately says its code and data are for research purpose only; the repository LICENSE.txt applies MIT to software. These are distinct statements. Preserve this discrepancy instead of claiming one blanket permissive repository license. This task is a local research prototype, not deployment. Before publishing, make attribution/source provenance explicit and use the versioned publisher dataset as the input. Exact GitHub-versus-Figshare content verification is recorded separately after download.

Do not use Bandai-Namco/AI4Animation dog mocap as if it were CC0: that dog dataset has a CC BY-NC restriction. Do not infer data licensing from code licensing.

## Current conversion

`walk-cycle.json` contains the selected raw source frames 10954–11047 inclusive (zero-based), 94 samples, 0.77499969 seconds at source `Frame Time: 0.00833333` (~120 Hz). Source file: `dog_quad_walk_001.bvh`. Preserve the independent last sample; no loop correction, averaging, time warping, or new trajectories have been applied.

The BVH has 61 animated nodes with six channels each (366 scalar channels); counting terminal End Sites gives 76 nodes. Channel order is XYZ position, then ZXY Euler rotations in degrees. Position channels already contain the complete local translation, often repeating OFFSET. REPLACE offset components with explicit translation channels. Adding OFFSET again doubles limb lengths. Use Rz * Rx * Ry for local rotation and parent-to-child FK.

World up is Y. Ground plane is XZ. Forward varies as the dog walks around; each frame’s horizontal hips-to-spine3 vector supplies the projection axis. The JSON x is dot(jointWorld - hipsWorld, forward), while y is untouched jointWorld.Y. Units are unchanged; centimeters are a scale inference from roughly 55-unit hip height and 23-unit upper foreleg, not an explicit unit label. Root distance is cumulative signed hip displacement along consecutive mean forward axes.

The selected body/limb loop boundary has uncorrected RMSE ~0.412 source units, max joint endpoint distance ~1.192. Root displacement ~88.879 units; hip height range ~2.898; net heading change ~2.568 degrees, range ~10.653 degrees. The four forward-extremum phases differ (LF .785, RF .301, LH .473, RH .989). Source ankle/toe heights and footprint drift are imperfect, so contacts are heuristic. Use Milky’s own lengths and ground contacts, fitting source phase/body/angular deltas; do not directly transfer Labrador proportions.

`find_cycles.py` rejects near-synchronous same-side foot phases and selects small endpoint position/tangent mismatch. An earlier low-error candidate 2833–2928 had pace-like same-side swing and was rejected. `first-candidate-*` records a preliminary real walk with a larger loop seam. `walk-cycle-kinematics.png` shows eight actual projected skeleton poses and unmodified foot heights. These are numerical/visual source checks, not proof that the final painted Milky renderer looks natural.

## Asset alternatives researched

| Source | Contents verified on creator/licensor page | Listed price | License / fit |
| --- | --- | --- | --- |
| https://www.istockphoto.com/video/maltese-dog-walk-cycle-animation-gm1307977147-398092215 | BeezeeStock Maltese cartoon walk, green screen, up to 4K; alternate Depositphotos listing says 6 s / 30 fps | $60 individual clip shown; new-customer subscription offer separate | Licensor says royalty-free commercial use and modification. A single baked loop; no rig or start/stop/actions. No purchase/download. |
| https://depositphotos.com/video/maltese-dog-walk-cycle-animation-cartoon-video-clip-high-resolution-457206336.html | Same creator/subject, 6 s 16:9 MOV up to 3840×2160 at 30 fps | No reliable single-clip amount exposed | Standard license page summary includes personal/commercial web/app UI. Would still need image extraction/keying, silhouette/likeness review, and exact deployed-use license review. |
| https://wigglingdog.itch.io/good-boy-asset-pack | HD hand-drawn side-scroller dog, six actions: idle, walk, sleep, eat, sniff, interact; sheets and individual frames | $5+ | Commercial use and edits allowed; credit required; no redistribution/resale even modified; no feeding AI models. Cartoon illustration rather than Milky’s painted likeness. Do not submit the art to an image model. |
| https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1u5w2l2h2g209h5r4a&page-name=2d-animated-dog-game-sprite | Alsatian; HD sheets, PNG pieces, vector pieces, rigged Spriter file, seven pre-made animations; update lists jump/beg/tail-wag/sit | $3 | https://www.gamedeveloperstudio.com/license.php allows commercial derivative projects and modification, no credit requirement; source redistribution restricted. Useful rig structure, wrong breed/style. |
| https://revouger.itch.io/white-dog | 32×32, four directions, 10+ actions including walking/running/stand/lay/sit/eat/sleep/sniff/bark/play | $2+ | Commercial/noncommercial use and modification allowed; standalone redistribution/resale forbidden. Deliberately tiny pixel style unsuitable as a direct replacement. |
| https://brysiaa.itch.io/white-dog-16x16px | 16×16 white dog, idle/walk/tail-walk/sit/lay/sleep/bark, PNG/sprite/GIF | Free / name-your-price | Creator comment explicitly permits personal/commercial use and edits, not file sharing/resale. Too low-resolution for the room’s painted style. |
| https://gamifiedsoul.itch.io/dog-animations | Cartoon frame pack with nine behaviors including walk and idle | $1+ | Public listing lacks a specific commercial/modification license; do not treat purchase alone as a verified reuse grant. |

Stock footage and sprite pages establish availability and advertised contents, not verified animation quality. No candidate was purchased. The final artwork fit is stronger if Milky’s already accepted painted silhouette remains intact and only a coherent motion source/rig is reused.
