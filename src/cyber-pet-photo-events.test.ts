import assert from 'node:assert/strict';
import test from 'node:test';
import type { MilkyPhotoMotionEvent } from './cyber-pet.ts';
import { fixture } from './cyber-pet-test-support.ts';

const setup = () => fixture(7829, ['blink'], ['sit', 'drowsy', 'sleep'], true,
  undefined, undefined, undefined, { photoMotions: true });

test('availability refreshes an already mounted drawer after the base art becomes ready', async t => {
  // Given a controller whose required base images are still loading.
  const f = setup(); t.after(f.restore);
  const availability: boolean[] = [];
  f.controller.subscribePhotoMotions(event => {
    if (event.type === 'availability') availability.push(f.controller.canPhotoMotion('tilt'));
  });
  assert.equal(f.controller.canPhotoMotion('tilt'), false);
  // When the real controller receives all required image decodes.
  await f.loadAll();
  // Then its subscriber can enable the drawer without resize or reopening.
  assert.equal(availability.at(-1), true);
});

test('sleep art readiness updates the dependent photo capability', async t => {
  // Given base art ready but the optional sleep artwork pending.
  const f = setup(); t.after(f.restore); await f.loadAll();
  const availability: boolean[] = [];
  f.controller.subscribePhotoMotions(event => {
    if (event.type === 'availability') availability.push(f.controller.canPhotoMotion('sleepy-peek'));
  });
  assert.equal(f.controller.canPhotoMotion('sleepy-peek'), false);
  // When sleep art decodes.
  await f.load('milky-rest-sleep.webp');
  // Then the subscriber sees the new capability.
  assert.deepEqual(availability, [true]);
});

test('a failed rest image removes its photo capability through the subscription', async t => {
  // Given a previously available sleep-dependent action.
  const f = setup(); t.after(f.restore); await f.loadAll(); await f.loadRest(['sleep']);
  const availability: boolean[] = [];
  f.controller.subscribePhotoMotions(event => {
    if (event.type === 'availability') availability.push(f.controller.canPhotoMotion('sleepy-peek'));
  });
  // When the optional image reports an error.
  f.asset('milky-rest-sleep.webp').dispatchEvent(new Event('error'));
  // Then the subscriber sees the capability become unavailable.
  assert.deepEqual(availability, [false]);
});

test('a rest decode rejection also refreshes capability availability', async t => {
  // Given a decode that fails after its load event.
  const f = setup(); t.after(f.restore); await f.loadAll();
  f.asset('milky-rest-sleep.webp').decodeFails = true;
  const events: MilkyPhotoMotionEvent[] = [];
  f.controller.subscribePhotoMotions(event => events.push(event));
  // When the browser rejects decoding the optional image.
  await f.load('milky-rest-sleep.webp');
  // Then the drawer receives a readiness update rather than remaining stale.
  assert.deepEqual(events, [{ type: 'availability' }]);
  assert.equal(f.controller.canPhotoMotion('sleepy-peek'), false);
});

test('an accepted cold request publishes loading and then ready after atomic decoding', async t => {
  // Given the real pet ready with a cold photo group.
  const f = setup(); t.after(f.restore); await f.loadAll();
  const events: MilkyPhotoMotionEvent[] = [];
  f.controller.subscribePhotoMotions(event => events.push(event));
  // When an explicit tilt is requested and both frames decode.
  assert.equal(f.controller.photoMotion('tilt'), true);
  await f.load('tilt-near.webp', 768, 512);
  await f.load('tilt-full.webp', 768, 512);
  // Then the exact request receives its two loading outcomes.
  assert.deepEqual(events, [
    { type: 'load', kind: 'tilt', state: 'loading' },
    { type: 'load', kind: 'tilt', state: 'ready' },
  ]);
});

