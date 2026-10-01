import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const anchor = { x: 1440 / 1672, y: 865 / 941 };
const bedFixture = (trot = true) => fixture(7829, POSES, RESTS, trot, floor, anchor);
type BedFixture = ReturnType<typeof bedFixture>;

function position(f: BedFixture) {
  const values = String(f.button.style.transform).match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
  assert.ok(values, 'Milky retains a registered ground position');
  return { x: Number(values[1]), y: Number(values[2]) };
}
function styleNumber(f: BedFixture, property: string) {
  return Number.parseFloat(String(f.button.style[property]));
}
function until(f: BedFixture, condition: () => boolean, timeout = 60_000) {
  for (let elapsed = 0; elapsed < timeout && !condition(); elapsed += 16) f.advance(16);
  assert.ok(condition(), 'activity completes within its bounded duration');
}
async function ready(f: BedFixture, trot = true) {
  await f.loadAll();
  await f.loadForward();
  await f.loadRest();
  await f.loadActivity();
  if (trot) await f.loadTrot();
}
function apex(f: BedFixture) {
  assert.equal(f.controller.napInBed(), true);
  until(f, () => f.button.dataset.motion === 'hopping' && styleNumber(f, '--milky-hop-lift') < -5);
}

test('a bed visit crouches, makes one low hop with a grounded shadow, and lands before sleeping', async () => {
  // Given a fully decoded dog and a visible bed.
  const f = bedFixture();
  try {
    await ready(f);
    // When Milky is asked to nap.
    assert.equal(f.controller.napInBed(), true);
    until(f, () => f.button.dataset.motion === 'anticipating');
    const takeoff = position(f);
    assert.equal(f.button.dataset.bed, 'false');
    until(f, () => f.button.dataset.motion === 'hopping');
    const lifts: number[] = [];
    let previous = takeoff;
    until(f, () => {
      if (f.button.dataset.motion !== 'hopping') return true;
      const ground = position(f);
      lifts.push(styleNumber(f, '--milky-hop-lift'));
      assert.ok(ground.x >= previous.x && ground.x <= 1440);
      assert.ok(ground.y <= previous.y && ground.y >= 865, 'height belongs to the sprite, not its ground transform');
      assert.equal(f.button.dataset.bed, 'false', 'the bed is occupied only after physical landing');
      previous = ground;
      return false;
    });
    // Then a brief arc ends at the cushion before the sleep transition.
    assert.ok(lifts.length >= 8);
    assert.ok(Math.min(...lifts) < -5 && Math.min(...lifts) > -40, 'the hop stays low');
    assert.equal(f.button.dataset.motion, 'landing');
    assert.equal(f.button.dataset.bed, 'true');
    assert.deepEqual(position(f), { x: 1440, y: 865 });
    assert.equal(styleNumber(f, '--milky-hop-lift'), 0);
    until(f, () => f.button.dataset.pose === 'sleep');
    assert.deepEqual(position(f), { x: 1440, y: 865 });
  } finally { f.restore(); }
});

test('an airborne dog has a smaller softer shadow while its clickable ground position remains registered', async () => {
  // Given the complete hop artwork.
  const f = bedFixture();
  try {
    await ready(f);
    // When Milky reaches the airborne part of the hop.
    apex(f);
    // Then the shadow recedes without changing the destination or bed mask.
    assert.ok(styleNumber(f, '--milky-hop-shadow-scale') > 0);
    assert.ok(styleNumber(f, '--milky-hop-shadow-scale') < 1);
    assert.ok(styleNumber(f, '--milky-hop-shadow-opacity') > 0);
    assert.ok(styleNumber(f, '--milky-hop-shadow-opacity') < 1);
    assert.ok(position(f).x < 1440 && position(f).y >= 865);
    assert.equal(f.button.dataset.bed, 'false');
  } finally { f.restore(); }
});

