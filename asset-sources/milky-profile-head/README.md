# Milky profile head refinement

The user requested a slightly fuller head when Milky looks sideways while walking, closer to the familiar camera-facing proportions. Only the forward-looking idle, eight forward walk frames, and four brisk trot frames are replaced. All camera-facing, greeting, sleep, rest, eating and play artwork remains unchanged.

The built-in `image_gen` tool performed each raster edit separately. `before/` contains the shipped sprites used as edit targets; no private photographs were copied. Exact prompts and full generated outputs are retained beside each set.

`generated/idle-candidate-1.png` is the approved common head reference. It increases the head, ears and muzzle by a modest amount while retaining the neck attachment, body, tail and paw registration. The second idle attempt is rejected because it changes body detail more noticeably. The generated outputs retain genuine alpha. Their hidden RGB outside the alpha silhouette can look like a pale halo in viewers that ignore alpha; compositing with the alpha channel confirms there is no visible background.

Runtime WebP files retain the original 1536 × 1024 idle and 768 × 512 movement canvases. Encoding uses WebP quality 95 and preserves alpha. Source and runtime registration measurements are recorded in the validation JSON files. No runtime scale, frame offsets or gait timings were changed.
