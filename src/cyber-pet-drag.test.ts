import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const setup = () => fixture(7829, POSES, RESTS, true, floor, { x: 1440 / 1672, y: 865 / 941 }, { ballHome: { x: .52, y: .977 }, drag: true });
type Fixture = ReturnType<typeof setup>;
function target(f: Fixture) {
  const element = f.propEl('ball').children.find((entry) => entry.className === 'cyber-pet-toy');
  assert.ok(element);
  return element;
}
function point(f: Fixture, dog = false) {
  const transform = dog ? f.button.style.transform : f.propEl('ball').style.transform;
  const value = String(transform).match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
  assert.ok(value);
  return { x: Number(value[1]), y: Number(value[2]) };
}
function pointer(f: Fixture, type: string, x: number, y = 919, id = 1) {
  target(f).dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { pointerId: id, clientX: x, clientY: y, button: 0, isPrimary: true }));
}
async function ready(f: Fixture) {
  await f.loadAll(); await f.loadActivity(); await f.loadRest(); await f.loadTrot();
  target(f).focusVisible = true; target(f).dispatchEvent(new Event('focus'));
}
function until(f: Fixture, predicate: () => boolean, duration = 60_000) {
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) f.advance(16);
  assert.ok(predicate(), 'bounded action completes');
}

test('dragging moves the single ball on the floor and release rolls in the gesture direction', async () => {
  const f = setup();
  try {
    await ready(f);
    const initial = point(f);
    pointer(f, 'pointerdown', 870); pointer(f, 'pointermove', 800);
    assert.ok(point(f).x < initial.x - 60);
    const release = point(f);
    pointer(f, 'pointerup', 800);
    assert.equal(target(f).capturedPointer, undefined);
    target(f).dispatchEvent(Object.assign(new Event('click'), { detail: 1 }));
    f.advance(160);
    assert.ok(point(f).x < release.x - 5, 'native trailing click cannot replace the throw');
    assert.ok(f.button.dataset.motion === 'walking' || f.button.dataset.motion === 'turning');
    const frames = new Set<string>();
    until(f, () => { if (f.button.dataset.motion === 'walking') frames.add(f.button.dataset.frame); return f.button.dataset.motion === 'idle'; });
    assert.ok(frames.size >= 4);
    assert.equal(f.propEl('ball').dataset.visible, 'true');
    assert.equal([...f.tasks.values()].filter((entry) => entry.kind === 'frame').length, 0);
  } finally { f.restore(); }
});

test('sub-threshold motion remains a click and a later keyboard click stays usable after a drag', async () => {
  const f = setup();
  try {
    await ready(f);
    const initial = point(f);
    pointer(f, 'pointerdown', 870); pointer(f, 'pointermove', 873); pointer(f, 'pointerup', 873);
    assert.deepEqual(point(f), initial);
    target(f).dispatchEvent(Object.assign(new Event('click'), { detail: 1 }));
    until(f, () => f.button.dataset.pose === 'play-reach');
    pointer(f, 'pointerdown', 800); pointer(f, 'pointermove', 740); pointer(f, 'pointerup', 740);
    target(f).dispatchEvent(Object.assign(new Event('click'), { detail: 0 }));
    until(f, () => f.button.dataset.pose === 'play-reach');
  } finally { f.restore(); }
});

for (const reason of ['cancel', 'hidden', 'inactive', 'reduced', 'resize', 'destroy'] as const) {
  test(`a held drag cleans up after ${reason} without a stale release launching it`, async () => {
    const f = setup();
    try {
      await ready(f);
      pointer(f, 'pointerdown', 870); pointer(f, 'pointermove', 800);
      if (reason === 'cancel') pointer(f, 'pointercancel', 800);
      else if (reason === 'hidden') { f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange')); }
      else if (reason === 'inactive') f.controller.setActive(false);
      else if (reason === 'reduced') { f.media.matches = true; f.media.dispatchEvent(new Event('change')); }
      else if (reason === 'resize') f.resize();
      else f.controller.destroy();
      const stopped = point(f);
      pointer(f, 'pointerup', 720);
      target(f).dispatchEvent(Object.assign(new Event('click'), { detail: 1 }));
      f.advance(1000);
      assert.deepEqual(point(f), stopped);
      assert.equal(target(f).capturedPointer, undefined);
      assert.equal([...f.tasks.values()].filter((entry) => entry.kind === 'frame').length, 0);
    } finally { f.restore(); }
  });
}

test('an extreme drag is clamped to visible floor and a second pointer cannot steal it', async () => {
  const f = setup();
  try {
    await ready(f);
    pointer(f, 'pointerdown', 870); pointer(f, 'pointermove', 8000, -3000);
    const held = point(f);
    assert.ok(held.x <= floor.right * 1672 + .01 && held.y >= floor.top * 941 - .01);
    pointer(f, 'pointerdown', 500, 919, 2); pointer(f, 'pointermove', 200, 919, 2);
    assert.deepEqual(point(f), held);
    pointer(f, 'pointerup', 8000, -3000);
    until(f, () => f.button.dataset.motion === 'idle');
    assert.ok(point(f).x >= floor.left * 1672 && point(f).x <= floor.right * 1672);
  } finally { f.restore(); }
});

test('throwing from a bed nap wakes Milky and preserves the rolling ball until the chase', async () => {
  const f = setup();
  try {
    await ready(f); assert.equal(f.controller.napInBed(), true);
    until(f, () => f.button.dataset.pose === 'sleep');
    const sleeping = point(f, true);
    pointer(f, 'pointerdown', 870); pointer(f, 'pointermove', 825); pointer(f, 'pointerup', 825);
    assert.deepEqual(point(f, true), sleeping);
    assert.equal(f.button.dataset.pose, 'wake');
    f.advance(160);
    assert.ok(point(f).x < 825);
    until(f, () => f.button.dataset.bed === 'false');
    until(f, () => f.button.dataset.motion === 'idle');
    assert.ok(point(f, true).y >= floor.top * 941);
    assert.equal(f.propEl('ball').dataset.visible, 'true');
  } finally { f.restore(); }
});