const interruptions: readonly { readonly name: string; readonly stop: (f: BedFixture) => void }[] = [
  { name: 'the tab is hidden', stop: (f) => { f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange')); } },
  { name: 'a dialog pauses the pet', stop: (f) => f.controller.setActive(false) },
  { name: 'room animation is disabled', stop: (f) => f.controller.setAnimated(false) },
  { name: 'reduced motion is enabled', stop: (f) => { f.media.matches = true; f.media.dispatchEvent(new Event('change')); } },
  { name: 'the controller is destroyed', stop: (f) => f.controller.destroy() },
];
for (const interruption of interruptions) {
  test(`an airborne hop is grounded and cannot finish later when ${interruption.name}`, async () => {
    // Given Milky in the middle of a hop.
    const f = bedFixture();
    try {
      await ready(f);
      apex(f);
      // When the lifecycle boundary interrupts the hop.
      interruption.stop(f);
      const stopped = position(f);
      // Then no suspended lift, landing callback, or sleep timer survives.
      assert.equal(styleNumber(f, '--milky-hop-lift'), 0);
      assert.equal(styleNumber(f, '--milky-hop-shadow-scale'), 1);
      assert.equal(styleNumber(f, '--milky-hop-shadow-opacity'), 1);
      assert.equal(f.button.dataset.bed, 'false');
      assert.equal(f.tasks.size, 0);
      f.advance(120_000);
      assert.deepEqual(position(f), stopped);
      assert.notEqual(f.button.dataset.pose, 'sleep');
      assert.equal(f.tasks.size, 0);
    } finally { f.restore(); }
  });
}

test('cropping the bed during a hop grounds Milky inside the new viewport without completing the old nap', async () => {
  // Given an airborne dog on the wide room layout.
  const f = bedFixture();
  try {
    await ready(f);
    apex(f);
    // When the room changes to a portrait crop.
    f.host.bounds.left = -641;
    f.scene.bounds.width = 390;
    f.bed.bounds.left -= 641;
    f.resize();
    // Then the pet remains reachable and the old arrival is cancelled.
    assert.equal(styleNumber(f, '--milky-hop-lift'), 0);
    assert.equal(f.button.dataset.bed, 'false');
    assert.equal(f.controller.napInBed(), false);
    assert.ok(position(f).x - 641 > 0 && position(f).x - 641 < 390);
    f.advance(2_000);
    assert.notEqual(f.button.dataset.pose, 'sleep');
    assert.equal(f.button.dataset.bed, 'false');
  } finally { f.restore(); }
});

const fallbackCases = [
  { name: 'missing', shipped: false, load: async (_f: BedFixture) => {} },
  { name: 'partially loaded', shipped: true, load: async (f: BedFixture) => { await f.loadTrot(3); } },
  { name: 'decode-rejected', shipped: true, load: async (f: BedFixture) => {
    f.asset('milky-trot-3.webp').decodeFails = true;
    await f.loadTrot();
  } },
] as const;
for (const fallback of fallbackCases) test(`${fallback.name} trot artwork keeps the complete walking fallback into the bed`, async () => {
  // Given a room that does not ship the airborne artwork.
  const f = bedFixture(fallback.shipped);
  try {
    await ready(f, false);
    await fallback.load(f);
    // When Milky visits the bed.
    assert.equal(f.controller.napInBed(), true);
    const motions = new Set<string>();
    until(f, () => { motions.add(f.button.dataset.motion); return f.button.dataset.pose === 'sleep'; });
    // Then walking still reaches the registered cushion without an incomplete hop.
    assert.ok(motions.has('walking'));
    assert.equal(motions.has('anticipating'), false);
    assert.equal(motions.has('hopping'), false);
    assert.deepEqual(position(f), { x: 1440, y: 865 });
    assert.equal(f.button.dataset.bed, 'true');
  } finally { f.restore(); }
});

test('a proportional resize preserves an active hop and its scaled destination', async () => {
  // Given an airborne dog with the bed still fully visible.
  const f = bedFixture();
  try {
    await ready(f);
    apex(f);
    const before = position(f);
    // When the whole room is resized to half size.
    f.host.clientWidth = 836;
    f.host.clientHeight = 470.5;
    f.host.bounds = { left: 0, top: 0, width: 836, height: 470.5 };
    f.scene.bounds = { ...f.host.bounds };
    f.bed.bounds = { left: 655, top: 394, width: 130, height: 71 };
    f.resize();
    // Then the same hop completes on the registered scaled cushion.
    assert.equal(f.button.dataset.motion, 'hopping');
    assert.ok(Math.abs(position(f).x - before.x / 2) <= .01);
    assert.ok(Math.abs(position(f).y - before.y / 2) <= .01);
    until(f, () => f.button.dataset.pose === 'sleep', 5_000);
    assert.deepEqual(position(f), { x: 720, y: 432.5 });
    assert.equal(styleNumber(f, '--milky-hop-lift'), 0);
  } finally { f.restore(); }
});

test('pausing anticipation cancels the pending hop and permits a fresh nap after returning home', async () => {
  // Given Milky preparing to hop.
  const f = bedFixture();
  try {
    await ready(f);
    f.controller.napInBed();
    until(f, () => f.button.dataset.motion === 'anticipating');
    // When a dialog pauses the pet before takeoff, then closes.
    f.controller.setActive(false);
    f.advance(2_000);
    f.controller.setActive(true);
    // Then the canceled visit returns home without firing its old sleep callback.
    until(f, () => {
      assert.equal(f.button.dataset.bed, 'false');
      assert.notEqual(f.button.dataset.pose, 'sleep');
      assert.notEqual(f.button.dataset.motion, 'hopping');
      return f.button.dataset.motion === 'idle';
    });
    assert.equal(f.controller.napInBed(), true);
    until(f, () => f.button.dataset.pose === 'sleep');
    assert.deepEqual(position(f), { x: 1440, y: 865 });
  } finally { f.restore(); }
});

test('repeated nap requests do not restart or duplicate a hop', async () => {
  // Given a hop that has already started.
  const f = bedFixture();
  try {
    await ready(f);
    apex(f);
    const before = position(f);
    // When the bed is activated repeatedly.
    for (let repeat = 0; repeat < 3; repeat++) assert.equal(f.controller.napInBed(), false);
    // Then the same short arrival completes at one registered bed position.
    assert.deepEqual(position(f), before);
    until(f, () => f.button.dataset.pose === 'sleep', 5_000);
    assert.deepEqual(position(f), { x: 1440, y: 865 });
    assert.equal(styleNumber(f, '--milky-hop-lift'), 0);
  } finally { f.restore(); }
});

for (const action of ['feed', 'play'] as const) {
  test(`${action} during a hop cancels the nap and starts only after a safe return to the floor`, async () => {
    // Given Milky airborne beside the bed.
    const f = bedFixture();
    try {
      await ready(f);
      apex(f);
      // When another activity is requested.
      f.controller[action]();
      // Then no lifted sprite or stale bed arrival can leak into the activity.
      assert.equal(styleNumber(f, '--milky-hop-lift'), 0);
      until(f, () => {
        assert.equal(f.button.dataset.bed, 'false');
        assert.notEqual(f.button.dataset.pose, 'sleep');
        return f.propEl(action === 'feed' ? 'bowl' : 'ball').dataset.visible === 'true';
      });
      assert.ok(position(f).x <= floor.right * 1672);
      assert.ok(position(f).y >= floor.top * 941 - .01);
    } finally { f.restore(); }
  });
}

test('a ball drag during the hop cancels arrival and safely resumes a single floor chase', async () => {
  // Given an airborne dog with the persistent draggable ball.
  const f = fixture(7829, POSES, RESTS, true, floor, anchor, { ballHome: { x: .52, y: .977 }, drag: true });
  try {
    await ready(f);
    apex(f);
    const target = f.propEl('ball').children.find((entry) => entry.className === 'cyber-pet-toy');
    assert.ok(target);
    // When the floor ball is dragged and released during flight.
    for (const [type, x] of [['pointerdown', 870], ['pointermove', 830], ['pointerup', 830]] as const) {
      target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), {
        pointerId: 1, clientX: x, clientY: 919, button: 0, isPrimary: true,
      }));
    }
    // Then the abandoned nap cannot fire while Milky returns to chase the ball.
    assert.equal(styleNumber(f, '--milky-hop-lift'), 0);
    assert.equal(target.capturedPointer, undefined);
    until(f, () => {
      assert.equal(f.button.dataset.bed, 'false');
      assert.notEqual(f.button.dataset.pose, 'sleep');
      return f.button.dataset.motion === 'idle';
    });
    assert.ok(position(f).x <= floor.right * 1672);
    assert.ok(position(f).y >= floor.top * 941 - .01);
    assert.equal(f.propEl('ball').dataset.visible, 'true');
  } finally { f.restore(); }
});
