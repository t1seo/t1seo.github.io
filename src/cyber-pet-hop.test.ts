import assert from 'node:assert/strict';
import test from 'node:test';
import { sampleMilkyBedHop } from './cyber-pet-hop.ts';

const plan = { origin: { x: .795, y: .96 }, target: { x: 1440 / 1672, y: 865 / 941 }, height: .01 };

test('bed hop holds preparation on the floor and follows a low arc before an exact grounded landing', () => {
  const start = sampleMilkyBedHop(plan, 0);
  const preparation = sampleMilkyBedHop(plan, 179);
  const apex = sampleMilkyBedHop(plan, 420);
  const landing = sampleMilkyBedHop(plan, 660);
  const done = sampleMilkyBedHop(plan, 900);
  assert.equal(start.stage, 'anticipation');
  assert.deepEqual(preparation.position, plan.origin);
  assert.equal(preparation.lift, 0);
  assert.equal(apex.stage, 'flight');
  assert.equal(apex.lift, plan.height);
  assert.ok(apex.position.x > plan.origin.x && apex.position.x < plan.target.x);
  assert.ok(apex.shadowScale < 1 && apex.shadowOpacity < 1);
  assert.equal(landing.stage, 'landing');
  assert.deepEqual(landing.position, plan.target);
  assert.equal(landing.lift, 0);
  assert.equal(done.stage, 'done');
  assert.equal(done.shadowScale, 1);
  assert.equal(done.shadowOpacity, 1);
});

test('hop samples keep a monotonic ground path and bounded lift without overshoot at low frame rates', () => {
  let previousX = plan.origin.x;
  for (const elapsed of [-20, 0, 90, 180, 280, 480, 650, 660, 760, 820, 10000]) {
    const sample = sampleMilkyBedHop(plan, elapsed);
    assert.ok(sample.position.x >= previousX && sample.position.x <= plan.target.x);
    assert.ok(sample.lift >= 0 && sample.lift <= plan.height);
    previousX = sample.position.x;
  }
});
