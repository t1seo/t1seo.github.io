# Milky activity artwork

Four food/play dog poses and two independent props, produced against the Fable activity brief. Final assets live in public/assets/cyberpunk/. No application code was changed by this art task.

## Identity and production

The private 20150817_211702.JPG supplies Milky's likeness; it is not copied into the repository. Existing milky-v4-idle.webp supplies physical body scale, the clipped white torso coat, tousled head fur, short drop ears, curled plume tail and soft indoor lighting. Food/play gaze is directed toward the action target, with a natural profile or three-quarter face.

Built-in imagegen was used for every generation and correction with transparent_background:true. All selected PNGs were converted as whole images using cwebp -q 92 -alpha_q 100 -m 6. Dog canvases were not resized. Props were generated at1254×1254 and converted as whole images to512×512. No Python image editing, limb compositing, reconstructed alpha masks or background removal was used. Read-only Pillow/SciPy measurements produced docs/milky-activity-registration.json.

## Delivered files and registration

Dog canvases are1536×1024 RGBA WebP. Coordinates below are native exported pixels. Support center is based on grounded paws, including near/far perspective; it is not the alpha-bounds center. Raised reach paw is excluded from support. Hand-labelled anatomical landmarks have approximately5px uncertainty.

| File | Alpha>32 bounds (right/bottom exclusive) | Support center x / lowest y | Offset to (795,970) | Interaction point |
|---|---|---|---|---|
| milky-eat-low.webp | [118,86,1471,952] | 691 /951 | (+104,+19) | Muzzle(1370,891) |
| milky-eat-lift.webp | [112,73,1460,954] | 693.5 /953 | (+101.5,+17) | Muzzle(1373,812) |
| milky-play-bow.webp | [115,44,1436,969] | 817 /968 | (−22,+2) | Muzzle(1349,717) |
| milky-play-reach.webp | [128,93,1445,939] | 669.5 /938 | (+125.5,+32) | Raised front toe(1386,780) |

After these offsets, the meal muzzle targets are(1474,910) and(1474.5,829). Keep the bowl fixed at the low-pose target while the head lifts. Do not move the whole dog to enforce the brief's nominal nose x. The eating pair's paw locations differ by approximately1–3px, but the generated bodies are not pixel-identical.

| Prop | Canvas | Drawn alpha>32 size | Drawn center | Ground anchor |
|---|---|---|---|---|
| milky-prop-bowl.webp |512×512 |380×230 |(256,392) |(257.5,506) |
| milky-prop-ball.webp |512×512 |304×303 |(256,255.5) |(255,406) |

The bowl's actual width is5% below the approximate400px goal, and its base is within the explicit12px anchor tolerance. Physical size intent remains bowl width≈0.30×body length and ball diameter≈0.16×body length. Runtime owns prop motion, floor depth, mirroring and contact shadows.

## Verification and limits

- All six final files decode as RGBA WebP; total894,520bytes.
- All four dog alpha planes exactly match their selected generated PNGs. Six shared exterior samples per dog are zero.
- No dog alpha>32 exists farther than40px from opaque fur. Distant residuals are at most1/255 alpha (54,169,279,1353pixels respectively); there is no visible baked floor, cast shadow or broad halo. The preview renderer can display transparent RGB as a glow; raw alpha was checked instead of inferring opacity from that preview.
- Each prop has one alpha>32 component, zero alpha>32 pixels more than10px from opaque material, and seven exterior samples at alpha0. Prop reviewer confirmed no baked floor or shadow.
- Independent read-only visual review accepted all four final dog poses: four natural legs, consistent body scale/likeness, food-directed gaze and corrected toy-directed profile gaze. The first lift was too high and the first play faces looked toward the camera; those candidates were corrected and were not shipped.
- eat-lift muzzle x1373 is33px beyond the nominal allowed upper x1340. The registered eating pair instead has nearly identical muzzle x and an81px head rise, which supports a fixed bowl. This is a documented contract deviation.
- Reach's functional front-toe point(1386,780) is within the requested range. The outermost fur reaches x1400,10px beyond the upper x aim1390.
- Four held action poses do not constitute continuous anatomical eating/play motion capture. No authored trot frames were added; faster reuse of walking poses must be described as brisk stepping.
- Chrome composition, floor alignment in the room and continuous playback remain root's integration checks; this task does not claim browser verification.

