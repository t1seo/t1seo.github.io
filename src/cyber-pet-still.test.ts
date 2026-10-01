import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const setup = () => fixture(7829, POSES, RESTS, true, floor, { x: 1440 / 1672, y: 865 / 941 },
  { ballHome: { x: .52, y: .977 }, drag: true, transitions: true });
type Fixture = ReturnType<typeof setup>;
function target(f: Fixture) {
  const element = f.propEl('ball').children.find((entry) => entry.className === 'cyber-pet-toy');
  assert.ok(element);
  return element;
}
function pointer(f: Fixture, type: string, x: number) {
  target(f).dispatchEvent(Object.assign(new Event(type, { cancelable: true }),
    { pointerId: 1, clientX: x, clientY: 919, button: 0, isPrimary: true }));
}
async function ready(f: Fixture) { await f.loadAll(); await f.loadPoses(); await f.loadRest(); await f.loadActivity(); }
function until(f: Fixture, predicate: () => boolean, duration = 60_000) {
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) f.advance(16);
  assert.ok(predicate());
}

test('still mode cancels a held drag and every life task while keeping both native controls accessible', async () => {
  const f = setup();
  try {
    await ready(f);
    pointer(f, 'pointerdown', 870); pointer(f, 'pointermove', 800);
    f.controller.setAnimated(false);
    const dog = f.button.style.transform;
    const ball = f.propEl('ball').style.transform;
    pointer(f, 'pointerup', 760);
    target(f).dispatchEvent(Object.assign(new Event('click'), { detail: 1 }));
    f.advance(120_000);
    assert.equal(f.button.style.transform, dog);
    assert.equal(f.propEl('ball').style.transform, ball);
    assert.equal(f.button.disabled, false);
    assert.equal(target(f).disabled, false);
    assert.equal(f.button.dataset.animated, 'false');
    assert.equal(target(f).capturedPointer, undefined);
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

test('still mode accepts static play and rest poses but refuses a fresh drag and run', async () => {
  const f = setup();
  try {
    await ready(f); f.controller.setAnimated(false);
    const dog = f.button.style.transform;
    const ball = f.propEl('ball').style.transform;
    pointer(f, 'pointerdown', 870); pointer(f, 'pointermove', 700); pointer(f, 'pointerup', 700);
    f.controller.play();
    assert.equal(f.button.dataset.pose, 'play-bow');
    f.controller.run(); f.advance(20_000);
    assert.equal(f.button.dataset.pose, 'play-bow');
    assert.equal(f.button.style.transform, dog);
    assert.equal(f.propEl('ball').style.transform, ball);
    f.controller.sleep();
    assert.equal(f.button.dataset.pose, 'sleep');
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

test('still mode survives late decoded poses and visibility changes without resurrecting motion', async () => {
  const f = setup();
  try {
    f.controller.setAnimated(false);
    await ready(f);
    f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange'));
    f.document.hidden = false; f.document.dispatchEvent(new Event('visibilitychange'));
    f.advance(120_000);
    assert.equal(f.tasks.size, 0);
    assert.equal(f.button.dataset.animated, 'false');
    assert.equal(f.button.disabled, false);
  } finally { f.restore(); }
});

test('still mode stops a bed stretch in place and enabling animation walks Milky home', async () => {
  const f = setup();
  try {
    await ready(f); f.controller.napInBed(); until(f, () => f.button.dataset.pose === 'sleep');
    f.controller.play(); until(f, () => f.button.dataset.motion === 'stretching');
    const position = f.button.style.transform;
    f.controller.setAnimated(false); f.advance(20_000);
    assert.equal(f.button.style.transform, position);
    assert.equal(f.tasks.size, 0);
    assert.notEqual(f.button.dataset.motion, 'stretching');
    f.controller.setAnimated(true);
    assert.equal(f.button.style.transform, position, 'resume cannot teleport off the bed');
    until(f, () => f.button.dataset.motion === 'walking');
    f.advance(160);
    assert.notEqual(f.button.style.transform, position);
    until(f, () => f.button.dataset.motion === 'idle');
  } finally { f.restore(); }
});

test('enabling animation restores throwing once while system reduced motion still takes priority', async () => {
  const f = setup();
  try {
    await ready(f); f.controller.setAnimated(false); f.controller.setAnimated(true); f.controller.setAnimated(true);
    pointer(f, 'pointerdown', 870); pointer(f, 'pointermove', 800); pointer(f, 'pointerup', 800);
    const released = f.propEl('ball').style.transform;
    f.advance(160);
    assert.notEqual(f.propEl('ball').style.transform, released);
    assert.equal(f.button.dataset.animated, 'true');
    assert.ok([...f.tasks.values()].filter((task) => task.kind === 'frame').length <= 1);
    f.media.matches = true; f.media.dispatchEvent(new Event('change'));
    f.controller.setAnimated(false); f.controller.setAnimated(true); f.advance(20_000);
    assert.equal(f.button.dataset.animated, 'false');
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

test('a fresh static click works after still mode cancels a drag without a trailing click', async () => {
  const f = setup();
  try {
    await ready(f);
    pointer(f, 'pointerdown', 870); pointer(f, 'pointermove', 800);
    f.controller.setAnimated(false);
    pointer(f, 'pointerup', 300);
    pointer(f, 'pointerdown', 800); pointer(f, 'pointerup', 800);
    target(f).dispatchEvent(Object.assign(new Event('click'), { detail: 1 }));
    assert.equal(f.button.dataset.pose, 'play-bow');
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});
