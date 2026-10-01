import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const anchor = { x: 1440 / 1672, y: 865 / 941 };
// Exercise the decoded three-pose fallback while optional bridge images are unavailable.
const SHIPPED_REST = ['sit', 'drowsy', 'sleep'] as const;
const setup = (seed = 7829) => fixture(seed, ['blink'], SHIPPED_REST, true, floor, anchor,
  { ballHome: { x: .52, y: .977 }, transitions: true }, { photoMotions: true });
type Fixture = ReturnType<typeof setup>;

const PHOTO_POSES = [
  'tilt-near', 'tilt-full', 'pant-soft', 'pant-open', 'paws-lower', 'paws-rest',
  'peek-low', 'peek-up', 'peek-blink', 'chin-lower', 'chin-rest',
  'roll-side', 'roll-half', 'belly-up', 'belly-relaxed',
];
async function ready(f: Fixture) { await f.loadAll(); await f.loadRest(SHIPPED_REST); }
const photoImages = (f: Fixture) => f.document.images.filter((image) => image.src.includes('milky-photo-motions'));
const photoFile = (image: { src: string }) => image.src.slice(image.src.lastIndexOf('/') + 1);
function until(f: Fixture, predicate: () => boolean, duration = 120_000) {
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) f.advance(16);
  assert.ok(predicate(), 'expected state must be reached within its bounded duration');
}

test('loading is lazy and atomic: at most two decodes in flight, one cached image per file', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(photoImages(f).length, 0);
    assert.equal(f.controller.photoMotion('sleepy-peek'), true, 'a loading group still accepts the request');
    assert.equal(photoImages(f).length, 2, 'only two of the three frames may fetch at once');
    assert.deepEqual(photoImages(f).map(photoFile), ['peek-low.webp', 'peek-up.webp']);
    await f.load('peek-low.webp', 768, 512);
    assert.deepEqual(photoImages(f).map(photoFile), ['peek-low.webp', 'peek-up.webp', 'peek-blink.webp']);
    f.advance(2000);
    assert.notEqual(f.button.dataset.pose, 'peek-low', 'an incomplete group never shows a frame');
    await f.load('peek-up.webp', 768, 512);
    await f.load('peek-blink.webp', 768, 512);
    until(f, () => f.button.dataset.pose === 'peek-low', 30_000);
    // Replays reuse the same cached elements; the fifteen-file bound cannot grow.
    assert.equal(photoImages(f).length, 3);
  } finally { f.restore(); }
});

test('the latest request wins: an earlier group that finishes late may not start anything', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('tilt'), true);
    assert.equal(f.controller.photoMotion('pant'), true, 'the newer request replaces the older intent');
    await f.load('tilt-near.webp', 768, 512);
    await f.load('tilt-full.webp', 768, 512);
    f.advance(3000);
    assert.ok(!['tilt-near', 'tilt-full'].includes(f.button.dataset.pose), 'the stale tilt intent must not fire');
    await f.load('pant-soft.webp', 768, 512);
    await f.load('pant-open.webp', 768, 512);
    until(f, () => f.button.dataset.pose === 'pant-soft', 10_000);
  } finally { f.restore(); }
});

test('a new user action cancels a queued photo intent before its art arrives', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('paws-rest'), true);
    f.key('ArrowRight');
    until(f, () => f.button.dataset.motion === 'walking');
    await f.load('paws-lower.webp', 768, 512);
    await f.load('paws-rest.webp', 768, 512);
    for (let elapsed = 0; elapsed < 30_000; elapsed += 16) {
      f.advance(16);
      assert.ok(!f.button.dataset.pose.startsWith('paws-'), 'the canceled intent may not resurrect');
      if (f.button.dataset.motion === 'idle' && elapsed > 8000) break;
    }
  } finally { f.restore(); }
});

