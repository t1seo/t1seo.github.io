import assert from 'node:assert/strict';
import test from 'node:test';
import { createMilkyBed, visibleMilkyBed } from './cyber-pet-bed.ts';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const anchor = { x: 1440 / 1672, y: 865 / 941 };
const room = { left: 0, top: 0, width: 1672, height: 941 };
const bed = { left: 1310, top: 788, width: 260, height: 142 };
const bedFixture = () => fixture(7829, POSES, RESTS, true, floor, anchor);
type BedFixture = ReturnType<typeof bedFixture>;

function position(f: BedFixture) {
  const transform = f.button.style.transform;
  assert.equal(typeof transform, 'string');
  const values = String(transform).match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
  assert.ok(values);
  return { x: Number(values[1]), y: Number(values[2]) };
}
function until(f: BedFixture, condition: () => boolean, timeout = 60_000) {
  for (let elapsed = 0; elapsed < timeout && !condition(); elapsed += 80) f.advance(80);
  assert.ok(condition(), 'expected activity must complete within its bounded duration');
}
async function ready(f: BedFixture) { await f.loadAll(); await f.loadRest(); }
function requestNap(f: BedFixture) {
  assert.equal(f.controller.napInBed(), true);
  until(f, () => f.button.dataset.pose === 'sleep');
}

test('bed visits require the complete bed and dog footprint inside the actual viewport', () => {
  assert.equal(visibleMilkyBed(bed, room, room, anchor, floor), true);
  const wideRoom = { left: -79.15, top: 0, width: 1599.15, height: 900 };
  const factor = 900 / 941;
  const wideBed = { left: wideRoom.left + bed.left * factor, top: bed.top * factor, width: bed.width * factor, height: bed.height * factor };
  assert.equal(visibleMilkyBed(wideBed, wideRoom, { left: 0, top: 0, width: 1440, height: 900 }, anchor, floor), true);
  assert.equal(visibleMilkyBed({ ...bed, left: 1430 }, room, room, anchor, floor), false);
  assert.equal(visibleMilkyBed(bed, room, { ...room, width: 390, height: 844 }, anchor, floor), false);
  assert.equal(visibleMilkyBed(bed, room, room, { x: .97, y: anchor.y }, floor), false);
});

test('a provided bed sequence plays after the real approach, hop and occupancy, then leaves home', () => {
  const calls: string[] = [];
  const walkCompletions: (() => void)[] = [];
  const element = { getBoundingClientRect: () => bed } as unknown as HTMLElement;
  const api = createMilkyBed({ element, anchor }, {
    room: () => room, viewport: () => room, floor,
    position: () => ({ x: .5, y: .97 }),
    bound: (point) => point,
    canWalk: () => true,
    walk: (_point, _autonomous, done) => { calls.push('walk'); walkCompletions.push(done); },
    hop: (_point, _autonomous, landed, done) => { calls.push('hop'); landed(); done(); return true; },
    rest: () => { calls.push('rest'); },
    occupied: (occupied) => { calls.push(`occupied:${occupied}`); },
    settle: () => { calls.push('settle'); },
  });
  assert.equal(api.visible(), true, 'the geometry check is exposed for capability queries');
  let sequenceDone: (() => void) | undefined;
  assert.equal(api.enter([], false, (done) => { calls.push('sequence'); sequenceDone = done; }), true);
  walkCompletions[0]();
  assert.deepEqual(calls, ['walk', 'hop', 'occupied:true', 'sequence'], 'the sequence replaces the rest stages');
  assert.ok(sequenceDone);
  sequenceDone();
  assert.deepEqual(calls.slice(4), ['occupied:false', 'walk'], 'finishing the sequence starts the walk home');
  walkCompletions[1]();
  assert.equal(calls.at(-1), 'settle');
  assert.equal(api.active, false);
});

test('Milky walks with changing gait frames to the cushion, naps without drifting, and walks home', async () => {
  const f = bedFixture();
  try {
    await ready(f);
    const home = position(f);
    assert.equal(f.controller.napInBed(), true);
    assert.deepEqual(position(f), home, 'requesting the bed cannot teleport Milky');
    const frames = new Set<string>();
    const points: number[] = [];
    until(f, () => {
      if (f.button.dataset.motion === 'walking') { frames.add(f.button.dataset.frame); points.push(position(f).x); }
      return f.button.dataset.pose === 'sleep';
    });
    assert.ok(frames.size >= 6, 'a real distance-linked gait plays during the approach');
    assert.ok(points.length > 20);
    assert.ok(points.every((value, index) => index === 0 || value >= points[index - 1]));
    assert.deepEqual(position(f), { x: 1440, y: 865 });
    assert.equal(f.button.dataset.bed, 'true');
    f.advance(3000);
    f.resize();
    assert.equal(f.button.dataset.pose, 'sleep', 'unchanged layout must not wake or relocate a napping dog');
    assert.deepEqual(position(f), { x: 1440, y: 865 });
    until(f, () => f.button.dataset.motion === 'walking');
    assert.equal(f.button.dataset.bed, 'false');
    f.advance(800);
    assert.ok(position(f).x < 1440 && position(f).x > home.x, 'return is another visible walk');
    until(f, () => f.button.dataset.motion === 'idle');
    assert.deepEqual(position(f), home);
  } finally { f.restore(); }
});

