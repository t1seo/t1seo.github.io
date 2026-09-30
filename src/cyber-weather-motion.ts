/** All motion stays in the illustrated scene's coordinates, independent of DPR. */
export interface WeatherBounds { left: number; right: number; top: number; bottom: number }
export interface WeatherParticle {
  x: number; y: number; speed: number; drift: number; size: number;
  depth: number; alpha: number; phase: number;
}
export type FallingWeather = 'rain' | 'snow' | 'seasonal';

const TAU = Math.PI * 2;
const wrap = (value: number, min: number, span: number) => min + ((value - min) % span + span) % span;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
// Stable scatter prevents a scene/time change from visibly re-rolling the rain.
function scatter(index: number, channel: number): number {
  let bits = Math.imul(index + 1, 374761393) ^ Math.imul(channel + 1, 668265263);
  bits = Math.imul(bits ^ (bits >>> 13), 1274126177);
  return ((bits ^ (bits >>> 16)) >>> 0) / 4294967296;
}

/** Budget is based on the window area, with a firm cap even on very large screens. */
export function createWeatherParticles(kind: FallingWeather, bounds: WeatherBounds, area: number): WeatherParticle[] {
  const density = kind === 'rain' ? 285 : kind === 'snow' ? 204 : 15;
  const count = Math.min(kind === 'rain' ? 140 : kind === 'snow' ? 100 : 10, Math.max(0, Math.round(area * density)));
  return Array.from({ length: count }, (_, index) => ({
    x: bounds.left - .045 + scatter(index, 0) * (bounds.right - bounds.left + .09),
    y: bounds.top - .045 + scatter(index, 1) * (bounds.bottom - bounds.top + .09),
    speed: .8 + scatter(index, 2) * .4,
    drift: .8 + scatter(index, 3) * .4,
    size: .75 + scatter(index, 4) * .5,
    depth: index % 10 < 5 ? 0 : index % 10 < 9 ? 1 : 2,
    alpha: .7 + scatter(index, 5) * .3,
    phase: scatter(index, 6) * TAU,
  }));
}

/** Analytical paths avoid integration drift and resume at the exact paused scene time. */
export function sampleWeatherParticle(particle: WeatherParticle, seconds: number, kind: FallingWeather, bounds: WeatherBounds) {
  const { depth, phase } = particle;
  const rain = kind === 'rain';
  const fall = rain ? [.22, .34, .48][depth] : kind === 'snow' ? [.011, .020, .034][depth] : .015;
  // A shared slow breeze keeps the field coherent; individual phases prevent lockstep.
  const wind = Math.sin(seconds * .19) * (rain ? .0018 : .006);
  const sway = rain ? 0 : Math.sin(seconds * (.32 + depth * .07) + phase) * (.004 + depth * .003);
  return {
    x: wrap(particle.x + seconds * (rain ? .029 + depth * .014 : .0038 + depth * .0013) * particle.drift + wind + sway,
      bounds.left - .045, bounds.right - bounds.left + .09),
    y: wrap(particle.y + seconds * fall * particle.speed, bounds.top - .045, bounds.bottom - bounds.top + .09),
    // Match streak direction to world motion despite the scene's wide aspect ratio.
    slant: rain ? (.029 + depth * .014) * particle.drift / (fall * particle.speed) * (1672 / 941) : 0,
  };
}

export const GLASS_DROP_COUNT = 8;

/** Sparse drops cling, then trickle down the window; both ends fade before reset. */
export function sampleGlassDrop(seconds: number, index: number, bounds: WeatherBounds) {
  const duration = 22 + scatter(index, 7) * 17;
  const cycle = wrap(seconds / duration + scatter(index, 8), 0, 1);
  const travel = ease((cycle - .16) / .70);
  const spanY = bounds.bottom - bounds.top;
  const x = bounds.left + (.08 + scatter(index, 9) * .84) * (bounds.right - bounds.left);
  const top = bounds.top + (.06 + scatter(index, 10) * .44) * spanY;
  return {
    x: x + Math.sin(travel * 4 + index) * .00065,
    y: top + travel * spanY * (.15 + scatter(index, 11) * .12),
    tail: (.003 + travel * .017) * ease(cycle / .12),
    opacity: ease(cycle / .13) * ease((1 - cycle) / .16) * (.19 + scatter(index, 12) * .10),
    size: .9 + scatter(index, 13) * .65,
  };
}
