import type { MilkyPoint } from './cyber-pet-geometry.ts';

export interface MilkyBedHop {
  readonly origin: Readonly<MilkyPoint>;
  readonly target: Readonly<MilkyPoint>;
  readonly height: number;
}

export interface MilkyBedHopSample {
  readonly stage: 'anticipation' | 'flight' | 'landing' | 'done';
  readonly position: Readonly<MilkyPoint>;
  readonly lift: number;
  readonly frame: 0 | 1 | 2 | 3;
  readonly shadowScale: number;
  readonly shadowOpacity: number;
}

const PREPARATION = 180;
const FLIGHT = 480;
const LANDING = 160;

export function sampleMilkyBedHop(plan: MilkyBedHop, elapsed: number): MilkyBedHopSample {
  const progress = Math.max(0, Math.min(1, (elapsed - PREPARATION) / FLIGHT));
  const arc = 4 * progress * (1 - progress);
  const stage = elapsed < PREPARATION ? 'anticipation'
    : elapsed < PREPARATION + FLIGHT ? 'flight'
      : elapsed < PREPARATION + FLIGHT + LANDING ? 'landing' : 'done';
  return {
    stage,
    position: {
      x: plan.origin.x + (plan.target.x - plan.origin.x) * progress,
      y: plan.origin.y + (plan.target.y - plan.origin.y) * progress,
    },
    lift: plan.height * arc,
    frame: progress < .1 ? 0 : progress < .55 ? 1 : progress < .92 ? 3 : 2,
    shadowScale: 1 - .16 * arc,
    shadowOpacity: 1 - .28 * arc,
  };
}
