import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createNaturalMotion } from './cyber-pet-natural-motion.ts';
import { createNaturalJourney } from './cyber-pet-natural-journey.ts';
import { GROUNDED_FEET, GROUNDED_JOINTS, GROUNDED_ART } from './cyber-pet-grounded-geometry.ts';
import { GROUNDED_PADS } from './cyber-pet-grounded-articulation.ts';
import { NATURAL_STEPS } from './cyber-pet-natural-motion.ts';
import type { NaturalJourneyRoute, NaturalJourneySample } from './cyber-pet-natural-journey.ts';
import type { GroundedFoot, GroundPoint } from './cyber-pet-grounded-geometry.ts';

// Exercise the actual candidate's recorded performance, not a fixture sinusoid.
const motion = createNaturalMotion(JSON.parse(readFileSync(new URL('../public/assets/cyberpunk/milky-natural-motion/walk-cycle.json', import.meta.url), 'utf8')));
const distance = (a: GroundPoint, b: GroundPoint) => Math.hypot(b.x - a.x, b.y - a.y);
function actualSole(frame: NaturalJourneySample, name: GroundedFoot) {
  const kind = NATURAL_STEPS[name].kind, limb = frame.skeleton.limbs[name];
  const toe = GROUNDED_JOINTS[kind][3], pad = GROUNDED_PADS[kind], c = Math.cos(limb.pawAngle), s = Math.sin(limb.pawAngle);
  const x = limb.pad.x + (toe.x - pad.x) * c - (toe.y - pad.y) * s;
  const y = limb.pad.y + (toe.x - pad.x) * s + (toe.y - pad.y) * c;
  return { x: frame.root.x + frame.facing * (x - GROUNDED_ART.anchorX) * frame.scale, y: frame.root.y + (y - GROUNDED_ART.anchorY) * frame.scale };
}
const routes: NaturalJourneyRoute[] = [
  { from: { x: 100, y: 200 }, to: { x: 400, y: 200 }, scale: .1 },
  { from: { x: 400, y: 200 }, to: { x: 100, y: 200 }, scale: .1 },
  { from: { x: 100, y: 200 }, to: { x: 350, y: 250 }, scale: .09, endScale: .105 },
  { from: { x: 100, y: 250 }, to: { x: 350, y: 200 }, scale: .1, endScale: .09 },
  { from: { x: 100, y: 200 }, to: { x: 350, y: 205 }, scale: .09, endScale: .1, scaleAt: u => .09 + .01 * (3 * u * u - 2 * u * u * u) },
  { from: { x: 100, y: 200 }, to: { x: 100, y: 210 }, scale: .1 },
  { from: { x: 100, y: 200 }, to: { x: 102, y: 201 }, scale: .1 },
];

test('finite walks preserve real solved contacts and fixed art lengths through mirrored and depth routes', () => {
  for (const route of routes) {
    const journey = createNaturalJourney(motion, route), report = journey.diagnostics(481);
    assert.equal(report.unreachableSamples, 0, JSON.stringify({ route, report }));
    assert.ok(report.maxSegmentLengthError < 1e-8, JSON.stringify(report));
    assert.ok(report.maxContactError < 1e-8, JSON.stringify(report));
    for (let i = 0; i <= 120; i++) {
      const frame = journey.sample(journey.distance * i / 120);
      assert.ok(Object.values(frame.feet).filter(foot => foot.contact).length >= 2, 'walking keeps at least two ground supports');
    }
    for (const name of GROUNDED_FEET) {
      const steps = journey.steps[name];
      assert.ok(steps.length > 0);
      const stanceIntervals = [
        { start: 0, end: steps[0].lift },
        ...steps.map((step, i) => ({ start: step.land, end: steps[i + 1]?.lift ?? journey.distance })),
      ];
      for (const interval of stanceIntervals) {
        const a = journey.sample(interval.start + (interval.end - interval.start) * .15);
        const b = journey.sample(interval.start + (interval.end - interval.start) * .85);
        assert.equal(a.feet[name].contact, true);
        assert.equal(b.feet[name].contact, true);
        assert.ok(distance(actualSole(a, name), actualSole(b, name)) < 1e-8, `solved ${name} skates in world space`);
      }
    }
    const first = journey.sample(0), last = journey.sample(journey.distance);
    assert.deepEqual(first.root, route.from);
    assert.deepEqual(last.root, route.to);
    assert.equal(first.complete, false);
    assert.equal(last.complete, true);
    for (const name of GROUNDED_FEET) {
      assert.equal(first.feet[name].contact, true);
      assert.equal(last.feet[name].contact, true);
      assert.equal(last.feet[name].lift, 0);
    }
    assert.deepEqual(journey.sample(journey.distance + 100), last, 'arrival needs no extra frame or post-stop marching');
  }
});

test('actual source lift and separate chest/pelvis motion survive world-contact correction', () => {
  const journey = createNaturalJourney(motion, routes[0]);
  const step = journey.steps.nearFore[2];
  const during = journey.sample((step.lift + step.land) / 2);
  assert.equal(during.feet.nearFore.contact, false);
  assert.ok(during.feet.nearFore.lift > 1, 'forepaw visibly clears the floor');
  assert.ok(during.skeleton.deformation);
  assert.notEqual(during.skeleton.deformation.chest.y - 575, during.skeleton.deformation.pelvis.y - 575);
  assert.ok(Math.abs(during.skeleton.deformation.tailAngle) > 1e-5);
});

