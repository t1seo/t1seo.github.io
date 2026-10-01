import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonalStorage, PERSONAL_STORAGE_KEY, type PersonalSnapshot, type StorageLike } from './penthouse-personal-storage.ts';

class BrowserStorage implements StorageLike {
  readonly values = new Map<string, string>();
  blockRead = false;
  blockWrite = false;
  getItem(key: string) {
    if (this.blockRead) throw new DOMException('Blocked', 'SecurityError');
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.blockWrite) throw new DOMException('Full', 'QuotaExceededError');
    this.values.set(key, value);
  }
}

const snapshot = () => ({
  climate: { season: 'autumn', time: 'night', weather: 'rain', animated: true },
  workspace: { monitor: true, lamp: false, floorLamp: true },
  sound: { musicEnabled: true, rainEnabled: true, musicVolume: 0.35, rainVolume: 0.6 },
} satisfies PersonalSnapshot);

test('browser storage fake follows setItem overwrite and getItem null semantics', () => {
  // Given
  const storage = new BrowserStorage();
  storage.setItem('key', 'old');
  // When
  storage.setItem('key', 'new');
  // Then
  assert.equal(storage.getItem('key'), 'new');
  assert.equal(storage.getItem('missing'), null);
});

test('memo and complete atmosphere presets survive reloading in the same browser', () => {
  // Given
  const storage = new BrowserStorage();
  const first = createPersonalStorage({ storage });
  first.saveMemo('오늘의 생각\nA small thought.');
  first.savePreset('Rainy evening', snapshot());
  // When
  const restored = createPersonalStorage({ storage }).getState();
  // Then
  assert.equal(restored.memo, '오늘의 생각\nA small thought.');
  assert.equal(restored.persistence, 'browser');
  assert.deepEqual(restored.presets[0]?.snapshot, snapshot());
  assert.equal(restored.presets[0]?.name, 'Rainy evening');
});

test('invalid saved documents are ignored without deleting the existing browser value', () => {
  // Given
  const invalid = ['{', 'null', '[]', '{"version":2}', '{"version":1,"memo":1}', JSON.stringify({ version: 1, memo: 'x'.repeat(2001), presets: [], nextId: 1 })];
  for (const raw of invalid) {
    const storage = new BrowserStorage();
    storage.setItem(PERSONAL_STORAGE_KEY, raw);
    // When
    const state = createPersonalStorage({ storage }).getState();
    // Then
    assert.equal(state.memo, '');
    assert.deepEqual(state.presets, []);
    assert.equal(storage.getItem(PERSONAL_STORAGE_KEY), raw);
  }
});

test('out of range or malformed preset snapshots are rejected at the browser boundary', () => {
  // Given
  const base = snapshot();
  const invalid = [
    { ...base, climate: { ...base.climate, season: 'monsoon' } },
    { ...base, climate: { ...base.climate, animated: 'true' } },
    { ...base, workspace: { ...base.workspace, lamp: 1 } },
    { ...base, sound: { ...base.sound, musicVolume: 1.1 } },
    { ...base, sound: { ...base.sound, rainVolume: -0.1 } },
    { ...base, sound: { ...base.sound, rainEnabled: null } },
  ];
  for (const value of invalid) {
    const storage = new BrowserStorage();
    storage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify({ version: 1, memo: '', nextId: 2, presets: [{ id: 'preset-1', name: 'Test', snapshot: value }] }));
    // When
    const state = createPersonalStorage({ storage }).getState();
    // Then
    assert.deepEqual(state.presets, []);
  }
});

test('oversized preset lists, duplicate ids and unsafe ids invalidate the saved document', () => {
  // Given
  const preset = { id: 'preset-1', name: 'Rain', snapshot: snapshot() };
  const invalidLists = [[preset, preset], [{ ...preset, id: '<script>' }], Array.from({ length: 6 }, (_, i) => ({ ...preset, id: `preset-${i + 1}` }))];
  for (const presets of invalidLists) {
    const storage = new BrowserStorage();
    storage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify({ version: 1, memo: '', presets }));
    // When
    const state = createPersonalStorage({ storage }).getState();
    // Then
    assert.deepEqual(state.presets, []);
  }
});

test('memo length cap rejects excessive input while preserving the last saved memo', () => {
  // Given
  const store = createPersonalStorage({ storage: null });
  store.saveMemo('x'.repeat(2000));
  // When
  const result = store.saveMemo('x'.repeat(2001));
  // Then
  assert.deepEqual(result, { status: 'invalid', reason: 'memo-too-long' });
  assert.equal(store.getState().memo.length, 2000);
});

