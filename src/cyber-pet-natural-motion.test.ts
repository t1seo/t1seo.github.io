import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { createNaturalMotion, NATURAL_STEPS } from './cyber-pet-natural-motion.ts';
import type { NaturalReference } from './cyber-pet-natural-motion.ts';
import { createNaturalPainter } from './cyber-pet-natural-render.ts';
import type { NaturalSkeleton } from './cyber-pet-natural-render.ts';
import { GROUNDED_FEET, GROUNDED_JOINTS } from './cyber-pet-grounded-geometry.ts';
import type { GroundedFoot, GroundPoint } from './cyber-pet-grounded-geometry.ts';
import { GROUNDED_PADS } from './cyber-pet-grounded-articulation.ts';
import type { GroundedWalkAssets } from './cyber-pet-grounded-assets.ts';

// Use the actual candidate runtime reference, never a synthetic replacement or a
// machine-specific research file that would silently conceal a missing asset.
const referencePath = new URL('../public/assets/cyberpunk/milky-natural-motion/walk-cycle.json', import.meta.url);
const referenceBytes = readFileSync(referencePath);
const reference = JSON.parse(referenceBytes.toString()) as NaturalReference;
const motion = createNaturalMotion(reference);
const hash = (value: Buffer): string => createHash('sha256').update(value).digest('hex');
const distance = (a: GroundPoint, b: GroundPoint): number => Math.hypot(a.x - b.x, a.y - b.y);
const limits = {
  boneLengthError: 1e-6,
  stanceWorldDrift: 1e-5,
  stanceWorldSpeed: 1e-4,
  seamPositionError: 1e-4,
  seamVelocityError: .01,
  faceDistanceError: 1e-7,
  minimumTriangleAreaRatio: 1e-6,
} as const;
const cycleSamples = 2048;
type Worst = { value: number; phase: number; detail: string };
const worst = (value = 0): Worst => ({ value, phase: 0, detail: '' });
function maximize(current: Worst, value: number, phase: number, detail: string): void {
  if (value > current.value) Object.assign(current, { value, phase, detail });
}
function minimize(current: Worst, value: number, phase: number, detail: string): void {
  if (value < current.value) Object.assign(current, { value, phase, detail });
}

function sole(skeleton: NaturalSkeleton, name: GroundedFoot): GroundPoint {
  const kind = NATURAL_STEPS[name].kind, limb = skeleton.limbs[name];
  const neutral = GROUNDED_JOINTS[kind][3], pivot = GROUNDED_PADS[kind];
  const x = neutral.x - pivot.x, y = neutral.y - pivot.y;
  return { x: limb.pad.x + x * Math.cos(limb.pawAngle) - y * Math.sin(limb.pawAngle),
    y: limb.pad.y + x * Math.sin(limb.pawAngle) + y * Math.cos(limb.pawAngle) };
}

function channels(skeleton: NaturalSkeleton): Record<string, number> {
  const values: Record<string, number> = { ...skeleton.body };
  for (const name of GROUNDED_FEET) {
    const limb = skeleton.limbs[name];
    for (const key of ['root', 'joint', 'wrist', 'pad'] as const) {
      values[`${name}.${key}.x`] = limb[key].x;
      values[`${name}.${key}.y`] = limb[key].y;
    }
    values[`${name}.pawAngle`] = limb.pawAngle;
    values[`${name}.distalAngle`] = limb.distalAngle;
    const point = sole(skeleton, name);
    values[`${name}.sole.x`] = point.x;
    values[`${name}.sole.y`] = point.y;
  }
  if (skeleton.deformation) {
    for (const key of ['pelvis', 'chest'] as const) {
      for (const axis of ['x', 'y', 'angle'] as const) values[`${key}.${axis}`] = skeleton.deformation[key][axis];
    }
    values['deformation.headAngle'] = skeleton.deformation.headAngle;
    values['deformation.tailAngle'] = skeleton.deformation.tailAngle;
  }
  return values;
}

