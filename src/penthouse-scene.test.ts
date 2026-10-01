import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountPenthouseScene, penthousePlate, PENTHOUSE_WINDOW } from './penthouse-scene.ts';
import { CYBER_SEASONS, CYBER_TIMES, type ClimateState } from './cyber-climate.ts';

const state = (time: ClimateState['time'], season: ClimateState['season'] = 'autumn'): ClimateState => ({ season, time, weather: 'clear', auto: false });
const tick = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
const visiblePlate = (source: string) => [source];
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
  const canvas = { style: {}, dataset: {}, getContext: () => null };
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
  return { scene, images, shown, errors: () => errors, resolve(index: number) { images[index].resolve(); } };
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
test('frontal glass boundary spans the taller Seoul view', () => {
  const points = [...PENTHOUSE_WINDOW.matchAll(/([\d.]+)%? ([\d.]+)%?/g)].map(match => [Number(match[1]), Number(match[2])]);
  assert.equal(points.length,4);
  assert.ok(points.every(([x,y]) => x > 11 && x < 90 && y > 3 && y < 66));
  assert.ok(Math.max(...points.map(([,y]) => y)) - Math.min(...points.map(([,y]) => y)) > 61);
});
test('the old scene stays visible until the full replacement decodes', async t => {
  const f = setup(t); f.scene.update(state('noon')); await tick();
  assert.deepEqual(f.shown,[]);
  f.resolve(0); await tick();
  assert.deepEqual(f.shown,[visiblePlate(penthousePlate('noon'))]);
});
test('a late daytime decode cannot overwrite a newer evening scene', async t => {
  const f = setup(t); f.scene.update(state('noon')); f.scene.update(state('evening'));
  f.resolve(1); await tick(); f.resolve(0); await tick();
  assert.deepEqual(f.shown,[visiblePlate(penthousePlate('evening'))]);
});
test('returning to the currently visible night cancels a pending day swap', async t => {
  const f = setup(t); f.scene.update(state('noon')); f.scene.update(state('night'));
  f.resolve(0); await tick(); assert.deepEqual(f.shown,[]);
});
test('the newest seasonal selection wins even if the old request finishes last', async t => {
  const f = setup(t); f.scene.update(state('night','spring')); f.scene.update(state('night','winter'));
  assert.equal(f.images.length,2); f.resolve(1); await tick(); f.resolve(0); await tick();
  assert.deepEqual(f.shown,[visiblePlate(penthousePlate('night','clear','winter'))]);
});
test('returning to the displayed season cancels a pending seasonal swap', async t => {
  const f = setup(t); f.scene.update(state('night','summer')); f.scene.update(state('night','autumn'));
  f.resolve(0); await tick(); assert.deepEqual(f.shown,[]);
});
test('failed seasonal art preserves the current room and allows the same selection to retry', async t => {
  const f = setup(t); f.scene.update(state('night','winter'));
  f.images[0].reject(new Error('offline')); await tick();
  assert.equal(f.errors(),1); assert.deepEqual(f.shown,[]);
  f.scene.update(state('night','winter')); f.resolve(1); await tick();
  assert.deepEqual(f.shown,[visiblePlate(penthousePlate('night','clear','winter'))]);
});
test('a rejected superseded request does not report an error or replace the current room', async t => {
  const f = setup(t); f.scene.update(state('noon')); f.scene.update(state('evening'));
  f.resolve(1); await tick(); f.images[0].reject(new Error('stale request')); await tick();
  assert.equal(f.errors(),0); assert.deepEqual(f.shown,[visiblePlate(penthousePlate('evening'))]);
});
test('destroy releases pending images and a late decode cannot publish', async t => {
  const f = setup(t); f.scene.update(state('noon')); f.scene.destroy();
  assert.ok(f.images.every(image => image.src === '')); f.resolve(0); await tick();
  assert.deepEqual(f.shown,[]);
});
