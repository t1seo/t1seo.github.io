import type { MilkyRandom } from './cyber-pet-roam.ts';

/**
 * Quiet idle life between walks: blinks, a happy glance up at the viewer, a floor sniff.
 * Every moment swaps to one independently drawn raster pose and back — no CSS deformation,
 * no crossfade between different dogs. Each pose is optional art; a missing file simply
 * removes its moments from the plan.
 */
export interface MilkyIdleMoment {
  kind: 'blink' | 'attend' | 'sniff';
  /** ms of continued stillness before the pose begins. */
  delay: number;
  /** ms the pose is held before returning to the idle photo. */
  hold: number;
  /** A quick second blink follows after a short gap. */
  repeat: boolean;
}

export interface MilkyPoseAvailability { blink: boolean; attend: boolean; sniff: boolean }

const unit = (random: MilkyRandom) => Math.max(0, Math.min(0.999999, random()));

/** Gap of stillness between the two blinks of a double blink. */
export const MILKY_BLINK_GAP = 110;

export function planMilkyIdleMoment(
  poses: MilkyPoseAvailability,
  random: MilkyRandom = Math.random,
): MilkyIdleMoment | undefined {
  const options: { kind: MilkyIdleMoment['kind']; weight: number; hold: () => number; repeat: () => boolean }[] = [];
  if (poses.blink) options.push({ kind: 'blink', weight: .66, hold: () => 120 + unit(random) * 60, repeat: () => unit(random) < .24 });
  if (poses.attend) options.push({ kind: 'attend', weight: .17, hold: () => 900 + unit(random) * 700, repeat: () => false });
  if (poses.sniff) options.push({ kind: 'sniff', weight: .17, hold: () => 700 + unit(random) * 700, repeat: () => false });
  if (options.length === 0) return undefined;
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let pick = unit(random) * total;
  let chosen = options[options.length - 1];
  for (const option of options) {
    pick -= option.weight;
    if (pick <= 0) { chosen = option; break; }
  }
  return { kind: chosen.kind, delay: 2600 + unit(random) * 5600, hold: chosen.hold(), repeat: chosen.repeat() };
}

/** A short nose-down moment of anticipation before a quiet wander steps off. */
export function milkySniffHold(random: MilkyRandom = Math.random): number {
  return 520 + unit(random) * 420;
}

/** How long the happy look-up toward the viewer is held before a greeting walk. */
export function milkyGreetHold(random: MilkyRandom = Math.random): number {
  return 360 + unit(random) * 160;
}
