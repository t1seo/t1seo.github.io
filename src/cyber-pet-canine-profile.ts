import { CANINE_FORE, CANINE_HIND, CANINE_SWING_FORE, CANINE_SWING_HIND } from './cyber-pet-canine-data.ts';

const swingPeaks = { fore: Math.max(...CANINE_SWING_FORE), hind: Math.max(...CANINE_SWING_HIND) };
export const canineSwingPeak = (kind: 'fore' | 'hind'): number => swingPeaks[kind];

/** Measured toe clearance in trunk lengths; velocity is per unit swing phase. */
export function canineSwing(kind: 'fore' | 'hind', phase: number): { height: number; velocity: number } {
  if (phase <= 0 || phase >= 1) return { height: 0, velocity: 0 };
  const data = kind === 'fore' ? CANINE_SWING_FORE : CANINE_SWING_HIND;
  const count = data.length - 1, t = phase * count, i = Math.floor(t), u = t - i;
  const at = (index: number) => data[Math.max(0, Math.min(count, index))];
  const a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2);
  const p = c - a, q = 2 * a - 5 * b + 4 * c - d, r = 3 * (b - c) + d - a;
  const height = b + .5 * u * (p + u * (q + u * r));
  if (height <= 0) return { height: 0, velocity: 0 };
  // Ease only the contact ends, preserving the measured early forepaw peak and
  // late hindpaw peak. Zero contact velocity permits exact world-space planting.
  const edge = .125, x = Math.min(1, phase / edge, (1 - phase) / edge);
  const envelope = x * x * x * (10 + x * (-15 + 6 * x));
  const direction = phase < edge ? 1 : phase > 1 - edge ? -1 : 0;
  const derivative = 30 * x * x * (1 - x) ** 2 * direction / edge;
  return { height: height * envelope, velocity: .5 * (p + 2 * u * q + 3 * u * u * r) * count * envelope + height * derivative };
}

/** Periodic, velocity-continuous sampling of the measured canine cycle. */
export function canineProfile(kind: 'fore' | 'hind', phase: number, channel: number): number {
  const data = kind === 'fore' ? CANINE_FORE : CANINE_HIND;
  const count = data.length - 1, t = ((phase % 1) + 1) % 1 * count;
  const i = Math.floor(t), u = t - i;
  const at = (index: number) => data[(index + count) % count][channel];
  const a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2);
  return b + .5 * u * (c - a + u * (2 * a - 5 * b + 4 * c - d + u * (3 * (b - c) + d - a)));
}
