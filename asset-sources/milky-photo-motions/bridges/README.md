# Milky rest transitions

Two additive transition frames fill the existing optional `sitdown` and `wake` art slots. `sitdown` bends the hind knees and lowers the hips while the forepaws carry weight. `wake` pushes the chest up through the front limbs while the hind feet gather under the body. Neither frame is a rigidly rotated or scaled version of a held pose.

Both masters were made with the built-in `image_gen.imagegen` tool, using the original standing/sitting/drowsy Milky illustrations as identity and physical-scale references. Exact prompts and untouched 1536×1024 PNG outputs are preserved here. The 768×512 runtime WebPs use uniform half-size encoding at quality 92; alpha matches the uniformly downsampled master exactly. No existing character image is overwritten.

`registration.json` records dimensions, hashes, transparent exterior samples, approximate anatomical support footprints and recommended logical runtime offsets. Keep the existing `.847` physical render scale. X coordinates come from grounded paws rather than the tail or a whole-image centroid. The frame contacts land at the same logical ground row after registration.

`contact-sheet.png` compares standing → sitdown → sitting and drowsy → wake → standing at larger and approximately 140px dog sizes. These are static asset checks, not a claim of browser playback. Fur contours retain small source-to-source differences. Playback should use the existing finite pose sequence and cancellation rules.
