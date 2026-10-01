import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

/**
 * Drive the current walk to completion, recording only frames that were genuinely visible
 * while pose=side and motion=walking — the hidden dataset.frame written in the same tick
 * as the idle swap does not count as seen.
 */
function completeWalk(f: ReturnType<typeof fixture>, trigger?: () => void) {
  trigger?.();
  let last = -1;
  const seen = new Set<number>();
  for (let i = 0; i < 400 && f.button.dataset.motion !== 'settling'; i++) {
    if (f.button.dataset.pose === 'side' && f.button.dataset.motion === 'walking') {
      last = Number(f.button.dataset.frame);
      seen.add(last);
    }
    f.advance(16);
  }
  assert.equal(f.button.dataset.motion, 'settling', 'the walk completed');
  return { last, seen };
}

test('reversing a forward-looking walk gives a brief planted glance before the new heading', async () => {
  const f = fixture();
  try {
    await f.loadAll(); await f.loadForward();
    f.button.dataset.gaze = 'forward';
    const feet = f.button.style.transform;
    f.key('ArrowLeft');
    assert.equal(f.button.dataset.motion, 'turning');
    assert.equal(f.button.dataset.gaze, 'camera');
    assert.equal(f.button.dataset.facing, 'right');
    f.advance(160);
    assert.equal(f.button.style.transform, feet);
    f.advance(96);
    assert.equal(f.button.dataset.motion, 'walking');
    assert.equal(f.button.dataset.gaze, 'forward');
    assert.equal(f.button.dataset.facing, 'left');
  } finally { f.restore(); }
});

test('arriving walks keep the standing support frame visibly on screen while decelerating', async () => {
  // Seoul-studio geometry: a .12-wide body at full depth gives a nominal stride of .050688,
  // so the .066 arrow routes are ~1.302 cycles — inside the stride-fit gap. The finish must
  // land INSIDE the support frame: an endpoint on its boundary flips to idle in the same
  // animation frame, so the arrival stance was never actually displayed.
  const f = fixture(7829, POSES, RESTS, true,
    { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 });
  try {
    await f.loadAll(); await f.loadForward();
    const right = completeWalk(f, () => f.key('ArrowRight'));
    assert.equal(right.last, 4, 'the support stance is the last frame genuinely shown while walking');
    assert.equal(right.seen.size, 8, 'the eased finish still walks through the whole gait cycle');
    f.advance(600);
    assert.equal(f.button.dataset.motion, 'idle');
    // The reverse route turns first, then must arrive the same visible way.
    const left = completeWalk(f, () => f.key('ArrowLeft'));
    assert.equal(left.last, 4, 'a reversal arrival also shows the support stance while slowing');
  } finally { f.restore(); }
});

test('the fallback camera-look gait and a carried same-heading retarget also finish on a visible support stance', async () => {
  const f = fixture();
  try {
    await f.loadAll();
    const plain = completeWalk(f, () => f.key('ArrowRight'));
    assert.equal(plain.last, 4, 'the eight-frame fallback set arrives on its support stance');
    f.advance(600);
    // A compatible mid-walk retarget keeps speed and phase; its own finish adjustment lands
    // the carried phase visibly inside the support frame. (A retarget very late in a walk
    // may only get the bounded partial adjustment — honesty over a distorted last step.)
    f.key('ArrowLeft');
    f.advance(400);
    assert.equal(f.button.dataset.motion, 'walking');
    const carried = completeWalk(f, () => f.key('ArrowLeft'));
    assert.equal(carried.last, 4, 'a carried retarget arrival shows the support stance while slowing');
  } finally { f.restore(); }
});

test('a brisk trot and each of its chained legs settle on the grounded diagonal-support frame', async () => {
  const f = fixture();
  try {
    await f.loadAll(); await f.loadForward(); await f.loadTrot();
    f.controller.run();
    const finals: number[] = [];
    let last = -1;
    let walking = false;
    for (let i = 0; i < 2000 && !(finals.length > 0 && f.button.dataset.motion === 'idle'); i++) {
      if (f.button.dataset.pose === 'side' && f.button.dataset.motion === 'walking') {
        last = Number(f.button.dataset.frame);
        walking = true;
      } else if (walking && f.button.dataset.motion === 'settling') {
        finals.push(last);
        walking = false;
        last = -1;
      }
      f.advance(16);
    }
    assert.ok(finals.length >= 2, 'the run chained more than one trot leg');
    assert.deepEqual(finals, finals.map(() => 2), 'every leg ends visibly on the diagonal-support stance');
  } finally { f.restore(); }
});

test('every walking frame carries its measured contact-floor translation so planted paws meet the floor', async () => {
  const f = fixture();
  try {
    await f.loadAll(); await f.loadForward();
    // The measured step silhouette bottoms float above the idle's floor y970, so these
    // rigid native translations improve contact height (root-verified max |floor error|:
    // v4 16→6, forward 19→5 exported px). They do not remove the sprites' residual
    // body-shape variation or all foot slide — those are art-inherent.
    const v4 = [20, 14, 20, 28, 26, 14, 2, 14];
    const forward = [32, 20, 20, 24, 26, 16, 12, 24];
    const scale = .847;
    const regY = (.94 - 970 / 1024) * scale * 100;
    const frameY = (name: string) => parseFloat(String(f.asset(name).style['--milky-frame-y']));
    for (let frame = 0; frame < 8; frame++) {
      assert.ok(Math.abs(frameY(`milky-v4-step-${frame}.webp`) - (regY + v4[frame] / 1024 * scale * 100)) < 1e-9,
        `v4 step ${frame} is grounded on the registered floor`);
      assert.ok(Math.abs(frameY(`milky-forward-step-${frame}.webp`) - (regY + forward[frame] / 1024 * scale * 100)) < 1e-9,
        `forward step ${frame} is grounded on the registered floor`);
    }
    assert.ok(Math.abs(frameY('milky-v4-idle.webp') - regY) < 1e-9, 'the idle keeps its original registration');
    assert.ok(Math.abs(frameY('milky-forward-idle.webp') - regY) < 1e-9, 'the forward idle keeps its original registration');
  } finally { f.restore(); }
});
