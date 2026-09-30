import { deriveTimeOfDay } from './environment.ts';
import type { Season, TimeOfDay, Weather } from './cyber-climate.ts';

export interface Coordinates { latitude: number; longitude: number }
export interface LocalWeather {
  weather: Weather;
  timeZone: string;
  observedAt: number;
  isDay: boolean;
  sun: { sunrise: number; sunset: number }[];
}

export const WEATHER_REFRESH_MS = 15 * 60_000;
export const WEATHER_MAX_AGE_MS = 2 * 60 * 60_000;

export function validTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return true; }
  catch { return false; }
}

export function deviceTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
  catch { return 'UTC'; }
}

/** Calendar seasons follow the hemisphere; no location is inferred from an IP address. */
export function localClock(date: Date, timeZone: string, latitude = 0, weather?: LocalWeather) {
  const zone = validTimeZone(timeZone) ? timeZone : deviceTimeZone();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (key: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === key)?.value);
  const month = ((value('month') - 1 + (latitude < 0 ? 6 : 0)) % 12) + 1;
  const season: Season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer'
    : month >= 9 && month <= 11 ? 'autumn' : 'winter';
  const hour = value('hour') + value('minute') / 60;
  let time: TimeOfDay = deriveTimeOfDay(hour, season);
  const timestamp = date.getTime();
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: zone, dateStyle: 'short' });
  const sun = weather?.sun.find(entry => day.format(entry.sunrise) === day.format(date));
  if (sun) {
    if (timestamp < sun.sunrise - 30 * 60_000 || timestamp >= sun.sunset + 45 * 60_000) time = 'night';
    else if (timestamp >= sun.sunset - 30 * 60_000) time = 'evening';
    else if (hour < 11) time = 'morning';
    else if (hour < 14) time = 'noon';
    else time = 'afternoon';
  } else if (weather && Math.abs(timestamp - weather.observedAt) < WEATHER_MAX_AGE_MS) {
    // Polar day/night may have no sunrise or sunset in the response.
    if (!weather.isDay) time = 'night';
    else if (time === 'night' || time === 'evening') time = hour < 12 ? 'morning' : 'afternoon';
  }
  return { season, time };
}

export function weatherFromCode(code: unknown): Weather | null {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'mist';
  if ([71, 73, 75, 77, 85, 86].includes(code as number)) return 'snow';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 97, 99].includes(code as number)) return 'rain';
  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function parseLocalWeather(data: unknown, now: Date): LocalWeather {
  if (!isObject(data) || !isObject(data.current) || !validTimeZone(data.timezone)) {
    throw new Error('Invalid weather response');
  }
  const weather = weatherFromCode(data.current.weather_code);
  const observedAt = typeof data.current.time === 'number' ? data.current.time * 1000 : NaN;
  const age = now.getTime() - observedAt;
  if (!weather || !Number.isFinite(observedAt) || age > WEATHER_MAX_AGE_MS || age < -WEATHER_REFRESH_MS
    || (data.current.is_day !== 0 && data.current.is_day !== 1)) throw new Error('Weather unavailable or out of date');
  const sun: LocalWeather['sun'] = [];
  if (isObject(data.daily) && Array.isArray(data.daily.sunrise) && Array.isArray(data.daily.sunset)) {
    data.daily.sunrise.forEach((rise: unknown, index: number) => {
      const set: unknown = (data.daily as Record<string, unknown[]>).sunset[index];
      if (typeof rise === 'number' && typeof set === 'number' && Number.isFinite(rise) && Number.isFinite(set)
        && rise > 0 && set > rise && set - rise <= 24 * 3600) sun.push({ sunrise: rise * 1000, sunset: set * 1000 });
    });
  }
  return { weather, timeZone: data.timezone, observedAt, isDay: data.current.is_day === 1, sun };
}

export function coarseCoordinates(coords: Coordinates): Coordinates {
  if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)
    || Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) throw new Error('Invalid location');
  // Weather grids do not need precise coordinates. Keep only ~1 km precision in memory.
  return { latitude: Math.round(coords.latitude * 100) / 100, longitude: Math.round(coords.longitude * 100) / 100 };
}

export function locateVisitor(signal: AbortSignal): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unsupported')); return;
    }
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      action();
    };
    const onAbort = () => finish(() => reject(signal.reason));
    const timeout = setTimeout(() => finish(() => reject(new Error('Location timed out'))), 15_000);
    signal.addEventListener('abort', onAbort, { once: true });
    try { navigator.geolocation.getCurrentPosition(
      position => finish(() => {
        try { resolve(coarseCoordinates(position.coords)); } catch (error) { reject(error); }
      }),
      error => finish(() => reject(error)),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: WEATHER_REFRESH_MS },
    ); } catch (error) { finish(() => reject(error)); }
  });
}

export async function fetchLocalWeather(coords: Coordinates, signal: AbortSignal, now = new Date()): Promise<LocalWeather> {
  const coarse = coarseCoordinates(coords);
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(coarse.latitude), longitude: String(coarse.longitude),
    current: 'weather_code,is_day', daily: 'sunrise,sunset',
    timezone: 'auto', timeformat: 'unixtime', forecast_days: '2',
  }).toString();
  const timeout = AbortSignal.timeout(12_000);
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, timeout]), credentials: 'omit', referrerPolicy: 'no-referrer',
  });
  if (!response.ok) throw new Error('Weather request failed');
  return parseLocalWeather(await response.json(), now);
}
