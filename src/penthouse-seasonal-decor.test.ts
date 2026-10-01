import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import type { ClimateState, Season } from './cyber-climate.ts';
import { mountSeasonalDecor } from './penthouse-seasonal-decor.ts';

const state = (season: Season, time: ClimateState['time'] = 'noon'): ClimateState => ({ season, time, weather: 'clear', auto: false });
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
const sources = (season: Season) => [`/assets/penthouse/seasonal-accents/${season}-vignette.webp`];

function setup(t: TestContext) {
  class ImageFixture {
    src = ''; alt = ''; className = ''; draggable = true; decoding = '';
    resolve: () => void = () => {};
    reject: (error: Error) => void = () => {};
    readonly promise = new Promise<void>((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
    constructor() { images.push(this); }
    decode() { return this.promise; }
    removeAttribute(name: string) { if (name === 'src') this.src = ''; }
  }
  class ElementFixture {
    className = ''; removed = false;
    readonly dataset: Record<string, string> = {};
    readonly attributes = new Map<string, string>();
    readonly children: ElementFixture[] = [];
    readonly shown: string[][] = [];
    setAttribute(name: string, value: string) { this.attributes.set(name, value); }
    append(child: ElementFixture) { this.children.push(child); }
    replaceChildren(...children: ImageFixture[]) { this.shown.push(children.map(image => image.src)); }
    remove() { this.removed = true; }
  }
  const images: ImageFixture[] = [];
  const elements: ElementFixture[] = [];
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const install = (key: string, value: unknown) => {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  install('Image', ImageFixture);
  install('document', { createElement() { const element = new ElementFixture(); elements.push(element); return element; } });
  const decor = mountSeasonalDecor(document.createElement('div'));
  t.after(() => {
    decor.destroy();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  return { decor, images, elements, layer: () => elements[1], async load(season: Season) {
    decor.update(state(season));
    for (const image of images) image.resolve();
    await flush();
  } };
}

test('decor stays empty until the current-season vignette has decoded', async t => {
  const f = setup(t);
  f.decor.update(state('spring'));
  assert.deepEqual(f.images.map(image => image.src), sources('spring'));
  assert.deepEqual(f.layer().shown, []);
  f.images[0].resolve(); await flush();
  assert.deepEqual(f.layer().shown, [sources('spring')]);
  assert.equal(f.layer().attributes.get('aria-hidden'), 'true');
  assert.ok(f.images.every(image => image.alt === '' && !image.draggable));
});

test('changing time in the same season does not reload the vignette', async t => {
  const f = setup(t); await f.load('summer');
  f.decor.update(state('summer', 'night'));
  assert.equal(f.images.length, 1);
  assert.deepEqual(f.layer().shown, [sources('summer')]);
});

test('a late season decode cannot replace a newer fully decoded vignette', async t => {
  const f = setup(t); f.decor.update(state('spring')); f.decor.update(state('winter'));
  f.images[1].resolve(); await flush();
  f.images[0].resolve(); await flush();
  assert.deepEqual(f.layer().shown, [sources('winter')]);
  assert.equal(f.images[0].src, '');
});

test('returning to the displayed season cancels the replacement without reloading', async t => {
  const f = setup(t); await f.load('autumn');
  f.decor.update(state('winter')); f.decor.update(state('autumn'));
  f.images[1].resolve(); await flush();
  assert.deepEqual(f.layer().shown, [sources('autumn')]);
  assert.equal(f.images.length, 2);
  assert.equal(f.images[1].src, '');
});

test('a failed vignette preserves the last decoration and permits retry', async t => {
  const f = setup(t); await f.load('autumn');
  f.decor.update(state('winter'));
  f.images[1].reject(new DOMException('Image failed to decode', 'EncodingError')); await flush();
  assert.deepEqual(f.layer().shown, [sources('autumn')]);
  assert.equal(f.images[1].src, '');
  await f.load('winter');
  assert.deepEqual(f.layer().shown, [sources('autumn'), sources('winter')]);
});

test('destroy clears pending images and prevents late swaps or new loads', async t => {
  const f = setup(t); f.decor.update(state('spring'));
  f.decor.destroy(); f.decor.update(state('winter'));
  f.images.forEach(image => image.resolve()); await flush();
  assert.ok(f.images.every(image => image.src === ''));
  assert.equal(f.images.length, 1);
  assert.equal(f.layer().removed, true);
  assert.deepEqual(f.layer().shown.flat(), []);
});
