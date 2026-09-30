/** Registered landmarks on the 1672 × 941 contemporary riverfront plates.
 * These are scene coordinates, not viewport coordinates. */
export type ScenePoint = readonly [number, number];

export const BRIDGE_PATH: readonly ScenePoint[] = [
  [.33, .452], [.41, .433], [.56, .406], [.72, .381], [.88, .364],
];

const TRAFFIC = [
  { duration: 36, offset: .10, direction: 1 },
  { duration: 43, offset: .48, direction: -1 },
  { duration: 39, offset: .81, direction: 1 },
  { duration: 47, offset: .20, direction: -1 },
  { duration: 42, offset: .64, direction: 1 },
] as const;

export const TRAFFIC_COUNT = TRAFFIC.length;

/** Equal-distance progress avoids cars suddenly speeding up on long segments. */
export function samplePath(path: readonly ScenePoint[], progress: number): ScenePoint {
  if (!path.length) return [0, 0];
  if (path.length === 1) return path[0];
  if (progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];
  const lengths = path.slice(1).map(([x, y], index) => Math.hypot(x - path[index][0], y - path[index][1]));
  let remaining = Math.max(0, Math.min(1, progress)) * lengths.reduce((sum, length) => sum + length, 0);
  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= lengths[index] || index === lengths.length - 1) {
      const fraction = lengths[index] ? remaining / lengths[index] : 0;
      return [path[index][0] + (path[index + 1][0] - path[index][0]) * fraction,
        path[index][1] + (path[index + 1][1] - path[index][1]) * fraction];
    }
    remaining -= lengths[index];
  }
  return path[path.length - 1];
}

export function sampleTraffic(seconds: number, index: number) {
  const car = TRAFFIC[((index % TRAFFIC.length) + TRAFFIC.length) % TRAFFIC.length];
  const cycle = ((seconds / car.duration + car.offset) % 1 + 1) % 1;
  const travel = car.direction === 1 ? cycle : 1 - cycle;
  const [x, y] = samplePath(BRIDGE_PATH, travel);
  return {
    x, y: y + car.direction * .0013,
    direction: car.direction,
    opacity: Math.min(1, cycle * 9, (1 - cycle) * 9),
  };
}

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** Occupied rooms hold their light, then fade over 11–19 seconds independently.
 * A much smaller fluctuation adds life while avoiding a synchronized sine pulse. */
export function windowGlow(seconds: number, index: number): number {
  const period = 68 + (index % 7) * 7.3 + (index % 3) * 3.7;
  const cycle = ((seconds / period + index * .381966) % 1 + 1) % 1;
  const occupied = smooth((cycle - .08) / .16) * smooth((.88 - cycle) / .16);
  const shimmer = .965 + .035 * Math.sin(seconds * .21 + index * 2.399963);
  return .08 + .62 * occupied * shimmer;
}

// Registered on the unchanged river channels of the seasonal plates, away from
// bridge piers and near-bank buildings. Furniture masks erase foreground overlap.
export const RIVER_COLUMNS = [
  [.277, .323, .352], [.311, .324, .360], [.373, .332, .367],
  [.424, .338, .388], [.486, .340, .389], [.536, .347, .381],
  [.782, .417, .504], [.809, .406, .495], [.838, .401, .475], [.867, .402, .454],
] as const;
export const RIVER_RIPPLES_PER_COLUMN = 7;

/** Glints move with a slow current and fade before wrapping within open water. */
export function sampleRiverRipple(seconds: number, index: number, ripple: number) {
  const [column, top, bottom] = RIVER_COLUMNS[index];
  const phase = index * 3.73 + ripple * 1.61;
  const progress = ((seconds / (24 + index * 1.3) + ripple / RIVER_RIPPLES_PER_COLUMN + index * .137) % 1 + 1) % 1;
  const wave = .5 + .5 * Math.sin(seconds * .73 + phase);
  return {
    x: column + (progress - .5) * .0028 + Math.sin(seconds * .23 + phase) * .0008,
    y: top + (bottom - top) * progress,
    halfWidth: 1.4 + progress * 3.1 + wave * 1.5,
    opacity: smooth(progress / .16) * smooth((1 - progress) / .18) * (.10 + wave * .20),
  };
}

export function cityVisibility(time: string, weather: string): number {
  const light = time === 'night' ? 1 : time === 'evening' ? .8 : time === 'morning' ? .11 : .045;
  const haze = weather === 'mist' ? .26 : weather === 'rain' ? .64 : weather === 'snow' ? .67 : weather === 'cloudy' ? .82 : 1;
  return light * haze;
}
