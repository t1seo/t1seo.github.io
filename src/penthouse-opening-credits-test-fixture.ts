import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mountOpeningCredits } from './penthouse-opening-credits.ts';

export function openingFixture(t: TestContext, reduced = false, hidden = false) {
  let now = 0;
  let nextId = 0;
  const tasks = new Map<number, { at: number; callback: () => void }>();
  const page = Object.assign(new EventTarget(), { hidden });
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const state = { blocked: false, still: false };
  const host = { dataset: { phase: '', paused: '', static: '' }, hidden: false };
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
  const dispose = mountOpeningCredits(host, letters, { isBlocked: () => state.blocked, isStill: () => state.still });
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
      assert.ok(count++ < 100, 'bounded opening sequence must settle');
      now = next[1].at;
      tasks.delete(next[0]);
      next[1].callback();
    }
    now = until;
  }
  const text = () => Array.from('TAEWON SEO').filter((_, index) => letters[index]?.dataset.visible === 'true').join('');
  const visibility = (isHidden: boolean) => { page.hidden = isHidden; page.dispatchEvent(new Event('visibilitychange')); };
  const motion = (isReduced: boolean) => { media.matches = isReduced; media.dispatchEvent(new Event('change')); };
  const activity = (type = 'pointermove') => page.dispatchEvent(new Event(type));
  return { host, tasks, state, advance, visibility, motion, activity, dispose, resetIdle: dispose.resetIdle, text };
}
