import test from 'node:test';
import assert from 'node:assert/strict';
import { createCyberSound, type CyberSoundMixer } from './cyber-sound.ts';

class Parameter {
  value = 0;
  targets: number[] = [];
  cancelAndHoldAtTime() {}
  setValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.targets.push(value); }
}
class Node {
  gain = new Parameter();
  frequency = new Parameter();
  type = '';
  loop = false;
  starts = 0;
  stops = 0;
  disconnected = false;
  connections: Node[] = [];
  connect(next: Node) { this.connections.push(next); return next; }
  disconnect() { this.disconnected = true; }
  start() { this.starts++; }
  stop() { this.stops++; }
}

async function withMixer(run: (environment: {
  sound: CyberSoundMixer;
  contexts: Context[];
  elements: Media[];
  page: EventTarget & { hidden: boolean };
  delayResume(): void;
  rejectPlay(): void;
  rejectResume(): void;
  errors: (string | null)[];
}) => Promise<void>) {
  let delayedResume = false;
  let rejectedPlay = false;
  let rejectedResume = false;
  const errors: (string | null)[] = [];
  const contexts: Context[] = [];
  const elements: Media[] = [];
  const page = Object.assign(new EventTarget(), { hidden: false });
  class Context {
    state = 'suspended';
    currentTime = 0;
    sampleRate = 100;
    destination = new Node();
    nodes: Node[] = [];
    mediaSources: Node[] = [];
    finishResume?: () => void;
    constructor() { contexts.push(this); }
    resume() {
      if (rejectedResume) { rejectedResume = false; return Promise.reject(new Error('blocked')); }
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
    node() { const node = new Node(); this.nodes.push(node); return node; }
    createGain() { return this.node(); }
    createMediaElementSource() { const source = this.node(); this.mediaSources.push(source); return source; }
    createBufferSource() { return this.node(); }
    createBiquadFilter() { return this.node(); }
    createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
  }
  class Media extends EventTarget {
    src = '';
    paused = true;
    constructor() { super(); elements.push(this); }
    play() {
      if (rejectedPlay) { rejectedPlay = false; return Promise.reject(new Error('blocked')); }
      this.paused = false;
      return Promise.resolve();
    }
    pause() { this.paused = true; }
    removeAttribute() { this.src = ''; }
    load() {}
  }
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ document: page, AudioContext: Context, Audio: Media })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const sound = createCyberSound({ independentMix: true, onMixChange: (_mix, error) => errors.push(error) });
  try { await run({ sound, contexts, elements, page, errors, delayResume: () => { delayedResume = true; }, rejectPlay: () => { rejectedPlay = true; }, rejectResume: () => { rejectedResume = true; } }); }
  finally {
    sound.destroy();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}
type Context = { state: string; nodes: Node[]; mediaSources: Node[]; finishResume?: () => void };
type Media = { src: string; paused: boolean };

test('restoring mix volumes and rainy weather never starts audio without a gesture', async () => {
  await withMixer(async ({ sound, contexts, elements }) => {
    await sound.setMix({ musicEnabled: true, rainEnabled: true, musicVolume: .2, rainVolume: .8 });
    sound.setClimate({ season: 'autumn', time: 'night', weather: 'rain' });
    sound.setRain(true);
    assert.deepEqual(sound.getMix(), { musicEnabled: false, rainEnabled: false, musicVolume: .2, rainVolume: .8 });
    assert.equal(contexts.length, 0);
    assert.equal(elements.length, 0);
  });
});

test('rain plays alone with its own audible gain and stays on in a background tab', async () => {
  await withMixer(async ({ sound, contexts, elements, page }) => {
    await sound.setMix({ rainEnabled: true, rainVolume: .75 }, true);
    page.hidden = true;
    page.dispatchEvent(new Event('visibilitychange'));
    assert.equal(sound.getMix().musicEnabled, false);
    assert.equal(sound.getMix().rainEnabled, true);
    assert.equal(elements.length, 0);
    assert.ok(contexts.some(context => context.nodes.some(node => node.gain.targets.includes(.021))));
    assert.ok(contexts.every(context => context.state === 'running'));
  });
});

test('music and rain gains adjust independently without replacing the recording', async () => {
  await withMixer(async ({ sound, contexts, elements }) => {
    await sound.setMix({ musicEnabled: true, rainEnabled: true }, true);
    await sound.setMix({ musicVolume: .325, rainVolume: .25 });
    assert.equal(elements.length, 1);
    const targets = contexts.flatMap(context => context.nodes.flatMap(node => node.gain.targets));
    assert.ok(targets.includes(.17));
    assert.ok(targets.includes(.007));
    await sound.setEnabled(false);
    assert.equal(sound.getMix().rainEnabled, true);
  });
});

