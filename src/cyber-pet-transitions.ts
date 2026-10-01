import type { MilkyRandom } from './cyber-pet-roam.ts';

export interface MilkyWalkArrivalOptions {
  readonly enabled: boolean;
  readonly reducedMotion: boolean;
  readonly cameraIdleReady: boolean;
  readonly attendShipped: boolean;
  readonly attendReady: boolean;
}

export interface MilkyWalkArrival {
  readonly pose: 'idle' | 'attend';
  readonly gaze: 'camera';
  readonly hold: number;
}

export interface MilkyBedWakeOptions {
  readonly enabled: boolean;
  readonly onBed: boolean;
  readonly fromSleep: boolean;
  readonly playBowReady: boolean;
  readonly reducedMotion: boolean;
}

export interface MilkyBedWakeStretch {
  readonly pose: 'play-bow';
  readonly motion: 'stretching';
  readonly hold: number;
}

const unit = (random: MilkyRandom): number => Math.max(0, Math.min(1, random()));

export function planMilkyWalkArrival(
  options: MilkyWalkArrivalOptions,
  random: MilkyRandom = Math.random,
): MilkyWalkArrival | undefined {
  if (!options.enabled || options.reducedMotion || !options.cameraIdleReady) return undefined;
  return {
    pose: options.attendShipped && options.attendReady ? 'attend' : 'idle',
    gaze: 'camera',
    hold: 240 + unit(random) * 180,
  };
}

export function planMilkyBedWakeStretch(
  options: MilkyBedWakeOptions,
  random: MilkyRandom = Math.random,
): MilkyBedWakeStretch | undefined {
  if (!options.enabled || !options.onBed || !options.fromSleep
    || !options.playBowReady || options.reducedMotion) return undefined;
  return { pose: 'play-bow', motion: 'stretching', hold: 420 + unit(random) * 200 };
}