## Selected generated sources

All dog sources below are in /Users/cillian/.codex/generated_images/01a0f0ae-2647-7893-a6a3-a302744b7169/.

- eat-low: exec-648983ca-a889-4309-925f-b30002d8b716.png
- eat-lift: exec-f37535aa-84ce-442a-a397-ed5bb76c2833.png
- play-bow: exec-3cae7e50-59aa-439f-bd1a-bd9b99a97ce8.png
- play-reach: exec-06a36f15-ce63-4a30-b769-6a8c2a99ddd7.png

Prop sources and exact prompts follow. Intermediate candidates remain only in the generator output directory; only the six selected WebPs are public.

## Exact prompt record

Each prompt was sent to the built-in imagegen tool with transparent_background:true. Reference paths identify input roles; private photos are not bundled.

### Eat-low — selected

References: existing milky-v4-idle.webp as edit/scale/coat reference; private 20150817_211702.JPG as identity-only reference.

Use case: identity-preserve. Create ONE standalone full-body transparent RGBA dog sprite for a photo-based 2.5D website pet. Input1 is the exact Milky character/body/coat/lighting reference and edit target; input2 is PRIVATE identity-only photo reference, do not copy its room or floor. Output canvas EXACTLY1536x1024. Primary change: Milky is EATING from an invisible bowl ahead, standing right-facing in natural three-quarter profile. All four paws planted. Preserve input1 physical body scale, torso location, white clipped body coat, drop ears, curled plume tail, natural small Maltese proportions and soft indoor lighting. Keep torso and paws almost unchanged: near hind paw about(345,950), far hind(565,912), near front(1055,970), far front(1205,928), overall support center~795. Change only natural head/neck down-forward into eating posture, muzzle-tip aimed at(1330,880), within50px; muzzle above front paws and clearly pointing forward-down into an absent bowl. Head must turn in profile/three-quarter AWAY FROM CAMERA; eyes look down at food location, NOT viewer. Mouth near closed in a natural eating expression; no exaggerated smile. Same compact black nose, dark eyes, tousled white head fur as Milky in references. Natural neck connection and exactly FOUR anatomical legs, two front/two rear. No bowl, food, ball or any props in dog file. True transparent background outside fur silhouette. Fine fur antialias only; NO floor, rug, backdrop, cast shadow, ambient haze, white halo, ghost fur, checkerboard pixels, text, label or effects. Ground line aroundy970, all fur fully inside canvas with transparent margins. Do not rescale dog to fill canvas after lowering head; this must remain the same-sized dog as input1.

### milkyEatLiftResult — initial candidate, later corrected

References: /Users/cillian/.codex/generated_images/01a0f0ae-2647-7893-a6a3-a302744b7169/exec-648983ca-a889-4309-925f-b30002d8b716.png

Use case: identity-preserve. Edit the supplied Milky EATING LOW sprite into the second animation pose, CHEWING WITH HEAD SLIGHTLY LIFTED. Output a single full dog on an EXACT1536x1024 truly transparent RGBA canvas. Input1 is edit target and exact anatomy/coat/lighting/registration reference. KEEP BODY, ALL FOUR LEGS, EACH PAW LOCATION, TAIL, torso silhouette, fur detail and physical scale unchanged. Change only head and upper neck: lift muzzle gently from its current low position to muzzle-tip around(1280,760), within60px. Continue natural right-facing profile/three-quarter face, nose turned toward the food below-ahead, eyes visibly looking downward at food location about(1330,900), NEVER at camera. Mouth nearly closed with a tiny gentle chewing opening, no tongue hanging out, no giant smile. Preserve the same small Maltese face, compact black nose, drooping white ears, clipped white body fur, curled plume tail, soft natural indoor lighting. Four anatomically natural legs only; no body stretch or rescaling. Keep paws exactly planted as source. No bowl or other props, NO painted floor, cast shadow, ambient glow, haze, backdrop, checkerboard or white outline. Alpha must be zero outside the fur apart from fine hair edge antialias. Sprite is for switching low/lift heads while the body is stable.

