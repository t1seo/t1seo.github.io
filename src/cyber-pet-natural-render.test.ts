import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGroundedSkeleton, GROUNDED_PADS } from './cyber-pet-grounded-articulation.ts';
import { GROUNDED_FEET, GROUNDED_JOINTS, GROUNDED_LIMBS } from './cyber-pet-grounded-geometry.ts';
import { createNaturalPainter } from './cyber-pet-natural-render.ts';
import type { NaturalSkeleton } from './cyber-pet-natural-render.ts';
import type { GroundPoint } from './cyber-pet-grounded-geometry.ts';
import type { GroundedWalkAssets } from './cyber-pet-grounded-assets.ts';

function harness() {
  let calls = 0;
  const context = {
    globalAlpha: 1, save() {}, restore() {}, beginPath() {}, closePath() {}, clip() {}, moveTo() {}, lineTo() {},
    getTransform: () => ({ a: .11 }),
    transform(...values: number[]) { assert.ok(values.every(Number.isFinite), 'submit only finite Canvas matrices'); },
    drawImage() { calls++; },
  } as unknown as CanvasRenderingContext2D;
  const asset = { image: {}, width: 768, height: 512 };
  return { painter: createNaturalPainter(context, { foreleg: asset, hindleg: asset, torso: asset } as unknown as GroundedWalkAssets), calls: () => calls };
}
function after(origin: GroundPoint, start: GroundPoint, end: GroundPoint, angle: number): GroundPoint {
  const x = end.x - start.x, y = end.y - start.y;
  return { x: origin.x + x * Math.cos(angle) - y * Math.sin(angle), y: origin.y + x * Math.sin(angle) + y * Math.cos(angle) };
}
function pose(phase = 0): NaturalSkeleton {
  const skeleton: NaturalSkeleton = createGroundedSkeleton();
  for (const name of GROUNDED_FEET) {
    const art = GROUNDED_LIMBS[name], source = GROUNDED_JOINTS[art.kind], pad = GROUNDED_PADS[art.kind], limb = skeleton.limbs[name];
    const sign = name.startsWith('far') ? -1 : 1;
    limb.root = { ...art.root };
    limb.joint = { ...after(limb.root, source[0], source[1], .16 * Math.sin(phase) * sign), reachable: true };
    limb.wrist = after(limb.joint, source[1], source[2], .2 * Math.sin(phase + .4) * sign);
    limb.pad = after(limb.wrist, source[2], pad, .15 * Math.sin(phase + .7) * sign);
    limb.pawAngle = .06 * Math.sin(phase + .8) * sign;
  }
  return skeleton;
}

test('separate chest and pelvis motion keeps the painted face rigid in submitted triangles', () => {
  const { painter, calls } = harness();
  for (let frame = 0; frame <= 120; frame++) {
    const phase = frame / 120 * Math.PI * 2, skeleton = pose(phase);
    skeleton.deformation = {
      pelvis: { x: 485 + 4 * Math.cos(phase), y: 575 + 7 * Math.sin(phase), angle: .018 * Math.sin(phase) },
      chest: { x: 1070 + 5 * Math.cos(phase + .4), y: 575 + 5 * Math.sin(phase + .5), angle: .025 * Math.sin(phase + .7) },
      headAngle: -.018 * Math.sin(phase + .7), tailAngle: .045 * Math.sin(phase - .5),
    };
    assert.equal(painter.draw(skeleton), true);
    const report = painter.inspect();
    assert.ok(report.face.maxRigidError < 1e-9, `face mesh deforms: ${report.face.maxRigidError}`);
    assert.ok(report.face.maxPairDistanceError < 1e-9, 'eyes, muzzle, mouth and ear preserve their spacing');
    assert.ok(report.maxSegmentLengthError < 1e-12, 'kinematic fixture preserves bone lengths');
    assert.ok(report.maxSoleError < 1e-9, 'actual mesh soles match supplied rigid contact transforms');
    assert.equal(report.flippedTriangles, 0, `triangle inversion at phase ${phase}: ${report.minAreaRatio}`);
    assert.equal(report.degenerateTriangles, 0);
  }
  assert.ok(calls() > 500, 'inspect actual generated Canvas geometry, not an unused analytical face transform');
});

test('supplied limb stretch remains visible in diagnostics', () => {
  const { painter } = harness(), skeleton = pose();
  const limb = skeleton.limbs.nearFore;
  const source = GROUNDED_JOINTS.fore;
  // Deliberate bad caller input: the upper bone is twice as long. Surface
  // diagnostics must expose it; the painter must not normalize the report.
  limb.joint.x = limb.root.x + 2 * (source[1].x - source[0].x);
  limb.joint.y = limb.root.y + 2 * (source[1].y - source[0].y);
  painter.draw(skeleton);
  assert.ok(Math.abs(painter.inspect().segmentLengthRatios.nearFore[0] - 2) < 1e-12);
  assert.ok(painter.inspect().maxSegmentLengthError >= 1 - 1e-12);
});

test('invalid skeletons never reach Canvas', () => {
  const { painter, calls } = harness(), skeleton = pose();
  skeleton.limbs.nearFore.pad.x = NaN;
  assert.equal(painter.draw(skeleton), false);
  assert.equal(painter.inspect().finite, false);
  assert.equal(calls(), 0);
});
