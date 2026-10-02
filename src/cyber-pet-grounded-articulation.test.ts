import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGroundedSkeleton, GROUNDED_PADS, solveGroundedSkeleton } from './cyber-pet-grounded-articulation.ts';
import { createGroundedPlan, createGroundedPose, sampleGroundedLoad, sampleGroundedPlan } from './cyber-pet-grounded-plan.ts';
import { GROUNDED_ART, GROUNDED_FEET, GROUNDED_JOINTS, GROUNDED_LIMBS } from './cyber-pet-grounded-geometry.ts';
import { milkyDepthScale } from './cyber-pet-motion.ts';

test('walking transfers weight and flexes airborne paws while planted soles stay fixed', () => {
  const route = { from: { x: 400, y: 900 }, to: { x: 580, y: 900 }, scale: .11, endScale: .11, facing: 1 as const };
  const plan = createGroundedPlan(route), feet = createGroundedPose(), skeleton = createGroundedSkeleton();
  const heights: number[] = [], tilts: number[] = [], ankles: number[] = [];
  const heads: number[] = [], tails: number[] = [];
  for (let d = 30; d <= 150; d += .2) {
    sampleGroundedPlan(plan, d, feet);
    const sample = { root: { x: 400 + d, y: 900 }, scale: .11, facing: 1 as const, load: sampleGroundedLoad(plan, d), feet };
    assert.equal(solveGroundedSkeleton(sample, skeleton), true);
    heights.push(skeleton.body.y); tilts.push(skeleton.body.pitch);
    heads.push(skeleton.body.head); tails.push(skeleton.body.tail);
    for (const name of GROUNDED_FEET) {
      const limb = skeleton.limbs[name], source = GROUNDED_JOINTS[GROUNDED_LIMBS[name].kind];
      const pad = GROUNDED_PADS[GROUNDED_LIMBS[name].kind];
      const toeX = source[3].x - pad.x, toeY = source[3].y - pad.y;
      const x = limb.pad.x + toeX * Math.cos(limb.pawAngle) - toeY * Math.sin(limb.pawAngle);
      const y = limb.pad.y + toeX * Math.sin(limb.pawAngle) + toeY * Math.cos(limb.pawAngle);
      assert.ok(Math.abs(sample.root.x + (x - GROUNDED_ART.anchorX) * sample.scale - feet[name].x) < 1e-7);
      assert.ok(Math.abs(sample.root.y + (y - GROUNDED_ART.anchorY) * sample.scale - feet[name].y) < 1e-7);
      if (feet[name].contact) assert.equal(limb.pawAngle, 0);
      else ankles.push(limb.pawAngle);
    }
  }
  assert.ok(Math.max(...heights) - Math.min(...heights) > 3, 'the torso must respond to footfalls');
  assert.ok(Math.max(...tilts) - Math.min(...tilts) > .006, 'shoulders and hips must transfer weight');
  assert.ok(Math.max(...ankles) > .25, 'the forepaw must visibly curl during swing');
  assert.ok(Math.max(...heads) - Math.min(...heads) > .005, 'the neck responds to weight transfer');
  assert.ok(Math.max(...tails) - Math.min(...tails) > .01, 'the tail follows the stride');
});

test('articulation preserves bone lengths, continuous joints and neutral arrival on real room routes', () => {
  const deltas = [{ x: 180, y: 0 }, { x: 91.96, y: -20.702 }, { x: 35, y: -23 }, { x: 14, y: -23 }, { x: 108.6, y: -66.2 }];
  for (const facing of [1, -1] as const) for (const delta of deltas) for (const vertical of [1, -1]) {
    const from = { x: 969.76, y: vertical === 1 ? 931.59 : 908 }, dy = delta.y * vertical;
    const scaleAt = (u: number) => .110639375 * Number(milkyDepthScale((from.y + dy * u) / 941).toFixed(4));
    const plan = createGroundedPlan({ from, to: { x: from.x + facing * delta.x, y: from.y + dy }, scale: scaleAt(0), endScale: scaleAt(1), facing, scaleAt });
    const feet = createGroundedPose(), skeleton = createGroundedSkeleton();
    let previous: ReturnType<typeof createGroundedSkeleton> | undefined;
    for (let i = 0; i <= 1800; i++) {
      const u = i / 1800, d = plan.distance * u;
      sampleGroundedPlan(plan, d, feet);
      const sample = { root: { x: from.x + facing * delta.x * u, y: from.y + dy * u }, scale: scaleAt(u), facing, load: sampleGroundedLoad(plan, d), feet };
      assert.equal(solveGroundedSkeleton(sample, skeleton), true, `${JSON.stringify(delta)} at ${u}`);
      for (const name of GROUNDED_FEET) {
        const limb = skeleton.limbs[name], source = GROUNDED_JOINTS[GROUNDED_LIMBS[name].kind];
        assert.ok(Math.abs(Math.hypot(limb.joint.x - limb.root.x, limb.joint.y - limb.root.y) - Math.hypot(source[1].x - source[0].x, source[1].y - source[0].y)) < 1e-6);
        assert.ok(Math.abs(Math.hypot(limb.wrist.x - limb.joint.x, limb.wrist.y - limb.joint.y) - Math.hypot(source[2].x - source[1].x, source[2].y - source[1].y)) < 1e-6);
        if (previous) {
          const before = previous.limbs[name];
          assert.ok(Math.hypot(limb.joint.x - before.joint.x, limb.joint.y - before.joint.y) * sample.scale < 1.2, `${name} must not snap on ${JSON.stringify(delta)} at ${u}`);
        }
      }
      if (i === 0 || i === 1800) {
        assert.equal(skeleton.body.y, 0); assert.ok(skeleton.body.pitch === 0);
        for (const name of GROUNDED_FEET) assert.equal(skeleton.limbs[name].pawAngle, 0);
      }
      previous = structuredClone(skeleton);
    }
  }
});

test('a compatible retarget preserves the entire drawn posture, including ankle and torso', () => {
  const route = { from: { x: 400, y: 900 }, to: { x: 580, y: 900 }, scale: .11, endScale: .11, facing: 1 as const };
  const plan = createGroundedPlan(route), feet = createGroundedPose();
  for (const d of [5, 31, 57, 90, 151, 175]) {
    sampleGroundedPlan(plan, d, feet);
    const root = { x: 400 + d, y: 900 }, load = sampleGroundedLoad(plan, d);
    const before = createGroundedSkeleton();
    solveGroundedSkeleton({ root, scale: .11, facing: 1, load, feet }, before);
    const next = createGroundedPlan({ ...route, from: root, to: { x: 610, y: 905 } }, feet, load);
    sampleGroundedPlan(next, 0, feet);
    const after = createGroundedSkeleton();
    solveGroundedSkeleton({ root, scale: .11, facing: 1, load: sampleGroundedLoad(next, 0), feet }, after);
    assert.deepEqual(after, before);
  }
});
