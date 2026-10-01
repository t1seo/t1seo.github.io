import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const anchor = { x: 1440 / 1672, y: 865 / 941 };
// Realistic art context: only the actually shipped optional poses (blink) and rest set
// (sit, drowsy, sleep) exist — no hypothetical wake/sitdown transitionals.
const SHIPPED_REST = ['sit', 'drowsy', 'sleep'] as const;
const setup = (seed = 7829) => fixture(seed, ['blink'], SHIPPED_REST, true, floor, anchor,
  { ballHome: { x: .52, y: .977 }, transitions: true }, { photoMotions: true });
type Fixture = ReturnType<typeof setup>;

const GROUP_FILES: Record<string, readonly string[]> = {
  tilt: ['tilt-near.webp', 'tilt-full.webp'],
  pant: ['pant-soft.webp', 'pant-open.webp'],
  'paws-rest': ['paws-lower.webp', 'paws-rest.webp'],
  'sleepy-peek': ['peek-low.webp', 'peek-up.webp', 'peek-blink.webp'],
  'chin-rest': ['chin-lower.webp', 'chin-rest.webp'],
  'belly-up': ['roll-side.webp', 'roll-half.webp', 'belly-up.webp', 'belly-relaxed.webp'],
};
async function loadGroup(f: Fixture, kind: keyof typeof GROUP_FILES) {
  for (const file of GROUP_FILES[kind]) await f.load(file, 768, 512);
}
async function ready(f: Fixture) { await f.loadAll(); await f.loadRest(SHIPPED_REST); }
const photoImages = (f: Fixture) => f.document.images.filter((image) => image.src.includes('milky-photo-motions'));
function until(f: Fixture, predicate: () => boolean, duration = 120_000) {
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) f.advance(16);
  assert.ok(predicate(), 'expected state must be reached within its bounded duration');
}
/** Advances while recording each pose and motion change until the predicate holds. */
function record(f: Fixture, predicate: () => boolean, duration = 180_000) {
  const poses: string[] = [];
  const motions: string[] = [];
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) {
    f.advance(16);
    const pose = f.button.dataset.pose;
    const motion = f.button.dataset.motion;
    if (poses.at(-1) !== pose) poses.push(pose);
    if (motions.at(-1) !== motion) motions.push(motion);
  }
  assert.ok(predicate(), `sequence must complete; saw poses ${poses.join('>')}`);
  return { poses, motions };
}
function assertOrdered(seen: readonly string[], expected: readonly string[]) {
  let matched = 0;
  for (const pose of seen) if (pose === expected[matched]) matched++;
  assert.equal(matched, expected.length, `expected ${expected.join('>')} in order within ${seen.join('>')}`);
}
function position(f: Fixture) {
  const values = String(f.button.style.transform).match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
  assert.ok(values);
  return { x: Number(values[1]), y: Number(values[2]) };
}

test('the tilt greeting looks at the camera, deepens, returns, and never moves the feet', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(photoImages(f).length, 0, 'no photo-motion request before the first intent');
    assert.equal(f.controller.canPhotoMotion('tilt'), true, 'availability must not require a load');
    assert.equal(photoImages(f).length, 0, 'the availability check itself must not fetch');
    const feet = f.button.style.transform;
    assert.equal(f.controller.photoMotion('tilt'), true);
    await loadGroup(f, 'tilt');
    const { poses } = record(f, () => f.button.dataset.motion === 'idle' && f.button.dataset.pose === 'idle', 20_000);
    assertOrdered(poses, ['tilt-near', 'tilt-full', 'tilt-near', 'idle']);
    assert.equal(f.button.dataset.gaze, 'camera');
    assert.equal(f.button.style.transform, feet, 'a head tilt is not locomotion');
    // The same v4 registration: no per-frame rescaling or re-anchoring of the body.
    const idle = f.asset('milky-v4-idle.webp');
    const full = f.asset('tilt-full.webp');
    assert.equal(full.style['--milky-art-scale'], idle.style['--milky-art-scale']);
    assert.equal(full.style['--milky-frame-x'], idle.style['--milky-frame-x']);
    assert.equal(full.style['--milky-frame-y'], idle.style['--milky-frame-y']);
    // A second request replays instantly from the bounded cache with no new fetches.
    const requested = photoImages(f).length;
    assert.equal(f.controller.photoMotion('tilt'), true);
    until(f, () => f.button.dataset.pose === 'tilt-full', 5_000);
    assert.equal(photoImages(f).length, requested);
  } finally { f.restore(); }
});

