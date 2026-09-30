import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountPenthouseScene, penthousePlate, PENTHOUSE_WINDOW } from './penthouse-scene.ts';
import type { ClimateState } from './cyber-climate.ts';

const state = (time: ClimateState['time']): ClimateState => ({ season: 'autumn', time, weather: 'clear', auto: false });
const tick = () => new Promise<void>(resolve => queueMicrotask(resolve));
function setup(t: TestContext) {
  const images: Array<{ src: string; resolve(): void; reject(error: Error): void }> = [];
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const install = (key: string, value: unknown) => {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  class FakeImage {
    src = ''; resolve!: () => void; reject!: (error: Error) => void;
    promise = new Promise<void>((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
    constructor() { images.push(this); }
    decode() { return this.promise; }
  }
  install('Image', FakeImage);
  install('document', { hidden: false, addEventListener() {} });
  install('matchMedia', () => ({ matches: true, addEventListener() {} }));
  install('cancelAnimationFrame', () => {});
  const shown: string[] = [];
  const layers = { replaceChildren(image: FakeImage) { shown.push(image.src); } };
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
  return { scene, images, shown, errors: () => errors };
}

test('all five time choices resolve to new delivered art, never old room assets', () => {
  for (const time of ['morning','noon','afternoon','evening','night'] as const) {
    const path = penthousePlate(time);
    assert.match(path, /^\/assets\/penthouse\//);
    assert.ok(readFileSync(new URL(`../public${path}`, import.meta.url)).length > 1000);
  }
  assert.notEqual(penthousePlate('night'), penthousePlate('evening'));
  assert.notEqual(penthousePlate('noon'), penthousePlate('evening'));
});
test('new glass boundary ends above clear foreground and excludes the audio wall', () => {
  const points = [...PENTHOUSE_WINDOW.matchAll(/([\d.]+)%? ([\d.]+)%?/g)].map(match => [Number(match[1]), Number(match[2])]);
  assert.ok(points.length > 10);
  assert.ok(points.every(([x,y]) => x <= 64 && y < 60));
});
test('a late daylight load cannot overwrite a newer evening choice', async t => {
  const f = setup(t);
  f.scene.update(state('noon'));
  f.scene.update(state('evening'));
  f.images[1].resolve(); await tick();
  f.images[0].resolve(); await tick();
  assert.deepEqual(f.shown, [penthousePlate('evening')]);
});
test('returning to the currently visible night cancels a pending day swap', async t => {
  const f = setup(t);
  f.scene.update(state('noon'));
  f.scene.update(state('night'));
  f.images[0].resolve(); await tick();
  assert.deepEqual(f.shown, []);
});
test('failed art keeps the displayed room and a repeated choice can retry', async t => {
  const f = setup(t);
  f.scene.update(state('noon'));
  f.images[0].reject(new Error('offline')); await tick();
  assert.equal(f.errors(), 1);
  assert.deepEqual(f.shown, []);
  f.scene.update(state('noon'));
  f.images[1].resolve(); await tick();
  assert.deepEqual(f.shown, [penthousePlate('noon')]);
});
test('destroyed scene cannot publish a late decode', async t => {
  const f = setup(t);
  f.scene.update(state('noon'));
  f.scene.destroy();
  f.images[0].resolve(); await tick();
  assert.deepEqual(f.shown, []);
});
