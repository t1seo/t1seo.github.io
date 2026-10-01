import { milkyWidthRatio, type MilkyFloorBounds, type MilkyPoint, type MilkyRect } from './cyber-pet-geometry.ts';
import type { MilkyRestStage } from './cyber-pet-rest.ts';

export interface MilkyBedOptions {
  readonly element: HTMLElement;
  readonly anchor: Readonly<MilkyPoint>;
}

export function visibleMilkyBed(
  bed: MilkyRect, room: MilkyRect, viewport: MilkyRect,
  anchor: Readonly<MilkyPoint>, floor: MilkyFloorBounds,
): boolean {
  if (room.width <= 0 || room.height <= 0 || bed.width <= 0 || bed.height <= 0) return false;
  if (viewport.width / viewport.height < 4 / 3) return false;
  if (bed.left < viewport.left || bed.top < viewport.top
    || bed.left + bed.width > viewport.left + viewport.width
    || bed.top + bed.height > viewport.top + viewport.height) return false;
  const pawX = room.left + anchor.x * room.width;
  const pawY = room.top + anchor.y * room.height;
  const halfBody = room.width * milkyWidthRatio(floor, false) * .43;
  const standingHeight = room.width * milkyWidthRatio(floor, false) * 2 / 3;
  return pawX - halfBody >= viewport.left && pawX + halfBody <= viewport.left + viewport.width
    && pawY - standingHeight >= viewport.top && pawY <= viewport.top + viewport.height
    && pawX >= bed.left && pawX <= bed.left + bed.width
    && pawY >= bed.top && pawY <= bed.top + bed.height;
}

interface BedRuntime {
  readonly room: () => MilkyRect;
  readonly viewport: () => MilkyRect;
  readonly floor: MilkyFloorBounds;
  readonly position: () => MilkyPoint;
  readonly bound: (point: MilkyPoint) => MilkyPoint;
  readonly canWalk: () => boolean;
  readonly walk: (point: MilkyPoint, autonomous: boolean, done: () => void) => void;
  readonly rest: (stages: readonly MilkyRestStage[], autonomous: boolean, done: () => void) => void;
  readonly occupied: (occupied: boolean) => void;
  readonly settle: () => void;
}

export function createMilkyBed(options: MilkyBedOptions | undefined, runtime: BedRuntime) {
  let visit: { readonly home: MilkyPoint } | undefined;
  const visible = () => options !== undefined && visibleMilkyBed(
    options.element.getBoundingClientRect(), runtime.room(), runtime.viewport(), options.anchor, runtime.floor,
  );
  function leave(done: () => void): boolean {
    if (!visit) return false;
    if (!runtime.canWalk()) return true;
    const current = visit;
    const home = runtime.bound(current.home);
    runtime.occupied(false);
    runtime.walk(home, false, () => {
      if (visit !== current) return;
      visit = undefined;
      done();
    });
    return true;
  }
  return {
    get active() { return visit !== undefined; },
    available: () => visible() && runtime.canWalk(),
    enter(stages: readonly MilkyRestStage[], autonomous: boolean): boolean {
      if (!options || !visible() || !runtime.canWalk()) return false;
      const current = { home: runtime.bound(runtime.position()) };
      visit = current;
      runtime.walk(options.anchor, autonomous, () => {
        if (visit !== current || !runtime.canWalk()) return;
        runtime.occupied(true);
        runtime.rest(stages, autonomous, () => leave(runtime.settle));
      });
      return true;
    },
    leave,
    resume: () => leave(runtime.settle),
    revalidate() {
      if (visit && !visible()) {
        visit = undefined;
        runtime.occupied(false);
      }
    },
    destroy() { visit = undefined; runtime.occupied(false); },
  };
}
