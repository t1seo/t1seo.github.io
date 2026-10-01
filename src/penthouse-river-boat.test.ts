import test from 'node:test';
import assert from 'node:assert/strict';
import { RiverBoat, riverBoatPose, type RiverBoatSchedule } from './penthouse-river-boat.ts';

function clock() {
  const requests: { callback: () => void; delayMs: number; cancelled: boolean }[] = [];
  const schedule: RiverBoatSchedule = (callback, delayMs) => {
    const request = { callback, delayMs, cancelled: false };
    requests.push(request);
    return () => { request.cancelled = true; };
  };
  return { schedule, requests };
}

function painting() {
  const points: { x: number; y: number }[] = [];
  const reflections: { alpha: number; width: number; height: number }[] = [];
  const ctx = {
    globalAlpha: 1, lineWidth: 1, fillStyle: '', strokeStyle: '',
    save() {}, restore() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {},
    moveTo(x: number, y: number) { points.push({ x, y }); },
    lineTo(x: number, y: number) { points.push({ x, y }); },
    fillRect(x: number, y: number, width: number, height: number) {
      points.push({ x, y }, { x: x + width, y: y + height });
      if (y > 459) reflections.push({ alpha: ctx.globalAlpha, width, height });
    },
  };
  return { ctx, points, reflections };
}

test('one delayed wake starts a crossing without a polling animation', () => {
  const timer = clock(); let wakes = 0;
  const boat = new RiverBoat(() => { wakes++; }, { schedule: timer.schedule, random: () => .5 });
  boat.setEnabled(true); boat.setEnabled(true);
  assert.equal(timer.requests.length, 1);
  assert.equal(timer.requests[0]?.delayMs, 24000);
  assert.equal(boat.active, false);
  timer.requests[0]?.callback();
  assert.equal(wakes, 1);
  assert.equal(boat.active, true);
});

test('a finished crossing sleeps for a longer irregular interval', () => {
  const timer = clock();
  const boat = new RiverBoat(() => {}, { schedule: timer.schedule, random: () => .5 });
  boat.setEnabled(true); timer.requests[0]?.callback();
  boat.advance(42);
  assert.equal(boat.active, false);
  assert.equal(timer.requests.length, 2);
  assert.equal(timer.requests[1]?.delayMs, 122500);
});

test('hidden or still mode cancels pending wakes including late callbacks', () => {
  const timer = clock(); let wakes = 0;
  const boat = new RiverBoat(() => { wakes++; }, { schedule: timer.schedule });
  boat.setEnabled(true);
  boat.setEnabled(false); timer.requests[0]?.callback();
  assert.equal(timer.requests[0]?.cancelled, true);
  assert.equal(wakes, 0);
  assert.equal(boat.active, false);
});

test('disabling an active crossing leaves no boat or recurring timeout', () => {
  const timer = clock(), paint = painting();
  const boat = new RiverBoat(() => {}, { schedule: timer.schedule });
  boat.setEnabled(true); timer.requests[0]?.callback(); boat.advance(10);
  boat.setEnabled(false); boat.advance(100); boat.draw(paint.ctx, 1);
  assert.equal(boat.active, false);
  assert.equal(timer.requests.length, 1);
  assert.deepEqual(paint.points, []);
});

test('destroy prevents old callbacks and re-enabling from resurrecting the boat', () => {
  const timer = clock(); let wakes = 0;
  const boat = new RiverBoat(() => { wakes++; }, { schedule: timer.schedule });
  boat.setEnabled(true);
  boat.destroy(); boat.setEnabled(true); timer.requests[0]?.callback();
  assert.equal(wakes, 0);
  assert.equal(boat.active, false);
  assert.equal(timer.requests.length, 1);
  assert.equal(timer.requests[0]?.cancelled, true);
});

test('crossing poses stay on the river with soft entrances and exits in both directions', () => {
  for (const direction of [1, -1] as const) {
    assert.equal(riverBoatPose(0, direction).opacity, 0);
    assert.equal(riverBoatPose(42, direction).opacity, 0);
    for (let seconds = 0; seconds <= 42; seconds += .25) {
      const pose = riverBoatPose(seconds, direction);
      assert.ok(pose.x >= 210 && pose.x <= 1490);
      assert.ok(pose.y >= 457 && pose.y <= 459);
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
    }
  }
  assert.equal(riverBoatPose(21).opacity, 1);
  assert.ok(riverBoatPose(10).x < riverBoatPose(30).x);
  assert.ok(riverBoatPose(10, -1).x > riverBoatPose(30, -1).x);
});

test('night reflections remain small and broken within the water; low detail reduces their count', () => {
  const timer = clock(), day = painting(), night = painting(), low = painting();
  const boat = new RiverBoat(() => {}, { schedule: timer.schedule, random: () => .5 });
  boat.setEnabled(true); timer.requests[0]?.callback(); boat.advance(21);
  boat.draw(day.ctx, 0); boat.draw(night.ctx, 1); boat.draw(low.ctx, 1, .4);
  assert.equal(day.reflections.length, 0);
  assert.equal(night.reflections.length, 6);
  assert.equal(low.reflections.length, 3);
  assert.ok(night.reflections.every(mark => mark.alpha > 0 && mark.alpha < .3 && mark.width <= 9 && mark.height < 1));
  assert.ok(night.points.every(point => point.y >= 433 && point.y <= 495));
});
