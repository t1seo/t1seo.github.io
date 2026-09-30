export interface MilkyRect { left: number; top: number; width: number; height: number }
export interface MilkyPoint { x: number; y: number }

const clamp = (value: number, min: number, max: number) =>
  max < min ? (min + max) / 2 : Math.max(min, Math.min(max, value));

// Compact phones still have a visible strip of floor above the 80px control area.
const footerSpace = (viewport: MilkyRect) =>
  viewport.width / viewport.height < 4 / 3 ? (viewport.height < 650 ? 84 : 102) : 80;

/** A very wide cover crop can remove the floor entirely. Never lift Milky onto the desk. */
export function milkyHasVisibleFloor(scene: MilkyRect, viewport: MilkyRect): boolean {
  if (scene.width <= 0 || scene.height <= 0 || viewport.width <= 0 || viewport.height <= 0) return false;
  const availableBottom = (viewport.top + viewport.height - footerSpace(viewport) - scene.top) / scene.height;
  return availableBottom >= 0.83;
}

/** Normalized paw position within the full room, including its cover crop. */
export function placeMilky(scene: MilkyRect, viewport: MilkyRect, requested: MilkyPoint): MilkyPoint {
  if (scene.width <= 0 || scene.height <= 0) return requested;
  const portrait = viewport.width / viewport.height < 4 / 3;
  const halfWidth = scene.width * (portrait ? 0.11 : 0.14) * 0.43;
  const left = (viewport.left + halfWidth + 16 - scene.left) / scene.width;
  const right = (viewport.left + viewport.width - halfWidth - 16 - scene.left) / scene.width;
  const floorBottom = (viewport.top + viewport.height - footerSpace(viewport) - scene.top) / scene.height;
  return {
    x: clamp(requested.x, Math.max(0.40, left), Math.min(0.745, right)),
    y: milkyHasVisibleFloor(scene, viewport)
      ? clamp(requested.y, 0.83, Math.min(0.955, floorBottom))
      : clamp(requested.y, 0.83, 0.955),
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
