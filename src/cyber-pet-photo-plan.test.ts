import assert from 'node:assert/strict';
import test from 'node:test';
import {
  planMilkyTilt, planMilkyPant, planMilkyPawsRest, planMilkySleepyPeek,
  planMilkyChinRest, planMilkyBellyUp, planMilkyPhotoRise, planMilkyStandBridge,
} from './cyber-pet-photo-plan.ts';
import { milkyChinRimTranslation, MILKY_CHIN_MAX_OFFSET } from './cyber-pet-photo-geometry.ts';
import { MILKY_PHOTO_FRAMES, MILKY_PHOTO_GROUPS, MILKY_PHOTO_KINDS, milkyPhotoTranslate } from './cyber-pet-photo-art.ts';

const sequence = (random = Math.random) => ({ random });
const fixedRandom = (value: number) => () => value;

test('every motion group lists only declared frames and the tilt/pant frames stand while rolls lie', () => {
  for (const kind of MILKY_PHOTO_KINDS) {
    assert.ok(MILKY_PHOTO_GROUPS[kind].length >= 2);
    for (const frame of MILKY_PHOTO_GROUPS[kind]) assert.ok(MILKY_PHOTO_FRAMES[frame]);
  }
  assert.equal(MILKY_PHOTO_FRAMES['tilt-full'].lying, false);
  assert.equal(MILKY_PHOTO_FRAMES['pant-open'].lying, false);
  assert.equal(MILKY_PHOTO_FRAMES['belly-relaxed'].lying, true);
  assert.equal(MILKY_PHOTO_FRAMES['chin-rest'].lying, true);
  // Root's final approved body registration: translate = common − measured anchor.
  assert.deepEqual(milkyPhotoTranslate('tilt-near'), [0, 0]);
  assert.deepEqual(milkyPhotoTranslate('pant-open'), [0, 0]);
  assert.deepEqual(milkyPhotoTranslate('paws-lower'), [-137, 20]);
  assert.deepEqual(milkyPhotoTranslate('paws-rest'), [-137, 21]);
  assert.deepEqual(milkyPhotoTranslate('peek-low'), [-109, 70]);
  assert.deepEqual(milkyPhotoTranslate('peek-up'), [-105, 57]);
  assert.deepEqual(milkyPhotoTranslate('peek-blink'), [-105, 56]);
  assert.deepEqual(milkyPhotoTranslate('chin-lower'), [-103, 240]);
  assert.deepEqual(milkyPhotoTranslate('chin-rest'), [-103, 240]);
  assert.deepEqual(milkyPhotoTranslate('roll-side'), [-103, 150]);
  assert.deepEqual(milkyPhotoTranslate('roll-half'), [-103, 149]);
  assert.deepEqual(milkyPhotoTranslate('belly-up'), [-103, 139]);
  assert.deepEqual(milkyPhotoTranslate('belly-relaxed'), [-103, 139]);
  // Only the final contact frame carries the chin landmark.
  assert.deepEqual(MILKY_PHOTO_FRAMES['chin-rest'].chinPoint, [1138, 872]);
  assert.equal('chinPoint' in MILKY_PHOTO_FRAMES['chin-lower'], false);
});

test('the tilt plan moves near → full → near with human-scale holds', () => {
  const steps = planMilkyTilt(sequence().random);
  assert.deepEqual(steps.map((step) => step.pose), ['tilt-near', 'tilt-full', 'tilt-near']);
  for (const step of steps) assert.ok(step.hold >= 300 && step.hold <= 1700);
  assert.ok(steps.every((step) => step.motion === 'tilting'));
});

test('the pant plan is a bounded soft/open alternation that always closes softly', () => {
  for (const value of [.1, .9]) {
    const steps = planMilkyPant(fixedRandom(value));
    assert.ok(steps.length >= 7 && steps.length <= 9, 'bounded cycles');
    assert.equal(steps[0].pose, 'pant-soft');
    assert.equal(steps.at(-1)?.pose, 'pant-soft');
    for (let index = 1; index < steps.length; index++) {
      assert.notEqual(steps[index].pose, steps[index - 1].pose, 'frames alternate');
    }
  }
});

