import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { ServerResponse } from 'node:http';
import { once } from 'node:events';
import { createAlbumImages } from './penthouse-album-images.ts';
import type { AlbumPhoto } from './penthouse-album-data.ts';

type PendingDecode = { readonly url: string; readonly succeed: () => void; readonly fail: (error: Error) => void };
const photo: AlbumPhoto = { id: 'milky-01', src: '/assets/penthouse/milky-album/photos/01.webp', width: 360, height: 480, alt: 'Milky resting.' };
const nextPhoto: AlbumPhoto = { ...photo, id: 'milky-02', src: '/assets/penthouse/milky-album/photos/02.webp' };

async function imageRuntime(t: TestContext, reply: (response: ServerResponse) => void = response => {
  response.writeHead(200, { 'Content-Type': 'image/webp' });
  response.end('image bytes supplied to the controlled decoder');
}) {
  const server = createServer((_request, response) => reply(response));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  const originalFetch = globalThis.fetch;
  const requests: RequestInit[] = [];
  t.mock.method(globalThis, 'fetch', (input: string | URL | Request, options: RequestInit = {}) => {
    requests.push(options);
    return originalFetch(typeof input === 'string' ? new URL(input, `http://127.0.0.1:${address.port}`) : input, options);
  });
  const created: string[] = [];
  const revoked: string[] = [];
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  t.mock.method(URL, 'createObjectURL', (blob: Blob) => {
    const url = originalCreate(blob);
    created.push(url);
    return url;
  });
  t.mock.method(URL, 'revokeObjectURL', (url: string) => {
    revoked.push(url);
    originalRevoke(url);
  });
  const decodes: PendingDecode[] = [];
  let waiting: ((value: PendingDecode) => void) | undefined;
  const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: class {
    src = '';
    decode() {
      return new Promise<void>((resolve, reject) => {
        const decode = { url: this.src, succeed: resolve, fail: reject };
        if (waiting) { const receive = waiting; waiting = undefined; receive(decode); }
        else decodes.push(decode);
      });
    }
  } });
  const images = createAlbumImages();
  t.after(() => {
    images.clear();
    if (originalImage) Object.defineProperty(globalThis, 'Image', originalImage);
    else Reflect.deleteProperty(globalThis, 'Image');
  });
  const nextDecode = () => {
    const decode = decodes.shift();
    return decode ? Promise.resolve(decode) : new Promise<PendingDecode>(resolve => { waiting = resolve; });
  };
  return { images, server, requests, created, revoked, nextDecode };
}

test('shares a single HTTP request and decoded image when a photograph is loaded repeatedly', async t => {
  // Given the real HTTP image adapter with a controlled browser decoder.
  const runtime = await imageRuntime(t);
  // When the same photograph is requested before and after decoding.
  const pending = runtime.images.load(photo);
  assert.equal(runtime.images.load(photo), pending);
  const decode = await runtime.nextDecode();
  decode.succeed();
  const result = await pending;
  // Then one request and object URL serve both consumers.
  assert.deepEqual(result, { url: decode.url });
  assert.equal(runtime.images.load(photo), pending);
  assert.equal(runtime.requests.length, 1);
  assert.equal(runtime.requests[0]?.credentials, 'omit');
  assert.equal(runtime.created.length, 1);
});

test('aborts and releases a decoded image when a spread no longer retains it', async t => {
  // Given a loaded photograph retained by the current spread.
  const runtime = await imageRuntime(t);
  const pending = runtime.images.load(photo);
  const decode = await runtime.nextDecode();
  decode.succeed();
  await pending;
  // When navigation retains only the next photograph.
  runtime.images.retain([nextPhoto]);
  // Then the old request lifetime and object URL are released.
  assert.equal(runtime.requests[0]?.signal?.aborted, true);
  assert.deepEqual(runtime.revoked, [decode.url]);
});

test('discards a late decoded image when the album closes during decoding', async t => {
  // Given HTTP has completed but the browser has not finished decoding.
  const runtime = await imageRuntime(t);
  const pending = runtime.images.load(photo);
  const decode = await runtime.nextDecode();
  // When the album closes before that decoder completes.
  runtime.images.clear();
  assert.deepEqual(runtime.revoked, [decode.url]);
  decode.succeed();
  // Then the stale image never becomes available and its URL is released.
  assert.deepEqual(await pending, { error: true });
  assert.equal(runtime.requests[0]?.signal?.aborted, true);
  assert.deepEqual(runtime.revoked, [decode.url]);
});

test('retries a failed photograph when its HTTP endpoint recovers', async t => {
  // Given the photo endpoint first fails and then recovers.
  let available = false;
  const runtime = await imageRuntime(t, response => {
    response.writeHead(available ? 200 : 503, { 'Content-Type': 'image/webp' });
    response.end(available ? 'image bytes' : 'unavailable');
  });
  assert.deepEqual(await runtime.images.load(photo), { error: true });
  available = true;
  // When the visitor retries that photograph.
  const retry = runtime.images.retry(photo);
  const decode = await runtime.nextDecode();
  decode.succeed();
  // Then a fresh request yields an image without retaining the failed lifetime.
  assert.deepEqual(await retry, { url: decode.url });
  assert.equal(runtime.requests.length, 2);
  assert.equal(runtime.requests[0]?.signal?.aborted, true);
});

test('releases the temporary URL when the browser cannot decode a photograph', async t => {
  // Given successful HTTP delivery of an undecodable photograph.
  const runtime = await imageRuntime(t);
  const pending = runtime.images.load(photo);
  const decode = await runtime.nextDecode();
  // When the browser decoder rejects the bytes.
  decode.fail(new DOMException('Invalid photograph', 'EncodingError'));
  // Then the page can offer retry without leaking its temporary URL.
  assert.deepEqual(await pending, { error: true });
  assert.deepEqual(runtime.revoked, [decode.url]);
});

test('cancels the actual HTTP request when the album closes before a response', async t => {
  // Given a real endpoint that leaves the image response pending.
  const runtime = await imageRuntime(t, () => undefined);
  const received = once(runtime.server, 'request');
  const pending = runtime.images.load(photo);
  await received;
  // When the album closes while that request is still in flight.
  runtime.images.clear();
  // Then cancellation settles the load without creating a decoded image URL.
  assert.deepEqual(await pending, { error: true });
  assert.equal(runtime.requests[0]?.signal?.aborted, true);
  assert.deepEqual(runtime.created, []);
});
