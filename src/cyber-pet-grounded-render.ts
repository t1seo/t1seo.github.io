import { GROUNDED_ART, GROUNDED_JOINTS } from './cyber-pet-grounded-geometry.ts';
import { createGroundedSkeleton, GROUNDED_BODY_PIVOT, GROUNDED_PADS, solveGroundedSkeleton } from './cyber-pet-grounded-articulation.ts';
import type { GroundedFoot, GroundPoint } from './cyber-pet-grounded-geometry.ts';
import type { GroundedSkeleton } from './cyber-pet-grounded-articulation.ts';
import type { GroundedPose } from './cyber-pet-grounded-plan.ts';
import type { GroundedWalkAssets } from './cyber-pet-grounded-assets.ts';
type Surface = { readonly source: Float64Array; readonly target: Float64Array; readonly triangles: Uint16Array };
type Mesh = Surface & { readonly kind: 'fore' | 'hind' };
export type GroundedRenderSample = {
  readonly root: GroundPoint; readonly scale: number; readonly facing: 1 | -1;
  readonly load: number; readonly feet: Readonly<GroundedPose>;
};
const ORDER = ['farHind', 'farFore', 'nearHind', 'nearFore'] as const;
const PAW_BLEND = 140;
function coordinate(values: ArrayLike<number>, index: number): number {
  const value = values[index];
  if (value === undefined) throw new RangeError('Grounded mesh coordinate is outside its fixed buffer');
  return value;
}
function mesh(kind: 'fore' | 'hind'): Mesh {
  const joints = GROUNDED_JOINTS[kind];
  const pad = GROUNDED_PADS[kind];
  const ys = [...new Set([0, joints[1].y - 60, joints[1].y - 30, joints[1].y, joints[1].y + 30, joints[1].y + 60, joints[2].y - 30, joints[2].y, joints[2].y + 30, pad.y - PAW_BLEND, pad.y - PAW_BLEND * .75, pad.y - PAW_BLEND * .5, pad.y - PAW_BLEND * .25, pad.y, 1024])].sort((a, b) => a - b);
  const xs = kind === 'fore' ? [850, 980, 1110, 1240] : [180, 360, 540, 720];
  return { ...surface(xs, ys), kind };
}
function surface(xs: readonly number[], ys: readonly number[]): Surface {
  const source = new Float64Array(xs.length * ys.length * 2);
  const indices: number[] = [];
  for (const [row, y] of ys.entries()) for (const [col, x] of xs.entries()) {
    const index = (row * xs.length + col) * 2; source[index] = x; source[index + 1] = y;
    if (row > 0 && col > 0) {
      const a = ((row - 1) * xs.length + col - 1) * 2, b = a + 2, c = index, d = index - 2;
      indices.push(a, b, c, a, c, d);
    }
  }
  return { source, target: new Float64Array(source.length), triangles: new Uint16Array(indices) };
}
export function createGroundedPainter(context: CanvasRenderingContext2D, assets: GroundedWalkAssets) {
  const meshes = { nearHind: mesh('hind'), nearFore: mesh('fore'), farHind: mesh('hind'), farFore: mesh('fore') };
  const torso = surface([0, 200, 320, 440, 560, 760, 920, 1040, 1160, 1360, 1536], [0, 200, 340, 420, 500, 580, 720, 1024]);
  const fallbackSkeleton = createGroundedSkeleton();
  let skeleton = fallbackSkeleton;
  const fade = (v: number) => { const u = Math.max(0, Math.min(1, v)); return u * u * (3 - 2 * u); };
  function transformTorso(): void {
    const { x: px, y: py } = GROUNDED_BODY_PIVOT;
    const { y: load, pitch, head, tail } = skeleton.body;
    const c = Math.cos(pitch), s = Math.sin(pitch);
    const hc = Math.cos(head), hs = Math.sin(head), tc = Math.cos(tail), ts = Math.sin(tail);
    for (let i = 0; i < torso.source.length; i += 2) {
      const x = coordinate(torso.source, i), y = coordinate(torso.source, i + 1);
      // Fully rigid face and tail tips; weights vary only at neck/tail roots.
      const neck = fade((x - 920) / 180) * fade((580 - y) / 180);
      const wag = fade((560 - x) / 180) * fade((580 - y) / 180);
      const dx = x + ((x - 1080) * (hc - 1) - (y - 480) * hs) * neck + ((x - 380) * (tc - 1) - (y - 500) * ts) * wag;
      const dy = y + ((x - 1080) * hs + (y - 480) * (hc - 1)) * neck + ((x - 380) * ts + (y - 500) * (tc - 1)) * wag;
      torso.target[i] = px + (dx - px) * c - (dy - py) * s;
      torso.target[i + 1] = py + (dx - px) * s + (dy - py) * c + load;
    }
  }
  function transform(part: Mesh, name: GroundedFoot): void {
    const source = GROUNDED_JOINTS[part.kind];
    const { root, wrist, joint, pad, pawAngle, distalAngle } = skeleton.limbs[name];
    const sourcePad = GROUNDED_PADS[part.kind];
    const a = Math.atan2(joint.y - root.y, joint.x - root.x) - Math.atan2(source[1].y - source[0].y, source[1].x - source[0].x);
    const b = Math.atan2(wrist.y - joint.y, wrist.x - joint.x) - Math.atan2(source[2].y - source[1].y, source[2].x - source[1].x);
    const ac = Math.cos(a), as = Math.sin(a), bc = Math.cos(b), bs = Math.sin(b);
    const retarget = (x: number, y: number, start: {x:number;y:number}, end: {x:number;y:number}, target: {x:number;y:number}, tip: {x:number;y:number}): [number,number] => {
      const vx=end.x-start.x, vy=end.y-start.y, length=Math.hypot(vx,vy), ux=vx/length, uy=vy/length;
      const tx=tip.x-target.x, ty=tip.y-target.y, targetLength=Math.hypot(tx,ty), along=((x-start.x)*ux+(y-start.y)*uy)/length, across=-(x-start.x)*uy+(y-start.y)*ux;
      return [target.x+tx*along-ty/targetLength*across,target.y+ty*along+tx/targetLength*across];
    };
    const pc = Math.cos(pawAngle), ps = Math.sin(pawAngle);
    const dc = Math.cos(distalAngle), ds = Math.sin(distalAngle);
    for (let index = 0; index < part.source.length; index += 2) {
      const x = coordinate(part.source, index), y = coordinate(part.source, index + 1);
      let ax = root.x + (x - source[0].x) * ac - (y - source[0].y) * as;
      let ay = root.y + (x - source[0].x) * as + (y - source[0].y) * ac;
      let bx = joint.x + (x - source[1].x) * bc - (y - source[1].y) * bs;
      let by = joint.y + (x - source[1].x) * bs + (y - source[1].y) * bc;
      let cx = wrist.x + (x - source[2].x) * dc - (y - source[2].y) * ds;
      let cy = wrist.y + (x - source[2].x) * ds + (y - source[2].y) * dc;
      if (skeleton !== fallbackSkeleton) {
        [ax, ay] = retarget(x,y,source[0],source[1],root,joint);
        [bx, by] = retarget(x,y,source[1],source[2],joint,wrist);
        [cx, cy] = retarget(x,y,source[2],sourcePad,wrist,pad);
      }
      const dx = pad.x + (x - sourcePad.x) * pc - (y - sourcePad.y) * ps;
      const dy = pad.y + (x - sourcePad.x) * ps + (y - sourcePad.y) * pc;
      if (y < source[1].y + 45) {
        const v = Math.max(0, Math.min(1, (y - source[1].y + 45) / 90)), u = v * v * (3 - 2 * v);
        part.target[index] = ax + (bx - ax) * u; part.target[index + 1] = ay + (by - ay) * u;
      } else {
        const v = Math.max(0, Math.min(1, (y - source[2].y + 30) / 60)), u = v * v * (3 - 2 * v);
        part.target[index] = bx + (cx - bx) * u; part.target[index + 1] = by + (cy - by) * u;
      }
      // Share ankle flexion with the lower leg instead of pinching a wide furry
      // paw through a 24-unit strip. Compose the overlapping blend zones, so
      // their boundaries stay continuous; the pad and sole remain fully rigid.
      const v = Math.max(0, Math.min(1, (y - sourcePad.y + PAW_BLEND) / PAW_BLEND)), u = v * v * (3 - 2 * v);
      part.target[index] += (dx - part.target[index]) * u;
      part.target[index + 1] += (dy - part.target[index + 1]) * u;
    }
  }
  function drawPart(part: Surface, image: CanvasImageSource, padding: number): void {
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
      // Near edge-on bends can make a triangle arbitrarily thin. Expanding by
      // its inradius alone then sends the acute tip thousands of pixels away,
      // pulling stray fur into a spike. Keep seam coverage below one device
      // pixel at every vertex, including while a joint crosses this thin pose.
      const expansion = 1 + Math.min(padding / radius, 2 * padding / Math.max(ei, ej, ek));
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
    draw(sample: GroundedRenderSample, deviceScale?: number, authored?: GroundedSkeleton): boolean {
      const scale = deviceScale ?? Math.abs(context.getTransform().a);
      const padding = .45 / Math.max(.01, scale);
      skeleton = authored ?? fallbackSkeleton;
      if (!authored && !solveGroundedSkeleton(sample, skeleton)) return false;
      for (const name of ORDER) transform(meshes[name], name);
      for (const name of ORDER) {
        const part = meshes[name];
        context.globalAlpha = 1;
        drawPart(part, part.kind === 'fore' ? assets.foreleg.image : assets.hindleg.image, padding);
      }
      context.globalAlpha = 1;
      transformTorso();
      drawPart(torso, assets.torso.image, padding);
      return true;
    },
  };
}
