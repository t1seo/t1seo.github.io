# Milky — video-informed illustrated character, v2

## Source and observations

Built-in `image_gen` mode, not the CLI/API fallback. The user's private video `IMG_3720.MOV` was reviewed through its 36-frame contact sheet and six selected frames. Four supplied 2019 photographs supplied close-up facial detail. The video and photos are **not included in public assets**.

The video shows a small adult Maltese with a slightly long compact torso, clipped body fur, wispy forehead and cheek hair, short floppy ears, fine lower legs, small paws, a broad black nose, and a softly raised curved tail. Milky pauses, looks aside, turns toward the camera, lowers the nose to sniff, and approaches at an unhurried pace. This informed the pose selection and low-bounce gait. The rendered likeness is an illustration, not motion capture or a promise of exact reconstruction.

The room-style reference was `modern-studio.webp`: dimensional, matte painterly detail and soft light. No collar, harness, leash, costume, typography, background or props were added. The existing pet assets are preserved as earlier versions.

## Final assets and atlas contract

| Asset | Actual dimensions | Layout | Purpose |
| --- | --- | --- | --- |
| `milky-v2-idle.webp` | 1536 × 1024 | Single 3:2 frame | Standing identity/fallback |
| `milky-v2-behavior.webp` | 1881 × 836 | 3 columns × 2 rows; 627 × 418 cells | Neutral, look away, look toward viewer, tilt, sniff, half blink |
| `milky-v2-walk.webp` | 2172 × 724 | 4 columns × 2 rows; 543 × 362 cells | Right-facing shallow-three-quarter gait, eight phases |
| `milky-v2-frontwalk.webp` | 2172 × 724 | 4 columns × 2 rows; 543 × 362 cells | Toward-camera gait, eight phases |

Read row-major. All final files are RGBA WebP converted with `cwebp -q 92 -alpha_q 100`. Whole-image encoding only; no manually painted, cut-out, resized, relabeled, or composited frame art.

The generator preserved the requested atlas/cell proportions but chose a lower output resolution than the prompt requested. Generative per-frame registration is imperfect: **the runtime must align ground and torso anchors per frame**. Do not animate these sheets as uncorrected background-position strips. Use behavior frame 0 as the neutral state to avoid a discontinuity with the stand-alone identity asset.

Alpha ≥ 128 bounds in local-cell pixels, `[left, top, right, bottom]`:

- Idle: `[273,58,1343,984]`
- Behavior: `[[148,78,558,402],[133,80,509,402],[128,68,525,403],[151,42,553,374],[127,71,576,374],[130,49,530,375]]`
- Side walk: `[[91,76,448,336],[102,76,469,330],[109,76,468,334],[102,76,470,332],[90,57,453,313],[106,58,476,312],[90,58,467,312],[100,58,474,313]]`
- Front walk: `[[229,59,447,333],[194,58,414,333],[159,59,379,333],[158,59,379,333],[226,33,450,301],[193,33,415,299],[163,34,385,298],[158,32,379,300]]`

## Artifact lineage

All generated source PNGs remain in:
`/Users/cillian/.codex/generated_images/01a0efdb-ab22-7eb0-a6a5-3b6d6fec6590/`

| Stage | Source PNG |
| --- | --- |
| Initial identity | `exec-3fa207c8-f3d6-4e44-a849-0714df7d51aa.png` |
| Final identity | `exec-0a19a34d-aee6-4a9f-89eb-8f83d0a51ca8.png` |
| Initial behavior | `exec-bcda2126-dc1e-49f0-b0e3-5cbb7de20746.png` |
| Final behavior with additional padding | `exec-b5ceccad-fe6d-4409-a0f0-f6c43885384e.png` |
| Initial side gait | `exec-020ff91e-7404-4924-bc9b-726254efdfc3.png` |
| Final side gait with additional padding | `exec-792a4b86-d3cc-4a26-a095-e4b1d8193fb1.png` |
| Initial front gait | `exec-d6e464b4-1ad9-413d-8804-b6b7d1d2f8df.png` |
| Final front gait with additional padding | `exec-36e07588-a986-43b3-88b2-d47e4d1229b4.png` |

Final selected derivatives are saved beside this document, so application operation does not depend on the Codex-generated-images directory.

## Exact prompts

### Initial identity

