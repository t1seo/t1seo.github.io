import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mountOpeningCredits } from './penthouse-opening-credits.ts';

function fixture(t: TestContext, reduced = false, hidden = false) {
  let now = 0;
  let nextId = 0;
  const tasks = new Map<number, { at: number; callback: () => void }>();
  const page = Object.assign(new EventTarget(), { hidden });
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const host = { textContent: '', dataset: { phase: '', paused: '' }, hidden: false };
  const browser = {
    performance: { now: () => now },
    matchMedia: () => media,
    setTimeout(callback: () => void, delay: number) {
      const id = nextId++;
      tasks.set(id, { at: now + delay, callback });
      return id;
    },
    clearTimeout: (id: number) => tasks.delete(id),
  };
  const descriptors = ['window', 'document'].map(key => ({ key, value: Object.getOwnPropertyDescriptor(globalThis, key) }));
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: page });
  const dispose = mountOpeningCredits(host);
  t.after(() => {
    dispose();
    for (const descriptor of descriptors) {
      if (descriptor.value) Object.defineProperty(globalThis, descriptor.key, descriptor.value);
      else Reflect.deleteProperty(globalThis, descriptor.key);
    }
  });
  function advance(milliseconds: number) {
    const until = now + milliseconds;
    let count = 0;
    for (;;) {
      const next = [...tasks.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > until) break;
      assert.ok(count++ < 100, 'opening sequence must finish');
      now = next[1].at;
      tasks.delete(next[0]);
      next[1].callback();
    }
    now = until;
  }
  const visibility = (isHidden: boolean) => { page.hidden = isHidden; page.dispatchEvent(new Event('visibilitychange')); };
  const motion = (isReduced: boolean) => { media.matches = isReduced; media.dispatchEvent(new Event('change')); };
  return { host, tasks, advance, visibility, motion, dispose };
}

test('types the name once, holds it, then finishes without recurring work', t => {
  const f = fixture(t);
  assert.equal(f.host.hidden, false);
  assert.equal(f.host.textContent, '');
  f.advance(900);
  assert.equal(f.host.textContent, 'T');
  f.advance(900);
  assert.equal(f.host.textContent, 'TAEWON SEO');
  assert.equal(f.host.dataset.phase, 'holding');
  f.advance(2999);
  assert.equal(f.host.dataset.phase, 'holding');
  f.advance(1);
  assert.equal(f.host.dataset.phase, 'fading');
  f.advance(1000);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 0);
  f.visibility(true); f.visibility(false); f.motion(true);
  assert.equal(f.tasks.size, 0);
});

test('preserves the remaining letter delay when a tab is hidden', t => {
  const f = fixture(t);
  f.advance(950);
  f.visibility(true);
  f.advance(60000);
  assert.equal(f.host.textContent, 'T');
  assert.equal(f.tasks.size, 0);
  f.visibility(false);
  f.advance(49);
  assert.equal(f.host.textContent, 'T');
  f.advance(1);
  assert.equal(f.host.textContent, 'TA');
});

test('waits for an initially hidden tab to become visible', t => {
  const f = fixture(t, false, true);
  f.advance(10000);
  assert.equal(f.tasks.size, 0);
  assert.equal(f.host.textContent, '');
  f.visibility(false); f.advance(900);
  assert.equal(f.host.textContent, 'T');
});

test('shows the complete name without typing or fading when reduced motion is requested', t => {
  const f = fixture(t, true);
  f.advance(900);
  assert.equal(f.host.textContent, 'TAEWON SEO');
  assert.equal(f.host.dataset.phase, 'holding');
  f.advance(3000);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 0);
});

test('finishes typing immediately when reduced motion changes during the title', t => {
  const f = fixture(t);
  f.advance(1100);
  f.motion(true);
  assert.equal(f.host.textContent, 'TAEWON SEO');
  f.advance(3000);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 0);
});

test('cleanup cancels timers and prevents visibility or motion events from restarting the title', t => {
  const f = fixture(t);
  f.advance(1000); f.dispose();
  f.visibility(true); f.visibility(false); f.motion(true); f.advance(10000);
  assert.equal(f.host.hidden, true);
  assert.equal(f.host.textContent, '');
  assert.equal(f.tasks.size, 0);
});
