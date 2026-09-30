import { deviceTimeZone, fetchLocalWeather, localClock, locateVisitor, validTimeZone, WEATHER_MAX_AGE_MS, WEATHER_REFRESH_MS } from './cyber-local-weather.ts';
import type { Coordinates, LocalWeather } from './cyber-local-weather.ts';

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
  timeZone?: () => string;
  locate?: (signal: AbortSignal) => Promise<Coordinates>;
  weather?: (coords: Coordinates, signal: AbortSignal, now: Date) => Promise<LocalWeather>;
}

export interface LocalClimateInfo {
  status: 'device' | 'locating' | 'loading' | 'live' | 'denied' | 'unavailable';
  timeZone: string;
  localDateTime: string;
  updatedAt: number | null;
}

export interface CyberClimateController {
  getState(): ClimateState;
  getLocalInfo(): LocalClimateInfo;
  subscribeLocalInfo(listener: (info: LocalClimateInfo) => void): () => void;
  start(): Promise<void>;
  useLocation(): Promise<void>;
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

function restore(storage: ClimateStorage | null, clock: Pick<ClimateState, 'season' | 'time'>): ClimateState {
  const defaults: ClimateState = { ...clock, weather: 'clear', auto: true };
  try {
    const raw: unknown = JSON.parse(storage?.getItem(CYBER_CLIMATE_STORAGE_KEY) ?? 'null');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
    const data = raw as Record<string, unknown>;
    if (data.version !== 1) return defaults;
    const weather = CYBER_WEATHER.includes(data.weather as Weather) ? data.weather as Weather : 'clear';
    if (data.auto !== false || !CYBER_SEASONS.includes(data.season as Season) || !CYBER_TIMES.includes(data.time as TimeOfDay)) {
      return defaults;
    }
    return { season: data.season as Season, time: data.time as TimeOfDay, weather, auto: false };
  } catch { return defaults; }
}

/** Device-local clock immediately; permitted location adds hemisphere, sun times and current weather. */
export function createCyberClimate(onChange: (state: ClimateState) => void, options: ClimateOptions = {}): CyberClimateController {
  const now = options.now ?? (() => new Date());
  const getDeviceZone = () => {
    const value = (options.timeZone ?? deviceTimeZone)();
    return validTimeZone(value) ? value : 'UTC';
  };
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const page = typeof document === 'undefined' ? null : document;
  const locate = options.locate ?? locateVisitor;
  const fetchWeather = options.weather ?? fetchLocalWeather;
  let coords: Coordinates | undefined;
  let weather: LocalWeather | undefined;
  let state = restore(storage, localClock(now(), getDeviceZone()));
  let status: LocalClimateInfo['status'] = 'device';
  let destroyed = false;
  let started = false;
  let lastAttempt = -Infinity;
  let request: AbortController | undefined;
  const infoListeners = new Set<(info: LocalClimateInfo) => void>();

  const zone = () => weather?.timeZone ?? getDeviceZone();
  const clockState = () => localClock(now(), zone(), coords?.latitude, weather);
  function getLocalInfo(): LocalClimateInfo {
    return {
      status, timeZone: zone(), updatedAt: weather?.observedAt ?? null,
      localDateTime: new Intl.DateTimeFormat('en', { timeZone: zone(), dateStyle: 'medium', timeStyle: 'short' }).format(now()),
    };
  }
  function notifyInfo() { for (const listener of infoListeners) listener(getLocalInfo()); }
  function cancelRequest() { request?.abort(); request = undefined; }
  function manual(patch: Partial<ClimateState>) {
    if (destroyed) return;
    cancelRequest();
    if (status === 'locating' || status === 'loading') status = weather ? 'live' : 'device';
    update({ ...patch, auto: false });
    notifyInfo();
  }

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
    if (destroyed) return;
    if (state.auto) {
      update(clockState(), false);
      if (weather && now().getTime() - weather.observedAt > WEATHER_MAX_AGE_MS && status === 'live') status = 'unavailable';
      if (started && status !== 'denied' && page?.visibilityState !== 'hidden'
        && now().getTime() - lastAttempt >= WEATHER_REFRESH_MS) void refreshWeather();
    }
    notifyInfo();
  }

  async function refreshWeather(): Promise<void> {
    if (destroyed || !state.auto || request) return;
    const active = new AbortController();
    request = active;
    lastAttempt = now().getTime();
    status = 'locating';
    notifyInfo();
    try {
      const location = await locate(active.signal);
      if (active.signal.aborted || destroyed || !state.auto) return;
      const moved = coords && (coords.latitude !== location.latitude || coords.longitude !== location.longitude);
      if (moved) weather = undefined;
      coords = location;
      // A successful location still gives the correct hemisphere if weather is offline.
      update({ ...clockState(), ...(moved ? { weather: 'clear' as Weather } : {}) }, false);
      status = 'loading';
      notifyInfo();
      const fresh = await fetchWeather(location, active.signal, now());
      if (active.signal.aborted || destroyed || !state.auto) return;
      weather = fresh;
      status = 'live';
      update({ ...clockState(), weather: fresh.weather }, false);
    } catch (error) {
      if (active.signal.aborted || destroyed) return;
      status = typeof error === 'object' && error !== null && 'code' in error && error.code === 1 ? 'denied' : 'unavailable';
    } finally {
      if (request === active) {
        request = undefined;
        if (!destroyed) notifyInfo();
      }
    }
  }

  function setAuto(enabled = true) {
    if (destroyed) return;
    if (!enabled) { manual({}); return; }
    update({ ...clockState(), auto: true, weather: weather && now().getTime() - weather.observedAt < WEATHER_MAX_AGE_MS ? weather.weather : 'clear' });
    notifyInfo();
    if (started) void refreshWeather();
  }

  function onVisibility() {
    if (page?.visibilityState === 'visible') syncClock();
  }

  const interval = setInterval(syncClock, 60_000);
  if (typeof interval === 'object' && 'unref' in interval) interval.unref();
  page?.addEventListener('visibilitychange', onVisibility);

  return {
    getState() { return { ...state }; },
    getLocalInfo,
    subscribeLocalInfo(listener) { if (!destroyed) infoListeners.add(listener); return () => { infoListeners.delete(listener); }; },
    async start() {
      if (started || destroyed) return;
      started = true;
      if (state.auto && page?.visibilityState !== 'hidden') await refreshWeather();
    },
    async useLocation() {
      if (destroyed) return;
      started = true;
      update({ ...clockState(), auto: true });
      await refreshWeather();
    },
    setSeason(season) {
      if (CYBER_SEASONS.includes(season)) manual({ season });
    },
    setTime(time) {
      if (CYBER_TIMES.includes(time)) manual({ time });
    },
    setWeather(weather) {
      if (CYBER_WEATHER.includes(weather)) manual({ weather });
    },
    setAuto,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelRequest();
      infoListeners.clear();
      coords = undefined;
      weather = undefined;
      clearInterval(interval);
      page?.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
