import test from 'node:test';
import assert from 'node:assert/strict';
import { FireworksPaint } from './penthouse-fireworks-paint.ts';
import { compositor } from './penthouse-effects-test-support.ts';

function recordingPaint() {
  let strokes = 0, glows = 0, dots = 0, clips = 0, alpha = 1;
  const finite = (...values: number[]) => values.forEach(value => assert.ok(Number.isFinite(value)));
  return {
    save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo: finite, lineTo: finite, clip() { clips++; }, stroke() { strokes++; },
    fillRect(...values: number[]) { finite(...values); dots++; },
    drawImage() { glows++; },
    get globalAlpha() { return alpha; },
    set globalAlpha(value: number) { assert.ok(value >= 0 && value <= 1); alpha = value; },
    globalCompositeOperation: 'source-over' as const,
    strokeStyle: '', fillStyle: '', lineWidth: 1, lineCap: 'round' as const,
    count: () => ({ strokes, glows, dots, clips }),
  };
}

test('fireworks bloom with bounded tails and cached glows inside a sky clip', t => {
  compositor(t);
  const renderer = new FireworksPaint(), paint = recordingPaint();
  renderer.draw(paint, 3, 1);
  const counts = paint.count();
  assert.equal(counts.clips, 1);
  assert.ok(counts.strokes >= 250 && counts.strokes <= 400);
  assert.ok(counts.glows > 20 && counts.glows < 50);
  assert.ok(counts.dots < 150);
});

test('quiet quality reduces fireworks particles and trails while retaining the same cue', t => {
  compositor(t);
  const renderer = new FireworksPaint(), full = recordingPaint(), quiet = recordingPaint();
  renderer.draw(full, 3, 1, 1); renderer.draw(quiet, 3, 1, .38);
  assert.ok(quiet.count().strokes > 100);
  assert.ok(quiet.count().strokes <= full.count().strokes * .4);
  assert.ok(quiet.count().glows > 0);
});

test('fireworks paint no particles before the score or after its final embers', t => {
  compositor(t);
  const renderer = new FireworksPaint(), paint = recordingPaint();
  renderer.draw(paint, -1, 1); renderer.draw(paint, 60, 1);
  assert.equal(paint.count().strokes, 0);
  assert.equal(paint.count().glows, 0);
  assert.equal(paint.count().dots, 0);
});

test('a complete score keeps every particle finite and all draw budgets bounded', t => {
  compositor(t);
  const renderer = new FireworksPaint();
  for (let time = 0; time <= 60; time += .2) {
    const paint = recordingPaint();
    renderer.draw(paint, time, 1);
    assert.ok(paint.count().strokes <= 126 * 3 * 4 + 4);
    assert.ok(paint.count().dots <= 126 * 4 + 40);
  }
});

test('the festival reuses one tiny glow atlas across frames and replays', t => {
  const f = compositor(t);
  f.effects.update({ season: 'summer', time: 'noon', weather: 'clear', auto: false });
  f.effects.setWorkspace({ monitor: false, lamp: false, floorLamp: false });
  f.effects.startFireworks();
  const gradients = f.gradients(), surfaces = f.fallbackCanvases.length;
  for (let tick = 0; tick < 120; tick++) f.run(1000 + tick * 40);
  f.effects.stopFireworks(); f.effects.startFireworks(); f.run(7000); f.run(7040);
  assert.equal(f.gradients(), gradients);
  assert.equal(f.fallbackCanvases.length, surfaces);
  assert.ok(f.fallbackCanvases.some(surface => surface.width === 144 && surface.height === 48));
  assert.deepEqual(f.liveFilters, []);
});
