import { createGroundedSkeleton, GROUNDED_PADS } from './cyber-pet-grounded-articulation.ts';
import { GROUNDED_FEET, GROUNDED_JOINTS, solveGroundJoint } from './cyber-pet-grounded-geometry.ts';
import type { GroundedFoot, GroundPoint } from './cyber-pet-grounded-geometry.ts';
import type { NaturalSkeleton } from './cyber-pet-natural-render.ts';

/** A local, attributed research clip; see asset-sources/milky-natural-motion. */
export interface NaturalReference {
  names: string[];
  duration: number;
  frames: { time: number; joints: [number, number][] }[];
}
const TAU = 2 * Math.PI;
const wrap = (p: number) => ((p % 1) + 1) % 1;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => { const t = clamp(v, 0, 1); return t * t * t * (10 + t * (-15 + t * 6)); };
const deltaAngle = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const positive = (x: number, softness: number) => softness * (Math.max(x / softness, 0) + Math.log1p(Math.exp(-Math.abs(x / softness))));
const softClamp = (x: number, low: number, high: number, softness: number) => low + positive(x - low, softness) - positive(x - high, softness);

/** A periodic, low-pass least-squares representation, not a raw-data seam claim. */
function periodic(values: number[]) {
  // The final frame is the endpoint, not another independent sample.
  const n = values.length - 1, mean = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const harmonics = Array.from({ length: 5 }, (_, j) => {
    const k = j + 1;
    let cos = 0, sin = 0;
    for (let i = 0; i < n; i++) {
      const phase = TAU * k * i / n;
      cos += (values[i] - mean) * Math.cos(phase) * 2 / n;
      sin += (values[i] - mean) * Math.sin(phase) * 2 / n;
    }
    return { k, cos, sin };
  });
  const sample = (phase: number) => harmonics.reduce((v, h) => v + h.cos * Math.cos(TAU * h.k * phase) + h.sin * Math.sin(TAU * h.k * phase), mean);
  return { sample, mean, deviation: (phase: number) => sample(phase) - mean };
}

// Contact starts were authored from the four distinct forward extrema of the
// selected performance. Contact durations are retargeting choices, not labels
// supplied by the dataset. Every paw travels at the same root speed in stance.
export const NATURAL_STEPS = {
  nearFore: { kind: 'fore', start: .785, duty: .64, center: 1082, floor: 970, rootX: 1070, rootY: 575, lift: 39, marker: 'b__LeftFinger', wrist: 'b_LeftHand', shoulder: 'b_LeftArm' },
  farFore: { kind: 'fore', start: .301, duty: .64, center: 1172, floor: 950, rootX: 1160, rootY: 575, lift: 37, marker: 'b_RightFinger', wrist: 'b_RightHand', shoulder: 'b_RightArm' },
  nearHind: { kind: 'hind', start: .473, duty: .60, center: 455, floor: 952, rootX: 485, rootY: 575, lift: 38, marker: 'b_LeftToe', wrist: 'b_LeftAnkle', shoulder: 'b_LeftLegUpper' },
  farHind: { kind: 'hind', start: .989, duty: .60, center: 550, floor: 933, rootX: 580, rootY: 575, lift: 36, marker: 'b_RightToe', wrist: 'b_RightAnkle', shoulder: 'b_RightLegUpper' },
} as const;

function distalInReach(root: GroundPoint, pad: GroundPoint, distal: number, upper: number, lower: number, preferred: number) {
  const dx = pad.x - root.x, dy = pad.y - root.y, distance = Math.hypot(dx, dy);
  const direction = Math.atan2(dy, dx), divisor = Math.max(1e-8, 2 * distance * distal);
  const outer = upper + lower - .3;
  const inner = Math.abs(upper - lower) + .3;
  const max = Math.acos(clamp((distance * distance + distal * distal - outer * outer) / divisor, -1, 1));
  const min = Math.acos(clamp((distance * distance + distal * distal - inner * inner) / divisor, -1, 1));
  const delta = deltaAngle(preferred, direction);
  const limited = softClamp(delta, -max, max, .025);
  return direction + (min ? Math.sign(limited || 1) * Math.max(min, Math.abs(limited)) : limited);
}

