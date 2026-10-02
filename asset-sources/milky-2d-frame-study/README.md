# Existing full-body Milky frame study

Date: 2026-10-02. Scope: the eight `milky-forward-step-*` sprites, the current forward idle, and four trot sprites. This is a read-only analysis of shipped illustrations, not a new animation or a modification of their artwork. No private photographs or external services were used.

**Decision: reject direct reuse of the eight full-body frames as the foundation of the new natural walk. Preserve them as references and fallback art.** Re-timing and rigid floor registration can improve presentation, but cannot supply stable limb identities, missing intermediate poses, or an unchanging face. A fixed illustrated character with a coherent deforming rig is the more defensible starting point.

## Five findings

1. **The artwork remains useful as a likeness/material reference.** The idle is a coherent single source for the face, white coat, tail silhouette and proportions. There is no reason to replace this familiar design with a newly approximated 3D body. The head crops in [heads-sheet.jpg](heads-sheet.jpg) show why one source face should be retained through locomotion.

2. **The motion spacing is inconsistent.** In [full-frame-sheet.jpg](full-frame-sheet.jpg), frames 0 and 1 have almost the same extended-leg pose; 2 still holds a strongly extended front silhouette; 5 to 6 abruptly changes to two tightly folded lifted legs. The near/far occlusions and paw shapes also change. This does not establish four continuous, identified paw trajectories. Reordering a small subset might make a stylized loop, but no specific timing is recommended for the requested highly natural motion.

3. **Floor alignment is necessary but insufficient.** At the common 768 × 512 scale, the global lowest opaque pixel for walk frames is `[466, 478, 475, 473, 469, 477, 483, 471]`: a 17 px range. The idle reaches 484. These are alpha measurements, not proof of anatomical contact: different paws can be lowest in different images. Aligning this one number does not lock each planted paw, and some adjacent silhouette overlaps actually get worse after that translation. See [feet-sheet.jpg](feet-sheet.jpg) and [measurements.json](measurements.json).

4. **There is visible face and volume drift.** The front of the muzzle, mouth opening, eyes, ear outline and crown are reinterpreted between frames. The fixed upper-head region has a 25 px top-edge range across the eight walk images, before floor alignment. Some of this can be intended head motion, so this metric alone is not an error test; the accompanying crops show that it is not merely one rigid head moving. A new walk should animate head position and rotation while retaining one coherent facial drawing or an explicitly registered small facial set.

5. **Frame blending creates ghosts, not the missing anatomy.** [crossfade-diagnostic.jpg](crossfade-diagnostic.jpg) composites the unchanged illustrations at 50% between selected neighbors. The 5→6 transition produces doubled paws/forelegs and the 7→0 loop seam produces a double hind limb and tail. Optical flow could hide some jumps but would need manually specified near/far limb masks and correspondences at each occlusion; it cannot be assumed to recover a correct gait from these inputs. The four trot images are likewise references only: their silhouette contains suspension, but four independently varying drawings are too sparse to validate contact mechanics.

## Consequence for the new candidate

Use the existing approved-looking idle or its matching isolated painted layers as the visual source. Define four named feet, an anatomical shoulder/pelvis chain, and fixed limb lengths. Author or transfer a single coherent reference walk, including shoulder/chest/pelvis/head response. Drive progress by travelled distance. For every planted-foot interval, inspect both world-space foot drift and the rendered paw, because a mathematically fixed joint does not guarantee that a deformed painting looks planted. Keep near and far legs as distinct layers through overlaps. Add small ear/tail response only after the body and contacts are credible.

Acceptance should compare the new candidate with the unchanged idle and current animation at room scale and enlarged scale, including slow playback and 0/25/50/75/100% cycle stills. The 100% pose should equal 0%; no walking-in-place should continue after arrival. A numerical contact test is necessary, but visual approval remains necessary for anatomy, likeness and naturalness.

## Reproduction and limits

Run `python3 asset-sources/milky-2d-frame-study/study.py` from the repository. It uses Pillow and NumPy, already present in the environment, and writes only inside this folder. Each input SHA-256 is included in the JSON. The idle is downsampled to the movement canvas size. JPEG sheets are diagnostic compositions, not replacement runtime sprites. Cyan lines indicate a fixed image-space y=480 reference, not an inferred physical floor plane.

The study did not run the live site's authored-layer animation, does not measure real-dog anatomy, and does not claim that every deformation visible in a still is an error. It specifically answers whether these full-body images can be made highly natural merely by interpolation and registration. No new process, server, dependency or temporary artifact is retained.
