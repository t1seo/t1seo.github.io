import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGroundedPlan, createGroundedPose, sampleGroundedPlan, sampleGroundedLoad } from './cyber-pet-grounded-plan.ts';
import type { GroundedPlan, GroundedPose } from './cyber-pet-grounded-plan.ts';
import { GROUNDED_ART, GROUNDED_FEET, GROUNDED_LIMBS, GROUNDED_JOINTS } from './cyber-pet-grounded-geometry.ts';
import { milkyDepthScale } from './cyber-pet-motion.ts';
function assertPhysicalReach(plan: GroundedPlan, pose: GroundedPose, u: number): void {
  const route = plan.route, scale = route.scaleAt?.(u) ?? route.scale + (route.endScale - route.scale) * u;
  const load = sampleGroundedLoad(plan, plan.distance * u);
  for (const name of GROUNDED_FEET) {
    const limb = GROUNDED_LIMBS[name], joints = GROUNDED_JOINTS[limb.kind];
    const x = (pose[name].x - (route.from.x + (route.to.x - route.from.x) * u)) / scale * route.facing + GROUNDED_ART.anchorX;
    const y = (pose[name].y - (route.from.y + (route.to.y - route.from.y) * u)) / scale + GROUNDED_ART.anchorY;
    const wrist = { x: x - joints[3].x + joints[2].x, y: y - joints[3].y + joints[2].y };
    const upper = Math.hypot(joints[1].x - joints[0].x, joints[1].y - joints[0].y), lower = Math.hypot(joints[2].x - joints[1].x, joints[2].y - joints[1].y);
    const reach = Math.hypot(wrist.x - limb.root.x, wrist.y - limb.root.y - load);
    assert.ok(reach <= upper + lower + 1e-8 && reach >= Math.abs(upper - lower) - 1e-8,
      `${name}, distance ${plan.distance}, fraction ${u}: reach excess ${reach - upper - lower}`);
  }
}
for (const facing of [1, -1] as const) test(`locks world contacts through scale and speed changes facing ${facing}`, () => {
  // Given a route with depth variation and fixed physical contact plans.
  const route = { from: { x: 400, y: 890 }, to: { x: 400 + facing * 180, y: 905 }, scale: .108, endScale: .111, facing };
  const plan = createGroundedPlan(route), pose = createGroundedPose();
  // When each complete stance is sampled densely.
  for (const name of GROUNDED_FEET) for (const [i, step] of plan.steps[name].entries()) {
    const previous = plan.steps[name][i - 1];
    const start = previous?.land ?? 0;
    for (let j = 0; j <= 20; j++) {
      sampleGroundedPlan(plan, start + (step.lift - start) * j / 20, pose);
      // Then a supporting sole never slides in world coordinates.
      assert.ok(Math.abs(pose[name].x - step.from.x) < 1e-8);
      assert.ok(Math.abs(pose[name].y - step.from.y) < 1e-8);
    }
  }
});
for (const length of [1, 8, 19, 53, 180]) test(`lands all four soles exactly at the idle endpoint after ${length}px`, () => {
  // Given a short or long forward step.
  const route = { from: { x: 400, y: 900 }, to: { x: 400 + length, y: 900 }, scale: .11, endScale: .11, facing: 1 as const };
  const plan = createGroundedPlan(route), pose = createGroundedPose();
  // When travel reaches its exact original endpoint.
  sampleGroundedPlan(plan, plan.distance, pose);
  // Then no additional movement or finishing timer is needed.
  for (const name of GROUNDED_FEET) {
    assert.equal(pose[name].contact, true);
    assert.equal(pose[name].x, route.to.x + (GROUNDED_LIMBS[name].idle.x - GROUNDED_ART.anchorX) * .11);
    assert.equal(pose[name].y, route.to.y + (GROUNDED_LIMBS[name].idle.y - GROUNDED_ART.anchorY) * .11);
  }
});
test('carries actual foot positions into a compatible retarget without a joint jump', () => {
  // Given a moving pet with both support and swinging feet.
  const route = { from: { x: 400, y: 900 }, to: { x: 600, y: 900 }, scale: .11, endScale: .11, facing: 1 as const };
  const pose = createGroundedPose(); sampleGroundedPlan(createGroundedPlan(route), 57, pose);
  const next = createGroundedPlan({ ...route, from: { x: 457, y: 900 }, to: { x: 640, y: 905 } }, pose);
  const after = createGroundedPose();
  // When the new route begins at the same root.
  sampleGroundedPlan(next, 0, after);
  // Then all four visible feet retain exact world positions.
  for (const name of GROUNDED_FEET) {
    assert.equal(after[name].x, pose[name].x); assert.equal(after[name].y, pose[name].y);
  }
});
test('keeps at least two paws supporting a short shuffle', () => {
  // Given a move shorter than one stride.
  const route = { from: { x: 400, y: 900 }, to: { x: 419, y: 900 }, scale: .11, endScale: .11, facing: 1 as const };
  const plan = createGroundedPlan(route), pose = createGroundedPose();
  // When its four deliberate steps are sampled.
  for (let d = 0; d <= 19; d += .05) {
    sampleGroundedPlan(plan, d, pose);
    // Then the dog does not hover with all four legs raised.
    assert.ok(GROUNDED_FEET.filter(name => pose[name].contact).length >= 2);
  }
});
for (const length of [1, 8, 19, 53, 180]) test(`keeps two real supports across ${length}px with a carried swing`, () => {
  // Given a route interrupted while feet have both support and swing states.
  const route = { from: { x: 400, y: 900 }, to: { x: 600, y: 900 }, scale: .11, endScale: .11, facing: 1 as const };
  const carried = createGroundedPose(); sampleGroundedPlan(createGroundedPlan(route), 57, carried);
  const plan = createGroundedPlan({ ...route, from: { x: 457, y: 900 }, to: { x: 457 + length, y: 900 } }, carried);
  const pose = createGroundedPose();
  // When the full continued route is densely sampled.
  for (let i = 0; i <= 600; i++) {
    sampleGroundedPlan(plan, plan.distance * i / 600, pose);
    // Then the count reflects physically planted soles, not airborne contact flags.
    assert.ok(GROUNDED_FEET.filter(name => pose[name].contact && pose[name].lift === 0).length >= 2, `${length}px at ${i}`);
  }
});
test('preserves contact and vertical lift at the exact retarget boundary', () => {
  // Given a pose with a real airborne paw.
  const route = { from: { x: 400, y: 900 }, to: { x: 600, y: 900 }, scale: .11, endScale: .11, facing: 1 as const };
  const carried = createGroundedPose(); sampleGroundedPlan(createGroundedPlan(route), 57, carried);
  const plan = createGroundedPlan({ ...route, from: { x: 457, y: 900 }, to: { x: 465, y: 900 } }, carried);
  const pose = createGroundedPose();
  // When the new route begins without any travel.
  sampleGroundedPlan(plan, 0, pose);
  // Then an airborne paw has not been relabelled as a support.
  for (const name of GROUNDED_FEET) assert.deepEqual(pose[name], carried[name]);
});
for (const length of [53, 180]) test(`keeps two physical supports over a ${length}px ordinary walk`, () => {
  // Given an ordinary multi-cycle walk.
  const route = { from: { x: 400, y: 900 }, to: { x: 400 + length, y: 900 }, scale: .11, endScale: .11, facing: 1 as const };
  const plan = createGroundedPlan(route), pose = createGroundedPose();
  // When every transition and central cycle is sampled.
  for (let i = 0; i <= 1500; i++) {
    sampleGroundedPlan(plan, plan.distance * i / 1500, pose);
    // Then at least two planted paws carry the body throughout.
    assert.ok(GROUNDED_FEET.filter(name => pose[name].contact && pose[name].lift === 0).length >= 2, `${length}px at ${i}`);
  }
});
test('keeps all articulated joints in reach on mirrored paths with perspective depth', () => {
  // Given the actual painted limb lengths and both horizontal and diagonal routes.
  for (const facing of [1, -1] as const) for (const length of [1, 8, 19, 53, 180]) for (const rise of [-.15, 0, .15, .3]) {
    const route = { from: { x: 400, y: 900 }, to: { x: 400 + facing * length, y: 900 + length * rise }, scale: .11, endScale: .11 * .9742, facing };
    const plan = createGroundedPlan(route), pose = createGroundedPose();
    // When physical world soles are transformed back into the actual joint space.
    for (let i = 0; i <= 300; i++) {
      const u = i / 300;
      sampleGroundedPlan(plan, plan.distance * u, pose);
      // Then neither a stretched bone nor a falsely grounded sole is required.
      assertPhysicalReach(plan, pose, u);
    }
  }
});
test('lands carried descents above the floor without a contact or velocity discontinuity', () => {
  // Given every limb near the descending end of its first swing on slanted routes.
  for (const facing of [1, -1] as const) for (const rise of [-.15, 0, .15, .3]) {
    const dx = facing * Math.sqrt(1 - rise * rise);
    const route = { from: { x: 900, y: 915 }, to: { x: 900 + dx * 180, y: 915 + rise * 180 }, scale: .110639375, endScale: .110639375 * .9742, facing };
    const original = createGroundedPlan(route);
    for (const name of GROUNDED_FEET) for (const phase of [.85, .95, .99]) for (const length of [1, 8, 19]) {
      const first = original.steps[name][0];
      assert.ok(first);
      const at = first.lift + (first.land - first.lift) * phase;
      const carry = createGroundedPose(); sampleGroundedPlan(original, at, carry);
      const from = { x: route.from.x + dx * at, y: route.from.y + rise * at };
      const scale = route.scale + (route.endScale - route.scale) * at / 180;
      const next = createGroundedPlan({ from, to: { x: from.x + dx * length, y: from.y + rise * length }, scale, endScale: scale + (route.endScale - route.scale) * length / 180, facing }, carry, sampleGroundedLoad(original, at));
      const pose = createGroundedPose();
      // When the ongoing swing is redirected into a finite shorter route.
      sampleGroundedPlan(next, 0, pose);
      assert.deepEqual(pose, carry);
      assert.equal(sampleGroundedLoad(next, 0), sampleGroundedLoad(original, at));
      for (let i = 1; i <= 300; i++) {
        sampleGroundedPlan(next, next.distance * i / 300, pose);
        // Then no foot enters the floor and the existing physical bones remain reachable.
        assert.ok(GROUNDED_FEET.every(foot => pose[foot].lift >= 0));
        assert.ok(GROUNDED_FEET.filter(foot => pose[foot].contact).length >= 2);
        assertPhysicalReach(next, pose, i / 300);
      }
    }
  }
});
test('keeps physical reach on actual keyboard, roaming and bed approach routes', () => {
  // Given legal room routes with steeper depth travel than the original sampling grid.
  const destinations = [{ x: 91.96, y: -20.702 }, { x: 35, y: -23 }, { x: 53, y: -23 }, { x: 14, y: -23 }, { x: 108.6, y: -66.2 }];
  for (const facing of [1, -1] as const) for (const delta of destinations) for (const vertical of [1, -1]) {
    const from = { x: 969.76, y: vertical === 1 ? 931.59 : 908 };
    const dy = delta.y * vertical;
    const scaleAt = (u: number) => .110639375 * Number(milkyDepthScale((from.y + dy * u) / 941).toFixed(4));
    const route = { from, to: { x: from.x + facing * delta.x, y: from.y + dy }, scale: scaleAt(0), endScale: scaleAt(1), scaleAt, facing };
    const plan = createGroundedPlan(route), pose = createGroundedPose();
    // When the actual route is sampled throughout its complete start, walk and arrival.
    for (let i = 0; i <= 3000; i++) {
      sampleGroundedPlan(plan, plan.distance * i / 3000, pose);
      // Then the painted bones reach every target and at least two real soles support the body.
      assertPhysicalReach(plan, pose, i / 3000);
      assert.ok(GROUNDED_FEET.filter(name => pose[name].contact && pose[name].lift === 0).length >= 2);
    }
  }
});
test('keeps planted feet reachable when a horizontal walk redirects to an arrow diagonal', () => {
  // Given a real horizontal route at early, middle and late phases around the depth clamp.
  const scaleY = (y: number) => .110639375 * Number(milkyDepthScale(y / 941).toFixed(4));
  for (const facing of [1, -1] as const) for (const y of [899.83, 915, 931.59]) for (const at of [1, 5, 18, 45, 90, 135, 162, 175]) for (const dy of [-20.702, 20.702]) {
    const origin = { x: 969.76, y };
    const original = createGroundedPlan({ from: origin, to: { x: origin.x + facing * 180, y }, scale: scaleY(y), endScale: scaleY(y), facing, scaleAt: () => scaleY(y) });
    const carry = createGroundedPose(); sampleGroundedPlan(original, at, carry);
    const from = { x: origin.x + facing * at, y };
    const plan = createGroundedPlan({ from, to: { x: from.x + facing * 91.96, y: y + dy }, scale: scaleY(y), endScale: scaleY(y + dy), facing, scaleAt: u => scaleY(y + dy * u) }, carry, sampleGroundedLoad(original, at));
    const pose = createGroundedPose();
    // When an upward or downward keyboard command carries the compatible heading.
    for (let i = 0; i <= 1200; i++) {
      sampleGroundedPlan(plan, plan.distance * i / 1200, pose);
      // Then the new depth direction never requires a stretched bone or airborne support flag.
      assertPhysicalReach(plan, pose, i / 1200);
      assert.ok(GROUNDED_FEET.filter(name => pose[name].contact && pose[name].lift === 0).length >= 2);
    }
  }
});
