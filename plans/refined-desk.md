# Refined desk — 2026-10-01

Latest user direction overrides the earlier monitor gesture-only and short lamp instructions.

## Outcome

- Monitor starts on with a completed editor; toggling off/on can replay the typing interaction.
- Smaller newly painted speaker remains left of the monitor.
- A taller sculptural graphite/champagne desk lamp moves right. Its top reaches above the monitor top; preserve the lounge floor lamp.
- Improve the bronze singing bowl immediately right of the fountain pen. Place the painted digital clock between the bowl and the new lamp.
- Clicking the singing bowl creates a quiet finite resonance animation and a soft synthesized bell sound. Keyboard activation and a Desk-panel control provide equivalent access.
- Preserve the room style, all seasons/times, Milky, coffee/tea, music, motion settings and previous performance fixes.

## Implementation

1. Preserve baseline `95bff44` on `backup/seoul-before-refined-desk-20261001`.
2. Generate and inspect one noon master with only lamp/bowl edited, plus a separate small speaker sprite. Use built-in imagegen and save exact prompts.
3. Apply approved lamp/bowl placement to all twenty registered 1672×941 season/time plates. Preserve prior paintings and normalize runtime WebP dimensions.
4. Integrate source-space geometry: clock target [1125,531,62,30], bowl center [1082,545], speaker target [718,522,66,38], lamp target top394/base565 at the right desk. Refine from inspected art; align hotspots, weather masks, lighting and Desk close-up.
5. Cache the completed monitor screen; keep the existing single bounded compositor and cached object/city lighting. Integrate bounded bowl visuals and gesture-only sound; clean up sound nodes on teardown.
6. Keep clock physically between bowl/lamp in portrait crops. Remove the unrelated portrait clock relocation, keep cropped controls inert, and retain visible calendar/Desk access and valid focus restoration.

## Verification

- Unit/integration regressions: initial monitor on without permanent clear-day RAF; explicit replay; cache invalidation; bowl expiration/repeated activation/still mode/audio cleanup; relocated glass masks; settings accessibility.
- Strict TypeScript, full test suite and production build.
- Inspect actual generated master and all season/time plates; compare composition and lamp height/position. Verify runtime source dimensions and transparent speaker.
- Use Chrome via official Codex Computer Use only for room and Desk controls at desktop/portrait. Report any provider limitation accurately; no alternate GUI provider.
- Commit scoped changes, integrate workers, deploy under existing authorization, and verify published bundle/asset hashes.

## Ownership

- Root: main/scene integration, CSS/time objects, object registry, masks, documentation, final QA/deploy.
- small_speaker_art: new speaker source/runtime asset only.
- refined_desk_master: edited noon master and prompt only; remaining seasons assigned after approval.
- bowl_interaction: new bowl simulation/audio module and tests.
- monitor_rendering: effects/monitor cache and atmosphere tests.

## Added user directions during implementation

- Replace the lounge side-table tea cup with an amber reed diffuser; click for a quiet fragrance animation.
- Make the existing lounge floor lamp independently switchable. All source plates keep it off; a cached warm overlay supplies the on state without warming the entire room.
- Add a cream fluffy donut dog bed based on the supplied photograph in the right floor corner. Preserve Milky art; occasionally walk to the bed and sleep there. A cropped bed must never send Milky offscreen. Bed sprite and optional pet controller integration are separate from room plate edits.
- Approved desk master: lamp foot x1208..1262/y552..567, upright1235..1240/y449..557, topjoint1168/y402, shade1130..1178/y401..439; bronze bowl1058..1099/y535..562; diffuser bottle108..138/y623..663 with reeds106..140/y580..633.

- Latest refinement: premium petite speaker finishing and calendar immediately left of monitor [785,510.5,38,48.5]. User accepted the current lamp design; no further lamp redesign. Remove object hover captions and plus badges while retaining accessible names and keyboard focus.
