import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const home = { x: .63, y: .977 };
const bed = { x: 1440 / 1672, y: 865 / 941 };
const setup = () => fixture(7829, POSES, RESTS, true, floor, bed, { ballHome: home });
type Fixture = ReturnType<typeof setup>;
function target(f: Fixture) {
  const element = f.propEl('ball').children.find((entry) => entry.className === 'cyber-pet-toy');
  assert.ok(element);
  return element;
}
function point(transform: unknown) {
  const value = String(transform).match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
  assert.ok(value);
  return { x: Number(value[1]), y: Number(value[2]) };
}
async function ready(f: Fixture) { await f.loadAll(); await f.loadActivity(); await f.loadRest(); }
function until(f: Fixture, predicate: () => boolean, duration = 60_000) {
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) f.advance(16);
  assert.ok(predicate());
}

test('focusing the native ball control keeps the resting toy available without autonomous play', async () => {
  const f = setup();
  try {
    await ready(f);
    target(f).focusVisible = true;
    target(f).dispatchEvent(new Event('focus'));
    const location = f.propEl('ball').style.transform;
    f.advance(120_000);
    assert.equal(f.propEl('ball').style.transform, location);
    assert.equal(f.button.dataset.motion, 'idle');
  } finally { f.restore(); }
});

test('repeated direct clicks during a roll restart one bounded game at its current position', async () => {
  const f = setup();
  try {
    await ready(f);
    target(f).dispatchEvent(new Event('click'));
    until(f, () => f.button.dataset.pose === 'play-reach');
    f.advance(180);
    const location = f.propEl('ball').style.transform;
    for (let click = 0; click < 8; click++) target(f).dispatchEvent(new Event('click'));
    assert.equal(f.propEl('ball').style.transform, location);
    assert.ok([...f.tasks.values()].filter((task) => task.kind === 'frame').length <= 1);
    until(f, () => f.button.dataset.motion === 'idle');
    const final = point(f.propEl('ball').style.transform);
    assert.ok(final.x >= floor.left * 1672 && final.x <= floor.right * 1672);
    assert.ok(final.y >= floor.top * 941 && final.y <= floor.bottom * 941);
    assert.equal(f.propEl('ball').dataset.visible, 'true');
  } finally { f.restore(); }
});

test('a sleeping Milky wakes and walks out of her bed before reaching the floor ball', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.napInBed(), true);
    until(f, () => f.button.dataset.pose === 'sleep');
    const ballLocation = f.propEl('ball').style.transform;
    const sleepingLocation = f.button.style.transform;
    target(f).dispatchEvent(new Event('click'));
    assert.equal(f.button.style.transform, sleepingLocation, 'activation cannot teleport her off the cushion');
    assert.equal(f.propEl('ball').style.transform, ballLocation);
    assert.equal(f.button.dataset.pose, 'wake');
    until(f, () => f.button.dataset.pose === 'play-bow');
    assert.equal(f.button.dataset.bed, 'false');
    assert.ok(point(f.button.style.transform).y >= floor.top * 941);
    assert.equal(f.propEl('ball').style.transform, ballLocation, 'the ball waits on the floor during the bed exit');
  } finally { f.restore(); }
});

test('a resting ball re-renders at the new room size without starting an animation frame', async () => {
  const f = setup();
  try {
    await ready(f);
    f.scene.bounds = { left: 0, top: 0, width: 836, height: 470.5 };
    f.host.bounds = { ...f.scene.bounds };
    f.host.clientWidth = 836;
    f.host.clientHeight = 470.5;
    f.resize();
    assert.deepEqual(point(f.propEl('ball').style.transform), { x: 526.68, y: 459.68 });
    assert.equal(target(f).disabled, false);
    assert.equal([...f.tasks.values()].filter((task) => task.kind === 'frame').length, 0);
  } finally { f.restore(); }
});

test('a required gait failure demotes Milky and withdraws the v4 toy interaction', async () => {
  const f = setup();
  try {
    await ready(f);
    f.asset('milky-v4-step-3.webp').dispatchEvent(new Event('error'));
    await f.loadV3();
    assert.equal(f.button.dataset.identity, 'v3');
    assert.equal(f.propEl('ball').dataset.visible, 'false');
    assert.equal(target(f).disabled, true);
    target(f).dispatchEvent(new Event('click'));
    assert.notEqual(f.button.dataset.motion, 'playing');
  } finally { f.restore(); }
});

test('a rejected ball decode never creates a reachable empty control', async () => {
  const f = setup();
  try {
    await f.loadAll();
    f.asset('milky-prop-ball.webp').decodeFails = true;
    await f.loadActivity();
    assert.equal(f.propEl('ball').dataset.visible, 'false');
    assert.equal(target(f).hidden, true);
    assert.equal(target(f).disabled, true);
  } finally { f.restore(); }
});