test('the pant request breathes through both jaw frames a bounded number of times and settles', async () => {
  const f = setup();
  try {
    await ready(f);
    const feet = f.button.style.transform;
    assert.equal(f.controller.photoMotion('pant'), true);
    await loadGroup(f, 'pant');
    const { poses } = record(f, () => f.button.dataset.motion === 'idle' && f.button.dataset.pose === 'idle', 20_000);
    const pants = poses.filter((pose) => pose.startsWith('pant-'));
    assert.ok(pants.length >= 7 && pants.length <= 9, `bounded breathing, saw ${pants.length}`);
    assert.ok(pants.includes('pant-soft') && pants.includes('pant-open'));
    assert.equal(f.button.style.transform, feet, 'no cartoon body heave moves the dog');
  } finally { f.restore(); }
});

test('paws-rest sits, lowers the chest, rests long with stretched paws, and rises in reverse', async () => {
  const f = setup();
  try {
    await ready(f);
    const feet = f.button.style.transform;
    assert.equal(f.controller.photoMotion('paws-rest'), true);
    await loadGroup(f, 'paws-rest');
    const { poses } = record(f, () => f.button.dataset.motion === 'idle' && f.button.dataset.pose === 'idle', 40_000);
    assertOrdered(poses, ['sit', 'paws-lower', 'paws-rest', 'paws-lower', 'sit', 'idle']);
    assert.equal(f.button.style.transform, feet, 'the lying body never slides');
  } finally { f.restore(); }
});

test('an arrow key during the prone rest rises back through the authored frames before walking', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('paws-rest'), true);
    await loadGroup(f, 'paws-rest');
    until(f, () => f.button.dataset.pose === 'paws-rest');
    const feet = f.button.style.transform;
    f.key('ArrowLeft');
    const { poses, motions } = record(f, () => f.button.dataset.motion === 'walking', 20_000);
    assertOrdered(poses, ['paws-lower', 'side']);
    assert.ok(!motions.includes('resting'), 'the interrupted rest is over');
    assert.equal(f.button.style.transform, feet, 'rising in place never slides the body');
    f.advance(400);
    assert.notEqual(f.button.style.transform, feet, 'the walk itself moves the dog');
  } finally { f.restore(); }
});

test('no lying pose is ever shown while the dog is actually translating across the floor', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('paws-rest'), true);
    await loadGroup(f, 'paws-rest');
    until(f, () => f.button.dataset.pose === 'paws-rest');
    f.key('ArrowRight');
    let previous = position(f);
    for (let elapsed = 0; elapsed < 30_000 && f.button.dataset.motion !== 'idle'; elapsed += 16) {
      f.advance(16);
      const current = position(f);
      const moved = Math.abs(current.x - previous.x) > .01 || Math.abs(current.y - previous.y) > .01;
      if (moved) assert.equal(f.button.dataset.pose, 'side', `only the gait may travel, not ${f.button.dataset.pose}`);
      previous = current;
    }
  } finally { f.restore(); }
});

test('sleepy-peek from the floor settles to sleep, half-lifts, blinks once, and sleeps again', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('sleepy-peek'), true);
    await loadGroup(f, 'sleepy-peek');
    const { poses } = record(f, () => f.button.dataset.motion === 'idle' && f.button.dataset.pose === 'idle', 120_000);
    // With only sit/drowsy/sleep shipped, the stand goes back up through drowsy and sit.
    assertOrdered(poses, ['sleep', 'peek-low', 'peek-up', 'peek-blink', 'peek-up', 'peek-low', 'sleep', 'drowsy', 'sit', 'idle']);
    assert.equal(f.button.dataset.bed, 'false', 'a floor peek stays a floor rest');
  } finally { f.restore(); }
});

