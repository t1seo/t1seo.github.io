import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createNoirDecorator, getInteriorAssets, getInteriorStyle } from './cyber-interior.ts';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

class Element {
  src = '';
  className = 'night-plate night-plate--climate';
  dataset: Record<string, string> = {};
  style: Record<string, string> = {};
  children: Element[] = [];
  decoded = deferred();
  append(...children: Element[]) { this.children.push(...children); }
  decode() { return this.decoded.promise; }
}

function fixture(t: TestContext) {
  const images: Element[] = [];
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({
    Image: class extends Element { constructor() { super(); images.push(this); } },
    document: { createElement: () => new Element() },
  })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  return { images, original: new Element() as unknown as HTMLImageElement };
}

test('original interior is a shareable explicit choice and unknown styles use noir', () => {
  assert.equal(getInteriorStyle(''), 'noir');
  assert.equal(getInteriorStyle('?interior=noir'), 'noir');
  assert.equal(getInteriorStyle('?interior=original'), 'original');
  assert.equal(getInteriorStyle('?other=original'), 'noir');
  assert.equal(getInteriorStyle('?interior=invalid'), 'noir');
});

test('all twenty scenes use existing interior assets and retain the appropriate seasonal mask', () => {
  for (const season of ['spring', 'summer', 'autumn', 'winter']) {
    for (const time of ['morning', 'noon', 'afternoon', 'evening', 'night']) {
      const assets = getInteriorAssets(`/assets/cyberpunk/climate/${season}-${time}.webp`)!;
      assert.equal(assets.season, season);
      assert.equal(assets.time, time);
      assert.ok(readFileSync(new URL(`../public${assets.art}`, import.meta.url)).byteLength > 1000);
      const mask = readFileSync(new URL(`../public${assets.mask}`, import.meta.url), 'utf8');
      assert.match(mask, /mask-type:luminance/);
      assert.match(mask, /fill="black"/);
      assert.equal(assets.mask.includes('winter'), season === 'winter');
      assert.equal(assets.art.includes('night'), ['evening', 'night'].includes(time));
    }
  }
  assert.equal(getInteriorAssets('/unrelated.webp'), null);
});

test('masks expose the original sky, city, river and plant while replacing indoor materials', () => {
  function covers(points: number[][], x: number, y: number) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i], [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  for (const name of ['room', 'winter']) {
    const svg = readFileSync(new URL(`../public/assets/cyberpunk/noir/${name}-mask.svg`, import.meta.url), 'utf8');
    const polygons = [...svg.matchAll(/<polygon fill="(black|white)" points="([^"]+)"/g)]
      .map(([, color, points]) => ({ color, points: points.split(' ').map(pair => pair.split(',').map(Number)) }));
    function visible(x: number, y: number) {
      let color = 'white';
      for (const polygon of polygons) if (covers(polygon.points, x, y)) color = polygon.color;
      return color === 'white';
    }
    for (const [x, y] of [[500, 120], [700, 180], [1150, 100], [1450, 240], [650, 370], [1300, 370], [1650, 330]]) {
      assert.equal(visible(x, y), false, `${name}: preserve outdoor pixel ${x},${y}`);
    }
    for (const [x, y] of [[100, 500], [130, 650], [900, 850], [900, 580], [1050, 410]]) {
      assert.equal(visible(x, y), true, `${name}: restyle indoor pixel ${x},${y}`);
    }
    assert.equal(visible(350, 300), name !== 'winter', 'preserve the winter tree');
    assert.equal(visible(475, 695), name !== 'winter', 'preserve the winter gifts');
  }
});

test('interior waits for art and mask, then preserves the original city element beneath its overlay', async t => {
  const f = fixture(t);
  f.original.src = '/assets/cyberpunk/climate/spring-morning.webp';
  const pending = createNoirDecorator()(f.original, f.original.src);
  f.images[0].decoded.resolve();
  await Promise.resolve();
  assert.equal(f.original.className, 'night-plate night-plate--climate');
  f.images[1].decoded.resolve();
  const layer = await pending as unknown as Element;
  assert.equal(layer.children[0], f.original);
  assert.equal(f.original.src, '/assets/cyberpunk/climate/spring-morning.webp');
  assert.equal(layer.children[1].src, '/assets/cyberpunk/noir/day.webp');
  assert.equal(layer.children[1].style.maskImage, 'url("/assets/cyberpunk/noir/room-mask.svg")');
  assert.equal(layer.className, 'night-plate night-plate--climate');
  assert.deepEqual(layer.dataset, { season: 'spring', time: 'morning' });
});

test('winter overlay keeps its own tree mask during crossfades with other seasons', async t => {
  const f = fixture(t);
  const decorate = createNoirDecorator();
  const pending = decorate(f.original, '/assets/cyberpunk/climate/winter-night.webp');
  f.images.forEach(image => image.decoded.resolve());
  const winter = await pending as unknown as Element;
  const next = decorate(new Element() as unknown as HTMLImageElement, '/assets/cyberpunk/climate/summer-noon.webp');
  f.images.forEach(image => image.decoded.resolve());
  const summer = await next as unknown as Element;
  assert.equal(winter.children[1].style.maskImage, 'url("/assets/cyberpunk/noir/winter-mask.svg")');
  assert.equal(summer.children[1].style.maskImage, 'url("/assets/cyberpunk/noir/room-mask.svg")');
  assert.equal(winter.children[1].src, '/assets/cyberpunk/noir/night.webp');
  assert.equal(summer.children[1].src, '/assets/cyberpunk/noir/day.webp');
});

test('missing artwork or mask leaves the original scene intact and reports fallback only once', async t => {
  const f = fixture(t);
  let failures = 0;
  const decorate = createNoirDecorator(() => failures++);
  for (const failIndex of [0, 1]) {
    const before = f.images.length;
    const pending = decorate(f.original, '/assets/cyberpunk/climate/autumn-night.webp');
    f.images[before + failIndex].decoded.reject(new Error('offline'));
    f.images[before + 1 - failIndex].decoded.resolve();
    assert.equal(await pending, f.original);
    assert.equal(f.original.className, 'night-plate night-plate--climate');
  }
  assert.equal(failures, 1);
  assert.equal(await decorate(f.original, '/unrelated.webp'), f.original);
});
