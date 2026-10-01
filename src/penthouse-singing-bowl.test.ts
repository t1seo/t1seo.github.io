import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { SingingBowl, createSingingBowlSound } from './penthouse-singing-bowl.ts';

function painting() {
  const marks: { x: number; y: number; rx: number; ry: number; opacity: number }[] = [];
  let ellipse = { x: 0, y: 0, rx: 0, ry: 0 };
  const ctx = {
    globalAlpha: 1, lineWidth: 1, strokeStyle: '', lineCap: 'butt' as const,
    save() {}, restore() {}, beginPath() {},
    ellipse(x: number, y: number, rx: number, ry: number) { ellipse = { x, y, rx, ry }; },
    stroke() { marks.push({ ...ellipse, opacity: ctx.globalAlpha }); },
  };
  return { ctx, marks };
}

function advance(bowl: SingingBowl, seconds: number): void {
  for (let tick = 0; tick < seconds * 30; tick++) bowl.advance(1 / 30);
}

test('a bowl remains visually quiet until explicitly struck', () => {
  const bowl = new SingingBowl(), paint = painting();
  bowl.draw(paint.ctx);
  assert.equal(bowl.active, false);
  assert.deepEqual(paint.marks, []);
});

test('a strike emits restrained elliptical resonance from the actual brass rim', () => {
  const bowl = new SingingBowl(), paint = painting();
  bowl.strike();
  advance(bowl, 2);
  bowl.draw(paint.ctx);
  assert.equal(bowl.active, true);
  assert.equal(paint.marks.length, 3);
  assert.ok(paint.marks.every(mark => mark.x === 1079 && mark.y === 540));
  assert.ok(paint.marks.every(mark => mark.rx >= 20 && mark.rx <= 36 && mark.ry >= 4 && mark.ry <= 8));
  assert.ok(paint.marks.every(mark => mark.opacity > 0 && mark.opacity < .3));
});

test('resonance expires after six visible seconds', () => {
  const bowl = new SingingBowl(), paint = painting();
  bowl.strike();
  advance(bowl, 6.1);
  bowl.draw(paint.ctx);
  assert.equal(bowl.active, false);
  assert.deepEqual(paint.marks, []);
});

test('rapid repeat strikes restart one bounded resonance instead of accumulating rings', () => {
  const bowl = new SingingBowl(), paint = painting();
  bowl.strike();
  advance(bowl, 5.5);
  for (let strike = 0; strike < 100; strike++) bowl.strike();
  advance(bowl, 2);
  bowl.draw(paint.ctx);
  assert.equal(bowl.active, true);
  assert.equal(paint.marks.length, 3);
});

test('a stalled frame cannot consume the entire interaction', () => {
  const bowl = new SingingBowl();
  bowl.strike();
  bowl.advance(600);
  assert.equal(bowl.active, true);
});

test('still mode creates an immediate fixed pose which a second strike dismisses', () => {
  const bowl = new SingingBowl(), first = painting(), later = painting(), cleared = painting();
  bowl.strike(true);
  bowl.draw(first.ctx, true);
  assert.equal(bowl.active, false, 'a fixed pose must not keep the animation loop alive');
  advance(bowl, 10);
  bowl.draw(later.ctx, true);
  assert.ok(first.marks.length > 0);
  assert.deepEqual(later.marks, first.marks);
  bowl.strike(true);
  bowl.draw(cleared.ctx, true);
  assert.equal(bowl.active, false);
  assert.deepEqual(cleared.marks, []);
});

test('clear removes the complete visual resonance', () => {
  const bowl = new SingingBowl(), paint = painting();
  bowl.strike();
  bowl.clear();
  bowl.draw(paint.ctx);
  assert.equal(bowl.active, false);
  assert.deepEqual(paint.marks, []);
});

function audio(t: TestContext, initiallySuspended = false) {
  class Parameter {
    value = 0;
    readonly peaks: number[] = [];
    readonly ramps: number[] = [];
    holds = 0;
    setValueAtTime(value: number) { this.value = value; return this; }
    cancelAndHoldAtTime() { this.holds++; return this; }
    linearRampToValueAtTime(value: number) { this.peaks.push(value); return this; }
    exponentialRampToValueAtTime(_value: number, time: number) { this.ramps.push(time); return this; }
  }
  class Gain {
    readonly gain = new Parameter();
    disconnected = false;
    connect() {}
    disconnect() { this.disconnected = true; }
  }
  class Oscillator {
    readonly frequency = new Parameter();
    readonly stops: number[] = [];
    onended: (() => void) | null = null;
    started = 0;
    disconnected = false;
    type = '';
    connect() {}
    start() { this.started++; }
    stop(time = 0) { this.stops.push(time); }
    disconnect() { this.disconnected = true; }
  }
  const contexts: Context[] = [];
  class Context {
    currentTime = 10;
    state = initiallySuspended ? 'suspended' : 'running';
    readonly destination = {};
    readonly oscillators: Oscillator[] = [];
    readonly gains: Gain[] = [];
    resumes = 0;
    closes = 0;
    constructor() { contexts.push(this); }
    createOscillator() { const node = new Oscillator(); this.oscillators.push(node); return node; }
    createGain() { const node = new Gain(); this.gains.push(node); return node; }
    async resume() { this.resumes++; this.state = 'running'; }
    async close() { this.closes++; this.state = 'closed'; }
  }
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, writable: true, value: Context });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'AudioContext', original); else Reflect.deleteProperty(globalThis, 'AudioContext'); });
  return { contexts };
}

