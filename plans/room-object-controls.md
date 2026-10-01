# Scene controls through a clock and calendar

User request: remove the persistent bar, fill the browser viewport with the room, and open scene settings by clicking a clock or calendar in the scene.

## Decisions and checks

- Remove the header, introduction, floating climate text and footer. Make the scene cover the viewport, anchored to its floor so Milky remains visible on wide screens.
- Add a painted electronic desk clock and paper tent calendar. Preserve visible 44px targets when the room is cropped on mobile. The clock shows local time; the calendar shows the actual local date. Both open English scene settings, with time or seasons first respectively.
- Preserve music, Desk close-up, Milky actions, location, Auto, animation and immersion in the dialog. Keep direct object interactions. Preserve the initial scene opener across dialog navigation.
- Check native keyboard activation, Escape/focus restoration, manual season/time/weather, music, monitor/lamp independence, mobile settings access and a wide viewport with Milky.
- Run TypeScript/build, existing tests and official Codex Computer Use QA in Chrome. Record results and commit only task files.

## Added user refinements

- Replace the CSS wall clock/calendar with painted desktop sprites, live digital time and date.
- Replace the dome lamp across all 20 plates with a consistent slim metal light bar; update its glow and weather mask.
- Add irregular painterly building lights and click-triggered coffee/tea steam using the bounded existing compositor.

## Progress

- [x] Inspect scene geometry, existing controls and climate subscription.
- [x] Implement clock/calendar and full-viewport layout.
- [x] Integrate English settings and preserved controls with focus restoration.
- [x] Generate painted desk props and all 20 modern-lamp room plates.
- [x] Integrate city-light and cup-steam interactions and masking.
- [x] Verify final build, 199 tests and settings event integration.
- GUI verification blocked: final Chrome interaction/mobile pass could not be completed because official Computer Use returned inconsistent windows and intermittent ScreenCaptureKit errors. No provider fallback used.
- [x] Commit scoped implementation and artwork.

## Audit findings addressed

The bar reserves real layout space. Removed status nodes need safe replacement. Mobile hides old hotspots, so the new objects must remain available. A centered cover crop would hide Milky's floor, so use bottom alignment. Panel navigation must not replace the saved opener with a detached dialog button.

## Verification evidence

- `npm run build`: TypeScript and production bundle passed.
- `npm test`: 199 passed, 0 failed, including lamp/prop masks and six RoomLife behaviors.
- A temporary happy-dom harness executed the actual entry code with the real climate controller: no toolbar, both settings entry points, manual climate/Auto, panel navigation, original opener restoration, monitor/lamp independence, coffee/tea dispatch, music, Milky action and Immerse/Escape passed. Canvas/audio adapters were stubbed; this does not certify rendered pixels or native browser focus trapping.
- All 20 runtime plates are 1672×941 and match runtime-encoding.json SHA-256. Generated originals, exact prompts and alpha sprites are preserved.
- Milky, red ball, fountain pen, horizontal speaker and preceding source art remain unchanged.
- Official Chrome desktop screenshot confirmed the initial bar-free full-screen composition and visible Milky. User subsequently rejected the CSS wall objects; the replacement painted desk props and final interactions could not receive the final Chrome pass because the official window/capture connection was unstable.
