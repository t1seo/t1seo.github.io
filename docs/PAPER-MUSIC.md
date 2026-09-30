# Paper studio: recorded music for 20 scenes

Verified and downloaded 2026-09-29. This module replaces the procedural radio
sound at integration time; `paper-audio.ts` is preserved unchanged.

## Selection

Twenty **different, full-length, artist-made recordings**, one per season and
time of day. The same recording is not reused for multiple scene keys.
Descriptions and scene choices use the composers' official descriptions; no
claim of manual listening or browser audio QA is made by this asset task.

| Season | Morning | Noon | Afternoon | Evening | Night |
| --- | --- | --- | --- | --- | --- |
| Spring | [Cherry Blossom](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100382) | [Easy Lemon](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200076) | [Childhood](https://www.scottbuckley.com.au/library/childhood/) | [Water Lily](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400035) | [Reverie](https://www.scottbuckley.com.au/library/reverie/) |
| Summer | [Laid Back Guitars](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100181) | [Bossa Antigua](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700069) | [Carefree](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037) | [Moonlight](https://www.scottbuckley.com.au/library/moonlight/) | [Sleep (Piano Only)](https://www.scottbuckley.com.au/library/sleep/) |
| Autumn | [A Kind of Hope](https://www.scottbuckley.com.au/library/a-kind-of-hope/) | [Lobby Time](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600054) | [George Street Shuffle](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300035) | [Solace](https://www.scottbuckley.com.au/library/solace/) | [Hiraeth](https://www.scottbuckley.com.au/library/hiraeth/) |
| Winter | [Winter Chimes](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100009) | [Nouvelle Noel](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700072) | [Deck the Halls A](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100263) | [It Came Upon a Midnight Clear](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100191) | [Silent Night](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100075) |

Spring starts with light marimba and warm guitar, then becomes quieter. Summer
uses relaxed guitar, bossa nova and ukulele before piano-led evening music.
Autumn pairs daytime jazz with reflective piano and ambient textures. Winter
has a piano morning plus four Christmas arrangements, including a gentle solo
piano `Silent Night` for the final slot. Scott Buckley's `Sleep` uses the
composer's official piano-only mix. No orchestral remixes are included.

## Rights and attribution

All 20 files are licensed **CC BY 4.0**, which permits copying, adapting and
commercial reuse with proper credit. Credits must remain easy to find in the
finished website; a repository-only document is insufficient.

- Kevin MacLeod, 13 recordings: the [official FAQ](https://incompetech.com/music/royalty-free/faq.html) gives the CC BY 4.0 credit format and requires discoverable attribution. The artist's [track metadata](https://incompetech.com/music/royalty-free/pieces.json) supplies the exact title, filename and recording ISRC. Each linked track page renders the CC BY 4.0 attribution declaration.
- Scott Buckley, 7 recordings: [Using This Music](https://www.scottbuckley.com.au/library/using-this-music/) identifies original library MP3s as CC BY 4.0. His [licensing table](https://www.scottbuckley.com.au/library/licensing/) explicitly includes website background music under the credited CC-BY option. All seven linked work pages repeat that license.
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/) and the complete legal text are supplied locally at `/assets/music/CC-BY-4.0.txt`.

The public `/assets/music/CREDITS.html` page credits **each title and artist**,
links to its official work page and CC BY 4.0, and describes the encoding and
loudness changes. The `.txt` version is also included. Integrate a discoverable
**Music credits** link in the existing information/credits surface using
`PAPER_MUSIC_CREDITS_URL`. Keep credits reachable even while music is disabled.
These files accompany the interactive visual studio; do not package them as
an unrelated music streaming service or register them with Content ID.

## Production files

- 20 local MP3s in `public/assets/music/`, named `season-time.mp3`.
- Combined MP3 size: **62,073,344 bytes** (59.20 MiB).
- Combined full recording duration: **73.9 minutes**.
- MPEG Layer III, 112 kbps, 44.1 kHz, stereo.
- Source audio downloaded from the composers' actual public MP3 endpoints;
  no third-party stream extraction, account bypass, or synthetic replacement.
- Encoding: `ffmpeg -af loudnorm=I=-18:TP=-2:LRA=11 -ar 44100 -ac 2 -codec:a libmp3lame -b:a 112k`.
- Whole recordings retained. Loudness normalization makes scene changes less
  abrupt; the player applies a further 0.24 playback volume.
- `SOURCES.json` records exact source/download URLs, artist, license, duration,
  bytes, original and optimized SHA-256 hashes, and processing details.

Only the chosen recording loads after an explicit music click. The full
59.20 MiB collection is **not** loaded on page entry or preloaded in a batch.
MP3 was chosen for broad browser compatibility rather than requiring a new
codec or runtime library.

## Runtime integration

```ts
import { createPaperMusic } from './paper-music';
import { PAPER_MUSIC_CREDITS_URL } from './paper-music-catalog';

const music = createPaperMusic(environment.getState(), {
  onError(error) {
    // Asynchronous scene/resume/resource failures: reflect music off in the UI.
  },
});

// In the speaker click handler, without awaiting anything first:
void music.setEnabled(true).catch((error) => {
  // Initial play/permission failure: reflect music off in the UI.
});

// Other operations:
music.setScene(environment.getState()); // never starts music while off
void music.setEnabled(false);
const track = music.getTrack();
music.destroy(); // HMR/unmount cleanup
```

API: `createPaperMusic(initialScene, { onError? })` returns
`setEnabled(boolean): Promise<void>`, `setScene(scene): void`,
`getTrack(): PaperMusicTrack`, and `destroy(): void`.

- No Audio object or `src` assignment before explicit enable while visible.
- First `.play()` is synchronous in `setEnabled(true)` before its Promise is
  returned, preserving click activation.
- Two lazy `Audio` decks, `preload='none'`, `loop=true`. No external runtime
  dependencies and no third-party media requests.
- Initial fade-in is 800 ms. Once a new recording is ready, scene changes
  crossfade for 1500 ms; the previous recording remains audible during loading.
- Off fades over 280 ms then pauses. Same-track toggles preserve position.
- Hiding the tab pauses immediately; returning resumes only an already-enabled
  session. Scene changes while hidden do not start a download.
- Revision guards cancel stale transitions and ignore superseded play errors.
- An explicit startup failure rejects its Promise. Later scene/resume/media
  failures invoke `onError` once. Errors thrown by UI callbacks are contained.
- Destroy removes listeners, cancels fades, pauses both decks, removes sources
  and calls `load()` to release media resources.

## Verification

- All 20 downloaded originals decoded and converted successfully with ffmpeg.
- ffprobe verified each optimized recording's duration, codec, stereo channels
  and sample rate. Every scene ID, source title and output SHA-256 is unique.
- TypeScript and production build pass.
- Ten independent fake-Audio/RAF scenarios pass: lazy initialization and hidden
  selection, synchronous play, fades and toggle position, buffering crossfade,
  stale scene rejection, stale startup rejection, pending media errors,
  explicit-vs-background failure reporting, visibility resume and full cleanup.
- Existing environment tests pass.
- Browser playback/network panel inspection and listening remain the root
  integration task, as native browser access is reserved to root.
