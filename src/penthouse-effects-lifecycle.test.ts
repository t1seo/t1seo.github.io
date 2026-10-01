import test from 'node:test';
import assert from 'node:assert/strict';
import { compositor } from './penthouse-effects-test-support.ts';
import type { ClimateState } from './cyber-climate.ts';

const day: ClimateState = { time: 'noon', season: 'summer', weather: 'clear', auto: false };

test('a rare boat wakes one idle daytime compositor and returns it to sleep after crossing', t => {
  const f = compositor(t);
  f.effects.update(day);
  assert.equal(f.frames.size, 0);
  assert.equal(f.timers.size, 1);
  const first = [...f.timers.values()][0];
  assert.ok(first.delay >= 18000 && first.delay <= 30000);
  f.wakeBoat();
  assert.equal(f.frames.size, 1);
  for (let tick = 0; tick < 1100; tick++) f.run(1000 + tick * 40);
  assert.equal(f.frames.size, 0);
  assert.equal(f.timers.size, 1);
  const next = [...f.timers.values()][0];
  assert.ok(next.delay >= 95000 && next.delay <= 150000);
});

test('hidden and destroyed scenes cancel boat wakes without allowing stale callbacks to restart', t => {
  const f = compositor(t);
  f.effects.update(day);
  const stale = [...f.timers.values()][0];
  f.page.hidden = true; f.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.timers.size, 0);
  stale.callback(); assert.equal(f.frames.size, 0);
  f.page.hidden = false; f.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.timers.size, 1);
  f.effects.destroy();
  assert.equal(f.timers.size, 0);
  stale.callback(); assert.equal(f.frames.size, 0);
});

test('reduced motion and still mode remove an active boat and every pending wake', t => {
  const f = compositor(t);
  f.effects.update(day); f.wakeBoat(); f.run(1000); f.run(1040);
  f.effects.setAnimated(false);
  assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
  f.effects.setAnimated(true);
  assert.equal(f.timers.size, 1);
  f.media.matches = true; f.media.dispatchEvent(new Event('change'));
  assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
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
