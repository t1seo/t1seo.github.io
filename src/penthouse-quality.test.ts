import test from 'node:test';
import assert from 'node:assert/strict';
import { AdaptiveEffectQuality, EFFECT_DENSITY } from './penthouse-quality.ts';

const sample = (quality: AdaptiveEffectQuality, seconds: number, frame = 1000 / 60, paint = 2) => {
  for (let elapsed = 0; elapsed < seconds * 1000; elapsed += frame) quality.sample(frame, paint);
};

test('sustained expensive painting first reduces weather detail to balanced', () => {
  const quality = new AdaptiveEffectQuality();
  sample(quality, 3, 1000 / 60, 14);
  assert.equal(quality.detail, 'balanced');
});

test('persistent painting pressure reduces weather detail further after a cooldown', () => {
  const quality = new AdaptiveEffectQuality();
  sample(quality, 9, 1000 / 60, 14);
  assert.equal(quality.detail, 'quiet');
  assert.ok(EFFECT_DENSITY[quality.detail].beads < .5);
});

test('missed animation frames reduce density even when the compositor itself is fast', () => {
  const quality = new AdaptiveEffectQuality();
  sample(quality, 3, 50, 2);
  assert.equal(quality.detail, 'balanced');
});

test('a single slow frame or a long pause cannot lower quality', () => {
  const quality = new AdaptiveEffectQuality();
  sample(quality, 2);
  quality.sample(180, 30);
  quality.sample(10000, 1);
  sample(quality, 3);
  assert.equal(quality.detail, 'full');
});

test('healthy frames restore detail slowly without oscillating after a downgrade', () => {
  const quality = new AdaptiveEffectQuality();
  sample(quality, 9, 1000 / 60, 14);
  sample(quality, 10);
  assert.equal(quality.detail, 'quiet');
  sample(quality, 12);
  assert.equal(quality.detail, 'balanced');
  sample(quality, 22);
  assert.equal(quality.detail, 'full');
});

test('restart discards pre-pause timing pressure while preserving the selected density', () => {
  const quality = new AdaptiveEffectQuality();
  sample(quality, 3, 1000 / 60, 14);
  quality.resetSampling();
  sample(quality, 3);
  assert.equal(quality.detail, 'balanced');
});

test('a middle performance band holds the current level without slow oscillation', () => {
  const quality = new AdaptiveEffectQuality();
  sample(quality, 3, 1000 / 60, 14);
  quality.resetSampling();
  sample(quality, 90, 24, 6);
  assert.equal(quality.detail, 'balanced');
});
