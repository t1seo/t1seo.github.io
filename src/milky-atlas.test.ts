import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { fixture } from './cyber-pet-test-support.ts';

// As with the pet controller harness, leave CSS loading to the browser.
const source = readFileSync(new URL('./milky-atlas.ts', import.meta.url), 'utf8').replace("import './milky-atlas.css';", '');
const atlas: typeof import('./milky-atlas.ts') = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);

test('native directional rows use all eight phases and photo/rest poses retain their renderer', () => {
  for (const [facing, row] of [['right', 1], ['left', 2]] as const) {
    for (let phase = 0; phase < 8; phase++) {
      assert.deepEqual(atlas.selectMilkyAtlasFrame('side', 'walking', facing, phase, Math.floor(phase / 2)),
        { row, column: phase, loop: false });
    }
  }
  for (const pose of ['sit', 'sleep', 'eat-low', 'belly-up', 'chin-rest']) {
    assert.equal(atlas.selectMilkyAtlasFrame(pose, '', 'left', 0, 0), null);
  }
  assert.equal(atlas.selectMilkyAtlasFrame('idle', '', 'left', 0, 0, 8)?.row, 10);
  assert.equal(atlas.selectMilkyAtlasFrame('idle', '', 'left', 0, 0, 7)?.row, 9);
  assert.deepEqual(atlas.selectMilkyAtlasFrame('idle', '', 'right', 0, 0), { row: 0, column: 0, loop: true });
});

test('existing hop stage mapping is independent of eight-phase walking input', () => {
  for (let gait = 0; gait < 8; gait++) {
    assert.equal(atlas.selectMilkyAtlasFrame('side', 'anticipating', 'right', gait, 0)?.column, 0);
    assert.equal(atlas.selectMilkyAtlasFrame('side', 'landing', 'right', gait, 0)?.column, 4);
    assert.deepEqual([0, 1, 2, 3].map(frame => atlas.selectMilkyAtlasFrame('side', 'hopping', 'right', gait, frame)?.column), [1, 2, 4, 3]);
  }
});

test('real four-frame trot emits every atlas phase on the existing movement clock', async () => {
  const f = fixture();
  try {
    await f.loadAll(); await f.loadForward(); await f.loadTrot();
    f.controller.run();
    const phases = new Set<number>();
    let withinFallbackChange = false;
    let lastLegacy = '', lastAtlas = '';
    for (let i = 0; i < 1000; i++) {
      if (f.button.dataset.pose === 'side' && f.button.dataset.motion === 'walking') {
        const current = f.button.dataset.atlasFrame;
        phases.add(Number(current));
        if (lastLegacy === f.button.dataset.frame && lastAtlas !== current) withinFallbackChange = true;
        lastLegacy = f.button.dataset.frame; lastAtlas = current;
      }
      f.advance(16);
    }
    assert.deepEqual([...phases].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.ok(withinFallbackChange, 'atlas advances even while the four-frame fallback holds a frame');
  } finally { f.restore(); }
});

test('mounted atlas keeps floor registration, avoids double mirror, and stops on lifecycle blockers', async () => {
  let notify = () => {};
  let observed: MutationObserverInit | undefined;
  let disconnected = false;
  let plays = 0, cancels = 0;
  class ElementFake extends EventTarget {
    dataset: Record<string, string> = {};
    style = Object.assign({ backgroundImage: '', backgroundPosition: '' }, {
      setProperty(name: string, value: string) { properties[name] = value; },
    });
    className = '';
    setAttribute() {}
    remove() {}
    animate() { plays++; return { cancel() { cancels++; } }; }
  }
  const properties: Record<string, string> = {};
  const sprite = new ElementFake();
  const figure = { append() {} };
  const button = Object.assign(new ElementFake(), { querySelector: () => figure });
  Object.assign(button.dataset, { pose: 'idle', active: 'true', animated: 'true', facing: 'left' });
  const image = { src: '', naturalWidth: 1536, naturalHeight: 2288, decode: () => Promise.resolve() };
  const page = Object.assign(new EventTarget(), { hidden: false, createElement: (tag: string) => tag === 'img' ? image : sprite });
  const host = { ownerDocument: page, querySelector: () => button };
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'MutationObserver');
  Object.defineProperty(globalThis, 'MutationObserver', { configurable: true, value: class {
    constructor(callback: () => void) { notify = callback; }
    observe(_target: unknown, options: MutationObserverInit) { observed = options; }
    disconnect() { disconnected = true; }
  } });
  let mounted: ReturnType<typeof atlas.mountMilkyAtlas> | undefined;
  try {
    mounted = atlas.mountMilkyAtlas(host as unknown as HTMLElement);
    await Promise.resolve();
    assert.ok(observed?.attributeFilter?.includes('data-atlas-frame'));
    assert.equal(sprite.style.backgroundImage, `url("${image.src}")`);
    assert.ok(image.src.endsWith('?v=astra-v1'));
    for (const height of [.4, 1.1055625, 1.6]) {
      const top = Number.parseFloat(properties['--milky-atlas-floor']) / 100;
      const shift = Number.parseFloat(properties['--milky-atlas-floor-shift']) / 100;
      assert.ok(Math.abs(top + height * shift + height * (184 / 208) - .94) < 1e-12);
    }
    assert.equal(plays, 1);
    page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
    assert.equal(cancels, 1);
    page.hidden = false; button.dataset.active = 'false'; notify();
    assert.equal(plays, 1, 'modal remains inactive even when visible');
    button.dataset.active = 'true'; button.dataset.animated = 'false'; notify();
    assert.equal(plays, 1, 'still/reduced-motion gate remains inactive');
    button.dataset.pose = 'side'; button.dataset.atlasFrame = '5'; notify();
    assert.equal(sprite.dataset.row, '2'); assert.equal(sprite.dataset.frame, '5');
    const css = readFileSync(new URL('./milky-atlas.css', import.meta.url), 'utf8');
    assert.match(css, /transform: translate\(-50%, calc\(var\(--milky-atlas-floor-shift\) \+ var\(--milky-atlas-hop-offset, 0%\)\)\)/);
    assert.match(css, /height: var\(--milky-atlas-height, 110\.55625%\)/);
    assert.doesNotMatch(css, /scaleX|background-image|milky-atlas-scale/);
    assert.match(css, /\.cyber-pet-figure \{ animation: none !important; \}/, 'legacy breathing cannot add a second body transform');
    mounted.destroy(); mounted = undefined;
    assert.ok(disconnected); assert.equal(button.dataset.atlas, undefined);
  } finally {
    mounted?.destroy();
    if (previous) Object.defineProperty(globalThis, 'MutationObserver', previous);
    else Reflect.deleteProperty(globalThis, 'MutationObserver');
  }
});


test('airborne sheet offsets do not double the existing physical hop lift', () => {
  for (let column = 0; column < 5; column++) {
    for (const height of [80, 221.1125, 320]) {
      const physicalLift = 13;
      const visibleSole = .94 * 200 - 184 / 208 * height
        + atlas.milkyAtlasHopOffset(4, column) * height
        + atlas.MILKY_JUMP_SOLES[column] / 208 * height - physicalLift;
      assert.ok(Math.abs(visibleSole - (.94 * 200 - physicalLift)) < 1e-10);
    }
  }
  assert.equal(atlas.milkyAtlasHopOffset(0, 2), 0, 'idle cannot retain a flight correction');
  assert.equal(atlas.milkyAtlasHopOffset(1, 2), 0, 'walking cannot retain a flight correction');
});