test('a failed frame fails its whole group and keeps the current pose, with no automatic retry', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('tilt'), true);
    const requested = photoImages(f).map((image) => image.src);
    f.asset('tilt-near.webp').dispatchEvent(new Event('error'));
    await f.load('tilt-full.webp', 768, 512);
    f.advance(5000);
    assert.equal(f.button.dataset.pose, 'idle', 'the previous working pose stays');
    assert.deepEqual(photoImages(f).map((image) => image.src), requested, 'no blind background refetch');
    assert.equal(f.controller.canPhotoMotion('pant'), true, 'other groups are unaffected');
    assert.equal(f.button.hidden, false, 'Milky herself is never hidden by optional art');
    // Quiet time passes: autonomy may warm OTHER idle groups, but it never
    // re-requests the failed one on its own.
    for (let elapsed = 0; elapsed < 400_000; elapsed += 200) f.advance(200);
    const tiltImages = photoImages(f).filter((image) => image.src.includes('tilt-'));
    assert.equal(tiltImages.length, 2, 'a failed group is never auto-retried');
    assert.deepEqual(tiltImages.map((image) => image.src), requested);
  } finally { f.restore(); }
});

test('a later deliberate request retries exactly the failed frames and then performs', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('tilt'), true);
    // The first frame fails while its sibling fetch is STILL in flight.
    f.asset('tilt-near.webp').dispatchEvent(new Event('error'));
    assert.equal(f.controller.canPhotoMotion('tilt'), true, 'a failed load does not kill the capability');
    assert.equal(f.controller.photoMotion('tilt'), true, 'the explicit request is the deliberate retry');
    assert.equal(photoImages(f).length, 2, 'the retry reuses the cached elements — never a third image');
    await f.load('tilt-full.webp', 768, 512);
    await f.load('tilt-near.webp', 768, 512);
    until(f, () => f.button.dataset.pose === 'tilt-near', 10_000);
    // And a retry can fail and be retried again later without corruption.
    const g = setup();
    try {
      await ready(g);
      assert.equal(g.controller.photoMotion('pant'), true);
      g.asset('pant-soft.webp').dispatchEvent(new Event('error'));
      await g.load('pant-open.webp', 768, 512);
      assert.equal(g.controller.photoMotion('pant'), true);
      g.asset('pant-soft.webp').dispatchEvent(new Event('error'));
      g.advance(2000);
      assert.equal(g.button.dataset.pose, 'idle');
      assert.equal(g.controller.photoMotion('pant'), true);
      await g.load('pant-soft.webp', 768, 512);
      until(g, () => g.button.dataset.pose === 'pant-soft', 10_000);
    } finally { g.restore(); }
  } finally { f.restore(); }
});

test('a malformed decoded frame also fails the group instead of showing wrong-ratio art', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('pant'), true);
    await f.load('pant-soft.webp', 512, 512);
    await f.load('pant-open.webp', 768, 512);
    f.advance(5000);
    assert.equal(f.button.dataset.pose, 'idle');
    assert.equal(photoImages(f).length, 2, 'a malformed group is not auto-refetched');
    // A deliberate retry can still recover once the file is actually fixed.
    assert.equal(f.controller.photoMotion('pant'), true);
    await f.load('pant-soft.webp', 768, 512);
    until(f, () => f.button.dataset.pose === 'pant-soft', 10_000);
  } finally { f.restore(); }
});

for (const gate of ['hidden', 'modal', 'still', 'reduced', 'resize'] as const) {
  test(`a cold request canceled by the ${gate} boundary cannot start from a late decode`, async () => {
    const f = setup();
    try {
      await ready(f);
      assert.equal(f.controller.photoMotion('tilt'), true);
      if (gate === 'hidden') {
        f.document.hidden = true;
        f.document.dispatchEvent(new Event('visibilitychange'));
        f.document.hidden = false;
        f.document.dispatchEvent(new Event('visibilitychange'));
      }
      if (gate === 'modal') { f.controller.setActive(false); f.controller.setActive(true); }
      if (gate === 'still') { f.controller.setAnimated(false); f.controller.setAnimated(true); }
      if (gate === 'reduced') {
        f.media.matches = true;
        f.media.dispatchEvent(new Event('change'));
        f.media.matches = false;
        f.media.dispatchEvent(new Event('change'));
      }
      if (gate === 'resize') f.resize();
      await f.load('tilt-near.webp', 768, 512);
      await f.load('tilt-full.webp', 768, 512);
      for (let elapsed = 0; elapsed < 10_000; elapsed += 16) {
        f.advance(16);
        assert.ok(!f.button.dataset.pose.startsWith('tilt-'),
          `a request invalidated by ${gate} may not start after returning`);
      }
      // The boundary canceled the request, not the capability: a fresh request works.
      assert.equal(f.controller.photoMotion('tilt'), true);
      until(f, () => f.button.dataset.pose === 'tilt-near', 10_000);
    } finally { f.restore(); }
  });
}