const SHIPPED = { sit: true, drowsy: true, sleep: true, wake: false } as const;
const WITH_WAKE = { sit: true, drowsy: true, sleep: true, wake: true } as const;
const BARE = { sit: false, drowsy: false, sleep: false, wake: false } as const;

test('paws-rest descends through sitting when available and rises back the same way', () => {
  const withSit = planMilkyPawsRest(SHIPPED, fixedRandom(.5));
  assert.deepEqual(withSit.map((step) => step.pose), ['sit', 'paws-lower', 'paws-rest', 'paws-lower', 'sit']);
  const withoutSit = planMilkyPawsRest(BARE, fixedRandom(.5));
  assert.deepEqual(withoutSit.map((step) => step.pose), ['paws-lower', 'paws-rest', 'paws-lower']);
});

test('sleepy-peek keeps a dedicated blink between half-lifts and returns to sleep', () => {
  const inPlace = planMilkySleepyPeek({ ...SHIPPED, descend: false }, fixedRandom(.5));
  assert.deepEqual(inPlace.map((step) => step.pose),
    ['peek-low', 'peek-up', 'peek-blink', 'peek-up', 'peek-low', 'sleep']);
  const fromAwake = planMilkySleepyPeek({ ...SHIPPED, descend: true }, fixedRandom(.5));
  assert.deepEqual(fromAwake.slice(0, 3).map((step) => step.pose), ['sit', 'drowsy', 'sleep']);
  assert.equal(fromAwake.at(-1)?.pose, 'sleep');
});

test('chin-rest and belly-up pass through their authored intermediates in both directions', () => {
  const chin = planMilkyChinRest(SHIPPED, fixedRandom(.5));
  assert.deepEqual(chin.map((step) => step.pose),
    ['sit', 'drowsy', 'chin-lower', 'chin-rest', 'chin-lower', 'drowsy']);
  const belly = planMilkyBellyUp(SHIPPED, fixedRandom(.5));
  assert.deepEqual(belly.map((step) => step.pose), [
    'sit', 'drowsy', 'sleep', 'roll-side', 'roll-half', 'belly-up',
    'belly-relaxed', 'belly-up', 'roll-half', 'roll-side', 'sleep',
  ]);
});

test('the roll itself keeps a quick eased cadence while the settled holds stay long', () => {
  for (const value of [0, .999]) {
    const belly = planMilkyBellyUp(SHIPPED, fixedRandom(value));
    for (const step of belly) {
      if (step.pose === 'roll-side' || step.pose === 'roll-half' || step.pose === 'belly-up') {
        assert.ok(step.hold >= 140 && step.hold <= 220, `transitional roll ${step.pose} held ${step.hold}ms`);
      }
    }
    const relaxed = belly.find((step) => step.pose === 'belly-relaxed');
    assert.ok(relaxed && relaxed.hold >= 5200, 'the settled back rest remains a long pause');
    const halves = belly.filter((step) => step.pose === 'roll-half');
    const sides = belly.filter((step) => step.pose === 'roll-side');
    assert.ok(halves.every((half) => sides.every((side) => half.hold <= side.hold + 1),
    ), 'the half roll is the quickest moment of the cadence');
  }
});

test('the stand bridge uses the wake art when shipped, otherwise drowsy then sit', () => {
  assert.deepEqual(planMilkyStandBridge('sleep', WITH_WAKE, fixedRandom(.5)).map((step) => step.pose), ['wake']);
  assert.deepEqual(planMilkyStandBridge('sleep', SHIPPED, fixedRandom(.5)).map((step) => step.pose), ['drowsy', 'sit']);
  assert.deepEqual(planMilkyStandBridge('drowsy', SHIPPED, fixedRandom(.5)).map((step) => step.pose), ['sit']);
  assert.deepEqual(planMilkyStandBridge('sleep', BARE, fixedRandom(.5)), []);
});