export function createNaturalMotion(reference: NaturalReference) {
  if (reference.frames.length < 12 || !(reference.duration > 0)) throw new Error('Invalid natural-motion reference');
  const index = (name: string) => {
    const i = reference.names.indexOf(name);
    if (i < 0) throw new Error(`Missing motion joint: ${name}`);
    return i;
  };
  const position = (name: string, axis: 0 | 1) => {
    const i = index(name);
    return periodic(reference.frames.map(f => f.joints[i][axis]));
  };
  const angle = (from: string, to: string) => {
    const a = index(from), b = index(to);
    const values = reference.frames.map(f => Math.atan2(-(f.joints[b][1] - f.joints[a][1]), f.joints[b][0] - f.joints[a][0]));
    return periodic(values.map(v => values[0] + deltaAngle(v, values[0])));
  };
  const hips = position('b_Hips', 1), chest = position('b_Spine3', 1);
  const spine = angle('b_Hips', 'b_Spine3');
  const head = angle('b__Neck2', 'b_Head'), tail = angle('b_Tail001', 'b_Tail003');
  const curves = Object.fromEntries(GROUNDED_FEET.map(name => {
    const step = NATURAL_STEPS[name];
    return [name, { height: position(step.marker, 1), distal: angle(step.wrist, step.marker), shoulder: position(step.shoulder, 0) }];
  })) as Record<GroundedFoot, { height: ReturnType<typeof periodic>; distal: ReturnType<typeof periodic>; shoulder: ReturnType<typeof periodic> }>;
  // Same small-dog shape at all speeds. This is an authored slower retarget,
  // rather than pretending the source Labrador's scale/cadence was measured on Milky.
  const duration = 1.04, stride = 370;

  function contacts(phase: number) {
    return Object.fromEntries(GROUNDED_FEET.map(name => [name, wrap(phase - NATURAL_STEPS[name].start) < NATURAL_STEPS[name].duty])) as Record<GroundedFoot, boolean>;
  }

  function sample(phase: number): NaturalSkeleton {
    phase = wrap(phase);
    const out: NaturalSkeleton = createGroundedSkeleton();
    const pelvisY = 22 - hips.deviation(phase) * 6;
    const chestY = 24 - chest.deviation(phase) * 6;
    const pitch = (chestY - pelvisY) / 585;
    const pelvisAngle = spine.deviation(phase) * .25 + pitch * .65;
    const chestAngle = spine.deviation(phase) * .25 + pitch * .65;
    out.deformation = {
      pelvis: { x: 485, y: 575 + pelvisY, angle: pelvisAngle },
      chest: { x: 1070, y: 575 + chestY, angle: chestAngle },
      headAngle: -chestAngle * .75 + head.deviation(phase) * .23,
      tailAngle: tail.deviation(phase - .04) * .35,
    };
    out.body = { y: (pelvisY + chestY) / 2, pitch, head: out.deformation.headAngle, tail: out.deformation.tailAngle };
    for (const name of GROUNDED_FEET) {
      const step = NATURAL_STEPS[name], curve = curves[name], limb = out.limbs[name];
      const p = wrap(phase - step.start), planted = p < step.duty;
      const swing = planted ? 0 : (p - step.duty) / (1 - step.duty);
      const front = step.center + stride * step.duty / 2;
      let soleX = front - stride * p, lift = 0;
      if (!planted) {
        // Quintic progress matches the stance velocity and acceleration at
        // both ends. The tiny pre-landing retraction is deliberate, not a snap.
        soleX += stride * smooth(swing);
        const sourceHeight = curve.height.sample(phase);
        const h0 = curve.height.sample(step.start + step.duty), h1 = curve.height.sample(step.start);
        const excess = positive(sourceHeight - (h0 + (h1 - h0) * swing), .25);
        const sourceShape = 1.3 * Math.tanh(excess / (6 * 1.3));
        lift = step.lift * Math.sin(Math.PI * swing) ** 2 * (.65 + sourceShape * .55);
      }
      // The paw folds during flight and settles flat before contact. Separate
      // from distal flexion so the sole, not its ankle, is the contact point.
      limb.pawAngle = planted ? 0 : .28 * Math.tanh(curve.distal.deviation(phase) * .23 / .28) * Math.sin(Math.PI * swing) ** 2;
      const source = GROUNDED_JOINTS[step.kind], pad = GROUNDED_PADS[step.kind];
      const toeX = source[3].x - pad.x, toeY = source[3].y - pad.y;
      const c = Math.cos(limb.pawAngle), s = Math.sin(limb.pawAngle);
      limb.pad = { x: soleX - toeX * c + toeY * s, y: step.floor - lift - toeX * s - toeY * c };
      limb.root = {
        x: step.rootX + (step.kind === 'fore' ? curve.shoulder.deviation(phase) * 3.2 : 0),
        y: step.rootY + (step.kind === 'fore' ? chestY : pelvisY),
      };
      const upper = Math.hypot(source[1].x - source[0].x, source[1].y - source[0].y);
      const lower = Math.hypot(source[2].x - source[1].x, source[2].y - source[1].y);
      const distal = Math.hypot(pad.x - source[2].x, pad.y - source[2].y);
      const originalAngle = Math.atan2(pad.y - source[2].y, pad.x - source[2].x);
      // Full Labrador carpal flexion knots this short, furry painted wrist.
      // Retain the timing while reducing amplitude to this artwork's range.
      const preferred = originalAngle + curve.distal.deviation(phase) * (step.kind === 'fore' ? .35 : .55);
      const orientation = distalInReach(limb.root, limb.pad, distal, upper, lower, preferred);
      limb.distalAngle = orientation - originalAngle;
      limb.wrist = { x: limb.pad.x - distal * Math.cos(orientation), y: limb.pad.y - distal * Math.sin(orientation) };
      solveGroundJoint(limb.root, limb.wrist, upper, lower, step.kind === 'fore' ? 1 : -1, limb.joint);
    }
    return out;
  }
  return { duration, stride, sample, contacts };
}

export async function loadNaturalMotion(signal?: AbortSignal) {
  const response = await fetch('/assets/cyberpunk/milky-natural-motion/walk-cycle.json', { signal });
  if (!response.ok) throw new Error(`Natural motion returned HTTP ${response.status}`);
  return createNaturalMotion(await response.json() as NaturalReference);
}