test('an ordinary action finishing during the load does not drop the latest accepted intent', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('pant'), true);
    // Quiet autonomous life (roams, settles) runs and finishes while the art loads.
    for (let elapsed = 0; elapsed < 14_000; elapsed += 200) f.advance(200);
    await f.load('pant-soft.webp', 768, 512);
    await f.load('pant-open.webp', 768, 512);
    until(f, () => f.button.dataset.pose === 'pant-soft', 30_000);
  } finally { f.restore(); }
});

test('a warm photo request just after the nudge never freezes the airborne ball', async () => {
  const f = setup();
  try {
    await ready(f);
    await f.loadActivity();
    assert.equal(f.controller.photoMotion('tilt'), true);
    await f.load('tilt-near.webp', 768, 512);
    await f.load('tilt-full.webp', 768, 512);
    until(f, () => f.button.dataset.motion === 'idle' && f.button.dataset.pose === 'idle', 20_000);
    f.controller.play();
    until(f, () => f.button.dataset.pose === 'play-reach', 120_000);
    f.advance(32);
    assert.equal(f.controller.photoMotion('tilt'), true);
    until(f, () => f.button.dataset.pose === 'tilt-near', 5_000);
    const ball = f.propEl('ball');
    f.advance(2000);
    assert.equal(ball.style['--milky-prop-lift'], '0.00px',
      'the nudged ball keeps its shared frame loop and lands while the tilt plays');
    const landed = ball.style.transform;
    f.advance(1500);
    assert.equal(ball.style.transform, landed, 'the landed ball rests — one real ball, no ghost');
  } finally { f.restore(); }
});

test('hiding the page mid-sequence cancels every task without teleporting the dog', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('paws-rest'), true);
    await f.load('paws-lower.webp', 768, 512);
    await f.load('paws-rest.webp', 768, 512);
    until(f, () => f.button.dataset.pose === 'paws-rest');
    const feet = f.button.style.transform;
    f.document.hidden = true;
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.tasks.size, 0);
    f.advance(60_000);
    assert.equal(f.button.style.transform, feet);
    f.document.hidden = false;
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.button.style.transform, feet);
  } finally { f.restore(); }
});

test('reduced motion refuses new photo motions and freezes an active bed roll in place', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('belly-up'), true);
    for (const file of ['roll-side.webp', 'roll-half.webp', 'belly-up.webp', 'belly-relaxed.webp']) {
      await f.load(file, 768, 512);
    }
    until(f, () => f.button.dataset.pose === 'belly-relaxed', 60_000);
    const cushion = f.button.style.transform;
    f.media.matches = true;
    f.media.dispatchEvent(new Event('change'));
    assert.equal(f.tasks.size, 0, 'every photo timer and frame dies with motion');
    assert.equal(f.button.style.transform, cushion, 'stopping cannot teleport off the bed');
    assert.equal(f.controller.canPhotoMotion('belly-up'), false);
    assert.equal(f.controller.canPhotoMotion('tilt'), false);
    assert.equal(f.controller.photoMotion('tilt'), false);
    f.advance(30_000);
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

test('a modal that deactivates the pet stops the sequence but not the drawer availability', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('tilt'), true);
    await f.load('tilt-near.webp', 768, 512);
    await f.load('tilt-full.webp', 768, 512);
    until(f, () => f.button.dataset.pose === 'tilt-full', 10_000);
    f.controller.setActive(false);
    assert.equal(f.tasks.size, 0);
    assert.equal(f.controller.canPhotoMotion('tilt'), true,
      'the drawer check may not reject only because a modal made the pet inactive');
    assert.equal(f.controller.photoMotion('tilt'), false, 'but the request itself waits for reactivation');
    f.controller.setActive(true);
    assert.equal(f.controller.photoMotion('tilt'), true);
    until(f, () => f.button.dataset.pose === 'tilt-full', 10_000);
  } finally { f.restore(); }
});

