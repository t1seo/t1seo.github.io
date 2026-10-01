import assert from 'node:assert/strict';
import test from 'node:test';
import { createMilkyWalk, sampleMilkyWalk, milkyDistance, milkyGaitFrame, milkyGaitStride, milkyGaitFinishAdjustment, milkyGaitPhase, milkyStride, milkyCanContinue, milkyDepthScale } from './cyber-pet-motion.ts';

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

test('the finish adjustment ends walks inside the support frame within a bounded cadence change', () => {
  const inside = (phase: number, frames: number) => {
    const fraction = ((phase % 1) + 1) % 1;
    return fraction > .5 + 1e-6 && fraction < .5 + 1 / frames - 1e-6;
  };
  // The Seoul-studio body width at the near floor gives nominal stride .050688; the .066
  // keyboard route is ~1.302 cycles, inside the stride-fit gap (1.16–1.72), so without the
  // adjustment the walk froze mid-swing on frame 6 and popped to the standing silhouette.
  const nominal = milkyStride(.0792);
  assert.equal(milkyGaitStride(nominal, .066, .5), nominal, 'the stride fit alone cannot absorb this route');
  const adjust = milkyGaitFinishAdjustment(.5, .066, nominal, 8);
  const end = milkyGaitPhase(.5, .066, .066, nominal, adjust);
  assert.equal(milkyGaitFrame(end), 4, 'the walk now ends on the standing-like stance');
  assert.ok(inside(end, 8), 'the endpoint sits inside frame 4, not on its boundary, so the stance is displayed');
  // The adjustment eases in: none at departure, all of it by arrival, monotone in between.
  assert.equal(milkyGaitPhase(.5, 0, .066, nominal, adjust), .5);
  let previous = .5;
  for (let i = 1; i <= 40; i++) {
    const phase = milkyGaitPhase(.5, .066 * i / 40, .066, nominal, adjust);
    assert.ok(phase > previous, 'phase advances monotonically under the capped adjustment');
    previous = phase;
  }
  // A fitted stride ends exactly ON the frame boundary, so it too takes the small inward
  // nudge that gives the support stance real screen time while decelerating.
  const fitted = milkyGaitStride(nominal, nominal * 2.1, .5);
  const fittedEnd = milkyGaitPhase(.5, nominal * 2.1, nominal * 2.1, fitted,
    milkyGaitFinishAdjustment(.5, nominal * 2.1, fitted, 8));
  assert.equal(milkyGaitFrame(fittedEnd), 4);
  assert.ok(inside(fittedEnd, 8), 'a fitted walk also finishes inside the support frame');
  // The four-frame trot aims inside its grounded diagonal-support frame 2.
  const trotEnd = milkyGaitPhase(.5, .12, .12, nominal, milkyGaitFinishAdjustment(.5, .12, nominal, 4));
  assert.equal(milkyGaitFrame(trotEnd, 4), 2);
  assert.ok(inside(trotEnd, 4), 'a trot leg finishes inside its support frame');
  // Short shuffles receive only the bounded partial adjustment: the last steps may shorten
  // or lengthen like a real stopping dog's, never freeze into a glide or a fast paddle.
  assert.ok(Math.abs(milkyGaitFinishAdjustment(.5, nominal * .355, nominal)) <= .35 * .355 / 1.5 + 1e-12);
  assert.equal(milkyGaitFinishAdjustment(.5, 0, nominal), 0);
  assert.equal(milkyGaitFinishAdjustment(Number.NaN, .1, nominal), 0);
  assert.equal(milkyGaitPhase(.5, .01, 0, nominal, .2), .5 + .01 / nominal, 'a degenerate plan ignores the adjustment');
});

test('carried phases remain continuous and bounded even when support-frame alignment is impossible', () => {
  const stride = .05;
  for (const frames of [4, 8]) {
    for (let phase = 0; phase < 2; phase += .125) {
      for (const cycles of [.15, .3, .7, 1.3, 2.8]) {
        const distance = cycles * stride;
        const adjustment = milkyGaitFinishAdjustment(phase, distance, stride, frames);
        let previous = milkyGaitPhase(phase, 0, distance, stride, adjustment);
        assert.equal(previous, phase, 'retarget starts at the carried phase without a jump');
        for (let step = 1; step <= 100; step++) {
          const next = milkyGaitPhase(phase, distance * step / 100, distance, stride, adjustment);
          const relativeRate = (next - previous) / (cycles / 100);
          assert.ok(relativeRate >= .65 - 1e-10 && relativeRate <= 1.35 + 1e-10,
            'phase keeps advancing within the cadence limit');
          previous = next;
        }
      }
    }
  }
  const shortDistance = .3 * stride;
  const partial = milkyGaitFinishAdjustment(.8, shortDistance, stride);
  const endpoint = milkyGaitPhase(.8, shortDistance, shortDistance, stride, partial);
  assert.notEqual(milkyGaitFrame(endpoint), 4, 'a short carried route preserves the cap instead of forcing a stance');
  assert.ok(Math.abs(partial) <= .35 * .3 / 1.5 + 1e-12);
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
