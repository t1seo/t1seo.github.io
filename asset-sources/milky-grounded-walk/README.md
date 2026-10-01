# Grounded walk art

Three painted layers support a continuous four-leg walk while keeping Milky's established face, head size, body and tail. All original character rasters remain intact. The new source pixels were generated, so likeness and registration preservation does not mean pixel-identical artwork.

The final candidates are `torso-prototype-02.png`, `foreleg-prototype-02.png` and `hindleg-prototype-02.png`, each at 1536×1024 with genuine alpha. `registration.json` records the logical landmarks and measured sole bounds. The fore and hind textures are shared between near and far limbs, with independently registered roots and floor contacts.

Each image was created using the built-in image-generation tool, with `public/assets/cyberpunk/milky-forward-idle.webp` as its sole visual reference. Exact prompts are archived alongside the sources. No private album photograph is included. The `01` variants were rejected: the torso enlarged the subject, the front leg was too large and differently proportioned, and the hind leg had an overly long ankle. They are retained as provenance, never as runtime inputs.

The root and art reviewer accepted the second torso's face and silhouette at the actual scene size. The three-pose diagnostic—neutral, flexion and extension—showed consistent limb identity and fur joins at approximately 132 pixels of visible dog width. Narrow joint-local texture blending avoided the rectangular seams in the rigid-crop prototype. Continuous movement and browser performance remain separate runtime validation requirements.

`export.cjs` performs only a uniform 50% resolution export to 768×512 WebP at quality 94. It does not retouch, recolor, trim or move the artwork. `runtime-exports.json` records the three public assets' SHA-256 hashes and sizes; together they total 100,166 bytes. The export script uses the existing native Canvas installation for asset processing, with no application dependency added.

`prototype-alpha-audit.json` confirms eight exterior alpha probes are zero for all three selected sources. Native alpha above 32 follows the fur silhouette. `torso-comparison.png` is a diagnostic comparison against the unchanged forward idle. The runtime geometry must smoothly enter the loaded walk posture, keep planted paws fixed in world space, preserve the near/far floor lines, and handle idle, interruption and bed/ball transitions before release.