test('destroy mid-sequence and during a pending load leaves no timers and no late starts', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('sleepy-peek'), true);
    f.controller.destroy();
    assert.equal(f.tasks.size, 0);
    await f.load('peek-low.webp', 768, 512);
    await f.load('peek-up.webp', 768, 512);
    f.advance(10_000);
    assert.equal(f.tasks.size, 0, 'a dead context cannot be revived by a late decode');
  } finally { f.restore(); }
});

test('a resize that keeps the floor cancels a floor photo rest and rebounds cleanly', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('paws-rest'), true);
    await f.load('paws-lower.webp', 768, 512);
    await f.load('paws-rest.webp', 768, 512);
    until(f, () => f.button.dataset.pose === 'paws-rest');
    f.resize();
    assert.notEqual(f.button.dataset.pose, 'paws-rest', 'relayout never leaves a stale lying body');
    assert.equal(f.button.hidden, false);
  } finally { f.restore(); }
});

test('without the opt-in flag the controller keeps its archived behavior exactly', async () => {
  const f = fixture(7829, POSES, RESTS, true, floor, anchor, { ballHome: { x: .52, y: .977 }, transitions: true });
  try {
    await ready(f);
    assert.equal(f.controller.canPhotoMotion('tilt'), false);
    assert.equal(f.controller.photoMotion('tilt'), false);
    for (let elapsed = 0; elapsed < 600_000; elapsed += 200) {
      f.advance(200);
      assert.ok(!PHOTO_POSES.includes(f.button.dataset.pose), 'no photo pose without the opt-in');
    }
    assert.equal(photoImages(f).length, 0, 'no photo-motion network activity at all');
  } finally { f.restore(); }
});

test('rare autonomous moments warm their art lazily and then appear on quiet opportunities', async () => {
  const f = setup(4711);
  try {
    await ready(f);
    await f.loadActivity();
    assert.equal(photoImages(f).length, 0, 'nothing is pre-fetched for autonomy either');
    const loaded = new Set<string>();
    const seen = new Set<string>();
    for (let elapsed = 0; elapsed < 2_400_000 && seen.size === 0; elapsed += 200) {
      f.advance(200);
      for (const image of photoImages(f)) {
        const file = photoFile(image);
        if (!loaded.has(file)) { loaded.add(file); await f.load(file, 768, 512); }
      }
      const pose = f.button.dataset.pose;
      if (PHOTO_POSES.includes(pose)) seen.add(pose);
    }
    assert.ok(loaded.size > 0, 'an autonomous intent lazily loads its group');
    assert.ok(seen.size > 0, 'a quiet opportunity eventually shows a photo moment');
  } finally { f.restore(); }
});

test('a greeting can rarely become the camera-tilt variation once its art is warm', async () => {
  const f = setup();
  try {
    await ready(f);
    assert.equal(f.controller.photoMotion('tilt'), true);
    await f.load('tilt-near.webp', 768, 512);
    await f.load('tilt-full.webp', 768, 512);
    until(f, () => f.button.dataset.motion === 'idle' && f.button.dataset.pose === 'idle', 20_000);
    let tilted = false;
    for (let attempt = 0; attempt < 40 && !tilted; attempt++) {
      for (let elapsed = 0; elapsed < 90_000; elapsed += 200) f.advance(200);
      f.controller.pet();
      for (let elapsed = 0; elapsed < 30_000; elapsed += 16) {
        f.advance(16);
        if (f.button.dataset.pose.startsWith('tilt-')) { tilted = true; break; }
        if (f.button.dataset.motion === 'idle' && f.button.dataset.pose === 'idle' && elapsed > 2000) break;
      }
    }
    assert.ok(tilted, 'the greeting occasionally answers with the photo-17 tilt');
  } finally { f.restore(); }
});
