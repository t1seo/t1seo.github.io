import assert from 'node:assert/strict';
import test from 'node:test';
import { placeMilky, milkyWalkProgress, milkyHasVisibleFloor } from './cyber-pet-geometry.ts';

test('Milky stays in the cropped mobile floor above the controls', () => {
  const room = { left: -749, top: -7, width: 1500, height: 857 };
  const viewport = { left: 0, top: 0, width: 390, height: 844 };
  for (const requested of [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: .595, y: .878 }]) {
    const p = placeMilky(room, viewport, requested);
    const x = room.left + p.x * room.width;
    const paws = room.top + p.y * room.height;
    assert.ok(x >= 86 && x <= 304, `visible center: ${x}`);
    assert.ok(paws <= 742, `paws above controls: ${paws}`);
  }
});

test('Milky stays away from the furniture at desktop edges', () => {
  const rect = { left: 0, top: 0, width: 1672, height: 941 };
  assert.equal(placeMilky(rect, rect, { x: -1, y: 1 }).x, .4);
  assert.equal(placeMilky(rect, rect, { x: 2, y: 1 }).x, .745);
});

test('compact phones retain Milky above the footer instead of hiding available floor', () => {
  const viewport = { left: 0, top: 0, width: 320, height: 568 };
  const height = viewport.height * 1.016;
  const width = height * 1672 / 941;
  const room = { left: (viewport.width - width) * .675, top: (viewport.height - height) / 2, width, height };
  assert.equal(milkyHasVisibleFloor(room, viewport), true);
  const pose = placeMilky(room, viewport, { x: .595, y: .878 });
  assert.ok(pose.y >= .83);
  assert.ok(room.top + pose.y * room.height <= 484);
});

test('an ultrawide cover crop hides Milky rather than lifting him onto the desk', () => {
  const height = 3840 * 941 / 1672;
  const room = { left: 0, top: (1080 - height) / 2, width: 3840, height };
  const viewport = { left: 0, top: 0, width: 3840, height: 1080 };
  assert.equal(milkyHasVisibleFloor(room, viewport), false);
  assert.ok(placeMilky(room, viewport, { x: .58, y: .955 }).y >= .83);
  const normal = { left: 0, top: 0, width: 1672, height: 941 };
  assert.equal(milkyHasVisibleFloor(normal, normal), true);
});

test('walk advances monotonically and arrives exactly, with gentle acceleration', () => {
  assert.equal(milkyWalkProgress(-1), 0);
  assert.equal(milkyWalkProgress(1.5), 1);
  let last = 0;
  for (let i = 0; i <= 100; i++) {
    const next = milkyWalkProgress(i / 100);
    assert.ok(next >= last && next <= 1);
    last = next;
  }
  assert.ok(milkyWalkProgress(.02) < .02);
  assert.ok(milkyWalkProgress(.98) > .98);
});