test('sleepy-peek during a bed nap stays on the cushion for the whole peek', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.napInBed(), true);
    until(f, () => f.button.dataset.pose === 'sleep');
    assert.equal(f.button.dataset.bed, 'true');
    const cushion = f.button.style.transform;
    assert.equal(f.controller.photoMotion('sleepy-peek'), true);
    await loadGroup(f, 'sleepy-peek');
    until(f, () => f.button.dataset.pose === 'peek-up');
    assert.equal(f.button.dataset.bed, 'true', 'the chosen rest context is preserved');
    assert.equal(f.button.style.transform, cushion);
    const { poses } = record(f, () => f.button.dataset.motion === 'walking', 60_000);
    assertOrdered(poses, ['peek-low', 'sleep']);
    assert.equal(f.button.dataset.bed, 'false', 'the visit ends with the real walk home');
  } finally { f.restore(); }
});

test('chin-rest enters the bed through the real approach and hop, meets the rim, and leaves', async () => {
  const f = setup();
  try {
    await ready(f);
    await f.loadActivity();
    await f.loadTrot();
    const home = position(f);
    assert.equal(f.controller.canPhotoMotion('chin-rest'), true);
    assert.equal(f.controller.photoMotion('chin-rest'), true);
    await loadGroup(f, 'chin-rest');
    const { poses, motions } = record(f, () => f.button.dataset.pose === 'chin-rest', 60_000);
    assertOrdered(poses, ['chin-lower', 'chin-rest']);
    assert.ok(motions.includes('walking'), 'a real approach walk');
    assert.ok(motions.includes('hopping'), 'the existing low hop onto the cushion');
    assert.equal(f.button.dataset.bed, 'true');
    assert.deepEqual(position(f), { x: 1440, y: 865 }, 'the chin rest holds the landed anchor');
    // The measured chin landmark is translated onto the actual rim: the chin frames carry
    // a rim correction while the art scale (proportions) never changes.
    const idle = f.asset('milky-v4-idle.webp');
    const chin = f.asset('chin-rest.webp');
    assert.equal(chin.style['--milky-art-scale'], idle.style['--milky-art-scale']);
    assert.notEqual(chin.style['--milky-frame-x'], idle.style['--milky-frame-x']);
    const after = record(f, () => f.button.dataset.motion === 'idle' && f.button.dataset.bed === 'false', 60_000);
    assertOrdered(after.poses, ['chin-lower', 'idle']);
    assert.deepEqual(position(f), home, 'the visit ends back home on the floor');
  } finally { f.restore(); }
});

test('belly-up rolls prone → side → half → back → relaxed and reverses before rising', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('belly-up'), true);
    await loadGroup(f, 'belly-up');
    until(f, () => f.button.dataset.pose === 'belly-relaxed', 60_000);
    assert.equal(f.button.dataset.bed, 'true', 'belly-up is strictly a bed motion');
    const cushion = f.button.style.transform;
    const facing = f.button.dataset.facing;
    const { poses } = record(f, () => f.button.dataset.motion === 'settling', 120_000);
    assertOrdered(poses, ['belly-up', 'roll-half', 'roll-side', 'sleep']);
    assert.equal(f.button.dataset.facing, facing, 'no mid-rest facing flip');
    assert.equal(f.button.style.transform, cushion, 'the roll cycle never slides the body');
    const forward = record(f, () => f.button.dataset.motion === 'idle', 60_000);
    assert.ok(forward.motions.includes('walking'));
    assert.notEqual(f.button.style.transform, cushion, 'the dog really walked home');
  } finally { f.restore(); }
});

test('the full belly-up order from the hop landing is exactly the approved roll cycle', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('belly-up'), true);
    await loadGroup(f, 'belly-up');
    const { poses } = record(f, () => f.button.dataset.pose === 'belly-relaxed', 60_000);
    assertOrdered(poses, ['sleep', 'roll-side', 'roll-half', 'belly-up', 'belly-relaxed']);
  } finally { f.restore(); }
});

test('play during the belly rest rises back through the roll frames before leaving the bed', async () => {
  const f = setup();
  try {
    await ready(f);
    await f.loadActivity();
    assert.equal(f.controller.photoMotion('belly-up'), true);
    await loadGroup(f, 'belly-up');
    until(f, () => f.button.dataset.pose === 'belly-relaxed', 60_000);
    const cushion = f.button.style.transform;
    f.controller.play();
    const { poses } = record(f, () => f.button.dataset.motion === 'walking', 30_000);
    assertOrdered(poses, ['belly-up', 'roll-half', 'roll-side', 'sleep', 'drowsy', 'sit']);
    assert.equal(f.button.dataset.bed, 'false', 'the walk is the real bed leave');
    const firstGait = poses.indexOf('side');
    assert.ok(firstGait === -1 || firstGait > poses.indexOf('roll-side'),
      'no gait frame may appear before the rise completes');
    assert.equal(f.button.style.transform, cushion, 'the rise itself happens in place on the cushion');
  } finally { f.restore(); }
});

