import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountPenthouseScene, penthousePlate, penthouseInterior, PENTHOUSE_WINDOW } from './penthouse-scene.ts';
import { CYBER_SEASONS, CYBER_TIMES, type ClimateState } from './cyber-climate.ts';

const state = (time: ClimateState['time'], season: ClimateState['season'] = 'autumn'): ClimateState => ({ season, time, weather: 'clear', auto: false });
const tick = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
const visiblePair = (source: string) => [penthouseInterior(source),source];
function setup(t: TestContext) {
  const images: Array<{ src: string; style: Record<string,string>; resolve(): void; reject(error: Error): void }> = [];
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const install = (key: string, value: unknown) => {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  class FakeImage {
    src = ''; style: Record<string,string> = {}; resolve!: () => void; reject!: (error: Error) => void;
    promise = new Promise<void>((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
    constructor() { images.push(this); }
    decode() { return this.promise; }
  }
  install('Image', FakeImage);
  install('document', { hidden: false, addEventListener() {} });
  install('matchMedia', () => ({ matches: true, addEventListener() {} }));
  install('cancelAnimationFrame', () => {});
  const shown: string[][] = [];
  const layers = { replaceChildren(...children: FakeImage[]) { shown.push(children.map(image => image.src)); } };
  const canvas = { style: {}, getContext: () => null };
  const room = { dataset: {}, querySelector(selector: string) { return selector === '[data-plates]' ? layers : selector === 'canvas' ? canvas : { style: {} }; } };
  let errors = 0;
  const scene = mountPenthouseScene(room as unknown as HTMLElement, () => errors++);
  t.after(() => {
    scene.destroy();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  return { scene, images, shown, errors: () => errors, resolvePair(index: number) { images[index * 2].resolve(); images[index * 2 + 1].resolve(); } };
}

test('all twenty season and time choices resolve to delivered Seoul art', () => {
  const paths = new Set<string>();
  for (const season of CYBER_SEASONS) for (const time of CYBER_TIMES) {
    const path = penthousePlate(time,'clear',season);
    assert.equal(path, `/assets/penthouse/seoul/${season}/${time}.webp`);
    assert.ok(readFileSync(new URL(`../public${path}`, import.meta.url)).length > 1000);
    paths.add(path);
  }
  assert.equal(paths.size,20);
});
test('five upgraded furniture plates exist and follow the selected exterior light', () => {
  const paths = new Set<string>();
  for (const season of CYBER_SEASONS) for (const time of CYBER_TIMES) {
    const path = penthouseInterior(penthousePlate(time,'clear',season));
    assert.equal(path, `/assets/penthouse/seoul/interior/${time}.webp`);
    assert.ok(readFileSync(new URL(`../public${path}`, import.meta.url)).length > 1000);
    paths.add(path);
  }
  assert.equal(paths.size,5);
  assert.equal(penthouseInterior(penthousePlate('morning','rain','winter')),'/assets/penthouse/seoul/interior/noon.webp');
});
test('frontal glass boundary spans the Seoul view above furniture and foreground', () => {
  const points = [...PENTHOUSE_WINDOW.matchAll(/([\d.]+)%? ([\d.]+)%?/g)].map(match => [Number(match[1]), Number(match[2])]);
  assert.equal(points.length,4);
  assert.ok(points.every(([x,y]) => x > 11 && x < 90 && y > 4 && y < 52));
  assert.ok(Math.max(...points.map(([x]) => x)) - Math.min(...points.map(([x]) => x)) > 77);
});
test('neither exterior-first nor furniture-first loading exposes a half-finished scene', async t => {
  const f = setup(t);
  f.scene.update(state('noon'));
  f.images[0].resolve(); await tick();
  assert.deepEqual(f.shown,[]);
  assert.equal(f.images[0].style.clipPath,'url(#ph-glass)');
  assert.equal(f.images[1].style.clipPath,undefined,'furniture must not be clipped to the window');
  f.images[1].resolve(); await tick();
  assert.deepEqual(f.shown,[visiblePair(penthousePlate('noon'))]);
  f.scene.update(state('evening'));
  f.images[3].resolve(); await tick();
  assert.deepEqual(f.shown,[visiblePair(penthousePlate('noon'))]);
  f.images[2].resolve(); await tick();
  assert.deepEqual(f.shown,[visiblePair(penthousePlate('noon')),visiblePair(penthousePlate('evening'))]);
});
test('a late daylight furniture decode cannot overwrite a newer complete evening pair', async t => {
  const f = setup(t);
  f.scene.update(state('noon'));
  f.images[0].resolve(); await tick();
  f.scene.update(state('evening'));
  f.resolvePair(1); await tick();
  f.images[1].resolve(); await tick();
  assert.deepEqual(f.shown, [visiblePair(penthousePlate('evening'))]);
});
test('returning to the currently visible night cancels a pending day swap', async t => {
  const f = setup(t);
  f.scene.update(state('noon'));
  f.scene.update(state('night'));
  f.resolvePair(0); await tick();
  assert.deepEqual(f.shown, []);
});
test('changing only the season replaces the illustration, and the newest season wins', async t => {
  const f = setup(t);
  f.scene.update(state('night','spring'));
  f.scene.update(state('night','winter'));
  assert.equal(f.images.length,4);
  f.resolvePair(1); await tick();
  f.resolvePair(0); await tick();
  assert.deepEqual(f.shown,[visiblePair(penthousePlate('night','clear','winter'))]);
});
test('returning to the displayed season cancels a pending seasonal swap', async t => {
  const f = setup(t);
  f.scene.update(state('night','summer'));
  f.scene.update(state('night','autumn'));
  f.resolvePair(0); await tick();
  assert.deepEqual(f.shown,[]);
});
test('failed seasonal art preserves the current room and allows the same selection to retry', async t => {
  const f = setup(t);
  f.scene.update(state('night','winter'));
  f.images[0].reject(new Error('offline')); await tick();
  assert.equal(f.errors(),1);
  assert.deepEqual(f.shown,[]);
  f.scene.update(state('night','winter'));
  f.resolvePair(1); await tick();
  f.images[1].resolve(); await tick();
  assert.deepEqual(f.shown,[visiblePair(penthousePlate('night','clear','winter'))]);
});
test('failed furniture preserves the old pair despite decoded exterior and allows retry', async t => {
  const f = setup(t);
  f.scene.update(state('evening'));
  f.resolvePair(0); await tick();
  const old = visiblePair(penthousePlate('evening'));
  f.scene.update(state('noon'));
  f.images[2].resolve();
  f.images[3].reject(new Error('furniture offline')); await tick();
  assert.equal(f.errors(), 1);
  assert.deepEqual(f.shown, [old]);
  f.scene.update(state('noon'));
  f.resolvePair(2); await tick();
  assert.deepEqual(f.shown, [old,visiblePair(penthousePlate('noon'))]);
});
test('a rejected superseded furniture pair does not report an error or replace the current pair', async t => {
  const f = setup(t);
  f.scene.update(state('noon'));
  f.images[0].resolve(); await tick();
  f.scene.update(state('evening'));
  f.resolvePair(1); await tick();
  f.images[1].reject(new Error('stale request')); await tick();
  assert.equal(f.errors(),0);
  assert.deepEqual(f.shown,[visiblePair(penthousePlate('evening'))]);
});
test('destroy releases both pending images and neither late decode can publish', async t => {
  const f = setup(t);
  f.scene.update(state('noon'));
  f.scene.destroy();
  assert.ok(f.images.every(image => image.src === ''));
  f.resolvePair(0); await tick();
  assert.deepEqual(f.shown, []);
});
