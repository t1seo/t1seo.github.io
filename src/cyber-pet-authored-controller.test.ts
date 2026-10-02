import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createAuthoredController } from './cyber-pet-authored-controller.ts';
import { AUTHORED_DURATION, AUTHORED_STRIDE } from './cyber-pet-authored-controller.ts';
import { createGroundedWalkAssetLoader } from './cyber-pet-grounded-assets.ts';
import { loadAuthoredCanine } from './cyber-pet-authored-clip.ts';
import type { AuthoredCanine, AuthoredMode } from './cyber-pet-authored-clip.ts';
import type { GroundedSkeleton } from './cyber-pet-grounded-articulation.ts';
import type { GroundedWalkImage } from './cyber-pet-grounded-assets.ts';

const route = { from: { x: 400, y: 900 }, to: { x: 580, y: 900 }, scale: .11, endScale: .11, facing: 1 } as const;
const frame = (travelled: number, scale = .11) => ({ travelled, scale, root: { x: 400 + travelled, y: 900 }, wrapperWidth: 200, pixelRatio: 2 });
async function source(): Promise<AuthoredCanine> {
  const bytes = await readFile(new URL('../public/assets/cyberpunk/milky-authored/canine-clips.glb', import.meta.url));
  return loadAuthoredCanine(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}
function fixture() {
  const calls = { images: 0, canines: 0, prepares: 0, hides: 0, destroys: 0, disposes: 0, samples: [] as { mode: AuthoredMode; seconds: number }[], drawings: [] as GroundedSkeleton[] };
  const loader = createGroundedWalkAssetLoader(async (url: string) => { calls.images++; return { image: url, width: 768, height: 512 }; });
  const controller = createAuthoredController(loader, {
    available: () => true,
    prepare() { calls.prepares++; },
    draw(_sample, _frame, skeleton) { calls.drawings.push(structuredClone(skeleton)); return true; },
    hide() { calls.hides++; },
    destroy() { calls.destroys++; },
  }, async () => {
    calls.canines++;
    const canine = await source();
    return { ...canine, sample(mode, seconds) { calls.samples.push({ mode, seconds }); return canine.sample(mode, seconds); }, dispose() { calls.disposes++; canine.dispose(); } };
  });
  return { calls, controller };
}

test('authored controller loads lazily once and never animates without caller frames', async () => {
  const { calls, controller } = fixture();
  try {
    assert.equal(controller.ready(), false);
    assert.equal(controller.begin(route), false);
    assert.equal(calls.images, 0); assert.equal(calls.canines, 0);
    assert.deepEqual(await Promise.all([controller.prepare(), controller.prepare()]), [true, true]);
    assert.equal(calls.images, 3); assert.equal(calls.canines, 1); assert.equal(calls.prepares, 1);
    assert.equal(calls.drawings.length, 0);
    assert.equal(controller.begin(route), true);
    assert.equal(controller.draw(frame(0)), true);
    assert.equal(calls.drawings.length, 1);
  } finally { controller.destroy(); }
  assert.equal(calls.disposes, 1); assert.equal(calls.destroys, 1);
});

test('walk and run sample their original clips by distance without packing cycles into the route', async () => {
  const { calls, controller } = fixture();
  try {
    await controller.prepare();
    for (const mode of ['walk', 'run'] as const) {
      controller.begin({ ...route, gait: mode });
      controller.draw(frame(AUTHORED_STRIDE[mode] * route.scale * .37));
      const sample = calls.samples.at(-1)!;
      assert.equal(sample.mode, mode);
      assert.ok(Math.abs(sample.seconds - AUTHORED_DURATION[mode] * .37) < 1e-7);
      assert.equal(controller.finish(), false);
    }
  } finally { controller.destroy(); }
});

test('changing depth integrates travelled distance against mean frame scale', async () => {
  const { calls, controller } = fixture();
  try {
    await controller.prepare(); controller.begin(route);
    controller.draw(frame(0));
    controller.draw(frame(4.8, .09));
    assert.ok(Math.abs(calls.samples.at(-1)!.seconds / AUTHORED_DURATION.walk - .1) < 1e-7);
    controller.draw(frame(8.64, .07));
    assert.ok(Math.abs(calls.samples.at(-1)!.seconds / AUTHORED_DURATION.walk - .2) < 1e-7);
  } finally { controller.destroy(); }
});

test('compatible redirection preserves the visible pose and phase even for a tiny remaining route', async () => {
  const { calls, controller } = fixture();
  try {
    await controller.prepare(); controller.begin(route); controller.draw(frame(30));
    const before = structuredClone(calls.drawings.at(-1)), beforeTime = calls.samples.at(-1)!.seconds;
    controller.begin({ ...route, from: { x: 430, y: 900 }, to: { x: 431, y: 900 } }, true);
    controller.draw({ ...frame(0), root: { x: 430, y: 900 } });
    assert.equal(calls.samples.at(-1)!.seconds, beforeTime);
    assert.deepEqual(calls.drawings.at(-1), before);
    controller.draw({ ...frame(1), root: { x: 431, y: 900 } });
    assert.equal(controller.finish(), true);
    const count = calls.drawings.length;
    assert.equal(controller.draw(frame(1)), false);
    assert.equal(calls.drawings.length, count);
    assert.equal(calls.hides, 0);
  } finally { controller.destroy(); }
});

test('arrival returns to the same neutral drawing without another idle animation loop', async () => {
  const { calls, controller } = fixture();
  try {
    await controller.prepare(); controller.begin(route); controller.draw(frame(0));
    const neutral = structuredClone(calls.drawings.at(-1));
    controller.draw(frame(60)); assert.notDeepEqual(calls.drawings.at(-1), neutral);
    controller.draw(frame(180)); assert.deepEqual(calls.drawings.at(-1), neutral);
    assert.equal(controller.finish(), true);
    assert.equal(calls.drawings.length, 3);
  } finally { controller.destroy(); }
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

test('rest cancels a pending motion load, disposes its late result, and permits a fresh preparation', async () => {
  const late = deferred<AuthoredCanine>(), started = deferred<AbortSignal>();
  const loader = createGroundedWalkAssetLoader(async (url: string) => ({ image: url, width: 768, height: 512 }));
  let requests = 0, disposed = 0, paints = 0;
  const controller = createAuthoredController(loader, {
    available: () => true, prepare() {}, draw() { paints++; return true; }, hide() {}, destroy() {},
  }, async signal => {
    requests++;
    if (requests === 1) { started.resolve(signal); return late.promise; }
    return source();
  });
  try {
    const preparing = controller.prepare(), signal = await started.promise;
    controller.rest(); assert.equal(signal.aborted, true);
    const canine = await source();
    late.resolve({ ...canine, dispose() { disposed++; canine.dispose(); } });
    assert.equal(await preparing, false); assert.equal(disposed, 1);
    assert.equal(controller.ready(), false); assert.equal(controller.begin(route), false);
    assert.equal(controller.draw(frame(40)), false); assert.equal(paints, 0);
    assert.equal(await controller.prepare(), true); assert.equal(controller.begin(route), true);
  } finally { controller.destroy(); }
});

test('destroy releases a loaded canine while artwork is still pending and rejects all future work', async () => {
  const image = deferred<GroundedWalkImage<string>>(), loaded = deferred<void>();
  const loader = createGroundedWalkAssetLoader(() => image.promise);
  let disposed = 0, destroyed = 0, prepared = 0;
  const controller = createAuthoredController(loader, {
    available: () => true, prepare() { prepared++; }, draw: () => true, hide() {}, destroy() { destroyed++; },
  }, async () => {
    const canine = await source();
    // Let the controller receive the canine before this task destroys it.
    queueMicrotask(() => queueMicrotask(() => loaded.resolve()));
    return { ...canine, dispose() { disposed++; canine.dispose(); } };
  });
  const preparing = controller.prepare(); await loaded.promise;
  controller.destroy(); controller.destroy();
  assert.equal(disposed, 1); assert.equal(destroyed, 1);
  image.resolve({ image: 'late image', width: 768, height: 512 });
  assert.equal(await preparing, false); assert.equal(prepared, 0);
  assert.equal(await controller.prepare(), false); assert.equal(controller.ready(), false);
  assert.equal(controller.begin(route), false); assert.equal(controller.draw(frame(20)), false);
});

test('motion-load errors and painter rejection return control to the existing sprite fallback', async () => {
  const loader = createGroundedWalkAssetLoader(async (url: string) => ({ image: url, width: 768, height: 512 }));
  let fail = true, prepared = 0, paints = 0, hidden = 0;
  const controller = createAuthoredController(loader, {
    available: () => true, prepare() { prepared++; }, draw() { paints++; return false; }, hide() { hidden++; }, destroy() {},
  }, async () => { if (fail) throw new Error('Network unavailable'); return source(); });
  try {
    assert.equal(await controller.prepare(), false); assert.equal(prepared, 0);
    assert.equal(controller.ready(), false); assert.equal(controller.begin(route), false);
    fail = false; assert.equal(await controller.prepare(), true);
    controller.begin(route);
    assert.equal(controller.draw(frame(20)), false); assert.equal(hidden, 1);
    assert.equal(controller.draw(frame(30)), false); assert.equal(paints, 1);
  } finally { controller.destroy(); }
});

test('a mode or facing change starts from neutral instead of inheriting an incompatible pose', async () => {
  const { calls, controller } = fixture();
  try {
    await controller.prepare(); controller.begin(route); controller.draw(frame(30));
    controller.begin({ ...route, gait: 'run' }, true); controller.draw(frame(0));
    assert.deepEqual(calls.samples.at(-1), { mode: 'run', seconds: 0 });
    const neutral = structuredClone(calls.drawings.at(-1));
    controller.draw(frame(30));
    controller.begin({ ...route, gait: 'run', facing: -1 }, true); controller.draw(frame(0));
    assert.deepEqual(calls.samples.at(-1), { mode: 'run', seconds: 0 });
    assert.deepEqual(calls.drawings.at(-1), neutral);
  } finally { controller.destroy(); }
});

test('a stale preparation cannot replace or dispose the newer ready animation', async () => {
  const first = deferred<AuthoredCanine>(), started = deferred<void>();
  const image = { image: 'decoded', width: 768, height: 512 };
  const assets = { torso: image, foreleg: image, hindleg: image };
  let requests = 0, oldDisposed = 0, newDisposed = 0, prepared = 0;
  const controller = createAuthoredController({ load: async () => assets, current: () => assets, abort() {}, destroy() {} }, {
    available: () => true, prepare() { prepared++; }, draw: () => true, hide() {}, destroy() {},
  }, async () => {
    if (++requests === 1) { started.resolve(); return first.promise; }
    const canine = await source();
    return { ...canine, dispose() { newDisposed++; canine.dispose(); } };
  });
  try {
    const oldPreparation = controller.prepare(); await started.promise;
    controller.rest(); assert.equal(await controller.prepare(), true);
    const old = await source();
    first.resolve({ ...old, dispose() { oldDisposed++; old.dispose(); } });
    assert.equal(await oldPreparation, false);
    assert.equal(oldDisposed, 1); assert.equal(newDisposed, 0); assert.equal(prepared, 1);
    assert.equal(controller.ready(), true); controller.begin(route);
    assert.equal(controller.draw(frame(30)), true);
  } finally { controller.destroy(); }
  assert.equal(newDisposed, 1);
});
