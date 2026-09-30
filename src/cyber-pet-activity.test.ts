import assert from 'node:assert/strict';
import test from 'node:test';
import { planMilkyMeal, planMilkyPlay, planMilkyRun, milkyBallAtRest, milkyNudgeBall, stepMilkyBall, type MilkyBallState } from './cyber-pet-activity.ts';

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
const bounds = { left: .40, right: .745, top: .83, bottom: .915 };

test('meals alternate lowered bites with brief chewing lifts and end with a raised pause', () => {
  const random = seeded(41);
  for (let i = 0; i < 200; i++) {
    const meal = planMilkyMeal(random);
    assert.ok(meal.length >= 6 && meal.length <= 10);
    assert.equal(meal[0].pose, 'eat-low');
    assert.equal(meal.at(-1)!.pose, 'eat-lift');
    for (const [index, bite] of meal.entries()) {
      assert.equal(bite.pose, index % 2 === 0 ? 'eat-low' : 'eat-lift', 'strict alternation');
      assert.ok(bite.hold >= 500 && bite.hold < 2700);
    }
    assert.ok(meal.at(-1)!.hold >= 900, 'the meal ends on a raised-head pause');
  }
});

test('play and run plans stay short and calm rather than hyperactive', () => {
  const random = seeded(19);
  for (let i = 0; i < 200; i++) {
    const play = planMilkyPlay(random);
    assert.ok(play.rounds >= 1 && play.rounds <= 2);
    assert.ok(play.bowHold >= 520 && play.bowHold < 900);
    assert.ok(play.reachHold >= 420 && play.reachHold < 720);
    const run = planMilkyRun(random);
    assert.ok(run.legs >= 2 && run.legs <= 3);
    assert.ok(run.cadence >= 1.32 && run.cadence < 1.48, 'a brisk but honest cadence');
  }
});

test('a nudged ball hops, bounces, stays inside the floor and never sinks below it', () => {
  const random = seeded(7);
  let state = milkyNudgeBall(milkyBallAtRest({ x: .58, y: .865 }), 1, random);
  assert.ok(state.vx >= .085 && state.vx < .15);
  assert.ok(state.vh >= .16 && state.vh < .27);
  let peak = 0;
  for (let i = 0; i < 60 / .016 && !state.resting; i++) {
    state = stepMilkyBall(state, .016, bounds);
    assert.ok(state.h >= 0, 'never below the floor');
    assert.ok(state.x >= bounds.left - 1e-9 && state.x <= bounds.right + 1e-9, 'inside the visible floor');
    assert.ok(state.y >= bounds.top - 1e-9 && state.y <= bounds.bottom + 1e-9);
    peak = Math.max(peak, state.h);
  }
  assert.ok(peak > .01, 'the nudge visibly lifts the ball');
  assert.ok(state.resting, 'the ball comes to rest');
  assert.deepEqual(stepMilkyBall(state, .016, bounds), state, 'a resting ball stays put');
});

test('settling is dt-robust: 60, 30, 20 and 10 fps all come to rest with no fixed-point micro-bounce', () => {
  for (const dt of [1 / 60, 1 / 30, .05, .1]) {
    const random = seeded(505);
    let state: MilkyBallState = milkyNudgeBall(milkyBallAtRest({ x: .58, y: .865 }), 1, random);
    let elapsed = 0;
    while (!state.resting && elapsed < 60) {
      state = stepMilkyBall(state, dt, bounds);
      assert.ok(state.h >= 0);
      elapsed += dt;
    }
    assert.ok(state.resting, `dt=${dt}: the ball rests instead of micro-bouncing forever`);
    assert.ok(elapsed < 20, `dt=${dt}: rest arrives promptly (took ${elapsed.toFixed(1)}s)`);
    assert.equal(state.vh, 0);
    assert.equal(state.vx, 0);
  }
});

test('a hard wall hit reflects the ball back inside instead of escaping the crop', () => {
  let state: MilkyBallState = { x: .74, y: .87, h: 0, vx: .3, vy: 0, vh: 0, resting: false };
  for (let i = 0; i < 600; i++) {
    state = stepMilkyBall(state, .016, bounds);
    assert.ok(state.x <= bounds.right + 1e-9);
  }
  assert.ok(state.resting);
  assert.ok(state.x < bounds.right, 'the ball rolled back off the wall');
});
