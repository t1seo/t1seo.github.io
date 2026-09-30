import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseMilkyDestination, milkyKeyboardDestination, milkyRoamPause } from './cyber-pet-roam.ts';
import { placeMilky, type MilkyPoint } from './cyber-pet-geometry.ts';

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
const scene = { left: 0, top: 0, width: 1672, height: 941 };
const constrain = (point: MilkyPoint) => placeMilky(scene, scene, point);

test('random walks use varied safe destinations rather than fixed alternating endpoints', () => {
  const random = seeded(429);
  let point = { x: .58, y: .865 };
  let previous: MilkyPoint | undefined;
  const endpoints = new Set<string>();
  const lengths = new Set<number>();
  const headings: number[] = [];
  let depthMoves = 0;
  for (let i = 0; i < 120; i++) {
    const target = chooseMilkyDestination(point, constrain, previous, random);
    assert.ok(target);
    assert.deepEqual(target, constrain(target));
    const dx = target.x - point.x;
    const dy = target.y - point.y;
    assert.ok(Math.abs(dx) >= .012);
    assert.ok(Math.abs(dy) * .563 <= Math.abs(dx) * .7);
    assert.ok(Math.abs(dx) <= .111001);
    if (Math.abs(dy) > .005) depthMoves++;
    endpoints.add(`${target.x.toFixed(4)},${target.y.toFixed(4)}`);
    lengths.add(Math.round(Math.abs(dx) * 1000));
    headings.push(Math.sign(dx));
    previous = { x: dx, y: dy };
    point = target;
  }
  assert.ok(endpoints.size > 100);
  assert.ok(lengths.size > 25);
  assert.ok(depthMoves > 60);
  assert.ok(headings.some((heading, i) => i > 0 && heading === headings[i - 1]), 'does not ping-pong every step');
  assert.ok(headings.includes(-1) && headings.includes(1));
});

test('a previous heading is preferred, while room edges still permit natural reversal', () => {
  let continued = 0;
  let reversed = 0;
  for (let seed = 1; seed <= 500; seed++) {
    const next = chooseMilkyDestination({ x: .57, y: .88 }, constrain, { x: .05, y: .01 }, seeded(seed))!;
    if (next.x > .57) continued++; else reversed++;
  }
  assert.ok(continued > reversed * 2, `${continued} continuations vs ${reversed} reversals`);
  const right = constrain({ x: 1, y: .89 });
  const retreat = chooseMilkyDestination(right, constrain, { x: .05, y: 0 }, seeded(91));
  assert.ok(retreat && retreat.x < right.x);
});

test('mobile cover crops remain contained and collapsed floor cannot produce vertical sliding', () => {
  const mobileViewport = { left: 0, top: 0, width: 390, height: 844 };
  const mobileScene = { left: -680, top: 0, width: 1499, height: 844 };
  const mobileBound = (point: MilkyPoint) => placeMilky(mobileScene, mobileViewport, point);
  const random = seeded(2718);
  let position = mobileBound({ x: .595, y: .845 });
  for (let i = 0; i < 80; i++) {
    const next = chooseMilkyDestination(position, mobileBound, undefined, random);
    assert.ok(next);
    assert.deepEqual(next, mobileBound(next));
    position = next;
  }
  assert.equal(chooseMilkyDestination({ x: .5, y: .85 }, (point) => ({ ...point, x: .5 }), undefined, seeded(9)), undefined);
});

test('pause duration varies inside the requested interval and keyboard depth requests remain diagonal', () => {
  const random = seeded(331);
  const pauses = Array.from({ length: 20 }, () => milkyRoamPause(random));
  assert.ok(pauses.every((pause) => pause >= 9000 && pause < 18000));
  assert.ok(new Set(pauses.map(Math.round)).size > 18);
  const afterWalk = Array.from({ length: 200 }, () => milkyRoamPause(seeded(Math.round(random() * 1e9)), true));
  assert.ok(afterWalk.every((pause) => pause >= 3200 && pause < 18000));
  assert.ok(afterWalk.some((pause) => pause < 9000), 'a finished walk sometimes earns only a short curious rest');
  assert.ok(afterWalk.some((pause) => pause >= 9000), 'long rests remain the common case');
  const origin = { x: .57, y: .87 };
  for (const key of ['ArrowUp', 'ArrowDown']) {
    const next = milkyKeyboardDestination(origin, key, 1, constrain);
    assert.ok(next.x > origin.x);
    assert.equal(Math.sign(next.y - origin.y), key === 'ArrowUp' ? -1 : 1);
  }
  const edge = constrain({ x: 1, y: .88 });
  assert.ok(milkyKeyboardDestination(edge, 'ArrowDown', 1, constrain).x < edge.x);
});
