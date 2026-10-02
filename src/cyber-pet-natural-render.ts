import { GROUNDED_ART, GROUNDED_JOINTS } from './cyber-pet-grounded-geometry.ts';
import { GROUNDED_BODY_PIVOT, GROUNDED_PADS } from './cyber-pet-grounded-articulation.ts';
import type { GroundedFoot, GroundPoint } from './cyber-pet-grounded-geometry.ts';
import type { GroundedSkeleton } from './cyber-pet-grounded-articulation.ts';
import type { GroundedWalkAssets } from './cyber-pet-grounded-assets.ts';

type BodyTransform = { x: number; y: number; angle: number };
export type NaturalSkeleton = GroundedSkeleton & {
  deformation?: {
    /** Absolute destination of the rest pelvis (485, 575), in logical art units. */
    pelvis: BodyTransform;
    /** Absolute destination of the rest chest (1070, 575), in logical art units. */
    chest: BodyTransform;
    headAngle: number;
    tailAngle: number;
  };
};
type Surface = {
  source: Float64Array;
  target: Float64Array;
  triangles: Uint16Array;
};
type LimbMesh = Surface & { kind: 'fore' | 'hind' };
type Affine = { a: number; b: number; c: number; d: number; e: number; f: number };
export type NaturalPainterInspection = {
  draws: number;
  triangles: number;
  minAreaRatio: number;
  maxAreaRatio: number;
  flippedTriangles: number;
  degenerateTriangles: number;
  finite: boolean;
  /** Ratios describe supplied skeleton lengths; the painter never stretches a bone. */
  segmentLengthRatios: Record<GroundedFoot, readonly [number, number, number]>;
  maxSegmentLengthError: number;
  face: {
    transform: Affine;
    landmarks: ReadonlyArray<{ name: string; source: GroundPoint; target: GroundPoint }>;
    /** Maximum error of actual submitted mesh landmarks against the rigid face transform. */
    maxRigidError: number;
    maxPairDistanceError: number;
  };
};

const ORDER = ['farHind', 'farFore', 'nearHind', 'nearFore'] as const;
const PELVIS = { x: 485, y: 575 }, CHEST = { x: 1070, y: 575 };
const HEAD = { x: 1080, y: 475 }, TAIL = { x: 380, y: 500 };
const FACE = [
  { name: 'eye', x: 1280, y: 280 }, { name: 'nose', x: 1385, y: 327 },
  { name: 'mouth', x: 1350, y: 415 }, { name: 'ear', x: 1105, y: 275 },
  { name: 'crown', x: 1210, y: 125 },
] as const;
const smooth = (value: number): number => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
const distance = (a: GroundPoint, b: GroundPoint): number => Math.hypot(b.x - a.x, b.y - a.y);

function surface(xs: readonly number[], ys: readonly number[]): Surface {
  const source = new Float64Array(xs.length * ys.length * 2), indices: number[] = [];
  for (const [row, y] of ys.entries()) for (const [col, x] of xs.entries()) {
    const at = (row * xs.length + col) * 2;
    source[at] = x; source[at + 1] = y;
    if (row && col) {
      const a = ((row - 1) * xs.length + col - 1) * 2;
      indices.push(a, a + 2, at, a, at, at - 2);
    }
  }
  return { source, target: new Float64Array(source.length), triangles: new Uint16Array(indices) };
}

function limbMesh(kind: 'fore' | 'hind'): LimbMesh {
  const joints = GROUNDED_JOINTS[kind], pad = GROUNDED_PADS[kind];
  // Bounds include the complete visible painted limb, but exclude the almost
  // transparent export speckles far outside it. No raster is modified.
  const ys = [...new Set([kind === 'fore' ? 400 : 350, 500, 575, 625,
    joints[1].y - 65, joints[1].y - 35, joints[1].y, joints[1].y + 35, joints[1].y + 65,
    joints[2].y - 40, joints[2].y, joints[2].y + 40,
    pad.y - 110, pad.y - 80, pad.y - 45, pad.y - 20, pad.y, 990])].sort((a, b) => a - b);
  return { ...surface(kind === 'fore' ? [895, 1040, 1185] : [240, 442.5, 645], ys), kind };
}

