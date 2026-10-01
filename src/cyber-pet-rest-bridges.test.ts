import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, MILKY_PHOTO_REST } from './cyber-pet-test-support.ts';

const setup = () => fixture(7829, ['blink'], MILKY_PHOTO_REST, true,
  undefined, undefined, undefined, { photoMotions: true });

function until(f: ReturnType<typeof fixture>, predicate: () => boolean, duration = 10_000) {
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) f.advance(16);
  assert.ok(predicate(), 'the real controller reaches the requested posture');
}

test('the active room requests and registers both authored rest bridges', t => {
  // Given the controller mounted with the active room's explicit rest set.
  const f = setup(); t.after(f.restore);
  const idle = f.asset('milky-v4-idle.webp');
  // When the two newly shipped bridge images are registered.
  for (const [name, dx, dy] of [['sitdown', -81.5, -3], ['wake', -135, -2]] as const) {
    const image = f.asset(`milky-rest-${name}.webp`);
    // Then their native support anchor lands on the same floor point as idle.
    assert.equal(image.style['--milky-art-scale'], idle.style['--milky-art-scale']);
    const x = Number.parseFloat(String(image.style['--milky-frame-x']));
    const y = Number.parseFloat(String(image.style['--milky-frame-y']));
    const idleX = Number.parseFloat(String(idle.style['--milky-frame-x']));
    const idleY = Number.parseFloat(String(idle.style['--milky-frame-y']));
    assert.ok(Math.abs((x - idleX) / 100 * 1536 / .847 - dx) < 1e-8);
    assert.ok(Math.abs((y - idleY) / 100 * 1024 / .847 - dy) < 1e-8);
  }
});

test('a production sit request bends the hindquarters before the seated pose', async t => {
  // Given all actually shipped active-room art decoded.
  const f = setup(); t.after(f.restore);
  await f.loadAll(); await f.loadRest();
  const feet = f.button.style.transform;
  // When the visitor asks Milky to sit.
  f.controller.sit();
  // Then sitting passes through the authored bridge without moving the floor anchor.
  assert.equal(f.button.dataset.pose, 'sitdown');
  assert.equal(f.button.style.transform, feet);
  until(f, () => f.button.dataset.pose === 'sit');
  assert.equal(f.button.style.transform, feet);
});

test('a production sleeping dog pushes up through the wake bridge before walking', async t => {
  // Given Milky sleeping with the real shipped wake art decoded.
  const f = setup(); t.after(f.restore);
  await f.loadAll(); await f.loadRest(); f.controller.sleep();
  until(f, () => f.button.dataset.pose === 'sleep');
  const feet = f.button.style.transform;
  // When a walking direction is requested.
  f.key('ArrowRight');
  // Then the authored push-up precedes standing and the first walking frame.
  assert.equal(f.button.dataset.pose, 'wake');
  assert.equal(f.button.style.transform, feet);
  until(f, () => f.button.dataset.pose === 'idle');
  assert.equal(f.button.style.transform, feet);
  until(f, () => f.button.dataset.motion === 'walking');
});
