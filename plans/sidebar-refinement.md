# Seoul Studio sidebar refinement

## Outcome
Refine every active Seoul Studio panel into one restrained, warm charcoal drawer. Preserve all room art, public guestbook boundaries, private memo/presets, sound, focus timer and object interactions. This is an authorized implementation and deployment request; root owns publication.

## Decisions
- Desktop: inset 520px drawer, compact room identity, close control and five destinations. Mobile: viewport drawer with safe-area spacing, intentional horizontal navigation and at least 300px guestbook content at 320px.
- Scroll only the content; persistent header and a compact music/Immerse footer remain reachable. Full volume controls appear only in Atmosphere but remain mounted to preserve their state.
- Use the existing locally hosted Cormorant face for compact headings, warm ivory text, subtle material surfaces and 44px controls. No new fonts, dependencies, effects or room imagery.
- Condense long descriptive copy and group related Desk/Milky actions. Preserve clear public/private messaging and permission explanations beside relevant actions.
- Memo maps to Desk navigation. Focus the panel heading on entry, restore the original room opener on close and reset the content scroll between panels.

## Work and verification
1. Shared drawer markup, navigation and scroll ownership: `penthouse-room-markup.ts`, `penthouse-main.ts`, `penthouse-panels.css`, `penthouse.css`. Verify native dialog keyboard close/focus, content scroll reset, all five destinations and mobile width.
2. Atmosphere, Desk, Milky and About markup: `penthouse-panel-markup.ts`. Verify all climate controls, workspace toggles, pet actions and previews remain connected.
3. Private note, focus, presets and mixer presentation: `penthouse-personal-markup.ts`, `penthouse-personal.css`. Run existing real DOM private-tool regression scenarios and retain storage keys unchanged.
4. Guestbook markup and styles: delegated worker owns only `penthouse-guestbook-markup.ts` and `penthouse-guestbook.css`. Preserve selectors and asynchronous lifecycle; run guestbook and root DOM regressions.
5. Build/type check and existing tests; root verifies actual Chrome rendering using official Codex Computer Use, including small/mobile window, writing form, keyboard, narrow Turnstile container and long Atmosphere navigation.

## Gap audit incorporated
Read-only audit highlighted mixer initialization, required playback hooks, inner-scroll reset, Memo active navigation, 300px Turnstile minimum width, lazy guestbook focus, CSS load order, short-height and overflow checks. Keeping the mixer mounted avoids losing its displayed state. Existing private/public behavior harnesses cover runtime preservation; visual approval requires Chrome evidence.

## Completion
Scoped commits with build/test evidence; root integrates and deploys. No backend, scene plates, Milky art, private-storage key, autoplay or account configuration changes are in this design scope.
