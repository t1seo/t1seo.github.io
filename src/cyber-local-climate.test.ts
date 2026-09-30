import assert from 'node:assert/strict';
import test from 'node:test';
import { createCyberClimate } from './cyber-climate.ts';
import type { LocalWeather } from './cyber-local-weather.ts';

const instant = new Date('2026-04-01T03:00:00Z');
const forecast = (timeZone = 'Asia/Seoul', weather: LocalWeather['weather'] = 'rain'): LocalWeather => ({
  timeZone, weather, observedAt: instant.getTime(), isDay: true, sun: [],
});
const defaults = { storage: null, now: () => instant, timeZone: () => 'UTC' };
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

test('startup uses the device zone, then located weather changes region, hemisphere, date and atmosphere', async t => {
  let calls = 0;
  const climate = createCyberClimate(() => {}, { ...defaults,
    locate: async () => { calls++; return { latitude: -33.87, longitude: 151.21 }; },
    weather: async () => forecast('Australia/Sydney', 'cloudy'),
  });
  t.after(() => climate.destroy());
  assert.equal(climate.getState().time, 'night');
  assert.equal(calls, 0, 'constructing the controller must not trigger permission or callbacks');
  await climate.start();
  assert.deepEqual(climate.getState(), { season: 'autumn', time: 'afternoon', weather: 'cloudy', auto: true });
  assert.equal(climate.getLocalInfo().timeZone, 'Australia/Sydney');
  assert.equal(climate.getLocalInfo().status, 'live');
  await climate.start();
  assert.equal(calls, 1, 'startup is idempotent');
});

test('permission denial keeps local time, suppresses repeated prompts and supports explicit retry', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let clock = instant;
  let allowed = false;
  let attempts = 0;
  let weatherCalls = 0;
  const climate = createCyberClimate(() => {}, { ...defaults, now: () => clock,
    locate: async () => { attempts++; if (!allowed) throw { code: 1 }; return { latitude: 37, longitude: 127 }; },
    weather: async () => { weatherCalls++; return forecast(); },
  });
  t.after(() => climate.destroy());
  await climate.start();
  assert.equal(climate.getLocalInfo().status, 'denied');
  assert.equal(weatherCalls, 0);
  clock = new Date('2026-04-01T12:00:00Z');
  t.mock.timers.tick(16 * 60_000);
  await flush();
  assert.equal(attempts, 1);
  assert.equal(climate.getState().time, 'noon');
  allowed = true;
  await climate.useLocation();
  assert.equal(attempts, 2);
  assert.equal(climate.getLocalInfo().status, 'live');
});

test('manual weather selection aborts pending work and late network results cannot overwrite it', async t => {
  let resolve!: (weather: LocalWeather) => void;
  let requestSignal!: AbortSignal;
  const climate = createCyberClimate(() => {}, { ...defaults,
    locate: async () => ({ latitude: 37, longitude: 127 }),
    weather: (_coords, signal) => { requestSignal = signal; return new Promise(done => { resolve = done; }); },
  });
  t.after(() => climate.destroy());
  const pending = climate.start();
  await flush();
  assert.equal(climate.getLocalInfo().status, 'loading');
  climate.setWeather('snow');
  assert.equal(requestSignal.aborted, true);
  resolve(forecast());
  await pending;
  assert.equal(climate.getState().weather, 'snow');
  assert.equal(climate.getState().auto, false);
});

test('offline weather preserves a usable clock and hemisphere, then retry recovers', async t => {
  let online = false;
  const climate = createCyberClimate(() => {}, { ...defaults,
    locate: async () => ({ latitude: -34, longitude: 151 }),
    weather: async () => { if (!online) throw new Error('offline'); return forecast('Australia/Sydney', 'snow'); },
  });
  t.after(() => climate.destroy());
  await climate.start();
  assert.equal(climate.getState().season, 'autumn');
  assert.equal(climate.getLocalInfo().status, 'unavailable');
  online = true;
  await climate.useLocation();
  assert.equal(climate.getState().weather, 'snow');
  assert.equal(climate.getLocalInfo().status, 'live');
});

test('weather refreshes at a bounded interval and manual mode suspends requests', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let clock = instant;
  let requests = 0;
  const climate = createCyberClimate(() => {}, { ...defaults, now: () => clock,
    locate: async () => ({ latitude: 37, longitude: 127 }),
    weather: async () => { requests++; return { ...forecast(), observedAt: clock.getTime() }; },
  });
  t.after(() => climate.destroy());
  await climate.start();
  clock = new Date(instant.getTime() + 14 * 60_000);
  t.mock.timers.tick(14 * 60_000);
  await flush();
  assert.equal(requests, 1);
  clock = new Date(instant.getTime() + 15 * 60_000);
  t.mock.timers.tick(60_000);
  await flush();
  assert.equal(requests, 2);
  climate.setTime('night');
  clock = new Date(instant.getTime() + 60 * 60_000);
  t.mock.timers.tick(45 * 60_000);
  await flush();
  assert.equal(requests, 2);
});

