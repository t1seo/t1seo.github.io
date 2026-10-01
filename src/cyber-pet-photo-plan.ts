/**
 * Pure sequencing for the six photo-inspired motions. Every plan is a list of held
 * raster postures at human-ease timings — authored intermediate frames, never
 * crossfades, ghosting, or whole-body scale/rotate fakery. Only actually decoded rest
 * art bridges into and out of the new frames: with the currently shipped set (sit,
 * drowsy, sleep) a prone body stands through drowsy → sit, and the optional wake /
 * sitdown transitionals take over automatically once root ships them. An interrupted
 * pose always finishes its authored reverse exit before anything else may happen.
 */
import type { MilkyRandom } from './cyber-pet-roam.ts';
import { MILKY_PHOTO_FRAMES, MILKY_PHOTO_FRAME_NAMES, type MilkyPhotoFrameName } from './cyber-pet-photo-art.ts';

export type MilkyPhotoStepPose = MilkyPhotoFrameName | 'sit' | 'drowsy' | 'sleep' | 'wake';
export interface MilkyPhotoStep {
  readonly pose: MilkyPhotoStepPose;
  readonly hold: number;
  readonly motion: string;
}
/** Which of the optional rest poses are actually decoded right now. */
export interface MilkyPhotoRestContext {
  readonly sit: boolean;
  readonly drowsy: boolean;
  readonly sleep: boolean;
  readonly wake: boolean;
}
export interface MilkyPhotoRisePlan {
  readonly steps: readonly MilkyPhotoStep[];
  /** True when the pose is a prone/lying silhouette (its exit ends in a real stand-up). */
  readonly fromProne: boolean;
}

const unit = (random: MilkyRandom) => Math.max(0, Math.min(0.999999, random()));
const step = (pose: MilkyPhotoStepPose, hold: number, motion: string): MilkyPhotoStep => ({ pose, hold, motion });

/**
 * How a lying body gets back onto four paws with whatever rest art actually shipped:
 * the delivered wake transitional when available, otherwise up through drowsy and sit
 * before the standing beat — never a straight cut from prone to idle.
 */
export function planMilkyStandBridge(
  lastPose: MilkyPhotoStepPose, rest: MilkyPhotoRestContext, random: MilkyRandom = Math.random,
): MilkyPhotoStep[] {
  if (rest.wake) return [step('wake', 460 + unit(random) * 220, 'waking')];
  const steps: MilkyPhotoStep[] = [];
  if (rest.drowsy && lastPose !== 'drowsy') steps.push(step('drowsy', 330 + unit(random) * 130, 'waking'));
  if (rest.sit && lastPose !== 'sit') steps.push(step('sit', 300 + unit(random) * 130, 'waking'));
  return steps;
}

/** Photo 17: a small head tilt toward the viewer, a fuller tilt, then a natural return. */
export function planMilkyTilt(random: MilkyRandom = Math.random): MilkyPhotoStep[] {
  return [
    step('tilt-near', 420 + unit(random) * 160, 'tilting'),
    step('tilt-full', 1050 + unit(random) * 520, 'tilting'),
    step('tilt-near', 320 + unit(random) * 140, 'tilting'),
  ];
}

/** Photo 20: a gentle bounded two-frame jaw/tongue rhythm — no cartoon body heave. */
export function planMilkyPant(random: MilkyRandom = Math.random): MilkyPhotoStep[] {
  const cycles = 3 + (unit(random) < .5 ? 0 : 1);
  const steps: MilkyPhotoStep[] = [];
  for (let cycle = 0; cycle < cycles; cycle++) {
    steps.push(step('pant-soft', 390 + unit(random) * 90, 'panting'));
    steps.push(step('pant-open', 440 + unit(random) * 90, 'panting'));
  }
  steps.push(step('pant-soft', 480 + unit(random) * 140, 'panting'));
  return steps;
}

