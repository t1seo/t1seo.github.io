import { createAuthoredRig } from './cyber-pet-authored-rig.ts';
import { createGroundedPose } from './cyber-pet-grounded-plan.ts';
import { GROUNDED_ART } from './cyber-pet-grounded-geometry.ts';
import type { AuthoredCanine } from './cyber-pet-authored-clip.ts';
import type { GroundedRoute } from './cyber-pet-grounded-plan.ts';
import type { GroundedSkeleton } from './cyber-pet-grounded-articulation.ts';
import type { GroundedWalk, GroundedWalkFrame, GroundedSurface } from './cyber-pet-grounded-controller.ts';
import type { GroundedWalkAssetLoader } from './cyber-pet-grounded-assets.ts';
import type { GroundedRenderSample } from './cyber-pet-grounded-render.ts';

export const AUTHORED_STRIDE = { walk: 480, run: 700 } as const;
export const AUTHORED_DURATION = { walk: 1.0666667222976685, run: .5666666626930237 } as const;
export type AuthoredSurface<Image> = Omit<GroundedSurface<Image>, 'draw'> & {
  readonly draw: (sample: GroundedRenderSample, frame: GroundedWalkFrame, skeleton: GroundedSkeleton) => boolean;
};
type Mode = keyof typeof AUTHORED_STRIDE;
type Journey = { route: GroundedRoute; mode: Mode; distance: number; initialWeight: number; entrySpan: number };
const smooth = (value: number) => {
  const u = Math.max(0, Math.min(1, value));
  return u * u * u * (10 + u * (-15 + 6 * u));
};

/** Owns resources and distance-to-clip sampling, but never owns a frame loop. */
export function createAuthoredController<Image>(
  loader: GroundedWalkAssetLoader<Image>, surface: AuthoredSurface<Image>,
  loadCanine: (signal: AbortSignal) => Promise<AuthoredCanine>,
): GroundedWalk {
  const sample = { root: { x: 0, y: 0 }, scale: 1, facing: 1 as 1 | -1, load: 0, feet: createGroundedPose() };
  let canine: AuthoredCanine | null = null;
  let rig: ReturnType<typeof createAuthoredRig> | null = null;
  let journey: Journey | null = null;
  let pending: Promise<boolean> | null = null, loading: AbortController | null = null;
  let destroyed = false, prepared = false, hasDrawn = false, revision = 0;
  let cycles = 0, progressCycles = 0, weight = 0, lastTravelled = 0, lastScale = 1;

  function rest(): void {
    revision++; loading?.abort(); loading = null; pending = null; loader.abort();
    journey = null; hasDrawn = false; surface.hide();
  }
  return {
    prepare() {
      if (destroyed || !surface.available()) return Promise.resolve(false);
      if (prepared) return Promise.resolve(true);
      if (pending) return pending;
      const intent = revision, attempt = new AbortController();
      loading = attempt;
      let candidate: AuthoredCanine | null = null;
      const release = () => { candidate?.dispose(); candidate = null; };
      attempt.signal.addEventListener('abort', release, { once: true });
      const task = (async () => {
        const [assets, motion] = await Promise.allSettled([
          Promise.resolve().then(() => loader.load()),
          Promise.resolve().then(() => loadCanine(attempt.signal)).then(result => {
            candidate = result;
            if (attempt.signal.aborted) release();
            return result;
          }),
        ]);
        if (destroyed || intent !== revision || attempt.signal.aborted
          || assets.status !== 'fulfilled' || !assets.value || motion.status !== 'fulfilled' || !candidate) {
          release(); return false;
        }
        try {
          const nextRig = createAuthoredRig(candidate);
          surface.prepare(assets.value);
          canine = candidate; candidate = null; rig = nextRig; prepared = true;
          return true;
        } catch {
          release(); surface.hide(); return false;
        }
      })().finally(() => {
        attempt.signal.removeEventListener('abort', release);
        if (pending === task) { pending = null; loading = null; }
      });
      pending = task;
      return task;
    },
    ready: () => !destroyed && prepared,
    begin(route, carry = false) {
      if (destroyed || !prepared || !canine || !rig) return false;
      if (![route.from.x, route.from.y, route.to.x, route.to.y, route.scale, route.endScale].every(Number.isFinite)
        || route.scale <= 0 || route.endScale <= 0) { rest(); return false; }
      const mode = route.gait ?? 'walk';
      const continuation = carry && hasDrawn && journey?.route.facing === route.facing && journey.mode === mode;
      const distance = Math.hypot(route.to.x - route.from.x, route.to.y - route.from.y);
      journey = { route, mode, distance, initialWeight: continuation ? weight : 0,
        entrySpan: Math.min(.18, distance / (2 * AUTHORED_STRIDE[mode] * route.scale)) };
      if (!continuation) cycles = 0;
      progressCycles = 0; lastTravelled = 0; lastScale = route.scale; hasDrawn = false;
      sample.facing = route.facing;
      return true;
    },
    draw(frame) {
      if (!journey || !canine || !rig || destroyed || !prepared) return false;
      if (![frame.travelled, frame.scale, frame.root.x, frame.root.y].every(Number.isFinite) || frame.scale <= 0) { rest(); return false; }
      const travelled = Math.max(0, Math.min(journey.distance, frame.travelled));
      const stride = AUTHORED_STRIDE[journey.mode];
      // Integrate distance in the character's local units: a receding dog must
      // not inherit the larger screen-space stride from the route's first frame.
      const deltaCycles = (travelled - lastTravelled) / ((lastScale + frame.scale) / 2 * stride);
      cycles = ((cycles + deltaCycles) % 1 + 1) % 1;
      progressCycles += deltaCycles;
      const entry = journey.entrySpan > 0 ? smooth(progressCycles / journey.entrySpan) : 0;
      const exitSpan = Math.min(journey.distance / 2, stride * frame.scale * .18);
      const exit = exitSpan > 0 ? smooth((journey.distance - travelled) / exitSpan) : 0;
      weight = (journey.initialWeight + (1 - journey.initialWeight) * entry) * exit;
      sample.root.x = frame.root.x; sample.root.y = frame.root.y; sample.scale = frame.scale;
      sample.load = weight * GROUNDED_ART.bodyLoad;
      try {
        const skeleton = rig.sample(journey.mode, cycles * canine.durations[journey.mode], weight);
        if (!surface.draw(sample, frame, skeleton)) { rest(); return false; }
      } catch { rest(); return false; }
      hasDrawn = true; lastTravelled = travelled; lastScale = frame.scale;
      return true;
    },
    finish() {
      if (!journey || !hasDrawn || lastTravelled + 1e-6 < journey.distance) return false;
      journey = null; hasDrawn = false; return true;
    },
    rest,
    destroy() {
      if (destroyed) return;
      rest(); destroyed = true; loader.destroy(); canine?.dispose(); canine = null; rig = null;
      prepared = false; surface.destroy();
    },
  };
}