test('rain off during a pending resume wins without creating a noise source', async () => {
  await withMixer(async ({ sound, contexts, delayResume }) => {
    delayResume();
    const pending = sound.setMix({ rainEnabled: true }, true);
    await sound.setMix({ rainEnabled: false });
    contexts[0].finishResume?.();
    await pending;
    assert.equal(sound.getMix().rainEnabled, false);
    assert.equal(contexts[0].nodes.length, 0);
    assert.equal(contexts[0].state, 'suspended');
  });
});

test('music failure leaves independently enabled rain playing', async () => {
  await withMixer(async ({ sound, contexts, rejectPlay }) => {
    rejectPlay();
    await sound.setMix({ musicEnabled: true, rainEnabled: true }, true);
    assert.equal(sound.getMix().musicEnabled, false);
    assert.equal(sound.getMix().rainEnabled, true);
    assert.ok(contexts.some(context => context.nodes.some(node => node.starts === 1)));
  });
});

test('destroy closes pending rain and a late resume cannot recreate its source', async () => {
  await withMixer(async ({ sound, contexts, delayResume }) => {
    delayResume();
    const pending = sound.setMix({ rainEnabled: true }, true);
    sound.destroy();
    contexts[0].finishResume?.();
    await pending;
    assert.equal(contexts[0].state, 'closed');
    assert.equal(contexts[0].nodes.length, 0);
    assert.equal(sound.getMix().rainEnabled, false);
  });
});

test('music in a rainy climate stays rain-free until the rain control is enabled', async () => {
  await withMixer(async ({ sound, contexts }) => {
    sound.setClimate({ season: 'spring', time: 'morning', weather: 'rain' });
    sound.setRain(true);
    await sound.setEnabled(true);
    assert.equal(sound.getMix().musicEnabled, true);
    assert.equal(sound.getMix().rainEnabled, false);
    assert.ok(contexts.every(context => context.nodes.every(node => node.starts === 0)));
  });
});

test('rain startup failure preserves music, publishes an error and another gesture can retry', async () => {
  await withMixer(async ({ sound, elements, rejectResume, errors }) => {
    await sound.setEnabled(true);
    rejectResume();
    await sound.setMix({ rainEnabled: true }, true);
    assert.equal(sound.getMix().rainEnabled, false);
    assert.equal(sound.getMix().musicEnabled, true);
    assert.equal(elements[0].paused, false);
    assert.match(errors.at(-1) ?? '', /Rain could not start/);
    await sound.setMix({ rainEnabled: true }, true);
    assert.equal(sound.getMix().rainEnabled, true);
    assert.equal(errors.at(-1), null);
  });
});

test('turning established rain off releases its graph after the short fade', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  await withMixer(async ({ sound, contexts }) => {
    await sound.setMix({ rainEnabled: true }, true);
    await sound.setMix({ rainEnabled: false });
    context.mock.timers.tick(180);
    assert.equal(contexts[0].state, 'suspended');
    assert.ok(contexts[0].nodes.every(node => node.disconnected));
    assert.equal(contexts[0].nodes.filter(node => node.stops === 1).length, 1);
  });
});

test('volume restoration clamps invalid levels without creating an audio context', async () => {
  await withMixer(async ({ sound, contexts }) => {
    await sound.setMix({ musicVolume: -1, rainVolume: 5 });
    assert.equal(sound.getMix().musicVolume, 0);
    assert.equal(sound.getMix().rainVolume, 1);
    await sound.setMix({ musicVolume: Number.NaN, rainVolume: Number.POSITIVE_INFINITY });
    assert.equal(sound.getMix().musicVolume, 0);
    assert.equal(sound.getMix().rainVolume, 1);
    assert.equal(contexts.length, 0);
  });
});

test('muting during a climate crossfade silences both music paths', async () => {
  await withMixer(async ({ sound, contexts }) => {
    await sound.setEnabled(true);
    sound.setClimate({ season: 'spring', time: 'morning', weather: 'clear' });
    await sound.setMix({ musicVolume: 0 });
    const sources = contexts.flatMap(context => context.mediaSources);
    assert.equal(sources.length, 2);
    const masters = sources.map(source => source.connections[0].connections[0]);
    assert.equal(masters[0], masters[1]);
    assert.equal(masters[0].gain.targets.at(-1), 0);
  });
});