/** Photo 22: sit, a controlled chest descent, a front-paws-stretched rest, and the rise. */
export function planMilkyPawsRest(rest: MilkyPhotoRestContext, random: MilkyRandom = Math.random): MilkyPhotoStep[] {
  const steps: MilkyPhotoStep[] = [];
  if (rest.sit) steps.push(step('sit', 640 + unit(random) * 260, 'resting'));
  steps.push(step('paws-lower', 500 + unit(random) * 150, 'resting'));
  steps.push(step('paws-rest', 6500 + unit(random) * 4500, 'resting'));
  steps.push(step('paws-lower', 440 + unit(random) * 130, 'resting'));
  if (rest.sit) steps.push(step('sit', 420 + unit(random) * 160, 'resting'));
  return steps;
}

export interface MilkyPeekOptions extends MilkyPhotoRestContext {
  /** True when Milky is awake on the floor and must settle into sleep first. */
  readonly descend: boolean;
}

/**
 * Photos 10/17: asleep, a half-lifted head, a gentle peek and blink, back to sleep.
 * The plan ends asleep; the caller appends a stand bridge only when the moment should
 * actually end the rest (an explicit request), not when it decorates an ongoing nap.
 */
export function planMilkySleepyPeek(options: MilkyPeekOptions, random: MilkyRandom = Math.random): MilkyPhotoStep[] {
  const steps: MilkyPhotoStep[] = [];
  if (options.descend) {
    if (options.sit) steps.push(step('sit', 600 + unit(random) * 240, 'resting'));
    if (options.drowsy) steps.push(step('drowsy', 560 + unit(random) * 220, 'resting'));
    steps.push(step('sleep', 850 + unit(random) * 320, 'sleeping'));
  }
  steps.push(step('peek-low', 560 + unit(random) * 180, 'peeking'));
  steps.push(step('peek-up', 820 + unit(random) * 380, 'peeking'));
  steps.push(step('peek-blink', 170 + unit(random) * 60, 'peeking'));
  steps.push(step('peek-up', 560 + unit(random) * 240, 'peeking'));
  steps.push(step('peek-low', 500 + unit(random) * 180, 'peeking'));
  steps.push(step('sleep', 2600 + unit(random) * 2200, 'sleeping'));
  return steps;
}

/** Photo 26: settle onto the cushion, lower the head onto the actual rim, rest, raise. */
export function planMilkyChinRest(rest: MilkyPhotoRestContext, random: MilkyRandom = Math.random): MilkyPhotoStep[] {
  const steps: MilkyPhotoStep[] = [];
  if (rest.sit) steps.push(step('sit', 380 + unit(random) * 150, 'resting'));
  if (rest.drowsy) steps.push(step('drowsy', 500 + unit(random) * 200, 'resting'));
  steps.push(step('chin-lower', 540 + unit(random) * 180, 'resting'));
  steps.push(step('chin-rest', 6000 + unit(random) * 4000, 'resting'));
  steps.push(step('chin-lower', 440 + unit(random) * 160, 'resting'));
  if (rest.drowsy) steps.push(step('drowsy', 420 + unit(random) * 160, 'resting'));
  return steps;
}

// The roll itself is continuous motion between authored keys: transitional holds stay
// in the 140–220ms band with an eased cadence (quickest through the half roll), while
// the settled prone and relaxed holds remain long pauses.
const ROLL_SIDE_HOLD = (random: MilkyRandom) => 160 + unit(random) * 50;
const ROLL_HALF_HOLD = (random: MilkyRandom) => 140 + unit(random) * 40;
const ROLL_BACK_HOLD = (random: MilkyRandom) => 175 + unit(random) * 45;

