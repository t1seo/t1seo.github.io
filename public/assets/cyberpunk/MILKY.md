# Milky — photo-matched companion

Milky is the user's white Maltese. These illustrated derivatives were generated with the built-in `image_gen` tool from four user-supplied photographs, inspected before generation. The original photographs are intentionally **not included** in the repository or public assets.

## Deliverables

| File | Dimensions | Purpose |
| --- | --- | --- |
| `milky-awake.webp` | 1536 × 1024, RGBA | Standing, looking toward the visitor |
| `milky-rest.webp` | 1536 × 1024, RGBA | Relaxed resting pose |
| `milky-walk.webp` | 1881 × 836, RGBA | Six walking frames, three columns × two rows; 627 × 418 per frame |

The small natural eyes, wispy parted fringe, short floppy ears, broad dark nose and trimmed torso are based on Milky's photos. The room illustration is a material/style reference only. These are illustrations, so the resemblance is interpretive rather than an exact photographic reconstruction.

Source identity references: `20190915_153018.JPG`, `20190915_153040.JPG`, `20190904_134104.JPG`, `20191012_173004.JPG`. Style reference: `modern-studio.webp`.

The generated PNGs were converted whole to WebP with `cwebp -q 91` (poses) / `-q 92` (atlas), preserving alpha. No photographs were copied into project assets. Pixel inspection was read-only; no Python image editing was used. The image viewer may show RGB color in fully transparent pixels; actual alpha samples outside the dog are zero.

## Prompt set

### 1. Identity / standing source

Use case: illustration-story. Asset: transparent game character cutout for a premium 2.5D painterly personal website. Images 1–4 are identity references of ONE real white Maltese dog named Milky; image 5 is ONLY the illustration/material style reference. Make a full-body standing Milky facing to the RIGHT in a natural three-quarter side view, his face turned slightly toward viewer so his identity is recognizable. Preserve his distinctive broad black softly triangular nose, modest naturally sized dark eyes partially veiled by wispy fringe, loose center-parted forehead hair, short soft floppy ears, wispy moustache and slight visible dark lower lip. Torso fur trimmed short, legs slim with fluffy paws, compact adult Maltese proportions; NOT generic giant-eyed long-haired puppy. Softly painterly gouache with tactile paper grain and small fur brushstrokes; convincingly lit with neutral cream key and subtle cool shadow so it works in the provided interior. Not photorealistic, not plastic/3D toy. Landscape 1536x1024 canvas, one complete dog centered, entire silhouette including paws and tail visible. Dog occupies 80% canvas width, paws exactly on a horizontal baseline at 90% canvas height; head top about22% canvas height. Face is at right. Genuinely transparent background, no furniture, no collar, no pedestal, no text, no baked floor, no dark silhouette outline, no aura. A faint soft contact shadow below the paws is allowed. High fidelity to the four Milky photos is the priority.

### 2. Refined standing pose (selected)

Use case: identity-preserve. Edit target image1 is Milky illustration. Supporting identity references images2 and3 are the real Milky. Refine and register this production sprite: keep the same facing-right standing pose and painterly texture. Make black nose a little broader to faithfully match real photo, forehead fringe a little more parted and wispy; torso hair SHORT TRIMMED (less puffiness) like real Milky. CRITICAL: eliminate all backdrop, all glowing aura, all rim halo, all gradients outside body. Fully transparent alpha everywhere outside actual dog fur, except tiny subtle grey contact shadow immediately below paws. Scale and place dog completely inside 1536x1024 canvas with bbox x=180..1350, top=150, and LOWEST PAWS baseline y=922 (90%canvas height). This registration is required for a walking game character. Subtle neutral ambient illumination, matte white fur, no amber edge glow. Keep slim legs and adult natural proportions; no enormous eyes; no accessory; no text.

### 3. Resting derivative

