import assert from 'node:assert/strict';
import test from 'node:test';
import { createGroundedWalkAssetLoader, decodeGroundedWalkImage } from './cyber-pet-grounded-assets.ts';
import type { GroundedWalkImage } from './cyber-pet-grounded-assets.ts';

function deferred<Value>() {
  let resolve: (value: Value) => void = () => assert.fail('Promise not initialized');
  let reject: (reason: unknown) => void = () => assert.fail('Promise not initialized');
  const promise = new Promise<Value>((accept, refuse) => { resolve = accept; reject = refuse; });
  return { promise, resolve, reject };
}

function fixture() {
  const thirdStarted = deferred<void>();
  const fifthStarted = deferred<void>();
  const requests: {
    readonly url: string;
    readonly signal: AbortSignal;
    readonly resolve: (image: GroundedWalkImage<string>) => void;
    readonly reject: (reason: unknown) => void;
  }[] = [];
  let active = 0;
  let maximum = 0;
  const decode = (url: string, signal: AbortSignal) => {
    const pending = deferred<GroundedWalkImage<string>>();
    requests.push({ url, signal, resolve: pending.resolve, reject: pending.reject });
    active += 1;
    maximum = Math.max(maximum, active);
    if (requests.length === 3) thirdStarted.resolve();
    if (requests.length === 5) fifthStarted.resolve();
    return pending.promise.finally(() => { active -= 1; });
  };
  const resolve = (index: number, width = 768, height = 512) => {
    const request = requests[index];
    assert.ok(request);
    request.resolve({ image: request.url, width, height });
  };
  return {
    loader: createGroundedWalkAssetLoader(decode), requests, resolve,
    thirdStarted: thirdStarted.promise, fifthStarted: fifthStarted.promise, maximum: () => maximum,
  };
}

test('requests no grounded artwork before an explicit load', () => {
  // Given an unused loader.
  const state = fixture();
  // When reading readiness.
  const current = state.loader.current();
  // Then reading readiness has no network or decode side effect.
  assert.equal(current, null);
  assert.equal(state.requests.length, 0);
});

test('deduplicates an in-flight load and publishes all three images atomically', async () => {
  // Given one deliberate movement load.
  const state = fixture();
  const pending = state.loader.load();
  // When another movement requests the same artwork while it is loading.
  const duplicate = state.loader.load();
  // Then both requests share a result without exceeding two concurrent decodes.
  assert.equal(duplicate, pending);
  assert.equal(state.requests.length, 2);
  state.resolve(0);
  assert.equal(state.loader.current(), null);
  state.resolve(1);
  await state.thirdStarted;
  assert.equal(state.loader.current(), null);
  state.resolve(2);
  const assets = await pending;
  assert.ok(assets);
  assert.equal(assets, state.loader.current());
  assert.equal(assets, await state.loader.load());
  assert.equal(state.maximum(), 2);
  assert.equal(state.requests.length, 3);
  assert.equal(assets.torso.image, '/assets/cyberpunk/milky-grounded-walk/torso.webp');
  assert.equal(assets.foreleg.image, '/assets/cyberpunk/milky-grounded-walk/foreleg.webp');
  assert.equal(assets.hindleg.image, '/assets/cyberpunk/milky-grounded-walk/hindleg.webp');
  assert.ok(Object.isFrozen(assets));
  assert.ok(Object.isFrozen(assets.torso));
});

test('a failed decode keeps the fallback and allows a later deliberate retry', async () => {
  // Given two active decodes where the first asset fails.
  const state = fixture();
  const pending = state.loader.load();
  const first = state.requests[0];
  assert.ok(first);
  first.reject(new DOMException('Invalid image', 'EncodingError'));
  state.resolve(1);
  assert.equal(await pending, null);
  assert.equal(state.loader.current(), null);
  assert.equal(state.requests.length, 2);
  // When a later explicit load retries the complete set.
  const retry = state.loader.load();
  // Then it does not reuse a partial failed set or retry on its own.
  assert.equal(state.requests.length, 4);
  state.resolve(2);
  state.resolve(3);
  await state.fifthStarted;
  state.resolve(4);
  assert.ok(await retry);
  assert.equal(state.requests.length, 5);
  assert.equal(state.maximum(), 2);
});

