/**
 * Runtime facade for the six photo-inspired motions: the single module the pet
 * controller imports. It wires the lazy atomic loader to the controller's sprite layer,
 * tracks the latest pending request (so a stale load can never start a dead context),
 * and gates the rare autonomous variations behind per-kind and global cooldowns so the
 * motions stay occasional accents, never a new perpetual state machine.
 */
import {
  MILKY_PHOTO_FRAMES, MILKY_PHOTO_FRAME_NAMES, milkyPhotoTranslate,
  type MilkyPhotoFrameName, type MilkyPhotoMotion,
} from './cyber-pet-photo-art.ts';
import { createMilkyPhotoLoader, type MilkyPhotoGroupState } from './cyber-pet-photo-loader.ts';
import { planMilkyPhotoRise, type MilkyPhotoRestContext, type MilkyPhotoRisePlan } from './cyber-pet-photo-plan.ts';
import type { MilkyRandom } from './cyber-pet-roam.ts';

export type { MilkyPhotoFrameName, MilkyPhotoMotion } from './cyber-pet-photo-art.ts';
export { MILKY_BED_RIM_FRACTION, MILKY_PHOTO_FRAMES, MILKY_PHOTO_GROUPS, MILKY_PHOTO_KINDS } from './cyber-pet-photo-art.ts';
export { milkyChinRimTranslation, MILKY_CHIN_MAX_OFFSET } from './cyber-pet-photo-geometry.ts';
export type { MilkyPhotoGroupState } from './cyber-pet-photo-loader.ts';
export {
  planMilkyTilt, planMilkyPant, planMilkyPawsRest, planMilkySleepyPeek,
  planMilkyChinRest, planMilkyBellyUp, planMilkyStandBridge,
  type MilkyPhotoRestContext, type MilkyPhotoStep, type MilkyPhotoStepPose,
} from './cyber-pet-photo-plan.ts';

/** Opt-in flag for the photo-motion runtime; archived rooms simply omit it. */
export interface CyberPetPhotoOptions { readonly photoMotions: true }

export interface MilkyPhotoRuntimeHost {
  /** Creates the frame's image element inside the pet figure (class cyber-pet-photo). */
  readonly createImage: (frame: MilkyPhotoFrameName) => HTMLImageElement;
  /** Applies the native-pixel registration translation onto the shared floor point. */
  readonly register: (image: HTMLImageElement, translate: readonly [number, number]) => void;
  readonly validRatio: (image: HTMLImageElement) => boolean;
  readonly signal: AbortSignal;
  readonly onGroupSettled: (kind: MilkyPhotoMotion, ready: boolean) => void;
}

export interface MilkyPhotoRuntime {
  readonly state: (kind: MilkyPhotoMotion) => MilkyPhotoGroupState;
  readonly ensure: (kind: MilkyPhotoMotion) => MilkyPhotoGroupState;
  readonly setIntent: (kind: MilkyPhotoMotion) => void;
  readonly clearIntent: () => void;
  /** Consumes the pending intent when it matches; only the latest request can start. */
  readonly takeIntent: (kind: MilkyPhotoMotion) => boolean;
  readonly isPhotoPose: (pose: string) => boolean;
  readonly isLyingPose: (pose: string) => boolean;
  /** The authored reverse exit for an interrupted photo pose, using decoded rest art. */
  readonly riseSteps: (pose: string, rest: MilkyPhotoRestContext, random?: MilkyRandom) => MilkyPhotoRisePlan;
  /** Rarity and cooldown gate for autonomous variations; never triggers a load itself. */
  readonly wantsAutonomous: (kind: MilkyPhotoMotion, now: number, random?: MilkyRandom) => boolean;
  readonly markPerformed: (kind: MilkyPhotoMotion, now: number) => void;
  /** Re-registers the chin frames with the extra rim-contact correction, native pixels. */
  readonly applyChinOffset: (offset: readonly [number, number]) => void;
  /** Art demotion or destroy: pending loads and intents can never surface again. */
  readonly disable: () => void;
}

/** Rare-by-design: a photo motion repeats only after its own and a shared quiet spell. */
const PHOTO_COOLDOWN_MS: Record<MilkyPhotoMotion, number> = {
  tilt: 70_000, pant: 50_000, 'paws-rest': 150_000,
  'sleepy-peek': 120_000, 'chin-rest': 180_000, 'belly-up': 240_000,
};
const PHOTO_RARITY: Record<MilkyPhotoMotion, number> = {
  tilt: .18, pant: .4, 'paws-rest': .08, 'sleepy-peek': .22, 'chin-rest': .1, 'belly-up': .05,
};
const GLOBAL_COOLDOWN_MS = 30_000;
const CHIN_FRAMES: readonly MilkyPhotoFrameName[] = ['chin-lower', 'chin-rest'];

export function createMilkyPhotoRuntime(host: MilkyPhotoRuntimeHost): MilkyPhotoRuntime {
  const loader = createMilkyPhotoLoader({
    createImage(frame) {
      const image = host.createImage(frame);
      host.register(image, milkyPhotoTranslate(frame));
      return image;
    },
    validRatio: host.validRatio,
    signal: host.signal,
    onGroupSettled: host.onGroupSettled,
  });
  let intent: MilkyPhotoMotion | undefined;
  let lastAny: number | undefined;
  const lastKind = new Map<MilkyPhotoMotion, number>();
  const frameOf = (pose: string) => MILKY_PHOTO_FRAME_NAMES.find((name) => name === pose);
  return {
    state: loader.state,
    ensure: loader.ensure,
    setIntent(kind) { intent = kind; },
    clearIntent() { intent = undefined; },
    takeIntent(kind) {
      if (intent !== kind) return false;
      intent = undefined;
      return true;
    },
    isPhotoPose: (pose) => frameOf(pose) !== undefined,
    isLyingPose(pose) {
      const frame = frameOf(pose);
      return frame !== undefined && MILKY_PHOTO_FRAMES[frame].lying;
    },
    riseSteps: (pose, rest, random = Math.random) => planMilkyPhotoRise(pose, rest, random),
    wantsAutonomous(kind, now, random = Math.random) {
      if (lastAny !== undefined && now - lastAny < GLOBAL_COOLDOWN_MS) return false;
      const last = lastKind.get(kind);
      if (last !== undefined && now - last < PHOTO_COOLDOWN_MS[kind]) return false;
      return random() < PHOTO_RARITY[kind];
    },
    markPerformed(kind, now) {
      lastAny = now;
      lastKind.set(kind, now);
    },
    applyChinOffset(offset) {
      for (const frame of CHIN_FRAMES) {
        const image = loader.image(frame);
        if (!image) continue;
        const [baseX, baseY] = milkyPhotoTranslate(frame);
        host.register(image, [baseX + offset[0], baseY + offset[1]]);
      }
    },
    disable() {
      intent = undefined;
      loader.disable();
    },
  };
}