function rigid(origin: GroundPoint, destination: GroundPoint, angle: number): Affine {
  const a = Math.cos(angle), b = Math.sin(angle);
  return { a, b, c: -b, d: a, e: destination.x - a * origin.x + b * origin.y, f: destination.y - b * origin.x - a * origin.y };
}
function apply(matrix: Affine, x: number, y: number): GroundPoint {
  return { x: matrix.a * x + matrix.c * y + matrix.e, y: matrix.b * x + matrix.d * y + matrix.f };
}
function compose(parent: Affine, child: Affine): Affine {
  return {
    a: parent.a * child.a + parent.c * child.b, b: parent.b * child.a + parent.d * child.b,
    c: parent.a * child.c + parent.c * child.d, d: parent.b * child.c + parent.d * child.d,
    e: parent.a * child.e + parent.c * child.f + parent.e, f: parent.b * child.e + parent.d * child.f + parent.f,
  };
}
function bone(source: GroundPoint, tip: GroundPoint, target: GroundPoint, end: GroundPoint): Affine {
  return rigid(source, target, Math.atan2(end.y - target.y, end.x - target.x) - Math.atan2(tip.y - source.y, tip.x - source.x));
}
function area(points: Float64Array, a: number, b: number, c: number): number {
  return (points[b] - points[a]) * (points[c + 1] - points[a + 1]) - (points[c] - points[a]) * (points[b + 1] - points[a + 1]);
}

/** The same barycentric interpolation submitted to Canvas, used for face QA. */
function onMesh(mesh: Surface, point: GroundPoint): GroundPoint {
  const s = mesh.source, t = mesh.target;
  for (let i = 0; i < mesh.triangles.length; i += 3) {
    const [a, b, c] = mesh.triangles.subarray(i, i + 3), determinant = area(s, a, b, c);
    const u = ((point.x - s[a]) * (s[c + 1] - s[a + 1]) - (point.y - s[a + 1]) * (s[c] - s[a])) / determinant;
    const v = ((s[b] - s[a]) * (point.y - s[a + 1]) - (s[b + 1] - s[a + 1]) * (point.x - s[a])) / determinant;
    if (u >= -1e-8 && v >= -1e-8 && u + v <= 1 + 1e-8) return {
      x: t[a] + u * (t[b] - t[a]) + v * (t[c] - t[a]),
      y: t[a + 1] + u * (t[b + 1] - t[a + 1]) + v * (t[c + 1] - t[a + 1]),
    };
  }
  return { x: NaN, y: NaN };
}

