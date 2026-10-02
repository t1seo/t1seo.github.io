import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { loadAuthoredCanine } from './cyber-pet-authored-clip.ts';

async function loadClip() {
  const bytes = await readFile(new URL('../public/assets/cyberpunk/milky-authored/canine-clips.glb', import.meta.url));
  return loadAuthoredCanine(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

test('authored canine exposes distinct animated walk, run, and idle poses without a renderer', async () => {
  const canine = await loadClip();
  try {
    for (const mode of ['walk', 'run', 'idle'] as const) {
      assert.ok(canine.durations[mode] > 0);
      const start = structuredClone(canine.sample(mode, 0));
      const next = canine.sample(mode, canine.durations[mode] * .37);
      assert.ok(Object.keys(next.bones).length >= 46);
      assert.notDeepEqual(next, start, `${mode} plays the asset animation`);
      for (const name of ['Head', 'Torso', 'Tail1', 'FrontShoulder.L', 'FrontUpperLeg.L', 'FrontLowerLeg.L', 'BackShoulder.R', 'BackLeg.R', 'BackUpperLeg.R', 'BackLowerLeg.R', 'FF.L', 'FFB.L', 'IKFrontLeg.L', 'IKBackLeg.L']) {
        const bone = next.bones[name];
        assert.ok(bone, `original bone name ${name} survives loading`);
        assert.ok(Object.values(bone.position).every(Number.isFinite));
        assert.ok(Object.values(bone.quaternion).every(Number.isFinite));
      }
    }
  } finally { canine.dispose(); }
});

test('absolute seeks wrap and survive clip changes without modifying the separate rest pose', async () => {
  const canine = await loadClip();
  try {
    const rest = structuredClone(canine.rest);
    const time = canine.durations.walk * .43;
    const reference = structuredClone(canine.sample('walk', time));
    canine.sample('run', .3);
    canine.sample('idle', 2.7);
    assert.deepEqual(canine.sample('walk', time), reference);
    const periodic = canine.sample('walk', time + canine.durations.walk * 5);
    for (const name of Object.keys(reference.bones)) {
      for (const axis of ['x', 'y', 'z'] as const) {
        assert.ok(Math.abs(periodic.bones[name].position[axis] - reference.bones[name].position[axis]) < 1e-10);
      }
    }
    const cycleStart = structuredClone(canine.sample('walk', 0));
    assert.deepEqual(cycleStart, canine.sample('walk', canine.durations.walk));
    assert.deepEqual(canine.rest, rest);
    assert.throws(() => canine.sample('walk', Number.NaN), /finite/);
  } finally { canine.dispose(); }
  assert.doesNotThrow(() => canine.dispose());
  assert.throws(() => canine.sample('walk', 0), /disposed/);
});

test('original walking has coordinated torso and paw lift with Y-up and Z-forward axes', async () => {
  const canine = await loadClip();
  try {
    assert.ok(canine.rest.bones.Head.position.z > canine.rest.bones.Tail1.position.z);
    assert.ok(canine.rest.bones['FF.L'].position.x > canine.rest.bones['FF.R'].position.x);
    const height: Record<string, number[]> = { 'FF.L': [], 'FF.R': [], 'FFB.L': [], 'FFB.R': [], Body: [] };
    for (let i = 0; i < 120; i++) {
      const pose = canine.sample('walk', canine.durations.walk * i / 120);
      for (const name of Object.keys(height)) height[name].push(pose.bones[name].position.y);
    }
    for (const [name, values] of Object.entries(height)) {
      assert.ok(Math.max(...values) - Math.min(...values) > (name === 'Body' ? .02 : .1), `${name} is actually animated`);
    }
  } finally { canine.dispose(); }
});
