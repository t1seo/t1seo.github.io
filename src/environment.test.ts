import assert from 'node:assert/strict';
import test from 'node:test';
import { createEnvironment, deriveTimeOfDay, ENVIRONMENT_STORAGE_KEY, getSeoulEnvironment } from './environment.ts';
import type { Season, StudioState, TimeOfDay } from './environment.ts';

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem(key: string) { assert.equal(key, ENVIRONMENT_STORAGE_KEY); return value; },
    setItem(key: string, next: string) { assert.equal(key, ENVIRONMENT_STORAGE_KEY); value = next; },
    saved() { return value === null ? null : JSON.parse(value); },
  };
}

const noonInSpring = () => new Date('2026-04-01T03:00:00Z');

test('each day phase has deliberate seasonal boundaries, including earlier winter light', () => {
  const boundaries: [Season, number, number, number][] = [
    ['spring', 6, 18, 20], ['summer', 5, 19, 21],
    ['autumn', 6, 17.5, 19.5], ['winter', 7, 16.5, 19],
  ];
  for (const [season, dawn, dusk, night] of boundaries) {
    const cases: [number, TimeOfDay][] = [
      [0, 'night'], [dawn - 1 / 60, 'night'], [dawn, 'morning'],
      [10 + 59 / 60, 'morning'], [11, 'noon'], [13 + 59 / 60, 'noon'],
      [14, 'afternoon'], [dusk - 1 / 60, 'afternoon'], [dusk, 'evening'],
      [night - 1 / 60, 'evening'], [night, 'night'], [23 + 59 / 60, 'night'],
    ];
    for (const [hour, expected] of cases) assert.equal(deriveTimeOfDay(hour, season), expected, `${season} at ${hour}`);
  }
  for (const hour of [-1, 24, Infinity, NaN]) assert.throws(() => deriveTimeOfDay(hour, 'spring'), RangeError);
});

test('Seoul calendar seasons switch at local midnight, independently of host timezone', () => {
  const transitions: [string, Season, Season][] = [
    ['2026-02-28', 'winter', 'spring'], ['2026-05-31', 'spring', 'summer'],
    ['2026-08-31', 'summer', 'autumn'], ['2026-11-30', 'autumn', 'winter'],
  ];
  for (const [date, before, after] of transitions) {
    assert.deepEqual(getSeoulEnvironment(new Date(`${date}T14:59:59Z`)), { season: before, timeOfDay: 'night' });
    assert.deepEqual(getSeoulEnvironment(new Date(`${date}T15:00:00Z`)), { season: after, timeOfDay: 'night' });
  }
  assert.deepEqual(getSeoulEnvironment(new Date('2026-12-01T07:30:00Z')), { season: 'winter', timeOfDay: 'evening' });
  assert.deepEqual(getSeoulEnvironment(new Date('2026-06-01T07:30:00Z')), { season: 'summer', timeOfDay: 'afternoon' });
});

test('lamp preference survives scene choices and reload, while Auto resets only clock and lamp', (t) => {
  const storage = memoryStorage();
  let clock = new Date('2026-04-01T03:00:00Z');
  const environment = createEnvironment({ storage, now: () => clock, reducedMotion: false });
  t.after(() => environment.destroy());
  assert.equal(environment.getState().lampOn, false);
  environment.toggleLamp();
  environment.toggleCurtain();
  environment.toggleMonitor();
  environment.toggleSound();
  environment.toggleMotion();
  environment.setTimeOfDay('morning');
  environment.setSeason('winter');
  assert.deepEqual(environment.getState(), {
    season: 'winter', timeOfDay: 'morning', auto: false, lampOn: true,
    curtainOpen: false, monitorOn: false, soundOn: true, motionOn: false,
  });
  const restored = createEnvironment({ storage, now: () => clock, reducedMotion: false });
  t.after(() => restored.destroy());
  assert.deepEqual(restored.getState(), environment.getState());
  environment.toggleLamp();
  environment.setTimeOfDay('night');
  assert.equal(environment.getState().lampOn, false, 'manual off also survives a night selection');
  clock = new Date('2026-07-01T11:00:00Z');
  environment.setAuto();
  assert.deepEqual(environment.getState(), {
    season: 'summer', timeOfDay: 'evening', auto: true, lampOn: true,
    curtainOpen: false, monitorOn: false, soundOn: true, motionOn: false,
  });
  assert.equal(storage.saved().lampOverride, null);
  assert.equal(storage.saved().season, null);
  assert.equal(storage.saved().timeOfDay, null);
});

test('a minute tick advances Auto without overriding a manual lamp; manual scenery is frozen', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let clock = new Date('2026-12-01T07:29:00Z');
  const environment = createEnvironment({ storage: null, now: () => clock, reducedMotion: false });
  t.after(() => environment.destroy());
  const snapshots: StudioState[] = [];
  environment.subscribe((state) => snapshots.push(state));
  assert.equal(environment.getState().timeOfDay, 'afternoon');
  clock = new Date('2026-12-01T07:30:00Z');
  t.mock.timers.tick(60_000);
  assert.equal(environment.getState().timeOfDay, 'evening');
  assert.equal(environment.getState().lampOn, true);
  environment.toggleLamp();
  clock = new Date('2026-12-01T10:00:00Z');
  t.mock.timers.tick(60_000);
  assert.equal(environment.getState().timeOfDay, 'night');
  assert.equal(environment.getState().lampOn, false);
  environment.setSeason('spring');
  clock = new Date('2027-06-01T03:00:00Z');
  const frozen = environment.getState();
  t.mock.timers.tick(60_000);
  assert.deepEqual(environment.getState(), frozen);
  environment.setAuto();
  assert.equal(environment.getState().timeOfDay, 'noon');
  const count = snapshots.length;
  t.mock.timers.tick(60_000);
  assert.equal(snapshots.length, count, 'unchanged minutes do not rerender');
  environment.destroy();
  clock = new Date('2027-06-01T13:00:00Z');
  t.mock.timers.tick(120_000);
  assert.equal(snapshots.length, count, 'destroy stops clock and notifications');
});

