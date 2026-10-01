import test from 'node:test';
import assert from 'node:assert/strict';
import { openingFixture as fixture } from './penthouse-opening-credits-test-fixture.ts';

test('replays the name after sixty quiet seconds following the opening', t => {
  const f = fixture(t);
  f.advance(10040);
  f.advance(59999);
  assert.equal(f.host.hidden, true);
  f.advance(1);
  assert.equal(f.host.hidden, false);
  assert.equal(f.host.dataset.phase, 'introducing');
  f.advance(1000);
  assert.equal(f.text(), 'T');
});

for (const event of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'touchmove']) {
  test(`restarts the quiet interval after ${event}`, t => {
    const f = fixture(t);
    f.advance(10040 + 59000);
    f.activity(event);
    f.advance(59999);
    assert.equal(f.host.hidden, true);
    f.advance(1);
    assert.equal(f.host.dataset.phase, 'introducing');
    assert.equal(f.tasks.size, 1);
  });
}

test('fades an idle replay when the visitor resumes interacting', t => {
  const f = fixture(t);
  f.advance(10040 + 60000 + 1000);
  f.activity();
  assert.equal(f.host.dataset.phase, 'fading');
  f.advance(360);
  assert.equal(f.host.hidden, true);
  f.advance(59999);
  assert.equal(f.host.hidden, true);
  f.advance(1);
  assert.equal(f.host.dataset.phase, 'introducing');
});

test('keeps the initial cinematic introduction when the pointer moves', t => {
  const f = fixture(t);
  f.advance(2400);
  f.activity();
  assert.equal(f.host.dataset.phase, 'typing');
  f.advance(7640);
  assert.equal(f.host.hidden, true);
});

test('waits another full quiet minute after every completed replay', t => {
  const f = fixture(t);
  f.advance(10040 + 60000 + 9040);
  assert.equal(f.host.hidden, true);
  f.advance(59999);
  assert.equal(f.host.hidden, true);
  f.advance(1);
  assert.equal(f.host.dataset.phase, 'introducing');
});

test('discards hidden-tab idle time and starts a fresh minute on return', t => {
  const f = fixture(t);
  f.advance(10040 + 59000);
  f.visibility(true);
  f.advance(600000);
  assert.equal(f.tasks.size, 0);
  f.visibility(false);
  f.advance(59999);
  assert.equal(f.host.hidden, true);
  f.advance(1);
  assert.equal(f.host.dataset.phase, 'introducing');
});

test('cancels an idle replay while hidden instead of resuming a stale title', t => {
  const f = fixture(t);
  f.advance(10040 + 60000 + 1200);
  f.visibility(true);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 0);
  f.visibility(false);
  f.advance(60000);
  assert.equal(f.text(), '');
  assert.equal(f.host.dataset.phase, 'introducing');
});

test('defers the title while a panel, album or fireworks blocks the window', t => {
  const f = fixture(t);
  f.advance(10040);
  f.state.blocked = true;
  f.advance(120000);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 1);
  f.state.blocked = false;
  f.advance(60000);
  assert.equal(f.host.dataset.phase, 'introducing');
});

test('cancels pending replay letters when a programmatic blocker appears', t => {
  const f = fixture(t);
  f.advance(10040 + 60000 + 1000);
  f.state.blocked = true;
  f.advance(220 + 360);
  assert.equal(f.host.hidden, true);
  assert.equal(f.text(), 'T');
});

test('uses the complete static name for idle replay with reduced motion', t => {
  const f = fixture(t, true);
  f.advance(5200 + 60000);
  assert.equal(f.host.dataset.phase, 'holding');
  assert.equal(f.text(), 'TAEWON SEO');
  assert.equal(f.host.dataset.static, 'true');
  f.advance(4200);
  assert.equal(f.host.hidden, true);
});

test('uses a static name when the room is in still mode', t => {
  const f = fixture(t);
  f.advance(10040);
  f.state.still = true;
  f.advance(60000);
  assert.equal(f.host.dataset.phase, 'holding');
  assert.equal(f.text(), 'TAEWON SEO');
  assert.equal(f.host.dataset.static, 'true');
});

test('cleans up idle deadlines and all input listeners', t => {
  const f = fixture(t);
  f.advance(10040);
  f.dispose();
  f.activity(); f.visibility(true); f.visibility(false); f.motion(true);
  f.advance(600000);
  assert.equal(f.tasks.size, 0);
  assert.equal(f.host.hidden, true);
});

test('starts a full new quiet minute when a programmatic blocker closes', t => {
  const f = fixture(t);
  f.advance(10040);
  f.state.blocked = true;
  f.advance(119999);
  f.state.blocked = false;
  f.resetIdle();
  f.advance(59999);
  assert.equal(f.host.hidden, true);
  f.advance(1);
  assert.equal(f.host.dataset.phase, 'introducing');
});

test('suppresses the first title when a festival starts during it', t => {
  const f = fixture(t);
  f.advance(2400);
  f.state.blocked = true;
  f.resetIdle();
  assert.equal(f.host.dataset.phase, 'fading');
  f.advance(360);
  assert.equal(f.host.hidden, true);
});

test('finishes the first typed name statically when still mode is enabled', t => {
  const f = fixture(t);
  f.advance(2400);
  f.state.still = true;
  f.resetIdle();
  assert.equal(f.text(), 'TAEWON SEO');
  assert.equal(f.host.dataset.static, 'true');
  f.advance(4200);
  assert.equal(f.host.hidden, true);
});