Use case: identity-preserve and stylized-concept. Asset: a beautiful hand-painted 2.5D game character of the user's real dog Milky for a premium tactile illustrated apartment, genuine transparent RGBA background. Reference images 1,2 are VIDEO FRAMES: reference for adult dog's real standing proportions, slightly long small torso, thin legs, floppy short ears, lifted curved tail. Reference images 3,4 are real photographs: preserve Milky's recognizable face, broad heart-triangle black nose, naturally modest dark almond eyes partly tucked under wispy brow, slightly asymmetric fringed forelock, little wispy muzzle moustache and dark lower lip. Reference 5 is ROOM STYLE only: painterly gouache/oil-like dimensional illustration on paper, muted realistic colors and matte light, NOT a photo or glossy CGI.
Create ONE full body neutral STANDING Milky, body facing RIGHT in shallow three quarter view with head gently looking toward viewer. Adult compact white Maltese, natural anatomy, four slender short legs with softly tufted paws, trimmed short white body hair with longer wisps on face and ears, tail softly curled over rump with modest feathery tuft (not giant pompom). The head is realistic adult sized, not a huge puppy head. Calm and curious, mouth closed with just a small dark lip, no tongue. Fine expressive brushwork within white fur shapes, soft warm ivory highlights and cool blue-gray shadows, rich detailed silhouette but no hairy photoreal cutout and no sticker stroke.
Canvas EXACT 1536x1024, full dog fits inside the canvas with about 10% clear left/right margin, head and tail do not touch top. Paw baseline y=940 (92% height), central body x=50%, height approximately 80% canvas. Neutral soft studio light, no strong rim glow, no cast shadow: shadows will be coded in the scene. GENUINELY TRANSPARENT empty background, not white or checkerboard. No leash, harness, floor, text, labels, clothes, toys or decoration. Only one Milky.

### Identity refinement

Use case: precise-object-edit / identity-preserve. Edit image1 the generated standing Milky. Image2 and image3 are VIDEO identity/body references. KEEP entire dog pose facing right shallow 3/4, exact same composition, size, paw baseline, painterly dimensional paper illustration, small adult dog identity. Refine only three things: (1) DELETE ALL of the broad opaque/partly transparent cream halo that surrounds the dog. Genuinely transparent RGBA background extending right up to fine fur silhouette, NO glow, NO broad blurred edge, NO shadow, NO white matting, NO checkerboard. (2) Body coat noticeably shorter and less voluminous, thin delicate adult legs with small paws like video. Keep cheek/ear wisps; not fluffy teddy bear. (3) natural dark eyes slightly smaller and less shiny, broad black nose not plastic shiny. Adult Maltese not baby puppy. Beautiful quiet detailed hand-painted gouache on paper with subtle brushwork. Do not change pose, ear placement, curled tail, or total dog silhouette bounds more than needed to reduce puffiness. Image size1536x1024. Only ONE dog and no props or collars.

### behavior — original atlas