test('bad storage data is ignored, valid fields are restored, and Auto ignores stale scenery', (t) => {
  for (const raw of ['broken', 'null', '[]', '{"version":7}', '{"version":1,"auto":false,"season":"monsoon","timeOfDay":"tomorrow","lampOverride":"false","motionOverride":"false"}']) {
    const environment = createEnvironment({ storage: memoryStorage(raw), now: noonInSpring, reducedMotion: false });
    t.after(() => environment.destroy());
    assert.equal(environment.getState().auto, true);
    assert.equal(environment.getState().season, 'spring');
    assert.equal(environment.getState().timeOfDay, 'noon');
    assert.equal(environment.getState().lampOn, false);
    assert.equal(environment.getState().motionOn, true);
  }
  const partial = createEnvironment({
    storage: memoryStorage(JSON.stringify({ version: 1, auto: false, season: 'winter', timeOfDay: 'bad', monitorOn: false })),
    now: noonInSpring, reducedMotion: false,
  });
  t.after(() => partial.destroy());
  assert.equal(partial.getState().season, 'winter');
  assert.equal(partial.getState().timeOfDay, 'noon');
  assert.equal(partial.getState().auto, false);
  assert.equal(partial.getState().monitorOn, false);
  const auto = createEnvironment({
    storage: memoryStorage(JSON.stringify({ version: 1, auto: true, season: 'winter', timeOfDay: 'night' })),
    now: noonInSpring, reducedMotion: false,
  });
  t.after(() => auto.destroy());
  assert.equal(auto.getState().season, 'spring');
  assert.equal(auto.getState().timeOfDay, 'noon');
});

test('unavailable local storage does not break controls', (t) => {
  const storage = {
    getItem() { throw new Error('storage disabled'); },
    setItem() { throw new Error('quota exceeded'); },
  };
  const environment = createEnvironment({ storage, now: noonInSpring, reducedMotion: false });
  t.after(() => environment.destroy());
  assert.doesNotThrow(() => { environment.toggleLamp(); environment.setSeason('winter'); environment.setAuto(); });
  assert.equal(environment.getState().auto, true);
});

test('reduced motion is the default until a deliberate stored override', (t) => {
  const storage = memoryStorage();
  const environment = createEnvironment({ storage, now: noonInSpring, reducedMotion: true });
  t.after(() => environment.destroy());
  assert.equal(environment.getState().motionOn, false);
  environment.toggleMotion();
  const restored = createEnvironment({ storage, now: noonInSpring, reducedMotion: true });
  t.after(() => restored.destroy());
  assert.equal(restored.getState().motionOn, true);
  restored.setAuto();
  assert.equal(restored.getState().motionOn, true, 'Auto does not change a deliberate accessibility preference');
});

test('snapshots and listeners cannot mutate internal state, and unsubscribe detaches', (t) => {
  const environment = createEnvironment({ storage: null, now: noonInSpring, reducedMotion: false });
  t.after(() => environment.destroy());
  environment.getState().season = 'winter';
  assert.equal(environment.getState().season, 'spring');
  let calls = 0;
  const unsubscribe = environment.subscribe((snapshot) => { calls++; snapshot.season = 'winter'; });
  const observed: Season[] = [];
  environment.subscribe((snapshot) => observed.push(snapshot.season));
  environment.setSeason('autumn');
  assert.equal(environment.getState().season, 'autumn');
  assert.equal(observed.at(-1), 'autumn');
  assert.equal(calls, 2, 'one initial notification and one state update');
  unsubscribe();
  environment.setTimeOfDay('night');
  assert.equal(calls, 2);
});

test('returning to a visible tab refreshes Auto, and destroy detaches visibility handling', (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const documentStub = Object.assign(new EventTarget(), { visibilityState: 'hidden' });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: documentStub });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else Reflect.deleteProperty(globalThis, 'document');
  });
  let clock = new Date('2026-04-01T03:00:00Z');
  const environment = createEnvironment({ storage: null, now: () => clock, reducedMotion: false });
  t.after(() => environment.destroy());
  clock = new Date('2026-04-01T13:00:00Z');
  documentStub.dispatchEvent(new Event('visibilitychange'));
  assert.equal(environment.getState().timeOfDay, 'noon');
  documentStub.visibilityState = 'visible';
  documentStub.dispatchEvent(new Event('visibilitychange'));
  assert.equal(environment.getState().timeOfDay, 'night');
  environment.destroy();
  clock = new Date('2026-04-02T03:00:00Z');
  documentStub.dispatchEvent(new Event('visibilitychange'));
  assert.equal(environment.getState().timeOfDay, 'night');
});
