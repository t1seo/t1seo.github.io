import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';
import { MILKY_STUDY_FLOOR } from './penthouse-atmosphere.ts';

const setup = (enabled = true) => fixture(7829, POSES, RESTS, true, MILKY_STUDY_FLOOR,
  { x: 1440 / 1672, y: 865 / 941 }, { ballHome: { x: .52, y: .977 }, transitions: true },
  enabled ? { photoMotions: true, groundedWalk: true } : undefined);
type Fixture = ReturnType<typeof setup>;
const figure = (f: Fixture) => {
  const result = f.button.children.find(element => element.className === 'cyber-pet-figure');
  assert.ok(result);
  return result;
};
const canvas = (f: Fixture) => {
  const result = figure(f).children.find(element => element.tagName === 'CANVAS');
  assert.ok(result);
  return result;
};
const frames = (f: Fixture) => [...f.tasks.values()].filter(task => task.kind === 'frame').length;
function until(f: Fixture, condition: () => boolean, duration = 20_000) {
  for (let elapsed = 0; elapsed < duration && !condition(); elapsed += 16) {
    assert.ok(frames(f) <= 1, 'the controller owns at most one animation frame');
    f.advance(16);
  }
  assert.ok(condition(), 'the requested state completes within its bounded duration');
}
async function ready(f: Fixture) { await f.loadAll(); await f.loadForward(); await f.loadRest(); }
async function warmWalk(f: Fixture) {
  await ready(f);
  f.key('ArrowRight');
  await f.loadGrounded();
  until(f, () => f.button.dataset.motion === 'walking');
  f.advance(16);
  assert.equal(figure(f).attributes['data-grounded'], 'true');
}

test('the archive controller creates no grounded canvas or requests', async () => {
  // Given the archived opt-out controller with its normal walking art.
  const f = setup(false);
  try {
    await ready(f);
    // When the visitor starts a real walk.
    f.key('ArrowRight');
    until(f, () => f.button.dataset.motion === 'walking');
    // Then the ordinary visible sprite walk remains independent of the new renderer.
    assert.equal(figure(f).children.some(element => element.tagName === 'CANVAS'), false);
    assert.equal(f.decoderImages.length, 0);
    assert.equal(f.button.dataset.pose, 'side');
  } finally { f.restore(); }
});

test('the opted-in renderer stays hidden and makes no requests before movement intent', async () => {
  // Given an opted-in controller on the study floor.
  const f = setup();
  try {
    await ready(f);
    // When the sidebar checks another optional motion capability.
    f.controller.canPhotoMotion('tilt');
    // Then the grounded rig has only a hidden surface and no eager image requests.
    assert.equal(canvas(f).hidden, true);
    assert.equal(f.decoderImages.length, 0);
    assert.equal(f.painting.draws, 0);
  } finally { f.restore(); }
});

test('art arriving during a sprite walk only activates on the next leg', async () => {
  // Given a first leg that started before its optional art decoded.
  const f = setup();
  try {
    await ready(f); f.key('ArrowRight');
    until(f, () => f.button.dataset.motion === 'walking');
    assert.equal(f.decoderImages.length, 2);
    // When the complete rig arrives during that leg.
    await f.loadGrounded();
    // Then no mid-step renderer swap occurs, and a later leg uses the cached rig.
    f.advance(160);
    assert.equal(canvas(f).hidden, true);
    assert.equal(f.painting.draws, 0);
    until(f, () => f.button.dataset.motion === 'idle');
    f.key('ArrowLeft');
    until(f, () => f.button.dataset.motion === 'walking');
    f.advance(16);
    assert.equal(canvas(f).hidden, false);
    assert.equal(f.decoderImages.length, 3);
    assert.ok(f.painting.draws > 0);
  } finally { f.restore(); }
});

test('a completed grounded leg keeps its planted drawing through idle without a camera swap', async () => {
  // Given a ready grounded leg with the existing arrival transitions enabled.
  const f = setup();
  try {
    await warmWalk(f);
    // When the leg reaches its endpoint and settles.
    until(f, () => f.button.dataset.motion === 'idle');
    // Then the last grounded drawing remains visible and requires no idle animation loop.
    assert.equal(figure(f).attributes['data-grounded'], 'true');
    assert.equal(canvas(f).hidden, false);
    assert.equal(f.button.dataset.gaze, 'forward');
    assert.equal(f.button.dataset.pose, 'idle');
    const draws = f.painting.draws;
    f.advance(300);
    assert.equal(f.painting.draws, draws);
    assert.equal(frames(f), 0);
  } finally { f.restore(); }
});

