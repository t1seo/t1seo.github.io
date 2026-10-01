import assert from 'node:assert/strict';
import test from 'node:test';
import { createMilkyWalk, sampleMilkyWalk, milkyDistance, milkyGaitFrame, milkyGaitStride, milkyStride, milkyCanContinue, milkyDepthScale } from './cyber-pet-motion.ts';

test('walks accelerate, travel evenly and stop exactly at the requested paw position', () => {
  const walk = createMilkyWalk({ x: .55, y: .9 }, { x: .62, y: .92 }, .055);
  let distance = 0;
  for (let i = 0; i <= 100; i++) {
    const sample = sampleMilkyWalk(walk, walk.duration * i / 100);
    assert.ok(sample.distance >= distance);
    assert.ok(sample.distance <= walk.distance);
    distance = sample.distance;
  }
  assert.equal(sampleMilkyWalk(walk, 0).speed, 0);
  assert.ok(Math.abs(sampleMilkyWalk(walk, walk.duration / 2).speed - .055) < 1e-8);
  assert.deepEqual(sampleMilkyWalk(walk, walk.duration * 2).position, walk.target);
  assert.equal(sampleMilkyWalk(walk, walk.duration).speed, 0);
  assert.equal(sampleMilkyWalk(walk, walk.duration).done, true);
});

test('acceleration eases in and out without a jerk at the ramp boundaries or a stop pop', () => {
  const walk = createMilkyWalk({ x: .5, y: .9 }, { x: .6, y: .9 }, .06);
  const speedAt = (time: number) => sampleMilkyWalk(walk, walk.duration * time).speed;
  let previous = 0;
  for (let i = 1; i <= 17; i++) {
    const speed = speedAt(i / 100);
    assert.ok(speed >= previous, 'speed rises monotonically while accelerating');
    previous = speed;
  }
  // Smoothstep ramps: nearly zero acceleration at both ends of each ramp.
  assert.ok(speedAt(.01) < speedAt(.17) * .05, 'departure starts gently, not with a linear jolt');
  assert.ok(Math.abs(speedAt(.17) - speedAt(.5)) < 1e-9, 'ramp blends into the cruise speed');
  assert.ok(speedAt(.99) < speedAt(.5) * .05, 'arrival fades out instead of stopping abruptly');
});

test('same-heading interruption starts at the current location and keeps the current speed', () => {
  const first = createMilkyWalk({ x: .5, y: .9 }, { x: .6, y: .9 }, .06);
  const current = sampleMilkyWalk(first, first.duration * .45);
  const next = createMilkyWalk(current.position, { x: .67, y: .9 }, .06, current.speed);
  assert.deepEqual(sampleMilkyWalk(next, 0).position, current.position);
  assert.ok(Math.abs(sampleMilkyWalk(next, 0).speed - current.speed) < 1e-8);
  assert.equal(milkyCanContinue(first, current.position, next.target), true);
  assert.equal(milkyCanContinue(first, current.position, { x: .4, y: .9 }), false);
  assert.equal(milkyCanContinue(first, current.position, current.position), false);
});

test('gait advances by phase and one full cycle matches the measured photo-pose stance travel', () => {
  const stride = milkyStride(.1);
  assert.ok(Math.abs(stride - .064) < 1e-8);
  assert.equal(milkyGaitFrame(0), 0);
  assert.equal(milkyGaitFrame(.5), 4);
  assert.equal(milkyGaitFrame(1), 0);
  assert.equal(milkyGaitFrame(2.875), 7);
  assert.equal(milkyGaitFrame(Number.NaN), 0);
});

test('the stride is fitted so a walk started on the standing-like phase 4 also ends on it', () => {
  const nominal = milkyStride(.09);
  for (const distance of [nominal * .93, nominal * 2.1, nominal * 3.4, .1]) {
    const stride = milkyGaitStride(nominal, distance, .5);
    assert.ok(stride >= nominal * .86 - 1e-12 && stride <= nominal * 1.16 + 1e-12, 'cadence changes stay small');
    if (stride !== nominal) assert.equal(milkyGaitFrame(.5 + distance / stride), 4, `distance ${distance} lands on phase 4`);
  }
  // A continuation keeps its accumulated phase and still lands on the standing stance.
  const carried = milkyGaitStride(nominal, nominal * 1.7, 1.25);
  if (carried !== nominal) assert.equal(milkyGaitFrame(1.25 + nominal * 1.7 / carried), 4);
  // Short shuffles and impossible fits keep the honest nominal stride instead of distorting cadence.
  assert.equal(milkyGaitStride(nominal, nominal * .3, .5), nominal);
  assert.equal(milkyGaitStride(nominal, 0, .5), nominal);
  assert.equal(milkyGaitStride(nominal, nominal * 1.5, .5) === nominal || Math.abs(milkyGaitStride(nominal, nominal * 1.5, .5) / nominal - 1) <= .16, true);
  assert.equal(milkyGaitStride(0, .1, .5), .008);
});

test('depth uses scene aspect, with modest scale change and stationary plans without invalid numbers', () => {
  assert.ok(milkyDistance({ x: 0, y: 0 }, { x: 0, y: .1 }) < .06);
  assert.equal(milkyDepthScale(.5), .91);
  assert.equal(milkyDepthScale(1), 1);
  const idle = createMilkyWalk({ x: .6, y: .9 }, { x: .6, y: .9 }, .05);
  assert.deepEqual(sampleMilkyWalk(idle, 0), { position: idle.target, distance: 0, speed: 0, done: true });
});

test('long walks reach and leave their normal stride within a brief ramp rather than lingering on held feet', () => {
  // Given a long room crossing and a normal cruise speed.
  const walk = createMilkyWalk({ x: .4, y: .95 }, { x: .86, y: .92 }, .06);
  // When sampling shortly after departure and shortly before arrival.
  const departure = sampleMilkyWalk(walk, 240);
  const arrival = sampleMilkyWalk(walk, walk.duration - 240);
  // Then neither end stretches a slow held-paw pose across a large fraction of the route.
  assert.ok(Math.abs(departure.speed - .06) < 1e-8);
  assert.ok(Math.abs(arrival.speed - .06) < 1e-8);
});

test('short and long ramp plans retain their requested speed and exact distance when momentum carries through', () => {
  for (const distance of [.009, .03, .4]) {
    for (const carriedSpeed of [0, .025, .06]) {
      const walk = createMilkyWalk({ x: .4, y: .95 }, { x: .4 + distance, y: .95 }, .06, carriedSpeed);
      assert.ok(walk.ramp * walk.duration <= 240 + 1e-9);
      assert.ok(Math.abs(sampleMilkyWalk(walk, 0).speed - carriedSpeed) < 1e-9);
      assert.ok(Math.abs(sampleMilkyWalk(walk, walk.duration / 2).speed - .06) < 1e-9);
      assert.equal(sampleMilkyWalk(walk, walk.duration).distance, walk.distance);
    }
  }
});
