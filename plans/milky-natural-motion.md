# Milky — natural walking and a small bed hop

The user requests more natural movement, especially walking and a small jump into the dog bed. Preserve the existing Milky likeness, every raster frame, room art, bed contact at (1440, 865), and the front-lip mask.

## Grounded decisions

- Existing walking is already distance-linked. Its 17%-of-route acceleration makes long routes hold early and late leg poses too long. Cap each smoothstep speed ramp at 240 ms, retain stride and continuous phase, and preserve forward gaze at walking joins.
- Do not translate individual frames to align noses, crossfade legs, squash the silhouette, or add whole-body bob. Existing body and paw registration is authoritative.
- Walk to a short approach before the cushion. Use a 180 ms preparation, a low 480 ms hop using the already decoded trot contact/suspension frames, then a 160 ms grounded landing before settling through available rest poses.
- Hop height is approximately 12% of visible body width; movement advances only the figure above a separately grounded shadow. The original four-frame trot set must be wholly decoded or the final approach falls back to walking.
- Use the existing shared RAF and action cancellation. Hidden, inactive, still, reduced-motion, resize, replacement action, and destroy remove airborne lift and obsolete callbacks. Interrupted visits remain at the current ground point and can return home visibly.

The read-only motion audit confirmed the long ramp, arrival gaze change, bed-route bounds bypass, and breathing-transform conflict. These constraints are incorporated. The user already authorized implementation and deployment, so this plan is executed without another approval gate.

## Execution and verification

1. Add failing pure motion tests for bounded ramps and the finite hop envelope, plus mounted-controller tests for approach, true airborne frames, landing, and lifecycle cancellation.
2. Implement the small sampler in a dedicated module, integrate it into the existing RAF, and split bed arrival into approach/hop/rest. Keep archived rooms without a bed unchanged.
3. Run all `src/cyber-pet*.test.ts`, TypeScript checking, and the full site suite. Inspect the scoped diff to prove no raster changes.
4. Root uses official Codex Computer Use with Chrome to inspect normal walking, turn, bed takeoff/apex/front-lip landing, and still/panel interruption. Desktop and cropped mobile behavior must remain usable.

## Acceptance

- Walking cruise is reached within 240 ms even on long bed routes; endpoints remain exact and same-heading retargets keep speed and phase.
- Bed entry has a visible low finite hop; all four existing trot assets are used atomically, with no new image requests or authored likeness changes.
- The shadow remains at the ground point and becomes slightly smaller/lighter in the air. Landing returns lift to zero and reaches the exact existing cushion anchor.
- No hidden, inactive, still, or reduced-motion hop runs; cancellation cannot strand an airborne pose or later start an obsolete sleep sequence.
- Root records actual Chrome evidence and deploys the integrated result after scoped commit.

## Implementation checks

- Added and observed failing tests for the long-route ramp, hop sequence, and turn gaze before their behavior changes; each passes after implementation.
- `node --experimental-strip-types --test src/cyber-pet*.test.ts`: 155 passing, including 17 mounted hop scenarios and archived-room regressions.
- `npm test`: 447 passing on the integrated working tree. Log: `/tmp/t1seo-milky-natural-full-tests.log`.
- `npx tsc --noEmit` and scoped `git diff --check`: passed.
- Independent read-only motion and lifecycle audits found no blocking issue. Real Chrome visual QA remains assigned to root; this file does not claim that it has passed.
- No character raster, room plate, pet dimensions, sound behavior, or additional dependency changed. The generic skill AST checker could not resolve its external `typescript` import against this native TypeScript 7 installation; compiler checking and focused diff review passed.

## Rendered integration check

Root verified walking, takeoff, a low airborne hop and settled sleep in actual Chrome through official Codex Computer Use. The initial sequence revealed the duplicated front cushion masking the approaching torso before takeoff. Its visibility now follows `data-bed=true`, with the complete bed still visible underneath. The repeated sequence passes; the motion owner separately reviewed occupancy changes during landing, cancellation and leaving. Evidence: `plans/evidence/milky-natural-motion-20261002.json`.
