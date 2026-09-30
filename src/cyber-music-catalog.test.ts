import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { CYBER_SEASONS, CYBER_TIMES, CYBER_WEATHER } from './cyber-climate.ts';
import { CYBER_MUSIC_TRACKS, getCyberMusicTrack } from './cyber-music-catalog.ts';

test('100 climate combinations select credited local recordings; all 20 recordings are used', () => {
  const used = new Set<string>();
  let count = 0;
  for (const season of CYBER_SEASONS) for (const time of CYBER_TIMES) for (const weather of CYBER_WEATHER) {
    const track = getCyberMusicTrack({ season, time, weather });
    assert.ok(track && track.title && track.artist);
    assert.equal(track.license, 'CC BY 4.0');
    assert.match(track.sourceUrl, /^https:\/\//);
    assert.equal(track.licenseUrl, 'https://creativecommons.org/licenses/by/4.0/');
    assert.equal(statSync(new URL(`../public${track.src}`, import.meta.url)).size, track.bytes);
    used.add(track.id);
    count++;
  }
  assert.equal(count, 100);
  assert.equal(used.size, 20);
  assert.equal(CYBER_MUSIC_TRACKS.length, 20);
});

test('each weather choice changes the actual recording, for every season and time', () => {
  for (const season of CYBER_SEASONS) for (const time of CYBER_TIMES) {
    const sources = CYBER_WEATHER.map(weather => getCyberMusicTrack({ season, time, weather }).src);
    assert.equal(new Set(sources).size, 5, `${season}/${time}`);
  }
});

test('each time choice and each season change the recording', () => {
  for (const season of CYBER_SEASONS) for (const weather of CYBER_WEATHER) {
    const sources = CYBER_TIMES.map(time => getCyberMusicTrack({ season, time, weather }).src);
    assert.equal(new Set(sources).size, 5, `${season}/${weather}`);
  }
  for (const time of CYBER_TIMES) for (const weather of CYBER_WEATHER) {
    const sources = CYBER_SEASONS.map(season => getCyberMusicTrack({ season, time, weather }).src);
    assert.equal(new Set(sources).size, 4, `${time}/${weather}`);
  }
});

test('Christmas recordings stay in winter, including weather variations', () => {
  for (const season of CYBER_SEASONS) for (const time of CYBER_TIMES) for (const weather of CYBER_WEATHER) {
    const track = getCyberMusicTrack({ season, time, weather });
    assert.equal(track.season === 'winter', season === 'winter');
  }
});