test('a same-heading keyboard retarget carries the visible rig with one frame loop', async () => {
  // Given a moving grounded leg.
  const f = setup();
  try {
    await warmWalk(f); f.advance(320);
    const position = f.button.style.transform;
    const draws = f.painting.draws;
    // When the visitor retargets in the same heading before the first leg ends.
    f.key('ArrowRight');
    // Then the rig never rests or jumps at the join and continues through the existing loop.
    assert.equal(f.button.style.transform, position);
    assert.equal(figure(f).attributes['data-grounded'], 'true');
    assert.equal(canvas(f).hidden, false);
    assert.equal(frames(f), 1);
    f.advance(32);
    assert.ok(f.painting.draws > draws);
    assert.notEqual(f.button.style.transform, position);
    assert.equal(f.decoderImages.length, 3);
    until(f, () => f.button.dataset.motion === 'idle');
  } finally { f.restore(); }
});

for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) test(`${key} keeps the grounded renderer through the entire legal floor route`, async () => {
  const f = setup();
  try {
    await warmWalk(f);
    until(f, () => f.button.dataset.motion === 'idle');
    f.key(key);
    until(f, () => f.button.dataset.motion === 'walking');
    for (let elapsed = 0; elapsed < 6000 && f.button.dataset.motion === 'walking'; elapsed += 16) {
      assert.equal(figure(f).attributes['data-grounded'], 'true');
      assert.equal(canvas(f).hidden, false);
      assert.equal(frames(f), 1);
      f.advance(16);
    }
    until(f, () => f.button.dataset.motion === 'idle');
    assert.equal(figure(f).attributes['data-grounded'], 'true');
  } finally { f.restore(); }
});

test('explicit resting hides the grounded surface while retaining its reusable cache', async () => {
  // Given a previously loaded rig and authored sit/wake artwork.
  const f = setup();
  try {
    await warmWalk(f);
    // When the visitor sits Milky down, then asks her to walk again.
    f.controller.sit();
    assert.equal(canvas(f).hidden, true);
    assert.equal(figure(f).attributes['data-grounded'], undefined);
    f.key('ArrowLeft');
    until(f, () => f.button.dataset.motion === 'walking');
    f.advance(16);
    // Then the next grounded leg uses the original three decoded images.
    assert.equal(canvas(f).hidden, false);
    assert.equal(f.decoderImages.length, 3);
  } finally { f.restore(); }
});

test('an image failure leaves the sprite walk usable and retries only on later movement', async () => {
  // Given a movement intent whose first optional image fails.
  const f = setup();
  try {
    await ready(f); f.key('ArrowRight');
    f.asset('milky-grounded-walk/torso.webp').dispatchEvent(new Event('error'));
    await f.load('milky-grounded-walk/foreleg.webp'); await f.flushMicrotasks();
    until(f, () => f.button.dataset.motion === 'walking');
    assert.equal(canvas(f).hidden, true);
    assert.equal(f.button.dataset.pose, 'side');
    until(f, () => f.button.dataset.motion === 'idle');
    assert.equal(f.decoderImages.length, 2);
    // When a new deliberate movement retries the rig.
    f.key('ArrowLeft'); await f.loadGrounded();
    until(f, () => f.button.dataset.motion === 'walking'); f.advance(16);
    // Then the retry replaces the fallback only at the new leg boundary.
    assert.equal(canvas(f).hidden, false);
    assert.equal(f.decoderImages.length, 5);
  } finally { f.restore(); }
});

