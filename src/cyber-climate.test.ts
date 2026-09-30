import assert from 'node:assert/strict';
import test from 'node:test';
import { createCyberClimate as createClimate, CYBER_CLIMATE_STORAGE_KEY } from './cyber-climate.ts';
import type { ClimateState, Season, TimeOfDay, Weather } from './cyber-climate.ts';

// Keep these legacy calendar cases independent of the test machine's timezone.
function createCyberClimate(callback: Parameters<typeof createClimate>[0], options: Parameters<typeof createClimate>[1] = {}) {
  return createClimate(callback, { timeZone: () => 'Asia/Seoul', ...options });
}

function memoryStorage(initial: string | null = null) {
  let value = initial;
  let writes = 0;
  return {
    getItem(key: string) { assert.equal(key, CYBER_CLIMATE_STORAGE_KEY); return value; },
    setItem(key: string, next: string) { assert.equal(key, CYBER_CLIMATE_STORAGE_KEY); value = next; writes++; },
    saved() { return value ? JSON.parse(value) : null; },
    writes() { return writes; },
  };
}

const springNoon = () => new Date('2026-04-01T03:00:00Z');

test('new climate starts with the device clock and neutral weather, without an eager callback', t => {
  let notifications = 0;
  const climate = createCyberClimate(() => notifications++, { now: springNoon, storage: null });
  t.after(() => climate.destroy());
  assert.deepEqual(climate.getState(), { season: 'spring', time: 'noon', weather: 'clear', auto: true });
  assert.equal(notifications, 0, 'callers can initialize integrations safely after construction');
  climate.setWeather('rain');
  assert.equal(climate.getState().auto, false, 'a manual weather choice pauses automatic changes');
  assert.equal(notifications, 1);
});

test('manual scenery survives reload and Auto restores the current calendar with neutral weather until located', t => {
  const storage = memoryStorage();
  let now = springNoon();
  const climate = createCyberClimate(() => {}, { now: () => now, storage });
  t.after(() => climate.destroy());
  climate.setSeason('winter');
  climate.setTime('evening');
  climate.setWeather('snow');
  assert.deepEqual(climate.getState(), { season: 'winter', time: 'evening', weather: 'snow', auto: false });
  assert.deepEqual(storage.saved(), { version: 1, ...climate.getState() });
  const restored = createCyberClimate(() => {}, { now: springNoon, storage });
  t.after(() => restored.destroy());
  assert.deepEqual(restored.getState(), climate.getState());
  now = new Date('2026-07-01T11:00:00Z');
  climate.setAuto();
  assert.deepEqual(climate.getState(), { season: 'summer', time: 'evening', weather: 'clear', auto: true });
  climate.setAuto(false);
  assert.equal(climate.getState().auto, false, 'the Auto switch can freeze the current moment');
});

test('minute refresh crosses Seoul local midnight, then stops advancing after a manual choice', t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let now = new Date('2026-11-30T14:59:00Z');
  const snapshots: ClimateState[] = [];
  const storage = memoryStorage();
  const climate = createCyberClimate(state => snapshots.push(state), { now: () => now, storage });
  t.after(() => climate.destroy());
  assert.equal(climate.getState().season, 'autumn');
  now = new Date('2026-11-30T15:00:00Z');
  t.mock.timers.tick(60_000);
  assert.deepEqual(climate.getState(), { season: 'winter', time: 'night', weather: 'clear', auto: true });
  assert.equal(storage.writes(), 0, 'clock ticks do not write stale calendar data every minute');
  now = new Date('2026-12-01T07:29:00Z');
  t.mock.timers.tick(60_000);
  assert.equal(climate.getState().time, 'afternoon');
  now = new Date('2026-12-01T07:30:00Z');
  t.mock.timers.tick(60_000);
  assert.equal(climate.getState().time, 'evening');
  const count = snapshots.length;
  t.mock.timers.tick(60_000);
  assert.equal(snapshots.length, count, 'unchanged time buckets do not redraw');
  climate.setTime('morning');
  now = new Date('2027-04-01T03:00:00Z');
  t.mock.timers.tick(60_000);
  assert.deepEqual(climate.getState(), { season: 'winter', time: 'morning', weather: 'clear', auto: false });
});

