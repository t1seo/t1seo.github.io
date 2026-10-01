/**
 * Chin-to-rim contact math for the 'chin-rest' photo motion. The chin frames are drawn
 * on the common body registration; a small whole-frame translation (the only honest
 * lever for raster art) moves the measured chin landmark onto the actual bed rim's
 * screen point. Beyond a bounded correction the contact is not achievable, and the
 * motion must be refused rather than faked.
 */
import type { MilkyPoint } from './cyber-pet-geometry.ts';

/**
 * Largest acceptable whole-frame correction in native (1536×1024) pixels. Provisional
 * calibration constant; root tunes it against the measured art and real bed rim.
 */
export const MILKY_CHIN_MAX_OFFSET = 140;

export interface MilkyChinRimInput {
  /** Measured chin landmark of the resting frame, logical 1536×1024 space. */
  readonly chinPoint: readonly [number, number];
  /** Measured support anchor of the same frame (maps onto the dog's floor point). */
  readonly supportAnchor: readonly [number, number];
  /** The dog's support point in room pixels (position × room size). */
  readonly dogScreen: Readonly<MilkyPoint>;
  /** The bed rim contact target in the same room pixels. */
  readonly rimScreen: Readonly<MilkyPoint>;
  /** Room pixels per native pixel: buttonWidth × depth × artScale / 1536. */
  readonly pixelsPerNative: number;
  readonly facing: 1 | -1;
}

/**
 * The extra native-pixel translation that puts the chin landmark on the rim target, or
 * undefined when the required correction exceeds {@link MILKY_CHIN_MAX_OFFSET} — in that
 * case chin contact is not honestly achievable and 'chin-rest' must stay unavailable.
 */
export function milkyChinRimTranslation(input: MilkyChinRimInput): readonly [number, number] | undefined {
  if (!(input.pixelsPerNative > 0)) return undefined;
  const chinScreenX = input.dogScreen.x
    + input.facing * (input.chinPoint[0] - input.supportAnchor[0]) * input.pixelsPerNative;
  const chinScreenY = input.dogScreen.y
    + (input.chinPoint[1] - input.supportAnchor[1]) * input.pixelsPerNative;
  const dx = input.facing * (input.rimScreen.x - chinScreenX) / input.pixelsPerNative;
  const dy = (input.rimScreen.y - chinScreenY) / input.pixelsPerNative;
  if (Math.abs(dx) > MILKY_CHIN_MAX_OFFSET || Math.abs(dy) > MILKY_CHIN_MAX_OFFSET) return undefined;
  return [dx, dy];
}