test('an explicit photo moment hides the grounded drawing before its authored poses appear', async () => {
  // Given a live grounded walk and a cold head-tilt sequence.
  const f = setup();
  try {
    await warmWalk(f);
    // When the visitor requests that photo moment.
    assert.equal(f.controller.photoMotion('tilt'), true);
    await f.load('tilt-near.webp', 768, 512); await f.load('tilt-full.webp', 768, 512);
    until(f, () => f.button.dataset.pose === 'tilt-near');
    // Then the authored head-tilt image is unobstructed by a frozen walking canvas.
    assert.equal(figure(f).attributes['data-grounded'], undefined);
    assert.equal(canvas(f).hidden, true);
  } finally { f.restore(); }
});

test('a grounded approach hands off to the real bed hop before landing and sleeping', async () => {
  // Given a warm rig and the shipped hop and rest artwork.
  const f = setup();
  try {
    await warmWalk(f); await f.loadActivity(); await f.loadTrot();
    // When Milky is asked to nap in the visible cushion.
    assert.equal(f.controller.napInBed(), true);
    until(f, () => f.button.dataset.motion === 'hopping');
    assert.equal(canvas(f).hidden, true);
    assert.equal(f.button.dataset.bed, 'false');
    until(f, () => f.button.dataset.pose === 'sleep');
    // Then only the authored sleeping pose occupies the registered cushion.
    assert.equal(f.button.dataset.bed, 'true');
    assert.match(String(f.button.style.transform), /translate3d\(1440\.00px, 865\.00px/);
    assert.equal(canvas(f).hidden, true);
    assert.equal(f.decoderImages.length, 3);
  } finally { f.restore(); }
});

test('a brisk run keeps every chained floor leg grounded without adding another frame loop', async () => {
  // Given a cached rig and the run artwork.
  const f = setup();
  try {
    await warmWalk(f); await f.loadTrot();
    // When the visitor asks for a run across the floor.
    f.controller.run();
    until(f, () => f.button.dataset.motion === 'walking');
    let walkingFrames = 0;
    until(f, () => {
      if (f.button.dataset.motion === 'walking') {
        walkingFrames++;
        assert.equal(figure(f).attributes['data-grounded'], 'true');
      }
      return f.button.dataset.motion === 'idle';
    }, 60_000);
    // Then the complete run uses cached artwork and the controller's single scheduler.
    assert.ok(walkingFrames > 20);
    assert.equal(f.decoderImages.length, 3);
  } finally { f.restore(); }
});

const boundaries: readonly { readonly name: string; readonly stop: (f: Fixture) => void }[] = [
  { name: 'hidden', stop: f => { f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange')); } },
  { name: 'still', stop: f => f.controller.setAnimated(false) },
  { name: 'reduced motion', stop: f => { f.media.matches = true; f.media.dispatchEvent(new Event('change')); } },
  { name: 'modal', stop: f => f.controller.setActive(false) },
  { name: 'resize', stop: f => f.resize() },
  { name: 'destroy', stop: f => f.controller.destroy() },
];
for (const boundary of boundaries) {
  test(`${boundary.name} hides a running rig and stops its frame work`, async () => {
    // Given an actively rendered grounded walk.
    const f = setup();
    try {
      await warmWalk(f);
      const surface = canvas(f);
      // When the owning lifecycle ends or geometry changes.
      boundary.stop(f);
      const draws = f.painting.draws;
      // Then the rig cannot draw later or retain a visible overlay.
      f.advance(500);
      assert.equal(surface.hidden, true);
      assert.equal(figure(f).attributes['data-grounded'], undefined);
      assert.equal(f.painting.draws, draws);
      assert.equal(frames(f), 0);
    } finally { f.restore(); }
  });
  test(`${boundary.name} prevents late decoded artwork from reviving a cancelled intent`, async () => {
    // Given a cold load associated with a pending walk.
    const f = setup();
    try {
      await ready(f); f.key('ArrowRight');
      const pending = [...f.decoderImages];
      assert.equal(pending.length, 2);
      // When the lifecycle cancels before the two images finish.
      boundary.stop(f);
      for (const image of pending) image.dispatchEvent(new Event('load'));
      await f.flushMicrotasks(); f.advance(500);
      // Then the final image is never requested and the stale rig never becomes visible.
      assert.equal(f.decoderImages.length, 2);
      assert.equal(canvas(f).hidden, true);
      assert.equal(f.painting.draws, 0);
      assert.equal(frames(f), 0);
    } finally { f.restore(); }
  });
}