/** Photos 12/21: prone → side → half roll → back with bent paws → relaxed, then reverse. */
export function planMilkyBellyUp(rest: MilkyPhotoRestContext, random: MilkyRandom = Math.random): MilkyPhotoStep[] {
  const steps: MilkyPhotoStep[] = [];
  if (rest.sit) steps.push(step('sit', 360 + unit(random) * 150, 'resting'));
  if (rest.drowsy) steps.push(step('drowsy', 460 + unit(random) * 190, 'resting'));
  steps.push(step('sleep', 800 + unit(random) * 300, 'sleeping'));
  steps.push(step('roll-side', ROLL_SIDE_HOLD(random), 'rolling'));
  steps.push(step('roll-half', ROLL_HALF_HOLD(random), 'rolling'));
  steps.push(step('belly-up', ROLL_BACK_HOLD(random), 'rolling'));
  steps.push(step('belly-relaxed', 5200 + unit(random) * 4300, 'resting'));
  steps.push(step('belly-up', ROLL_BACK_HOLD(random), 'rolling'));
  steps.push(step('roll-half', ROLL_HALF_HOLD(random), 'rolling'));
  steps.push(step('roll-side', ROLL_SIDE_HOLD(random), 'rolling'));
  steps.push(step('sleep', 1050 + unit(random) * 360, 'sleeping'));
  return steps;
}

type MilkyPhotoFamily = 'paws' | 'peek' | 'chin' | 'belly' | 'standing';
const FRAME_FAMILY: Record<MilkyPhotoFrameName, MilkyPhotoFamily> = {
  'tilt-near': 'standing', 'tilt-full': 'standing', 'pant-soft': 'standing', 'pant-open': 'standing',
  'paws-lower': 'paws', 'paws-rest': 'paws',
  'peek-low': 'peek', 'peek-up': 'peek', 'peek-blink': 'peek',
  'chin-lower': 'chin', 'chin-rest': 'chin',
  'roll-side': 'belly', 'roll-half': 'belly', 'belly-up': 'belly', 'belly-relaxed': 'belly',
};
const RISE_SEQUENCES: Partial<Record<MilkyPhotoFrameName, readonly MilkyPhotoFrameName[]>> = {
  'tilt-full': ['tilt-near'],
  'pant-open': ['pant-soft'],
  'paws-rest': ['paws-lower'],
  'peek-up': ['peek-low'],
  'peek-blink': ['peek-low'],
  'chin-rest': ['chin-lower'],
  'belly-relaxed': ['belly-up', 'roll-half', 'roll-side'],
  'belly-up': ['roll-half', 'roll-side'],
  'roll-half': ['roll-side'],
};

/**
 * The full authored reverse exit for an interrupted photo pose: back through its own
 * frames, onto the prone body where one exists, and up through the shipped rest art
 * (wake when delivered, drowsy → sit otherwise). The body never slides, mirrors, or
 * cuts straight from a lying silhouette to a stand.
 */
export function planMilkyPhotoRise(
  pose: string, rest: MilkyPhotoRestContext, random: MilkyRandom = Math.random,
): MilkyPhotoRisePlan {
  const frame = MILKY_PHOTO_FRAME_NAMES.find((name) => name === pose);
  if (frame === undefined) return { steps: [], fromProne: false };
  const family = FRAME_FAMILY[frame];
  const frames = RISE_SEQUENCES[frame] ?? [];
  const steps: MilkyPhotoStep[] = frames.map((name) =>
    step(name, family === 'belly' ? ROLL_HALF_HOLD(random) + 20 : 300 + unit(random) * 140, 'waking'));
  switch (family) {
    case 'standing':
      return { steps, fromProne: false };
    case 'paws':
      if (rest.sit) steps.push(step('sit', 300 + unit(random) * 130, 'waking'));
      return { steps, fromProne: false };
    case 'peek':
    case 'belly': {
      if (rest.sleep) steps.push(step('sleep', 340 + unit(random) * 140, 'waking'));
      steps.push(...planMilkyStandBridge(steps.at(-1)?.pose ?? 'sleep', rest, random));
      return { steps, fromProne: true };
    }
    case 'chin': {
      steps.push(...planMilkyStandBridge(steps.at(-1)?.pose ?? 'chin-lower', rest, random));
      return { steps, fromProne: true };
    }
    default: {
      family satisfies never;
      return { steps: [], fromProne: false };
    }
  }
}
