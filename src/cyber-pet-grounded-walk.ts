import { createGroundedWalkAssetLoader, decodeGroundedWalkImage } from './cyber-pet-grounded-assets.ts';
import { GROUNDED_ART } from './cyber-pet-grounded-geometry.ts';
import { createGroundedPainter } from './cyber-pet-grounded-render.ts';
import { createGroundedController } from './cyber-pet-grounded-controller.ts';
import type { GroundedWalk } from './cyber-pet-grounded-controller.ts';
export function mountGroundedWalk(figure: HTMLElement): GroundedWalk {
  const canvas = figure.ownerDocument.createElement('canvas');
  canvas.className = 'cyber-pet-grounded'; canvas.setAttribute('aria-hidden', 'true'); canvas.hidden = true;
  const context = canvas.getContext('2d');
  let painter: ReturnType<typeof createGroundedPainter> | null = null;
  figure.append(canvas);
  return createGroundedController(createGroundedWalkAssetLoader(decodeGroundedWalkImage), {
    available: () => context !== null,
    prepare(assets) { if (context) painter = createGroundedPainter(context, assets); },
    draw(sample, frame) {
      if (!context || !painter) return false;
      const rasterWidth = Math.max(1, Math.ceil(frame.wrapperWidth * .847 * Math.min(2, frame.pixelRatio)));
      if (canvas.width !== rasterWidth) { canvas.width = rasterWidth; canvas.height = Math.ceil(rasterWidth * 2 / 3); }
      context.resetTransform(); context.clearRect(0, 0, canvas.width, canvas.height);
      context.scale(canvas.width / GROUNDED_ART.width, canvas.height / GROUNDED_ART.height);
      if (!painter.draw(sample, canvas.width / GROUNDED_ART.width)) return false;
      canvas.hidden = false; figure.setAttribute('data-grounded', 'true'); return true;
    },
    hide() { canvas.hidden = true; figure.removeAttribute('data-grounded'); },
    destroy() { painter = null; canvas.remove(); canvas.width = 0; canvas.height = 0; },
  });
}
