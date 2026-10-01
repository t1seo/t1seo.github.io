import type { ClimateState } from './cyber-climate.ts';
import { mountPenthouseEffects } from './penthouse-effects.ts';
import { GLASS_EDGE, ROOM_SIZE } from './penthouse-atmosphere.ts';

export function penthousePlate(time: ClimateState['time'], weather: ClimateState['weather'] = 'clear', season: ClimateState['season'] = 'autumn'): string {
  // Diffuse daylight for precipitation: do not leave a painted sun behind rain.
  const diffuse = weather !== 'clear' && ['morning', 'noon', 'afternoon'].includes(time);
  return `/assets/penthouse/seoul/${season}/${diffuse ? 'noon' : time}.webp`;
}

// Coordinates measured against the frontal 1672 × 941 Seoul illustration.
// Individual visible panes in the compositor also subtract foreground furniture.
export const PENTHOUSE_WINDOW = `polygon(${GLASS_EDGE.map(([x,y]) => `${x / ROOM_SIZE[0] * 100}% ${y / ROOM_SIZE[1] * 100}%`).join(', ')})`;

export function mountPenthouseScene(room: HTMLElement, onError: () => void) {
  const layers = room.querySelector<HTMLElement>('[data-plates]')!;
  const canvas = room.querySelector<HTMLCanvasElement>('canvas')!;
  const effects = mountPenthouseEffects(canvas, room.querySelector<HTMLImageElement>('.ph-plate'));
  let state: ClimateState = { season: 'autumn', time: 'night', weather: 'clear', auto: true };
  let revision = 0;
  let dead = false;
  let displayed = penthousePlate('night');
  let requested = displayed;
  const loaded = new Set<HTMLImageElement>();
  room.querySelector<HTMLElement>('[data-weather-wash]')!.style.clipPath = PENTHOUSE_WINDOW;
  async function changePlate(source: string) {
    requested = source;
    const token = ++revision;
    if (source === displayed) return;
    const image = new Image();
    loaded.add(image);
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
    } finally { loaded.delete(image); }
  }
  return {
    update(next: ClimateState) {
      state = next;
      for (const key of ['season', 'time', 'weather'] as const) room.dataset[key] = state[key];
      const source = penthousePlate(state.time, state.weather, state.season);
      if (source !== requested) void changePlate(source);
      effects.update(state);
    },
    setWorkspace(next: Parameters<typeof effects.setWorkspace>[0]) {
      room.dataset.deskLamp = String(next.lamp);
      room.dataset.floorLamp = String(Boolean(next.floorLamp));
      room.dataset.monitor = String(next.monitor);
      effects.setWorkspace(next);
    },
    setAnimated: effects.setAnimated,
    setPreview: effects.setPreview,
    savorCoffee: effects.savorCoffee,
    strikeBowl: effects.strikeBowl,
    scentDiffuser: effects.scentDiffuser,
    destroy() {
      dead = true; revision++; effects.destroy();
      for (const image of loaded) image.src = '';
      loaded.clear();
    },
  };
}
