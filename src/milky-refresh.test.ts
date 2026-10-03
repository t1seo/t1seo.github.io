import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, POSES, RESTS } from './cyber-pet-test-support.ts';

const root = '/assets/penthouse/milky-pet/character/';
const setup = () => fixture(7829, POSES, RESTS, true, undefined, undefined,
  { transitions: true, ballHome: { x: .52, y: .977 } }, { photoMotions: true, artRoot: root });

test('refreshed character art uses its own root while toys keep their existing art', async () => {
  const f = setup();
  try {
    await f.loadAll();
    await f.loadRest();
    await f.loadForward();
    await f.loadTrot();
    const characters = f.document.images.filter(image => image.src.includes('milky-v4-') || image.src.includes('milky-rest-') || image.src.includes('milky-forward-') || image.src.includes('milky-trot-'));
    assert.ok(characters.length >= 20);
    assert.ok(characters.every(image => image.src.startsWith(root)));
    assert.ok(f.document.images.filter(image => image.src.includes('milky-prop-')).every(image => !image.src.startsWith(root)));
    const baseline = f.asset('milky-v4-idle.webp').style['--milky-frame-y'];
    assert.equal(typeof baseline, 'string');
    for (const name of ['milky-forward-step-0.webp', 'milky-trot-0.webp', 'milky-rest-sleep.webp']) {
      assert.equal(f.asset(name).style['--milky-frame-y'], baseline, 'new common-anchor frames must not inherit legacy vertical corrections');
    }
  } finally { f.restore(); }
});

test('refreshed photo moments remain lazy and a late decode cannot revive a canceled request', async () => {
  const f = setup();
  try {
    await f.loadAll();
    const photos = () => f.document.images.filter(image => image.src.startsWith(`${root}photo/`));
    assert.equal(photos().length, 0);
    assert.equal(f.controller.photoMotion('tilt'), true);
    assert.equal(photos().length, 2);
    f.controller.setAnimated(false);
    await f.load('tilt-near.webp', 1536, 1024);
    await f.load('tilt-full.webp', 1536, 1024);
    f.advance(5000);
    assert.ok(!f.button.dataset.pose.startsWith('tilt-'));
    assert.equal(f.button.dataset.animated, 'false');
  } finally { f.restore(); }
});