type Affine = readonly [number, number, number, number, number, number];
type SubmittedTriangle = { matrix: Affine; polygon: GroundPoint[]; image: object; layer: string; index: number };
function apply(matrix: Affine, point: GroundPoint): GroundPoint {
  const [a, b, c, d, e, f] = matrix;
  return { x: a * point.x + c * point.y + e, y: b * point.x + d * point.y + f };
}
function invert(matrix: Affine, point: GroundPoint): GroundPoint {
  const [a, b, c, d, e, f] = matrix, determinant = a * d - b * c;
  return { x: ((point.x - e) * d - (point.y - f) * c) / determinant,
    y: ((point.y - f) * a - (point.x - e) * b) / determinant };
}
function contains(polygon: GroundPoint[], point: GroundPoint): boolean {
  if (polygon.length !== 3) return false;
  const [a, b, c] = polygon;
  const determinant = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  if (Math.abs(determinant) < 1e-9) return false;
  const u = ((point.x - a.x) * (c.y - a.y) - (point.y - a.y) * (c.x - a.x)) / determinant;
  const v = ((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)) / determinant;
  return u >= -1e-8 && v >= -1e-8 && u + v <= 1 + 1e-8;
}

function painterHarness() {
  const fore = {}, hind = {}, torso = {};
  const asset = (image: object) => ({ image, width: 768, height: 512 });
  let polygon: GroundPoint[] = [], matrix: Affine = [1, 0, 0, 1, 0, 0];
  const stack: { polygon: GroundPoint[]; matrix: Affine }[] = [];
  const submitted: SubmittedTriangle[] = [];
  const layerNames = ['farHind', 'farFore', 'nearHind', 'nearFore', 'torso'];
  let previousImage: object | null = null, layer = -1, triangle = 0;
  const context = {
    globalAlpha: 1,
    save() { stack.push({ polygon, matrix }); },
    restore() { ({ polygon, matrix } = stack.pop()!); },
    beginPath() { polygon = []; }, closePath() {}, clip() {},
    moveTo(x: number, y: number) { polygon.push({ x, y }); },
    lineTo(x: number, y: number) { polygon.push({ x, y }); },
    getTransform: () => ({ a: .11 }),
    transform(...values: number[]) { matrix = values as unknown as Affine; },
    drawImage(image: object) {
      if (image !== previousImage) { previousImage = image; layer++; triangle = 0; }
      submitted.push({ matrix, polygon, image, layer: layerNames[layer], index: triangle++ });
    },
  } as unknown as CanvasRenderingContext2D;
  const painter = createNaturalPainter(context, { foreleg: asset(fore), hindleg: asset(hind), torso: asset(torso) } as unknown as GroundedWalkAssets);
  return { painter, torso, submitted, reset() { submitted.length = 0; previousImage = null; layer = -1; triangle = 0; } };
}