test('autonomous naps occasionally use the bed while other rest cycles stay on the floor', async () => {
  const f = bedFixture();
  try {
    await ready(f);
    let bedSleep = 0;
    let floorRest = 0;
    for (let elapsed = 0; elapsed < 1_200_000; elapsed += 200) {
      f.advance(200);
      if (f.button.dataset.pose === 'sleep' && f.button.dataset.bed === 'true') bedSleep++;
      if (['sit', 'drowsy', 'sleep'].includes(f.button.dataset.pose) && f.button.dataset.bed !== 'true') floorRest++;
    }
    assert.ok(bedSleep > 0);
    assert.ok(floorRest > 0);
  } finally { f.restore(); }
});

test('hiding during approach cancels every task and resumes with a visible return to the floor', async () => {
  const f = bedFixture();
  try {
    await ready(f);
    f.controller.napInBed();
    f.advance(1800);
    const stopped = position(f);
    f.document.hidden = true;
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.tasks.size, 0);
    f.advance(120_000);
    assert.deepEqual(position(f), stopped);
    f.document.hidden = false;
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.deepEqual(position(f), stopped);
    until(f, () => f.button.dataset.motion === 'idle');
    assert.ok(position(f).x <= floor.right * room.width);
    f.controller.destroy();
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

test('reduced motion and paused dialogs hold the physical bed position with no scheduled work', async () => {
  const f = bedFixture();
  try {
    await ready(f);
    await f.loadActivity();
    requestNap(f);
    f.media.matches = true;
    f.media.dispatchEvent(new Event('change'));
    assert.equal(f.tasks.size, 0);
    assert.equal(f.controller.napInBed(), false);
    assert.deepEqual(position(f), { x: 1440, y: 865 });
    let notices = 0;
    f.host.addEventListener('cyber:pet', () => notices++);
    f.controller.feed();
    f.controller.play();
    f.controller.pet();
    f.key('ArrowRight');
    assert.equal(notices, 0, 'activities requiring a return walk cannot announce a false start in still mode');
    assert.equal(f.propEl('bowl').dataset.visible, 'false');
    assert.equal(f.propEl('ball').dataset.visible, 'false');
    assert.equal(f.tasks.size, 0);
    f.controller.setActive(false);
    f.media.matches = false;
    f.media.dispatchEvent(new Event('change'));
    assert.equal(f.tasks.size, 0);
    f.controller.setActive(true);
    f.advance(1200);
    assert.ok(position(f).x < 1440);
    f.controller.setActive(false);
    const returning = position(f);
    assert.equal(f.tasks.size, 0);
    f.controller.setActive(true);
    assert.deepEqual(position(f), returning);
    until(f, () => f.button.dataset.motion === 'idle');
    assert.ok(position(f).x <= floor.right * room.width);
  } finally { f.restore(); }
});

test('feeding from the bed first wakes and walks Milky home before placing a food bowl', async () => {
  const f = bedFixture();
  try {
    await ready(f);
    await f.loadActivity();
    requestNap(f);
    f.controller.feed();
    let checked = 0;
    until(f, () => {
      if (position(f).x > floor.right * room.width) {
        assert.equal(f.propEl('bowl').dataset.visible, 'false');
        checked++;
      }
      return f.propEl('bowl').dataset.visible === 'true';
    });
    assert.ok(checked > 20);
    assert.ok(position(f).x <= floor.right * room.width);
    assert.ok(position(f).y >= floor.top * room.height - .01);
  } finally { f.restore(); }
});

test('a newly cropped bed cancels the visit and preserves a visible pet; archived rooms ignore the bed API', async () => {
  const f = bedFixture();
  try {
    await ready(f);
    requestNap(f);
    f.host.bounds.left = -641;
    f.scene.bounds.width = 390;
    f.bed.bounds.left -= 641;
    f.resize();
    assert.equal(f.controller.napInBed(), false);
    assert.equal(f.button.dataset.bed, 'false');
    assert.equal(f.button.hidden, false);
    assert.ok(position(f).x - 641 > 0 && position(f).x - 641 < 390);
  } finally { f.restore(); }
  const archived = fixture();
  try {
    await ready(archived);
    assert.equal(archived.controller.napInBed(), false);
    archived.controller.sleep();
    until(archived, () => archived.button.dataset.pose === 'sleep');
  } finally { archived.restore(); }
});