test('a cropped bed refuses the bed-only motions while the floor motions stay available', async () => {
  const f = setup();
  try {
    await ready(f);
    f.host.bounds.left = -641;
    f.scene.bounds.width = 390;
    f.bed.bounds.left -= 641;
    f.resize();
    assert.equal(f.controller.canPhotoMotion('chin-rest'), false);
    assert.equal(f.controller.canPhotoMotion('belly-up'), false);
    assert.equal(f.controller.photoMotion('chin-rest'), false);
    assert.equal(f.controller.photoMotion('belly-up'), false);
    assert.equal(f.controller.canPhotoMotion('tilt'), true);
    assert.equal(f.controller.canPhotoMotion('paws-rest'), true);
    assert.equal(photoImages(f).length, 0, 'a refused bed motion must not fetch art');
  } finally { f.restore(); }
});

/** Advances asserting a hard invariant: lying bed frames only ever appear occupied. */
function assertBedFramesOnlyOnCushion(f: Fixture, predicate: () => boolean, duration = 180_000) {
  const BED_ONLY = ['chin-lower', 'chin-rest', 'roll-side', 'roll-half', 'belly-up', 'belly-relaxed'];
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) {
    f.advance(16);
    if (BED_ONLY.includes(f.button.dataset.pose)) {
      assert.equal(f.button.dataset.bed, 'true',
        `${f.button.dataset.pose} may only ever be shown on the occupied cushion`);
      assert.deepEqual(position(f), { x: 1440, y: 865 }, 'a bed frame holds the landed anchor');
    }
  }
  assert.ok(predicate(), 'bed scenario must complete');
}

test('repeating a bed motion during the approach waits for the real landing, never the floor', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('belly-up'), true);
    await loadGroup(f, 'belly-up');
    f.advance(240);
    assert.equal(f.button.dataset.motion, 'walking', 'the approach is underway');
    assert.equal(f.controller.photoMotion('belly-up'), true, 'the repeat is accepted, not run on the floor');
    assertBedFramesOnlyOnCushion(f, () => f.button.dataset.pose === 'belly-relaxed');
    assert.equal(f.button.dataset.bed, 'true');
    assertBedFramesOnlyOnCushion(f, () => f.button.dataset.motion === 'idle' && f.button.dataset.bed === 'false');
  } finally { f.restore(); }
});

test('a chin request during the hop itself also waits for the landed cushion', async () => {
  const f = setup();
  try {
    await ready(f);
    await f.loadActivity();
    await f.loadTrot();
    assert.equal(f.controller.photoMotion('chin-rest'), true);
    await loadGroup(f, 'chin-rest');
    until(f, () => f.button.dataset.motion === 'hopping', 60_000);
    assert.equal(f.controller.photoMotion('chin-rest'), true);
    assertBedFramesOnlyOnCushion(f, () => f.button.dataset.pose === 'chin-rest');
    assert.equal(f.button.dataset.bed, 'true');
  } finally { f.restore(); }
});

test('a bed motion requested during the departure walk re-enters with a fresh approach and hop', async () => {
  const f = setup();
  try {
    await ready(f);
    await f.loadActivity();
    await f.loadTrot();
    assert.equal(f.controller.photoMotion('belly-up'), true);
    await loadGroup(f, 'belly-up');
    until(f, () => f.button.dataset.pose === 'belly-relaxed', 60_000);
    until(f, () => f.button.dataset.bed === 'false' && f.button.dataset.motion === 'walking', 120_000);
    f.advance(200);
    assert.equal(f.controller.photoMotion('belly-up'), true, 'the departing visit accepts the new intent');
    const { motions } = record(f, () => f.button.dataset.pose === 'belly-relaxed', 180_000);
    assert.ok(motions.includes('hopping'), 'the fresh visit hops onto the cushion again');
    assert.equal(f.button.dataset.bed, 'true');
    assert.deepEqual(position(f), { x: 1440, y: 865 });
  } finally { f.restore(); }
});

