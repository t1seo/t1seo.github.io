# Milky rest and sleepy-peek frames

Five additive frames made with the built-in `image_gen.imagegen` tool. Existing character art is unchanged. The real album photos 22, 10 and 17 inform the affectionate poses; original illustrated rest sprites remain the identity and physical-scale references.

Each `*-prompt.txt` is the exact accepted generation prompt. PNG files are unretouched 1536×1024 generated masters with real transparency. Runtime WebP files are uniformly downsampled to 768×512 and encoded at quality 92 with `@napi-rs/canvas`; no crop, warp or background-removal operation is applied. Downsampled-source alpha and decoded WebP alpha match exactly.

Use `runtimeRegistrationOffset` in `rest-registration.json` with the existing logical 1536×1024 coordinate space and `.847` render scale. The metadata also preserves independently measured footprint anchors. In the paws pair, moving the front paws closer together changes the footprint midpoint; runtime X therefore stays aligned with the existing drowsy torso instead of recentering the whole animal. Do not normalize by silhouette height.

`contact-sheet.png` shows registered sequences at approximately 140px dog width. Full-size and small-size reviews checked identity, four-leg anatomy, closed-mouth rest, grounded rump, transparent edges, paw contact and restrained head motion. A too-large first paws-lower head and widened first peek-up body were rejected and regenerated. Fur contours still vary between generated frames; these are not pixel-identical anatomy guarantees or evidence of browser playback.

Recommended playback: sit → paws-lower → paws-rest, then reverse when rising; sleep → peek-low → peek-up → peek-blink → peek-up → peek-low → sleep. Keep the existing animation lifecycle, still/reduced-motion handling and cancellation rules.
