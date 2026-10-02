import type { AuthoredCanine, AuthoredPose, AuthoredMode } from './cyber-pet-authored-clip.ts';
import { createGroundedSkeleton, GROUNDED_PADS } from './cyber-pet-grounded-articulation.ts';
import { GROUNDED_FEET, GROUNDED_JOINTS, GROUNDED_LIMBS } from './cyber-pet-grounded-geometry.ts';
import type { GroundedSkeleton } from './cyber-pet-grounded-articulation.ts';
type Point = { x: number; y: number };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const angle = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const bone = (p: AuthoredPose, n: string) => p.bones[n]!.position;
/** Project an authored quadruped's complete bone motion onto Milky's existing art.
 * Bind-pose offsets preserve the image proportions; no procedural gait or IK is used.
 */
export function createAuthoredRig(canine: AuthoredCanine) {
  const out = createGroundedSkeleton();
  const rest = canine.rest;
  function project(pose: AuthoredPose, name: string, target: Point, sx: number, sy: number, weight: number): Point {
    const a = bone(pose, name), b = bone(rest, name);
    return { x: target.x + (a.z - b.z) * sx * weight, y: target.y - (a.y - b.y) * sy * weight };
  }
  function solve(mode: AuthoredMode, seconds: number, weight = 1): GroundedSkeleton {
    const pose = canine.sample(mode, seconds), u = Math.max(0, Math.min(1, weight));
    for (const name of GROUNDED_FEET) {
      const definition = GROUNDED_LIMBS[name], kind = definition.kind;
      const far = name.startsWith('far'), side = far ? 'R' : 'L';
      const joints = GROUNDED_JOINTS[kind], sourcePad = GROUNDED_PADS[kind];
      const shiftX = definition.root.x - joints[0].x, shiftY = definition.root.y - joints[0].y;
      const depth = far ? .9 : 1;
      const at = (p: Point) => ({ x: definition.root.x + (p.x - joints[0].x) * depth, y: definition.root.y + (p.y - joints[0].y) * depth });
      const fore = kind === 'fore', sx = (fore ? 230 : 190) * depth, sy = (fore ? 282 : 228) * depth;
      const limb = out.limbs[name];
      const rootName = `${fore ? 'FrontUpperLeg' : 'BackLeg'}.${side}`;
      const jointName = `${fore ? 'FrontLowerLeg' : 'BackUpperLeg'}.${side}`;
      const padName = `${fore ? 'IKFrontLeg' : 'IKBackLeg'}.${side}`;
      const toeName = `${fore ? 'FF' : 'FFB'}.${side}`;
      Object.assign(limb.root, project(pose, rootName, { x: joints[0].x + shiftX, y: joints[0].y + shiftY }, sx, sy, u));
      Object.assign(limb.joint, project(pose, jointName, at(joints[1]), sx, sy, u), { reachable: true });
      Object.assign(limb.pad, project(pose, padName, at(sourcePad), sx, sy, u));
      if (fore) {
        // The source has one long forearm; split it at the artwork's wrist.
        const f = (joints[2].y - joints[1].y) / (sourcePad.y - joints[1].y);
        const a = bone(pose, jointName), b = bone(pose, padName), ra = bone(rest, jointName), rb = bone(rest, padName);
        const target = at(joints[2]);
        limb.wrist.x = target.x + (lerp(a.z,b.z,f) - lerp(ra.z,rb.z,f)) * sx * u;
        limb.wrist.y = target.y - (lerp(a.y,b.y,f) - lerp(ra.y,rb.y,f)) * sy * u;
      } else Object.assign(limb.wrist, project(pose, `BackLowerLeg.${side}`, at(joints[2]), sx, sy, u));
      const toe = project(pose, toeName, at(joints[3]), sx, sy, u);
      limb.pawAngle = wrap(angle(limb.pad, toe) - angle(sourcePad, joints[3]));
      limb.distalAngle = wrap(angle(limb.wrist, limb.pad) - angle(joints[2], sourcePad));
    }
    const fore = (out.limbs.nearFore.root.y - GROUNDED_LIMBS.nearFore.root.y + out.limbs.farFore.root.y - GROUNDED_LIMBS.farFore.root.y) / 2;
    const hind = (out.limbs.nearHind.root.y - GROUNDED_LIMBS.nearHind.root.y + out.limbs.farHind.root.y - GROUNDED_LIMBS.farHind.root.y) / 2;
    out.body.y = (fore + hind) / 2;
    out.body.pitch = Math.atan2(fore - hind, 585);
    const projectedAngle = (p: AuthoredPose, a: string, b: string) => { const x = bone(p,a), y = bone(p,b); return Math.atan2(-(y.y-x.y),y.z-x.z); };
    out.body.head = wrap(projectedAngle(pose,'Neck1','Head') - projectedAngle(rest,'Neck1','Head')) * u - out.body.pitch;
    out.body.tail = wrap(projectedAngle(pose,'Tail1','Tail3') - projectedAngle(rest,'Tail1','Tail3')) * u - out.body.pitch;
    return out;
  }
  return { sample: solve };
}
