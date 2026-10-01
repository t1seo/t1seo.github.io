import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mountOpeningCredits, openingCreditsMarkup } from './penthouse-opening-credits.ts';

function fixture(t: TestContext, reduced = false, hidden = false) {
  let now = 0;
  let nextId = 0;
  const tasks = new Map<number, { at: number; callback: () => void }>();
  const page = Object.assign(new EventTarget(), { hidden });
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const host = { dataset: { phase: '', paused: '' }, hidden: false };
  const letters = Array.from('TAEWON SEO', () => ({ dataset: { visible: '' } }));
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
  const dispose = mountOpeningCredits(host, letters);
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
  const text = () => Array.from('TAEWON SEO').filter((_, index) => letters[index]?.dataset.visible === 'true').join('');
  const visibility = (isHidden: boolean) => { page.hidden = isHidden; page.dispatchEvent(new Event('visibilitychange')); };
  const motion = (isReduced: boolean) => { media.matches = isReduced; media.dispatchEvent(new Event('change')); };
  return { host, tasks, advance, visibility, motion, dispose, text };
}

test('reserves every name character in decorative markup before animation begins', () => {
  const markup = openingCreditsMarkup();
  assert.ok(markup.includes('aria-hidden="true"'));
  assert.ok(markup.includes('A PERSONAL SPACE'));
  assert.equal(markup.match(/data-opening-letter/g)?.length, 10);
  assert.ok(!markup.includes('aria-live'));
});

test('introduces the eyebrow, deliberately types the name, then holds and fades once', t => {
  const f = fixture(t);
  assert.equal(f.host.hidden, false);
  assert.equal(f.text(), '');
  f.advance(1000);
  assert.equal(f.host.dataset.phase, 'introducing');
  assert.equal(f.text(), '');
  f.advance(1000);
  assert.equal(f.text(), 'T');
  f.advance(2240);
  assert.equal(f.text(), 'TAEWON SEO');
  assert.equal(f.host.dataset.phase, 'holding');
  f.advance(4199);
  assert.equal(f.host.dataset.phase, 'holding');
  f.advance(1);
  assert.equal(f.host.dataset.phase, 'fading');
  f.advance(1600);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 0);
  f.visibility(true); f.visibility(false); f.motion(true);
  assert.equal(f.tasks.size, 0);
});

test('pauses briefly between the first and last name', t => {
  const f = fixture(t);
  f.advance(3320);
  assert.equal(f.text(), 'TAEWON ');
  f.advance(479);
  assert.equal(f.text(), 'TAEWON ');
  f.advance(1);
  assert.equal(f.text(), 'TAEWON S');
});

test('preserves the remaining letter delay when a tab is hidden', t => {
  const f = fixture(t);
  f.advance(2050);
  f.visibility(true);
  f.advance(60000);
  assert.equal(f.text(), 'T');
  assert.equal(f.tasks.size, 0);
  f.visibility(false);
  f.advance(169);
  assert.equal(f.text(), 'T');
  f.advance(1);
  assert.equal(f.text(), 'TA');
});

test('waits for an initially hidden tab to become visible', t => {
  const f = fixture(t, false, true);
  f.advance(10000);
  assert.equal(f.tasks.size, 0);
  assert.equal(f.text(), '');
  f.visibility(false); f.advance(2000);
  assert.equal(f.text(), 'T');
});

test('shows the complete name without typing or fading when reduced motion is requested', t => {
  const f = fixture(t, true);
  f.advance(1000);
  assert.equal(f.text(), 'TAEWON SEO');
  assert.equal(f.host.dataset.phase, 'holding');
  f.advance(4200);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 0);
});

test('finishes typing immediately when reduced motion changes during the title', t => {
  const f = fixture(t);
  f.advance(2400);
  f.motion(true);
  assert.equal(f.text(), 'TAEWON SEO');
  f.advance(4200);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 0);
});

test('cleanup cancels timers and prevents visibility or motion events from restarting the title', t => {
  const f = fixture(t);
  f.advance(2200); f.dispose();
  f.visibility(true); f.visibility(false); f.motion(true); f.advance(10000);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 0);
});