function measureActualCycle() {
  const boneLength = worst(), reachMargin = worst(Infinity), jointBendMargin = worst(Infinity);
  const nonfinite: { phase: number; channel: string }[] = [], unreachable: { phase: number; name: GroundedFoot }[] = [];
  const area = worst(Infinity), maximumArea = worst(), faceError = worst(), rigidFaceError = worst();
  const submittedFaceError = worst(), submittedInspectionDifference = worst();
  const painterSoleError = worst(), submittedSoleError = worst(), submittedStanceDrift = worst(), submittedStanceSpeed = worst();
  const stanceAnchors: Partial<Record<GroundedFoot, GroundPoint>> = {}, previousSoles: Partial<Record<GroundedFoot, GroundPoint>> = {};
  const maximumFlips = worst(), maximumDegenerate = worst(), minimumSubmittedArea = worst(Infinity);
  const badTriangles: { phase: number; layer: string; index: number; areaRatio: number; sourceCentroid: GroundPoint }[] = [];
  let framesWithFolds = 0, drawRejected = 0, missingFaceLandmarks = 0, missingSoleLandmarks = 0;
  const harness = painterHarness();
  for (let frame = 0; frame <= cycleSamples; frame++) {
    const phase = frame / cycleSamples, skeleton = motion.sample(phase);
    for (const [channel, value] of Object.entries(channels(skeleton))) if (!Number.isFinite(value)) nonfinite.push({ phase, channel });
    for (const name of GROUNDED_FEET) {
      const kind = NATURAL_STEPS[name].kind, limb = skeleton.limbs[name];
      const source = [...GROUNDED_JOINTS[kind].slice(0, 3), GROUNDED_PADS[kind]];
      const actual = [limb.root, limb.joint, limb.wrist, limb.pad];
      for (let segment = 0; segment < 3; segment++) {
        maximize(boneLength, Math.abs(distance(actual[segment], actual[segment + 1]) - distance(source[segment], source[segment + 1])), phase, `${name}.segment${segment}`);
      }
      const upper = distance(source[0], source[1]), lower = distance(source[1], source[2]);
      const reach = distance(limb.root, limb.wrist);
      minimize(reachMargin, Math.min(upper + lower - reach, reach - Math.abs(upper - lower)), phase, name);
      if (!limb.joint.reachable) unreachable.push({ phase, name });
      const cross = (limb.wrist.x - limb.root.x) * (limb.joint.y - limb.root.y)
        - (limb.wrist.y - limb.root.y) * (limb.joint.x - limb.root.x);
      minimize(jointBendMargin, cross * (kind === 'fore' ? 1 : -1), phase, name);
    }
    harness.reset();
    if (!harness.painter.draw(skeleton)) drawRejected++;
    const inspection = harness.painter.inspect();
    minimize(area, inspection.minAreaRatio, phase, 'painter inspection');
    maximize(maximumArea, inspection.maxAreaRatio, phase, 'painter inspection');
    maximize(faceError, inspection.face.maxPairDistanceError, phase, 'all landmark pairs');
    maximize(rigidFaceError, inspection.face.maxRigidError, phase, 'rigid face transform');
    maximize(maximumFlips, inspection.flippedTriangles, phase, 'triangles per frame');
    maximize(maximumDegenerate, inspection.degenerateTriangles, phase, 'triangles per frame');
    if (inspection.flippedTriangles) framesWithFolds++;
    for (const triangle of harness.submitted) {
      const [a, b, c, d] = triangle.matrix, determinant = a * d - b * c;
      if (!triangle.matrix.every(Number.isFinite) || !triangle.polygon.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))) nonfinite.push({ phase, channel: 'submitted Canvas triangle' });
      if (determinant < minimumSubmittedArea.value) {
        const source = triangle.polygon.map(point => invert(triangle.matrix, point));
        const item = { phase, layer: triangle.layer, index: triangle.index, areaRatio: determinant,
          sourceCentroid: { x: source.reduce((sum, p) => sum + p.x, 0) / 3, y: source.reduce((sum, p) => sum + p.y, 0) / 3 } };
        minimize(minimumSubmittedArea, determinant, phase, `${triangle.layer}.triangle${triangle.index}`);
        if (determinant < 0) { badTriangles.push(item); if (badTriangles.length > 8) badTriangles.shift(); }
      }
    }
    const faceTriangles = harness.submitted.filter(triangle => triangle.image === harness.torso);
    const actualLandmarks = inspection.face.landmarks.map(landmark => {
      const triangle = faceTriangles.find(candidate => contains(candidate.polygon.map(point => invert(candidate.matrix, point)), landmark.source));
      if (!triangle) { missingFaceLandmarks++; return { source: landmark.source, target: { x: NaN, y: NaN } }; }
      const target = apply(triangle.matrix, landmark.source);
      maximize(submittedInspectionDifference, distance(target, landmark.target), phase, landmark.name);
      return { source: landmark.source, target };
    });
    for (const a of actualLandmarks) for (const b of actualLandmarks) {
      maximize(submittedFaceError, Math.abs(distance(a.source, b.source) - distance(a.target, b.target)), phase, 'Canvas affine landmark pairs');
    }
    const contacts = motion.contacts(phase);
    for (const name of GROUNDED_FEET) {
      const source = GROUNDED_JOINTS[NATURAL_STEPS[name].kind][3];
      const triangle = harness.submitted.find(candidate => candidate.layer === name
        && contains(candidate.polygon.map(point => invert(candidate.matrix, point)), source));
      if (!triangle) { missingSoleLandmarks++; continue; }
      const actual = apply(triangle.matrix, source), expected = sole(skeleton, name);
      maximize(submittedSoleError, distance(actual, expected), phase, name);
      maximize(painterSoleError, inspection.soles[name].error, phase, name);
      if (contacts[name]) {
        const world = { x: actual.x + motion.stride * phase, y: actual.y };
        const anchor = stanceAnchors[name] ??= world;
        maximize(submittedStanceDrift, distance(world, anchor), phase, name);
        if (previousSoles[name]) maximize(submittedStanceSpeed, distance(world, previousSoles[name]!) * cycleSamples / motion.duration, phase, name);
        previousSoles[name] = world;
      } else {
        delete stanceAnchors[name];
        delete previousSoles[name];
      }
    }
  }

  const stanceDrift = worst(), stanceSpeed = worst();
  let invalidStanceFlags = 0;
  for (const name of GROUNDED_FEET) {
    const step = NATURAL_STEPS[name];
    let first: GroundPoint | null = null, previous: GroundPoint | null = null;
    for (let index = 0; index < 1024; index++) {
      const phase = step.start + step.duty * (index + .5) / 1024;
      const point = sole(motion.sample(phase), name);
      const world = { x: point.x + motion.stride * phase, y: point.y };
      if (!motion.contacts(phase)[name]) invalidStanceFlags++;
      first ??= world;
      maximize(stanceDrift, distance(world, first), phase, name);
      if (previous) maximize(stanceSpeed, distance(world, previous) / (step.duty * motion.duration / 1024), phase, name);
      previous = world;
    }
  }

  const seamPosition = worst(), seamVelocity = worst();
  const boundaries = [{ phase: 0, name: 'cycle seam' }, ...GROUNDED_FEET.flatMap(name => [
    { phase: NATURAL_STEPS[name].start, name: `${name}.touchdown` },
    { phase: NATURAL_STEPS[name].start + NATURAL_STEPS[name].duty, name: `${name}.liftoff` },
  ]),
  // Observed in the original implementation at the .3-radian paw clamp:
  // nearFore.wrist.x jumped from 712.38 to 581.39 logical pixels/second.
  { phase: .6506110236875, name: 'observed internal paw-clamp regression' }];
  const h = 1e-5;
  for (const boundary of boundaries) {
    const [m2, m1, center, p1, p2] = [-2, -1, 0, 1, 2].map(offset => channels(motion.sample(boundary.phase + offset * h)));
    for (const key of Object.keys(center)) {
      // One-sided extrapolation exposes position jumps without counting the
      // ordinary movement across the two tiny sampling windows.
      const left = 2 * m1[key] - m2[key], right = 2 * p1[key] - p2[key];
      maximize(seamPosition, Math.abs(left - right), boundary.phase, `${boundary.name}/${key}`);
      const before = (3 * center[key] - 4 * m1[key] + m2[key]) / (2 * h * motion.duration);
      const after = (-3 * center[key] + 4 * p1[key] - p2[key]) / (2 * h * motion.duration);
      maximize(seamVelocity, Math.abs(before - after), boundary.phase, `${boundary.name}/${key}`);
    }
  }
  return { boneLength, reachMargin, jointBendMargin, nonfinite, unreachable, stanceDrift, stanceSpeed, invalidStanceFlags,
    seamPosition, seamVelocity, boundaries, area, maximumArea, maximumFlips, maximumDegenerate, framesWithFolds,
    minimumSubmittedArea, badTriangles, faceError, rigidFaceError, submittedFaceError, submittedInspectionDifference, missingFaceLandmarks, drawRejected,
    painterSoleError, submittedSoleError, submittedStanceDrift, submittedStanceSpeed, missingSoleLandmarks };
}

