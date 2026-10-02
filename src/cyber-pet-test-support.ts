import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { setImmediate as flushMicrotasks } from 'node:timers/promises';
// Run the real controller in a deliberately small DOM/clock harness. CSS is browser-owned.
const source = readFileSync(new URL('./cyber-pet.ts', import.meta.url), 'utf8')
  .replace("import './cyber-pet.css';", '')
  .replace("import './cyber-pet-grounded.css';", '')
  .replace("'./cyber-pet-geometry'", JSON.stringify(new URL('./cyber-pet-geometry.ts', import.meta.url).href))
  .replace("'./cyber-pet-motion'", JSON.stringify(new URL('./cyber-pet-motion.ts', import.meta.url).href))
  .replace("'./cyber-pet-roam'", JSON.stringify(new URL('./cyber-pet-roam.ts', import.meta.url).href))
  .replace("'./cyber-pet-life'", JSON.stringify(new URL('./cyber-pet-life.ts', import.meta.url).href))
  .replace("'./cyber-pet-rest'", JSON.stringify(new URL('./cyber-pet-rest.ts', import.meta.url).href))
  .replace("'./cyber-pet-activity'", JSON.stringify(new URL('./cyber-pet-activity.ts', import.meta.url).href))
  .replace("'./cyber-pet-bed'", JSON.stringify(new URL('./cyber-pet-bed.ts', import.meta.url).href))
  .replace("'./cyber-pet-toy'", JSON.stringify(new URL('./cyber-pet-toy.ts', import.meta.url).href))
  .replace("'./cyber-pet-drag'", JSON.stringify(new URL('./cyber-pet-drag.ts', import.meta.url).href))
  .replace("'./cyber-pet-throw'", JSON.stringify(new URL('./cyber-pet-throw.ts', import.meta.url).href))
  .replace("'./cyber-pet-transitions'", JSON.stringify(new URL('./cyber-pet-transitions.ts', import.meta.url).href))
  .replace("'./cyber-pet-hop'", JSON.stringify(new URL('./cyber-pet-hop.ts', import.meta.url).href))
  .replaceAll("'./cyber-pet-grounded-walk.ts'", JSON.stringify(new URL('./cyber-pet-grounded-walk.ts', import.meta.url).href))
  .replaceAll("'./cyber-pet-grounded-walk'", JSON.stringify(new URL('./cyber-pet-grounded-walk.ts', import.meta.url).href))
  .replaceAll("'./cyber-pet-natural-walk'", JSON.stringify(new URL('./cyber-pet-natural-walk.ts', import.meta.url).href))
  .replaceAll("'./cyber-pet-grounded-geometry'", JSON.stringify(new URL('./cyber-pet-grounded-geometry.ts', import.meta.url).href))
  .replaceAll("'./cyber-pet-authored-controller'", JSON.stringify(new URL('./cyber-pet-authored-controller.ts', import.meta.url).href))
  .replaceAll("'./cyber-pet-photo'", JSON.stringify(new URL('./cyber-pet-photo.ts', import.meta.url).href));
