import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createNaturalWalkController } from './cyber-pet-natural-walk.ts';
import { createGroundedWalkAssetLoader } from './cyber-pet-grounded-assets.ts';
import { createNaturalMotion } from './cyber-pet-natural-motion.ts';
import { GROUNDED_FEET } from './cyber-pet-grounded-geometry.ts';
import { milkyDistance } from './cyber-pet-motion.ts';
import type { NaturalJourneySample } from './cyber-pet-natural-journey.ts';
import { fixture } from './cyber-pet-test-support.ts';

const motion = createNaturalMotion(JSON.parse(readFileSync(new URL('../public/assets/cyberpunk/milky-natural-motion/walk-cycle.json', import.meta.url), 'utf8')));
const route = { from: { x: 100, y: 200 }, to: { x: 240, y: 200 }, scale: .1, endScale: .1, facing: 1 } as const;
const frame = (travelled: number) => ({ travelled, root: { x: 100 + travelled, y: 200 }, scale: .1, wrapperWidth: 180, pixelRatio: 1 });

function rig(loadMotion = async (_signal: AbortSignal) => motion) {
  const calls = { requested: 0, prepared: 0, hidden: 0, destroyed: 0, drawn: [] as NaturalJourneySample[] };
  const loader = createGroundedWalkAssetLoader(async (url: string) => {
    calls.requested++; return { image: url, width: 768, height: 512 };
  });
  const controller = createNaturalWalkController(loader, {
    available: () => true, prepare() { calls.prepared++; },
    draw(sample) { calls.drawn.push(sample); return true; },
    hide() { calls.hidden++; }, destroy() { calls.destroyed++; },
  }, loadMotion);
  return { controller, calls };
}

test('natural resources are lazy, reused, and preparation cannot independently start a frame', async () => {
  const { controller, calls } = rig();
  assert.equal(calls.requested, 0);
  assert.equal(controller.begin(route), false);
  assert.equal(await controller.prepare(), true);
  assert.equal(await controller.prepare(), true);
  assert.equal(calls.requested, 3);
  assert.equal(calls.prepared, 1);
  assert.equal(calls.drawn.length, 0);
  assert.deepEqual(controller.metrics?.(), { stride: motion.stride, duration: motion.duration, routeDuration: undefined });
  controller.destroy();
});

test('rest aborts pending natural data and a fresh intent can retry without stale publication', async () => {
  const pending: { signal: AbortSignal; resolve: (value: typeof motion) => void }[] = [];
  const { controller, calls } = rig(signal => new Promise(resolve => pending.push({ signal, resolve })));
  const first = controller.prepare();
  controller.rest();
  assert.equal(pending[0].signal.aborted, true);
  const second = controller.prepare();
  pending[0].resolve(motion);
  assert.equal(await first, false);
  await new Promise<void>(resolve => setImmediate(resolve));
  assert.equal(pending.length, 2);
  pending[1].resolve(motion);
  assert.equal(await second, true);
  assert.equal(calls.prepared, 1);
  assert.equal(calls.drawn.length, 0);
  controller.destroy();
});

test('arrival retains four actual planted feet; same-facing restart keeps their exact solved joints', async () => {
  const { controller, calls } = rig();
  await controller.prepare(); controller.begin(route);
  controller.draw(frame(60)); assert.equal(controller.finish(), false);
  controller.draw(frame(140));
  const final = calls.drawn.at(-1)!;
  assert.ok(GROUNDED_FEET.every(name => final.feet[name].contact));
  assert.equal(controller.finish(), true);
  assert.equal(calls.hidden, 0);
  assert.equal(controller.draw(frame(140)), false);
  controller.begin({ ...route, from: route.to, to: { x: 370, y: 200 } });
  controller.draw({ ...frame(0), root: route.to });
  const restart = calls.drawn.at(-1)!;
  for (const name of GROUNDED_FEET) {
    assert.ok(Math.hypot(final.feet[name].sole.x - restart.feet[name].sole.x, final.feet[name].sole.y - restart.feet[name].sole.y) < 1e-8);
    assert.deepEqual(final.skeleton.limbs[name], restart.skeleton.limbs[name]);
  }
  assert.ok((controller.metrics?.()?.routeDuration ?? 0) > 0);
  controller.destroy(); controller.destroy();
  assert.equal(calls.destroyed, 1);
  assert.equal(controller.ready(), false);
  assert.equal(await controller.prepare(), false);
});

test('cancelling a retry while its old batch drains does not start another background load', async () => {
  let requests = 0;
  let resolve!: (value: typeof motion) => void;
  const { controller } = rig(() => { requests++; return new Promise(done => { resolve = done; }); });
  const first = controller.prepare();
  controller.rest();
  const retry = controller.prepare();
  controller.rest();
  resolve(motion);
  assert.equal(await first, false);
  assert.equal(await retry, false);
  assert.equal(requests, 1);
  controller.destroy();
});

test('invalid input stops the natural surface instead of escaping through the owner frame loop', async () => {
  const { controller, calls } = rig();
  await controller.prepare(); controller.begin(route);
  assert.equal(controller.draw(frame(NaN)), false);
  assert.equal(controller.draw(frame(10)), false);
  assert.equal(calls.hidden, 1);
  assert.equal(calls.drawn.length, 0);
  controller.destroy();
});

