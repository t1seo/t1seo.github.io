import { getSeoulEnvironment } from './environment.ts';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
export type Weather = 'clear' | 'cloudy' | 'rain' | 'snow' | 'mist';

export interface ClimateState {
  season: Season;
  time: TimeOfDay;
  weather: Weather;
  auto: boolean;
}

export const CYBER_CLIMATE_STORAGE_KEY = 'taewon.studio.climate.v1';
export const CYBER_SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const CYBER_TIMES: readonly TimeOfDay[] = ['morning', 'noon', 'afternoon', 'evening', 'night'];
export const CYBER_WEATHER: readonly Weather[] = ['clear', 'cloudy', 'rain', 'snow', 'mist'];

type ClimateStorage = Pick<Storage, 'getItem' | 'setItem'>;
interface ClimateOptions {
  now?: () => Date;
  storage?: ClimateStorage | null;
}

export interface CyberClimateController {
  getState(): ClimateState;
  setSeason(season: Season): void;
  setTime(time: TimeOfDay): void;
  setWeather(weather: Weather): void;
  setAuto(enabled?: boolean): void;
  destroy(): void;
}

function browserStorage(): ClimateStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

function clockState(date: Date): Pick<ClimateState, 'season' | 'time'> {
  const actual = getSeoulEnvironment(date);
  return { season: actual.season, time: actual.timeOfDay };
}

function restore(storage: ClimateStorage | null, date: Date): ClimateState {
  const defaults: ClimateState = { ...clockState(date), weather: 'clear', auto: true };
  try {
    const raw: unknown = JSON.parse(storage?.getItem(CYBER_CLIMATE_STORAGE_KEY) ?? 'null');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
    const data = raw as Record<string, unknown>;
    if (data.version !== 1) return defaults;
    const weather = CYBER_WEATHER.includes(data.weather as Weather) ? data.weather as Weather : 'clear';
    if (data.auto !== false || !CYBER_SEASONS.includes(data.season as Season) || !CYBER_TIMES.includes(data.time as TimeOfDay)) {
      return { ...defaults, weather };
    }
    return { season: data.season as Season, time: data.time as TimeOfDay, weather, auto: false };
  } catch { return defaults; }
}

/** Auto follows Seoul's calendar and clock. Weather is a chosen atmosphere, not live weather. */
export function createCyberClimate(onChange: (state: ClimateState) => void, options: ClimateOptions = {}): CyberClimateController {
  const now = options.now ?? (() => new Date());
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const page = typeof document === 'undefined' ? null : document;
  let state = restore(storage, now());
  let destroyed = false;

  function update(patch: Partial<ClimateState>, save = true) {
    if (destroyed) return;
    const next = { ...state, ...patch };
    if ((Object.keys(next) as (keyof ClimateState)[]).every(key => next[key] === state[key])) return;
    state = next;
    if (save) {
      try { storage?.setItem(CYBER_CLIMATE_STORAGE_KEY, JSON.stringify({ version: 1, ...state })); }
      catch { /* A full or unavailable store must not interrupt a scene change. */ }
    }
    onChange({ ...state });
  }

  function syncClock() {
    if (!destroyed && state.auto) update(clockState(now()), false);
  }

  function onVisibility() {
    if (page?.visibilityState === 'visible') syncClock();
  }

  const interval = setInterval(syncClock, 60_000);
  if (typeof interval === 'object' && 'unref' in interval) interval.unref();
  page?.addEventListener('visibilitychange', onVisibility);

  return {
    getState() { return { ...state }; },
    setSeason(season) {
      if (CYBER_SEASONS.includes(season)) update({ season, auto: false });
    },
    setTime(time) {
      if (CYBER_TIMES.includes(time)) update({ time, auto: false });
    },
    setWeather(weather) {
      if (CYBER_WEATHER.includes(weather)) update({ weather });
    },
    setAuto(enabled = true) {
      if (destroyed) return;
      update(enabled ? { ...clockState(now()), auto: true } : { auto: false });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearInterval(interval);
      page?.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
