import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { DESK_FOREGROUND } from './cyber-desk-layout.ts';

// Exercise the real controller with a recording canvas and deterministic RAF.
// CSS/mullion rasterization still requires Chrome; this is not a screenshot test.
const source = readFileSync(new URL('./cyber-atmosphere.ts', import.meta.url), 'utf8')
  .replace("import './cyber-atmosphere.css';", '')
  .replaceAll("'./cyber-ambient-paths'", JSON.stringify(new URL('./cyber-ambient-paths.ts', import.meta.url).href))
  .replaceAll("'./cyber-weather-motion'", JSON.stringify(new URL('./cyber-weather-motion.ts', import.meta.url).href));
const { mountCyberAtmosphere } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`) as typeof import('./cyber-atmosphere');

type Command = [string, ...unknown[]];
class PathFake {
  commands: Command[] = [];
  moveTo(...args: number[]) { this.commands.push(['moveTo', ...args]); }
  lineTo(...args: number[]) { this.commands.push(['lineTo', ...args]); }
  rect(...args: number[]) { this.commands.push(['rect', ...args]); }
  closePath() { this.commands.push(['closePath']); }
}

class Events {
  listeners = new Map<string, Set<() => void>>();
  addEventListener(type: string, callback: () => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(callback);
  }
  removeEventListener(type: string, callback: () => void) { this.listeners.get(type)?.delete(callback); }
  dispatch(type: string) { this.listeners.get(type)?.forEach(callback => callback()); }
  count() { return [...this.listeners.values()].reduce((total, listeners) => total + listeners.size, 0); }
}

function fixture(options: { reduced?: boolean; noContext?: boolean; width?: number; height?: number } = {}) {
  let now = 0, nextId = 1, paints = 0, disconnected = 0;
  const frames = new Map<number, (time: number) => void>();
  const observed: (() => void)[] = [];
  const context = {
    commands: [] as Command[], path: new PathFake(), stack: [] as { alpha: number; operation: string }[],
    globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '' as unknown, strokeStyle: '' as unknown,
    shadowBlur: 0, shadowColor: '', lineWidth: 1, lineCap: '',
    clearRect() { paints++; this.commands = []; },
    setTransform() {},
    save() { this.stack.push({ alpha: this.globalAlpha, operation: this.globalCompositeOperation }); this.commands.push(['save']); },
    restore() {
      const state = this.stack.pop()!;
      this.globalAlpha = state.alpha; this.globalCompositeOperation = state.operation;
      this.commands.push(['restore']);
    },
    clip(path: PathFake, rule = 'nonzero') { this.commands.push(['clip', path.commands, rule]); },
    beginPath() { this.path = new PathFake(); },
    moveTo(...args: number[]) { this.path.moveTo(...args); },
    lineTo(...args: number[]) { this.path.lineTo(...args); },
    quadraticCurveTo(...args: number[]) { this.path.commands.push(['quadraticCurveTo', ...args]); },
    ellipse(...args: number[]) { this.path.commands.push(['ellipse', ...args]); },
    fill(path?: PathFake) { this.commands.push(['fill', (path ?? this.path).commands, this.globalCompositeOperation, this.globalAlpha, this.fillStyle]); },
    stroke() { this.commands.push(['stroke', this.path.commands, this.globalAlpha, this.strokeStyle, this.lineWidth]); },
    fillRect(...args: number[]) { this.commands.push(['fillRect', args, this.globalAlpha, this.fillStyle, this.shadowBlur]); },
    createLinearGradient(...args: number[]) { return gradient(args); },
    createRadialGradient(...args: number[]) { return gradient(args); },
  };
  function gradient(args: number[]) {
    return { args, stops: [] as [number, string][], addColorStop(offset: number, color: string) { this.stops.push([offset, color]); } };
  }
  class Element {
    dataset: Record<string, string> = {};
    attributes: Record<string, string> = {};
    style = { setProperty() {} };
    className = ''; hidden = false; removed = false; width = 0; height = 0;
    clientWidth = options.width ?? 1672; clientHeight = options.height ?? 941;
    children: Element[] = []; siblings: Element[] = [];
    append(element: Element) { this.children.push(element); }
    after(element: Element) { this.siblings.push(element); }
    remove() { this.removed = true; }
    setAttribute(key: string, value: string) { this.attributes[key] = value; }
    getContext() { return options.noContext ? null : context; }
  }
  const media = Object.assign(new Events(), { matches: options.reduced ?? false });
  const page = Object.assign(new Events(), { hidden: false, createElement: () => new Element() });
  const browser = Object.assign(new Events(), {
    devicePixelRatio: 3,
    matchMedia: () => media,
    requestAnimationFrame(callback: (time: number) => void) { const id = nextId++; frames.set(id, callback); return id; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  });
  const old = { window: globalThis.window, document: globalThis.document, Path2D: globalThis.Path2D, ResizeObserver: globalThis.ResizeObserver };
  Object.assign(globalThis, {
    window: browser, document: page, Path2D: PathFake,
    ResizeObserver: class { constructor(callback: () => void) { observed.push(callback); } observe() {} disconnect() { disconnected++; } },
  });
  const host = new Element();
  const controller = mountCyberAtmosphere(host as unknown as HTMLElement, {
    windowPolygon: [[.255, .03], [1, 0], [1, .60], [.93, .60], [.93, .63], [.255, .63]],
    foregroundPolygons: DESK_FOREGROUND,
  });
  const canvas = host.children[0], reflection = host.siblings[0];
  function advance(milliseconds: number, hz = 120) {
    const until = now + milliseconds;
    while (now + 1000 / hz <= until + .000001) {
      now += 1000 / hz;
      const pending = [...frames]; frames.clear();
      pending.forEach(([, callback]) => callback(now));
    }
    now = until;
  }
  return {
    host, controller, context, canvas, reflection, frames, media, page, browser, advance,
    paintCount: () => paints,
    disconnected: () => disconnected,
    snapshot: () => JSON.stringify(context.commands),
    resize(width: number, height: number) { host.clientWidth = width; host.clientHeight = height; observed.forEach(callback => callback()); },
    restore() { controller.destroy(); Object.assign(globalThis, old); },
  };
}

test('drawing stays capped at 30fps on 120Hz and pauses without catching up hidden time', () => {
  const f = fixture();
  try {
    const before = f.paintCount();
    f.advance(2000);
    assert.ok(f.paintCount() - before >= 58 && f.paintCount() - before <= 60);
    f.controller.setActive(false);
    const paused = f.snapshot(), pausedPaints = f.paintCount();
    assert.equal(f.frames.size, 0);
    assert.equal(f.reflection.dataset.active, 'false');
    f.advance(30_000);
    assert.equal(f.snapshot(), paused);
    assert.equal(f.paintCount(), pausedPaints);
    f.controller.setActive(true);
    assert.equal(f.snapshot(), paused, 'resume paints the retained scene time');
    f.advance(1000);
    assert.notEqual(f.snapshot(), paused);
    f.page.hidden = true; f.page.dispatch('visibilitychange');
    const hidden = f.snapshot();
    assert.equal(f.frames.size, 0);
    f.advance(40_000);
    f.page.hidden = false; f.page.dispatch('visibilitychange');
    assert.equal(f.snapshot(), hidden, 'hidden wall-clock duration never advances weather');
    assert.equal(f.frames.size, 1);
  } finally { f.restore(); }
});

test('reduced motion keeps a static weather frame and never restarts on climate or resize', () => {
  const f = fixture({ reduced: true });
  try {
    assert.equal(f.frames.size, 0);
    assert.ok(f.context.commands.some(command => command[0] === 'stroke'));
    f.controller.setClimate({ season: 'winter', time: 'morning', weather: 'snow' });
    const frame = f.snapshot();
    f.advance(15_000);
    assert.equal(f.snapshot(), frame);
    f.resize(836, 470.5);
    assert.equal(f.frames.size, 0);
    assert.equal(f.canvas.width, 1254, 'device pixel ratio is capped at 1.5');
    assert.equal(f.reflection.dataset.active, 'false');
    f.media.matches = false; f.media.dispatch('change');
    f.advance(1000);
    f.media.matches = true; f.media.dispatch('change');
    const freeze = f.snapshot();
    f.advance(10_000);
    assert.equal(f.snapshot(), freeze);
    assert.equal(f.frames.size, 0);
  } finally { f.restore(); }
});

test('weather, glass drops and river lights share the window clip and independent furniture masks', () => {
  const f = fixture();
  try {
    for (const weather of ['clear', 'cloudy', 'rain', 'snow', 'mist'] as const) {
      f.controller.setClimate({ season: 'winter', time: 'night', weather });
      const clips = f.context.commands.filter(command => command[0] === 'clip');
      assert.equal(clips.length, 2);
      assert.equal(clips[1][2], 'evenodd', 'winter tree removes its silhouette from the window');
      const masks = f.context.commands.filter(command => command[0] === 'fill' && command[2] === 'destination-out');
      assert.equal(masks.length, DESK_FOREGROUND.length, 'overlapping desk and leaf shapes never reopen holes');
      assert.ok(masks.every(command => command[3] === 1));
      const firstDraw = f.context.commands.findIndex(command => ['fill', 'stroke', 'fillRect'].includes(command[0]));
      assert.ok(firstDraw > f.context.commands.indexOf(clips[1]));
      const lastDraw = f.context.commands.filter(command => ['fill', 'stroke', 'fillRect'].includes(command[0])).at(-1)!;
      assert.equal(lastDraw[2], 'destination-out', 'all outdoor detail is erased behind foreground last');
      if (weather === 'rain') assert.ok(f.snapshot().includes('quadraticCurveTo'), 'glass trails are present within the same pass');
      else assert.ok(!f.snapshot().includes('quadraticCurveTo'));
    }
  } finally { f.restore(); }
});

test('crossfading mounted seasons retain winter occlusion regardless of the requested climate', () => {
  const f = fixture();
  const winterClipped = () => f.context.commands.some(command => command[0] === 'clip' && command[2] === 'evenodd');
  try {
    f.controller.setClimate({ season: 'winter', time: 'night', weather: 'snow' });
    assert.equal(winterClipped(), true, 'standalone hosts retain climate fallback');
    f.controller.setVisibleSeasons(['summer']);
    assert.equal(winterClipped(), false, 'pending winter request does not hide a still-visible summer plate');
    f.controller.setVisibleSeasons(['summer', 'winter']);
    assert.equal(winterClipped(), true);
    f.controller.setClimate({ season: 'spring', time: 'morning', weather: 'rain' });
    assert.equal(winterClipped(), true, 'failed or pending spring decode leaves the visible winter tree protected');
    f.controller.setVisibleSeasons(['winter', 'spring']);
    assert.equal(winterClipped(), true);
    f.controller.setVisibleSeasons(['spring']);
    assert.equal(winterClipped(), false);
    f.controller.setClimate({ season: 'winter', time: 'morning', weather: 'rain' });
    assert.equal(winterClipped(), false, 'once supplied, mounted seasons stay authoritative');
  } finally { f.restore(); }
});

test('spring flowers supplement leaf masks and remain opaque while their plate fades out', () => {
  const f = fixture();
  const masks = () => f.context.commands.filter(command => command[0] === 'fill' && command[2] === 'destination-out').length;
  try {
    f.controller.setClimate({ season: 'spring', time: 'morning', weather: 'rain' });
    const withFlowers = masks();
    assert.ok(withFlowers > DESK_FOREGROUND.length);
    f.controller.setVisibleSeasons(['spring', 'summer']);
    f.controller.setClimate({ season: 'summer', time: 'noon', weather: 'snow' });
    assert.equal(masks(), withFlowers);
    f.controller.setVisibleSeasons(['summer']);
    assert.equal(masks(), DESK_FOREGROUND.length);
  } finally { f.restore(); }
});

test('all 100 climate selections and the legacy rain shortcut preserve chosen season and time', () => {
  const f = fixture({ reduced: true });
  try {
    for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
      for (const time of ['morning', 'noon', 'afternoon', 'evening', 'night'] as const) {
        for (const weather of ['clear', 'cloudy', 'rain', 'snow', 'mist'] as const) {
          f.controller.setClimate({ season, time, weather });
          assert.equal(f.canvas.dataset.season, season);
          assert.equal(f.canvas.dataset.time, time);
          assert.equal(f.canvas.dataset.weather, weather);
          assert.equal(f.frames.size, 0);
        }
        f.controller.setRain(true);
        assert.equal(f.canvas.dataset.weather, 'rain');
        assert.equal(f.canvas.dataset.season, season);
        assert.equal(f.canvas.dataset.time, time);
        f.controller.setRain(false);
        assert.equal(f.canvas.dataset.weather, 'clear');
      }
    }
  } finally { f.restore(); }
});

test('invalid windows stop both effects and can recover; destruction clears all scheduled work', () => {
  const f = fixture();
  try {
    for (const polygon of [[], [[0, 0], [1, 0]], [[0, 0], [1, 1], [NaN, 0]], [[0, 0], [.5, .5], [1, 1]]]) {
      f.controller.setWindowPolygon(polygon);
      assert.deepEqual(f.context.commands, []);
      assert.equal(f.reflection.hidden, true);
      assert.equal(f.reflection.dataset.active, 'false');
      assert.equal(f.frames.size, 0);
    }
    f.controller.setWindowPolygon([[.3, .05], [.9, .05], [.9, .6], [.3, .6]]);
    assert.equal(f.reflection.hidden, false);
    assert.equal(f.frames.size, 1);
    f.resize(0, 0);
    assert.equal(f.frames.size, 0);
    f.resize(1672, 941);
    assert.equal(f.frames.size, 1);
    f.controller.destroy(); f.controller.destroy();
    assert.equal(f.disconnected(), 1);
    assert.equal(f.canvas.removed, true);
    assert.equal(f.reflection.removed, true);
    assert.equal(f.canvas.width, 0);
    assert.equal(f.canvas.height, 0);
    assert.equal(f.frames.size, 0);
    assert.equal(f.page.count() + f.media.count() + f.browser.count(), 0);
    const paints = f.paintCount();
    f.controller.setRain(true);
    f.controller.setVisibleSeasons(['winter']);
    f.controller.setActive(true);
    f.controller.setWindowPolygon([[0, 0], [1, 0], [1, 1]]);
    f.resize(800, 450); f.advance(1000);
    assert.equal(f.paintCount(), paints);
  } finally { f.restore(); }
});

test('unavailable canvas creates no DOM, listeners or animation and remains safely disposable', () => {
  const f = fixture({ noContext: true });
  try {
    assert.equal(f.host.children.length + f.host.siblings.length, 0);
    assert.equal(f.frames.size + f.page.count() + f.media.count() + f.browser.count(), 0);
    f.controller.setVisibleSeasons(['winter']);
    f.controller.setClimate({ season: 'winter', time: 'night', weather: 'snow' });
    f.controller.setRain(false); f.controller.setActive(false); f.controller.setWindowPolygon([]);
    f.controller.destroy();
  } finally { f.restore(); }
});
