import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Run the real controller in a deliberately small DOM/clock harness. CSS is browser-owned.
const source = readFileSync(new URL('./cyber-pet.ts', import.meta.url), 'utf8')
  .replace("import './cyber-pet.css';", '')
  .replace("'./cyber-pet-geometry'", JSON.stringify(new URL('./cyber-pet-geometry.ts', import.meta.url).href))
  .replace("'./cyber-pet-motion'", JSON.stringify(new URL('./cyber-pet-motion.ts', import.meta.url).href))
  .replace("'./cyber-pet-roam'", JSON.stringify(new URL('./cyber-pet-roam.ts', import.meta.url).href))
  .replace("'./cyber-pet-life'", JSON.stringify(new URL('./cyber-pet-life.ts', import.meta.url).href))
  .replace("'./cyber-pet-rest'", JSON.stringify(new URL('./cyber-pet-rest.ts', import.meta.url).href))
  .replace("'./cyber-pet-activity'", JSON.stringify(new URL('./cyber-pet-activity.ts', import.meta.url).href));
const { mountCyberPet } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`) as typeof import('./cyber-pet');

type Task = { at: number; callback: () => void; kind: 'timer' | 'frame' };
const rect = { left: 0, top: 0, width: 1672, height: 941 };
const POSES = ['blink', 'attend', 'sniff'] as const;
const RESTS = ['sit', 'drowsy', 'sleep', 'sitdown', 'wake'] as const;

// Tests mount with every optional pose enabled to exercise the full behavior; production
// defaults request only what root confirmed shipped (MILKY_SHIPPED_POSES/_REST).
function fixture(seed = 7829, shipped: readonly string[] | null = POSES, shippedRest: readonly string[] = RESTS, shippedTrot = true) {
  let now = 0;
  let nextId = 1;
  const tasks = new Map<number, Task>();
  const schedule = (callback: () => void, delay: number, kind: Task['kind']) => {
    const id = nextId++;
    tasks.set(id, { at: now + delay, callback, kind });
    return id;
  };
  class Element extends EventTarget {
    ownerDocument!: DocumentFake;
    dataset: Record<string, string> = {};
    attributes: Record<string, string> = {};
    style: Record<string, string | ((key: string, value: string) => void)> = { setProperty(key: string, value: string) { this[key] = value; } };
    children: Element[] = [];
    hidden = false;
    disabled = false;
    className = '';
    type = '';
    alt = '';
    draggable = false;
    decoding = '';
    width = 0;
    height = 0;
    clientWidth = rect.width;
    clientHeight = rect.height;
    removed = false;
    src = '';
    focusVisible = false;
    matches() { return this.focusVisible; }
    naturalWidth = 1536;
    naturalHeight = 1024;
    append(...children: Element[]) { this.children.push(...children); }
    setAttribute(key: string, value: string) { this.attributes[key] = value; }
    getBoundingClientRect() { return rect; }
    closest(selector: string) { return selector === '.night-studio' ? studio : scene; }
    decodeFails = false;
    decode() { return this.decodeFails ? Promise.reject(new Error('decode failed')) : Promise.resolve(); }
    remove() { this.removed = true; }
  }
  const media = Object.assign(new EventTarget(), { matches: false });
  class DocumentFake extends EventTarget {
    hidden = false;
    images: Element[] = [];
    defaultView = {
      matchMedia: () => media,
      performance: { now: () => now },
      requestAnimationFrame: (callback: (time: number) => void) => schedule(() => callback(now), 16, 'frame'),
      cancelAnimationFrame: (id: number) => tasks.delete(id),
    };
    createElement(tag: string) {
      const element = new Element();
      element.ownerDocument = this;
      if (tag === 'img') this.images.push(element);
      return element;
    }
  }
  const document = new DocumentFake();
  const host = document.createElement('div');
  const scene = document.createElement('div');
  const studio = document.createElement('main');
  studio.dataset.intro = 'hidden';
  let observersDisconnected = 0;
  const observed: { callback: () => void; mutation: boolean }[] = [];
  const old = { setTimeout, clearTimeout, random: Math.random, ResizeObserver: globalThis.ResizeObserver, MutationObserver: globalThis.MutationObserver };
  Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  globalThis.setTimeout = ((callback: () => void, delay = 0) => schedule(callback, delay, 'timer')) as unknown as typeof setTimeout;
  globalThis.clearTimeout = ((id: number) => tasks.delete(id)) as unknown as typeof clearTimeout;
  class ResizeObserverFake {
    constructor(callback: () => void) { observed.push({ callback, mutation: false }); }
    observe() {}
    disconnect() { observersDisconnected++; }
  }
  class MutationObserverFake extends ResizeObserverFake {
    constructor(callback: () => void) { super(callback); observed.at(-1)!.mutation = true; }
  }
  globalThis.ResizeObserver = ResizeObserverFake as unknown as typeof ResizeObserver;
  globalThis.MutationObserver = MutationObserverFake as unknown as typeof MutationObserver;
  const controller = shipped
    ? mountCyberPet(host as unknown as HTMLElement, shipped as never, shippedRest as never, undefined, undefined, shippedTrot)
    : mountCyberPet(host as unknown as HTMLElement);
  // The props layer paints beneath the pet button so the lowered face eats over the bowl.
  const button = host.children.find((child) => child.className === 'cyber-pet-button')!;
  const asset = (name: string) => {
    const image = document.images.find((item) => item.src.endsWith(name));
    assert.ok(image, `image requested: ${name}`);
    return image;
  };
  const load = async (name: string, width = 1536, height = 1024) => {
    const image = asset(name);
    image.naturalWidth = width;
    image.naturalHeight = height;
    image.dispatchEvent(new Event('load'));
    await Promise.resolve();
  };
  const loadAll = async () => {
    await load('milky-v4-idle.webp');
    for (let frame = 0; frame < 8; frame++) await load(`milky-v4-step-${frame}.webp`, 768, 512);
  };
  const loadV3 = async () => {
    await load('milky-awake.webp');
    for (let frame = 0; frame < 8; frame++) await load(`milky-v3-step-${frame}.webp`, 768, 512);
  };
  const loadPoses = async () => { for (const name of POSES) await load(`milky-v4-${name}.webp`); };
  const loadRest = async (names: readonly string[] = RESTS) => { for (const name of names) await load(`milky-rest-${name}.webp`); };
  const loadActivity = async () => {
    for (const name of ['eat-low', 'eat-lift', 'play-bow', 'play-reach']) await load(`milky-${name}.webp`);
    for (const name of ['bowl', 'ball']) await load(`milky-prop-${name}.webp`, 512, 512);
  };
  const loadForward = async () => {
    await load('milky-forward-idle.webp');
    for (let frame = 0; frame < 8; frame++) await load(`milky-forward-step-${frame}.webp`, 768, 512);
  };
  const loadTrot = async (count = 4) => { for (let frame = 0; frame < count; frame++) await load(`milky-trot-${frame}.webp`, 768, 512); };
  const propsLayer = () => host.children.find((child) => child.className === 'cyber-pet-props')!;
  const propEl = (name: string) => {
    const wrap = propsLayer().children.find((child) => child.dataset.prop === name);
    assert.ok(wrap, `prop rendered: ${name}`);
    return wrap;
  };
  function advance(duration: number) {
    const until = now + duration;
    let count = 0;
    while (true) {
      const next = [...tasks].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > until) break;
      assert.ok(count++ < 10000, 'clock must not spin indefinitely');
      now = next[1].at;
      tasks.delete(next[0]);
      next[1].callback();
    }
    now = until;
  }
  const key = (key: string) => button.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key, repeat: false }));
  function restore() {
    controller.destroy();
    globalThis.setTimeout = old.setTimeout;
    globalThis.clearTimeout = old.clearTimeout;
    Math.random = old.random;
    globalThis.ResizeObserver = old.ResizeObserver;
    globalThis.MutationObserver = old.MutationObserver;
  }
  const intro = (visible: boolean) => { studio.dataset.intro = visible ? 'visible' : 'hidden'; observed.filter((o) => o.mutation).forEach((o) => o.callback()); };
  return { controller, button, document, media, tasks, host, asset, load, loadAll, loadV3, loadPoses, loadRest, loadActivity, loadForward, loadTrot, propEl, propsLayer, advance, key, intro, restore, disconnected: () => observersDisconnected };
}

test('pet requests the v4 happy identity with optional poses, and hidden/destroyed states stop all work', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    assert.deepEqual(f.document.images.map((image) => image.src.split('/').at(-1)), [
      'milky-v4-idle.webp',
      ...Array.from({ length: 8 }, (_, frame) => `milky-v4-step-${frame}.webp`),
      ...POSES.map((name) => `milky-v4-${name}.webp`),
      ...RESTS.map((name) => `milky-rest-${name}.webp`),
      'milky-eat-low.webp', 'milky-eat-lift.webp', 'milky-play-bow.webp', 'milky-play-reach.webp',
      'milky-forward-idle.webp',
      ...Array.from({ length: 8 }, (_, frame) => `milky-forward-step-${frame}.webp`),
      ...Array.from({ length: 4 }, (_, frame) => `milky-trot-${frame}.webp`),
      'milky-prop-bowl.webp', 'milky-prop-ball.webp',
    ]);
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    f.controller.pet();
    assert.equal(f.button.dataset.pose, 'idle', 'without delivered attend art the greeting keeps the idle photo');
    assert.deepEqual(events, ['greet']);
    const origin = f.button.style.transform;
    f.advance(700);
    assert.equal(f.button.dataset.motion, 'walking');
    assert.equal(f.button.dataset.pose, 'side');
    assert.notEqual(f.button.style.transform, origin);
    f.document.hidden = true;
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.tasks.size, 0);
    assert.equal(f.button.dataset.pose, 'idle');
    assert.equal(f.button.disabled, true);
    const paused = f.button.style.transform;
    f.advance(10000);
    assert.equal(f.button.style.transform, paused);
    f.document.hidden = false;
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.button.disabled, false);
    assert.equal(f.tasks.size, 1, 'visibility restoration schedules a fresh rest rather than catching up');
    f.controller.destroy();
    assert.equal(f.tasks.size, 0);
    assert.equal(f.disconnected(), 2);
    assert.equal(f.button.removed, true);
    f.button.dispatchEvent(new Event('click'));
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

test('keyboard reversal pauses on the original face before mirroring, and displays all eight walking frames', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    f.key('ArrowRight');
    f.advance(150);
    assert.equal(f.button.dataset.frame, '4', 'the first step starts from the stance closest to the standing photo');
    f.advance(150);
    assert.equal(f.button.dataset.pose, 'side');
    const interrupted = f.button.style.transform;
    f.key('ArrowLeft');
    assert.equal(f.button.dataset.pose, 'idle');
    assert.equal(f.button.dataset.facing, 'right');
    assert.equal(f.button.style.transform, interrupted);
    f.advance(230);
    assert.equal(f.button.dataset.facing, 'right');
    f.advance(20);
    assert.equal(f.button.dataset.facing, 'left');
    assert.equal(f.button.dataset.pose, 'side');
    const frames = new Set<number>();
    for (let i = 0; i < 200; i++) {
      if (f.button.dataset.pose === 'side') frames.add(Number(f.button.dataset.frame));
      f.advance(16);
    }
    assert.equal(frames.size, 8, 'fore and hind limb poses all receive screen time');
    assert.equal(f.button.dataset.pose, 'idle');
    assert.equal(f.button.dataset.facing, 'left');
    assert.equal(f.tasks.size, 0, 'keyboard users keep a stationary focus target until blur');
  } finally { f.restore(); }
});

test('a walk that fits whole gait cycles ends back on the standing-like frame without a stop pop', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    let lastSideFrame = -1;
    for (let attempt = 0; attempt < 12 && lastSideFrame < 0; attempt++) {
      f.key('ArrowRight');
      f.key('ArrowLeft');
      let frame = -1;
      for (let i = 0; i < 400 && f.button.dataset.motion !== 'settling'; i++) {
        if (f.button.dataset.pose === 'side') frame = Number(f.button.dataset.frame);
        f.advance(16);
      }
      if (f.button.dataset.motion === 'settling') lastSideFrame = frame;
      f.advance(4000);
    }
    assert.ok(lastSideFrame >= 0, 'a walk completed');
    assert.ok(lastSideFrame === 4 || lastSideFrame === 3 || lastSideFrame === 5,
      `the final displayed frame ${lastSideFrame} stays adjacent to the standing stance`);
  } finally { f.restore(); }
});

test('up and down keys both move diagonally with a side-view gait instead of front-view moonwalking', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    const first = String(f.button.style.transform);
    f.key('ArrowDown');
    f.advance(600);
    assert.equal(f.button.dataset.pose, 'side');
    const afterDown = String(f.button.style.transform);
    assert.notEqual(afterDown, first);
    const xy = (transform: string) => transform.match(/translate3d\(([-.0-9]+)px, ([-.0-9]+)px/)!.slice(1).map(Number);
    assert.ok(xy(afterDown)[0] > xy(first)[0]);
    assert.ok(xy(afterDown)[1] > xy(first)[1]);
    f.key('ArrowUp');
    f.advance(600);
    assert.equal(f.button.dataset.pose, 'side');
    assert.ok(xy(String(f.button.style.transform))[1] < xy(afterDown)[1]);
  } finally { f.restore(); }
});

test('autonomous roaming waits 9–18 seconds, emits no events, and pauses for intro or keyboard focus', async () => {
  const f = fixture();
  try {
    f.intro(true);
    await f.loadAll();
    assert.equal(f.tasks.size, 0);
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    f.intro(false);
    assert.equal(f.tasks.size, 1);
    const pause = [...f.tasks.values()][0].at;
    assert.ok(pause >= 9000 && pause < 18000);
    const origin = f.button.style.transform;
    f.advance(8500);
    assert.equal(f.button.style.transform, origin);
    f.advance(pause - 8500 + 800);
    assert.equal(f.button.dataset.pose, 'side');
    assert.notEqual(f.button.style.transform, origin);
    assert.deepEqual(events, [], 'passive motion must not announce or reset the intro idle timer');
    f.button.focusVisible = true;
    f.button.dispatchEvent(new Event('focus'));
    assert.equal(f.tasks.size, 0);
    assert.equal(f.button.dataset.pose, 'idle');
    f.button.dispatchEvent(new Event('blur'));
    assert.equal(f.tasks.size, 1);
    f.intro(true);
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

test('reduced motion cancels every timer and never slides a static pose', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadPoses();
    f.media.matches = true;
    f.media.dispatchEvent(new Event('change'));
    const before = f.button.style.transform;
    f.controller.pet();
    f.key('ArrowRight');
    f.advance(60000);
    assert.equal(f.tasks.size, 0);
    assert.equal(f.button.style.transform, before);
    assert.equal(f.button.dataset.pose, 'idle', 'no walking, blinking or glancing under reduced motion');
  } finally { f.restore(); }
});

test('any v4 failure demotes to the complete verified v3 identity, never a mixed-face gait', async () => {
  const f = fixture();
  try {
    await f.load('milky-v4-idle.webp');
    f.asset('milky-v4-step-3.webp').dispatchEvent(new Event('error'));
    assert.ok(f.asset('milky-awake.webp'), 'the idle photo returns to the v3 original');
    for (let frame = 0; frame < 8; frame++) f.asset(`milky-v3-step-${frame}.webp`);
    assert.equal(f.document.images.filter((image) => image.src.includes('milky-v4-step')).length, 0, 'no v4 frame stays mixed into the gait');
    await f.loadV3();
    assert.equal(f.button.dataset.identity, 'v3');
    assert.equal(f.button.dataset.artwork, 'photo');
    await f.loadPoses();
    const origin = f.button.style.transform;
    f.controller.pet();
    f.advance(700);
    assert.equal(f.button.dataset.pose, 'side', 'the v3 set still walks after demotion');
    assert.notEqual(f.button.style.transform, origin);
    for (let i = 0; i < 600; i++) {
      assert.ok(!POSES.includes(f.button.dataset.pose as (typeof POSES)[number]), 'v4 micro-poses never appear on the v3 identity');
      f.advance(50);
    }
  } finally { f.restore(); }
});

test('v4 art is atomic: nothing is shown or enabled until the idle and all eight frames decode', async () => {
  const f = fixture();
  try {
    await f.load('milky-v4-idle.webp');
    assert.equal(f.button.hidden, true, 'a decoded v4 idle alone must not render');
    assert.equal(f.button.disabled, true);
    assert.equal(f.tasks.size, 0);
    for (let frame = 0; frame < 7; frame++) await f.load(`milky-v4-step-${frame}.webp`, 768, 512);
    assert.equal(f.button.hidden, true, 'seven decoded frames are still not the contracted set');
    assert.equal(f.button.dataset.active, 'false');
    f.controller.pet();
    assert.equal(f.tasks.size, 0);
    await f.load('milky-v4-step-7.webp', 768, 512);
    assert.equal(f.button.hidden, false);
    assert.equal(f.button.disabled, false);
    assert.equal(f.button.dataset.active, 'true');
    assert.equal(f.button.dataset.artwork, 'photo');
    assert.equal(f.button.dataset.identity, 'v4');
    assert.equal(f.tasks.size, 1, 'a rest is scheduled once the full set is decoded');
  } finally { f.restore(); }
});

test('a rejected idle decode and a missing v3 identity fall back to the alert artwork, then hide', async () => {
  const f = fixture();
  try {
    f.asset('milky-v4-idle.webp').decodeFails = true;
    await f.load('milky-v4-idle.webp');
    assert.ok(f.asset('milky-awake.webp'), 'a rejected v4 idle decode demotes like any failure');
    f.asset('milky-awake.webp').decodeFails = true;
    await f.load('milky-awake.webp');
    f.asset('maltese-alert.webp').decodeFails = false;
    await f.load('maltese-alert.webp');
    assert.equal(f.button.dataset.artwork, 'fallback');
    for (let frame = 0; frame < 8; frame++) await f.load(`milky-v3-step-${frame}.webp`, 768, 512);
    const before = f.button.style.transform;
    f.controller.pet();
    f.advance(30000);
    assert.equal(f.button.style.transform, before, 'the fallback portrait never borrows the photo gait');
    assert.equal(f.tasks.size, 0);
    f.asset('maltese-alert.webp').dispatchEvent(new Event('error'));
    assert.equal(f.button.hidden, true);
    assert.equal(f.button.disabled, true);
  } finally { f.restore(); }
});

test('malformed required v4 art demotes the whole tier like any load or decode failure', async () => {
  const f = fixture();
  try {
    await f.load('milky-v4-idle.webp');
    await f.load('milky-v4-step-0.webp', 3072, 1024);
    assert.ok(f.asset('milky-awake.webp'), 'a wrong-aspect required v4 frame falls back to the complete v3 set');
    assert.equal(f.document.images.filter((image) => image.src.includes('milky-v4-step')).length, 0);
    await f.loadV3();
    assert.equal(f.button.dataset.identity, 'v3');
    f.controller.pet();
    f.advance(700);
    assert.equal(f.button.dataset.pose, 'side', 'the verified v3 set walks after the malformed demotion');
  } finally { f.restore(); }
});

test('a wrong-ratio or undecodable v3 frame can never show a partial walk', async () => {
  const f = fixture();
  try {
    f.asset('milky-v4-idle.webp').dispatchEvent(new Event('error'));
    await f.load('milky-awake.webp');
    for (let frame = 0; frame < 7; frame++) await f.load(`milky-v3-step-${frame}.webp`, 768, 512);
    await f.load('milky-v3-step-7.webp', 3072, 1024);
    const before = f.button.style.transform;
    f.key('ArrowRight');
    f.advance(3000);
    assert.equal(f.button.style.transform, before, 'a wrong-ratio v3 frame keeps the gait disabled without demoting the idle');
    assert.equal(f.button.dataset.identity, 'v3');
    f.asset('milky-v3-step-7.webp').decodeFails = true;
    await f.load('milky-v3-step-7.webp', 768, 512);
    f.controller.pet();
    f.advance(20000);
    assert.equal(f.button.style.transform, before, 'an onload event alone is insufficient after decode failure');
    f.asset('milky-v3-step-7.webp').decodeFails = false;
    await f.load('milky-v3-step-7.webp', 768, 512);
    f.controller.pet();
    f.advance(500);
    assert.equal(f.button.dataset.pose, 'side');
    assert.notEqual(f.button.style.transform, before);
  } finally { f.restore(); }
});

test('a compatible rapid retarget carries momentum with no visible speed discontinuity', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    f.key('ArrowRight');
    f.advance(684);
    const x = () => Number(String(f.button.style.transform).match(/translate3d\(([-.0-9]+)px/)![1]);
    const beforeStart = x();
    f.advance(16);
    const speedBefore = x() - beforeStart;
    assert.ok(speedBefore > 0, 'cruising before the retarget');
    f.key('ArrowRight');
    const afterStart = x();
    f.advance(16);
    const speedAfter = x() - afterStart;
    assert.ok(speedAfter > 0, 'the continuation moves immediately');
    assert.ok(Math.abs(speedAfter - speedBefore) <= speedBefore * .05,
      `join speed ${speedAfter.toFixed(4)}px/frame stays continuous with ${speedBefore.toFixed(4)}px/frame`);
  } finally { f.restore(); }
});

test('only poses on the confirmed shipped list are requested, so omitted art causes no requests', async () => {
  const f = fixture(7829, null);
  try {
    await f.loadAll();
    assert.deepEqual(f.document.images.map((image) => image.src.split('/').at(-1)), [
      'milky-v4-idle.webp',
      ...Array.from({ length: 8 }, (_, frame) => `milky-v4-step-${frame}.webp`),
      'milky-v4-blink.webp',
      'milky-rest-sit.webp',
      'milky-rest-drowsy.webp',
      'milky-rest-sleep.webp',
      'milky-eat-low.webp', 'milky-eat-lift.webp', 'milky-play-bow.webp', 'milky-play-reach.webp',
      'milky-forward-idle.webp',
      ...Array.from({ length: 8 }, (_, frame) => `milky-forward-step-${frame}.webp`),
      ...Array.from({ length: 4 }, (_, frame) => `milky-trot-${frame}.webp`),
      'milky-prop-bowl.webp', 'milky-prop-ball.webp',
    ], 'unconfirmed attend/sniff/transitional files are never requested');
    for (const image of f.document.images) {
      assert.ok(readFileSync(new URL(`../public${image.src}`, import.meta.url)).length > 0, `shipped asset exists: ${image.src}`);
    }
    await f.load('milky-v4-blink.webp');
    f.controller.pet();
    assert.notEqual(f.button.dataset.pose, 'attend', 'greeting quietly skips the unshipped attend pose');
  } finally { f.restore(); }
});

test('turn-off cancels anticipation and late frame loading cannot restart movement', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    f.controller.pet();
    f.advance(100);
    f.controller.setActive(false);
    const before = f.button.style.transform;
    await f.load('milky-v4-step-0.webp', 768, 512);
    f.advance(20000);
    assert.equal(f.button.style.transform, before);
    assert.equal(f.tasks.size, 0);
    f.controller.setActive(true);
    assert.equal(f.button.dataset.pose, 'idle');
    assert.equal(f.button.disabled, false);
    assert.equal(f.tasks.size, 1);
  } finally { f.restore(); }
});

test('optional micro-poses blink and glance only during genuine rest, without moving or announcing', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadPoses();
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    const origin = f.button.style.transform;
    const seen = new Set<string>();
    let returned = false;
    for (let i = 0; i < 220 && f.button.dataset.motion === 'idle'; i++) {
      const pose = f.button.dataset.pose;
      if (POSES.includes(pose as (typeof POSES)[number])) {
        seen.add(pose);
        assert.equal(f.button.style.transform, origin, 'a blink or glance never moves the body');
      } else if (seen.size > 0 && pose === 'idle') returned = true;
      f.advance(40);
    }
    assert.ok(seen.size > 0, 'a micro-pose appeared during the first rest');
    assert.ok(returned, 'the pose returned to the idle photo');
    assert.deepEqual(events, [], 'micro-poses are quiet');
    f.advance(240000);
    assert.equal(f.tasks.size > 0, true, 'life continues across many rests');
  } finally { f.restore(); }
});

test('a delivered attend pose turns a greeting into a happy look up before stepping off', async () => {
  const f = fixture(4242);
  try {
    await f.loadAll();
    await f.loadPoses();
    let attended = false;
    for (let attempt = 0; attempt < 10 && !attended; attempt++) {
      while (f.button.dataset.motion !== 'idle') f.advance(200);
      const before = f.button.style.transform;
      f.controller.pet();
      if (f.button.dataset.pose === 'attend') {
        attended = true;
        assert.equal(f.button.dataset.motion, 'attending');
        assert.equal(f.button.style.transform, before, 'anticipation is a still pose, not a slide');
        f.advance(540);
        assert.equal(f.button.dataset.pose, 'side', 'the look up flows into the walk');
      } else {
        f.advance(8000);
      }
    }
    assert.ok(attended, 'a same-heading greeting shows the attend pose');
  } finally { f.restore(); }
});

test('quiet wanders sometimes sniff the floor first and remain unannounced', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadPoses();
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    let sniffed = false;
    let walked = false;
    for (let i = 0; i < 6000 && !(sniffed && walked); i++) {
      if (f.button.dataset.motion === 'sniffing') {
        sniffed = true;
        assert.equal(f.button.dataset.pose, 'sniff');
      }
      if (sniffed && f.button.dataset.motion === 'walking') walked = true;
      f.advance(50);
    }
    assert.ok(sniffed, 'an anticipatory sniff occurred before some wander');
    assert.ok(walked, 'the sniff flowed into a real walk');
    assert.deepEqual(events, [], 'autonomous behavior stays silent');
  } finally { f.restore(); }
});

test('a failed optional pose is skipped cleanly while blinking continues with the rest', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    f.asset('milky-v4-attend.webp').dispatchEvent(new Event('error'));
    f.asset('milky-v4-sniff.webp').dispatchEvent(new Event('error'));
    await f.load('milky-v4-blink.webp');
    let blinked = false;
    for (let i = 0; i < 2400; i++) {
      const pose = f.button.dataset.pose;
      assert.ok(pose !== 'attend' && pose !== 'sniff', 'failed poses never appear');
      if (pose === 'blink') blinked = true;
      f.advance(50);
    }
    assert.ok(blinked, 'blinking still runs alone');
    f.controller.pet();
    assert.notEqual(f.button.dataset.pose, 'attend', 'greeting quietly skips the missing attend art');
  } finally { f.restore(); }
});

test('the autonomous cycle sits, lies and naps in place between walks, silently and without sliding', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadRest();
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    const seen = new Set<string>();
    let restTransform: unknown;
    let walkedAfterRest = false;
    for (let i = 0; i < 900 && !(seen.has('sit') && seen.has('sleep') && walkedAfterRest); i++) {
      const pose = f.button.dataset.pose ?? '';
      if (RESTS.includes(pose as (typeof RESTS)[number])) {
        seen.add(pose);
        restTransform ??= f.button.style.transform;
        assert.equal(f.button.style.transform, restTransform, 'resting never slides the dog');
        assert.notEqual(f.button.dataset.motion, 'walking');
      } else {
        if (seen.size > 0 && f.button.dataset.motion === 'walking') walkedAfterRest = true;
        if (f.button.dataset.motion === 'idle') restTransform = undefined;
      }
      f.advance(400);
    }
    assert.ok(seen.has('sit'), 'sitting appears naturally');
    assert.ok(seen.has('sleep'), 'napping appears naturally');
    assert.ok(walkedAfterRest, 'walking resumes after rest');
    assert.deepEqual(events, [], 'autonomous rest announces nothing');
  } finally { f.restore(); }
});

test('a sleeping Milky wakes gently and stands before any walk, never dragging the nap pose', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadRest();
    f.controller.sleep();
    f.advance(4000);
    assert.equal(f.button.dataset.pose, 'sleep');
    assert.equal(f.button.dataset.motion, 'sleeping');
    const resting = f.button.style.transform;
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    f.controller.pet();
    assert.deepEqual(events, ['greet']);
    assert.equal(f.button.dataset.pose, 'wake', 'waking starts from the delivered wake pose');
    assert.equal(f.button.style.transform, resting);
    let sawStanding = false;
    for (let i = 0; i < 400 && String(f.button.dataset.motion) !== 'walking'; i++) {
      assert.equal(f.button.style.transform, resting, 'no movement before standing and walking');
      assert.notEqual(f.button.dataset.pose, 'side', 'no gait frames while waking');
      if (f.button.dataset.pose === 'idle') sawStanding = true;
      f.advance(16);
    }
    assert.equal(f.button.dataset.motion, 'walking');
    assert.ok(sawStanding, 'standing is restored before the walk');
    assert.notEqual(f.button.dataset.pose, 'sleep');
  } finally { f.restore(); }
});

test('S and N toggle sitting and napping coherently, and rapid commands keep one clean action', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadRest();
    f.key('s');
    f.advance(600);
    assert.equal(f.button.dataset.pose, 'sit');
    assert.equal(f.button.dataset.motion, 'resting');
    f.key('s');
    f.advance(900);
    assert.equal(f.button.dataset.pose, 'idle');
    assert.equal(f.button.dataset.motion, 'idle');
    f.key('n');
    f.advance(4000);
    assert.equal(f.button.dataset.pose, 'sleep');
    f.key('n');
    f.advance(1500);
    assert.equal(f.button.dataset.pose, 'idle');
    const keys = ['s', 'n', 'ArrowRight', 's', 'n'];
    for (let i = 0; i < 40; i++) {
      f.key(keys[i % keys.length]);
      f.advance(10);
      assert.ok(f.tasks.size <= 1, 'rapid commands never stack timers or frames');
    }
    f.advance(90000);
    assert.equal(f.button.dataset.motion, 'idle');
    assert.equal(f.tasks.size, 0, 'keyboard focus holds a quiet standing dog');
  } finally { f.restore(); }
});

test('reduced motion allows explicit still posture changes with no timers or roaming', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadRest();
    f.media.matches = true;
    f.media.dispatchEvent(new Event('change'));
    const before = f.button.style.transform;
    f.key('s');
    assert.equal(f.button.dataset.pose, 'sit');
    assert.equal(f.tasks.size, 0);
    f.key('n');
    assert.equal(f.button.dataset.pose, 'sleep');
    assert.equal(f.tasks.size, 0);
    f.key('ArrowRight');
    assert.equal(f.button.dataset.pose, 'idle', 'activation restores standing without animation');
    f.advance(30000);
    assert.equal(f.tasks.size, 0);
    assert.equal(f.button.style.transform, before, 'no movement under reduced motion');
  } finally { f.restore(); }
});

test('missing or failed rest art is omitted gracefully while the v4 walk keeps working', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    f.controller.sit();
    f.controller.sleep();
    assert.equal(f.button.dataset.pose, 'idle', 'undelivered rest art makes rest requests a quiet no-op');
    f.asset('milky-rest-sleep.webp').dispatchEvent(new Event('error'));
    await f.loadRest(['sit', 'drowsy']);
    f.controller.sleep();
    f.advance(3000);
    assert.equal(f.button.dataset.pose, 'drowsy', 'a failed sleep asset falls back to the deepest delivered pose');
    for (let i = 0; i < 400; i++) { assert.notEqual(f.button.dataset.pose, 'sleep'); f.advance(50); }
    f.controller.pet();
    let walked = false;
    for (let i = 0; i < 200 && !walked; i++) {
      if (f.button.dataset.motion === 'walking') walked = true;
      f.advance(16);
    }
    assert.ok(walked, 'the v4 walk still works');
  } finally { f.restore(); }
});

test('hidden tabs cancel naps, and a demoted v3 identity never shows the v4 rest art', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadRest();
    f.controller.sleep();
    f.advance(4000);
    assert.equal(f.button.dataset.pose, 'sleep');
    f.document.hidden = true;
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.tasks.size, 0);
    assert.equal(f.button.dataset.pose, 'idle');
    f.document.hidden = false;
    f.document.dispatchEvent(new Event('visibilitychange'));
    f.asset('milky-v4-step-2.webp').dispatchEvent(new Event('error'));
    await f.loadV3();
    f.controller.sit();
    f.controller.sleep();
    assert.equal(f.button.dataset.pose, 'idle', 'v4 rest poses stay disabled on the v3 identity');
    for (let i = 0; i < 600; i++) {
      assert.ok(!RESTS.includes((f.button.dataset.pose ?? '') as (typeof RESTS)[number]));
      f.advance(50);
    }
  } finally { f.restore(); }
});

test('feeding walks Milky to a stable bowl, works through bites and clears the bowl at rest', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadActivity();
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    f.controller.feed();
    assert.deepEqual(events, ['feed'], 'an explicit command announces its accurate action');
    const bowl = f.propEl('bowl');
    assert.equal(bowl.dataset.visible, 'true');
    const bowlSpot = bowl.style.transform;
    const seen = new Set<string>();
    let walked = false;
    let eatX: number | undefined;
    let steppedAwayWithBowl = false;
    const petX = () => Number(String(f.button.style.transform).match(/translate3d\(([-.0-9]+)px/)![1]);
    for (let i = 0; i < 1500 && f.button.dataset.motion !== 'idle'; i++) {
      if (f.button.dataset.motion === 'walking') walked = true;
      const pose = f.button.dataset.pose ?? '';
      if (pose === 'eat-low' || pose === 'eat-lift') {
        seen.add(pose);
        eatX = petX();
        assert.equal(bowl.style.transform, bowlSpot, 'the bowl never slides while Milky eats');
        assert.equal(f.button.dataset.motion, 'eating');
      } else if (seen.has('eat-lift') && f.button.dataset.motion === 'walking' && bowl.dataset.visible === 'true') {
        steppedAwayWithBowl = true;
      }
      f.advance(16);
    }
    assert.ok(walked, 'Milky approaches the bowl on foot');
    assert.ok(seen.has('eat-low') && seen.has('eat-lift'), 'bites alternate through both eat poses');
    assert.ok(steppedAwayWithBowl, 'after eating she stands and steps away while the bowl is still there');
    assert.ok(eatX !== undefined && Math.abs(petX() - eatX) > 30, 'the step away genuinely clears the bowl');
    assert.equal(f.button.dataset.motion, 'idle');
    assert.equal(bowl.dataset.visible, 'false', 'the bowl leaves only after clearance');
    assert.deepEqual(events, ['feed']);
  } finally { f.restore(); }
});

test('play really rolls the ball: bow, nudge, a moving grounded ball inside the floor, a chase', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadActivity();
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    f.controller.play();
    assert.deepEqual(events, ['play']);
    const ball = f.propEl('ball');
    assert.equal(ball.dataset.visible, 'true');
    const positions = new Set<string>();
    const seen = new Set<string>();
    let chased = false;
    const x = (transform: unknown) => Number(String(transform).match(/translate3d\(([-.0-9]+)px/)![1]);
    for (let i = 0; i < 2500 && f.button.dataset.motion !== 'idle'; i++) {
      const pose = f.button.dataset.pose ?? '';
      if (pose === 'play-bow' || pose === 'play-reach') seen.add(pose);
      positions.add(String(ball.style.transform));
      const ballX = x(ball.style.transform) / 1672;
      assert.ok(ballX >= .39 && ballX <= .755, `ball stays on the visible floor (${ballX.toFixed(3)})`);
      if (seen.has('play-reach') && f.button.dataset.motion === 'walking') chased = true;
      f.advance(16);
    }
    assert.ok(seen.has('play-bow') && seen.has('play-reach'), 'Milky bows and reaches at the ball');
    assert.ok(positions.size > 10, 'the ball genuinely travels instead of teleporting');
    assert.ok(chased, 'Milky trots after the nudged ball');
    assert.equal(ball.dataset.visible, 'false', 'the ball is put away at rest');
  } finally { f.restore(); }
});

test('run announces itself and trots briskly: clearly faster than an ordinary walk, then settles', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    const x = () => Number(String(f.button.style.transform).match(/translate3d\(([-.0-9]+)px/)![1]);
    f.key('ArrowRight');
    f.advance(500);
    const walkA = x();
    f.advance(16);
    const walkSpeed = Math.abs(x() - walkA);
    f.advance(10000);
    f.button.dispatchEvent(new Event('blur'));
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    f.controller.run();
    assert.deepEqual(events, ['run']);
    let fastest = 0;
    let previous = x();
    for (let i = 0; i < 900 && f.button.dataset.motion !== 'idle'; i++) {
      f.advance(16);
      const current = x();
      fastest = Math.max(fastest, Math.abs(current - previous));
      previous = current;
    }
    assert.ok(fastest > walkSpeed * 1.2, `trot ${fastest.toFixed(2)}px/frame vs walk ${walkSpeed.toFixed(2)}px/frame`);
    assert.equal(f.button.dataset.motion, 'idle');
  } finally { f.restore(); }
});

test('interrupting a session stays coherent: a greeting mid-play wakes, walks and clears the toy', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadActivity();
    await f.loadRest();
    f.controller.play();
    f.advance(900);
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    f.controller.pet();
    assert.deepEqual(events, ['greet']);
    for (let i = 0; i < 800 && f.button.dataset.motion !== 'idle'; i++) {
      assert.ok(f.tasks.size <= 1, 'one action at a time');
      f.advance(16);
    }
    assert.equal(f.button.dataset.motion, 'idle');
    assert.equal(f.propEl('ball').dataset.visible, 'false', 'the interrupted toy is cleaned up');
    f.controller.feed();
    f.controller.play();
    f.controller.run();
    f.controller.sit();
    f.advance(1200);
    assert.ok(['resting', 'sleeping'].includes(f.button.dataset.motion ?? ''), 'rapid commands collapse to the last intent');
    assert.equal(f.propEl('bowl').dataset.visible, 'false');
  } finally { f.restore(); }
});

test('reduced motion keeps activities as still explicit poses with static props and no timers', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadActivity();
    f.media.matches = true;
    f.media.dispatchEvent(new Event('change'));
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    f.controller.feed();
    assert.equal(f.button.dataset.pose, 'eat-low');
    assert.equal(f.propEl('bowl').dataset.visible, 'true');
    assert.equal(f.tasks.size, 0);
    f.controller.play();
    assert.equal(f.button.dataset.pose, 'play-bow');
    const ballSpot = f.propEl('ball').style.transform;
    f.advance(20000);
    assert.equal(f.propEl('ball').style.transform, ballSpot, 'a reduced-motion ball never moves');
    assert.equal(f.tasks.size, 0);
    f.controller.run();
    assert.deepEqual(events, ['feed', 'play'], 'run is an honest no-op without motion');
  } finally { f.restore(); }
});

test('missing activity art quietly disables feeding and play while walking and rest survive', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadRest();
    const events: string[] = [];
    f.host.addEventListener('cyber:pet', (event) => events.push((event as CustomEvent).detail.kind));
    f.controller.feed();
    f.controller.play();
    assert.deepEqual(events, [], 'undelivered art means no announcement and no action');
    assert.equal(f.button.dataset.pose, 'idle');
    f.controller.sit();
    f.advance(600);
    assert.equal(f.button.dataset.pose, 'sit', 'rest still works');
    f.controller.pet();
    let walked = false;
    for (let i = 0; i < 400 && !walked; i++) {
      if (f.button.dataset.motion === 'walking') walked = true;
      f.advance(16);
    }
    assert.ok(walked, 'the walk still works');
  } finally { f.restore(); }
});

test('the forward-look set is atomic: forward frames walk, the camera face stays for greeting', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadPoses();
    await f.loadForward();
    f.key('ArrowRight');
    f.advance(400);
    assert.equal(f.button.dataset.pose, 'side');
    const visible = f.document.images.find((image) => image.dataset.visible === 'true' && image.dataset.set);
    assert.equal(visible?.dataset.set, 'forward', 'walking uses the forward-look frames');
    f.advance(5000);
    f.button.dispatchEvent(new Event('blur'));
    let sawForward = false;
    for (let i = 0; i < 40 && !sawForward; i++) {
      if (f.button.dataset.gaze === 'forward') sawForward = true;
      else { f.controller.pet(); f.advance(6000); }
    }
    assert.ok(sawForward, 'quiet idle favors the forward gaze');
    for (let i = 0; i < 80 && f.button.dataset.motion === 'idle' && f.button.dataset.gaze === 'forward'; i++) {
      assert.equal(f.button.dataset.pose, 'idle', 'no camera-face blink lands on a forward gaze');
      f.advance(100);
    }
    f.controller.pet();
    assert.equal(f.button.dataset.gaze, 'camera', 'a greeting looks up at the camera again');
  } finally { f.restore(); }
});

test('a broken forward file disables the whole forward set without touching the v4 gait', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.load('milky-forward-idle.webp');
    for (let frame = 0; frame < 7; frame++) await f.load(`milky-forward-step-${frame}.webp`, 768, 512);
    f.asset('milky-forward-step-7.webp').dispatchEvent(new Event('error'));
    f.key('ArrowRight');
    f.advance(400);
    assert.equal(f.button.dataset.pose, 'side');
    const visible = f.document.images.find((image) => image.dataset.visible === 'true' && image.dataset.set);
    assert.equal(visible?.dataset.set, 'profile', 'an incomplete forward set never mixes into the walk');
    f.advance(5000);
    assert.notEqual(f.button.dataset.gaze, 'forward', 'the idle gaze never uses a broken set');
  } finally { f.restore(); }
});

test('hiding the tab or destroying mid-play cancels every frame, timer and prop', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadActivity();
    f.controller.play();
    f.advance(1200);
    f.document.hidden = true;
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.tasks.size, 0);
    assert.equal(f.propEl('ball').dataset.visible, 'false');
    assert.equal(f.button.dataset.pose, 'idle');
    f.document.hidden = false;
    f.document.dispatchEvent(new Event('visibilitychange'));
    f.controller.feed();
    f.advance(600);
    f.controller.destroy();
    assert.equal(f.tasks.size, 0);
    assert.equal(f.propsLayer().removed, true, 'the prop layer is removed with the pet');
  } finally { f.restore(); }
});

test('the atomic trot tier serves only brisk legs while ordinary walks keep all eight frames', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadTrot();
    const registration = JSON.parse(readFileSync(new URL('../docs/milky-trot-registration.json', import.meta.url), 'utf8'));
    const frameY = f.asset('milky-trot-0.webp').style['--milky-frame-y'];
    const scale = Number(f.asset('milky-trot-0.webp').style['--milky-art-scale']);
    const mappedFloor = registration.observed_common_contact_floor_y / 512 + parseFloat(String(frameY)) / scale / 100;
    assert.ok(Math.abs(mappedFloor - .94) < .00001, 'the measured common contact floor maps to the foot anchor');
    for (let frame = 0; frame < 4; frame++) {
      assert.equal(f.asset(`milky-trot-${frame}.webp`).style['--milky-frame-y'], frameY, 'one common translation preserves airborne clearance');
    }
    f.key('ArrowRight');
    f.advance(400);
    let visible = f.document.images.find((image) => image.dataset.visible === 'true' && image.dataset.set);
    assert.equal(visible?.dataset.set, 'profile', 'an ordinary walk never borrows trot frames');
    f.advance(5000);
    f.button.dispatchEvent(new Event('blur'));
    f.controller.run();
    const trotFrames = new Set<number>();
    let sawTrot = false;
    for (let i = 0; i < 900 && f.button.dataset.motion !== 'idle'; i++) {
      visible = f.document.images.find((image) => image.dataset.visible === 'true' && image.dataset.set);
      if (f.button.dataset.motion === 'walking') {
        assert.equal(visible?.dataset.set, 'trot', 'brisk legs use the diagonal-pair trot');
        sawTrot = true;
        trotFrames.add(Number(f.button.dataset.frame));
      }
      f.advance(16);
    }
    assert.ok(sawTrot);
    assert.ok([...trotFrames].every((frame) => frame >= 0 && frame < 4), 'the trot cycle has four frames');
    assert.ok(trotFrames.size >= 3, 'the trot cycle actually advances by distance');
  } finally { f.restore(); }
});

test('an in-flight or failed trot set falls back to the honest fast walk with the tier fixed per leg', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadTrot(3);
    f.controller.run();
    f.advance(400);
    assert.equal(f.button.dataset.motion, 'walking');
    let visible = f.document.images.find((image) => image.dataset.visible === 'true' && image.dataset.set);
    assert.equal(visible?.dataset.set, 'profile', 'three of four decoded frames are not a trot');
    await f.load('milky-trot-3.webp', 768, 512);
    for (let i = 0; i < 60 && String(f.button.dataset.motion) === 'walking'; i++) {
      visible = f.document.images.find((image) => image.dataset.visible === 'true' && image.dataset.set);
      assert.equal(visible?.dataset.set, 'profile', 'a late fourth frame never switches a running leg');
      f.advance(16);
    }
    f.advance(120000);
    f.button.dispatchEvent(new Event('blur'));
    f.controller.run();
    let sawTrot = false;
    for (let i = 0; i < 900 && String(f.button.dataset.motion) !== 'idle'; i++) {
      visible = f.document.images.find((image) => image.dataset.visible === 'true' && image.dataset.set);
      if (String(f.button.dataset.motion) === 'walking' && visible?.dataset.set === 'trot') sawTrot = true;
      f.advance(16);
    }
    assert.ok(sawTrot, 'the next brisk leg after the full decode may trot');
    const g = fixture(991);
    try {
      await g.loadAll();
      g.asset('milky-trot-2.webp').dispatchEvent(new Event('error'));
      await g.loadTrot();
      g.controller.run();
      for (let i = 0; i < 900 && g.button.dataset.motion !== 'idle'; i++) {
        const shown = g.document.images.find((image) => image.dataset.visible === 'true' && image.dataset.set);
        assert.notEqual(shown?.dataset.set, 'trot', 'a failed file disables the whole trot tier');
        g.advance(16);
      }
    } finally { g.restore(); }
  } finally { f.restore(); }
});

test('the bowl paints beneath the lowered face and every nudge happens at true paw contact', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    await f.loadActivity();
    const css = readFileSync(new URL('./cyber-pet.css', import.meta.url), 'utf8');
    assert.match(css, /\.cyber-pet-button\s*\{[^}]*z-index:\s*1/, 'the dog paints above her props');
    assert.match(css, /\.cyber-pet-props\s*\{[^}]*z-index:\s*0/,
      'props render beneath the dog so an opaque bowl cannot cover the eyes or muzzle');
    f.controller.play();
    const ball = f.propEl('ball');
    const part = (transform: unknown, index: number) => Number(String(transform).match(/translate3d\(([-.0-9]+)px, ([-.0-9]+)px/)![index]);
    let prevPose = '';
    let contacts = 0;
    for (let i = 0; i < 3000 && f.button.dataset.motion !== 'idle'; i++) {
      const pose = f.button.dataset.pose ?? '';
      if (pose === 'play-reach' && prevPose !== 'play-reach') {
        contacts++;
        const gap = Math.abs(part(ball.style.transform, 1) - part(f.button.style.transform, 1));
        const yFraction = part(ball.style.transform, 2) / 941;
        const depth = .91 + Math.max(0, Math.min(1, (yFraction - .83) / .125)) * .09;
        const reach = .14 * .847 * (716.5 / 1536) * depth * 1672;
        assert.ok(Math.abs(gap - reach) <= 12,
          `nudge ${contacts} happens at the paw (gap ${gap.toFixed(1)}px vs reach ${reach.toFixed(1)}px)`);
      }
      prevPose = pose;
      f.advance(16);
    }
    assert.ok(contacts >= 1, 'a verified contact nudge occurred');
    assert.equal(f.button.dataset.motion, 'idle');
  } finally { f.restore(); }
});
