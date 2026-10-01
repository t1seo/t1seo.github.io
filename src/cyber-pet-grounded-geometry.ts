export type GroundPoint = { readonly x: number; readonly y: number };
export type GroundedFoot = 'nearHind' | 'nearFore' | 'farHind' | 'farFore';
export const GROUNDED_FEET = ['nearHind', 'nearFore', 'farHind', 'farFore'] as const;
export const GROUNDED_ART = { width: 1536, height: 1024, anchorX: 795, anchorY: 970, stride: 360, duty: .625, bodyLoad: 20 } as const;
export const GROUNDED_LIMBS = {
  nearHind: { root: { x: 485, y: 575 }, idle: { x: 355, y: 952 }, touchX: 615, phase: 0, kind: 'hind' },
  nearFore: { root: { x: 1070, y: 575 }, idle: { x: 1080, y: 970 }, touchX: 1230, phase: .25, kind: 'fore' },
  farHind: { root: { x: 580, y: 600 }, idle: { x: 590, y: 920 }, touchX: 695, phase: .5, kind: 'hind' },
  farFore: { root: { x: 1160, y: 580 }, idle: { x: 1210, y: 932 }, touchX: 1322, phase: .75, kind: 'fore' },
} as const;
export const GROUNDED_JOINTS = {
  fore: [{ x: 1070, y: 575 }, { x: 1025, y: 720 }, { x: 1040, y: 880 }, { x: 1080, y: 970 }],
  hind: [{ x: 485, y: 575 }, { x: 520, y: 710 }, { x: 350, y: 835 }, { x: 355, y: 952 }],
} as const;
// Mutable output buffers are allocated once by the renderer and reused on every frame.
export interface GroundJoint { x: number; y: number; reachable: boolean }
export function solveGroundJoint(root: GroundPoint, wrist: GroundPoint, upper: number, lower: number, bend: 1 | -1, out: GroundJoint): void {
  const dx = wrist.x - root.x, dy = wrist.y - root.y;
  const distance = Math.hypot(dx, dy);
  const reach = Math.max(Math.abs(upper - lower) + 1e-5, Math.min(upper + lower - 1e-5, distance));
  const along = (upper * upper - lower * lower + reach * reach) / (2 * reach);
  const across = Math.sqrt(Math.max(0, upper * upper - along * along));
  const ux = distance > 1e-8 ? dx / distance : 0;
  const uy = distance > 1e-8 ? dy / distance : 1;
  out.x = root.x + ux * along - bend * uy * across;
  out.y = root.y + uy * along + bend * ux * across;
  out.reachable = distance <= upper + lower && distance >= Math.abs(upper - lower);
}
