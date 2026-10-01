import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const home = { x: .63, y: .977 };
const setup = () => fixture(7829, POSES, RESTS, true, floor, undefined, { ballHome: home });
type Fixture = ReturnType<typeof setup>;
const ball = (f: Fixture) => f.propEl('ball');
function target(f: Fixture) {
  const element = ball(f).children.find((entry) => entry.className === 'cyber-pet-toy');
  assert.ok(element, 'one native ball button exists');
  return element;
}
function point(transform: unknown) {
  const value = String(transform).match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
  assert.ok(value);
  return { x: Number(value[1]), y: Number(value[2]) };
}
async function ready(f: Fixture) {
  await f.loadAll();
  await f.loadActivity();
  f.button.focusVisible = true;
  f.button.dispatchEvent(new Event('focus'));
}
function until(f: Fixture, predicate: () => boolean, duration = 60_000) {
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) f.advance(16);
  assert.ok(predicate(), 'the explicit game completes within a finite duration');
}

test('a decoded persistent ball is one native accessible control at its floor home', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(ball(f).dataset.visible, 'true');
    assert.equal(target(f).tagName, 'BUTTON');
    assert.equal(target(f).type, 'button');
    assert.equal(target(f).attributes['aria-label'], 'Play ball with Milky');
    assert.equal(target(f).disabled, false);
    assert.notEqual(f.propsLayer().attributes['aria-hidden'], 'true');
    assert.equal(f.propsLayer().children.filter((entry) => entry.dataset.prop === 'ball').length, 1);
    assert.deepEqual(point(ball(f).style.transform), { x: 1053.36, y: 919.36 });
    assert.equal([...f.tasks.values()].filter((task) => task.kind === 'frame').length, 0);
  } finally { f.restore(); }
});

test('direct ball activation approaches the same ball and nudges only at actual paw contact', async () => {
  const f = setup();
  try {
    await ready(f);
    const start = ball(f).style.transform;
    target(f).dispatchEvent(new Event('click'));
    assert.equal(ball(f).style.transform, start, 'click does not teleport the toy');
    const frames = new Set<string>();
    until(f, () => {
      if (f.button.dataset.motion === 'walking') frames.add(f.button.dataset.frame);
      return f.button.dataset.pose === 'play-reach';
    });
    const gap = Math.abs(point(ball(f).style.transform).x - point(f.button.style.transform).x);
    const reach = .12 * .847 * (716.5 / 1536) * 1672;
    assert.ok(Math.abs(gap - reach) < 1, 'the raised paw reaches the ball before it moves');
    assert.ok(frames.size >= 4, 'a genuine gait approaches the resting toy');
    f.advance(160);
    assert.notEqual(ball(f).style.transform, start, 'the contacted ball visibly hops and rolls');
    until(f, () => f.button.dataset.motion === 'idle');
    assert.equal(ball(f).dataset.visible, 'true');
    assert.equal([...f.tasks.values()].filter((task) => task.kind === 'frame').length, 0);
  } finally { f.restore(); }
});

test('the public Play action retains the same ball through interruption and restart', async () => {
  const f = setup();
  try {
    await ready(f);
    await f.loadRest();
    f.controller.play();
    until(f, () => f.button.dataset.pose === 'play-reach');
    f.advance(160);
    const rollingPosition = point(ball(f).style.transform);
    f.controller.sit();
    assert.deepEqual(point(ball(f).style.transform), rollingPosition);
    assert.equal(ball(f).style['--milky-prop-lift'], '0.00px');
    assert.equal(ball(f).dataset.visible, 'true');
    f.controller.play();
    assert.deepEqual(point(ball(f).style.transform), rollingPosition);
    until(f, () => f.button.dataset.motion === 'idle');
    assert.equal(ball(f).dataset.visible, 'true');
  } finally { f.restore(); }
});

test('legacy rooms still hide their temporary ball after play', async () => {
  const f = fixture();
  try {
    await ready(f);
    f.controller.play();
    until(f, () => f.button.dataset.motion === 'idle');
    assert.equal(ball(f).dataset.visible, 'false');
    assert.equal(f.propsLayer().attributes['aria-hidden'], 'true');
    assert.equal(ball(f).children.some((entry) => entry.className === 'cyber-pet-toy'), false);
  } finally { f.restore(); }
});

test('explicit reduced-motion play gives a still bow with an unmoving persistent ball', async () => {
  const f = setup();
  try {
    await ready(f);
    f.media.matches = true;
    f.media.dispatchEvent(new Event('change'));
    const location = ball(f).style.transform;
    const dog = f.button.style.transform;
    target(f).dispatchEvent(new Event('click'));
    f.advance(20_000);
    assert.equal(f.button.dataset.pose, 'play-bow');
    assert.equal(f.button.style.transform, dog);
    assert.equal(ball(f).style.transform, location);
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

for (const reason of ['hidden', 'inactive', 'crop'] as const) {
  test(`the ball target stops and restores safely after ${reason}`, async () => {
    const f = setup();
    try {
      await ready(f);
      f.controller.play();
      until(f, () => f.button.dataset.pose === 'play-reach');
      f.advance(100);
      if (reason === 'hidden') { f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange')); }
      else if (reason === 'inactive') f.controller.setActive(false);
      else { f.scene.bounds.height = 500; f.resize(); }
      assert.equal(target(f).disabled, true);
      assert.equal(ball(f).dataset.visible, 'false');
      assert.equal(f.tasks.size, 0);
      if (reason === 'hidden') { f.document.hidden = false; f.document.dispatchEvent(new Event('visibilitychange')); }
      else if (reason === 'inactive') f.controller.setActive(true);
      else { f.scene.bounds.height = 941; f.resize(); }
      assert.equal(target(f).disabled, false);
      assert.equal(ball(f).dataset.visible, 'true');
      assert.equal(ball(f).style['--milky-prop-lift'], '0.00px');
    } finally { f.restore(); }
  });
}

test('an incomplete or failed play asset never exposes a dead ball target', async () => {
  const f = setup();
  try {
    await f.loadAll();
    await f.load('milky-prop-ball.webp', 512, 512);
    assert.equal(target(f).disabled, true);
    assert.equal(ball(f).dataset.visible, 'false');
    await f.loadActivity();
    assert.equal(target(f).disabled, false);
    f.asset('milky-play-bow.webp').dispatchEvent(new Event('error'));
    assert.equal(target(f).disabled, true);
    assert.equal(ball(f).dataset.visible, 'false');
  } finally { f.restore(); }
});

test('destroy removes the target and cancels the rolling game', async () => {
  const f = setup();
  try {
    await ready(f);
    target(f).dispatchEvent(new Event('click'));
    const props = f.propsLayer();
    f.controller.destroy();
    target(f).dispatchEvent(new Event('click'));
    assert.equal(props.removed, true);
    assert.equal(f.tasks.size, 0);
    assert.equal(target(f).disabled, true);
  } finally { f.restore(); }
});