Use case: identity-preserve. Production game sprite atlas on GENUINE TRANSPARENT RGBA background. Image1 is the MASTER MODEL of real dog Milky; reproduce exactly this same adult Maltese identity, matte tactile gouache paper style, fine white fur, small adult dark eyes, broad black nose, short floppy wispy ears, natural slender legs with small paws, short trimmed body coat and modest curved feathery tail. Images2 and3 are real Milky VIDEO movement references only. No leash, harness, props, floor, shadows, white background, checkerboard, labels, grid lines or text. No glow or broad semi-transparent fringe. Edges must be tightly transparent around fur. Use same subject scale, lighting, camera and position in EACH grid cell, preserve head dimensions. Paw ground line y=94% of each cell, body centered. Full subject has clear margins; never crop any paws, head or tail. OUTPUT: exactly SIX standing behavior poses, THREE columns by TWO rows on 2304x1024 canvas, each cell 768x512. Every pose has the exact same body and PAW locations as master (downscaled50%), facing RIGHT shallow three-quarter. Change only neck/head/ears and slight tail position. Row-major: frame1 neutral standing head gently toward viewer (identical master); frame2 dog looks toward LEFT/away over shoulder, neck turns naturally but torso/paws fixed; frame3 looks back toward viewer, curious; frame4 small head tilt about10 degrees; frame5 lowers neck and nose toward floor to sniff, front legs STAY where they are (don't grow or add legs), rear body stays same; frame6 head returns to original neutral with gentle half blink. ALL dog body centers x=50%, same shoulders/torso, same tail size, NO vertical shifts or changes in dog size. Same full-body standing in all6. Distinct natural head poses. This is six frames of ONE Milky, not6different dogs. Do not enlarge any cell's head.

### behavior — padding and registration refinement

Edit the supplied transparent sprite sheet for production registration. Preserve EVERY existing Milky pose, white painterly fur, face identity, correct anatomy, all 6 distinct frames, the 3columns × 2rows grid, transparent background. Fix only padding and registration. Imagine exactly equal rectangular cells each with aspect3:2. SHRINK EACH individual dog uniformly to 82% of its current size WITHIN ITS OWN CELL, leaving generous empty transparent margins. Put every dog's TORSO at EXACTLY THE SAME HORIZONTAL CELL CENTER 50%, paws ground baseline87% of cellheight, ears/tail must be lower than8% top. No portion of any dog may touch a cellborder. The sniff pose may extend head forward but keep hips exactly same as otherbehaviorcells. All8walk phases must stay distinct. For frontwalk same standing shoulder-height for all8 and no drifting sideways acrosscells; forsidewalk shoulderheightconstant without bodybouncing. Do NOT add any background, shadow, glow, decoration, labels, numbers or grid. True alpha directly around precise silhouette without color fringes. Output exactly 2304x1024 pixels.  Same artwork, professionally spaced registered atlas.

### walk — original atlas

Use case: identity-preserve. Production game sprite atlas on GENUINE TRANSPARENT RGBA background. Image1 is the MASTER MODEL of real dog Milky; reproduce exactly this same adult Maltese identity, matte tactile gouache paper style, fine white fur, small adult dark eyes, broad black nose, short floppy wispy ears, natural slender legs with small paws, short trimmed body coat and modest curved feathery tail. Images2 and3 are real Milky VIDEO movement references only. No leash, harness, props, floor, shadows, white background, checkerboard, labels, grid lines or text. No glow or broad semi-transparent fringe. Edges must be tightly transparent around fur. Use same subject scale, lighting, camera and position in EACH grid cell, preserve head dimensions. Paw ground line y=94% of each cell, body centered. Full subject has clear margins; never crop any paws, head or tail. OUTPUT: EIGHT frame side-walk-cycle animation sheet, exactly FOUR columns by TWO rows on 3072x1024canvas; each cell768x512. Same Milky walks toward RIGHT, shallow THREE-QUARTER right body orientation same as master, head slightly toward viewer. Each frame is the next eighth of one smooth unhurried four-legged walking cycle (notrunning,notjumping). Distinct plausible phases:1nearfront contact forward/farfront back with opposite rear foot contact;2weighttransfer+farrear lift;3nearfront stance+farfront midswing+nearrear lift;4farfront reachesforward+nearrear midswing;5opposite contact (farfront forward/nearfront back);6opposite weighttransfer+nearrear lift;7farfront stance+nearfront midswing+farrear lift;8nearfront reachesforward+farrear midswing returningto1. ALL FOUR LEGS must distinctly articulate and alternate supported paw plants and recovery, correct canine joint anatomy. Rear legs must NOT stay fixed. Spine/shoulder height constant±1% cell, NO whole dog position or scale jitter, no jumping, no sliding clone. Subtle tail sway and ear swing only. Dog head size and torso width same as master scaled50%; subject approximate horizontalspan15%–90%cell, pawground94%. Legs can cross in projection but total exactlyfour no extra feet. Render8distinct continuous believable keyframes, not repeatedstandingposes.

### walk — padding and registration refinement

Edit the supplied transparent sprite sheet for production registration. Preserve EVERY existing Milky pose, white painterly fur, face identity, correct anatomy, all 8 distinct frames, the 4columns × 2rows grid, transparent background. Fix only padding and registration. Imagine exactly equal rectangular cells each with aspect3:2. SHRINK EACH individual dog uniformly to 82% of its current size WITHIN ITS OWN CELL, leaving generous empty transparent margins. Put every dog's TORSO at EXACTLY THE SAME HORIZONTAL CELL CENTER 50%, paws ground baseline87% of cellheight, ears/tail must be lower than8% top. No portion of any dog may touch a cellborder. The sniff pose may extend head forward but keep hips exactly same as otherbehaviorcells. All8walk phases must stay distinct. For frontwalk same standing shoulder-height for all8 and no drifting sideways acrosscells; forsidewalk shoulderheightconstant without bodybouncing. Do NOT add any background, shadow, glow, decoration, labels, numbers or grid. True alpha directly around precise silhouette without color fringes. Output exactly 3072x1024 pixels.  Same artwork, professionally spaced registered atlas.

### frontwalk — original atlas

Use case: identity-preserve. Production game sprite atlas on GENUINE TRANSPARENT RGBA background. Image1 is the MASTER MODEL of real dog Milky; reproduce exactly this same adult Maltese identity, matte tactile gouache paper style, fine white fur, small adult dark eyes, broad black nose, short floppy wispy ears, natural slender legs with small paws, short trimmed body coat and modest curved feathery tail. Images2 and3 are real Milky VIDEO movement references only. No leash, harness, props, floor, shadows, white background, checkerboard, labels, grid lines or text. No glow or broad semi-transparent fringe. Edges must be tightly transparent around fur. Use same subject scale, lighting, camera and position in EACH grid cell, preserve head dimensions. Paw ground line y=94% of each cell, body centered. Full subject has clear margins; never crop any paws, head or tail. OUTPUT: EIGHT frame FRONT APPROACH walk-cycle animation sheet, exactly FOUR columns by TWO rows on3072x1024canvas eachcell768x512. Same Milky now walks straight toward camera, subtly3/4frontal like real video Image3. Walking IN PLACE, camera fixed; runtime movesdog. Preserve SAME HEAD PIXEL SIZE and SHOULDER HEIGHT as master scaled50%, do NOT enlarge front-facingdog to fill width. Eachfrontal dog narrow approximately38%–43%cellwide, CENTER at50%horizontal, topofhead8% and pawground94%; bodydepth foreshortened, tail visible behindrump. EIGHT distinct consecutive phases of one real gentle curious walkingcycle: nearfrontpaw forwardcontact, plantweight+farfrontlift, farfrontswing, farfrontreach, oppositefrontcontact, plantweight+nearfrontlift, nearfrontswing, nearfrontreach. Hindlegs alternate supportingbehind and advance realistically, allfourlegsanatomy. Keep head steady with tiny realistic gait movement, earssoftly sway, tailcurledupright. No identical repeatedposes, no stretching or missinglimbs, no changingface. Calm mature Milky looking towardviewer. Whitewispyheadfur partially covers naturalsmalldarkeyes. Sameperspective inall8frames.

### frontwalk — padding and registration refinement

Edit the supplied transparent sprite sheet for production registration. Preserve EVERY existing Milky pose, white painterly fur, face identity, correct anatomy, all 8 distinct frames, the 4columns × 2rows grid, transparent background. Fix only padding and registration. Imagine exactly equal rectangular cells each with aspect3:2. SHRINK EACH individual dog uniformly to 82% of its current size WITHIN ITS OWN CELL, leaving generous empty transparent margins. Put every dog's TORSO at EXACTLY THE SAME HORIZONTAL CELL CENTER 50%, paws ground baseline87% of cellheight, ears/tail must be lower than8% top. No portion of any dog may touch a cellborder. The sniff pose may extend head forward but keep hips exactly same as otherbehaviorcells. All8walk phases must stay distinct. For frontwalk same standing shoulder-height for all8 and no drifting sideways acrosscells; forsidewalk shoulderheightconstant without bodybouncing. Do NOT add any background, shadow, glow, decoration, labels, numbers or grid. True alpha directly around precise silhouette without color fringes. Output exactly 3072x1024 pixels. IMPORTANT all8front-facingdogs must be centered in THEIR OWN CELL, narrow silhouettes preserve sameheadsizeassidewalk, and paws notcutoff. Same artwork, professionally spaced registered atlas.

## Checks and limits

- Visually inspected four real photos, six selected video frames, the 36-frame contact sheet, original pet and room art, the identity render and all generated atlas candidates.
- Rejected the first atlas candidates because paws or noses approached cell boundaries; regenerated all three with more transparent padding.
- Inspected all final poses for full-frame containment, four-leg anatomy, identity consistency, differing gait phases and the behavioral head movements.
- Programmatically checked image modes, dimensions, per-cell nontransparent bounds, and WebP decoding.
- No alpha ≥ 128 dog silhouette touches a final atlas cell boundary.
- There is natural generative variation in drawing and pose scale. Per-frame alignment and live browser playback are integration responsibilities; atlas files alone do not guarantee smooth motion.