Use case: identity-preserve. Image1 is the exact Milky character to preserve: white Maltese with broad black nose, naturally small dark eyes, center-parted wispy fringe, clipped torso coat. Images2 and3 are Milky's real face/body identity. Create matching RESTING pose game sprite: Milky lying comfortably with front paws extended and head up looking gently at viewer, body extends left and face remains on right, like the same standing dog just lay down. Preserve anatomy, scale, fur style, face identity, matte painterly brushwork exactly. 1536x1024 transparent canvas. The dog still spans x180..1350; feet touch y960 (94%canvas), lower torso rests y920, head is lower than standing at y490. Do not enlarge the head relative to standing sprite. No furniture or pillow, no ground or painted background. Alpha outside silhouette MUST be zero; no glow. Dog's eyes are softly relaxed with small black pupils, not gigantic. Same neutral white/grey fur lighting as first reference. One whole dog only, no text.

### 4. Walk-cycle derivative

Use case: identity-preserve. Image1 is the exact Milky character identity and illustration style to preserve. Create a production WALK CYCLE SPRITE ATLAS of this same real white Maltese, walking naturally toward RIGHT, in a three-quarter side view with face slightly turned toward viewer. 6 consecutive frames arranged EXACTLY 3 columns by 2 rows in one 2304x1024 TRANSPARENT canvas. Each equal cell 768x512, NO gap or labels. Reading order left-to-right row1 then row2. Each cell shows ONE complete dog centered identically with paws baseline at 94%of its cell height, dog silhouette occupies x90..675 in EACH cell, body and head scale/position consistent. Six distinct normal walking steps: 1 near front leg forward/far hind forward; 2 those paws contact with weight settling; 3 near front passes beneath chest; 4 opposite front/far hind extend; 5 opposite paws contact; 6 neutral passing before frame1. Four anatomically correct legs, alternating paws, small natural head lift/lower and tail swing. NO jumping, no running, no floating, no static repeated pose. Torso SHORT CLIPPED white coat, wispy face and floppy ears, adult proportions, broad black nose, modest natural dark eyes like firstimage. Gentle painterly paper style, neutral soft light, coherent shadows. Each sprite must stay inside its own cell; no cropping or overlap. Alpha zero everywhere outside dog silhouettes; no background, no floor, no grid, no numbers, no words.

## Integration and movement

`mountCyberPet(host)` expects the host to fill the entire 1672 × 941 room plane. The module positions a small native button, clamps it within the visible cover crop and keeps the paws above the controls. The host must have `pointer-events: none`; the button alone accepts interaction.

- Click or Enter: look up, take a short alternating walk, settle.
- Arrow keys while focused: short bounded movement in the requested direction.
- Walking advances six genuinely different leg poses in proportion to distance travelled, rather than translating a static picture.
- Per-frame CSS registration corrects minor generated atlas offsets without rewriting pixels.
- Hidden documents and inactive scenes cancel timers and animation frames. Reduced motion keeps the response to a still pose.
- Extremely wide cover crops hide Milky when the floor is outside the viewport; resizing to reveal the floor restores him without placing him on the desk.
- The fallback images preserve a petting response if a pose is unavailable; travel is disabled unless the walk atlas loads successfully.

## Checks

- TypeScript and Vite production build: passed.
- `npm test`: thirteen passed at this worker commit, including four new tests for crop/footer containment, furniture bounds, ultrawide floor visibility, and monotonic walking progress.
- All three WebP files inspected as RGBA with non-empty alpha range.
- Atlas inspected as six different leg poses; each equal cell measures 627 × 418.
- Temporary DOM lifecycle harness passed: loaded walking frames advance position, completion settles, hidden/inactive scenes cancel pending work, reduced motion avoids travel, both pose failures hide the control after fallback, and destroy removes listeners/timers/observer work.
- Native Chrome visual verification was attempted after integration, but the computer-use service could not start. Automated Chrome accessibility scans pass; final composed gait and placement still need a native visual pass (see `docs/CYBERPUNK-CHECKS.md`).
