import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createSingingBowlSound } from './penthouse-singing-bowl.ts';

function audio(t: TestContext, delayed = false, denied = false) {
  class Parameter {
    setValueAtTime() {}
    cancelAndHoldAtTime() {}
    linearRampToValueAtTime() {}
    exponentialRampToValueAtTime() {}
  }
  class Gain {
    readonly gain = new Parameter();
    connect() {}
    disconnect() {}
  }
  class Oscillator {
    readonly frequency = new Parameter();
    onended: (() => void) | null = null;
    type = '';
    connect() {}
    disconnect() {}
    start() {}
    stop() {}
  }
  const contexts: Context[] = [], pending: (() => void)[] = [];
  class Context {
    state = 'suspended';
    currentTime = 0;
    readonly destination = {};
    readonly oscillators: Oscillator[] = [];
    readonly gains: Gain[] = [];
    resumes = 0;
    closes = 0;
    constructor() { contexts.push(this); }
    createOscillator() { const node = new Oscillator(); this.oscillators.push(node); return node; }
    createGain() { const node = new Gain(); this.gains.push(node); return node; }
    resume(): Promise<void> {
      this.resumes++;
      return new Promise((resolve, reject) => {
        const finish = () => {
          if (denied) reject(new DOMException('Audio permission denied', 'NotAllowedError'));
          else { if (this.state !== 'closed') this.state = 'running'; resolve(); }
        };
        if (delayed) pending.push(finish); else finish();
      });
    }
    async close() { this.closes++; this.state = 'closed'; }
  }
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, writable: true, value: Context });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'AudioContext', original); else Reflect.deleteProperty(globalThis, 'AudioContext'); });
  return { contexts, finish: () => { for (const resume of pending.splice(0)) resume(); } };
}

test('preparing from a gesture unlocks a silent context without starting a bowl voice', async t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  assert.equal(await sound.prepare(), true);
  const context = fixture.contexts.at(0);
  assert.ok(context);
  assert.equal(context.resumes, 1);
  assert.equal(context.oscillators.length, 0);
  assert.equal(context.gains.length, 0);
  assert.equal(context.closes, 0);
});

test('repeated prepare shares one hold which release closes once', async t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  await sound.prepare();
  await sound.prepare();
  sound.release();
  sound.release();
  assert.equal(fixture.contexts.length, 1);
  assert.equal(fixture.contexts.at(0)?.closes, 1);
  sound.destroy();
});

test('a held context remains unlocked after a strike until the timer releases it', async t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  await sound.prepare();
  assert.equal(await sound.strike(), true);
  const context = fixture.contexts.at(0);
  assert.ok(context);
  for (const voice of context.oscillators) voice.onended?.();
  assert.equal(context.closes, 0);
  sound.release();
  assert.equal(context.closes, 1);
});

test('release after a completion strike lets its audible tail finish before closing', async t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  await sound.prepare();
  await sound.strike();
  sound.release();
  const context = fixture.contexts.at(0);
  assert.ok(context);
  assert.equal(context.closes, 0);
  for (const voice of context.oscillators) voice.onended?.();
  assert.equal(context.closes, 1);
});

test('release during delayed preparation closes the unused context and cancels success', async t => {
  const fixture = audio(t, true), sound = createSingingBowlSound();
  const pending = sound.prepare();
  sound.release();
  fixture.finish();
  assert.equal(await pending, false);
  assert.equal(fixture.contexts.at(0)?.closes, 1);
  assert.equal(fixture.contexts.at(0)?.oscillators.length, 0);
  sound.destroy();
});

test('destroy during delayed preparation cannot revive the context or permit later prepare', async t => {
  const fixture = audio(t, true), sound = createSingingBowlSound();
  const pending = sound.prepare();
  sound.destroy();
  fixture.finish();
  assert.equal(await pending, false);
  assert.equal(await sound.prepare(), false);
  assert.equal(fixture.contexts.length, 1);
  assert.equal(fixture.contexts.at(0)?.closes, 1);
});

test('a stale resume from a canceled timer cannot release the next timer context', async t => {
  const fixture = audio(t, true), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  const previous = sound.prepare();
  sound.release();
  const current = sound.prepare();
  fixture.finish();
  assert.equal(await previous, false);
  assert.equal(await current, true);
  assert.equal(fixture.contexts.length, 2);
  assert.equal(fixture.contexts.at(0)?.closes, 1);
  assert.equal(fixture.contexts.at(1)?.closes, 0);
});

test('a preparation denied by the browser closes its unused context and reports failure', async t => {
  const fixture = audio(t, false, true), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  assert.equal(await sound.prepare(), false);
  assert.equal(fixture.contexts.at(0)?.closes, 1);
  assert.equal(fixture.contexts.at(0)?.oscillators.length, 0);
});

test('only the latest overlapping prepare can report success on their shared context', async t => {
  const fixture = audio(t, true), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  const first = sound.prepare(), latest = sound.prepare();
  fixture.finish();
  assert.equal(await first, false);
  assert.equal(await latest, true);
  assert.equal(fixture.contexts.length, 1);
  sound.release();
  assert.equal(fixture.contexts.at(0)?.closes, 1);
});

test('release before any gesture does not construct audio resources', t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  sound.release();
  assert.equal(fixture.contexts.length, 0);
  sound.destroy();
});

test('unsupported audio preparation reports false and release remains harmless', async t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, writable: true, value: undefined });
  assert.equal(await sound.prepare(), false);
  sound.release();
  sound.destroy();
  assert.equal(fixture.contexts.length, 0);
});

test('release cancels a completion strike waiting for its suspended context to resume', async t => {
  const fixture = audio(t, true), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  const preparing = sound.prepare();
  fixture.finish();
  await preparing;
  const context = fixture.contexts.at(0);
  assert.ok(context);
  context.state = 'suspended';
  const pending = sound.strike();
  sound.release();
  fixture.finish();
  assert.equal(await pending, false);
  assert.equal(context.closes, 1);
  assert.equal(context.oscillators.length, 0);
});
