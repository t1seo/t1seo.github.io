import assert from 'node:assert/strict';
import test from 'node:test';
import { planMilkyIdleMoment, milkySniffHold, milkyGreetHold, MILKY_BLINK_GAP } from './cyber-pet-life.ts';

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test('idle moments only use delivered poses and vanish entirely when no optional art exists', () => {
  const random = seeded(11);
  assert.equal(planMilkyIdleMoment({ blink: false, attend: false, sniff: false }, random), undefined);
  for (let i = 0; i < 60; i++) {
    const onlyBlink = planMilkyIdleMoment({ blink: true, attend: false, sniff: false }, random);
    assert.equal(onlyBlink?.kind, 'blink');
    const noBlink = planMilkyIdleMoment({ blink: false, attend: true, sniff: true }, random);
    assert.ok(noBlink && (noBlink.kind === 'attend' || noBlink.kind === 'sniff'));
    assert.equal(noBlink.repeat, false, 'only a blink may repeat');
  }
});

test('moments vary, stay within calm bounds and blinks stay far shorter than glances', () => {
  const random = seeded(97);
  const kinds = new Set<string>();
  let doubles = 0;
  for (let i = 0; i < 400; i++) {
    const moment = planMilkyIdleMoment({ blink: true, attend: true, sniff: true }, random)!;
    kinds.add(moment.kind);
    assert.ok(moment.delay >= 2600 && moment.delay < 8200, 'a rest stays still for a while first');
    if (moment.kind === 'blink') {
      assert.ok(moment.hold >= 120 && moment.hold < 180);
      if (moment.repeat) doubles++;
    } else {
      assert.ok(moment.hold >= 700 && moment.hold < 1600);
      assert.equal(moment.repeat, false);
    }
  }
  assert.deepEqual([...kinds].sort(), ['attend', 'blink', 'sniff']);
  assert.ok(doubles > 10, 'double blinks occur');
  assert.ok(doubles < 200, 'double blinks stay occasional');
});

test('anticipation holds are brief and bounded', () => {
  const random = seeded(5);
  for (let i = 0; i < 100; i++) {
    const sniff = milkySniffHold(random);
    assert.ok(sniff >= 520 && sniff < 940);
    const greet = milkyGreetHold(random);
    assert.ok(greet >= 360 && greet < 520);
  }
  assert.ok(MILKY_BLINK_GAP > 60 && MILKY_BLINK_GAP < 250);
});
