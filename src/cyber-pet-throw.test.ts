import assert from 'node:assert/strict';
import test from 'node:test';
import { milkyBallAtRest, stepMilkyBall } from './cyber-pet-activity.ts';
import { throwMilkyBall, predictMilkyBallRest } from './cyber-pet-throw.ts';

const bounds = { left: .35, right: .66, top: .965, bottom: .99 };
const home = { x: .50, y: .977 };

test('longer throws carry greater speed while both directions follow the gesture', () => {
  const short = throwMilkyBall(home, { x: .025, y: 0 });
  const long = throwMilkyBall(home, { x: .12, y: 0 });
  const left = throwMilkyBall(home, { x: -.12, y: -.025 });
  assert.ok(short.vx > 0 && long.vx > short.vx * 1.5);
  assert.ok(left.vx < 0 && left.vy < 0);
  assert.ok(long.vx <= .3 && left.vh <= .13);
});

test('a zero-distance gesture stays at rest and extreme throws stay bounded', () => {
  assert.deepEqual(throwMilkyBall(home, { x: 0, y: 0 }), milkyBallAtRest(home));
  const throwState = throwMilkyBall(home, { x: 1e6, y: -1e6 });
  assert.ok(Math.hypot(throwState.vx, throwState.vy) <= .300001);
  let ball = throwState;
  for (let elapsed = 0; elapsed < 12 && !ball.resting; elapsed += .016) {
    ball = stepMilkyBall(ball, .016, bounds);
    assert.ok(ball.x >= bounds.left && ball.x <= bounds.right);
    assert.ok(ball.y >= bounds.top && ball.y <= bounds.bottom);
  }
  assert.equal(ball.resting, true);
});

test('the chase prediction converges to the actual bounded resting point', () => {
  const thrown = throwMilkyBall(home, { x: -.10, y: .04 });
  const predicted = predictMilkyBallRest(thrown, bounds);
  let actual = thrown;
  for (let step = 0; step < 1000 && !actual.resting; step++) actual = stepMilkyBall(actual, 1 / 60, bounds);
  assert.equal(actual.resting, true);
  assert.ok(Math.abs(predicted.x - actual.x) < .0001);
  assert.ok(Math.abs(predicted.y - actual.y) < .0001);
});
