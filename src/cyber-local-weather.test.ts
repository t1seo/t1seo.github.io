import assert from 'node:assert/strict';
import test from 'node:test';
import { coarseCoordinates, fetchLocalWeather, localClock, locateVisitor, parseLocalWeather, weatherFromCode } from './cyber-local-weather.ts';

const now = new Date('2026-04-01T03:00:00Z');
const payload = () => ({
  timezone: 'Asia/Seoul', current: { time: now.getTime() / 1000, weather_code: 61, is_day: 1 },
  daily: { sunrise: [Date.parse('2026-03-31T21:00:00Z') / 1000], sunset: [Date.parse('2026-04-01T09:00:00Z') / 1000] },
});

test('one instant produces each visitor timezone’s local calendar and light', () => {
  const instant = new Date('2026-03-01T01:00:00Z');
  assert.deepEqual(localClock(instant, 'Asia/Seoul', 37), { season: 'spring', time: 'morning' });
  assert.deepEqual(localClock(instant, 'America/Los_Angeles', 34), { season: 'winter', time: 'evening' });
  assert.deepEqual(localClock(instant, 'Australia/Sydney', -34), { season: 'autumn', time: 'noon' });
  assert.equal(localClock(new Date('2026-12-15T01:00:00Z'), 'Pacific/Auckland', -37).season, 'summer');
  assert.equal(localClock(new Date('2026-06-15T01:00:00Z'), 'Australia/Sydney', -34).season, 'winter');
});

test('local clock handles daylight saving, fractional offsets and invalid timezones', () => {
  assert.equal(localClock(new Date('2026-03-08T10:30:00Z'), 'America/New_York').time, 'morning');
  assert.equal(localClock(new Date('2026-04-01T05:30:00Z'), 'Asia/Kathmandu').time, 'noon');
  assert.doesNotThrow(() => localClock(now, 'Not/A_Zone'));
});

test('sunrise and sunset determine actual local daylight instead of fixed Seoul hours', () => {
  const weather = parseLocalWeather(payload(), now);
  assert.equal(localClock(new Date('2026-04-01T08:45:00Z'), 'Asia/Seoul', 37, weather).time, 'evening');
  assert.equal(localClock(new Date('2026-04-01T09:46:00Z'), 'Asia/Seoul', 37, weather).time, 'night');
  assert.equal(localClock(new Date('2026-03-31T20:45:00Z'), 'Asia/Seoul', 37, weather).time, 'morning');
});

test('polar conditions use fresh day/night information when sun times are absent', () => {
  const data = payload();
  data.daily = { sunrise: [], sunset: [] };
  data.current.is_day = 0;
  const weather = parseLocalWeather(data, now);
  assert.equal(localClock(now, 'Asia/Seoul', 80, weather).time, 'night');
  weather.isDay = true;
  assert.equal(localClock(now, 'UTC', 80, weather).time, 'morning');
});

test('all supported WMO codes map to existing atmosphere effects; malformed codes never invent clear weather', () => {
  for (const code of [0, 1]) assert.equal(weatherFromCode(code), 'clear');
  for (const code of [2, 3]) assert.equal(weatherFromCode(code), 'cloudy');
  for (const code of [45, 48]) assert.equal(weatherFromCode(code), 'mist');
  for (const code of [71, 73, 75, 77, 85, 86]) assert.equal(weatherFromCode(code), 'snow');
  for (const code of [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 97, 99]) assert.equal(weatherFromCode(code), 'rain');
  for (const code of [undefined, null, '61', NaN, 9, 61.5]) assert.equal(weatherFromCode(code), null);
});

test('weather validation rejects missing, stale, future and unrecognized data', () => {
  assert.equal(parseLocalWeather(payload(), now).weather, 'rain');
  for (const data of [null, {}, [], { ...payload(), timezone: '<script>' }, { ...payload(), current: null }]) {
    assert.throws(() => parseLocalWeather(data, now));
  }
  for (const patch of [{ time: 0 }, { time: now.getTime() / 1000 + 3600 }, { weather_code: null }, { weather_code: 999 }, { is_day: 3 }]) {
    assert.throws(() => parseLocalWeather({ ...payload(), current: { ...payload().current, ...patch } }, now));
  }
  assert.deepEqual(parseLocalWeather({ ...payload(), daily: { sunrise: [null, 'bad', 0], sunset: [null, 0, 0] } }, now).sun, []);
});

test('only coarse valid coordinates go to the weather provider, without credentials or referrer', async t => {
  assert.deepEqual(coarseCoordinates({ latitude: 37.566543, longitude: 126.978123 }), { latitude: 37.57, longitude: 126.98 });
  assert.throws(() => coarseCoordinates({ latitude: 91, longitude: 0 }));
  assert.throws(() => coarseCoordinates({ latitude: 0, longitude: NaN }));
  const mock = t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, options?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.origin, 'https://api.open-meteo.com');
    assert.equal(url.searchParams.get('latitude'), '37.57');
    assert.equal(url.searchParams.get('longitude'), '126.98');
    assert.equal(url.searchParams.get('timezone'), 'auto');
    assert.equal(options?.credentials, 'omit');
    assert.equal(options?.referrerPolicy, 'no-referrer');
    assert.ok(options?.signal);
    return new Response(JSON.stringify(payload()));
  });
  const weather = await fetchLocalWeather({ latitude: 37.566543, longitude: 126.978123 }, new AbortController().signal, now);
  assert.equal(weather.weather, 'rain');
  assert.equal(mock.mock.callCount(), 1);
});

test('HTTP failures surface as unavailable instead of using an error response as weather', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('limited', { status: 429 }));
  await assert.rejects(fetchLocalWeather({ latitude: 0, longitude: 0 }, new AbortController().signal, now));
});

test('location requests are low precision and cancellation ignores late browser results', async t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let success!: PositionCallback;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { geolocation: {
    getCurrentPosition(callback: PositionCallback, _error: PositionErrorCallback, options: PositionOptions) {
      assert.equal(options.enableHighAccuracy, false);
      assert.ok((options.timeout ?? Infinity) < 20_000);
      success = callback;
    },
  } } });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'navigator', original); else Reflect.deleteProperty(globalThis, 'navigator'); });
  const controller = new AbortController();
  const pending = locateVisitor(controller.signal);
  controller.abort();
  await assert.rejects(pending);
  assert.doesNotThrow(() => success({ coords: { latitude: 37.5665, longitude: 126.978 } } as GeolocationPosition));
});
