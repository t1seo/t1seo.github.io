import { CYBER_SEASONS, CYBER_TIMES, CYBER_WEATHER, type Season, type TimeOfDay, type Weather } from './cyber-climate.ts';

export const PERSONAL_STORAGE_KEY = 'taewon.penthouse.personal.v1';
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export type PersonalSnapshot = {
  readonly climate: { readonly season: Season; readonly time: TimeOfDay; readonly weather: Weather; readonly animated: boolean };
  readonly workspace: { readonly monitor: boolean; readonly lamp: boolean; readonly floorLamp: boolean };
  readonly sound: { readonly musicEnabled: boolean; readonly rainEnabled: boolean; readonly musicVolume: number; readonly rainVolume: number };
};
export type AtmospherePreset = { readonly id: string; readonly name: string; readonly snapshot: PersonalSnapshot };
export type PersonalState = { readonly memo: string; readonly presets: readonly AtmospherePreset[]; readonly persistence: 'browser' | 'memory' };
export type PersonalSaveResult =
  | { readonly status: 'saved'; readonly persistence: PersonalState['persistence'] }
  | { readonly status: 'invalid'; readonly reason: 'memo-too-long' | 'name-invalid' | 'snapshot-invalid' };
export type PresetSaveResult = PersonalSaveResult | { readonly status: 'full' };
export type PresetDeleteResult =
  | { readonly status: 'deleted'; readonly persistence: PersonalState['persistence'] }
  | { readonly status: 'not-found' };

type SavedPersonalData = { readonly memo: string; readonly presets: readonly AtmospherePreset[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSnapshot(value: unknown): PersonalSnapshot | null {
  if (!isRecord(value)) return null;
  const { climate, workspace, sound } = value;
  if (!isRecord(climate) || !isRecord(workspace) || !isRecord(sound)) return null;
  const season = CYBER_SEASONS.find(option => option === climate.season);
  const time = CYBER_TIMES.find(option => option === climate.time);
  const weather = CYBER_WEATHER.find(option => option === climate.weather);
  if (!season || !time || !weather || typeof climate.animated !== 'boolean') return null;
  if (typeof workspace.monitor !== 'boolean' || typeof workspace.lamp !== 'boolean' || typeof workspace.floorLamp !== 'boolean') return null;
  if (typeof sound.musicEnabled !== 'boolean' || typeof sound.rainEnabled !== 'boolean') return null;
  if (typeof sound.musicVolume !== 'number' || !Number.isFinite(sound.musicVolume) || sound.musicVolume < 0 || sound.musicVolume > 1) return null;
  if (typeof sound.rainVolume !== 'number' || !Number.isFinite(sound.rainVolume) || sound.rainVolume < 0 || sound.rainVolume > 1) return null;
  return {
    climate: { season, time, weather, animated: climate.animated },
    workspace: { monitor: workspace.monitor, lamp: workspace.lamp, floorLamp: workspace.floorLamp },
    sound: { musicEnabled: sound.musicEnabled, rainEnabled: sound.rainEnabled, musicVolume: sound.musicVolume, rainVolume: sound.rainVolume },
  };
}

function parseSavedData(raw: string | null): SavedPersonalData | null {
  if (raw === null || raw.length > 16384) return null;
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch (error) { if (error instanceof SyntaxError) return null; throw error; }
  if (!isRecord(value) || value.version !== 1 || typeof value.memo !== 'string' || value.memo.length > 2000) return null;
  if (!Array.isArray(value.presets) || value.presets.length > 5) return null;
  const presets: AtmospherePreset[] = [];
  const ids = new Set<string>();
  for (const item of value.presets) {
    if (!isRecord(item) || typeof item.id !== 'string' || !/^preset-[1-6]$/.test(item.id) || ids.has(item.id)) return null;
    if (typeof item.name !== 'string' || item.name.trim().length === 0 || item.name.length > 40) return null;
    const snapshot = parseSnapshot(item.snapshot);
    if (!snapshot) return null;
    ids.add(item.id);
    presets.push({ id: item.id, name: item.name.trim(), snapshot });
  }
  return { memo: value.memo, presets };
}

function isStorageUnavailable(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'SecurityError' || error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
}

function copyPreset(preset: AtmospherePreset): AtmospherePreset {
  return { ...preset, snapshot: {
    climate: { ...preset.snapshot.climate },
    workspace: { ...preset.snapshot.workspace },
    sound: { ...preset.snapshot.sound },
  } };
}

export function createPersonalStorage(options: { readonly storage?: StorageLike | null } = {}) {
  let data: SavedPersonalData = { memo: '', presets: [] };
  let persistence: PersonalState['persistence'] = 'memory';
  const storage = () => options.storage === undefined ? (typeof window === 'undefined' ? null : window.localStorage) : options.storage;
  try {
    const source = storage();
    if (source) {
      data = parseSavedData(source.getItem(PERSONAL_STORAGE_KEY)) ?? data;
      persistence = 'browser';
    }
  } catch (error) { if (!isStorageUnavailable(error)) throw error; }

  function persist(): PersonalState['persistence'] {
    persistence = 'memory';
    try {
      const target = storage();
      if (target) {
        target.setItem(PERSONAL_STORAGE_KEY, JSON.stringify({ version: 1, ...data }));
        persistence = 'browser';
      }
    } catch (error) { if (!isStorageUnavailable(error)) throw error; }
    return persistence;
  }

  return {
    getState(): PersonalState { return { memo: data.memo, presets: data.presets.map(copyPreset), persistence }; },
    saveMemo(text: string): PersonalSaveResult {
      if (text.length > 2000) return { status: 'invalid', reason: 'memo-too-long' };
      data = { ...data, memo: text };
      return { status: 'saved', persistence: persist() };
    },
    savePreset(name: string, snapshot: PersonalSnapshot): PresetSaveResult {
      const trimmed = name.trim();
      if (trimmed.length === 0 || trimmed.length > 40) return { status: 'invalid', reason: 'name-invalid' };
      const parsed = parseSnapshot(snapshot);
      if (!parsed) return { status: 'invalid', reason: 'snapshot-invalid' };
      if (data.presets.length === 5) return { status: 'full' };
      let index = 1;
      while (data.presets.some(preset => preset.id === `preset-${index}`)) index++;
      data = { ...data, presets: [...data.presets, { id: `preset-${index}`, name: trimmed, snapshot: parsed }] };
      return { status: 'saved', persistence: persist() };
    },
    deletePreset(id: string): PresetDeleteResult {
      if (!data.presets.some(preset => preset.id === id)) return { status: 'not-found' };
      data = { ...data, presets: data.presets.filter(preset => preset.id !== id) };
      return { status: 'deleted', persistence: persist() };
    },
  };
}
