import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mountAutomaticFireworks } from './penthouse-fireworks-auto.ts';

export function automaticFireworksFixture(t: TestContext, random = 0, eligible = true) {
  let now = 0;
  let nextId = 0;
  let launches = 0;
  let draws = 0;
  const tasks = new Map<number, { at: number; callback: () => void }>();
  const page = Object.assign(new EventTarget(), { hidden: false });
  const media = Object.assign(new EventTarget(), { matches: false });
  const state = { eligible, accepts: true, active: false };
  const browser = {
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
  const automatic = mountAutomaticFireworks({
    isEligible: () => state.eligible && !state.active,
    random: () => { draws++; return random; },
    start() { launches++; state.active = state.accepts; automatic.refresh(); return state.accepts; },
  });
  t.after(() => {
    automatic.destroy();
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
      assert.ok(count++ < 100, 'automatic fireworks must never form a tight timer loop');
      now = next[1].at;
      tasks.delete(next[0]);
      next[1].callback();
    }
    now = until;
  }
  const visibility = (hidden: boolean) => { page.hidden = hidden; page.dispatchEvent(new Event('visibilitychange')); };
  const motion = (reduced: boolean) => { media.matches = reduced; media.dispatchEvent(new Event('change')); };
  return { automatic, tasks, state, page, advance, visibility, motion, launches: () => launches, draws: () => draws };
}
