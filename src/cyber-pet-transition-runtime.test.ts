import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const setup = () => fixture(7829, POSES, RESTS, true, floor, { x: 1440 / 1672, y: 865 / 941 }, { ballHome: { x: .52, y: .977 }, transitions: true });
type Fixture = ReturnType<typeof setup>;
function until(f: Fixture, predicate: () => boolean, duration = 60_000) {
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) f.advance(16);
  assert.ok(predicate());
}
async function ready(f: Fixture) { await f.loadAll(); await f.loadForward(); await f.loadRest(); await f.loadActivity(); }

test('an ordinary walk arrives with a brief existing camera glance without moving the feet', async () => {
  const f = setup();
  try {
    await ready(f); await f.loadPoses();
    f.key('ArrowLeft'); until(f, () => f.button.dataset.motion === 'walking');
    until(f, () => f.button.dataset.motion === 'settling');
    const feet = f.button.style.transform;
    assert.equal(f.button.dataset.gaze, 'camera');
    assert.equal(f.button.dataset.pose, 'attend');
    f.advance(200);
    assert.equal(f.button.style.transform, feet);
    until(f, () => f.button.dataset.motion === 'idle', 500);
  } finally { f.restore(); }
});

test('unshipped head-turn art falls back to the actual camera idle without a missing request', async () => {
  const f = setup();
  try {
    await ready(f);
    f.key('ArrowRight'); until(f, () => f.button.dataset.motion === 'walking');
    until(f, () => f.button.dataset.motion === 'settling');
    assert.equal(f.button.dataset.gaze, 'camera');
    assert.equal(f.button.dataset.pose, 'idle');
  } finally { f.restore(); }
});

for (const trigger of ['explicit', 'natural'] as const) {
  test(`a ${trigger} bed wake briefly stretches in place before leaving the cushion`, async () => {
    const f = setup();
    try {
      await ready(f); assert.equal(f.controller.napInBed(), true);
      until(f, () => f.button.dataset.pose === 'sleep');
      const feet = f.button.style.transform;
      if (trigger === 'explicit') f.controller.play();
      until(f, () => f.button.dataset.motion === 'stretching');
      assert.equal(f.button.dataset.pose, 'play-bow');
      assert.equal(f.button.dataset.bed, 'true');
      assert.equal(f.button.style.transform, feet);
      f.advance(300);
      assert.equal(f.button.style.transform, feet);
      until(f, () => f.button.dataset.motion === 'walking', 2000);
      assert.equal(f.button.dataset.bed, 'false');
    } finally { f.restore(); }
  });
}

test('hiding during a bed stretch cancels the pose timer and every animation frame', async () => {
  const f = setup();
  try {
    await ready(f); f.controller.napInBed();
    until(f, () => f.button.dataset.pose === 'sleep');
    f.controller.play(); until(f, () => f.button.dataset.motion === 'stretching');
    f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange'));
    f.advance(10_000);
    assert.equal(f.tasks.size, 0);
    assert.notEqual(f.button.dataset.motion, 'stretching');
  } finally { f.restore(); }
});

test('reduced motion never starts a wake stretch or a delayed glance', async () => {
  const f = setup();
  try {
    await ready(f); f.media.matches = true; f.media.dispatchEvent(new Event('change'));
    f.controller.sleep(); f.controller.play(); f.key('ArrowRight');
    f.advance(10_000);
    assert.notEqual(f.button.dataset.motion, 'stretching');
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

test('the shipped three-pose rest set still stretches without requesting absent wake art', async () => {
  const f = fixture(7829, POSES, ['sit', 'drowsy', 'sleep'], true, floor,
    { x: 1440 / 1672, y: 865 / 941 }, { ballHome: { x: .52, y: .977 }, transitions: true });
  try {
    await f.loadAll(); await f.loadRest(['sit', 'drowsy', 'sleep']); await f.loadActivity();
    f.controller.napInBed(); until(f, () => f.button.dataset.pose === 'sleep');
    f.controller.play();
    assert.equal(f.button.dataset.motion, 'stretching');
    assert.equal(f.button.dataset.pose, 'play-bow');
    assert.equal(f.document.images.some((image) => image.src.endsWith('milky-rest-wake.webp')), false);
    until(f, () => f.button.dataset.motion === 'walking', 2000);
  } finally { f.restore(); }
});
