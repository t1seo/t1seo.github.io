import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGroundedController } from './cyber-pet-grounded-controller.ts';
import { createGroundedWalkAssetLoader } from './cyber-pet-grounded-assets.ts';
const route = { from: { x: 400, y: 900 }, to: { x: 580, y: 900 }, scale: .11, endScale: .11, facing: 1 } as const;
function fixture() {
  const calls = { draws: 0, hides: 0, destroyed: 0, requests: 0, prepared: 0, load: 0 };
  const loader = createGroundedWalkAssetLoader(async (url: string) => { calls.requests++; return { image: url, width: 768, height: 512 }; });
  const controller = createGroundedController(loader, { available: () => true,
    prepare() { calls.prepared++; }, draw(sample) { calls.draws++; calls.load = sample.load; return true; },
    hide() { calls.hides++; }, destroy() { calls.destroyed++; } });
  return { calls, controller };
}
test('never requests, draws or starts a loop before deliberate preparation', () => {
  // Given a mounted optional renderer.
  const f = fixture();
  // When its readiness is queried and a premature move attempted.
  assert.equal(f.controller.ready(), false); assert.equal(f.controller.begin(route), false);
  // Then existing sprite fallback owns the entire movement.
  assert.equal(f.calls.requests, 0); assert.equal(f.calls.draws, 0);
});
test('preparation never starts a delayed walk when an image finishes', async () => {
  // Given an explicitly prepared asset set.
  const f = fixture();
  // When all decodes complete.
  assert.equal(await f.controller.prepare(), true);
  // Then a fresh begin and caller frame are still required.
  assert.equal(f.calls.requests, 3); assert.equal(f.calls.draws, 0); assert.equal(f.controller.ready(), true);
});
test('rest blocks pending publication and subsequent caller frames', async () => {
  // Given an in-flight load from a movement intent.
  const f = fixture(), pending = f.controller.prepare();
  // When hidden, still or modal lifecycle cancels it.
  f.controller.rest();
  // Then late completion cannot render or arm a plan.
  assert.equal(await pending, false); assert.equal(f.controller.ready(), false);
  assert.equal(f.controller.draw({ travelled: 10, root: route.from, scale: .11, wrapperWidth: 200, pixelRatio: 2 }), false);
  assert.equal(f.calls.draws, 0);
});
test('eases the walking load from and back to the authored idle height', async () => {
  // Given a ready renderer and finite route.
  const f = fixture(); await f.controller.prepare(); f.controller.begin(route);
  // When the caller samples start, cruise and arrival.
  const loads = [0, 80, 180].map(travelled => { f.controller.draw({ travelled, root: { x: 400 + travelled, y: 900 }, scale: .11, wrapperWidth: 200, pixelRatio: 2 }); return f.calls.load; });
  // Then there is no instantaneous crouch or post-arrival animation.
  assert.deepEqual(loads, [0, 20, 0]); assert.equal(f.calls.draws, 3);
});
test('destroy makes cached readiness and all further drawing unavailable', async () => {
  // Given cached art and a moving rig.
  const f = fixture(); await f.controller.prepare(); f.controller.begin(route);
  // When the room is destroyed.
  f.controller.destroy(); f.controller.destroy();
  // Then teardown is idempotent and cannot restart.
  assert.equal(f.controller.ready(), false); assert.equal(await f.controller.prepare(), false);
  assert.equal(f.controller.begin(route), false); assert.equal(f.calls.destroyed, 1); assert.equal(f.calls.draws, 0);
});
test('keeps an impossible articulated pose hidden and returns control to the sprite fallback', async () => {
  // Given a ready painter that rejects an unreachable physical pose.
  let hidden = false, draws = 0;
  const loader = createGroundedWalkAssetLoader(async (url: string) => ({ image: url, width: 768, height: 512 }));
  const controller = createGroundedController(loader, { available: () => true, prepare() {},
    draw() { draws++; return false; }, hide() { hidden = true; }, destroy() {} });
  await controller.prepare(); controller.begin(route);
  const frame = { travelled: 10, root: route.from, scale: .11, wrapperWidth: 200, pixelRatio: 2 };
  // When the current pose would require a rubber-stretched limb.
  const accepted = controller.draw(frame);
  // Then the whole remaining leg uses the existing fallback without a late rig restart.
  assert.equal(accepted, false); assert.equal(hidden, true);
  assert.equal(controller.draw(frame), false); assert.equal(draws, 1);
});
test('preserves torso height at the first frame of a one-pixel compatible retarget', async () => {
  // Given a walking load already applied during a continuous route.
  const f = fixture(); await f.controller.prepare(); f.controller.begin(route);
  f.controller.draw({ travelled: 80, root: { x: 480, y: 900 }, scale: .11, wrapperWidth: 200, pixelRatio: 2 });
  const before = f.calls.load;
  f.controller.begin({ ...route, from: { x: 480, y: 900 }, to: { x: 481, y: 900 } }, true);
  // When the replacement route starts at the same visible position.
  f.controller.draw({ travelled: 0, root: { x: 480, y: 900 }, scale: .11, wrapperWidth: 200, pixelRatio: 2 });
  // Then a tiny remaining distance cannot abruptly cancel the existing weight transfer.
  assert.equal(before, 20); assert.equal(f.calls.load, before);
});
test('holds the final painted stance without a late redraw or a legacy leg swap', async () => {
  // Given the completed visible route.
  const f = fixture(); await f.controller.prepare(); f.controller.begin(route);
  const frame = { travelled: 180, root: route.to, scale: .11, wrapperWidth: 200, pixelRatio: 2 };
  f.controller.draw(frame);
  // When arrival freezes the already rendered neutral stance.
  const held = f.controller.finish();
  // Then the pixels stay visible while further frame calls do no work.
  assert.equal(held, true); assert.equal(f.calls.hides, 0);
  assert.equal(f.controller.draw(frame), false); assert.equal(f.calls.draws, 1);
});
test('never freezes an unfinished airborne stride as idle', async () => {
  // Given a walking dog before the endpoint.
  const f = fixture(); await f.controller.prepare(); f.controller.begin(route);
  f.controller.draw({ travelled: 80, root: { x: 480, y: 900 }, scale: .11, wrapperWidth: 200, pixelRatio: 2 });
  // When an invalid premature finish is requested.
  const held = f.controller.finish();
  // Then arrival must remain owned by the active route.
  assert.equal(held, false);
});
test('lifecycle cancellation hides even an already frozen final stance', async () => {
  // Given a quiet grounded forward idle.
  const f = fixture(); await f.controller.prepare(); f.controller.begin(route);
  f.controller.draw({ travelled: 180, root: route.to, scale: .11, wrapperWidth: 200, pixelRatio: 2 });
  f.controller.finish();
  // When still, hidden, modal or resize cancellation arrives.
  f.controller.rest();
  // Then the retained canvas no longer overrides the authored posture.
  assert.equal(f.calls.hides, 1); assert.equal(f.controller.finish(), false);
});