test('five presets fit and the sixth returns full without losing any saved atmosphere', () => {
  // Given
  const store = createPersonalStorage({ storage: null });
  for (let i = 0; i < 5; i++) store.savePreset(`Scene ${i}`, snapshot());
  // When
  const result = store.savePreset('Sixth', snapshot());
  // Then
  assert.deepEqual(result, { status: 'full' });
  assert.equal(store.getState().presets.length, 5);
  assert.equal(new Set(store.getState().presets.map(preset => preset.id)).size, 5);
});

test('blank or excessive names and invalid volumes are rejected before saving', () => {
  // Given
  const store = createPersonalStorage({ storage: null });
  const invalidVolume = { ...snapshot(), sound: { ...snapshot().sound, musicVolume: Number.NaN } };
  // When
  const results = [store.savePreset('   ', snapshot()), store.savePreset('a'.repeat(41), snapshot()), store.savePreset('Test', invalidVolume)];
  // Then
  assert.deepEqual(results, [{ status: 'invalid', reason: 'name-invalid' }, { status: 'invalid', reason: 'name-invalid' }, { status: 'invalid', reason: 'snapshot-invalid' }]);
  assert.deepEqual(store.getState().presets, []);
});

test('HTML-like memo and preset names survive only as text and never influence preset ids', () => {
  // Given
  const storage = new BrowserStorage();
  const store = createPersonalStorage({ storage });
  const html = '<img src=x onerror=alert(1)>';
  store.saveMemo(html);
  store.savePreset(html, snapshot());
  // When
  const state = createPersonalStorage({ storage }).getState();
  // Then
  assert.equal(state.memo, html);
  assert.equal(state.presets[0]?.name, html);
  assert.match(state.presets[0]?.id ?? '', /^preset-\d+$/);
});

test('quota errors retain usable session state and a later save retries browser persistence', () => {
  // Given
  const storage = new BrowserStorage();
  const store = createPersonalStorage({ storage });
  storage.blockWrite = true;
  assert.deepEqual(store.saveMemo('Session memo'), { status: 'saved', persistence: 'memory' });
  store.savePreset('Session scene', snapshot());
  assert.equal(store.getState().presets.length, 1);
  storage.blockWrite = false;
  // When
  const result = store.saveMemo('Recovered memo');
  // Then
  assert.deepEqual(result, { status: 'saved', persistence: 'browser' });
  const restored = createPersonalStorage({ storage }).getState();
  assert.equal(restored.memo, 'Recovered memo');
  assert.equal(restored.presets[0]?.name, 'Session scene');
});

test('blocked browser reads fall back to editable memory without throwing', () => {
  // Given
  const storage = new BrowserStorage();
  storage.blockRead = true;
  storage.blockWrite = true;
  // When
  const store = createPersonalStorage({ storage });
  store.saveMemo('Still editable');
  // Then
  assert.deepEqual(store.getState(), { memo: 'Still editable', presets: [], persistence: 'memory' });
});

test('a SecurityError while accessing default window.localStorage does not prevent memo editing', t => {
  // Given
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { get localStorage() { throw new DOMException('Blocked', 'SecurityError'); } } });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'window', original); else Reflect.deleteProperty(globalThis, 'window'); });
  // When
  const store = createPersonalStorage();
  const result = store.saveMemo('Private window');
  // Then
  assert.deepEqual(result, { status: 'saved', persistence: 'memory' });
  assert.equal(store.getState().memo, 'Private window');
});

test('caller mutation cannot alter saved snapshots or returned nested state', () => {
  // Given
  const store = createPersonalStorage({ storage: null });
  const input = snapshot();
  store.savePreset('Original', input);
  input.sound.musicVolume = 0.9;
  const returned = store.getState().presets[0];
  assert.ok(returned);
  // When
  Reflect.set(returned.snapshot.sound, 'musicVolume', 0.1);
  Reflect.set(returned.snapshot.workspace, 'lamp', true);
  // Then
  assert.deepEqual(store.getState().presets[0]?.snapshot, snapshot());
});

test('deleting a preset frees its slot and persists without changing the memo', () => {
  // Given
  const storage = new BrowserStorage();
  const store = createPersonalStorage({ storage });
  store.saveMemo('Keep this');
  store.savePreset('Remove', snapshot());
  const id = store.getState().presets[0]?.id;
  assert.ok(id);
  // When
  const result = store.deletePreset(id);
  // Then
  assert.deepEqual(result, { status: 'deleted', persistence: 'browser' });
  assert.deepEqual(createPersonalStorage({ storage }).getState(), { memo: 'Keep this', presets: [], persistence: 'browser' });
  assert.deepEqual(store.deletePreset(id), { status: 'not-found' });
});