### milkyPlayBowResult — initial candidate, later corrected

References: /Users/cillian/Downloads/landingpage-worktrees/milky-play-meal/public/assets/cyberpunk/milky-v4-idle.webp

Use case: identity-preserve. Create ONE standalone full-body transparent dog sprite: the exact happy white Maltese Milky from reference in a natural PLAY BOW, looking at an invisible ball on the floor ahead to her RIGHT. Input1 is the exact character physical scale, fur, lighting and identity reference. Output EXACT1536x1024 RGBA, real transparent background. Keep same-sized torso, head and paws as reference; never normalize pose silhouette height. Right-facing three-quarter SIDE view: hindquarters stay high, both hind paws planted, curled fluffy tail raised; chest lowered toward the floor, elbows bent naturally, two forelegs extended forward on floor. Exactly four anatomically plausible dog limbs, no duplicate paws. Natural playful eager body posture, small open happy mouth, ears falling naturally. Head and muzzle point RIGHT and slightly DOWN toward ball target(1350,930); eyes follow ball, NEVER look toward camera. Maintain a clear profile/three-quarter muzzle rather than front portrait. Ground-contact toes approximately y970, footprint centered aboutx795. Rough layout: hindfoot support nearx360 andx570, near frontpawx1150,y970, far frontpawx1270,y930. Preserve Milky's white clipped body coat, tousled head and short drop ears, compact black nose, curved plume tail, same neutral soft indoor light. Body naturally slopes from raised haunches to lowered shoulders, no rubber deformation. NO ball, bowl, other props, floor, cast shadow, glow, haze, matting, white halo, text or effects. Alpha0 outside fur silhouette with fine antialiasing only. Keep all tail/head/paws inside frame with transparent margins.

### milkyPlayReachResult — initial candidate, later corrected

References: /Users/cillian/Downloads/landingpage-worktrees/milky-play-meal/public/assets/cyberpunk/milky-v4-idle.webp

Use case: identity-preserve. Create ONE standalone full-body transparent dog sprite of this exact Milky playing: STANDING WITH ONE FOREPAW REACHING toward an invisible toy ball ahead to her RIGHT. Use supplied image as exact identity, physical body size, coat, lighting and body registration reference. Output EXACT1536x1024 transparent RGBA. Preserve Milky torso scale/location, white short clipped torso coat, curly plume tail, fluffy head and short drop ears, compact black nose, natural Maltese anatomy. FOUR legs total: both hind paws planted and far frontpaw planted support body near groundy970; lift NEAR front leg and extend that forepaw FORWARD, pawtip around(1330,800), within60px. Paw connects naturally from elbow and shoulder, no detached limb or extra leg. Dog head turns RIGHT and DOWN toward ball target(1380,940), nose naturally addressing it, eyes intent on toy; profile/three-quarter face, NEVER looking at viewer. Cheerful relaxed small mouth; not giant grin. Support footprint centered nearx795, common body physical scale with reference; don't enlarge, compress, or resize silhouette. Soft natural indoor light, consistent white fur texture. Only dog in file: no ball, food, bowl, rug, ground plane or shadow. Real alpha0 outside fur edge, fine fur antialias only, no halo/haze/white outline/checkerboard pixels/text/effects. Whole dog fits within canvas transparent margins, natural weight on three grounded paws, one raised paw.

### milkyEatLiftFinal — selected correction

References: /Users/cillian/.codex/generated_images/01a0f0ae-2647-7893-a6a3-a302744b7169/exec-0f7e8244-8d78-4c3e-acc2-dd435a4539c8.png; /Users/cillian/.codex/generated_images/01a0f0ae-2647-7893-a6a3-a302744b7169/exec-648983ca-a889-4309-925f-b30002d8b716.png