test('duplicate location actions share an active request; destruction aborts it and clears listeners', async t => {
  let signal!: AbortSignal;
  let resolve!: (coords: { latitude: number; longitude: number }) => void;
  let count = 0;
  let infoCount = 0;
  const climate = createCyberClimate(() => {}, { ...defaults,
    locate: current => { count++; signal = current; return new Promise(done => { resolve = done; }); },
    weather: async () => { throw new Error('should never fetch'); },
  });
  t.after(() => climate.destroy());
  climate.subscribeLocalInfo(() => infoCount++);
  const pending = climate.start();
  await climate.useLocation();
  assert.equal(count, 1);
  climate.destroy();
  assert.equal(signal.aborted, true);
  const before = infoCount;
  resolve({ latitude: 37, longitude: 127 });
  await pending;
  assert.equal(infoCount, before);
});

test('coordinates and API responses are never persisted; manual preferences still survive', async t => {
  let saved = '';
  const climate = createCyberClimate(() => {}, { ...defaults,
    storage: { getItem: () => null, setItem: (_key, value) => { saved = value; } },
    locate: async () => ({ latitude: 37.57, longitude: 126.98 }), weather: async () => forecast(),
  });
  t.after(() => climate.destroy());
  await climate.start();
  assert.equal(saved, '');
  climate.setWeather('mist');
  assert.deepEqual(JSON.parse(saved), { version: 1, season: 'spring', time: 'noon', weather: 'mist', auto: false });
  assert.ok(!/latitude|longitude|observedAt|timeZone/.test(saved));
});

test('saved manual preferences suppress startup permission requests', async t => {
  const climate = createCyberClimate(() => {}, { ...defaults,
    storage: { getItem: () => JSON.stringify({ version: 1, season: 'winter', time: 'night', weather: 'snow', auto: false }), setItem: () => {} },
    locate: async () => { throw new Error('must not be called'); },
  });
  t.after(() => climate.destroy());
  await climate.start();
  assert.equal(climate.getState().auto, false);
  assert.equal(climate.getLocalInfo().status, 'device');
});

test('hidden pages neither request startup location nor poll; returning refreshes expired weather once', async t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const page = Object.assign(new EventTarget(), { visibilityState: 'hidden' });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: page });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'document', original); else Reflect.deleteProperty(globalThis, 'document'); });
  t.mock.timers.enable({ apis: ['setInterval'] });
  let clock = instant;
  let requests = 0;
  const climate = createCyberClimate(() => {}, { ...defaults, now: () => clock,
    locate: async () => ({ latitude: 37, longitude: 127 }),
    weather: async () => { requests++; return { ...forecast(), observedAt: clock.getTime() }; },
  });
  t.after(() => climate.destroy());
  await climate.start();
  assert.equal(requests, 0);
  page.visibilityState = 'visible';
  page.dispatchEvent(new Event('visibilitychange'));
  await flush();
  assert.equal(requests, 1);
  page.visibilityState = 'hidden';
  clock = new Date(instant.getTime() + 3 * 60 * 60_000);
  t.mock.timers.tick(3 * 60 * 60_000);
  await flush();
  assert.equal(requests, 1);
  assert.equal(climate.getLocalInfo().status, 'unavailable', 'stale data must not be labeled live');
  page.visibilityState = 'visible';
  page.dispatchEvent(new Event('visibilitychange'));
  await flush();
  assert.equal(requests, 2);
  assert.equal(climate.getLocalInfo().status, 'live');
});

test('moving to a new region never reuses the old region’s weather when the next request fails', async t => {
  let moved = false;
  const climate = createCyberClimate(() => {}, { ...defaults,
    locate: async () => moved ? { latitude: -34, longitude: 151 } : { latitude: 37, longitude: 127 },
    weather: async () => { if (moved) throw new Error('offline'); return forecast(); },
  });
  t.after(() => climate.destroy());
  await climate.start();
  assert.equal(climate.getState().weather, 'rain');
  assert.equal(climate.getLocalInfo().timeZone, 'Asia/Seoul');
  moved = true;
  await climate.useLocation();
  assert.equal(climate.getState().season, 'autumn');
  assert.equal(climate.getState().weather, 'clear');
  assert.equal(climate.getLocalInfo().timeZone, 'UTC');
  assert.equal(climate.getLocalInfo().updatedAt, null);
  assert.equal(climate.getLocalInfo().status, 'unavailable');
});