test('an interrupted pose finishes its full authored reverse exit with the shipped art', () => {
  const belly = planMilkyPhotoRise('belly-relaxed', SHIPPED, fixedRandom(.5));
  assert.deepEqual(belly.steps.map((step) => step.pose),
    ['belly-up', 'roll-half', 'roll-side', 'sleep', 'drowsy', 'sit']);
  assert.equal(belly.fromProne, true);
  assert.deepEqual(planMilkyPhotoRise('belly-relaxed', WITH_WAKE, fixedRandom(.5)).steps.map((step) => step.pose),
    ['belly-up', 'roll-half', 'roll-side', 'sleep', 'wake']);
  const paws = planMilkyPhotoRise('paws-rest', SHIPPED, fixedRandom(.5));
  assert.deepEqual(paws.steps.map((step) => step.pose), ['paws-lower', 'sit']);
  assert.equal(paws.fromProne, false);
  // The peek family never cuts straight to a stand: down through low and the prone body.
  assert.deepEqual(planMilkyPhotoRise('peek-up', SHIPPED, fixedRandom(.5)).steps.map((step) => step.pose),
    ['peek-low', 'sleep', 'drowsy', 'sit']);
  assert.deepEqual(planMilkyPhotoRise('peek-blink', SHIPPED, fixedRandom(.5)).steps.map((step) => step.pose),
    ['peek-low', 'sleep', 'drowsy', 'sit']);
  assert.deepEqual(planMilkyPhotoRise('chin-rest', SHIPPED, fixedRandom(.5)).steps.map((step) => step.pose),
    ['chin-lower', 'drowsy', 'sit']);
  // Standing photo poses still step back through their nearer frame.
  assert.deepEqual(planMilkyPhotoRise('tilt-full', SHIPPED, fixedRandom(.5)).steps.map((step) => step.pose), ['tilt-near']);
  assert.deepEqual(planMilkyPhotoRise('pant-open', SHIPPED, fixedRandom(.5)).steps.map((step) => step.pose), ['pant-soft']);
  assert.deepEqual(planMilkyPhotoRise('idle', SHIPPED), { steps: [], fromProne: false });
  assert.deepEqual(planMilkyPhotoRise('sleep', SHIPPED), { steps: [], fromProne: false });
});

test('the chin rim translation lands the measured chin on the rim and refuses large errors', () => {
  const base = {
    chinPoint: [1150, 790] as const,
    supportAnchor: [795, 970] as const,
    dogScreen: { x: 1440, y: 865 },
    pixelsPerNative: .1,
    facing: 1 as const,
  };
  // Chin sits at (1475.5, 847); a rim right there needs no correction at all.
  assert.deepEqual(milkyChinRimTranslation({ ...base, rimScreen: { x: 1475.5, y: 847 } }), [0, 0]);
  const shifted = milkyChinRimTranslation({ ...base, rimScreen: { x: 1474.5, y: 846 } });
  assert.ok(shifted);
  assert.ok(Math.abs(shifted[0] + 10) < 1e-9 && Math.abs(shifted[1] + 10) < 1e-9);
  // Mirrored facing mirrors the chin and the correction direction.
  const mirrored = milkyChinRimTranslation({
    ...base, facing: -1, rimScreen: { x: 1440 - 35.5 - 1, y: 847 },
  });
  assert.ok(mirrored);
  assert.ok(Math.abs(mirrored[0] - 10) < 1e-9);
  // Beyond the bounded correction the contact is refused, never faked.
  assert.equal(milkyChinRimTranslation({
    ...base, rimScreen: { x: 1475.5 + (MILKY_CHIN_MAX_OFFSET + 1) * .1, y: 847 },
  }), undefined);
  assert.equal(milkyChinRimTranslation({ ...base, pixelsPerNative: 0, rimScreen: { x: 1475.5, y: 847 } }), undefined);
});