test('a cached explicit request publishes ready without another network request', async t => {
  // Given a fully cached tilt group and a new subscriber.
  const f = setup(); t.after(f.restore); await f.loadAll();
  f.controller.photoMotion('tilt');
  await f.load('tilt-near.webp', 768, 512); await f.load('tilt-full.webp', 768, 512);
  const count = f.document.images.length;
  const events: MilkyPhotoMotionEvent[] = [];
  f.controller.subscribePhotoMotions(event => events.push(event));
  // When the visitor explicitly requests the cached action.
  f.controller.photoMotion('tilt');
  // Then feedback clears immediately and the cached images are reused.
  assert.deepEqual(events, [{ type: 'load', kind: 'tilt', state: 'ready' }]);
  assert.equal(f.document.images.length, count);
});

test('a failed request publishes its error and a deliberate retry publishes loading again', async t => {
  // Given a requested tilt group.
  const f = setup(); t.after(f.restore); await f.loadAll();
  f.controller.photoMotion('tilt');
  const events: MilkyPhotoMotionEvent[] = [];
  f.controller.subscribePhotoMotions(event => events.push(event));
  // When one frame fails and the visitor deliberately retries.
  f.asset('tilt-near.webp').dispatchEvent(new Event('error'));
  f.controller.photoMotion('tilt');
  // Then both outcomes reach the subscribed controls in order.
  assert.deepEqual(events, [
    { type: 'load', kind: 'tilt', state: 'failed' },
    { type: 'load', kind: 'tilt', state: 'loading' },
  ]);
});

test('a canceled request still publishes load completion without starting its pose', async t => {
  // Given a cold request invalidated when settings deactivate the pet.
  const f = setup(); t.after(f.restore); await f.loadAll();
  f.controller.photoMotion('tilt'); f.controller.setActive(false);
  const events: MilkyPhotoMotionEvent[] = [];
  f.controller.subscribePhotoMotions(event => events.push(event));
  // When the outstanding art finishes in the inactive context.
  await f.load('tilt-near.webp', 768, 512); await f.load('tilt-full.webp', 768, 512);
  // Then the drawer clears loading while the canceled motion stays stopped.
  assert.deepEqual(events, [{ type: 'load', kind: 'tilt', state: 'ready' }]);
  assert.equal(f.button.dataset.pose, 'idle');
  assert.equal(f.tasks.size, 0);
});

test('animation lifecycle changes publish the current availability', async t => {
  // Given a subscribed controller with ready base art.
  const f = setup(); t.after(f.restore); await f.loadAll();
  const availability: boolean[] = [];
  f.controller.subscribePhotoMotions(event => {
    if (event.type === 'availability') availability.push(f.controller.canPhotoMotion('tilt'));
  });
  // When still mode is enabled and then disabled.
  f.controller.setAnimated(false); f.controller.setAnimated(true);
  // Then controls track each availability change.
  assert.deepEqual(availability, [false, true]);
});

test('unsubscribe and destroy release subscribers and ignore later image callbacks', async t => {
  // Given two subscribers, one already unsubscribed and a pending photo load.
  const f = setup(); t.after(f.restore); await f.loadAll();
  const unsubscribed: MilkyPhotoMotionEvent[] = [];
  const remove = f.controller.subscribePhotoMotions(event => unsubscribed.push(event));
  remove(); remove(); f.controller.photoMotion('tilt');
  const destroyed: MilkyPhotoMotionEvent[] = [];
  f.controller.subscribePhotoMotions(event => destroyed.push(event));
  // When the controller is destroyed before optional images finish.
  f.controller.destroy();
  const removeLate = f.controller.subscribePhotoMotions(event => destroyed.push(event));
  await f.load('tilt-near.webp', 768, 512); await f.load('tilt-full.webp', 768, 512);
  await f.load('milky-rest-sleep.webp'); removeLate();
  // Then no retained subscriber receives a late callback.
  assert.deepEqual(unsubscribed, []);
  assert.deepEqual(destroyed, []);
  assert.equal(f.tasks.size, 0);
});
