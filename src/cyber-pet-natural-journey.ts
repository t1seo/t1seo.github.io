import { GROUNDED_ART, GROUNDED_FEET, GROUNDED_JOINTS, solveGroundJoint } from './cyber-pet-grounded-geometry.ts';
import { GROUNDED_PADS } from './cyber-pet-grounded-articulation.ts';
import { NATURAL_STEPS } from './cyber-pet-natural-motion.ts';
import type { GroundPoint, GroundedFoot } from './cyber-pet-grounded-geometry.ts';
import type { NaturalSkeleton } from './cyber-pet-natural-render.ts';

/** No clock or frame loop: the existing pet controller owns travelled distance. */
export type NaturalJourneyMotion = {
  readonly stride: number;
  readonly duration: number;
  sample(phase: number): NaturalSkeleton;
  contacts(phase: number): Record<GroundedFoot, boolean>;
};
export type NaturalJourneyRoute = {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  /** Screen pixels per logical art unit, not the CSS wrapper scale. */
  readonly scale: number;
  readonly endScale?: number;
  readonly facing?: 1 | -1;
  readonly scaleAt?: (progress: number) => number;
};
export type NaturalJourneyOptions = {
  /** Carry a completed stance at the same root, facing and scale; airborne retargets and turns need a bridge. */
  readonly initialContacts?: Readonly<Record<GroundedFoot, GroundPoint>>;
};
export type NaturalJourneyStep = {
  /** Distances along this route, in screen pixels. */
  readonly lift: number;
  readonly land: number;
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  readonly phaseAtLift: number;
};
export type NaturalJourneyFoot = {
  /** Reconstructed from the solved skeleton, not copied from the constraint. */
  sole: GroundPoint;
  target: GroundPoint;
  contact: boolean;
  lift: number;
  reachable: boolean;
  error: number;
};
export type NaturalJourneySample = {
  root: GroundPoint;
  scale: number;
  facing: 1 | -1;
  phase: number;
  skeleton: NaturalSkeleton;
  feet: Record<GroundedFoot, NaturalJourneyFoot>;
  complete: boolean;
};
export type NaturalJourneyDiagnostics = {
  samples: number;
  cycles: number;
  maxContactError: number;
  maxTargetError: number;
  maxSegmentLengthError: number;
  unreachableSamples: number;
  initialAllGrounded: boolean;
  finalAllGrounded: boolean;
};
const wrap = (p: number) => ((p % 1) + 1) % 1;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (v: number) => { const t = clamp(v, 0, 1); return t ** 3 * (10 + t * (-15 + 6 * t)); };
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const mix = (a: number, b: number, u: number) => a + (b - a) * u;
const distanceBetween = (a: GroundPoint, b: GroundPoint) => Math.hypot(b.x - a.x, b.y - a.y);
const PHASE_START = wrap(NATURAL_STEPS.nearFore.start + NATURAL_STEPS.nearFore.duty);
const MAX_PLAN_CYCLES = 256;

function lengths(name: GroundedFoot) {
  const kind = NATURAL_STEPS[name].kind, joints = GROUNDED_JOINTS[kind], pad = GROUNDED_PADS[kind];
  return {
    upper: distanceBetween(joints[0], joints[1]), lower: distanceBetween(joints[1], joints[2]),
    distal: distanceBetween(joints[2], pad), angle: Math.atan2(pad.y - joints[2].y, pad.x - joints[2].x),
    toe: { x: joints[3].x - pad.x, y: joints[3].y - pad.y },
  };
}
const LENGTHS = Object.fromEntries(GROUNDED_FEET.map(name => [name, lengths(name)])) as Record<GroundedFoot, ReturnType<typeof lengths>>;

function sole(skeleton: NaturalSkeleton, name: GroundedFoot): GroundPoint {
  const limb = skeleton.limbs[name], { toe } = LENGTHS[name], c = Math.cos(limb.pawAngle), s = Math.sin(limb.pawAngle);
  return { x: limb.pad.x + toe.x * c - toe.y * s, y: limb.pad.y + toe.x * s + toe.y * c };
}

