import test from 'node:test';
import assert from 'node:assert/strict';
import { compositor } from './penthouse-effects-test-support.ts';
import type { ClimateState } from './cyber-climate.ts';

const day: ClimateState = { time: 'noon', season: 'summer', weather: 'clear', auto: false };

test('a clear daytime room stays idle without boat timers', t => {
  const f = compositor(t);
  f.effects.update(day);
  assert.equal(f.frames.size, 0);
  assert.equal(f.timers.size, 0);
});

test('a requested festival wakes the compositor and finishes without recurring work', t => {
  const f = compositor(t);
  f.effects.update(day);
  assert.equal(f.effects.startFireworks(), true);
  assert.equal(f.frames.size, 1);
  for (let tick = 0; tick < 1510; tick++) f.run(1000 + tick * 40);
  assert.equal(f.effects.fireworksActive, false);
  assert.equal(f.frames.size, 0);
  assert.equal(f.timers.size, 0);
  assert.deepEqual(f.fireworksChanges, [true, false]);
});

test('slow frames and workspace refreshes do not stretch the one-minute festival', t => {
  const f = compositor(t);
  f.effects.update(day); f.effects.startFireworks();
  f.run(1000);
  for (let tick = 1; tick <= 240; tick++) {
    if (tick % 7 === 0) f.effects.setWorkspace({ monitor: true, lamp: tick % 2 === 0 });
    f.run(1000 + tick * 250);
  }
  assert.equal(f.effects.fireworksActive, false);
  assert.equal(f.frames.size, 0);
  assert.deepEqual(f.fireworksChanges, [true, false]);
});

test('hidden and destroyed scenes cancel fireworks and reject stale frames', t => {
  const f = compositor(t);
  f.effects.update(day);
  f.effects.startFireworks();
  const stale = [...f.frames.values()][0];
  f.page.hidden = true; f.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.effects.fireworksActive, false);
  stale(1000); assert.equal(f.frames.size, 0);
  assert.equal(f.effects.startFireworks(), false);
  f.page.hidden = false; f.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.effects.fireworksActive, false);
  assert.equal(f.frames.size, 0);
  f.effects.startFireworks();
  f.effects.destroy();
  assert.equal(f.effects.fireworksActive, false);
  assert.equal(f.effects.startFireworks(), false);
  stale(2000); assert.equal(f.frames.size, 0);
});

test('reduced motion and still mode cancel fireworks and refuse new playback', t => {
  const f = compositor(t);
  f.effects.update(day); f.effects.startFireworks(); f.run(1000); f.run(1040);
  f.effects.setAnimated(false);
  assert.equal(f.effects.fireworksActive, false);
  assert.equal(f.effects.startFireworks(), false);
  assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
  f.effects.setAnimated(true);
  assert.equal(f.effects.fireworksActive, false);
  f.effects.startFireworks();
  f.media.matches = true; f.media.dispatchEvent(new Event('change'));
  assert.equal(f.effects.fireworksActive, false);
  assert.equal(f.effects.startFireworks(), false);
  assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
});

test('a stop action immediately clears fireworks and notifies controls only once', t => {
  const f = compositor(t);
  f.effects.update(day); f.effects.startFireworks();
  const before = f.draws();
  f.effects.stopFireworks(); f.effects.stopFireworks();
  assert.equal(f.effects.fireworksActive, false);
  assert.equal(f.frames.size, 0);
  assert.ok(f.draws() > before);
  assert.deepEqual(f.fireworksChanges, [true, false]);
});

test('sustained missed frames lower density within the live compositor and expose passive diagnostics', t => {
  const f = compositor(t);
  f.effects.update({ ...day, weather: 'rain' });
  for (let tick = 0; tick < 200; tick++) f.run(1000 + tick * 50);
  assert.equal(f.effects.effectDetail, 'quiet');
  assert.equal(f.canvas.dataset.effectDetail, 'quiet');
  assert.equal(f.frames.size, 1);
  f.effects.setAnimated(false);
  assert.equal(f.frames.size, 0);
});
