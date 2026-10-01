import test from 'node:test';
import assert from 'node:assert/strict';
import { automaticFireworksFixture as fixture } from './penthouse-fireworks-auto-test-fixture.ts';

const MINUTE = 60000;

test('waits at least eight eligible minutes before starting one celebration', t => {
  const f = fixture(t);
  f.advance(8 * MINUTE - 1);
  assert.equal(f.launches(), 0);
  f.advance(1);
  assert.equal(f.launches(), 1);
  assert.equal(f.tasks.size, 0);
});

test('uses a random interval up to fifteen minutes rather than a fixed cadence', t => {
  const f = fixture(t, 1);
  f.advance(15 * MINUTE - 1);
  assert.equal(f.launches(), 0);
  f.advance(1);
  assert.equal(f.launches(), 1);
});

test('does not schedule while daytime or otherwise ineligible', t => {
  const f = fixture(t, 0, false);
  f.advance(30 * MINUTE);
  assert.equal(f.launches(), 0);
  assert.equal(f.tasks.size, 0);
  assert.equal(f.draws(), 0);
});

test('retains its existing deadline across frequent equivalent state updates', t => {
  const f = fixture(t, .5);
  for (let index = 0; index < 690; index++) { f.automatic.refresh(); f.advance(1000); }
  assert.equal(f.launches(), 1);
  assert.equal(f.draws(), 1);
});

test('starts a fresh full interval after an external eligibility blocker ends', t => {
  const f = fixture(t);
  f.advance(7 * MINUTE);
  f.state.eligible = false; f.automatic.refresh();
  f.advance(20 * MINUTE);
  assert.equal(f.tasks.size, 0);
  f.state.eligible = true; f.automatic.refresh();
  f.advance(8 * MINUTE - 1);
  assert.equal(f.launches(), 0);
  f.advance(1);
  assert.equal(f.launches(), 1);
});

for (const reason of ['hidden', 'reduced'] as const) {
  test(`discards old waiting time after ${reason} mode`, t => {
    const f = fixture(t);
    const change = reason === 'hidden' ? f.visibility : f.motion;
    f.advance(7 * MINUTE); change(true); f.advance(30 * MINUTE);
    assert.equal(f.tasks.size, 0);
    change(false); f.advance(8 * MINUTE - 1);
    assert.equal(f.launches(), 0);
    f.advance(1);
    assert.equal(f.launches(), 1);
  });
}

test('manual playback cancels the deadline and completion starts a fresh interval', t => {
  const f = fixture(t);
  f.advance(7 * MINUTE);
  f.state.active = true; f.automatic.refresh(); f.advance(MINUTE);
  assert.equal(f.tasks.size, 0);
  f.state.active = false; f.automatic.refresh();
  f.advance(8 * MINUTE - 1);
  assert.equal(f.launches(), 0);
  f.advance(1);
  assert.equal(f.launches(), 1);
});

test('automatic playback never overlaps and starts its next interval after completion', t => {
  const f = fixture(t);
  f.advance(8 * MINUTE);
  f.advance(MINUTE);
  assert.equal(f.launches(), 1);
  f.state.active = false; f.automatic.refresh();
  f.advance(8 * MINUTE - 1);
  assert.equal(f.launches(), 1);
  f.advance(1);
  assert.equal(f.launches(), 2);
});

test('rechecks eligibility when a queued timeout runs', t => {
  const f = fixture(t);
  f.state.eligible = false;
  f.advance(8 * MINUTE);
  assert.equal(f.launches(), 0);
  assert.equal(f.tasks.size, 0);
});

test('failed launch waits a new full interval instead of retrying immediately', t => {
  const f = fixture(t);
  f.state.accepts = false;
  f.advance(8 * MINUTE);
  assert.equal(f.launches(), 1);
  assert.equal(f.tasks.size, 1);
  f.advance(8 * MINUTE - 1);
  assert.equal(f.launches(), 1);
});

test('teardown cancels the timer and detaches visibility and motion listeners', t => {
  const f = fixture(t);
  f.automatic.destroy(); f.visibility(true); f.visibility(false); f.motion(true); f.motion(false);
  f.automatic.refresh(); f.advance(30 * MINUTE);
  assert.equal(f.launches(), 0);
  assert.equal(f.tasks.size, 0);
});
