import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createCyberSound } from './cyber-sound.ts';
import { CYBER_MUSIC_TRACKS } from './cyber-music-catalog.ts';

const albumTrack = CYBER_MUSIC_TRACKS[2];
class Parameter {
  value = 0;
  cancelAndHoldAtTime() {}
  setValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
}
class AudioNodeFake {
  gain = new Parameter();
  connect(next: AudioNodeFake) { return next; }
  disconnect() {}
}
function fixture(t: TestContext) {
  const elements: Media[] = [];
  let delayed = false;
  let rejected = false;
  class Media extends EventTarget {
    src = '';
    position = 0;
    seeks = 0;
    get currentTime() { return this.position; }
    set currentTime(value: number) { this.position = value; this.seeks++; }
    paused = true;
    resolve?: () => void;
    constructor() { super(); elements.push(this); }
    play() {
      this.paused = false;
      if (rejected) { rejected = false; return Promise.reject(new DOMException('Blocked', 'NotAllowedError')); }
      if (delayed) { delayed = false; return new Promise<void>(resolve => { this.resolve = resolve; }); }
      return Promise.resolve();
    }
    pause() { this.paused = true; }
    removeAttribute() { this.src = ''; }
    load() {}
  }
  class Context {
    state = 'suspended';
    currentTime = 0;
    destination = new AudioNodeFake();
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createGain() { return new AudioNodeFake(); }
    createMediaElementSource() { return new AudioNodeFake(); }
  }
  const page = Object.assign(new EventTarget(), { hidden: false });
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ document: page, Audio: Media, AudioContext: Context })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  const sound = createCyberSound({ independentMix: true });
  t.after(() => {
    sound.destroy();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  return { sound, elements, page, delay: () => { delayed = true; }, reject: () => { rejected = true; } };
}
const flush = async () => { for (let index = 0; index < 12; index++) await Promise.resolve(); };

test('album open calls play synchronously from the gesture when music was off', async t => {
  // Given a silent room with no requested recording.
  const { sound, elements } = fixture(t);
  assert.equal(elements.length, 0);
  // When the album gesture starts a listening session.
  sound.beginMusicSession(albumTrack);
  // Then permission-sensitive playback has started before yielding to an import.
  assert.equal(elements[0].src, albumTrack.src);
  assert.equal(elements[0].paused, false);
  await flush();
  assert.equal(sound.getMix().musicEnabled, true);
});

test('album close restores the recording cursor after the old decoder has been retired', async t => {
  // Given music at a known point before a completed album crossfade.
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { sound, elements } = fixture(t);
  await sound.setEnabled(true);
  const oldTrack = sound.getCurrentTrack();
  elements[0].currentTime = 37.25;
  const session = sound.beginMusicSession(albumTrack);
  await flush();
  t.mock.timers.tick(1500);
  // When the album closes.
  session.close();
  await flush();
  // Then a restored decoder resumes the original recording at its bookmark.
  assert.equal(sound.getCurrentTrack(), oldTrack);
  assert.equal(elements.at(-1)?.currentTime, 37.25);
  assert.equal(sound.isEnabled(), true);
});

test('closing while album playback is pending cannot start late music', async t => {
  // Given a silent room waiting for the album recording.
  const { sound, elements, delay } = fixture(t);
  delay();
  const session = sound.beginMusicSession(albumTrack);
  // When close wins the race with the browser play promise.
  session.close();
  elements[0].resolve?.();
  await flush();
  // Then the delayed recording is released and silence is restored.
  assert.equal(sound.isEnabled(), false);
  assert.equal(elements[0].paused, true);
  assert.equal(elements[0].src, '');
});

test('automatic climate selection cannot replace the album recording', async t => {
  // Given active album music.
  const { sound, elements } = fixture(t);
  sound.beginMusicSession(albumTrack);
  await flush();
  // When an automatic clock/weather update arrives.
  sound.setClimate({ season: 'winter', time: 'night', weather: 'snow' });
  await flush();
  // Then the album stays uninterrupted without an extra decoder.
  assert.equal(sound.getCurrentTrack(), albumTrack);
  assert.equal(elements.length, 1);
});

test('pause during the album remains paused after closing it', async t => {
  // Given previously playing room music paused explicitly inside the album.
  const { sound } = fixture(t);
  await sound.setEnabled(true);
  const original = sound.getCurrentTrack();
  const session = sound.beginMusicSession(albumTrack);
  await flush();
  await sound.setEnabled(false);
  // When the album closes.
  session.close();
  await flush();
  // Then room track selection is restored without overriding the listener.
  assert.equal(sound.getCurrentTrack(), original);
  assert.equal(sound.isEnabled(), false);
});

test('a blocked album recording leaves close safe and supports a later gesture retry', async t => {
  // Given a browser denying initial album playback.
  const { sound, reject } = fixture(t);
  reject();
  const session = sound.beginMusicSession(albumTrack);
  await flush();
  assert.equal(sound.isEnabled(), false);
  // When the listener retries through Play music.
  assert.equal(await sound.setEnabled(true), true);
  // Then the album track plays and closing keeps that explicit play preference.
  assert.equal(sound.getCurrentTrack(), albumTrack);
  session.close();
  await flush();
  assert.equal(sound.isEnabled(), true);
});

test('album music remains playing when the tab becomes hidden', async t => {
  // Given album playback started from a gesture.
  const { sound, page, elements } = fixture(t);
  sound.beginMusicSession(albumTrack);
  await flush();
  // When another browser tab is selected.
  page.hidden = true;
  page.dispatchEvent(new Event('visibilitychange'));
  // Then the recording is neither stopped nor restarted.
  assert.equal(sound.isEnabled(), true);
  assert.equal(elements[0].paused, false);
  assert.equal(elements.length, 1);
});

test('closing before an album buffer resolves keeps the original deck and cursor', async t => {
  // Given an interrupted room song with a delayed album replacement.
  const { sound, elements, delay } = fixture(t);
  await sound.setEnabled(true);
  elements[0].currentTime = 19;
  const original = sound.getCurrentTrack();
  delay();
  const session = sound.beginMusicSession(albumTrack);
  // When the listener closes before the new song arrives.
  session.close();
  elements[1].resolve?.();
  await flush();
  // Then the existing room decoder is reused without an extra track or stale swap.
  assert.equal(sound.getCurrentTrack(), original);
  assert.equal(elements.length, 2);
  assert.equal(elements[0].currentTime, 19);
  assert.equal(elements[0].paused, false);
  assert.equal(elements[1].src, '');
});

test('an already playing album song continues without rewinding on open or close', async t => {
  // Given Childhood is already the current room recording.
  const { sound, elements } = fixture(t);
  sound.setClimate({ season: 'spring', time: 'afternoon', weather: 'clear' });
  await sound.setEnabled(true);
  elements[0].currentTime = 25;
  const originalSeeks = elements[0].seeks;
  const session = sound.beginMusicSession(albumTrack);
  await flush();
  assert.equal(elements[0].currentTime, 25);
  elements[0].position = 29;
  // When the album closes after more music has played.
  session.close();
  await flush();
  // Then the same single recording continues at its current point.
  assert.equal(elements.length, 1);
  assert.equal(elements[0].currentTime, 29);
  assert.equal(elements[0].seeks, originalSeeks);
});

test('reopening during the closing fade cancels its pending retirement', async t => {
  // Given an album just closed over an originally silent room.
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { sound, elements } = fixture(t);
  const session = sound.beginMusicSession(albumTrack);
  await flush();
  session.close();
  // When it reopens before the old fade timer completes.
  sound.beginMusicSession(albumTrack);
  await flush();
  t.mock.timers.tick(2000);
  // Then the reused album decoder stays playing and no duplicate is allocated.
  assert.equal(sound.isEnabled(), true);
  assert.equal(elements.length, 1);
  assert.equal(elements[0].paused, false);
  assert.equal(elements[0].src, albumTrack.src);
});

test('resuming an explicitly paused album continues from its paused position', async t => {
  // Given a listener who paused the album after 18 seconds and released its decoder.
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { sound, elements } = fixture(t);
  sound.beginMusicSession(albumTrack);
  await flush();
  elements[0].position = 18;
  await sound.setEnabled(false);
  t.mock.timers.tick(500);
  // When Play music is selected again.
  await sound.setEnabled(true);
  // Then playback continues from the pause, rather than from a stale session bookmark.
  assert.equal(elements.at(-1)?.currentTime, 18);
});
