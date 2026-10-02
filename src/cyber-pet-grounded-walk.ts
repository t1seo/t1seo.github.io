import { createGroundedWalkAssetLoader, decodeGroundedWalkImage } from './cyber-pet-grounded-assets.ts';
import { GROUNDED_ART } from './cyber-pet-grounded-geometry.ts';
import { createGroundedPainter } from './cyber-pet-grounded-render.ts';
import { createAuthoredController } from './cyber-pet-authored-controller.ts';
import { AUTHORED_CANINE_URL, loadAuthoredCanine } from './cyber-pet-authored-clip.ts';
import type { GroundedWalk } from './cyber-pet-grounded-controller.ts';
export function mountGroundedWalk(figure: HTMLElement): GroundedWalk {
  const canvas = figure.ownerDocument.createElement('canvas');
  canvas.className = 'cyber-pet-grounded'; canvas.setAttribute('aria-hidden', 'true'); canvas.hidden = true;
  const context = canvas.getContext('2d');
  let painter: ReturnType<typeof createGroundedPainter> | null = null;
  figure.append(canvas);
  return createAuthoredController(createGroundedWalkAssetLoader(decodeGroundedWalkImage), {
    available: () => context !== null,
    prepare(assets) { if (context) painter = createGroundedPainter(context, assets); },
    draw(sample, frame, skeleton) {
      if (!context || !painter) return false;
      const rasterWidth = Math.max(1, Math.ceil(frame.wrapperWidth * .847 * Math.min(2, frame.pixelRatio)));
      if (canvas.width !== rasterWidth) { canvas.width = rasterWidth; canvas.height = Math.ceil(rasterWidth * 2 / 3); }
      context.resetTransform(); context.clearRect(0, 0, canvas.width, canvas.height);
      context.scale(canvas.width / GROUNDED_ART.width, canvas.height / GROUNDED_ART.height);
      if (!painter.draw(sample, canvas.width / GROUNDED_ART.width, skeleton)) return false;
      canvas.hidden = false; figure.setAttribute('data-grounded', 'true'); return true;
    },
    hide() { canvas.hidden = true; figure.removeAttribute('data-grounded'); },
    destroy() { painter = null; canvas.remove(); canvas.width = 0; canvas.height = 0; },
  }, async signal => {
    const response = await fetch(AUTHORED_CANINE_URL, { signal });
    if (!response.ok) throw new Error(`Unable to load authored canine: ${response.status}`);
    const bytes = await response.arrayBuffer();
    signal.throwIfAborted();
    const canine = await loadAuthoredCanine(bytes);
    if (signal.aborted) { canine.dispose(); signal.throwIfAborted(); }
    return canine;
  });
}