Use case: precise-object-edit, identity-preserve. INPUT1 is edit target, a full-body transparent Milky chewing sprite. INPUT2 is low-eating frame, registration/reference only. Fix ONLY HEAD AND NECK in input1; ALL torso, tail, four legs and planted paws must remain pixel-stable with input1. Keep exact1536x1024 canvas and body physical size. Input1 head is too high and far right. Lower head125pixels and move it100pixels left, adjusting ONLY natural neck angle to connect correctly. REQUIRED black nose/muzzle-tip center near(1315,755), tolerance25pixels, so halfway between eating and raising head. Input2 muzzle(1370,891) shows low eating; corrected pose is only a modest rise from there. The head inclines DOWN-RIGHT toward bowl location(1370,940); face is natural right-facing profile/three-quarter, eyes specifically looking down into bowl, NOT camera. Relaxed nearly closed small chewing mouth. SAME Milky likeness, coat and lighting. Exactly four natural dog legs. Preserve body and paws unchanged, no image recentering or full-image resizing. Only head/neck changed. No bowl/props. REAL TRANSPARENT BACKGROUND, alpha0 outside fur, fur antialias only, no floor/cast shadow/white halo/ambient haze/backdrop/text.

### milkyPlayBowFinal — selected correction

References: /Users/cillian/.codex/generated_images/01a0f0ae-2647-7893-a6a3-a302744b7169/exec-7a3ae455-79fd-4acc-a336-ce0f2125cd09.png

Use case: precise-object-edit, identity-preserve. Supplied1536x1024 transparent Milky play-bow is edit target. KEEP ENTIRE BODY, TAIL, ALL FOUR LEGS/PAWS, torso fur, body size and placement unchanged. Fix ONLY HEAD/NECK/EYES so Milky visibly attends an invisible ball on the floor at(1350,930), not the viewer. Turn head farther to the RIGHT into a natural right-facing SIDE PROFILE, with only the near eye clearly visible. Tilt muzzle DOWN by about30degrees and lower muzzle to about(1320,785). Eye looks DOWN-RIGHT at the ball. Do not retain the camera-facing portrait orientation. Same head size, same Maltese face and ears, compact black nose, small happy mouth with a little pink tongue; not a cartoon grin. Maintain natural neck connection to the lowered chest. Keep beautiful natural play-bow anatomy exactly as supplied, no body deformation. Preserve canvas1536x1024 and ground, no full image shifting or scale change. Do NOT include ball/props. True RGBA transparency alpha0 outside fur, no floor, shadow, haze, halo, outline, effects or text; only fine fur antialias.

### milkyPlayReachFinal — selected correction

References: /Users/cillian/.codex/generated_images/01a0f0ae-2647-7893-a6a3-a302744b7169/exec-2072599a-b288-4d3a-9732-e62e7eeace1e.png

Use case: precise-object-edit, identity-preserve. Supplied1536x1024 transparent Milky reaching-one-paw sprite is edit target. KEEP ALL BODY, TAIL, FOUR LEGS AND PAWS exactly unchanged, including raised near-forepaw and three planted legs, white clipped fur, physical scale/placement. Change ONLY head/neck/eyes: the current face still looks toward camera. Turn head farther RIGHT to natural SIDE PROFILE, show one near eye and largely hide far eye. Angle muzzle downward toward toy ball target(1380,940). Lower the black nose/muzzle tip to approximately(1315,690). The visible eye clearly looks DOWN-RIGHT at the toy, never toward viewer. Same sized happy Maltese head, compact small black nose, white tousled coat, drop ear, relaxed small open mouth and tiny tongue. Natural head-neck connection, no stretched snout/neck, no body deformation. Keep raised paw location intact around(1330,800). Canvas remains1536x1024, no whole-image repositioning or rescaling. No ball, no props in file. True RGBA transparency alpha0 outside fur edge, fine antialias only; no ground, floor, shadow, haze, halo, graphic effects or text.

### Prop: bowl initial; rejected 462px-wide candidate

Source: /Users/cillian/.codex/generated_images/01a0f0ae-ce23-7953-af00-f8b3e8734ac3/exec-006de3f0-c910-4251-8b98-5061fb1ecbfc.png

