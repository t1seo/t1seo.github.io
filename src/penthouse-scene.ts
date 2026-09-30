import type { ClimateState } from './cyber-climate.ts';

export function penthousePlate(time: ClimateState['time']): string {
  return `/assets/penthouse/${time === 'night' ? 'night' : time === 'evening' ? 'evening' : 'day'}.webp`;
}

// Coordinates measured against the NEW 1672 × 941 illustration. The lower edge
// follows the sofa silhouette, so rain/snow never paints across the furniture.
export const PENTHOUSE_WINDOW = 'polygon(0 0, 22.5% 16.5%, 64% 12.5%, 64% 53.3%, 52.2% 53.3%, 52.2% 52%, 42.2% 49%, 42.2% 48.5%, 30.3% 47%, 29.4% 46.5%, 18% 49%, 12% 49.7%, 6% 52.5%, 6% 57.3%, 0 59%)';

export function mountPenthouseScene(room: HTMLElement, onError: () => void) {
  const layers = room.querySelector<HTMLElement>('[data-plates]')!;
  const canvas = room.querySelector<HTMLCanvasElement>('canvas')!;
  const context = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController();
  const opts = { signal: abort.signal };
  let state: ClimateState = { season: 'autumn', time: 'night', weather: 'clear', auto: true };
  let revision = 0;
  let frame = 0;
  let dead = false;
  let displayed = penthousePlate('night');
  let requested = displayed;
  let loaded: HTMLImageElement | null = null;
  canvas.style.clipPath = PENTHOUSE_WINDOW;
  room.querySelector<HTMLElement>('[data-weather-wash]')!.style.clipPath = PENTHOUSE_WINDOW;
  room.querySelector<HTMLElement>('[data-season-wash]')!.style.clipPath = PENTHOUSE_WINDOW;
  canvas.width = 1672;
  canvas.height = 941;
  const particles = Array.from({ length: 100 }, (_, i) => ({
    x: ((i * 137.51) % 1080), y: (i * 89.31) % 560, speed: 0.65 + (i % 7) / 10,
  }));

  function draw(now: number) {
    frame = 0;
    if (!context || dead) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (document.hidden || !['rain', 'snow'].includes(state.weather)) return;
    const snow = state.weather === 'snow';
    const clock = reduced.matches ? 1300 : now;
    context.strokeStyle = 'rgba(215,230,244,.38)';
    context.fillStyle = 'rgba(244,245,247,.78)';
    context.lineWidth = 1.2;
    for (const p of particles) {
      const y = (p.y + clock * p.speed * (snow ? .025 : .4)) % 620;
      const x = p.x + (snow ? Math.sin(clock * .0007 + p.x) * 12 : y * .07);
      context.beginPath();
      if (snow) { context.arc(x, y, 1.3 + p.speed, 0, Math.PI * 2); context.fill(); }
      else { context.moveTo(x, y); context.lineTo(x + 2, y + 22); context.stroke(); }
    }
    if (!reduced.matches) frame = requestAnimationFrame(draw);
  }
  function animate() { cancelAnimationFrame(frame); frame = 0; draw(performance.now()); }
  document.addEventListener('visibilitychange', animate, opts);
  reduced.addEventListener('change', animate, opts);

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
      displayed = source;
    } catch {
      if (!dead && token === revision) { requested = displayed; onError(); }
    } finally { if (loaded === image) loaded = null; }
  }
  return {
    update(next: ClimateState) {
      state = next;
      for (const key of ['season', 'time', 'weather'] as const) room.dataset[key] = state[key];
      const source = penthousePlate(state.time);
      if (source !== requested) void changePlate(source);
      animate();
    },
    destroy() {
      dead = true; revision++; abort.abort(); cancelAnimationFrame(frame);
      if (loaded) { loaded.src = ''; loaded = null; }
    },
  };
}