test('contact transitions preserve position and do not inject a velocity discontinuity', () => {
  const journey = createNaturalJourney(motion, routes[0]), h = 1e-4;
  for (const name of GROUNDED_FEET) for (const step of journey.steps[name]) for (const boundary of [step.lift, step.land]) {
    const before = journey.sample(boundary - h), at = journey.sample(boundary), after = journey.sample(boundary + h);
    const p = actualSole(before, name), q = actualSole(at, name), r = actualSole(after, name);
    assert.ok(distance(p, q) < 1e-6 && distance(q, r) < 1e-6, `contact position jumps at ${name} ${boundary}`);
    const incoming = { x: (q.x - p.x) / h, y: (q.y - p.y) / h };
    const outgoing = { x: (r.x - q.x) / h, y: (r.y - q.y) / h };
    assert.ok(distance(incoming, outgoing) < .001, `contact velocity jumps at ${name} ${boundary}`);
    for (const key of ['root', 'joint', 'wrist', 'pad'] as const) {
      assert.ok(distance(before.skeleton.limbs[name][key], after.skeleton.limbs[name][key]) < .1, `pose jumps at ${name}.${key} ${boundary}`);
    }
  }
});

test('short walks reduce paw clearance and zero routes remain an entirely static grounded pose', () => {
  const short = createNaturalJourney(motion, { from: { x: 0, y: 0 }, to: { x: 1, y: 0 }, scale: .1 });
  let peak = 0;
  for (let i = 0; i <= 100; i++) for (const foot of Object.values(short.sample(i / 100).feet)) peak = Math.max(peak, foot.lift);
  assert.ok(peak > 0 && peak < 1.5, `tiny step clearance is ${peak}px`);
  const still = createNaturalJourney(motion, { from: { x: 12, y: 13 }, to: { x: 12, y: 13 }, scale: .1 });
  assert.deepEqual(still.sample(0), still.sample(100));
  assert.equal(still.sample(0).complete, true);
  assert.ok(Object.values(still.sample(0).feet).every(foot => foot.contact && foot.reachable));
  assert.equal(still.diagnostics().cycles, 0);
});

test('impossible abrupt scale trajectories report unresolved constraints without stretching bones', () => {
  const journey = createNaturalJourney(motion, {
    from: { x: 0, y: 0 }, to: { x: 10, y: 0 }, scale: .1,
    scaleAt: u => u > .499 && u < .501 ? .00001 : .1,
  });
  const frame = journey.sample(5), report = journey.diagnostics(101);
  assert.ok(Object.values(frame.feet).some(foot => !foot.reachable && foot.error > .1), 'do not silently claim every arbitrary scaleAt is reachable');
  assert.ok(report.unreachableSamples > 0);
  assert.ok(report.maxTargetError > .1);
  assert.ok(report.maxSegmentLengthError < 1e-7, 'unreachable constraints clamp the endpoint, never stretch the artwork');
});

test('rejects invalid route, scale callbacks, distance and unbounded planning inputs', () => {
  const base = { from: { x: 0, y: 0 }, to: { x: 20, y: 0 }, scale: .1 };
  assert.throws(() => createNaturalJourney(motion, { ...base, scale: 0 }), /Invalid/);
  assert.throws(() => createNaturalJourney(motion, { ...base, facing: 0 as 1 }), /facing/);
  assert.throws(() => createNaturalJourney(motion, base, { initialContacts: {} as Record<GroundedFoot, GroundPoint> }), /initial contacts/);
  assert.throws(() => createNaturalJourney(motion, { ...base, to: { x: NaN, y: 0 } }), /Invalid/);
  assert.throws(() => createNaturalJourney(motion, { ...base, scaleAt: () => NaN }), /depth scale/);
  assert.throws(() => createNaturalJourney(motion, { ...base, to: base.from, endScale: .2 }), /zero-distance/);
  assert.throws(() => createNaturalJourney(motion, { ...base, to: { x: 1e9, y: 0 } }), /too long/);
  const journey = createNaturalJourney(motion, base);
  assert.throws(() => journey.sample(NaN), /travelled/);
  assert.throws(() => journey.diagnostics(1), /sample count/);
  assert.deepEqual(journey.sample(-10), journey.sample(0));
});

// Each subsequent walk must retain the exact completed world contacts; planning
// every new walk from its own midpoint stance would teleport all four feet.
test('a completed stance carries into the next journey without a foot or joint jump', () => {
  const first = createNaturalJourney(motion, { from: { x: 0, y: 0 }, to: { x: 200, y: 0 }, scale: .1 });
  const stopped = first.sample(first.distance);
  const initialContacts = Object.fromEntries(GROUNDED_FEET.map(name => [name, stopped.feet[name].sole])) as Record<GroundedFoot, GroundPoint>;
  const next = createNaturalJourney(motion, { from: stopped.root, to: { x: 400, y: 15 }, scale: .1, endScale: .105 }, { initialContacts });
  const restarted = next.sample(0), report = next.diagnostics(481);
  assert.equal(report.unreachableSamples, 0, JSON.stringify(report));
  for (const name of GROUNDED_FEET) {
    assert.ok(distance(actualSole(stopped, name), actualSole(restarted, name)) < 1e-8);
    for (const joint of ['root', 'joint', 'wrist', 'pad'] as const) {
      assert.ok(distance(stopped.skeleton.limbs[name][joint], restarted.skeleton.limbs[name][joint]) < 1e-8, `restart changes ${name}.${joint}`);
    }
  }
});
