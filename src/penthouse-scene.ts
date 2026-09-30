import type { ClimateState } from './cyber-climate.ts';
import { mountPenthouseEffects } from './penthouse-effects.ts';

export function penthousePlate(time: ClimateState['time'], weather: ClimateState['weather'] = 'clear'): string {
  // Diffuse daylight for precipitation: do not leave a painted sun behind rain.
  const diffuse = weather !== 'clear' && ['morning', 'noon', 'afternoon'].includes(time);
  return `/assets/penthouse/workspace/${diffuse ? 'noon' : time}.webp`;
}

// Coordinates measured against the NEW 1672 × 941 illustration. The lower edge
// follows the sofa silhouette, so rain/snow never paints across the furniture.
export const PENTHOUSE_WINDOW = 'polygon(0 0, 22.5% 16.5%, 64% 12.5%, 64% 53.3%, 52.2% 53.3%, 52.2% 52%, 42.2% 49%, 42.2% 48.5%, 30.3% 47%, 29.4% 46.5%, 18% 49%, 12% 49.7%, 6% 52.5%, 6% 57.3%, 0 59%)';

export function mountPenthouseScene(room: HTMLElement, onError: () => void) {
  const layers = room.querySelector<HTMLElement>('[data-plates]')!;
  const canvas = room.querySelector<HTMLCanvasElement>('canvas')!;
  const effects = mountPenthouseEffects(canvas, room.querySelector<HTMLImageElement>('.ph-plate'));
  let state: ClimateState = { season: 'autumn', time: 'night', weather: 'clear', auto: true };
  let revision = 0;
  let dead = false;
  let displayed = penthousePlate('night');
  let requested = displayed;
  let loaded: HTMLImageElement | null = null;
  room.querySelector<HTMLElement>('[data-weather-wash]')!.style.clipPath = PENTHOUSE_WINDOW;
  room.querySelector<HTMLElement>('[data-season-wash]')!.style.clipPath = PENTHOUSE_WINDOW;
  async function changePlate(source: string) {
    requested = source;
    const token = ++revision;
    if (source === displayed) return;
    const image = new Image();
    loaded = image;
    image.alt = '';
    image.className = 'ph-plate';
    image.draggable = false;
    image.src = source;
    try {
      await image.decode();
      if (dead || token !== revision) return;
      // Image stays visible until its replacement has decoded; no blank flashes.
      layers.replaceChildren(image);
      effects.setPlate(image);
      displayed = source;
    } catch {
      if (!dead && token === revision) { requested = displayed; onError(); }
    } finally { if (loaded === image) loaded = null; }
  }
  return {
    update(next: ClimateState) {
      state = next;
      for (const key of ['season', 'time', 'weather'] as const) room.dataset[key] = state[key];
      const source = penthousePlate(state.time, state.weather);
      if (source !== requested) void changePlate(source);
      effects.update(state);
    },
    setWorkspace: effects.setWorkspace,
    setAnimated: effects.setAnimated,
    setPreview: effects.setPreview,
    destroy() {
      dead = true; revision++; effects.destroy();
      if (loaded) { loaded.src = ''; loaded = null; }
    },
  };
}
