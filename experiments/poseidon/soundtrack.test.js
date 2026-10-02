import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundtrack } from './soundtrack.js';

class FakeButton extends EventTarget {
  dataset = {};
  attributes = new Map();
  setAttribute(name, value) { this.attributes.set(name, value); }
  click() { this.dispatchEvent(new Event('click')); }
}

class FakeAudio extends EventTarget {
  static instances = [];
  requests = [];
  pauseCount = 0;
  loadCount = 0;
  constructor() { super(); FakeAudio.instances.push(this); }
  play() {
    return new Promise((resolve, reject) => this.requests.push({ resolve, reject }));
  }
  pause() { this.pauseCount += 1; }
  load() { this.loadCount += 1; }
  removeAttribute(name) { delete this[name]; }
}

function setup(t) {
  t.mock.method(globalThis, 'Audio', FakeAudio);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const button = new FakeButton();
  button.innerHTML = '<svg aria-hidden="true"></svg>';
  const soundtrack = createSoundtrack(button, '/reverie.mp3');
  t.after(() => soundtrack.dispose());
  return { button, soundtrack, audio: FakeAudio.instances.at(-1) };
}

// Node does not expose Audio; install a temporary constructor for mock.method.
const previousAudio = globalThis.Audio;
globalThis.Audio = FakeAudio;
test.after(() => {
  if (previousAudio === undefined) delete globalThis.Audio;
  else globalThis.Audio = previousAudio;
});

test('loads nothing until a gesture, then fades in and preserves button contents', async (t) => {
  const { button, audio } = setup(t);
  assert.equal(audio.preload, 'none');
  assert.equal(audio.loop, true);
  assert.equal(audio.requests.length, 0);
  assert.equal(button.attributes.get('aria-label'), 'Play background music');
  assert.equal(button.innerHTML, '<svg aria-hidden="true"></svg>');
  button.click();
  assert.equal(button.attributes.get('aria-pressed'), 'true');
  audio.requests[0].resolve();
  await Promise.resolve();
  assert.equal(audio.volume, 0);
  for (let i = 0; i < 15; i += 1) t.mock.timers.tick(50);
  assert.equal(audio.volume, 0.14);
  for (let i = 0; i < 15; i += 1) t.mock.timers.tick(50);
  assert.equal(audio.volume, 0.28);
  button.click();
  assert.equal(audio.volume, 0);
  assert.equal(button.dataset.playing, 'false');
  assert.equal(button.innerHTML, '<svg aria-hidden="true"></svg>');
});

test('a paused pending request cannot restart playback or its fade', async (t) => {
  const { button, audio } = setup(t);
  button.click();
  button.click();
  const pauses = audio.pauseCount;
  audio.requests[0].resolve();
  await Promise.resolve();
  t.mock.timers.tick(2000);
  assert.equal(audio.pauseCount, pauses + 1);
  assert.equal(audio.volume, 0);
  assert.equal(button.dataset.playing, 'false');
});

test('older play success or failure cannot supersede the latest play intent', async (t) => {
  const { button, audio } = setup(t);
  button.click();
  button.click();
  button.click();
  const pauses = audio.pauseCount;
  audio.requests[0].resolve();
  await Promise.resolve();
  assert.equal(audio.pauseCount, pauses);
  audio.requests[1].resolve();
  await Promise.resolve();
  t.mock.timers.tick(50);
  assert.ok(audio.volume > 0);
  button.click();
  button.click();
  button.click();
  button.click();
  audio.requests[2].reject(new Error('old request aborted'));
  await Promise.resolve();
  assert.equal(button.dataset.playing, 'true');
  audio.requests[3].resolve();
  await Promise.resolve();
  t.mock.timers.tick(50);
  assert.ok(audio.volume > 0);
});

test('media and playback errors reset the control and allow a fresh retry', async (t) => {
  const { button, audio } = setup(t);
  button.click();
  audio.requests[0].reject(new Error('media failed'));
  await Promise.resolve();
  assert.equal(button.dataset.playing, 'false');
  button.click();
  assert.equal(audio.loadCount, 1);
  audio.requests[1].resolve();
  await Promise.resolve();
  audio.dispatchEvent(new Event('error'));
  assert.equal(button.attributes.get('aria-label'), 'Play background music');
  assert.equal(audio.volume, 0);
  button.click();
  assert.equal(audio.loadCount, 2);
  assert.equal(audio.requests.length, 3);
});

test('dispose cancels fades, releases media and makes late promises inert', async (t) => {
  const { button, audio, soundtrack } = setup(t);
  button.click();
  soundtrack.dispose();
  const loads = audio.loadCount;
  soundtrack.dispose();
  assert.equal(audio.loadCount, loads);
  assert.equal(audio.src, undefined);
  audio.requests[0].resolve();
  await Promise.resolve();
  t.mock.timers.tick(5000);
  assert.equal(audio.volume, 0);
  button.click();
  assert.equal(audio.requests.length, 1);
  assert.equal(button.dataset.playing, 'false');
});

test('dispose during the fade prevents all later volume changes', async (t) => {
  const { button, audio, soundtrack } = setup(t);
  button.click();
  audio.requests[0].resolve();
  await Promise.resolve();
  t.mock.timers.tick(50);
  assert.ok(audio.volume > 0);
  soundtrack.dispose();
  for (let i = 0; i < 40; i += 1) t.mock.timers.tick(50);
  assert.equal(audio.volume, 0);
  assert.equal(button.dataset.playing, 'false');
});
