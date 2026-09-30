import test from 'node:test';
import assert from 'node:assert/strict';
import { createCyberSound, type CyberPlaybackState, type CyberSound } from './cyber-sound.ts';

class Parameter {
  value = 0;
  targets: number[] = [];
  cancelAndHoldAtTime() {}
  cancelScheduledValues() {}
  setValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.targets.push(value); }
  exponentialRampToValueAtTime(value: number) { this.targets.push(value); }
}
class AudioNodeMock {
  gain = new Parameter();
  frequency = new Parameter();
  Q = new Parameter();
  type = '';
  disconnected = false;
  starts = 0;
  stops = 0;
  connect(next: AudioNodeMock) { return next; }
  disconnect() { this.disconnected = true; }
  start() { this.starts++; }
  stop() { this.stops++; }
}
class Page extends EventTarget {
  hidden = false;
  visibility(value: boolean) { this.hidden = value; this.dispatchEvent(new Event('visibilitychange')); }
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

async function withAudio(run: (env: {
  sound: CyberSound; states: CyberPlaybackState[]; page: Page;
  elements: AudioMock[]; contexts: ContextMock[];
  deferNext: () => void; rejectNext: () => void; deferResume: () => void;
}) => Promise<void>) {
  const page = new Page();
  const elements: AudioMock[] = [];
  const contexts: ContextMock[] = [];
  let defer = false;
  let reject = false;
  let delayedResume = false;
  class AudioMock extends EventTarget {
    src = '';
    preload = '';
    loop = false;
    paused = true;
    plays = 0;
    loads = 0;
    resolve?: () => void;
    reject?: (error: Error) => void;
    constructor() { super(); elements.push(this); }
    play() {
      this.plays++;
      this.paused = false;
      if (reject) { reject = false; return Promise.reject(new Error('NotAllowedError')); }
      if (defer) {
        defer = false;
        return new Promise<void>((resolve, fail) => { this.resolve = resolve; this.reject = fail; });
      }
      return Promise.resolve();
    }
    pause() { this.paused = true; }
    removeAttribute(name: string) { if (name === 'src') this.src = ''; }
    load() { this.loads++; }
  }
  class ContextMock {
    state = 'suspended';
    currentTime = 0;
    sampleRate = 100;
    destination = new AudioNodeMock();
    nodes: AudioNodeMock[] = [];
    finishResume?: () => void;
    constructor() { contexts.push(this); }
    resume() {
      if (delayedResume) {
        delayedResume = false;
        return new Promise<void>(resolve => {
          this.finishResume = () => { this.state = 'running'; resolve(); };
        });
      }
      this.state = 'running';
      return Promise.resolve();
    }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    node() { const node = new AudioNodeMock(); this.nodes.push(node); return node; }
    createGain() { return this.node(); }
    createMediaElementSource() { return this.node(); }
    createBiquadFilter() { return this.node(); }
    createBufferSource() { return this.node(); }
    createOscillator() { return this.node(); }
    createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
  }
  const replacement = { document: page, Audio: AudioMock, AudioContext: ContextMock };
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries(replacement)) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const states: CyberPlaybackState[] = [];
  const sound = createCyberSound({ onTrackChange: state => states.push(state) });
  try { await run({ sound, states, page, elements, contexts, deferNext: () => { defer = true; }, rejectNext: () => { reject = true; }, deferResume: () => { delayedResume = true; } }); }
  finally {
    sound.destroy();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}
// The names above are intentionally structural: the harness exercises lifecycle
// state and permission boundaries, not the browser's actual audio decoder.
type AudioMock = { src: string; paused: boolean; plays: number; loads: number; resolve?: () => void; reject?: (error: Error) => void; dispatchEvent(event: Event): boolean };
type ContextMock = { state: string; nodes: AudioNodeMock[]; finishResume?: () => void };

test('mount and climate changes while off never create audio or make a media request', async () => {
  await withAudio(async ({ sound, elements, contexts, states }) => {
    sound.setClimate({ season: 'summer', time: 'noon', weather: 'rain' });
    assert.equal(elements.length, 0);
    assert.equal(contexts.length, 0);
    assert.equal(sound.isEnabled(), false);
    assert.equal(states.at(-1)?.playing, false);
  });
});

test('speaker gesture starts the selected local recording; weather starts a different deck and crossfades', async () => {
  await withAudio(async ({ sound, elements, contexts, states }) => {
    sound.setClimate({ season: 'spring', time: 'morning', weather: 'clear' });
    assert.equal(await sound.setEnabled(true), true);
    assert.equal(elements[0].src, '/assets/music/spring-morning.mp3');
    sound.setClimate({ season: 'spring', time: 'morning', weather: 'rain' });
    await flush();
    assert.equal(elements.length, 2);
    assert.notEqual(elements[0].src, elements[1].src);
    assert.equal(elements[0].paused, false, 'outgoing song continues during crossfade');
    assert.equal(states.at(-1)?.playing, true);
    assert.equal(states.at(-1)?.loading, false);
    assert.ok(contexts[0].nodes.some(node => node.gain.targets.includes(0.34)));
  });
});

test('off wins over an unresolved play request', async () => {
  await withAudio(async ({ sound, elements, states, deferNext }) => {
    deferNext();
    const pending = sound.setEnabled(true);
    await sound.setEnabled(false);
    elements[0].resolve?.();
    assert.equal(await pending, false);
    assert.equal(sound.isEnabled(), false);
    assert.equal(elements[0].paused, true);
    assert.equal(elements[0].src, '');
    assert.equal(states.at(-1)?.playing, false);
  });
});

test('rapid climate changes accept only the newest song, including an old rejected load', async () => {
  await withAudio(async ({ sound, elements, states, deferNext }) => {
    await sound.setEnabled(true);
    deferNext();
    sound.setClimate({ season: 'spring', time: 'morning', weather: 'clear' });
    const stale = elements[1];
    sound.setClimate({ season: 'summer', time: 'noon', weather: 'clear' });
    await flush();
    stale.reject?.(new Error('Aborted old request'));
    await flush();
    assert.equal(sound.isEnabled(), true);
    assert.equal(stale.paused, true);
    assert.equal(stale.src, '');
    assert.equal(states.at(-1)?.track.title, 'Bossa Antigua');
    assert.equal(states.at(-1)?.error, null);
  });
});

test('hidden tabs pause, retain consent, and resume without creating a duplicate deck', async () => {
  await withAudio(async ({ sound, page, elements, contexts, states }) => {
    await sound.setEnabled(true);
    page.visibility(true);
    assert.equal(sound.isEnabled(), true);
    assert.equal(elements[0].paused, true);
    assert.equal(contexts[0].state, 'suspended');
    assert.equal(states.at(-1)?.playing, false);
    page.visibility(false);
    await flush();
    assert.equal(elements.length, 1);
    assert.equal(elements[0].plays, 2);
    assert.equal(states.at(-1)?.playing, true);
    elements[0].dispatchEvent(new Event('error'));
    assert.equal(sound.isEnabled(), false, 'errors after resuming are still handled');
  });
});

test('rejected playback clears enabled state and can be retried with a new gesture', async () => {
  await withAudio(async ({ sound, elements, states, rejectNext }) => {
    rejectNext();
    assert.equal(await sound.setEnabled(true), false);
    assert.equal(sound.isEnabled(), false);
    assert.ok(states.at(-1)?.error);
    assert.equal(elements[0].src, '');
    assert.equal(await sound.setEnabled(true), true);
    assert.equal(states.at(-1)?.error, null);
  });
});

test('bowl and cup ring without enabling music, and hidden/destroy dispose the resonances', async () => {
  await withAudio(async ({ sound, page, elements, contexts }) => {
    await sound.playBowl();
    await sound.playCup();
    assert.equal(elements.length, 0);
    assert.equal(sound.isEnabled(), false);
    const oscillators = contexts[0].nodes.filter(node => node.starts > 0);
    assert.equal(oscillators.length, 8);
    page.visibility(true);
    assert.ok(oscillators.every(node => node.disconnected));
    assert.equal(contexts[0].state, 'suspended');
    sound.destroy();
    sound.destroy();
    assert.equal(contexts[0].state, 'closed');
    await sound.playBowl();
    assert.equal(contexts.length, 1);
  });
});

test('destroy wins over pending media and cleans the visibility listener', async () => {
  await withAudio(async ({ sound, page, elements, contexts, deferNext }) => {
    deferNext();
    const pending = sound.setEnabled(true);
    sound.destroy();
    elements[0].resolve?.();
    assert.equal(await pending, false);
    page.visibility(true);
    page.visibility(false);
    assert.equal(sound.isEnabled(), false);
    assert.equal(contexts[0].state, 'closed');
    assert.equal(elements[0].src, '');
    assert.ok(contexts[0].nodes.every(node => node.disconnected));
  });
});

test('an outgoing-song error does not cancel a newer buffering track', async () => {
  await withAudio(async ({ sound, elements, states, deferNext }) => {
    await sound.setEnabled(true);
    deferNext();
    sound.setClimate({ season: 'summer', time: 'noon', weather: 'clear' });
    elements[0].dispatchEvent(new Event('error'));
    assert.equal(sound.isEnabled(), true);
    assert.equal(states.at(-1)?.loading, true);
    elements[1].resolve?.();
    await flush();
    assert.equal(states.at(-1)?.track.title, 'Bossa Antigua');
    assert.equal(states.at(-1)?.playing, true);
    assert.equal(states.at(-1)?.error, null);
  });
});

test('a late bowl resume cannot wake a hidden tab or sound after a hide/show cycle', async () => {
  await withAudio(async ({ sound, page, contexts, deferResume }) => {
    deferResume();
    const bowl = sound.playBowl();
    page.visibility(true);
    contexts[0].finishResume?.();
    await bowl;
    assert.equal(contexts[0].state, 'suspended');
    assert.equal(contexts[0].nodes.length, 0);
    page.visibility(false);
    deferResume();
    const cup = sound.playCup();
    page.visibility(true);
    page.visibility(false);
    contexts[0].finishResume?.();
    await cup;
    assert.equal(contexts[0].nodes.length, 0, 'an old gesture must not sound after returning');
  });
});

test('late resume is reconciled even when play rejects before resume settles', async () => {
  await withAudio(async ({ sound, page, contexts, deferResume, rejectNext }) => {
    deferResume();
    rejectNext();
    const pending = sound.setEnabled(true);
    assert.equal(await pending, false);
    page.visibility(true);
    contexts[0].finishResume?.();
    await flush();
    assert.equal(contexts[0].state, 'suspended');
    assert.equal(sound.isEnabled(), false);
  });
});
