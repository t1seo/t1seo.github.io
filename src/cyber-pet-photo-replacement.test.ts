import assert from 'node:assert/strict';
import test from 'node:test';
import type { MilkyPhotoMotion } from './cyber-pet.ts';
import { fixture, RESTS } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const setup = () => fixture(7829, ['blink'], RESTS, true, floor,
  { x: 1440 / 1672, y: 865 / 941 }, { ballHome: { x: .52, y: .977 }, transitions: true }, { photoMotions: true });
type Fixture = ReturnType<typeof setup>;
const FILES: Partial<Record<MilkyPhotoMotion, readonly string[]>> = {
  'paws-rest': ['paws-lower', 'paws-rest'],
  'belly-up': ['roll-side', 'roll-half', 'belly-up', 'belly-relaxed'],
  'chin-rest': ['chin-lower', 'chin-rest'],
  tilt: ['tilt-near', 'tilt-full'],
};
async function warm(f: Fixture, kind: MilkyPhotoMotion) {
  assert.equal(f.controller.photoMotion(kind), true);
  f.controller.setActive(false);
  for (const frame of FILES[kind] ?? []) await f.load(`${frame}.webp`, 768, 512);
  f.controller.setActive(true);
}
function until(f: Fixture, predicate: () => boolean, duration = 60_000) {
  for (let elapsed = 0; elapsed < duration && !predicate(); elapsed += 16) f.advance(16);
  assert.ok(predicate(), 'the real controller reaches the requested posture');
}

test('a standing photo rest descends through the authored sitdown bridge', async t => {
  // Given a standing dog with the actual rest bridges and photo frames ready.
  const f = setup(); t.after(f.restore); await f.loadAll(); await f.loadRest();
  await warm(f, 'paws-rest');
  const feet = f.button.style.transform;
  // When the visitor asks for the paws-rest moment.
  f.controller.photoMotion('paws-rest');
  // Then the first transition bends the hindquarters before sitting in place.
  assert.equal(f.button.dataset.pose, 'sitdown');
  until(f, () => f.button.dataset.pose === 'sit');
  assert.equal(f.button.style.transform, feet);
});

test('replacing a floor photo rest with a bed moment stands before the approach walk', async t => {
  // Given the prone photo rest and a warmed bed-roll action.
  const f = setup(); t.after(f.restore); await f.loadAll(); await f.loadRest();
  await warm(f, 'paws-rest'); await warm(f, 'belly-up');
  f.controller.photoMotion('paws-rest'); until(f, () => f.button.dataset.pose === 'paws-rest');
  const feet = f.button.style.transform;
  // When the visitor requests the bed roll.
  f.controller.photoMotion('belly-up');
  // Then Milky reverses the prone descent before standing and walking to the bed.
  assert.equal(f.button.dataset.pose, 'paws-lower');
  const poses: string[] = [];
  for (let elapsed = 0; elapsed < 10_000 && f.button.dataset.motion !== 'walking'; elapsed += 16) {
    assert.equal(f.button.style.transform, feet, 'no prone sliding toward the bed');
    if (poses.at(-1) !== f.button.dataset.pose) poses.push(f.button.dataset.pose);
    f.advance(16);
  }
  assert.equal(f.button.dataset.motion, 'walking');
  assert.ok(poses.includes('sit'));
  assert.ok(poses.includes('idle'));
});

test('the latest floor action cancels a bed moment queued during approach', async t => {
  // Given all three moments cached, with a chin request queued during bed approach.
  const f = setup(); t.after(f.restore); await f.loadAll(); await f.loadRest();
  await warm(f, 'belly-up'); await warm(f, 'chin-rest'); await warm(f, 'tilt');
  f.controller.photoMotion('belly-up'); f.advance(240);
  f.controller.photoMotion('chin-rest'); f.advance(160);
  f.button.focusVisible = true; f.button.dispatchEvent(new Event('focus'));
  // When the visitor supersedes that pending bed intent with a tilt.
  f.controller.photoMotion('tilt');
  // Then only the newest moment executes; the canceled chin never resurfaces.
  const poses = new Set<string>();
  for (let elapsed = 0; elapsed < 45_000; elapsed += 16) {
    poses.add(f.button.dataset.pose); f.advance(16);
  }
  assert.ok(poses.has('tilt-full'));
  assert.equal(poses.has('chin-lower'), false);
  assert.equal(poses.has('chin-rest'), false);
});
