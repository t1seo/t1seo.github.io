# A custom Milky character for Seoul Studio

Date: 2026-10-02 · Status: researched proposal, not an implemented character

Implementation update: a [first local custom-character study](MILKY-CUSTOM-PROTOTYPE.md)
now exists. The proposal below is preserved as the original research/plan;
its statements about missing future artifacts describe the time it was written.

## Recommendation

Build an original, small Maltese model around Milky's existing photographs, author its whole-body movement in Blender, and render only the character with Three.js inside the existing illustrated room. Keep the newly released 2D version available until the replacement looks like Milky and has the required actions.

Use **Blender + a fitted Rigify quadruped rig + baked GLB clips + the existing Three.js dependency**, with small runtime corrections for paw contact. No paid character purchase is required. The first deliverable should be a recognizable stationary Milky, followed by one convincing walk. A renderer or an animation library cannot substitute for those two results.

The agent can create and revise geometry, rigging scripts, materials, animation curves, exporters and integration code. That capability does not guarantee a faithful likeness or professional character animation on the first attempt. Artistic refinement is the largest uncertainty. If repeated surface and pose revisions do not meet the visual criteria below, the useful handoff is the editable model and precise correction notes for a character artist, not another promise that changing libraries will solve it.

## What is already available

- The site uses TypeScript/Vite and already includes Three.js. Its pet controller handles destinations, the ball, bed transitions, photo moments and cancellation.
- Release `1e4c7ae` retains Milky's painted appearance and samples authored canine motion for a 2D canvas. It is an interim release with documented sliding and deformation limits, not a reference standard for lifelike movement.
- The user rejected the Shiba-based 3D experiment because its proportions and face did not resemble Milky. Its code is a local experiment, not the proposed production asset.
- Existing authorized photographs and the approved 2D appearance can guide proportions. Additional source photographs must not be bundled with a public model or sent to an external generation service by default.
- Blender was not found through `command -v blender` or at `/Applications/Blender.app` during this research. Authoring-tool installation/version verification is a future implementation prerequisite; no software was installed for this proposal.

## Options and decision

| Approach | Useful contribution | Limitation for this task | Decision |
| --- | --- | --- | --- |
| Continue deforming the 2D photograph | Preserves the familiar face; inexpensive fallback | Cannot reveal unseen anatomy consistently through turns; substantial limb deformation is already visible | Keep as the released fallback |
| Recolor or reshape a stock dog | May supply a rig and motion | A different breed's head, trunk and joint proportions remain a poor likeness; clips still need inspection | Not the primary route |
| Original mesh with authored animation | Direct control of Milky's proportions, expression and body performance | Requires careful surface work, skin weights and animation revision | **Recommended** |
| Image-to-3D reconstruction | Optional rough volume to compare against a hand-built blockout | No assurance of likeness, clean joints, rig or walking animation | Optional isolated experiment |
| Motion matching or neural locomotion | Useful once a sufficiently varied motion library exists | Does not create missing motion from two loops or still photographs | Defer |

## 1. Establish Milky's shape before adding motion

Prepare a small reference board from existing authorized images: side, front and three-quarter views when available. Label uncertain or occluded anatomy instead of inventing precise measurements. Use the approved 2D face as an additional continuity reference, not as proof of the hidden side of the head.

Record ratios rather than guessing a physical size: shoulder height/body length, head/body size, muzzle length, eye spacing, ear attachment and drop, paw size, and tail curl. Build a connected low-resolution mesh, then refine the cheek, muzzle, eyelids, chest and limb transitions. Primitive volumes are a blockout, not the finished character. Keep the mouth, eyes and nose separately controllable.

Compare neutral gray and softly shaded renders at front, side and three-quarter angles. Check both a close view and Milky's actual small size in the room. Do not hide a wrong skull or a tall body under white fur. Preserve custom edits separately from generated geometry so rerunning a script cannot erase artistic corrections.

Deliverables: `milky-master.blend`, a proportion/landmark sheet, reproducible setup/export scripts, and a dated comparison sheet. These are proposed future artifacts; they do not exist yet.

## 2. Build a deformable body and restrained coat

Fit a quadruped control rig to the custom mesh. Blender's [Rigify documentation](https://docs.blender.org/manual/en/latest/addons/rigify/basics.html) lists quadruped metarigs; they provide controls, not a finished Maltese or a natural walk. Include a pelvis, articulated chest/spine, movable shoulder blades, distinct elbow/wrist and knee/hock joints, toe roll, neck/head controls, ears, jaw and tail.