const measured = measureActualCycle();
const assertions = {
  finite: measured.nonfinite.length === 0 && measured.drawRejected === 0,
  fixed_bone_lengths: measured.boneLength.value <= limits.boneLengthError,
  reachable: measured.unreachable.length === 0 && measured.reachMargin.value > 1e-5 && measured.jointBendMargin.value > 0,
  fixed_world_stance: measured.stanceDrift.value <= limits.stanceWorldDrift && measured.stanceSpeed.value <= limits.stanceWorldSpeed && measured.invalidStanceFlags === 0,
  fixed_submitted_sole: measured.missingSoleLandmarks === 0 && measured.painterSoleError.value <= limits.stanceWorldDrift
    && measured.submittedSoleError.value <= limits.stanceWorldDrift && measured.submittedStanceDrift.value <= limits.stanceWorldDrift && measured.submittedStanceSpeed.value <= limits.stanceWorldSpeed,
  continuous_contact_and_cycle_boundaries: measured.seamPosition.value <= limits.seamPositionError && measured.seamVelocity.value <= limits.seamVelocityError,
  no_triangle_folds: measured.area.value > limits.minimumTriangleAreaRatio && measured.minimumSubmittedArea.value > limits.minimumTriangleAreaRatio && measured.maximumFlips.value === 0 && measured.maximumDegenerate.value === 0,
  rigid_submitted_face: measured.missingFaceLandmarks === 0 && measured.faceError.value <= limits.faceDistanceError && measured.rigidFaceError.value <= limits.faceDistanceError && measured.submittedFaceError.value <= limits.faceDistanceError && measured.submittedInspectionDifference.value <= limits.faceDistanceError,
};

