import assert from 'node:assert/strict';
import { test } from 'node:test';
import { solveGroundJoint } from './cyber-pet-grounded-geometry.ts';
test('keeps both painted bone lengths when a reachable paw bends', () => {
  // Given a loaded shoulder and a planted wrist.
  const root = { x: 1070, y: 615 }, wrist = { x: 1195, y: 880 };
  const out = { x: 0, y: 0, reachable: false };
  // When the articulated joint is solved.
  solveGroundJoint(root, wrist, 152, 161, 1, out);
  // Then both rigid lengths and the elbow bend remain anatomical.
  assert.equal(out.reachable, true);
  assert.ok(Math.abs(Math.hypot(out.x - root.x, out.y - root.y) - 152) < 1e-7);
  assert.ok(Math.abs(Math.hypot(out.x - wrist.x, out.y - wrist.y) - 161) < 1e-7);
  assert.ok(out.x < root.x + 125 / 2);
});
test('reports a target outside physical reach rather than stretching a limb', () => {
  // Given an unreachable contact target.
  const out = { x: 0, y: 0, reachable: true };
  // When IK is requested.
  solveGroundJoint({ x: 0, y: 0 }, { x: 600, y: 0 }, 150, 160, 1, out);
  // Then the upper bone stays rigid and reach is explicitly false.
  assert.equal(out.reachable, false);
  assert.ok(Math.abs(Math.hypot(out.x, out.y) - 150) < 1e-6);
});