const { mountCyberPet, MILKY_PHOTO_REST } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`) as typeof import('./cyber-pet');
export { MILKY_PHOTO_REST };

type Task = { at: number; callback: () => void; kind: 'timer' | 'frame' };
const rect = { left: 0, top: 0, width: 1672, height: 941 };
export const POSES = ['blink', 'attend', 'sniff'] as const;
export const RESTS = ['sit', 'drowsy', 'sleep', 'sitdown', 'wake'] as const;

// Tests mount with every optional pose enabled to exercise the full behavior; production
// defaults request only what root confirmed shipped (MILKY_SHIPPED_POSES/_REST).
export function fixture(seed = 7829, shipped: readonly string[] | null = POSES, shippedRest: readonly string[] = RESTS, shippedTrot = true, floorBounds?: Parameters<typeof mountCyberPet>[7], bedAnchor?: Readonly<{ x: number; y: number }>, toyOptions?: Parameters<typeof mountCyberPet>[9], photoOptions?: Parameters<typeof mountCyberPet>[10]) {
  let now = 0;
  let nextId = 1;
  const tasks = new Map<number, Task>();
  const painting = { draws: 0, clears: 0 };
  const context = {
    globalAlpha: 1,
    clearRect() { painting.clears++; }, drawImage() { painting.draws++; },
    resetTransform() {}, scale() {}, save() {}, restore() {}, beginPath() {},
    moveTo() {}, lineTo() {}, closePath() {}, clip() {}, transform() {},
    getTransform: () => ({ a: 1 }),
  };
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
    tagName = '';
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
    bounds = { ...rect };
    matches() { return this.focusVisible; }
    naturalWidth = 1536;
    naturalHeight = 1024;
    append(...children: Element[]) { this.children.push(...children); }
    setAttribute(key: string, value: string) { this.attributes[key] = value; }
    removeAttribute(key: string) { delete this.attributes[key]; if (key === 'src') this.src = ''; }
    getContext() { return this.tagName === 'CANVAS' ? context : null; }
    getBoundingClientRect() { return this.bounds; }
    closest(selector: string) { return selector === '.night-studio' ? studio : scene; }
    decodeFails = false;
    capturedPointer: number | undefined;
    setPointerCapture(id: number) { this.capturedPointer = id; }
    hasPointerCapture(id: number) { return this.capturedPointer === id; }
    releasePointerCapture(id: number) { if (this.capturedPointer === id) this.capturedPointer = undefined; }
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
      element.tagName = tag.toUpperCase();
      element.ownerDocument = this;
      if (tag === 'img') this.images.push(element);
      return element;
    }
  }
  const document = new DocumentFake();
  const decoderImages: Element[] = [];
  class DecoderImage extends Element {
    readonly decoded = new Promise<void>((resolve, reject) => {
      this.addEventListener('load', () => this.decodeFails ? reject(new Error('decode failed')) : resolve(), { once: true });
      this.addEventListener('error', () => reject(new Error('decode failed')), { once: true });
    });
    constructor() { super(); this.ownerDocument = document; this.tagName = 'IMG'; document.images.push(this); decoderImages.push(this); }
    decode() { return this.decoded; }
  }
  const previousImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: DecoderImage });
  const previousFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  type AuthoredRequest = {
    url: string; signal: AbortSignal | null | undefined; settled: boolean;
    respond: (status: number, bytes?: ArrayBuffer) => void; fail: (error: Error) => void;
  };
  const authoredRequests: AuthoredRequest[] = [];
  Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    assert.ok(['/assets/cyberpunk/milky-authored/canine-clips.glb', '/assets/cyberpunk/milky-natural-motion/walk-cycle.json'].includes(url), 'fixture never makes an unexpected network request');
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    return new Promise<Response>((resolve, reject) => {
      const settle = (action: () => void) => {
        if (request.settled) return;
        request.settled = true;
        signal?.removeEventListener('abort', abort);
        action();
      };
      const abort = () => settle(() => reject(signal?.reason ?? new DOMException('Aborted', 'AbortError')));
      const request: AuthoredRequest = {
        url, signal, settled: false,
        respond: (status, bytes) => settle(() => {
          const file = bytes ?? (() => {
            const data = readFileSync(new URL(`../public${url}`, import.meta.url));
            return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
          })();
          resolve(new Response(file, { status, headers: { 'Content-Type': 'model/gltf-binary' } }));
        }),
        fail: error => settle(() => reject(error)),
      };
      authoredRequests.push(request);
      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, { once: true });
    });
  } });
  const host = document.createElement('div');
  const scene = document.createElement('div');
  const studio = document.createElement('main');
  const bed = document.createElement('button');
  bed.bounds = { left: 1310, top: 788, width: 260, height: 142 };
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
    ? mountCyberPet(host as unknown as HTMLElement, shipped as never, shippedRest as never, undefined, undefined, shippedTrot, undefined, floorBounds, bedAnchor ? { element: bed as unknown as HTMLElement, anchor: bedAnchor } : undefined, toyOptions, photoOptions)
    : mountCyberPet(host as unknown as HTMLElement);
  // The props layer paints beneath the pet button so the lowered face eats over the bowl.
  const button = host.children.find((child) => child.className === 'cyber-pet-button')!;
  const asset = (name: string) => {
    const image = [...document.images].reverse().find((item) => item.src.endsWith(name));
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
  const loadAuthored = async (status = 200, bytes?: ArrayBuffer) => {
    await flushMicrotasks();
    const request = [...authoredRequests].reverse().find(request => !request.settled);
    assert.ok(request, 'authored clip request is pending');
    request.respond(status, bytes);
    await flushMicrotasks();
  };
  const failAuthored = async () => {
    await flushMicrotasks();
    const request = [...authoredRequests].reverse().find(request => !request.settled);
    assert.ok(request, 'authored clip request is pending');
    request.fail(new TypeError('Network request failed'));
    await flushMicrotasks();
  };
  const loadGrounded = async () => {
    await flushMicrotasks();
    await load('milky-grounded-walk/torso.webp');
    await load('milky-grounded-walk/foreleg.webp');
    await flushMicrotasks();
    await load('milky-grounded-walk/hindleg.webp');
    await flushMicrotasks();
    if (authoredRequests.some(request => !request.settled)) await loadAuthored();
  };
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
    if (previousImage) Object.defineProperty(globalThis, 'Image', previousImage);
    else Reflect.deleteProperty(globalThis, 'Image');
    for (const request of authoredRequests) if (!request.settled) request.fail(new DOMException('Fixture restored', 'AbortError'));
    if (previousFetch) Object.defineProperty(globalThis, 'fetch', previousFetch);
    else Reflect.deleteProperty(globalThis, 'fetch');
  }
  const intro = (visible: boolean) => { studio.dataset.intro = visible ? 'visible' : 'hidden'; observed.filter((o) => o.mutation).forEach((o) => o.callback()); };
  const resize = () => observed.filter((entry) => !entry.mutation).forEach((entry) => entry.callback());
  return { controller, button, document, media, tasks, host, scene, bed, resize, asset, load, loadAll, loadV3, loadPoses, loadRest, loadActivity, loadForward, loadTrot, loadGrounded, loadAuthored, failAuthored, authoredRequests, decoderImages, painting, flushMicrotasks, propEl, propsLayer, advance, key, intro, restore, disconnected: () => observersDisconnected };
}
