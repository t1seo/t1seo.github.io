export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export interface StudioState {
  season: Season;
  timeOfDay: TimeOfDay;
  auto: boolean;
  lampOn: boolean;
  curtainOpen: boolean;
  monitorOn: boolean;
  soundOn: boolean;
  motionOn: boolean;
}

export const ENVIRONMENT_STORAGE_KEY = 'jieun.studio.environment.v1';
const seasons: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];
const times: readonly TimeOfDay[] = ['morning', 'noon', 'afternoon', 'evening', 'night'];
const daylight: Record<Season, { morning: number; evening: number; night: number }> = {
  spring: { morning: 6, evening: 18, night: 20 },
  summer: { morning: 5, evening: 19, night: 21 },
  autumn: { morning: 6, evening: 17.5, night: 19.5 },
  winter: { morning: 7, evening: 16.5, night: 19 },
};

/** A deliberately gentle calendar cycle, rather than an astronomical sunrise calculation. */
export function deriveTimeOfDay(hour: number, season: Season): TimeOfDay {
  if (!Number.isFinite(hour) || hour < 0 || hour >= 24) {
    throw new RangeError('hour must be between 0 (inclusive) and 24 (exclusive).');
  }
  const light = daylight[season];
  if (hour < light.morning || hour >= light.night) return 'night';
  if (hour < 11) return 'morning';
  if (hour < 14) return 'noon';
  if (hour < light.evening) return 'afternoon';
  return 'evening';
}

const seoulClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul', month: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
});

export function getSeoulEnvironment(date: Date = new Date()): { season: Season; timeOfDay: TimeOfDay } {
  const parts = seoulClock.formatToParts(date);
  const part = (name: Intl.DateTimeFormatPartTypes) => Number(parts.find((entry) => entry.type === name)?.value);
  const month = part('month');
  const season: Season = month >= 3 && month <= 5 ? 'spring'
    : month >= 6 && month <= 8 ? 'summer'
    : month >= 9 && month <= 11 ? 'autumn' : 'winter';
  return { season, timeOfDay: deriveTimeOfDay(part('hour') + part('minute') / 60, season) };
}

type StudioStorage = Pick<Storage, 'getItem' | 'setItem'>;
interface EnvironmentOptions {
  /** Optional dependencies keep state behavior testable outside a browser. */
  now?: () => Date;
  storage?: StudioStorage | null;
  reducedMotion?: boolean;
}

interface Preferences {
  auto: boolean;
  season?: Season;
  timeOfDay?: TimeOfDay;
  lampOverride: boolean | null;
  curtainOpen: boolean;
  monitorOn: boolean;
  soundOn: boolean;
  motionOverride: boolean | null;
}

function browserStorage(): StudioStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

function readPreferences(storage: StudioStorage | null): Preferences {
  const defaults: Preferences = {
    auto: true, lampOverride: null, curtainOpen: true, monitorOn: true, soundOn: false, motionOverride: null,
  };
  try {
    const raw: unknown = JSON.parse(storage?.getItem(ENVIRONMENT_STORAGE_KEY) ?? 'null');
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return defaults;
    const data = raw as Record<string, unknown>;
    if (data.version !== 1) return defaults;
    const season = seasons.includes(data.season as Season) ? data.season as Season : undefined;
    const timeOfDay = times.includes(data.timeOfDay as TimeOfDay) ? data.timeOfDay as TimeOfDay : undefined;
    return {
      auto: data.auto !== false || (!season && !timeOfDay), season, timeOfDay,
      lampOverride: typeof data.lampOverride === 'boolean' ? data.lampOverride : null,
      curtainOpen: typeof data.curtainOpen === 'boolean' ? data.curtainOpen : true,
      monitorOn: typeof data.monitorOn === 'boolean' ? data.monitorOn : true,
      soundOn: typeof data.soundOn === 'boolean' ? data.soundOn : false,
      motionOverride: typeof data.motionOverride === 'boolean' ? data.motionOverride : null,
    };
  } catch { return defaults; }
}