test('malformed preferences fall back safely and automatic preferences ignore stale date fields', t => {
  for (const raw of ['broken', 'null', '[]', '{"version":99}', '{"version":1,"auto":false,"season":"monsoon","time":"soon","weather":"storm"}']) {
    const climate = createCyberClimate(() => {}, { now: springNoon, storage: memoryStorage(raw) });
    t.after(() => climate.destroy());
    assert.deepEqual(climate.getState(), { season: 'spring', time: 'noon', weather: 'clear', auto: true });
  }
  const stale = createCyberClimate(() => {}, {
    now: springNoon,
    storage: memoryStorage(JSON.stringify({ version: 1, season: 'winter', time: 'night', weather: 'mist', auto: true })),
  });
  t.after(() => stale.destroy());
  assert.deepEqual(stale.getState(), { season: 'spring', time: 'noon', weather: 'clear', auto: true });
  const partial = createCyberClimate(() => {}, {
    now: springNoon,
    storage: memoryStorage(JSON.stringify({ version: 1, season: 'winter', time: 'invalid', weather: 'cloudy', auto: false })),
  });
  t.after(() => partial.destroy());
  assert.deepEqual(partial.getState(), { season: 'spring', time: 'noon', weather: 'clear', auto: true });
});

test('blocked storage and invalid runtime selections cannot break scene controls', t => {
  const storage = {
    getItem() { throw new Error('storage blocked'); },
    setItem() { throw new Error('quota full'); },
  };
  const climate = createCyberClimate(() => {}, { now: springNoon, storage });
  t.after(() => climate.destroy());
  assert.doesNotThrow(() => { climate.setSeason('autumn'); climate.setTime('night'); climate.setWeather('rain'); });
  const before = climate.getState();
  climate.setSeason('unknown' as Season);
  climate.setTime('unknown' as TimeOfDay);
  climate.setWeather('unknown' as Weather);
  assert.deepEqual(climate.getState(), before);
});

test('callbacks receive snapshots and destruction stops setters and the clock', t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let now = springNoon();
  let notifications = 0;
  const storage = memoryStorage();
  const climate = createCyberClimate(state => { notifications++; state.season = 'winter'; }, { now: () => now, storage });
  t.after(() => climate.destroy());
  climate.getState().season = 'winter';
  climate.setWeather('rain');
  assert.equal(climate.getState().season, 'spring');
  const before = climate.getState();
  const writes = storage.writes();
  climate.destroy();
  now = new Date('2026-12-01T13:00:00Z');
  climate.setSeason('winter');
  climate.setTime('night');
  climate.setWeather('snow');
  climate.setAuto();
  t.mock.timers.tick(120_000);
  assert.deepEqual(climate.getState(), before);
  assert.equal(notifications, 1);
  assert.equal(storage.writes(), writes);
});

test('returning to a visible page refreshes the clock; destroying removes its listener', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const page = Object.assign(new EventTarget(), { visibilityState: 'hidden' });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: page });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else Reflect.deleteProperty(globalThis, 'document');
  });
  let now = springNoon();
  const climate = createCyberClimate(() => {}, { now: () => now, storage: null });
  t.after(() => climate.destroy());
  now = new Date('2026-07-01T13:00:00Z');
  page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(climate.getState().time, 'noon');
  page.visibilityState = 'visible';
  page.dispatchEvent(new Event('visibilitychange'));
  assert.deepEqual(climate.getState(), { season: 'summer', time: 'night', weather: 'clear', auto: true });
  climate.destroy();
  now = springNoon();
  page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(climate.getState().time, 'night');
});
