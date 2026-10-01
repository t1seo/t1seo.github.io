import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './cyber-pet-test-support.ts';

test('reversing a forward-looking walk gives a brief planted glance before the new heading', async () => {
  const f = fixture();
  try {
    await f.loadAll(); await f.loadForward();
    f.button.dataset.gaze = 'forward';
    const feet = f.button.style.transform;
    f.key('ArrowLeft');
    assert.equal(f.button.dataset.motion, 'turning');
    assert.equal(f.button.dataset.gaze, 'camera');
    assert.equal(f.button.dataset.facing, 'right');
    f.advance(160);
    assert.equal(f.button.style.transform, feet);
    f.advance(96);
    assert.equal(f.button.dataset.motion, 'walking');
    assert.equal(f.button.dataset.gaze, 'forward');
    assert.equal(f.button.dataset.facing, 'left');
  } finally { f.restore(); }
});
