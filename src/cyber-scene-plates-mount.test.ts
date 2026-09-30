import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mountScenePlates } from './cyber-scene-plates.ts';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

class Plate {
  src = '';
  dataset: Record<string, string> = {};
  className = 'night-plate';
  classList = new Set<string>();
  alt = '';
  draggable = true;
  decoding = '';
  offsetWidth = 1536;
  parent?: Host;
  decoded = deferred();
  getAttribute(name: string) {
    if (name === 'src') return this.src;
    if (name === 'data-season') return this.dataset.season ?? null;
    return null;
  }
  decode() { return this.decoded.promise; }
  remove() {
    if (!this.parent) return;
    this.parent.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = undefined;
  }
}

class Host {
  children: Plate[] = [];
  get lastElementChild() { return this.children.at(-1) ?? null; }
  append(image: Plate) { image.parent = this; this.children.push(image); }
}

type InitialPlate = { src: string; season?: string };
const source = (season: string, time = 'night') => `/assets/cyberpunk/climate/${season}-${time}.webp`;

function fixture(t: TestContext, initial: InitialPlate[], reducedMotion = false, report = true,
  decorate?: (image: HTMLImageElement, source: string) => Promise<HTMLElement>) {
  const host = new Host();
  for (const item of initial) {
    const image = new Plate();
    image.src = item.src;
    if (item.season) image.dataset.season = item.season;
    host.append(image);
  }
  let now = 0, nextId = 0, errors = 0;
  const images: Plate[] = [];
  const updates: string[][] = [];
  const tasks = new Map<number, { at: number; callback: () => void; kind: 'frame' | 'timer' }>();
  const schedule = (callback: () => void, delay: number, kind: 'frame' | 'timer') => {
    const id = ++nextId;
    tasks.set(id, { at: now + delay, callback, kind });
    return id;
  };
  const original = new Map<string, PropertyDescriptor | undefined>();
  const install = (key: string, value: unknown) => {
    original.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  install('Image', class extends Plate { constructor() { super(); images.push(this); } });
  install('matchMedia', () => ({ matches: reducedMotion }));
  install('requestAnimationFrame', (callback: (time: number) => void) => schedule(() => callback(now), 16, 'frame'));
  install('cancelAnimationFrame', (id: number) => tasks.delete(id));
  install('setTimeout', (callback: () => void, delay = 0) => schedule(callback, delay, 'timer'));
  install('clearTimeout', (id: number) => tasks.delete(id));
  const controller = mountScenePlates(
    host as unknown as HTMLElement,
    () => errors++,
    report ? seasons => updates.push([...seasons]) : undefined,
    decorate,
  );
  t.after(() => {
    controller.destroy();
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  function advance(duration: number) {
    const until = now + duration;
    while (true) {
      const next = [...tasks].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > until) break;
      now = next[1].at;
      tasks.delete(next[0]);
      next[1].callback();
    }
    now = until;
  }
  async function start(season: string, time = 'night') {
    const request = controller.setScene(season, time);
    await Promise.resolve();
    const image = [...images].reverse().find(item => item.src === source(season, time));
    assert.ok(image, 'the scene request creates an image to decode');
    return { request, image };
  }
  async function show(season: string, time = 'night') {
    const pending = await start(season, time);
    pending.image.decoded.resolve();
    assert.equal(await pending.request, true);
    return pending.image;
  }
  return { host, controller, images, updates, tasks, advance, start, show, errors: () => errors };
}

test('mount reports distinct initial seasons from known sources and explicit metadata', t => {
  const f = fixture(t, [
    { src: source('summer') },
    { src: `https://example.test${source('summer', 'morning')}?version=2` },
    { src: '/assets/custom-scene.webp', season: 'winter' },
    { src: source('autumn'), season: 'unknown' },
    { src: '/assets/cyberpunk/modern-studio-unlit.webp' },
    { src: '/unrelated/winter-night.webp' },
  ]);
  assert.deepEqual(f.updates, [['summer', 'winter', 'autumn']]);
});

test('winter stays in the visible union through summer decode and the complete fade', async t => {
  const f = fixture(t, [{ src: source('winter') }]);
  const summer = await f.start('summer');
  assert.deepEqual(f.updates, [['winter']], 'starting a download cannot remove winter clipping');
  assert.equal(f.host.children.length, 1);
  f.advance(5000);
  assert.deepEqual(f.updates, [['winter']], 'waiting for a slow decode retains the old artwork');
  summer.image.decoded.resolve();
  assert.equal(await summer.request, true);
  assert.equal(summer.image.dataset.season, 'summer');
  assert.deepEqual(f.updates, [['winter'], ['winter', 'summer']]);
  assert.equal(f.host.children.length, 2);
  assert.equal(summer.image.classList.has('is-visible'), false);
  f.advance(16);
  assert.equal(summer.image.classList.has('is-visible'), true);
  f.advance(1099);
  assert.deepEqual(f.updates.at(-1), ['winter', 'summer']);
  assert.equal(f.host.children.length, 2);
  f.advance(1);
  assert.deepEqual(f.updates, [['winter'], ['winter', 'summer'], ['summer']]);
  assert.deepEqual(f.host.children, [summer.image]);
  assert.equal(f.tasks.size, 0);
});

test('failed summer decode preserves winter and a retry reports only decoded artwork', async t => {
  const f = fixture(t, [{ src: source('winter') }]);
  const failed = await f.start('summer');
  failed.image.decoded.reject(new Error('decode failed'));
  assert.equal(await failed.request, false);
  f.advance(5000);
  assert.equal(f.errors(), 1);
  assert.deepEqual(f.updates, [['winter']]);
  assert.equal(f.host.children.length, 1);
  const retry = await f.show('summer');
  assert.notEqual(retry, failed.image);
  assert.deepEqual(f.updates.at(-1), ['winter', 'summer']);
  f.advance(1116);
  assert.deepEqual(f.updates.at(-1), ['summer']);
});

test('summer to winter enables winter clipping as soon as the decoded layer is mounted', async t => {
  const f = fixture(t, [{ src: source('summer') }]);
  const winter = await f.show('winter');
  assert.deepEqual(f.updates, [['summer'], ['summer', 'winter']]);
  assert.equal(winter.classList.has('is-visible'), false, 'mask updates before the animation frame');
  f.advance(1116);
  assert.deepEqual(f.updates.at(-1), ['winter']);
  assert.deepEqual(f.host.children, [winter]);
});

test('rapid decoded requests retain every mounted season until the newest fade retires them', async t => {
  const f = fixture(t, [{ src: source('summer') }]);
  await f.show('winter');
  f.advance(16);
  const stale = await f.start('autumn');
  const spring = await f.show('spring');
  f.advance(16);
  stale.image.decoded.resolve();
  assert.equal(await stale.request, false);
  assert.equal(f.errors(), 0);
  assert.deepEqual(f.updates, [['summer'], ['summer', 'winter'], ['summer', 'winter', 'spring']]);
  assert.equal(f.host.children.length, 3, 'a stale decoded request never mounts');
  f.advance(1084);
  assert.deepEqual(f.updates.at(-1), ['summer', 'winter', 'spring']);
  assert.equal(f.host.children.length, 3, 'the old winter fade cannot retire layers for the newer spring fade');
  f.advance(16);
  assert.deepEqual(f.updates.at(-1), ['spring']);
  assert.deepEqual(f.host.children, [spring]);
  assert.equal(f.updates.length, 4, 'a superseded fade emits no retirement update');
});

test('a failed newer request does not disturb an in-progress winter to summer fade', async t => {
  const f = fixture(t, [{ src: source('winter') }]);
  const summer = await f.show('summer');
  f.advance(16);
  const failed = await f.start('spring');
  failed.image.decoded.reject(new Error('offline'));
  assert.equal(await failed.request, false);
  assert.deepEqual(f.updates.at(-1), ['winter', 'summer']);
  f.advance(1100);
  assert.deepEqual(f.updates.at(-1), ['summer']);
  assert.deepEqual(f.host.children, [summer]);
});

test('different times in one season do not duplicate that season in the mounted union', async t => {
  const f = fixture(t, [{ src: source('winter') }]);
  await f.show('winter', 'morning');
  await f.show('winter', 'noon');
  assert.deepEqual(f.updates, [['winter'], ['winter'], ['winter']]);
  assert.equal(f.host.children.length, 3);
  f.advance(1116);
  assert.deepEqual(f.updates.at(-1), ['winter']);
  assert.equal(f.host.children.length, 1);
});

test('reduced motion reports append and immediate retirement without scheduling a fade', async t => {
  const f = fixture(t, [{ src: source('winter') }], true);
  const summer = await f.show('summer');
  assert.deepEqual(f.updates, [['winter'], ['winter', 'summer'], ['summer']]);
  assert.deepEqual(f.host.children, [summer]);
  assert.equal(summer.classList.has('is-visible'), true);
  assert.equal(f.tasks.size, 0);
});

test('destroy cancels both queued frames and fade timers and ignores late decode completion', async t => {
  const f = fixture(t, [{ src: source('winter') }]);
  await f.show('summer');
  f.advance(16);
  await f.show('spring');
  assert.deepEqual([...f.tasks.values()].map(task => task.kind), ['timer', 'frame']);
  const pending = await f.start('autumn');
  const lateCallbacks = [...f.tasks.values()].map(task => task.callback);
  const updates = [...f.updates];
  const mounted = [...f.host.children];
  f.controller.destroy();
  assert.equal(f.tasks.size, 0);
  pending.image.decoded.resolve();
  assert.equal(await pending.request, false);
  for (const callback of lateCallbacks) callback();
  f.advance(5000);
  assert.deepEqual(f.updates, updates);
  assert.deepEqual(f.host.children, mounted);
  assert.equal(f.errors(), 0);
  assert.equal(f.tasks.size, 0);
  assert.equal(await f.controller.setScene('winter', 'noon'), false);
});

test('destroy suppresses late decode errors and supports callers without a season callback', async t => {
  const f = fixture(t, [{ src: source('summer') }], false, false);
  const winter = await f.show('winter');
  f.advance(1116);
  assert.deepEqual(f.host.children, [winter]);
  const pending = await f.start('spring');
  f.controller.destroy();
  pending.image.decoded.reject(new Error('late failure'));
  assert.equal(await pending.request, false);
  assert.equal(f.errors(), 0);
  assert.deepEqual(f.updates, []);
});

test('a late interior decode never replaces a newer scene or mounts after destruction', async t => {
  const held = deferred();
  const f = fixture(t, [{ src: source('summer') }], true, true, async (image, src) => {
    if (src === source('winter')) await held.promise;
    return image;
  });
  const winter = await f.start('winter');
  winter.image.decoded.resolve();
  await Promise.resolve();
  assert.equal(f.host.children[0].src, source('summer'));
  const spring = await f.show('spring');
  held.resolve();
  assert.equal(await winter.request, false);
  assert.deepEqual(f.host.children, [spring]);
  const pending = await f.start('autumn');
  f.controller.destroy();
  pending.image.decoded.resolve();
  assert.equal(await pending.request, false);
  assert.deepEqual(f.host.children, [spring]);
});
