import assert from 'node:assert/strict';
import test from 'node:test';
import { planMilkyRestCycle, milkyRestTransitionHold, milkyStandHold, milkyExplicitRestHold } from './cyber-pet-rest.ts';

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test('rest plans use only delivered poses and vanish when no rest art exists', () => {
  const random = seeded(21);
  for (let i = 0; i < 200; i++) {
    assert.deepEqual(planMilkyRestCycle({ sit: false, drowsy: false, sleep: false }, random), []);
    const sitOnly = planMilkyRestCycle({ sit: true, drowsy: false, sleep: false }, random);
    assert.ok(sitOnly.every((stage) => stage.pose === 'sit'));
    const noSit = planMilkyRestCycle({ sit: false, drowsy: true, sleep: true }, random);
    assert.ok(noSit.every((stage) => stage.pose !== 'sit'), 'a missing sit pose is flopped past, not faked');
  }
});

test('the full cycle sits, lies and naps in order, with calm bounded holds and real variety', () => {
  const random = seeded(77);
  let empty = 0;
  let naps = 0;
  let sits = 0;
  const order = ['sit', 'drowsy', 'sleep'];
  for (let i = 0; i < 500; i++) {
    const plan = planMilkyRestCycle({ sit: true, drowsy: true, sleep: true }, random);
    const indices = plan.map((stage) => order.indexOf(stage.pose));
    assert.deepEqual([...indices].sort((a, b) => a - b), indices, 'postures only deepen within one cycle');
    assert.ok(new Set(indices).size === indices.length, 'no repeated posture in one cycle');
    for (const stage of plan) {
      if (stage.pose === 'sleep') assert.ok(stage.hold >= 14000 && stage.hold < 30000);
      else assert.ok(stage.hold >= 6000 && stage.hold < 15000);
    }
    if (plan.length === 0) empty++;
    if (plan.some((stage) => stage.pose === 'sleep')) naps++;
    if (plan.some((stage) => stage.pose === 'sit')) sits++;
  }
  assert.ok(empty > 50, 'walking remains part of the rhythm');
  assert.ok(sits > 150, 'sitting is seen naturally, not after many minutes');
  assert.ok(naps > 80, 'napping occurs regularly');
  assert.ok(naps < 400, 'napping is not constant');
});

test('transition, stand and explicit holds stay within their gentle bounds', () => {
  const random = seeded(3);
  for (let i = 0; i < 120; i++) {
    const sitdown = milkyRestTransitionHold('sitdown', random);
    assert.ok(sitdown >= 320 && sitdown < 480);
    const wake = milkyRestTransitionHold('wake', random);
    assert.ok(wake >= 460 && wake < 680);
    const stand = milkyStandHold(random);
    assert.ok(stand >= 180 && stand < 340);
    assert.ok(milkyExplicitRestHold('sit', random) >= 16000);
    assert.ok(milkyExplicitRestHold('drowsy', random) >= 12000);
    const nap = milkyExplicitRestHold('sleep', random);
    assert.ok(nap >= 22000 && nap < 38000);
  }
});
