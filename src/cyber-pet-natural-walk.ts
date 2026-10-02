import { createGroundedWalkAssetLoader, decodeGroundedWalkImage } from './cyber-pet-grounded-assets.ts';
import type { GroundedWalkAssetLoader, GroundedWalkAssets } from './cyber-pet-grounded-assets.ts';
import { GROUNDED_ART, GROUNDED_FEET } from './cyber-pet-grounded-geometry.ts';
import { createNaturalJourney } from './cyber-pet-natural-journey.ts';
import type { NaturalJourneyMotion, NaturalJourneySample } from './cyber-pet-natural-journey.ts';
import { loadNaturalMotion } from './cyber-pet-natural-motion.ts';
import { createNaturalPainter } from './cyber-pet-natural-render.ts';
import type { GroundedWalk, GroundedWalkFrame } from './cyber-pet-grounded-controller.ts';

export type NaturalWalkSurface<Image> = {
  available(): boolean;
  prepare(assets: GroundedWalkAssets<Image>): void;
  draw(sample: NaturalJourneySample, frame: GroundedWalkFrame): boolean;
  hide(): void;
  destroy(): void;
};

/** Caller-owned clock and route: no animation frames or delayed actions live here. */
export function createNaturalWalkController<Image>(
  loader: GroundedWalkAssetLoader<Image>,
  surface: NaturalWalkSurface<Image>,
  loadMotion: (signal: AbortSignal) => Promise<NaturalJourneyMotion> = loadNaturalMotion,
): GroundedWalk {
  let motion: NaturalJourneyMotion | undefined;
  let journey: ReturnType<typeof createNaturalJourney> | undefined;
  let lastSample: NaturalJourneySample | undefined;
  let prepared = false, destroyed = false, revision = 0;
  let pending: { revision: number; controller: AbortController; promise: Promise<boolean> } | undefined;

  function rest() {
    revision++;
    pending?.controller.abort(); loader.abort();
    journey = undefined; lastSample = undefined;
    surface.hide();
  }
  async function prepare(): Promise<boolean> {
    if (destroyed || !surface.available()) return false;
    if (prepared && motion) return true;
    // A cancelled image batch must drain before a fresh intent can reuse its loader.
    if (pending) {
      if (pending.revision === revision) return pending.promise;
      const intent = revision;
      await pending.promise;
      if (destroyed || revision !== intent) return false;
      return prepare();
    }
    const attempt = { revision, controller: new AbortController(), promise: Promise.resolve(false) };
    pending = attempt;
    attempt.promise = (async () => {
      try {
        const [assets, loaded] = await Promise.all([loader.load(), motion ?? loadMotion(attempt.controller.signal)]);
        if (!assets || destroyed || attempt.revision !== revision || attempt.controller.signal.aborted) return false;
        surface.prepare(assets); motion = loaded; prepared = true;
        return true;
      } catch {
        return false;
      } finally {
        if (pending === attempt) pending = undefined;
      }
    })();
    return attempt.promise;
  }
  return {
    prepare,
    ready: () => prepared && Boolean(motion) && !destroyed,
    metrics: () => motion && !destroyed ? {
      stride: motion.stride, duration: motion.duration,
      routeDuration: journey?.nominalDuration,
    } : undefined,
    begin(route) {
      if (!prepared || !motion || destroyed) return false;
      // Completed same-facing walks reuse their actual soles. An airborne pose
      // is never relabelled as a planted contact when an intent changes.
      const contacts = lastSample?.complete && lastSample.facing === route.facing
        && Math.hypot(lastSample.root.x - route.from.x, lastSample.root.y - route.from.y) < 1e-7
        && Math.abs(lastSample.scale - route.scale) < 1e-7
        ? Object.fromEntries(GROUNDED_FEET.map(name => [name, lastSample!.feet[name].sole])) as NonNullable<Parameters<typeof createNaturalJourney>[2]>['initialContacts']
        : undefined;
      try { journey = createNaturalJourney(motion, route, { initialContacts: contacts }); }
      catch { journey = undefined; return false; }
      lastSample = undefined;
      return true;
    },
    draw(frame) {
      if (!journey || destroyed) return false;
      if (![frame.travelled, frame.root.x, frame.root.y, frame.scale, frame.wrapperWidth, frame.pixelRatio].every(Number.isFinite)
        || frame.scale <= 0 || frame.wrapperWidth <= 0 || frame.pixelRatio <= 0) { rest(); return false; }
      try {
        // Route-unit conversion can arrive one floating-point ULP short.
        const distance = Math.abs(frame.travelled - journey.distance) < 1e-7 ? journey.distance : frame.travelled;
        const sample = journey.sample(distance);
        if (!surface.draw(sample, frame)) { rest(); return false; }
        lastSample = sample;
        return true;
      } catch { rest(); return false; }
    },
    finish() {
      if (!journey || !lastSample?.complete || !GROUNDED_FEET.every(name => lastSample!.feet[name].contact)) return false;
      journey = undefined;
      return true;
    },
    rest,
    destroy() {
      if (destroyed) return;
      rest(); destroyed = true; prepared = false; motion = undefined;
      loader.destroy(); surface.destroy();
    },
  };
}

export function mountNaturalWalk(figure: HTMLElement): GroundedWalk {
  const canvas = figure.ownerDocument.createElement('canvas');
  canvas.className = 'cyber-pet-grounded'; canvas.setAttribute('aria-hidden', 'true'); canvas.hidden = true;
  const context = canvas.getContext('2d');
  let painter: ReturnType<typeof createNaturalPainter> | undefined;
  figure.append(canvas);
  return createNaturalWalkController(createGroundedWalkAssetLoader(decodeGroundedWalkImage), {
    available: () => context !== null,
    prepare(assets) { if (context) painter = createNaturalPainter(context, assets); },
    draw(sample, frame) {
      if (!context || !painter) return false;
      const rasterWidth = Math.max(1, Math.ceil(frame.wrapperWidth * .847 * Math.min(2, frame.pixelRatio)));
      if (canvas.width !== rasterWidth) { canvas.width = rasterWidth; canvas.height = Math.ceil(rasterWidth * 2 / 3); }
      context.resetTransform(); context.clearRect(0, 0, canvas.width, canvas.height);
      context.scale(canvas.width / GROUNDED_ART.width, canvas.height / GROUNDED_ART.height);
      if (!painter.draw(sample.skeleton, canvas.width / GROUNDED_ART.width)) return false;
      canvas.hidden = false; figure.setAttribute('data-grounded', 'true');
      figure.setAttribute('data-locomotion', 'natural');
      return true;
    },
    hide() { canvas.hidden = true; figure.removeAttribute('data-grounded'); figure.removeAttribute('data-locomotion'); },
    destroy() { painter = undefined; canvas.remove(); canvas.width = 0; canvas.height = 0; },
  });
}
