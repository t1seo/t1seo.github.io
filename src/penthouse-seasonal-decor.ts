import type { ClimateState, Season } from './cyber-climate.ts';

export function mountSeasonalDecor(room: HTMLElement) {
  const layer = document.createElement('div');
  layer.className = 'ph-seasonal-decor';
  layer.setAttribute('aria-hidden', 'true');
  room.append(layer);
  const pending = new Set<HTMLImageElement>();
  let displayed: Season | undefined;
  let requested: Season | undefined;
  let revision = 0;
  let destroyed = false;

  function cancelPending() {
    for (const image of pending) image.removeAttribute('src');
    pending.clear();
  }

  async function load(season: Season) {
    requested = season;
    const token = ++revision;
    cancelPending();
    if (season === displayed) return;
    const images = (['vignette'] as const).map(kind => {
      const image = new Image();
      image.alt = '';
      image.className = `ph-seasonal-decor__${kind}`;
      image.draggable = false;
      image.decoding = 'async';
      image.src = `/assets/penthouse/seasonal-accents/${season}-${kind}.webp`;
      pending.add(image);
      return image;
    });
    const decoded = await Promise.allSettled(images.map(image => image.decode()));
    for (const image of images) pending.delete(image);
    if (destroyed || token !== revision) return;
    if (decoded.every(result => result.status === 'fulfilled')) {
      layer.replaceChildren(...images);
      layer.dataset.season = season;
      displayed = season;
    } else {
      for (const image of images) image.removeAttribute('src');
      requested = displayed;
    }
  }

  return {
    update(state: ClimateState) {
      if (!destroyed && state.season !== requested) void load(state.season);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      revision++;
      cancelPending();
      layer.replaceChildren();
      layer.remove();
    },
  };
}
