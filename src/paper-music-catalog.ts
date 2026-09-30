import type { Season, StudioState, TimeOfDay } from './environment';

export interface PaperMusicTrack {
  readonly id: string;
  readonly season: Season;
  readonly timeOfDay: TimeOfDay;
  readonly title: string;
  readonly artist: string;
  readonly src: string;
  readonly artistUrl: string;
  readonly sourceUrl: string;
  readonly license: 'CC BY 4.0';
  readonly licenseUrl: string;
  readonly durationSeconds: number;
  readonly bytes: number;
}

/** Real recordings; importing this catalogue makes no media requests. */
const tracks = [
  {
    "id": "spring-morning",
    "season": "spring",
    "timeOfDay": "morning",
    "title": "Cherry Blossom",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/spring-morning.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100382",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 129.8,
    "bytes": 1818154
  },
  {
    "id": "spring-noon",
    "season": "spring",
    "timeOfDay": "noon",
    "title": "Easy Lemon",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/spring-noon.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200076",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 126.38,
    "bytes": 1770241
  },
  {
    "id": "spring-afternoon",
    "season": "spring",
    "timeOfDay": "afternoon",
    "title": "Childhood",
    "artist": "Scott Buckley",
    "src": "/assets/music/spring-afternoon.mp3",
    "artistUrl": "https://www.scottbuckley.com.au/",
    "sourceUrl": "https://www.scottbuckley.com.au/library/childhood/",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 137.08,
    "bytes": 1920162
  },
  {
    "id": "spring-evening",
    "season": "spring",
    "timeOfDay": "evening",
    "title": "Water Lily",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/spring-evening.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400035",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 144.07,
    "bytes": 2017830
  },
  {
    "id": "spring-night",
    "season": "spring",
    "timeOfDay": "night",
    "title": "Reverie",
    "artist": "Scott Buckley",
    "src": "/assets/music/spring-night.mp3",
    "artistUrl": "https://www.scottbuckley.com.au/",
    "sourceUrl": "https://www.scottbuckley.com.au/library/reverie/",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 223.67,
    "bytes": 3132501
  },
  {
    "id": "summer-morning",
    "season": "summer",
    "timeOfDay": "morning",
    "title": "Laid Back Guitars",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/summer-morning.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100181",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 244.06,
    "bytes": 3417791
  },
  {
    "id": "summer-noon",
    "season": "summer",
    "timeOfDay": "noon",
    "title": "Bossa Antigua",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/summer-noon.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700069",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 283.35,
    "bytes": 3967821
  },
  {
    "id": "summer-afternoon",
    "season": "summer",
    "timeOfDay": "afternoon",
    "title": "Carefree",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/summer-afternoon.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 205.14,
    "bytes": 2872868
  },
  {
    "id": "summer-evening",
    "season": "summer",
    "timeOfDay": "evening",
    "title": "Moonlight",
    "artist": "Scott Buckley",
    "src": "/assets/music/summer-evening.mp3",
    "artistUrl": "https://www.scottbuckley.com.au/",
    "sourceUrl": "https://www.scottbuckley.com.au/library/moonlight/",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 254.33,
    "bytes": 3561853
  },
  {
    "id": "summer-night",
    "season": "summer",
    "timeOfDay": "night",
    "title": "Sleep (Piano Only)",
    "artist": "Scott Buckley",
    "src": "/assets/music/summer-night.mp3",
    "artistUrl": "https://www.scottbuckley.com.au/",
    "sourceUrl": "https://www.scottbuckley.com.au/library/sleep/",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 184.36,
    "bytes": 2582110
  },
  {
    "id": "autumn-morning",
    "season": "autumn",
    "timeOfDay": "morning",
    "title": "A Kind of Hope",
    "artist": "Scott Buckley",
    "src": "/assets/music/autumn-morning.mp3",
    "artistUrl": "https://www.scottbuckley.com.au/",
    "sourceUrl": "https://www.scottbuckley.com.au/library/a-kind-of-hope/",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 342.6,
    "bytes": 4797612
  },
  {
    "id": "autumn-noon",
    "season": "autumn",
    "timeOfDay": "noon",
    "title": "Lobby Time",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/autumn-noon.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600054",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 193.2,
    "bytes": 2705738
  },
  {
    "id": "autumn-afternoon",
    "season": "autumn",
    "timeOfDay": "afternoon",
    "title": "George Street Shuffle",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/autumn-afternoon.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300035",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 268.3,
    "bytes": 3757178
  },
  {
    "id": "autumn-evening",
    "season": "autumn",
    "timeOfDay": "evening",
    "title": "Solace",
    "artist": "Scott Buckley",
    "src": "/assets/music/autumn-evening.mp3",
    "artistUrl": "https://www.scottbuckley.com.au/",
    "sourceUrl": "https://www.scottbuckley.com.au/library/solace/",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 356.36,
    "bytes": 4989962
  },
  {
    "id": "autumn-night",
    "season": "autumn",
    "timeOfDay": "night",
    "title": "Hiraeth",
    "artist": "Scott Buckley",
    "src": "/assets/music/autumn-night.mp3",
    "artistUrl": "https://www.scottbuckley.com.au/",
    "sourceUrl": "https://www.scottbuckley.com.au/library/hiraeth/",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 346.2,
    "bytes": 4847701
  },
  {
    "id": "winter-morning",
    "season": "winter",
    "timeOfDay": "morning",
    "title": "Winter Chimes",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/winter-morning.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100009",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 158.09,
    "bytes": 2214221
  },
  {
    "id": "winter-noon",
    "season": "winter",
    "timeOfDay": "noon",
    "title": "Nouvelle Noel",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/winter-noon.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700072",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 191.16,
    "bytes": 2677216
  },
  {
    "id": "winter-afternoon",
    "season": "winter",
    "timeOfDay": "afternoon",
    "title": "Deck the Halls A",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/winter-afternoon.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100263",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 247.48,
    "bytes": 3465699
  },
  {
    "id": "winter-evening",
    "season": "winter",
    "timeOfDay": "evening",
    "title": "It Came Upon a Midnight Clear",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/winter-evening.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100191",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 265.56,
    "bytes": 3718786
  },
  {
    "id": "winter-night",
    "season": "winter",
    "timeOfDay": "night",
    "title": "Silent Night",
    "artist": "Kevin MacLeod",
    "src": "/assets/music/winter-night.mp3",
    "artistUrl": "https://incompetech.com/",
    "sourceUrl": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100075",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "durationSeconds": 131.21,
    "bytes": 1837900
  }
] satisfies readonly PaperMusicTrack[];

export const PAPER_MUSIC_TRACKS: readonly PaperMusicTrack[] = Object.freeze(
  tracks.map((track) => Object.freeze(track)),
);
export const PAPER_MUSIC_CREDITS_URL = '/assets/music/CREDITS.html';

const byScene = new Map(PAPER_MUSIC_TRACKS.map((track) => [track.id, track]));

export function getPaperMusicTrack(state: Pick<StudioState, 'season' | 'timeOfDay'>): PaperMusicTrack {
  return byScene.get(`${state.season}-${state.timeOfDay}`) ?? PAPER_MUSIC_TRACKS[0];
}