test('sound constructs no context or audio nodes before the first gesture', t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  assert.equal(fixture.contexts.length, 0);
  sound.destroy();
  assert.equal(fixture.contexts.length, 0);
});

test('one explicit strike resumes audio and schedules a quiet bounded metallic decay', async t => {
  const fixture = audio(t, true), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  assert.equal(await sound.strike(), true);
  const context = fixture.contexts.at(0);
  assert.ok(context);
  assert.equal(context.resumes, 1);
  assert.equal(context.oscillators.length, 5);
  assert.ok(context.oscillators.every(node => node.started === 1 && (node.stops.at(-1) ?? Infinity) <= 16));
  assert.ok(context.gains.reduce((sum, node) => sum + (node.gain.peaks.at(-1) ?? 0), 0) <= .08);
  assert.ok(context.gains.every(node => (node.gain.ramps.at(-1) ?? 0) > 10 && (node.gain.ramps.at(-1) ?? Infinity) < 16));
});

test('repeated strikes reuse five voices and hold existing envelopes without stacking loudness', async t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  for (let strike = 0; strike < 100; strike++) await sound.strike();
  const context = fixture.contexts.at(0);
  assert.ok(context);
  assert.equal(fixture.contexts.length, 1);
  assert.equal(context.oscillators.length, 5);
  assert.ok(context.oscillators.every(node => node.started === 1));
  assert.ok(context.gains.every(node => node.gain.holds === 100));
});

test('audio nodes disconnect when their scheduled resonance ends', async t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  await sound.strike();
  const context = fixture.contexts.at(0);
  assert.ok(context);
  for (const node of context.oscillators) node.onended?.();
  assert.ok(context.oscillators.every(node => node.disconnected));
  assert.ok(context.gains.every(node => node.disconnected));
  assert.equal(context.closes, 1);
});

test('a strike after the stop time replaces expired voices before delayed ended events arrive', async t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  t.after(() => sound.destroy());
  await sound.strike();
  const context = fixture.contexts.at(0);
  assert.ok(context);
  const previous = [...context.oscillators], delayed = previous.map(node => node.onended);
  context.currentTime = 16;
  await sound.strike();
  for (const ended of delayed) ended?.();
  assert.equal(context.oscillators.length, 10);
  assert.ok(previous.every(node => node.disconnected));
  assert.ok(context.oscillators.slice(5).every(node => !node.disconnected));
  assert.equal(context.closes, 0);
});

test('destroy during a pending resume cannot revive the disposed audio', async t => {
  const fixture = audio(t, true), sound = createSingingBowlSound();
  const pending = sound.strike();
  sound.destroy();
  await pending;
  const context = fixture.contexts.at(0);
  assert.ok(context);
  assert.equal(context.oscillators.length, 0);
  assert.equal(context.closes, 1);
});

test('destroy closes only its own context and prevents future strikes', async t => {
  const fixture = audio(t), sound = createSingingBowlSound();
  await sound.strike();
  sound.destroy();
  sound.destroy();
  await sound.strike();
  const context = fixture.contexts.at(0);
  assert.ok(context);
  assert.equal(context.closes, 1);
  assert.equal(fixture.contexts.length, 1);
  assert.ok(context.oscillators.every(node => node.disconnected));
  assert.ok(context.gains.every(node => node.disconnected));
});

test('unavailable WebAudio leaves the visual interaction usable', async t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  Reflect.deleteProperty(globalThis, 'AudioContext');
  t.after(() => { if (original) Object.defineProperty(globalThis, 'AudioContext', original); });
  const sound = createSingingBowlSound();
  assert.equal(await sound.strike(), false);
  sound.destroy();
});

test('a browser audio permission rejection returns false without breaking the gesture', async t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  class DeniedContext { constructor() { throw new DOMException('Audio is not allowed', 'NotAllowedError'); } }
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, writable: true, value: DeniedContext });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'AudioContext', original); else Reflect.deleteProperty(globalThis, 'AudioContext'); });
  const sound = createSingingBowlSound();
  assert.equal(await sound.strike(), false);
  sound.destroy();
});