test('a bed motion requested while already napping on the cushion still runs in place', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.napInBed(), true);
    until(f, () => f.button.dataset.pose === 'sleep');
    assert.equal(f.button.dataset.bed, 'true');
    const cushion = f.button.style.transform;
    assert.equal(f.controller.photoMotion('belly-up'), true);
    await loadGroup(f, 'belly-up');
    assertBedFramesOnlyOnCushion(f, () => f.button.dataset.pose === 'belly-relaxed');
    assert.equal(f.button.style.transform, cushion, 'no second approach from the occupied cushion');
  } finally { f.restore(); }
});

test('interrupting the peek and the tilt steps back through their nearer frames first', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('sleepy-peek'), true);
    await loadGroup(f, 'sleepy-peek');
    until(f, () => f.button.dataset.pose === 'peek-up', 60_000);
    f.key('ArrowLeft');
    const { poses } = record(f, () => f.button.dataset.motion === 'walking', 30_000);
    assertOrdered(poses, ['peek-low', 'sleep', 'drowsy', 'sit', 'side']);
  } finally { f.restore(); }
  const g = setup();
  try {
    await ready(g);
    assert.equal(g.controller.photoMotion('tilt'), true);
    await loadGroup(g, 'tilt');
    until(g, () => g.button.dataset.pose === 'tilt-full', 10_000);
    g.key('ArrowRight');
    const { poses } = record(g, () => g.button.dataset.motion === 'walking', 10_000);
    assertOrdered(poses, ['tilt-near', 'side']);
  } finally { g.restore(); }
});

test('a posture command during the belly rest rolls back through every frame, never a jump cut', async () => {
  for (const action of ['sit', 'sleep'] as const) {
    const f = setup();
    try {
      await ready(f);
      assert.equal(f.controller.photoMotion('belly-up'), true);
      await loadGroup(f, 'belly-up');
      until(f, () => f.button.dataset.pose === 'belly-relaxed', 60_000);
      f.controller[action]();
      assert.notEqual(f.button.dataset.pose, action, 'the command never cuts the lying body straight to the target');
      assert.equal(f.button.dataset.pose, 'belly-up', 'the reverse roll starts immediately with its own frame');
      const { poses } = record(f, () => f.button.dataset.pose === action, 30_000);
      assertOrdered(poses, action === 'sleep'
        ? ['belly-up', 'roll-half', 'roll-side', 'sleep']
        : ['belly-up', 'roll-half', 'roll-side', 'sleep', 'drowsy', 'sit']);
      if (action === 'sleep') {
        assert.ok(!poses.includes('sit') && !poses.includes('drowsy'),
          'rolling back to prone sleep never stands up in between');
      }
    } finally { f.restore(); }
  }
});

test('an occasional pant follows a finished play session, never before the ball contact', async () => {
  const f = setup();
  try {
    await ready(f);
    await f.loadActivity();
    // Warm the pant group once explicitly, then clear the cooldowns with quiet time.
    assert.equal(f.controller.photoMotion('pant'), true);
    await loadGroup(f, 'pant');
    until(f, () => f.button.dataset.motion === 'idle' && f.button.dataset.pose === 'idle', 30_000);
    let pantAfterPlay = false;
    for (let attempt = 0; attempt < 12 && !pantAfterPlay; attempt++) {
      for (let elapsed = 0; elapsed < 90_000; elapsed += 200) f.advance(200);
      f.controller.play();
      let sawReach = false;
      for (let elapsed = 0; elapsed < 120_000; elapsed += 16) {
        f.advance(16);
        const pose = f.button.dataset.pose;
        if (pose === 'play-reach') sawReach = true;
        if (pose.startsWith('pant-')) {
          assert.ok(sawReach, 'panting may only follow the actual nudge, never precede it');
          pantAfterPlay = true;
        }
        if (f.button.dataset.motion === 'idle' && pose === 'idle') break;
      }
    }
    assert.ok(pantAfterPlay, 'a completed play occasionally ends in catching the breath');
  } finally { f.restore(); }
});