Test bent and loaded limbs before animation. Skin weights should preserve shoulder and hip volume without a pinched elbow, inflated ankle or stretching bone. Add local corrective shapes only where ordinary weighting is insufficient. The proposed initial skinning limit is four normalized joint influences per vertex.

For the coat, combine sculpted tuft volumes, a painted normal/roughness texture, and a small number of textured mesh strips around the ears, cheeks and tail. Keep the body coat short and the longer strands directionally groomed. Use warm-white material with visible form rather than a uniformly bright white surface.

Native Blender hair should not be assumed to survive export. Its [glTF exporter documentation](https://docs.blender.org/manual/en/5.3/addons/scene_gltf2.html) describes mesh, skeletal-animation and shape-key export; constraints must be evaluated into supported animation data. Keep authoring controls in the `.blend` file and validate the exported result independently.

The classic [shells-and-fins research](https://pixl.cs.princeton.edu/pubs/Lengyel_2001_RFO/index.php) demonstrates layered volume textures with extra silhouette geometry. It informs the alternatives, but does not establish the quality or cost of our previous shell shader. For this small character, start with simpler mesh tufts and limited cards. [Three.js transparency documentation](https://threejs.org/manual/pages/transparency.html) explains sorting limitations: prefer alpha-tested cards where suitable and inspect overlap, shimmer and dark fringes.

## 3. Author the whole walk, then correct contact

Create one straight, relaxed walk on a neutral floor. Animate the shoulder blades, chest, pelvis, neck and head together with the limbs. The head should remain attentive while the body transfers weight; ears and tail may follow with small delayed motion. Do not add a large uniform sine-wave bob to every bone.

Use a four-beat walk as the starting pattern, and tune its timing against small-dog reference footage when suitable footage is available. Exact stride, stance fraction and joint amplitudes are authoring choices to verify, not universal Maltese constants. The previously inspected canine dataset concerns larger retrievers, so it can suggest relationships but cannot certify Milky's gait.

Bake and retain the walk's root-distance curve, heading curve and four paw-contact intervals. The route controller should respect the authored speed and turning range. At each frame:

1. Choose the current clip and phase from the requested movement.
2. Sample the authored body pose and root displacement.
3. Maintain established paw contacts during stance.
4. Apply small, reach-limited corrections to the limbs; release the contact smoothly when its phase ends or correction becomes excessive.
5. Apply restrained secondary motion and render using the existing frame owner.

Daniel Holden's [foot-locking implementation and explanation](https://theorangeduck.com/page/inverse-kinematics-foot-locking) support preserving the input performance while correcting contacts, blending contact changes and avoiding destructive hip lowering. Its examples are human; adapting separate fore/hind chains and bend directions is our proposed work. The accompanying [MIT-licensed source](https://github.com/orangeduck/GenoView-InverseKinematics/) is inspectable reference code, not a ready-made dog controller.

Holden's [code-versus-data displacement article](https://theorangeduck.com/page/code-vs-data-driven-displacement) also explains the conflict between a desired trajectory and available animation. For Milky, add explicit start, stop, shallow left/right turns and a stepped reversal instead of spinning a planted dog. Add trot/brisk movement as its own performance after the relaxed walk works. Avoid indiscriminately speeding up the same cycle.

## 4. Why a neural system is not the first milestone

[Mode-Adaptive Neural Networks for Quadruped Motion Control](https://www.pure.ed.ac.uk/ws/files/60838109/dog2.pdf) demonstrates coordinated canine locomotion learned from approximately 30 minutes of varied dog motion capture. That is useful evidence for whole-body coordination, but very different from our input of still photographs and a few generic clips. The [authors' repository](https://github.com/sebastianstarke/AI4Animation) also states research/education restrictions and noncommercial motion-data licensing; no such data or weights are approved for this website by this proposal.

[Epic's Motion Matching documentation](https://dev.epicgames.com/documentation/en-us/unreal-engine/motion-matching-in-unreal-engine) describes selecting appropriate poses from a motion database, including locomotion transitions. It does not generate missing starts, stops or canine anatomy. A small, explicit state machine is easier to inspect for our initial motion set.

Image reconstruction is similarly separate from animation. [TripoSR](https://github.com/VAST-AI-Research/TripoSR) documents MIT-licensed reconstruction code/models, not an animation-ready dog. [BITE](https://bite.is.tue.mpg.de/media/upload/8226_bite_beyond_priors_for_improve-Camera-ready%20PDF.pdf) studies dog shape and pose from images and offers its resources for research purposes. Neither is evidence that one photograph will produce a faithful, web-ready Milky. No external photo upload or GPU training is required for the recommended route.

## 5. Integrate a 3D character into the existing room

Use [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) and [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html) for the custom GLB. Start with a fixed [orthographic camera](https://threejs.org/docs/pages/OrthographicCamera.html), transparent character canvas, softly matched lighting and a contact shadow registered to the existing floor coordinates. This leaves the room illustration intact. Check color management, floor scale, bed-lip occlusion and both facing directions in context.

Keep destination selection, keyboard controls, ball events, reduced motion, hidden-tab handling and the existing frame loop. Introduce a renderer interface only where needed, with an atomic 2D fallback for missing WebGL, failed loading or context loss. There must be no second perpetual animation loop, late playback after cancellation, or hidden background rendering.

The first prototype may contain only idle and walk. **A production replacement must cover all currently reachable poses and transitions**, including sitting/sleeping, the bed approach/hop, ball actions and six photo-inspired moments. Otherwise a walk can abruptly turn into a visibly different 2D resting dog. Plan those actions explicitly before enabling the custom renderer by default.

Initial performance budgets are engineering targets, not benchmark results: 15–30k rendered triangles including tufts, 35–55 deform bones, 2–4 materials, 1–2k textures, and roughly 3–6 MB compressed character download. Profile the scene with the character on and off at the same resolution/weather. Measure frame-time change and memory on representative desktop/mobile hardware; adjust coat overdraw and render resolution before sacrificing the recognizable face. A frame-rate claim requires actual measurements.

## Milestones and completion evidence

| Milestone | Reviewable output | Completion evidence |
| --- | --- | --- |
| A. Likeness | Stationary custom mesh; front/side/three-quarter comparison | Recognizable face, ears, body and legs at room scale; disagreements recorded |
| B. Deformation | Rigged mesh, bent-limb and neck poses | Stable joint volume and silhouette; no unrelated breed proportions |
| C. One walk | Repeatable walk preview, close-up and room view | No obvious skate, knee snap, rigid chest or repetitive full-body bounce |
| D. Transitions | Start/stop, left/right turn, stepped reversal and brisk gait | Continuous feet/body motion at normal speed and slow playback |
| E. Complete behavior | GLB and metadata with existing action coverage | Bed, ball, rest and photo moments retain their visible continuity |
| F. Integration | Opt-in Three.js preview plus 2D fallback | Lifecycle, failure paths, lighting, occlusion and measured performance checked |

Record stance-paw displacement in floor coordinates, floor penetration, bone-length drift, root-speed discontinuities and exported-versus-authored pose differences. Proposed initial tolerances can be set relative to paw width; do not declare a numerical pass equivalent to natural motion. Inspect at least three continuous cycles and multiple starts/stops, not selected still frames. Compare the intended left/right/three-quarter views, not only the most flattering camera.

Visual review remains necessary: the question is whether this looks like Milky moving comfortably. These milestones are internal quality checkpoints, not a new mandatory user-approval process. If likeness remains unresolved, stop polishing fur and fix the base surface. If the walk remains robotic, fix the performance before adding more clips or a larger animation system.

## Scope, cost and next action

The recommended tools have no mandatory paid character-asset fee. Time and artistic iteration, rather than software price, dominate the work. No dependable calendar estimate is justified before completing the first likeness and walk experiments. After those two outputs, estimate the remaining action coverage from observed revision effort.

For an implementation turn, begin with **Milestone A only: an editable, stationary, custom Milky with a comparison sheet**. Do not replace the live 2D version while building it. Preserve the model, source textures, rig, named actions, exporter, motion metadata, provenance and validation notes so work remains editable and can be handed to an artist if necessary.

Research limits: no custom model, animation, benchmark or Blender installation was produced in this proposal. Sources above were inspected through official pages, primary papers or their indexed documentation; some direct Blender-documentation fetches failed. Newly discovered automatic animal-animation extensions were not source/quality-verified and are not dependencies of this recommendation.
