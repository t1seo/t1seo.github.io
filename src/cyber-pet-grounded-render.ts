import { GROUNDED_ART, GROUNDED_JOINTS, GROUNDED_LIMBS, solveGroundJoint } from './cyber-pet-grounded-geometry.ts';
import type { GroundedFoot, GroundPoint } from './cyber-pet-grounded-geometry.ts';
import type { GroundedPose } from './cyber-pet-grounded-plan.ts';
import type { GroundedWalkAssets } from './cyber-pet-grounded-assets.ts';
type Mesh = { readonly source: Float64Array; readonly target: Float64Array; readonly triangles: Uint16Array; readonly kind: 'fore' | 'hind' };
export type GroundedRenderSample = {
  readonly root: GroundPoint; readonly scale: number; readonly facing: 1 | -1;
  readonly load: number; readonly feet: Readonly<GroundedPose>;
};
const ORDER = ['farHind', 'farFore', 'nearHind', 'nearFore'] as const;
function coordinate(values: ArrayLike<number>, index: number): number {
  const value = values[index];
  if (value === undefined) throw new RangeError('Grounded mesh coordinate is outside its fixed buffer');
  return value;
}
function mesh(kind: 'fore' | 'hind'): Mesh {
  const joints = GROUNDED_JOINTS[kind];
  const ys = [0, joints[1].y - 60, joints[1].y - 30, joints[1].y, joints[1].y + 30, joints[1].y + 60, joints[2].y - 45, joints[2].y, joints[2].y + 45, 1024].sort((a, b) => a - b);
  const xs = kind === 'fore' ? [850, 980, 1110, 1240] : [180, 360, 540, 720];
  const source = new Float64Array(xs.length * ys.length * 2);
  const indices: number[] = [];
  for (const [row, y] of ys.entries()) for (const [col, x] of xs.entries()) {
    const index = (row * xs.length + col) * 2; source[index] = x; source[index + 1] = y;
    if (row > 0 && col > 0) {
      const a = ((row - 1) * xs.length + col - 1) * 2, b = a + 2, c = index, d = index - 2;
      indices.push(a, b, c, a, c, d);
    }
  }
  return { source, target: new Float64Array(source.length), triangles: new Uint16Array(indices), kind };
}
export function createGroundedPainter(context: CanvasRenderingContext2D, assets: GroundedWalkAssets) {
  const meshes = { nearHind: mesh('hind'), nearFore: mesh('fore'), farHind: mesh('hind'), farFore: mesh('fore') };
  const root = { x: 0, y: 0 }, wrist = { x: 0, y: 0 }, joint = { x: 0, y: 0, reachable: false };
  function transform(part: Mesh, name: GroundedFoot, sample: GroundedRenderSample): boolean {
    const limb = GROUNDED_LIMBS[name], source = GROUNDED_JOINTS[part.kind];
    root.x = limb.root.x; root.y = limb.root.y + sample.load;
    const foot = sample.feet[name];
    wrist.x = (foot.x - sample.root.x) / sample.scale * sample.facing + GROUNDED_ART.anchorX - (source[3].x - source[2].x);
    wrist.y = (foot.y - sample.root.y) / sample.scale + GROUNDED_ART.anchorY - (source[3].y - source[2].y);
    solveGroundJoint(root, wrist, Math.hypot(source[1].x - source[0].x, source[1].y - source[0].y), Math.hypot(source[2].x - source[1].x, source[2].y - source[1].y), part.kind === 'fore' ? 1 : -1, joint);
    const a = Math.atan2(joint.y - root.y, joint.x - root.x) - Math.atan2(source[1].y - source[0].y, source[1].x - source[0].x);
    const b = Math.atan2(wrist.y - joint.y, wrist.x - joint.x) - Math.atan2(source[2].y - source[1].y, source[2].x - source[1].x);
    const ac = Math.cos(a), as = Math.sin(a), bc = Math.cos(b), bs = Math.sin(b);
    for (let index = 0; index < part.source.length; index += 2) {
      const x = coordinate(part.source, index), y = coordinate(part.source, index + 1);
      const ax = root.x + (x - source[0].x) * ac - (y - source[0].y) * as;
      const ay = root.y + (x - source[0].x) * as + (y - source[0].y) * ac;
      const bx = joint.x + (x - source[1].x) * bc - (y - source[1].y) * bs;
      const by = joint.y + (x - source[1].x) * bs + (y - source[1].y) * bc;
      const cx = wrist.x + x - source[2].x, cy = wrist.y + y - source[2].y;
      if (y < source[1].y + 45) {
        const v = Math.max(0, Math.min(1, (y - source[1].y + 45) / 90)), u = v * v * (3 - 2 * v);
        part.target[index] = ax + (bx - ax) * u; part.target[index + 1] = ay + (by - ay) * u;
      } else {
        const v = Math.max(0, Math.min(1, (y - source[2].y + 45) / 90)), u = v * v * (3 - 2 * v);
        part.target[index] = bx + (cx - bx) * u; part.target[index + 1] = by + (cy - by) * u;
      }
    }
    return joint.reachable;
  }
  function drawPart(part: Mesh, image: CanvasImageSource, padding: number): void {
    const s = part.source, t = part.target;
    for (let index = 0; index < part.triangles.length; index += 3) {
      const i = coordinate(part.triangles, index), j = coordinate(part.triangles, index + 1), k = coordinate(part.triangles, index + 2);
      const a = coordinate(s, j) - coordinate(s, i), b = coordinate(s, j + 1) - coordinate(s, i + 1), c = coordinate(s, k) - coordinate(s, i), d = coordinate(s, k + 1) - coordinate(s, i + 1), det = a * d - b * c;
      const A = ((coordinate(t, j) - coordinate(t, i)) * d - (coordinate(t, k) - coordinate(t, i)) * b) / det;
      const B = ((coordinate(t, j + 1) - coordinate(t, i + 1)) * d - (coordinate(t, k + 1) - coordinate(t, i + 1)) * b) / det;
      const C = (a * (coordinate(t, k) - coordinate(t, i)) - c * (coordinate(t, j) - coordinate(t, i))) / det;
      const D = (a * (coordinate(t, k + 1) - coordinate(t, i + 1)) - c * (coordinate(t, j + 1) - coordinate(t, i + 1))) / det;
      const ei = Math.hypot(coordinate(t, j) - coordinate(t, k), coordinate(t, j + 1) - coordinate(t, k + 1));
      const ej = Math.hypot(coordinate(t, i) - coordinate(t, k), coordinate(t, i + 1) - coordinate(t, k + 1));
      const ek = Math.hypot(coordinate(t, i) - coordinate(t, j), coordinate(t, i + 1) - coordinate(t, j + 1));
      const perimeter = ei + ej + ek;
      const mx = (ei * coordinate(t, i) + ej * coordinate(t, j) + ek * coordinate(t, k)) / perimeter;
      const my = (ei * coordinate(t, i + 1) + ej * coordinate(t, j + 1) + ek * coordinate(t, k + 1)) / perimeter;
      const radius = Math.abs((coordinate(t, j) - coordinate(t, i)) * (coordinate(t, k + 1) - coordinate(t, i + 1)) - (coordinate(t, k) - coordinate(t, i)) * (coordinate(t, j + 1) - coordinate(t, i + 1))) / perimeter;
      if (radius < 1e-5) continue;
      const expansion = 1 + padding / radius;
      context.save(); context.beginPath();
      for (let corner = 0; corner < 3; corner++) {
        const p = coordinate(part.triangles, index + corner);
        const x = mx + (coordinate(t, p) - mx) * expansion, y = my + (coordinate(t, p + 1) - my) * expansion;
        if (corner === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.closePath(); context.clip();
      context.transform(A, B, C, D, coordinate(t, i) - A * coordinate(s, i) - C * coordinate(s, i + 1), coordinate(t, i + 1) - B * coordinate(s, i) - D * coordinate(s, i + 1));
      context.drawImage(image, 0, 0, GROUNDED_ART.width, GROUNDED_ART.height); context.restore();
    }
  }
  return {
    draw(sample: GroundedRenderSample, deviceScale?: number): boolean {
      const scale = deviceScale ?? Math.abs(context.getTransform().a);
      const padding = .45 / Math.max(.01, scale);
      let reachable = true;
      for (const name of ORDER) reachable = transform(meshes[name], name, sample) && reachable;
      if (!reachable) return false;
      for (const name of ORDER) {
        const part = meshes[name];
        context.globalAlpha = 1;
        drawPart(part, part.kind === 'fore' ? assets.foreleg.image : assets.hindleg.image, padding);
      }
      context.globalAlpha = 1;
      context.drawImage(assets.torso.image, 0, sample.load, GROUNDED_ART.width, GROUNDED_ART.height);
      return reachable;
    },
  };
}
