import test from 'node:test';
import assert from 'node:assert/strict';
import { FIREWORK_CUES, FIREWORKS_DURATION, FireworksShow } from './penthouse-fireworks-show.ts';

test('starts at the beginning only after an explicit start', () => {
  const changes: boolean[] = [];
  const show = new FireworksShow(active => changes.push(active));
  assert.equal(show.active, false);
  show.start();
  assert.equal(show.active, true);
  assert.equal(show.time, 0);
  assert.deepEqual(changes, [true]);
});

test('ignores frame advancement before a show is started', () => {
  const show = new FireworksShow();
  show.advance(30);
  assert.equal(show.time, 0);
  assert.equal(show.active, false);
});

test('does not restart an active show on repeated start requests', () => {
  const changes: boolean[] = [];
  const show = new FireworksShow(active => changes.push(active));
  show.start();
  show.advance(17.5);
  show.start();
  assert.equal(show.time, 17.5);
  assert.deepEqual(changes, [true]);
});

test('finishes once when accumulated frame time reaches sixty seconds', () => {
  const changes: boolean[] = [];
  const show = new FireworksShow(active => changes.push(active));
  show.start();
  show.advance(59.5);
  assert.equal(show.active, true);
  show.advance(0.5);
  assert.equal(show.active, false);
  assert.equal(show.time, FIREWORKS_DURATION);
  assert.deepEqual(changes, [true, false]);
});

test('caps an oversized frame jump without replaying missed activity', () => {
  const changes: boolean[] = [];
  const show = new FireworksShow(active => changes.push(active));
  show.start();
  show.advance(Number.MAX_VALUE);
  show.advance(2);
  assert.equal(show.time, FIREWORKS_DURATION);
  assert.equal(show.active, false);
  assert.deepEqual(changes, [true, false]);
});

test('replays a finished show from the beginning', () => {
  const changes: boolean[] = [];
  const show = new FireworksShow(active => changes.push(active));
  show.start();
  show.advance(FIREWORKS_DURATION);
  show.start();
  assert.equal(show.active, true);
  assert.equal(show.time, 0);
  assert.deepEqual(changes, [true, false, true]);
});

test('cancels once and leaves its timeline frozen until another start', () => {
  const changes: boolean[] = [];
  const show = new FireworksShow(active => changes.push(active));
  show.start();
  show.advance(12);
  show.stop();
  show.stop();
  show.advance(40);
  assert.equal(show.active, false);
  assert.equal(show.time, 12);
  assert.deepEqual(changes, [true, false]);
});

test('starts from the beginning after cancellation', () => {
  const show = new FireworksShow();
  show.start();
  show.advance(12);
  show.stop();
  show.start();
  assert.equal(show.active, true);
  assert.equal(show.time, 0);
});

test('discards negative and nonfinite frame deltas without corrupting the timeline', () => {
  const show = new FireworksShow();
  show.start();
  show.advance(9);
  for (const seconds of [-1, -Infinity, Infinity, NaN, 0]) show.advance(seconds);
  assert.equal(show.time, 9);
  assert.equal(show.active, true);
});

test('keeps the authored choreography finite, ordered and within the window sky', () => {
  assert.ok(FIREWORK_CUES.length >= 24 && FIREWORK_CUES.length <= 32);
  let previous = -1;
  for (const cue of FIREWORK_CUES) {
    assert.ok(cue.at > previous && cue.at >= 0 && cue.at <= 51.5);
    assert.ok(cue.x >= 400 && cue.x <= 1370);
    assert.ok(cue.y >= 100 && cue.y <= 190);
    assert.ok(cue.radius >= 35 && cue.radius <= 70);
    assert.ok(Number.isSafeInteger(cue.seed));
    previous = cue.at;
  }
});

test('lets every bloom fade naturally with at most four simultaneous bursts', () => {
  const bloomSeconds = { chrysanthemum: 4.2, willow: 5.2, palm: 3.6 } as const;
  assert.equal(FIREWORK_CUES[0].at, 0);
  for (const cue of FIREWORK_CUES) {
    const burstTime = cue.at + 1.45;
    const concurrent = FIREWORK_CUES.filter(other =>
      other.at + 1.45 <= burstTime && burstTime < other.at + 1.45 + bloomSeconds[other.kind]);
    assert.ok(concurrent.length <= (cue.at < 46 ? 3 : 4));
    assert.ok(burstTime + bloomSeconds[cue.kind] < FIREWORKS_DURATION);
  }
});
