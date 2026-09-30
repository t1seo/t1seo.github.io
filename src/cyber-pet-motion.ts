import type { MilkyPoint } from './cyber-pet-geometry.ts';

const FLOOR_ASPECT = 941 / 1672;
const RAMP = 0.17;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
// Smoothstep velocity ramps remove the jerk of a linear ramp at both ends of a walk while
// integrating to the same area, so walk duration math is unchanged from the linear version.
const smooth = (s: number) => s * s * (3 - 2 * s);
const smoothIntegral = (s: number) => s * s * s * (1 - s / 2);

export interface MilkyWalk {
  origin: MilkyPoint;
  target: MilkyPoint;
  distance: number;
  duration: number;
  initialRatio: number;
  area: number;
}

/** Distances use room-width units so a vertical step is not stretched by the artwork's aspect ratio. */
export function milkyDistance(a: MilkyPoint, b: MilkyPoint): number {
  return Math.hypot(b.x - a.x, (b.y - a.y) * FLOOR_ASPECT);
}

/** A gait cycle covers a real stride, not a time-based animation sliding across the floor. */
export function milkyStride(bodyWidth: number): number {
  // Reviewed photo poses: the near hind paw travels ~395px backward over half a
  // cycle, against a ~1230px body silhouette. 2 × 395 / 1230 ≈ .64 per cycle.
  return Math.max(0.008, bodyWidth * 0.64);
}

/**
 * Nudge the stride so the walk ends near phase 4, whose planted hind paw matches the
 * standing pose. The dog then settles without a limb pop. Walks shorter than a cycle,
 * or ones needing more than a small cadence change, keep the honest nominal stride.
 */
export function milkyGaitStride(nominal: number, distance: number, startPhase = 0.5): number {
  if (!(nominal > 0)) return 0.008;
  if (!(distance > 0) || !Number.isFinite(startPhase)) return nominal;
  const tail = ((0.5 - startPhase) % 1 + 1) % 1;
  const cycles = Math.max(0, Math.round(distance / nominal - tail)) + tail;
  if (cycles <= 0) return nominal;
  const stride = distance / cycles;
  return stride >= nominal * 0.86 && stride <= nominal * 1.16 ? stride : nominal;
}

/** The gait advances by accumulated phase (cycles), so a new walk's stride never jumps a limb. */
export function milkyGaitFrame(phase: number, frames = 8): number {
  if (!Number.isFinite(phase)) return 0;
  const fraction = ((phase % 1) + 1) % 1;
  return Math.floor(fraction * frames + 1e-4) % frames;
}

export function createMilkyWalk(origin: MilkyPoint, target: MilkyPoint, speed: number, initialSpeed = 0): MilkyWalk {
  const distance = milkyDistance(origin, target);
  const targetSpeed = Math.max(0.005, speed);
  const initialRatio = clamp01(initialSpeed / targetSpeed);
  const area = 1 - RAMP + initialRatio * RAMP / 2;
  return { origin: { ...origin }, target: { ...target }, distance,
    duration: distance > 0 ? distance / (targetSpeed * area) * 1000 : 0,
    initialRatio, area };
}

export function sampleMilkyWalk(walk: MilkyWalk, elapsed: number) {
  if (walk.duration <= 0) return { position: { ...walk.target }, distance: 0, speed: 0, done: true };
  const time = clamp01(elapsed / walk.duration);
  let integral: number;
  let velocity: number;
  if (time < RAMP) {
    const s = time / RAMP;
    integral = RAMP * (walk.initialRatio * s + (1 - walk.initialRatio) * smoothIntegral(s));
    velocity = walk.initialRatio + (1 - walk.initialRatio) * smooth(s);
  } else if (time <= 1 - RAMP) {
    integral = RAMP * (1 + walk.initialRatio) / 2 + time - RAMP;
    velocity = 1;
  } else {
    const s = (time - (1 - RAMP)) / RAMP;
    integral = RAMP * (1 + walk.initialRatio) / 2 + 1 - 2 * RAMP + RAMP * (s - smoothIntegral(s));
    velocity = 1 - smooth(s);
  }
  const progress = time === 1 ? 1 : clamp01(integral / walk.area);
  return {
    position: {
      x: walk.origin.x + (walk.target.x - walk.origin.x) * progress,
      y: walk.origin.y + (walk.target.y - walk.origin.y) * progress,
    },
    distance: walk.distance * progress,
    speed: time === 1 ? 0 : walk.distance / (walk.duration / 1000) * velocity / walk.area,
    done: time === 1,
  };
}

/** Preserve momentum only for compatible headings. A reversal must first stop and turn. */
export function milkyCanContinue(walk: MilkyWalk, from: MilkyPoint, target: MilkyPoint): boolean {
  const ax = walk.target.x - walk.origin.x;
  const ay = (walk.target.y - walk.origin.y) * FLOOR_ASPECT;
  const bx = target.x - from.x;
  const by = (target.y - from.y) * FLOOR_ASPECT;
  const product = Math.hypot(ax, ay) * Math.hypot(bx, by);
  return product > 0 && (ax * bx + ay * by) / product > 0.80;
}

export function milkyDepthScale(pawY: number): number {
  return 0.91 + clamp01((pawY - 0.83) / 0.125) * 0.09;
}
