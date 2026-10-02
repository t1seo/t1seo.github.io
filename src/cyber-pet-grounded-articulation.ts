import { GROUNDED_ART, GROUNDED_FEET, GROUNDED_JOINTS, GROUNDED_LIMBS, solveGroundJoint } from './cyber-pet-grounded-geometry.ts';
import type { GroundedFoot, GroundJoint } from './cyber-pet-grounded-geometry.ts';
import type { GroundedRenderSample } from './cyber-pet-grounded-render.ts';
import { canineProfile } from './cyber-pet-canine-profile.ts';
import { CANINE_STANCE } from './cyber-pet-canine-data.ts';

type Point = { x: number; y: number };
type Limb = { root: Point; wrist: Point; pad: Point; joint: GroundJoint; pawAngle: number; distalAngle: number };
export type GroundedSkeleton = { body: { y: number; pitch: number; head: number; tail: number }; limbs: Record<GroundedFoot, Limb> };
export const GROUNDED_BODY_PIVOT = { x: 795, y: 575 } as const;
// Metacarpal/metatarsal joint: the furry paw is separate from the distal leg.
export const GROUNDED_PADS = { fore: { x: 1055, y: 945 }, hind: { x: 340, y: 925 } } as const;
const RAD = Math.PI / 180;
const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));
const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

export function createGroundedSkeleton(): GroundedSkeleton {
  const limb = (): Limb => ({ root: { x: 0, y: 0 }, wrist: { x: 0, y: 0 }, pad: { x: 0, y: 0 }, joint: { x: 0, y: 0, reachable: false }, pawAngle: 0, distalAngle: 0 });
  return { body: { y: 0, pitch: 0, head: 0, tail: 0 }, limbs: { nearHind: limb(), nearFore: limb(), farHind: limb(), farFore: limb() } };
}

/** Project a measured distal orientation into the three-bone limb's reach cone. */
function reachableDistal(root: Point, pad: Point, length: number, upper: number, lower: number, preferred: number): number {
  const dx = pad.x - root.x, dy = pad.y - root.y, distance = Math.hypot(dx, dy);
  const direction = Math.atan2(dy, dx), divisor = Math.max(1e-8, 2 * distance * length);
  const outer = Math.min(upper + lower - .01, Math.max(upper + lower - 12, distance - length + .01));
  const inner = Math.max(Math.abs(upper - lower) + .01, Math.min(Math.abs(upper - lower) + 16, distance + length - .01));
  const maximum = Math.acos(clamp((distance * distance + length * length - outer ** 2) / divisor, -1, 1));
  const minimum = Math.acos(clamp((distance * distance + length * length - inner ** 2) / divisor, -1, 1));
  const delta = wrap(preferred - direction);
  return direction + (delta < 0 ? -1 : 1) * clamp(Math.abs(delta), minimum, maximum);
}

/** Measured limb-specific phase curves provide the pose; world contacts remain exact. */
export function solveGroundedSkeleton(sample: GroundedRenderSample, out: GroundedSkeleton): boolean {
  const strength = clamp(sample.load / GROUNDED_ART.bodyLoad, 0, 1);
  const height = (name: GroundedFoot) => {
    const kind = GROUNDED_LIMBS[name].kind;
    return -canineProfile(kind, sample.feet[name].phase, kind === 'fore' ? 4 : 3) * 585;
  };
  const foreHeight = (height('nearFore') + height('farFore')) / 2;
  const hindHeight = (height('nearHind') + height('farHind')) / 2;
  out.body.y = sample.load + (foreHeight + hindHeight) / 2 * strength;
  out.body.pitch = clamp((foreHeight - hindHeight) / 585, -.025, .025) * strength;
  // Authored secondary motion, not recorded head/tail data. Stabilize the gaze
  // against trunk pitch, and let the curled tail follow the hips with a phase lag.
  out.body.head = -out.body.pitch * .7 + clamp(foreHeight / 585, -.015, .015) * strength;
  out.body.tail = canineProfile('hind', sample.feet.nearHind.phase - .12, 3) * .7 * strength;
  const c = Math.cos(out.body.pitch), s = Math.sin(out.body.pitch);
  let reachable = true;
  for (const name of GROUNDED_FEET) {
    const art = GROUNDED_LIMBS[name], source = GROUNDED_JOINTS[art.kind], pad = GROUNDED_PADS[art.kind];
    const foot = sample.feet[name], limb = out.limbs[name];
    const x = art.root.x - GROUNDED_BODY_PIVOT.x, y = art.root.y - GROUNDED_BODY_PIVOT.y;
    // The scapula advances/retracts the shoulder underneath the unchanged torso art.
    const scapula = art.kind === 'fore' ? (Math.sin(canineProfile('fore', foot.phase, 0) * RAD) - Math.sin(15 * RAD)) * 70 * strength : 0;
    limb.root.x = GROUNDED_BODY_PIVOT.x + x * c - y * s + scapula;
    limb.root.y = GROUNDED_BODY_PIVOT.y + x * s + y * c + out.body.y;
    const elevation = canineProfile(art.kind, foot.phase, art.kind === 'fore' ? 3 : 2);
    const sourceAngle = Math.atan2(pad.y - source[2].y, pad.x - source[2].x);
    const desired = sourceAngle + wrap(Math.PI / 2 - elevation * RAD - sourceAngle) * strength;
    const swing = clamp((foot.phase - CANINE_STANCE) / (1 - CANINE_STANCE), 0, 1);
    const clearance = clamp(foot.lift / sample.scale / 35, 0, 1);
    limb.pawAngle = foot.contact ? 0 : clamp((Math.PI / 2 - elevation * RAD - sourceAngle) * .65, -.35, 1.1) * Math.sin(Math.PI * swing) * clearance * strength;
    const pc = Math.cos(limb.pawAngle), ps = Math.sin(limb.pawAngle);
    const toeX = source[3].x - pad.x, toeY = source[3].y - pad.y;
    const soleX = (foot.x - sample.root.x) / sample.scale * sample.facing + GROUNDED_ART.anchorX;
    const soleY = (foot.y - sample.root.y) / sample.scale + GROUNDED_ART.anchorY;
    limb.pad.x = soleX - toeX * pc + toeY * ps;
    limb.pad.y = soleY - toeX * ps - toeY * pc;
    const upper = Math.hypot(source[1].x - source[0].x, source[1].y - source[0].y);
    const lower = Math.hypot(source[2].x - source[1].x, source[2].y - source[1].y);
    const distal = Math.hypot(pad.x - source[2].x, pad.y - source[2].y);
    const angle = reachableDistal(limb.root, limb.pad, distal, upper, lower, desired);
    limb.distalAngle = angle - sourceAngle;
    limb.wrist.x = limb.pad.x - distal * Math.cos(angle);
    limb.wrist.y = limb.pad.y - distal * Math.sin(angle);
    solveGroundJoint(limb.root, limb.wrist, upper, lower, art.kind === 'fore' ? 1 : -1, limb.joint);
    reachable = limb.joint.reachable && reachable;
  }
  return reachable;
}
