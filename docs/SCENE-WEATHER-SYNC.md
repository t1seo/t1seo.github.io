# Visible scene seasons and weather clipping

`mountScenePlates(host, onError, onVisibleSeasons?)` reports the distinct seasons of artwork currently mounted in the host. The optional callback preserves the existing two-argument API.

Weather masking must use this visible artwork state: a requested season can differ from the artwork while its image is downloading, decoding, or fading in. In particular, selecting summer must not remove the winter tree mask while winter artwork remains underneath.

## Callback contract

- The initial callback runs synchronously during `mountScenePlates`. Construct the atmosphere controller before mounting the plates.
- Existing layers use a valid `data-season` value, or infer their season from the known `/assets/cyberpunk/climate/{season}-{time}.webp` path. This includes the existing unannotated `summer-night.webp` fallback. Unknown artwork is not assigned a guessed season.
- Successfully decoded images receive `data-season`. After appending the new layer, the callback includes all mounted seasons before the first animation frame.
- During the fade, the union includes outgoing and incoming artwork. After the latest layer's 1100 ms fade delay, old layers are removed and the callback reports the remaining season.
- Superseded retirement timers cannot remove newer layers or publish a reduced union. Multiple overlapping fades can therefore report more than two seasons.
- Failed or stale decodes do not mount artwork or change the union. Failed loads remain retryable.
- Reduced motion reports append and immediate retirement synchronously, without scheduling an animation frame or fade timer.
- Each callback receives a fresh, deduplicated array in DOM layer order. Separate lifecycle events may report the same season list, such as changing the time within one season.
- `destroy()` cancels outstanding animation frames and fade timers and suppresses late decode/error/lifecycle callbacks. Existing artwork is left in place; destruction does not report an empty union.

The main entry can pass `seasons => atmosphere.setVisibleSeasons(seasons)` as the third argument. The scene module does not need to change climate-selection timing or coordinate its animation duration with the atmosphere module.

## Verification

`src/cyber-scene-plates-mount.test.ts` runs the actual mounting controller against a minimal mocked image/DOM and deterministic frame/timer scheduler. It covers initial metadata/source inference, winter-to-summer loading and failed decoding, full fade retirement, summer-to-winter mask activation, overlapping rapid requests and stale decode completion, failed requests during an existing fade, same-season deduplication, reduced motion, destruction with both timer types pending, late decode success/failure, and the optional-callback API.

Checks on this scoped change:

- Scene loader and mount tests: 14 passed.
- Full `npm test`: 85 passed.
- `npm run build`: TypeScript validation and Vite production build passed.
- `git diff --check`: passed.

Native Chrome was unavailable in this environment, so no browser or rendered-pixel verification was performed. These checks establish callback, DOM, decoding, and timer sequencing; integrated visual clipping remains a separate browser check.