Use case: product-mockup. Create one production transparent PNG raster cutout for a photo-based 2.5D indoor studio scene: a small dog's simple ceramic food bowl with visible dry kibble inside. Canvas square, preferably 512 by 512 pixels. This is only the bowl, no dog and no other objects. Three-quarter view from a low slightly elevated camera, realistic natural proportions, round elliptical rim, subtly tapered sides and a stable flat base. Quiet warm pale stone color, one solid-color matte ceramic glaze, delicately tactile mineral texture, small natural brown kibble pieces visible only within the bowl. Soft neutral indoor window light from upper left matching a natural photograph of a white fluffy small dog. Genuine photographed material appearance, no cartoon or stylized 3D look. STRICT REGISTRATION: on the 512 square canvas the bowl's outermost width should be approximately 400 pixels, centered horizontally at x=256; the very bottom-center of the ceramic base must be at (256,500), within 12 pixels. Thus leave the large upper part of the canvas truly empty, with the bowl occupying the lower portion. Entire bowl fully in frame. True RGBA transparency everywhere outside the object, including directly beneath its base. No cast shadow, no contact shadow, no floor, no reflection, no ambient haze, no halo, no gradient backdrop, no checkered background, no text, no logos, no watermark. Surface shading belongs inside the bowl only. Deliver a single independent bowl asset.

### Prop: ball selected

Source: /Users/cillian/.codex/generated_images/01a0f0ae-ce23-7953-af00-f8b3e8734ac3/exec-e1a4b50a-ef5b-43fd-9331-c8298b063a82.png

Use case: product-mockup. Create one production transparent PNG raster cutout for a photo-based 2.5D indoor studio scene: one small dog's matte toy ball in a single calm muted dusty sage color. Canvas square, preferably 512 by 512 pixels. The ball should be a naturally round sphere with fine matte felt/rubber surface texture, restrained realistic product-photography appearance, gentle diffuse form shading from soft neutral indoor window light at upper left. No glossy specular highlight, no cartoon or stylized 3D look. STRICT REGISTRATION: on the 512 square canvas draw a circle of approximately 300 pixels diameter, centered precisely at (256,256); leftmost x106, rightmost x406, top y106, bottom at (256,406). This empty transparent margin must remain on every side. Entire ball fully in frame. True RGBA transparency everywhere outside the ball. No seam graphics or panels, no logos, no text, no other objects, no dog, no cast shadow, no contact shadow, no floor, no reflection, no haze, no halo, no gradient background, no checkerboard, no watermark. Surface shading belongs inside the sphere only. Deliver a single independent ball asset.

### Prop: bowl selected, whole-object registration correction

Source: /Users/cillian/.codex/generated_images/01a0f0ae-ce23-7953-af00-f8b3e8734ac3/exec-482eea77-caa2-4e96-b984-58116639a126.png

Reference/edit target: /Users/cillian/.codex/generated_images/01a0f0ae-ce23-7953-af00-f8b3e8734ac3/exec-006de3f0-c910-4251-8b98-5061fb1ecbfc.png

Use case: precise-object-edit. Image 1 is the edit target: the approved photoreal matte pale-stone ceramic dog food bowl with dry kibble. Change ONLY its scale and registration on the transparent square canvas. Preserve this exact bowl shape, material, pale stone color, lighting, kibble contents and camera view. The bowl is currently too wide. Keep the square canvas and scale the WHOLE bowl uniformly down to 86.5% of its current object size, then position it with its bottom-center fixed at 50% canvas width and 97.65% canvas height. Do not crop the transparent canvas. CRITICAL final geometry: object total width 78.125% of canvas width, left edge 10.9375%, right edge89.0625%; bottom of ceramic base at97.65% canvas height. For a1254x1254 canvas: leftmost bowl pixel≈137, rightmost≈1117, bottom-center≈(627,1225); the bowl occupies roughly y630..1225. For its eventual512x512 usage this means bowl width400 and base bottom-center(256,500). Preserve proportions, do not squash or stretch. Maintain true RGBA alpha0 everywhere outside the physical bowl; no cast/contact shadow, floor, reflection, haze, halo, text or logos. Only one bowl.
