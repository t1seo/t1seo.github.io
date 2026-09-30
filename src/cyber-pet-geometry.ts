export interface MilkyRect { left: number; top: number; width: number; height: number }
export interface MilkyPoint { x: number; y: number }
export interface MilkyFloorBounds {
  left: number; right: number; top: number; bottom: number;
  /** Set to zero when the scene already ends above a separate control strip. */
  footerInset?: number;
}
export const DEFAULT_MILKY_FLOOR: MilkyFloorBounds = { left: .40, right: .745, top: .83, bottom: .955 };

const clamp = (value: number, min: number, max: number) =>
  max < min ? (min + max) / 2 : Math.max(min, Math.min(max, value));

// Compact phones still have a visible strip of floor above the 80px control area.
const footerSpace = (viewport: MilkyRect, floor: MilkyFloorBounds) =>
  floor.footerInset ?? (viewport.width / viewport.height < 4 / 3 ? (viewport.height < 650 ? 84 : 102) : 80);

/** A very wide cover crop can remove the floor entirely. Never lift Milky onto the desk. */
export function milkyHasVisibleFloor(scene: MilkyRect, viewport: MilkyRect, floor = DEFAULT_MILKY_FLOOR): boolean {
  if (scene.width <= 0 || scene.height <= 0 || viewport.width <= 0 || viewport.height <= 0) return false;
  const availableBottom = (viewport.top + viewport.height - footerSpace(viewport,floor) - scene.top) / scene.height;
  return availableBottom >= floor.top;
}

/** Normalized paw position within the full room, including its cover crop. */
export function placeMilky(scene: MilkyRect, viewport: MilkyRect, requested: MilkyPoint, floor = DEFAULT_MILKY_FLOOR): MilkyPoint {
  if (scene.width <= 0 || scene.height <= 0) return requested;
  const portrait = viewport.width / viewport.height < 4 / 3;
  const halfWidth = scene.width * (portrait ? 0.11 : 0.14) * 0.43;
  const left = (viewport.left + halfWidth + 16 - scene.left) / scene.width;
  const right = (viewport.left + viewport.width - halfWidth - 16 - scene.left) / scene.width;
  const floorBottom = (viewport.top + viewport.height - footerSpace(viewport,floor) - scene.top) / scene.height;
  return {
    x: clamp(requested.x, Math.max(floor.left, left), Math.min(floor.right, right)),
    y: milkyHasVisibleFloor(scene, viewport, floor)
      ? clamp(requested.y, floor.top, Math.min(floor.bottom, floorBottom))
      : clamp(requested.y, floor.top, floor.bottom),
  };
}

/** Walk at an even pace, with brief acceleration at the beginning and end. */
export function milkyWalkProgress(time: number): number {
  const p = Math.max(0, Math.min(1, time));
  const ramp = 0.12;
  if (p < ramp) return p * p / (2 * ramp * (1 - ramp));
  if (p > 1 - ramp) return 1 - (1 - p) ** 2 / (2 * ramp * (1 - ramp));
  return (p - ramp / 2) / (1 - ramp);
}
