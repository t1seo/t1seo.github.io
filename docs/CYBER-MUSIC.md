# Climate music and physical sounds

The speaker plays real, full-length instrumental recordings already distributed
with this project in `public/assets/music`. Nothing plays or downloads until the
visitor explicitly enables Music. The initial volume is deliberately quiet.

## Selection

`src/cyber-music-catalog.ts` contains a deterministic programme for all 100
combinations of four seasons, five times, and five weather choices. It uses the
20 existing recordings by Kevin MacLeod and Scott Buckley; these are 100 context
selections, not 100 unique compositions. Clear weather follows the original
season/time selection, rain and mist favour quieter piano/ambient pieces, and
winter keeps the five Christmas/winter recordings. Changing weather at any fixed
season/time changes the actual recording. Changing season at any fixed
weather/time also changes the actual recording. All five times select different
recordings at any fixed season/weather.

There is no random reroll during rendering, clock refresh, or a repeated climate
selection. Importing the catalogue makes no media request.

## Playback contract

```ts
const sound = createCyberSound({
  onTrackChange(state) {
    // state = { track, enabled, playing, loading, error }
  },
});
sound.setClimate({ season: 'winter', time: 'night', weather: 'snow' });
await sound.setEnabled(true); // Call from the speaker/Music button click.
sound.isEnabled(); // Accepted user choice; true during a hidden-tab pause.
sound.getCurrentTrack(); // Selected credited track, even while Music is off.
await sound.playBowl(); // Call directly from a singing-bowl click.
await sound.playCup(); // Call directly from a cup click.
sound.destroy();
```

The same playback state is also emitted as a `cyber:track` CustomEvent on
`document`. Consumers should choose either the callback or the event to avoid
duplicate announcements. No initial event is emitted during construction;
`setClimate` publishes the initial selection without playing it. `error` is null
or an English message suitable for an accessible status region.

A new climate recording starts through a 1.35-second gain crossfade. Only the
selected recording is requested; there is no upfront download of the whole
62 MB library. Superseded pending loads are aborted, old decks are released after
the fade, and obsolete play/reject promises cannot override the newest selection.
Recordings loop at their native full-song boundary. The two music decks share one
AudioContext with physical effects. Rain adds a very quiet filtered sound bed.

Hidden tabs pause the recording and suspend the context. Returning resumes only
when the visitor had already enabled Music. A load or playback failure turns
Music off, emits an error, and allows a fresh user-gesture retry. Music off fades
music and rain; a deliberately struck bowl/cup may finish its existing resonance.
No sound preference is persisted across visits.

## Singing bowl and cup

These effects are synthesized locally with Web Audio and require no recordings
or extra license. The bowl uses five softly struck, inharmonic partials (including
a close pair for gentle acoustic beating), decaying over 8.2 seconds. The cup uses
three higher ceramic partials and ends in 0.62 seconds. At most two resonances ring
simultaneously. They never turn Music on. Hiding the page or destroying the
controller stops and disconnects them.

These are sound approximations, not recordings of a specific physical instrument.

## Attribution

The existing attribution bundle is reused unchanged:

- [Music credits](../public/assets/music/CREDITS.html)
- [Text credits](../public/assets/music/CREDITS.txt)
- [Source manifest, encoding, hashes and original URLs](../public/assets/music/SOURCES.json)
- [Bundled CC BY 4.0 license](../public/assets/music/CC-BY-4.0.txt)

Expose `/assets/music/CREDITS.html` from the room and show the playing track's title
and artist. Every record carries `sourceUrl`, `artistUrl`, and `licenseUrl` for
accessible linked credits. Existing recordings were loudness-normalized and
encoded as 112 kbps stereo MP3; full compositions were retained. This change does
not modify the audio files. Reusing the music does not imply artist endorsement.

The source manifest was retrieved on 2026-09-29. On 2026-09-30 the existing local
manifest/credit bundle was checked, all 20 files' sizes/codecs/durations were
verified, and the official [CC BY 4.0 deed](https://creativecommons.org/licenses/by/4.0/)
was reopened. Direct requests to the individual composer pages were blocked by
the browsing tool, so this update relies on the bundled original provenance for
those individual grants rather than claiming a fresh full source audit.

## Checks and limits

- `npm test`: 40 tests passed, including 4 catalogue tests and 11 mocked audio
  lifecycle tests in this change.
- `npm run build`: TypeScript and Vite passed.
- `ffprobe`: all 20 local files report MP3 and durations matching `SOURCES.json`.
- Lifecycle checks cover lazy initialization, weather changes/crossfades, off
  during pending playback, stale rejected loads, hidden-tab resume, failed-play
  retry, isolated physical effects, destruction during a pending request, late
  AudioContext resumes after hiding, and an old song failing during replacement.
- The unit harness does not decode browser audio or prove audible loudness; the
  integrated Chrome preview still needs a real speaker/bowl/cup listening check.
