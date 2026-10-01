import assert from 'node:assert/strict';
import test from 'node:test';
import {
  planMilkyBedWakeStretch, planMilkyWalkArrival,
  type MilkyBedWakeOptions, type MilkyWalkArrivalOptions,
} from './cyber-pet-transitions.ts';

const arrival = {
  enabled: true, reducedMotion: false, cameraIdleReady: true,
  attendShipped: false, attendReady: false,
} as const satisfies MilkyWalkArrivalOptions;
const wake = {
  enabled: true, onBed: true, fromSleep: true,
  playBowReady: true, reducedMotion: false,
} as const satisfies MilkyBedWakeOptions;

test('walk arrival uses the existing camera idle when optional attend art is absent', () => {
  // Given only the shipped camera idle is available.
  const options = arrival;
  // When the walk finishes.
  const plan = planMilkyWalkArrival(options, () => .5);
  // Then the same floor point can hold the camera pose briefly.
  assert.deepEqual(plan, { pose: 'idle', gaze: 'camera', hold: 330 });
});

test('walk arrival chooses attend only when its shipped art is decoded', () => {
  // Given the optional pose is delivered and ready.
  const options = { ...arrival, attendShipped: true, attendReady: true };
  // When the walk finishes.
  const plan = planMilkyWalkArrival(options, () => .5);
  // Then the optional glance replaces the camera idle hold.
  assert.deepEqual(plan, { pose: 'attend', gaze: 'camera', hold: 330 });
});

for (const flags of [
  { attendShipped: true, attendReady: false },
  { attendShipped: false, attendReady: true },
]) {
  test(`walk arrival falls back to idle when attend shipped=${flags.attendShipped}, ready=${flags.attendReady}`, () => {
    // Given attend cannot be safely displayed.
    const options = { ...arrival, ...flags };
    // When the walk finishes.
    const plan = planMilkyWalkArrival(options, () => 0);
    // Then the delivered idle remains the fallback.
    assert.equal(plan?.pose, 'idle');
  });
}

for (const [condition, flags] of [
  ['disabled', { enabled: false }],
  ['reduced motion', { reducedMotion: true }],
  ['missing camera idle', { cameraIdleReady: false }],
] as const) {
  test(`walk arrival skips the extra pose when ${condition}`, () => {
    // Given the transition is unavailable or disallowed.
    const options = { ...arrival, attendShipped: true, attendReady: true, ...flags };
    // When the walk finishes.
    const plan = planMilkyWalkArrival(options);
    // Then no extra hold is scheduled.
    assert.equal(plan, undefined);
  });
}

test('bed wake stretches with the existing bow independently of optional wake artwork', () => {
  // Given a sleeping dog on its bed with its bow already decoded.
  const options = wake;
  // When the nap ends.
  const plan = planMilkyBedWakeStretch(options, () => .5);
  // Then the plan holds the registered bow without a movement target.
  assert.deepEqual(plan, { pose: 'play-bow', motion: 'stretching', hold: 520 });
});

for (const [condition, flags] of [
  ['disabled', { enabled: false }],
  ['off the bed', { onBed: false }],
  ['not asleep', { fromSleep: false }],
  ['missing bow art', { playBowReady: false }],
  ['reduced motion', { reducedMotion: true }],
] as const) {
  test(`bed wake skips the stretch when ${condition}`, () => {
    // Given one prerequisite is absent.
    const options = { ...wake, ...flags };
    // When waking is requested.
    const plan = planMilkyBedWakeStretch(options);
    // Then the existing wake behavior needs no added stage.
    assert.equal(plan, undefined);
  });
}

test('transition holds remain bounded at the random source limits', () => {
  // Given samples at and beyond either end of the unit interval.
  const samples = [-1, 0, .5, 1, 2];
  // When each eligible transition is planned.
  const plans = samples.map((sample) => ({
    arrival: planMilkyWalkArrival(arrival, () => sample),
    wake: planMilkyBedWakeStretch(wake, () => sample),
  }));
  // Then neither transition can become a long pause.
  for (const plan of plans) {
    assert.ok(plan.arrival && plan.arrival.hold >= 240 && plan.arrival.hold <= 420);
    assert.ok(plan.wake && plan.wake.hold >= 420 && plan.wake.hold <= 620);
  }
});