/** Nearest reachable pad with a preferred authored distal orientation. Never scale a bone. */
function constrain(skeleton: NaturalSkeleton, name: GroundedFoot, desired: GroundPoint, preferred: number): boolean {
  const limb = skeleton.limbs[name], { upper, lower, distal, angle, toe } = LENGTHS[name];
  const c = Math.cos(limb.pawAngle), s = Math.sin(limb.pawAngle);
  let x = desired.x - toe.x * c + toe.y * s - limb.root.x;
  let y = desired.y - toe.x * s - toe.y * c - limb.root.y;
  const requested = Math.hypot(x, y), maximum = upper + lower + distal - 1e-4;
  const minimum = Math.max(1e-4, 2 * Math.max(upper, lower, distal) - upper - lower - distal + 1e-4);
  const radius = clamp(requested, minimum, maximum), reachable = Math.abs(radius - requested) < 1e-7;
  if (requested > 1e-10) { x *= radius / requested; y *= radius / requested; }
  else { x = 0; y = radius; }
  limb.pad = { x: limb.root.x + x, y: limb.root.y + y };
  const direction = Math.atan2(y, x), divisor = 2 * radius * distal;
  const outer = upper + lower - 1e-5, inner = Math.abs(upper - lower) + 1e-5;
  const maxAngle = Math.acos(clamp((radius ** 2 + distal ** 2 - outer ** 2) / divisor, -1, 1));
  const minAngle = Math.acos(clamp((radius ** 2 + distal ** 2 - inner ** 2) / divisor, -1, 1));
  const delta = angleDelta(preferred, direction);
  const orientation = direction + (delta < 0 ? -1 : 1) * clamp(Math.abs(delta), minAngle, maxAngle);
  limb.distalAngle = orientation - angle;
  limb.wrist = { x: limb.pad.x - distal * Math.cos(orientation), y: limb.pad.y - distal * Math.sin(orientation) };
  solveGroundJoint(limb.root, limb.wrist, upper, lower, NATURAL_STEPS[name].kind === 'fore' ? 1 : -1, limb.joint);
  limb.joint.reachable = reachable && limb.joint.reachable;
  return limb.joint.reachable;
}

/**
 * Retarget the coherent walk performance to finite travel. Foot contacts are
 * planned in world space, including diagonal travel and depth scaling. First
 * and last poses are grounded stances, not necessarily the legacy idle raster.
 * Keep drawing the final pose until a separately authored idle bridge is used.
 */
