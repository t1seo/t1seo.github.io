import type { MilkyRandom } from './cyber-pet-roam.ts';

/**
 * Calm rest planning between walks: sitting, lying drowsy, napping. Every stage is one
 * independently drawn raster pose held at a fixed floor point; the plan never asks for
 * movement, crossfades or body deformation. A pose whose art is missing simply drops out
 * of the plan, so the rest cycle degrades gracefully around whatever actually shipped.
 */
export type MilkyRestPoseName = 'sit' | 'drowsy' | 'sleep' | 'sitdown' | 'wake';
export interface MilkyRestStage { pose: 'sit' | 'drowsy' | 'sleep'; hold: number }
export interface MilkyRestAvailability { sit: boolean; drowsy: boolean; sleep: boolean }

const unit = (random: MilkyRandom) => Math.max(0, Math.min(0.999999, random()));

/**
 * One quiet cycle's plan, decided when a rest pause elapses; [] means wander instead.
 * Weighted so a watching user naturally sees sitting within the first minute or so and a
 * nap within a couple of minutes, without turning Milky into a constant state machine.
 */
export function planMilkyRestCycle(
  poses: MilkyRestAvailability,
  random: MilkyRandom = Math.random,
): MilkyRestStage[] {
  const stages: MilkyRestStage[] = [];
  if (poses.sit && unit(random) < .5) stages.push({ pose: 'sit', hold: 7000 + unit(random) * 8000 });
  // A dog can also flop straight down without a formal sit first.
  const lieChance = stages.length > 0 ? .65 : poses.sit ? .15 : .5;
  if (poses.drowsy && unit(random) < lieChance) stages.push({ pose: 'drowsy', hold: 6000 + unit(random) * 8000 });
  const last = stages.at(-1)?.pose;
  const napChance = last === 'drowsy' ? .75 : last === 'sit' ? .35 : .15;
  if (poses.sleep && unit(random) < napChance) stages.push({ pose: 'sleep', hold: 14000 + unit(random) * 16000 });
  return stages;
}

/** Hold for a delivered transitional pose bridging two held postures. */
export function milkyRestTransitionHold(kind: 'sitdown' | 'wake', random: MilkyRandom = Math.random): number {
  return kind === 'sitdown' ? 320 + unit(random) * 160 : 460 + unit(random) * 220;
}

/** A still beat on all fours after waking or standing, before anything else happens. */
export function milkyStandHold(random: MilkyRandom = Math.random): number {
  return 180 + unit(random) * 160;
}

/** How long an explicitly requested posture is kept before Milky quietly stands again. */
export function milkyExplicitRestHold(kind: 'sit' | 'drowsy' | 'sleep', random: MilkyRandom = Math.random): number {
  if (kind === 'sleep') return 22000 + unit(random) * 16000;
  if (kind === 'drowsy') return 12000 + unit(random) * 8000;
  return 16000 + unit(random) * 12000;
}