test('a final distance rounded one ULP short still retains the completed planted drawing', async () => {
  const { controller, calls } = rig();
  const diagonal = { from: { x: .58 * 1672, y: .9 * 941 }, to: { x: .30004 * 1672, y: .923 * 941 }, scale: .1, endScale: .1, facing: -1 as const };
  const distance = Math.hypot(diagonal.to.x - diagonal.from.x, diagonal.to.y - diagonal.from.y);
  const normalized = milkyDistance({ x: .58, y: .9 }, { x: .30004, y: .923 });
  const travelled = distance * normalized / normalized;
  assert.ok(travelled < distance, 'this diagonal reproduces the real route-unit rounding');
  await controller.prepare(); controller.begin(diagonal);
  controller.draw({ ...frame(travelled), root: diagonal.to });
  assert.equal(controller.finish(), true);
  assert.equal(calls.drawn.at(-1)?.complete, true);
  assert.equal(calls.hidden, 0);
  controller.destroy();
});

const naturalFixture = () => fixture(7829, undefined, undefined, true, undefined, undefined, undefined, { photoMotions: true, groundedWalk: true, locomotion: 'natural' });
const figure = (f: ReturnType<typeof fixture>) => f.button.children.find(child => child.className === 'cyber-pet-figure')!;

test('first natural room walk waits for its own resources and uses only the existing frame loop', async () => {
  const f = naturalFixture();
  try {
    await f.loadAll(); await f.loadForward();
    const position = f.button.style.transform;
    f.key('ArrowRight'); f.advance(200);
    assert.equal(f.button.style.transform, position, 'no released fallback starts while candidate is pending');
    assert.equal(f.authoredRequests.length, 1);
    assert.equal(f.authoredRequests[0].url, '/assets/cyberpunk/milky-natural-motion/walk-cycle.json');
    await f.loadGrounded();
    assert.equal(f.button.dataset.motion, 'walking');
    assert.equal(figure(f).attributes['data-locomotion'], 'natural');
    f.advance(400);
    assert.notEqual(f.button.style.transform, position);
    assert.equal([...f.tasks.values()].filter(task => task.kind === 'frame').length, 1);
    f.advance(20000);
    assert.equal(figure(f).attributes['data-grounded'], 'true');
    assert.equal(f.tasks.size, 0, 'keyboard focus leaves the completed drawing static');
  } finally { f.restore(); }
});

test('hidden cancellation while first natural walk loads cannot later resurrect it', async () => {
  const f = naturalFixture();
  try {
    await f.loadAll(); await f.loadForward();
    f.key('ArrowRight'); f.advance(200);
    const position = f.button.style.transform;
    f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange'));
    await f.flushMicrotasks();
    assert.equal(f.authoredRequests[0].signal?.aborted, true);
    f.advance(10000);
    assert.equal(f.button.style.transform, position);
    assert.equal(f.tasks.size, 0);
    assert.equal(figure(f).attributes['data-grounded'], undefined);
  } finally { f.restore(); }
});

test('failed natural data leaves the requested research candidate still instead of substituting the released gait', async () => {
  const f = naturalFixture();
  try {
    await f.loadAll(); await f.loadForward();
    const position = f.button.style.transform;
    f.key('ArrowRight'); f.advance(200);
    await f.failAuthored(); f.advance(5000);
    assert.equal(f.button.style.transform, position);
    assert.equal(figure(f).attributes['data-grounded'], undefined);
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});

test('a queued natural reversal executes after the previous route has landed', async () => {
  const f = naturalFixture();
  try {
    await f.loadAll(); await f.loadForward();
    f.key('ArrowRight'); f.advance(200); await f.loadGrounded(); f.advance(350);
    f.key('ArrowLeft');
    assert.equal(f.button.dataset.facing, 'right');
    f.advance(30000);
    assert.equal(f.button.dataset.facing, 'left');
    assert.equal(figure(f).attributes['data-locomotion'], 'natural');
    assert.equal(f.tasks.size, 0);
    assert.equal(f.authoredRequests.length, 1);
  } finally { f.restore(); }
});

test('a natural floor redirect waits for touchdown and lifecycle cancellation clears that redirect', async () => {
  const f = naturalFixture();
  try {
    await f.loadAll(); await f.loadForward();
    f.key('ArrowRight'); f.advance(200); await f.loadGrounded(); f.advance(350);
    const before = f.button.style.transform;
    f.key('ArrowLeft');
    assert.equal(f.button.dataset.facing, 'right');
    assert.equal(f.button.dataset.motion, 'walking');
    assert.equal(f.button.style.transform, before);
    f.advance(100);
    assert.equal(f.button.dataset.facing, 'right', 'the redirect does not flip an airborne stride');
    f.controller.setActive(false); await f.flushMicrotasks();
    const stopped = f.button.style.transform;
    f.advance(30000);
    assert.equal(f.button.style.transform, stopped);
    assert.equal(f.tasks.size, 0);
  } finally { f.restore(); }
});