export function createNaturalJourney(motion: NaturalJourneyMotion, route: NaturalJourneyRoute, options: NaturalJourneyOptions = {}) {
  const distance = distanceBetween(route.from, route.to), endScale = route.endScale ?? route.scale;
  const finite = [route.from.x, route.from.y, route.to.x, route.to.y, route.scale, endScale, motion.stride, motion.duration];
  if (!finite.every(Number.isFinite) || route.scale <= 0 || endScale <= 0 || motion.stride <= 0 || motion.duration <= 0) throw new Error('Invalid natural journey route or motion');
  if (distance === 0 && Math.abs(route.scale - endScale) > 1e-10) throw new Error('A zero-distance journey cannot change depth scale');
  const facing: 1 | -1 = route.facing ?? (route.to.x < route.from.x ? -1 : 1);
  if (facing !== 1 && facing !== -1) throw new Error('Invalid natural journey facing');
  if (options.initialContacts && !GROUNDED_FEET.every(name => {
    const point = options.initialContacts?.[name];
    return point && Number.isFinite(point.x) && Number.isFinite(point.y);
  })) throw new Error('Invalid natural journey initial contacts');
  const scaleAt = (u: number) => {
    const scale = route.scaleAt?.(u) ?? mix(route.scale, endScale, u);
    if (!(scale > 0) || !Number.isFinite(scale)) throw new Error('Invalid natural journey depth scale');
    return scale;
  };
  const rootAt = (u: number): GroundPoint => ({ x: mix(route.from.x, route.to.x, u), y: mix(route.from.y, route.to.y, u) });
  const world = (point: GroundPoint, u: number): GroundPoint => {
    const root = rootAt(u), scale = scaleAt(u);
    return { x: root.x + facing * (point.x - GROUNDED_ART.anchorX) * scale, y: root.y + (point.y - GROUNDED_ART.anchorY) * scale };
  };
  // Averages preserve the resting body silhouette. Only body/secondary motion
  // fades at the ends; each foot still completes its own planned touchdown.
  const rest = motion.sample(PHASE_START);
  const references = Array.from({ length: 32 }, (_, i) => motion.sample(i / 32));
  for (const key of ['y', 'pitch', 'head', 'tail'] as const) rest.body[key] = references.reduce((sum, pose) => sum + pose.body[key], 0) / references.length;
  for (const name of GROUNDED_FEET) for (const key of ['x', 'y'] as const) rest.limbs[name].root[key] = references.reduce((sum, pose) => sum + pose.limbs[name].root[key], 0) / references.length;
  if (rest.deformation) {
    for (const body of ['pelvis', 'chest'] as const) for (const key of ['x', 'y', 'angle'] as const) rest.deformation[body][key] = references.reduce((sum, pose) => sum + (pose.deformation?.[body][key] ?? rest.deformation![body][key]), 0) / references.length;
    for (const key of ['headAngle', 'tailAngle'] as const) rest.deformation[key] = references.reduce((sum, pose) => sum + (pose.deformation?.[key] ?? rest.deformation![key]), 0) / references.length;
  }
  let logicalDistance = 0, previous = scaleAt(0);
  for (let i = 1; i <= 64; i++) { const scale = scaleAt(i / 64); logicalDistance += distance / 64 * 2 / (scale + previous); previous = scale; }
  const vertical = distance ? Math.abs(route.to.y - route.from.y) / distance : 0;
  let cycles = distance ? Math.max(1, Math.ceil(logicalDistance / (motion.stride / (1 + vertical * 5)))) : 0;
  if (cycles > MAX_PLAN_CYCLES) throw new Error('Natural journey is too long; split this route before planning');
  const offsets = Object.fromEntries(GROUNDED_FEET.map(name => [name, wrap(NATURAL_STEPS[name].start + NATURAL_STEPS[name].duty - PHASE_START)])) as Record<GroundedFoot, number>;
  // Floating modulo at the selected leading lift must not create a spare cycle.
  offsets.nearFore = 0;
  const tail = Math.max(...GROUNDED_FEET.map(name => offsets[name] + 1 - NATURAL_STEPS[name].duty));
  let phaseSpan = 0;
  let steps = {} as Record<GroundedFoot, NaturalJourneyStep[]>;
  let initial = {} as Record<GroundedFoot, GroundPoint>;

  function plan() {
    phaseSpan = cycles ? cycles - 1 + tail : 0;
    for (const name of GROUNDED_FEET) {
      const description = NATURAL_STEPS[name];
      const nominal = { x: description.center, y: description.floor };
      const intervals = Array.from({ length: cycles }, (_, i) => {
        const phaseAtLift = offsets[name] + i;
        return { lift: phaseAtLift / phaseSpan * distance, land: (phaseAtLift + 1 - description.duty) / phaseSpan * distance, phaseAtLift: PHASE_START + phaseAtLift };
      });
      const contact = (from: number, to: number) => world(nominal, distance ? (from + to) / (2 * distance) : 0);
      initial[name] = options.initialContacts?.[name] ?? contact(0, intervals[0]?.lift ?? 0);
      let previousContact = initial[name];
      steps[name] = intervals.map((interval, i) => {
        const nextContact = contact(interval.land, intervals[i + 1]?.lift ?? distance);
        const step = { ...interval, from: previousContact, to: nextContact };
        previousContact = nextContact;
        return step;
      });
    }
  }

  function sample(travelled: number): NaturalJourneySample {
    if (!Number.isFinite(travelled)) throw new Error('Invalid natural journey travelled distance');
    const d = clamp(travelled, 0, distance), u = distance ? d / distance : 0;
    const root = rootAt(u), scale = scaleAt(u), phase = PHASE_START + phaseSpan * u;
    const skeleton = motion.sample(phase);
    const amount = Math.min(1, logicalDistance / (motion.stride * .6));
    const envelope = amount * Math.min(smooth(u / .12), smooth((1 - u) / .12));
    for (const key of ['y', 'pitch', 'head', 'tail'] as const) skeleton.body[key] = mix(rest.body[key], skeleton.body[key], envelope);
    if (skeleton.deformation && rest.deformation) {
      for (const part of ['pelvis', 'chest'] as const) for (const key of ['x', 'y', 'angle'] as const) skeleton.deformation[part][key] = mix(rest.deformation[part][key], skeleton.deformation[part][key], envelope);
      for (const key of ['headAngle', 'tailAngle'] as const) skeleton.deformation[key] = mix(rest.deformation[key], skeleton.deformation[key], envelope);
    }
    const feet = {} as Record<GroundedFoot, NaturalJourneyFoot>;
    for (const name of GROUNDED_FEET) {
      const limb = skeleton.limbs[name], description = NATURAL_STEPS[name];
      for (const axis of ['x', 'y'] as const) limb.root[axis] = mix(rest.limbs[name].root[axis], limb.root[axis], envelope);
      let target = initial[name], contact = true, lift = 0;
      limb.pawAngle = 0;
      let preferred = LENGTHS[name].angle + limb.distalAngle * envelope;
      for (const step of steps[name]) {
        if (d <= step.lift) break;
        if (d >= step.land) { target = step.to; continue; }
        contact = false;
        const t = (d - step.lift) / (step.land - step.lift), eased = smooth(t);
        const authored = motion.sample(step.phaseAtLift + t * (1 - description.duty));
        const authoredSole = sole(authored, name);
        // A short journey makes a smaller step, not a full-height marching pose.
        const strideRatio = phaseSpan ? Math.min(1, logicalDistance / phaseSpan / motion.stride) : 0;
        lift = Math.max(0, description.floor - authoredSole.y) * scale * Math.sqrt(strideRatio);
        target = { x: mix(step.from.x, step.to.x, eased), y: mix(step.from.y, step.to.y, eased) - lift };
        limb.pawAngle = authored.limbs[name].pawAngle * Math.sqrt(strideRatio);
        preferred = LENGTHS[name].angle + authored.limbs[name].distalAngle * envelope;
        break;
      }
      const local = { x: (target.x - root.x) / scale * facing + GROUNDED_ART.anchorX, y: (target.y - root.y) / scale + GROUNDED_ART.anchorY };
      const reachable = constrain(skeleton, name, local, preferred);
      const actual = world(sole(skeleton, name), u);
      feet[name] = { sole: actual, target: { ...target }, contact, lift, reachable, error: distanceBetween(actual, target) };
    }
    return { root, scale, facing, phase, skeleton, feet, complete: d === distance };
  }

  function diagnostics(samples = 241): NaturalJourneyDiagnostics {
    if (!Number.isInteger(samples) || samples < 2 || samples > 100000) throw new Error('Invalid natural journey diagnostic sample count');
    let maxContactError = 0, maxTargetError = 0, maxSegmentLengthError = 0, unreachableSamples = 0;
    for (let i = 0; i < samples; i++) {
      const frame = sample(distance * i / (samples - 1));
      for (const name of GROUNDED_FEET) {
        const foot = frame.feet[name], limb = frame.skeleton.limbs[name], expected = LENGTHS[name];
        maxTargetError = Math.max(maxTargetError, foot.error);
        if (foot.contact) maxContactError = Math.max(maxContactError, foot.error);
        if (!foot.reachable) unreachableSamples++;
        maxSegmentLengthError = Math.max(maxSegmentLengthError,
          Math.abs(distanceBetween(limb.root, limb.joint) - expected.upper),
          Math.abs(distanceBetween(limb.joint, limb.wrist) - expected.lower),
          Math.abs(distanceBetween(limb.wrist, limb.pad) - expected.distal));
      }
    }
    return { samples, cycles, maxContactError, maxTargetError, maxSegmentLengthError, unreachableSamples,
      initialAllGrounded: GROUNDED_FEET.every(name => sample(0).feet[name].contact),
      finalAllGrounded: GROUNDED_FEET.every(name => sample(distance).feet[name].contact) };
  }

  plan();
  // Depth changes shorten the stride before any pose is shown. This bounded
  // preflight cannot guarantee arbitrary scaleAt functions: unresolved reach
  // errors remain observable through diagnostics and individual samples.
  for (let attempt = 0; distance > 0 && attempt < 5; attempt++) {
    const report = diagnostics(Math.min(1601, Math.max(97, cycles * 32 + 1)));
    if (report.maxTargetError < 1e-6) break;
    const next = Math.min(MAX_PLAN_CYCLES, Math.ceil(cycles * 1.35));
    if (next === cycles) break;
    cycles = next;
    plan();
  }
  return {
    distance, route,
    get steps() { return steps; },
    get phaseSpan() { return phaseSpan; },
    /** Seconds at the retargeted source cadence; the caller still owns movement timing. */
    get nominalDuration() { return phaseSpan * motion.duration; },
    sample, diagnostics,
  };
}