if (process.env.MILKY_WRITE_VALIDATION === '1') {
  const reportPath = new URL('../asset-sources/milky-natural-motion/motion-validation.json', import.meta.url);
  const implementationHashes = Object.fromEntries(['cyber-pet-natural-motion.ts', 'cyber-pet-natural-render.ts'].map(name => [name, hash(readFileSync(new URL(name, import.meta.url)))]));
  const previous = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath).toString()) : null;
  const history: unknown[] = previous?.history ?? [];
  if (previous && JSON.stringify(previous.implementation_sha256) !== JSON.stringify(implementationHashes)) {
    const { history: _history, ...historicalReport } = previous;
    history.push(historicalReport);
  }
  const report = {
    schema_version: 1,
    status: Object.values(assertions).every(Boolean) ? 'NUMERICAL_PASS_VISUAL_NOT_ASSESSED' : 'FAIL',
    reference: { path: referencePath.pathname, sha256: hash(referenceBytes), frames: reference.frames.length },
    implementation_sha256: implementationHashes,
    method: 'Actual createNaturalMotion sampler and createNaturalPainter Canvas triangle submissions; no alternative gait or synthetic pose fixture.',
    cycle_samples: cycleSamples + 1,
    duration: motion.duration,
    stride: motion.stride,
    limits,
    assertions,
    measured,
    not_assessed: ['Visual naturalness', 'Milky likeness', 'Raster color or palette preservation', 'Real Canvas rasterization/alpha coverage', 'Runtime routing and lifecycle'],
    history,
  };
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

test('actual natural-motion cycle preserves every limb length and anatomical reach', () => {
  assert.ok(assertions.finite, JSON.stringify(measured.nonfinite.slice(0, 3)));
  assert.ok(assertions.fixed_bone_lengths, JSON.stringify(measured.boneLength));
  assert.ok(assertions.reachable, JSON.stringify({ unreachable: measured.unreachable.slice(0, 3), reach: measured.reachMargin, bend: measured.jointBendMargin }));
});

test('all four actual soles remain stationary in world space throughout stance', () => {
  assert.ok(assertions.fixed_world_stance, JSON.stringify({ drift: measured.stanceDrift, speed: measured.stanceSpeed, flags: measured.invalidStanceFlags }));
});

test('the four sole landmarks actually submitted to Canvas remain fixed during stance', () => {
  assert.ok(assertions.fixed_submitted_sole, JSON.stringify({ missing: measured.missingSoleLandmarks, analyticalDifference: measured.submittedSoleError,
    drift: measured.submittedStanceDrift, speed: measured.submittedStanceSpeed }));
});

test('actual joints and full-body pose have continuous positions and velocities at loop and contact seams', () => {
  assert.ok(assertions.continuous_contact_and_cycle_boundaries, JSON.stringify({ position: measured.seamPosition, velocity: measured.seamVelocity }));
});

test('actual natural-motion Canvas triangles never fold or degenerate over a complete cycle', () => {
  assert.ok(assertions.no_triangle_folds, JSON.stringify({ minimum: measured.area, submitted: measured.minimumSubmittedArea, flips: measured.maximumFlips, degenerate: measured.maximumDegenerate }));
});

test('actual submitted Canvas face landmarks preserve every pair distance over the full cycle', () => {
  assert.ok(assertions.rigid_submitted_face, JSON.stringify({ missing: measured.missingFaceLandmarks, face: measured.faceError, submitted: measured.submittedFaceError, inspectionDifference: measured.submittedInspectionDifference }));
});
