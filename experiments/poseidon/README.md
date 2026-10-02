# Taewon Seo — Whitecaps

An isolated personal-site prototype built on [Poseidon](https://github.com/owenyuwono/poseidon). The landing page places the name in the sky above an interactive FFT ocean. It does not change the main site's room or Milky assets.

## Local preview

With the root repository's dependencies installed, run:

```sh
cd experiments/poseidon
npm ci
npm run dev
```

- <http://127.0.0.1:5174/> — personal Whitecaps page
- <http://127.0.0.1:5174/sun-glitter/> — Sun glitter study
- <http://127.0.0.1:5174/whitecaps/> — Whitecaps study with adjustments

The experiment pins Three.js 0.184.0 for compatibility with the upstream shaders and uses the root Vite installation. WebGPU and graphics acceleration are required; unsupported devices receive an explanatory message. This prototype has not been deployed.

## Interaction

Drag or swipe the ocean to look around. With the ocean focused, use W/A/S/D to move, Q/E for height, and Shift for faster travel. Scrolling changes travel speed. The circular arrow restores the initial view.

The lower-right speaker starts **Reverie by Scott Buckley** after a user gesture, with a gentle fade to 28% volume. It loops locally and keeps playing when the ocean is paused or the tab is hidden. No audio autoplays. The adjacent motion button pauses the waves; reduced-motion preferences start them paused. Hidden tabs stop ocean rendering.

## Checks

```sh
npm test
npm run build
```

The six soundtrack tests cover playback, fading, competing playback requests, failure recovery and cleanup. The ocean also runs an FFT self-test before revealing its first frame. Orca browser observations and a screenshot are retained in `evidence/`; these are local observations, not a cross-device performance guarantee.

## Sources and licenses

- Poseidon by owenyuwono, MIT, revision `671053b812fcbffe8ecc4668eaa6ab7ffeb63287`. The ocean modules are preserved except for the two local panorama paths in `params.js`.
- Original FFT work: gasgiant/FFT-Ocean, MIT.
- [Skybox 131](https://freestylized.com/skybox/sky_131/) by FreeStylized. The provider describes royalty-free commercial/noncommercial use; upstream describes its custom license as CC0. The provider's sky includes generative artwork and painting.
- [Reverie](https://www.scottbuckley.com.au/library/reverie/) by Scott Buckley, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The complete, normalized 112 kbps MP3 is reused from this repository's licensed music assets. Attribution is available through the page's information control.
- Cormorant Garamond by the Cormorant Project Authors, SIL Open Font License 1.1.

License copies are kept in `assets/`, `vendor/` and `public/third-party.txt`. Exact source and asset hashes are recorded in `provenance.json`.