function usesLamp(time: TimeOfDay): boolean { return time === 'evening' || time === 'night'; }

export function createEnvironment(options: EnvironmentOptions = {}) {
  const now = options.now ?? (() => new Date());
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const preferences = readPreferences(storage);
  const media = options.reducedMotion === undefined && typeof window !== 'undefined'
    && typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let lampOverride = preferences.lampOverride;
  let motionOverride = preferences.motionOverride;
  const current = getSeoulEnvironment(now());
  const initialTime = preferences.auto ? current.timeOfDay : preferences.timeOfDay ?? current.timeOfDay;
  let state: StudioState = {
    season: preferences.auto ? current.season : preferences.season ?? current.season,
    timeOfDay: initialTime,
    auto: preferences.auto,
    lampOn: lampOverride ?? usesLamp(initialTime),
    curtainOpen: preferences.curtainOpen,
    monitorOn: preferences.monitorOn,
    soundOn: preferences.soundOn,
    motionOn: motionOverride ?? !(options.reducedMotion ?? media?.matches ?? false),
  };
  const listeners = new Set<(state: StudioState) => void>();
  let destroyed = false;

  function persist() {
    try {
      storage?.setItem(ENVIRONMENT_STORAGE_KEY, JSON.stringify({
        version: 1, auto: state.auto,
        season: state.auto ? null : state.season,
        timeOfDay: state.auto ? null : state.timeOfDay,
        lampOverride, curtainOpen: state.curtainOpen, monitorOn: state.monitorOn,
        soundOn: state.soundOn, motionOverride,
      }));
    } catch { /* Private browsing or a full storage quota must never break a room interaction. */ }
  }

  function update(patch: Partial<StudioState>, save = true) {
    if (destroyed) return;
    const next = { ...state, ...patch };
    const changed = (Object.keys(next) as (keyof StudioState)[]).some((key) => next[key] !== state[key]);
    state = next;
    if (save) persist();
    if (changed) for (const listener of listeners) listener({ ...state });
  }

  function syncClock() {
    if (!state.auto || destroyed) return;
    const actual = getSeoulEnvironment(now());
    update({ ...actual, lampOn: lampOverride ?? usesLamp(actual.timeOfDay) }, false);
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') syncClock();
  }

  function onMotionPreference(event: MediaQueryListEvent) {
    if (motionOverride === null) update({ motionOn: !event.matches }, false);
  }

  const interval = setInterval(syncClock, 60_000);
  // Native Node tests and non-browser consumers should not be kept alive by the clock.
  if (typeof interval === 'object' && 'unref' in interval) interval.unref();
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
  media?.addEventListener('change', onMotionPreference);

  return {
    getState(): StudioState { return { ...state }; },
    subscribe(listener: (state: StudioState) => void): () => void {
      if (destroyed) return () => {};
      listeners.add(listener);
      listener({ ...state });
      return () => { listeners.delete(listener); };
    },
    setSeason(season: Season) {
      if (!seasons.includes(season)) return;
      update({ season, auto: false });
    },
    setTimeOfDay(timeOfDay: TimeOfDay) {
      if (!times.includes(timeOfDay)) return;
      update({ timeOfDay, auto: false, lampOn: lampOverride ?? usesLamp(timeOfDay) });
    },
    setAuto() {
      lampOverride = null;
      const actual = getSeoulEnvironment(now());
      update({ ...actual, auto: true, lampOn: usesLamp(actual.timeOfDay) });
    },
    toggleLamp() { lampOverride = !state.lampOn; update({ lampOn: lampOverride }); },
    toggleCurtain() { update({ curtainOpen: !state.curtainOpen }); },
    toggleMonitor() { update({ monitorOn: !state.monitorOn }); },
    toggleSound() { update({ soundOn: !state.soundOn }); },
    toggleMotion() { motionOverride = !state.motionOn; update({ motionOn: motionOverride }); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearInterval(interval);
      listeners.clear();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
      media?.removeEventListener('change', onMotionPreference);
    },
  };
}
