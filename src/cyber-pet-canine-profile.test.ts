import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canineProfile, canineSwing } from './cyber-pet-canine-profile.ts';
import { createGroundedPlan, createGroundedPose, sampleGroundedPlan } from './cyber-pet-grounded-plan.ts';
import { groundedStride } from './cyber-pet-grounded-geometry.ts';

test('measured cycles wrap without a position or angular velocity seam', () => {
  const h = 1e-6;
  for (const kind of ['fore', 'hind'] as const) for (let channel = 0; channel < (kind === 'fore' ? 5 : 4); channel++) {
    const value = (phase: number) => canineProfile(kind, phase, channel);
    for (const seam of [-1, 0, 1, 2]) {
      assert.ok(Math.abs(value(seam - h) - value(seam + h)) < .001);
      const left = (value(seam) - value(seam - h)) / h;
      const right = (value(seam + h) - value(seam)) / h;
      assert.ok(Math.abs(left - right) < .2);
    }
  }
});

test('steady walking uses lateral footfalls with longer support than swing', () => {
  const plan = createGroundedPlan({ from: { x: 0, y: 0 }, to: { x: 500, y: 0 }, scale: .11, endScale: .11, facing: 1 });
  const hind = plan.steps.nearHind[2], fore = plan.steps.nearFore[2];
  const period = plan.steps.nearHind[3].lift - hind.lift;
  assert.ok(Math.abs((fore.lift - hind.lift) / period - .14) < 1e-9);
  assert.ok(Math.abs((hind.land - hind.lift) / period - .4) < 1e-9);
  assert.ok(Math.abs((plan.steps.farHind[2].lift - hind.lift) / period - .5) < 1e-9);
});

test('depth steps keep the ordinary cadence instead of doubling the stepping rate', () => {
  for (const y of [0, -30]) {
    const from = { x: 0, y: 0 }, to = { x: 500, y };
    const plan = createGroundedPlan({ from, to, scale: .11, endScale: .11, facing: 1 });
    const period = plan.steps.nearHind[3].lift - plan.steps.nearHind[2].lift;
    const seconds = period / (groundedStride(from, to) * .11 / .72);
    assert.ok(seconds > .65 && seconds <= .72, `ordinary stride duration: ${seconds}`);
  }
});

test('forepaws clear early while hind paws follow a lower, later return arc', () => {
  let forePeak = 0, hindPeak = 0, foreAt = 0, hindAt = 0;
  for (let i = 0; i <= 100; i++) {
    const u = i / 100, fore = canineSwing('fore', u), hind = canineSwing('hind', u);
    if (fore.height > forePeak) { forePeak = fore.height; foreAt = u; }
    if (hind.height > hindPeak) { hindPeak = hind.height; hindAt = u; }
    assert.ok(fore.height >= 0 && hind.height >= 0);
  }
  assert.ok(foreAt < .4 && hindAt > .5);
  assert.ok(forePeak > 2 * hindPeak);
  for (const kind of ['fore', 'hind'] as const) for (const u of [0, 1]) {
    const sample = canineSwing(kind, u);
    assert.equal(sample.height, 0);
    assert.equal(sample.velocity, 0);
  }
});

test('the walking planner preserves the distinct measured fore and hind return arcs', () => {
  const plan = createGroundedPlan({ from: { x: 0, y: 0 }, to: { x: 500, y: 0 }, scale: .11, endScale: .11, facing: 1 });
  const pose = createGroundedPose();
  const peaks = [];
  for (const name of ['nearFore', 'nearHind'] as const) {
    const step = plan.steps[name][2];
    let peak = 0, at = 0;
    for (let i = 0; i <= 100; i++) {
      sampleGroundedPlan(plan, step.lift + (step.land - step.lift) * i / 100, pose);
      if (pose[name].lift > peak) { peak = pose[name].lift; at = i / 100; }
    }
    peaks.push({ peak, at });
  }
  assert.ok(peaks[0].at < .4 && peaks[1].at > .5);
  assert.ok(peaks[0].peak > 2 * peaks[1].peak);
});
