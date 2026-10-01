import test from 'node:test';
import assert from 'node:assert/strict';
import { createCyberClimate } from './cyber-climate.ts';
import type { ClimateState } from './cyber-climate.ts';
import type { Coordinates } from './cyber-local-weather.ts';

const now = () => new Date('2026-04-01T03:00:00Z');
const preset = () => ({ season: 'winter', time: 'night', weather: 'snow' } satisfies Pick<ClimateState, 'season' | 'time' | 'weather'>);

test('applies every atmosphere field with one callback and one persistent write', t => {
  const snapshots: ClimateState[] = [];
  const saved: string[] = [];
  const climate = createCyberClimate(state => snapshots.push(state), {
    now, timeZone: () => 'Asia/Seoul',
    storage: { getItem: () => null, setItem: (_key, value) => { saved.push(value); } },
  });
  t.after(() => climate.destroy());

  climate.setAtmosphere(preset());

  const expected = { ...preset(), auto: false };
  assert.deepEqual(climate.getState(), expected);
  assert.deepEqual(snapshots, [expected]);
  assert.deepEqual(saved.map(value => JSON.parse(value)), [{ version: 1, ...expected }]);
});

test('returns fresh callback snapshots and does not retain a caller-owned preset', t => {
  const climate = createCyberClimate(state => { state.weather = 'clear'; }, { now, storage: null });
  t.after(() => climate.destroy());
  const selected = preset();

  climate.setAtmosphere(selected);
  Reflect.set(selected, 'season', 'summer');
  climate.getState().time = 'morning';

  assert.deepEqual(climate.getState(), { ...preset(), auto: false });
});

test('cancels a pending location and ignores its late result when applying an atmosphere', async t => {
  let resolveLocation: (value: Coordinates) => void = () => {};
  const location = new Promise<Coordinates>(resolve => { resolveLocation = resolve; });
  let signal: AbortSignal | undefined;
  let weatherCalls = 0;
  const snapshots: ClimateState[] = [];
  const climate = createCyberClimate(state => snapshots.push(state), {
    now, storage: null, timeZone: () => 'Asia/Seoul',
    locate: nextSignal => { signal = nextSignal; return location; },
    weather: async () => {
      weatherCalls++;
      return { weather: 'rain', timeZone: 'Asia/Seoul', observedAt: now().getTime(), isDay: true, sun: [] };
    },
  });
  t.after(() => climate.destroy());
  const loading = climate.start();
  assert.equal(climate.getLocalInfo().status, 'locating');

  climate.setAtmosphere(preset());
  resolveLocation({ latitude: -33.8, longitude: 151.2 });
  await loading;

  assert.equal(signal?.aborted, true);
  assert.equal(weatherCalls, 0);
  assert.deepEqual(snapshots, [{ ...preset(), auto: false }]);
  assert.equal(climate.getLocalInfo().status, 'device');
});

test('invalid atmosphere fields leave the entire selection and Auto unchanged', t => {
  const snapshots: ClimateState[] = [];
  const climate = createCyberClimate(state => snapshots.push(state), { now, storage: null });
  t.after(() => climate.destroy());
  const before = climate.getState();

  for (const field of ['season', 'time', 'weather']) {
    const invalid = preset();
    Reflect.set(invalid, field, 'invalid');
    climate.setAtmosphere(invalid);
  }

  assert.deepEqual(climate.getState(), before);
  assert.deepEqual(snapshots, []);
});

test('applying an identical atmosphere twice does not redraw or persist twice', t => {
  const snapshots: ClimateState[] = [];
  let writes = 0;
  const climate = createCyberClimate(state => snapshots.push(state), {
    now, storage: { getItem: () => null, setItem: () => { writes++; } },
  });
  t.after(() => climate.destroy());
  climate.setAtmosphere(preset());

  climate.setAtmosphere(preset());

  assert.equal(snapshots.length, 1);
  assert.equal(writes, 1);
});

test('destroyed climate ignores an atmosphere selection', () => {
  let changes = 0;
  const climate = createCyberClimate(() => { changes++; }, { now, storage: null });
  const before = climate.getState();
  climate.destroy();

  climate.setAtmosphere(preset());

  assert.deepEqual(climate.getState(), before);
  assert.equal(changes, 0);
});
