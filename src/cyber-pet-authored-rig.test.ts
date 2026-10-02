import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { loadAuthoredCanine } from './cyber-pet-authored-clip.ts';
import { createAuthoredRig } from './cyber-pet-authored-rig.ts';
import { GROUNDED_FEET, GROUNDED_JOINTS, GROUNDED_LIMBS } from './cyber-pet-grounded-geometry.ts';
import { GROUNDED_PADS } from './cyber-pet-grounded-articulation.ts';
import type { GroundedSkeleton } from './cyber-pet-grounded-articulation.ts';

const MODES = ['walk', 'run', 'idle'] as const;
async function loadRig() {
  const bytes = await readFile(new URL('../public/assets/cyberpunk/milky-authored/canine-clips.glb', import.meta.url));
  const canine = await loadAuthoredCanine(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  return { canine, rig: createAuthoredRig(canine) };
}
function coordinates(skeleton: GroundedSkeleton): number[] {
  return [...Object.values(skeleton.body), ...GROUNDED_FEET.flatMap(name => {
    const limb = skeleton.limbs[name];
    return [limb.root.x, limb.root.y, limb.joint.x, limb.joint.y, limb.wrist.x, limb.wrist.y,
      limb.pad.x, limb.pad.y, limb.pawAngle, limb.distalAngle];
  })];
}

test('the real authored rig can seek across modes and wrap complete cycles deterministically', async () => {
  const { canine, rig } = await loadRig();
  try {
    for (const mode of MODES) {
      const duration = canine.durations[mode], t = duration * .371;
      const reference = coordinates(rig.sample(mode, t));
      for (const other of MODES) rig.sample(other, canine.durations[other] * .817);
      assert.deepEqual(coordinates(rig.sample(mode, t)), reference);
      const wrapped = coordinates(rig.sample(mode, t + duration * 3));
      for (let i = 0; i < reference.length; i++) assert.ok(Math.abs(reference[i] - wrapped[i]) < 1e-8);
      const start = coordinates(rig.sample(mode, 0));
      assert.deepEqual(coordinates(rig.sample(mode, duration)), start);
      const before = coordinates(rig.sample(mode, duration - 1e-7));
      const after = coordinates(rig.sample(mode, 1e-7));
      for (let i = 0; i < before.length; i++) assert.ok(Math.abs(before[i] - after[i]) < .01,
        `${mode} component ${i} must not jump at the authored loop seam`);
    }
  } finally { canine.dispose(); }
});

test('zero animation weight restores the art pose independently of time and clip', async () => {
  const { canine, rig } = await loadRig();
  try {
    const reference = structuredClone(rig.sample('walk', 0, 0));
    assert.ok(Object.values(reference.body).every(value => Math.abs(value) < 1e-12));
    for (const name of GROUNDED_FEET) {
      const limb = reference.limbs[name];
      assert.deepEqual(limb.root, GROUNDED_LIMBS[name].root);
      assert.ok(Math.abs(limb.pawAngle) < 1e-12, `${name} sole returns to its source orientation`);
      assert.ok(Math.abs(limb.distalAngle) < 1e-12);
      assert.ok(limb.pad.y > limb.root.y && limb.joint.y > limb.root.y);
      if (name.startsWith('near')) {
        const kind = GROUNDED_LIMBS[name].kind, source = GROUNDED_JOINTS[kind];
        assert.deepEqual({ x: limb.joint.x, y: limb.joint.y }, source[1]);
        assert.deepEqual(limb.wrist, source[2]);
        assert.deepEqual(limb.pad, GROUNDED_PADS[kind]);
      }
    }
    for (const mode of MODES) for (const phase of [0, .27, .71, 1]) {
      for (const weight of [0, -1]) {
        const actual = coordinates(rig.sample(mode, phase * canine.durations[mode], weight));
        const expected = coordinates(reference);
        for (let i = 0; i < actual.length; i++) assert.ok(Math.abs(actual[i] - expected[i]) < 1e-12);
      }
    }
  } finally { canine.dispose(); }
});

test('complete authored cycles animate knees and torso/head and keep a nondegenerate finite rig', async () => {
  const { canine, rig } = await loadRig();
  try {
    for (const mode of MODES) {
      const samples: GroundedSkeleton[] = [];
      for (let frame = 0; frame <= 480; frame++) {
        const seconds = canine.durations[mode] * frame / 480;
        for (const weight of [0, .25, .5, 1]) {
          const skeleton = rig.sample(mode, seconds, weight);
          assert.ok(coordinates(skeleton).every(Number.isFinite), `${mode} at ${frame}, weight ${weight}`);
          for (const name of GROUNDED_FEET) {
            const limb = skeleton.limbs[name], points = [limb.root, limb.joint, limb.wrist, limb.pad];
            for (let i = 1; i < points.length; i++) assert.ok(Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y) > 1,
              `${mode} ${name} segment ${i} must stay usable by the texture renderer`);
            assert.ok(Math.abs(limb.pawAngle) <= Math.PI && Math.abs(limb.distalAngle) <= Math.PI);
          }
          if (weight === 1) samples.push(structuredClone(skeleton));
        }
      }
      const range = (pick: (s: GroundedSkeleton) => number) => {
        const values = samples.map(pick); return Math.max(...values) - Math.min(...values);
      };
      assert.ok(range(s => s.body.y) > .1, `${mode} retains source torso movement`);
      assert.ok(range(s => s.body.head) > .0001, `${mode} retains source neck/head movement`);
      for (const name of GROUNDED_FEET) {
        assert.ok(range(s => s.limbs[name].joint.x) + range(s => s.limbs[name].joint.y) > 1,
          `${mode} ${name} retains authored knee/elbow movement`);
        if (mode !== 'idle') assert.ok(range(s => s.limbs[name].pawAngle) > .1,
          `${mode} ${name} retains authored paw rotation`);
      }
    }
  } finally { canine.dispose(); }
});
