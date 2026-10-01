import { createGroundedPlan, createGroundedPose, sampleGroundedPlan, sampleGroundedLoad } from './cyber-pet-grounded-plan.ts';
import type { GroundedPlan, GroundedRoute } from './cyber-pet-grounded-plan.ts';
import type { GroundPoint } from './cyber-pet-grounded-geometry.ts';
import type { GroundedRenderSample } from './cyber-pet-grounded-render.ts';
import type { GroundedWalkAssetLoader, GroundedWalkAssets } from './cyber-pet-grounded-assets.ts';
export type GroundedWalkFrame = {
  readonly travelled: number; readonly root: GroundPoint; readonly scale: number;
  readonly wrapperWidth: number; readonly pixelRatio: number;
};
export type GroundedWalk = {
  readonly prepare: () => Promise<boolean>;
  readonly ready: () => boolean;
  readonly begin: (route: GroundedRoute, carry?: boolean) => boolean;
  readonly draw: (frame: GroundedWalkFrame) => boolean;
  readonly finish: () => boolean;
  readonly rest: () => void;
  readonly destroy: () => void;
};
export type GroundedSurface<Image> = {
  readonly available: () => boolean;
  readonly prepare: (assets: GroundedWalkAssets<Image>) => void;
  readonly draw: (sample: GroundedRenderSample, frame: GroundedWalkFrame) => boolean;
  readonly hide: () => void;
  readonly destroy: () => void;
};
export function createGroundedController<Image>(loader: GroundedWalkAssetLoader<Image>, surface: GroundedSurface<Image>): GroundedWalk {
  const pose = createGroundedPose();
  const sample: { root: { x: number; y: number }; scale: number; facing: 1 | -1; load: number; feet: typeof pose } = { root: { x: 0, y: 0 }, scale: 1, facing: 1, load: 0, feet: pose };
  let prepared = false, destroyed = false, hasDrawn = false, initialLoad = 0, revision = 0, lastTravelled = 0;
  let plan: GroundedPlan | null = null;
  function rest(): void {
    revision++; loader.abort(); plan = null; hasDrawn = false; surface.hide();
  }
  return {
    async prepare() {
      if (destroyed || !surface.available()) return false;
      const intent = revision;
      const assets = await loader.load();
      if (!assets || destroyed || intent !== revision) return false;
      if (!prepared) surface.prepare(assets);
      prepared = true; return true;
    },
    ready: () => !destroyed && prepared,
    begin(route, carry = false) {
      if (destroyed || !prepared) return false;
      const continuation = carry && hasDrawn && plan?.route.facing === route.facing;
      initialLoad = continuation ? sample.load : 0;
      plan = createGroundedPlan(route, continuation ? pose : undefined, initialLoad);
      sample.facing = route.facing; hasDrawn = false; lastTravelled = 0; return true;
    },
    draw(frame) {
      if (!plan || !prepared || destroyed) return false;
      sampleGroundedPlan(plan, frame.travelled, pose);
      sample.root.x = frame.root.x; sample.root.y = frame.root.y; sample.scale = frame.scale;
      sample.load = sampleGroundedLoad(plan, frame.travelled);
      if (!surface.draw(sample, frame)) { rest(); return false; }
      hasDrawn = true; lastTravelled = frame.travelled; return true;
    },
    finish() {
      if (!plan || !hasDrawn || lastTravelled + 1e-6 < plan.distance) return false;
      plan = null; hasDrawn = false; return true;
    },
    rest,
    destroy() {
      if (destroyed) return;
      rest(); destroyed = true; loader.destroy(); surface.destroy();
    },
  };
}
