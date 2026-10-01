import type { ClimateState, Season, Weather } from './cyber-climate.ts';
import { PAPER_MUSIC_TRACKS, PAPER_MUSIC_CREDITS_URL, type PaperMusicTrack } from './paper-music-catalog.ts';

export type CyberMusicTrack = PaperMusicTrack;
export type MusicClimate = Pick<ClimateState, 'season' | 'time' | 'weather'>;
export const CYBER_MUSIC_CREDITS_URL = PAPER_MUSIC_CREDITS_URL;
export const CYBER_MUSIC_TRACKS = PAPER_MUSIC_TRACKS;
export const MILKY_ALBUM_MUSIC_TRACK = PAPER_MUSIC_TRACKS[2];

// An editorial selection, not a shuffled playlist. Each row is morning → night.
// Rain and mist favour piano/ambient recordings; the five winter recordings
// preserve the room's Christmas character. Every weather choice changes the song.
const programme: Record<Season, Record<Weather, readonly number[]>> = {
  spring: {
    clear: [0, 1, 2, 3, 4],
    cloudy: [2, 10, 11, 4, 8],
    rain: [3, 2, 10, 8, 9],
    snow: [10, 3, 4, 9, 13],
    mist: [4, 8, 13, 14, 3],
  },
  summer: {
    clear: [5, 6, 7, 8, 9],
    cloudy: [0, 5, 12, 9, 13],
    rain: [2, 11, 3, 13, 14],
    snow: [3, 0, 8, 14, 4],
    mist: [9, 13, 14, 3, 8],
  },
  autumn: {
    clear: [10, 11, 12, 13, 14],
    cloudy: [5, 12, 10, 14, 4],
    rain: [4, 10, 2, 3, 8],
    snow: [2, 8, 13, 4, 9],
    mist: [3, 14, 4, 8, 13],
  },
  winter: {
    clear: [15, 16, 17, 18, 19],
    cloudy: [19, 18, 16, 15, 17],
    rain: [18, 15, 19, 17, 16],
    snow: [16, 17, 18, 19, 15],
    mist: [17, 19, 15, 16, 18],
  },
};

const timeIndex = { morning: 0, noon: 1, afternoon: 2, evening: 3, night: 4 } as const;

/** Pure selection: importing or selecting never fetches a recording. */
export function getCyberMusicTrack(climate: MusicClimate): CyberMusicTrack {
  return CYBER_MUSIC_TRACKS[programme[climate.season][climate.weather][timeIndex[climate.time]]];
}