export function createNaturalPainter(context: CanvasRenderingContext2D, assets: GroundedWalkAssets) {
  const torso = surface([190, 280, 380, 485, 620, 795, 900, 975, 1050, 1120, 1230, 1360, 1450],
    [80, 180, 280, 360, 430, 485, 545, 610, 680, 750]);
  const limbs: Record<GroundedFoot, LimbMesh> = {
    nearHind: limbMesh('hind'), nearFore: limbMesh('fore'), farHind: limbMesh('hind'), farFore: limbMesh('fore'),
  };
  const surfaces = [...ORDER.map(name => limbs[name]), torso];
  const lengthRatios: Record<GroundedFoot, [number, number, number]> = {
    farHind: [1, 1, 1], farFore: [1, 1, 1], nearHind: [1, 1, 1], nearFore: [1, 1, 1],
  };
  let draws = 0, minAreaRatio = 1, maxAreaRatio = 1, flippedTriangles = 0, degenerateTriangles = 0, finite = true;
  let faceTransform = rigid(HEAD, HEAD, 0);

  function transformTorso(skeleton: NaturalSkeleton): void {
    let deformation = skeleton.deformation;
    if (!deformation) {
      const whole = rigid(GROUNDED_BODY_PIVOT, { x: GROUNDED_BODY_PIVOT.x, y: GROUNDED_BODY_PIVOT.y + skeleton.body.y }, skeleton.body.pitch);
      deformation = {
        pelvis: { ...apply(whole, PELVIS.x, PELVIS.y), angle: skeleton.body.pitch },
        chest: { ...apply(whole, CHEST.x, CHEST.y), angle: skeleton.body.pitch },
        headAngle: skeleton.body.head, tailAngle: skeleton.body.tail,
      };
    }
    const pelvis = rigid(PELVIS, deformation.pelvis, deformation.pelvis.angle);
    const chest = rigid(CHEST, deformation.chest, deformation.chest.angle);
    faceTransform = compose(chest, rigid(HEAD, HEAD, deformation.headAngle));
    const tail = compose(pelvis, rigid(TAIL, TAIL, deformation.tailAngle));
    for (let i = 0; i < torso.source.length; i += 2) {
      const x = torso.source[i], y = torso.source[i + 1];
      const p = apply(pelvis, x, y), c = apply(chest, x, y);
      const u = smooth((x - PELVIS.x) / (CHEST.x - PELVIS.x));
      let tx = p.x + (c.x - p.x) * u, ty = p.y + (c.y - p.y) * u;
      const tw = smooth((620 - y) / 170) * smooth((680 - x) / 100);
      const t = apply(tail, x, y);
      tx += (t.x - tx) * tw; ty += (t.y - ty) * tw;
      // A slanted neck boundary puts the whole skull, eye, muzzle, jaw and ear
      // interior in the exact same rigid transform. No independent face warp.
      const hw = smooth(((x - 930) + .65 * (560 - y)) / 160);
      const h = apply(faceTransform, x, y);
      torso.target[i] = tx + (h.x - tx) * hw;
      torso.target[i + 1] = ty + (h.y - ty) * hw;
    }
  }

  function transformLimb(part: LimbMesh, name: GroundedFoot, skeleton: NaturalSkeleton): void {
    const source = GROUNDED_JOINTS[part.kind], sourcePad = GROUNDED_PADS[part.kind];
    const limb = skeleton.limbs[name];
    const transforms = [bone(source[0], source[1], limb.root, limb.joint),
      bone(source[1], source[2], limb.joint, limb.wrist),
      bone(source[2], sourcePad, limb.wrist, limb.pad), rigid(sourcePad, limb.pad, limb.pawAngle)];
    lengthRatios[name][0] = distance(limb.root, limb.joint) / distance(source[0], source[1]);
    lengthRatios[name][1] = distance(limb.joint, limb.wrist) / distance(source[1], source[2]);
    lengthRatios[name][2] = distance(limb.wrist, limb.pad) / distance(source[2], sourcePad);
    for (let i = 0; i < part.source.length; i += 2) {
      const x = part.source[i], y = part.source[i + 1];
      const upper = apply(transforms[0], x, y), lower = apply(transforms[1], x, y), distal = apply(transforms[2], x, y), paw = apply(transforms[3], x, y);
      const elbow = smooth((y - source[1].y + 65) / 130), wrist = smooth((y - source[2].y + 40) / 80);
      const sole = smooth((y - sourcePad.y + 110) / 110);
      let tx = upper.x + (lower.x - upper.x) * elbow, ty = upper.y + (lower.y - upper.y) * elbow;
      tx += (distal.x - tx) * wrist; ty += (distal.y - ty) * wrist;
      part.target[i] = tx + (paw.x - tx) * sole;
      part.target[i + 1] = ty + (paw.y - ty) * sole;
    }
  }

  function measure(): void {
    minAreaRatio = Infinity; maxAreaRatio = -Infinity; flippedTriangles = 0; degenerateTriangles = 0; finite = true;
    for (const mesh of surfaces) {
      for (const value of mesh.target) if (!Number.isFinite(value)) finite = false;
      for (let i = 0; i < mesh.triangles.length; i += 3) {
        const a = mesh.triangles[i], b = mesh.triangles[i + 1], c = mesh.triangles[i + 2];
        const ratio = area(mesh.target, a, b, c) / area(mesh.source, a, b, c);
        minAreaRatio = Math.min(minAreaRatio, ratio); maxAreaRatio = Math.max(maxAreaRatio, ratio);
        if (ratio < 0) flippedTriangles++;
        if (Math.abs(ratio) < 1e-6) degenerateTriangles++;
      }
    }
  }

  function drawSurface(part: Surface, image: CanvasImageSource, padding: number): void {
    const s = part.source, t = part.target;
    for (let index = 0; index < part.triangles.length; index += 3) {
      const i = part.triangles[index], j = part.triangles[index + 1], k = part.triangles[index + 2];
      const a = s[j] - s[i], b = s[j + 1] - s[i + 1], c = s[k] - s[i], d = s[k + 1] - s[i + 1], determinant = a * d - b * c;
      const A = ((t[j] - t[i]) * d - (t[k] - t[i]) * b) / determinant;
      const B = ((t[j + 1] - t[i + 1]) * d - (t[k + 1] - t[i + 1]) * b) / determinant;
      const C = (a * (t[k] - t[i]) - c * (t[j] - t[i])) / determinant;
      const D = (a * (t[k + 1] - t[i + 1]) - c * (t[j + 1] - t[i + 1])) / determinant;
      const ei = Math.hypot(t[j] - t[k], t[j + 1] - t[k + 1]);
      const ej = Math.hypot(t[i] - t[k], t[i + 1] - t[k + 1]);
      const ek = Math.hypot(t[i] - t[j], t[i + 1] - t[j + 1]), perimeter = ei + ej + ek;
      const radius = Math.abs(area(t, i, j, k)) / perimeter;
      if (radius < 1e-6) continue;
      const mx = (ei * t[i] + ej * t[j] + ek * t[k]) / perimeter;
      const my = (ei * t[i + 1] + ej * t[j + 1] + ek * t[k + 1]) / perimeter;
      // Cover subpixel seams without turning a thin joint triangle into a spike.
      const expansion = 1 + Math.min(padding / radius, 2 * padding / Math.max(ei, ej, ek));
      context.save(); context.beginPath();
      for (let corner = 0; corner < 3; corner++) {
        const p = part.triangles[index + corner];
        const x = mx + (t[p] - mx) * expansion, y = my + (t[p + 1] - my) * expansion;
        if (!corner) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.closePath(); context.clip();
      context.transform(A, B, C, D, t[i] - A * s[i] - C * s[i + 1], t[i + 1] - B * s[i] - D * s[i + 1]);
      context.drawImage(image, 0, 0, GROUNDED_ART.width, GROUNDED_ART.height); context.restore();
    }
  }

  return {
    /** Caller owns root positioning, facing, scale and the frame loop. */
    draw(skeleton: NaturalSkeleton, deviceScale = Math.abs(context.getTransform().a)): boolean {
      transformTorso(skeleton);
      for (const name of ORDER) transformLimb(limbs[name], name, skeleton);
      measure();
      if (!finite || Number.isNaN(deviceScale) || deviceScale <= 0) return false;
      const padding = .45 / Math.max(.01, deviceScale);
      context.save(); context.globalAlpha = 1;
      for (const name of ORDER) drawSurface(limbs[name], limbs[name].kind === 'fore' ? assets.foreleg.image : assets.hindleg.image, padding);
      drawSurface(torso, assets.torso.image, padding);
      context.restore(); draws++;
      return true;
    },
    inspect(): NaturalPainterInspection {
      const landmarks = FACE.map(point => ({ name: point.name, source: { x: point.x, y: point.y }, target: onMesh(torso, point) }));
      let maxRigidError = 0, maxPairDistanceError = 0;
      for (const landmark of landmarks) {
        maxRigidError = Math.max(maxRigidError, distance(landmark.target, apply(faceTransform, landmark.source.x, landmark.source.y)));
        for (const other of landmarks) maxPairDistanceError = Math.max(maxPairDistanceError, Math.abs(distance(landmark.source, other.source) - distance(landmark.target, other.target)));
      }
      return {
        draws, triangles: surfaces.reduce((count, mesh) => count + mesh.triangles.length / 3, 0),
        minAreaRatio, maxAreaRatio, flippedTriangles, degenerateTriangles, finite,
        segmentLengthRatios: { farHind: [...lengthRatios.farHind], farFore: [...lengthRatios.farFore], nearHind: [...lengthRatios.nearHind], nearFore: [...lengthRatios.nearFore] },
        maxSegmentLengthError: Math.max(...Object.values(lengthRatios).flat().map(ratio => Math.abs(1 - ratio))),
        face: { transform: { ...faceTransform }, landmarks, maxRigidError, maxPairDistanceError },
      };
    },
  };
}