test('native image abort clears its source and settles even if decode never finishes', async () => {
  // Given an image decoder that remains pending at the browser boundary.
  const images: FakeImage[] = [];
  class FakeImage {
    src = '';
    decoding = '';
    readonly naturalWidth = 128;
    readonly naturalHeight = 256;
    constructor() { images.push(this); }
    decode() { return new Promise<void>(() => undefined); }
    removeAttribute(name: string) { if (name === 'src') this.src = ''; }
  }
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: FakeImage });
  try {
    const controller = new AbortController();
    const pending = decodeGroundedWalkImage('/torso.webp', controller.signal);
    assert.equal(images[0]?.src, '/torso.webp');
    // When the owning motion cancels that native decode.
    controller.abort();
    // Then cancellation settles promptly instead of leaving a permanently pending load.
    await assert.rejects(pending, { name: 'AbortError' });
    assert.equal(images[0]?.src, '');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'Image', previous);
    else Reflect.deleteProperty(globalThis, 'Image');
  }
});

test('a pre-aborted browser request never constructs or loads an image', async () => {
  // Given a lifecycle that has already ended.
  const signal = AbortSignal.abort();
  // When a stale request reaches the browser decoder.
  const pending = decodeGroundedWalkImage('/torso.webp', signal);
  // Then it reports cancellation before accessing the Image constructor.
  await assert.rejects(pending, { name: 'AbortError' });
});

test('a synchronous decoder failure leaves the existing fallback available', async () => {
  // Given an image construction boundary that throws before returning a promise.
  const loader = createGroundedWalkAssetLoader<string>(() => { throw new DOMException('Unavailable'); });
  // When movement requests the artwork.
  const assets = await loader.load();
  // Then no rejected promise escapes or partial set replaces the fallback.
  assert.equal(assets, null);
  assert.equal(loader.current(), null);
});

for (const dimensions of [[0, 120], [100, 0], [-1, 10], [Number.NaN, 10], [10, Infinity]]) {
  test(`rejects invalid decoded dimensions ${dimensions.join(' × ')}`, async () => {
    // Given decoded image metadata outside the usable image boundary.
    const state = fixture();
    const pending = state.loader.load();
    // When either dimension is invalid.
    state.resolve(0, dimensions[0], dimensions[1]);
    state.resolve(1);
    // Then no partial artwork replaces the existing dog.
    assert.equal(await pending, null);
    assert.equal(state.loader.current(), null);
    assert.equal(state.requests.length, 2);
  });
}

test('abort blocks late publication and does not start another decode batch prematurely', async () => {
  // Given a decoder that does not settle immediately on abort.
  const state = fixture();
  const pending = state.loader.load();
  // When the movement is cancelled and another load is requested before settlement.
  state.loader.abort();
  const retryDuringCancellation = state.loader.load();
  // Then the shared cancelled attempt drains before a new attempt may start.
  assert.equal(retryDuringCancellation, pending);
  assert.ok(state.requests.every(request => request.signal.aborted));
  assert.equal(state.requests.length, 2);
  state.resolve(0);
  state.resolve(1);
  assert.equal(await pending, null);
  assert.equal(state.loader.current(), null);
  assert.equal(state.maximum(), 2);
});

test('destroy during the final decode prevents late publication and future loads', async () => {
  // Given an otherwise valid set with its final image still decoding.
  const state = fixture();
  const pending = state.loader.load();
  state.resolve(0);
  state.resolve(1);
  await state.thirdStarted;
  // When the owner is destroyed before the image resolves.
  state.loader.destroy();
  state.resolve(2);
  // Then neither that completion nor a future call may revive the loader.
  assert.equal(await pending, null);
  assert.equal(await state.loader.load(), null);
  assert.equal(state.loader.current(), null);
  assert.equal(state.requests.length, 3);
});

test('abort keeps a complete cache while destroy releases it', async () => {
  // Given a fully decoded immutable set.
  const state = fixture();
  const pending = state.loader.load();
  state.resolve(0);
  state.resolve(1);
  await state.thirdStarted;
  state.resolve(2);
  const assets = await pending;
  assert.ok(assets);
  // When an idle or hidden owner aborts further loading.
  state.loader.abort();
  // Then cached rendering stays available without additional work.
  assert.equal(state.loader.current(), assets);
  state.loader.destroy();
  assert.equal(state.loader.current(), null);
  assert.equal(await state.loader.load(), null);
});
test('rejects a decoded part with a different canvas aspect before displaying the rig', async () => {
  // Given an unexpectedly replaced part that would distort the shared anatomical canvas.
  const loader = createGroundedWalkAssetLoader(async (url: string) => ({ image: url,
    width: 768, height: url.includes('foreleg') ? 768 : 512 }));
  // When the image decoder succeeds but its artwork geometry is invalid.
  const result = await loader.load();
  // Then the original complete sprite remains the visual fallback.
  assert.equal(result, null); assert.equal(loader.current(), null);
});
