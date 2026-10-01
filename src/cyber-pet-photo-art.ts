/**
 * Static art contract for the six photo-inspired Milky motions (album photos 10, 12, 17,
 * 20, 21, 22, 26). Every frame is an independent transparent WebP exported at 768×512
 * (logical 1536×1024) at the common v4 .847 scale, served from its own directory and
 * requested lazily — never at mount. Each frame's measured support anchor translates onto
 * the shared v4 floor point (795, 970) exactly like the delivered rest/activity sets, so
 * head and body proportions are NEVER normalized or rescaled per frame.
 *
 * FINAL REGISTRATION: the anchors below are root's approved body-registration offsets
 * for the delivered art (supportAnchor = [795 − dx, 970 − dy], same convention as
 * REST_TRANSLATE: translate = common − measured). The chin landmark and bed rim fraction
 * come from the same measurement pass (canonical 1672×941 scene, sleep anchor 1440/865,
 * bed 1310/788/260×142, depth .9742): the runtime rim correction is ~0 there and only
 * absorbs non-canonical layouts. Root still validates the shipped composites.
 */
import type { MilkyPoint } from './cyber-pet-geometry.ts';

export type MilkyPhotoMotion = 'tilt' | 'chin-rest' | 'sleepy-peek' | 'paws-rest' | 'belly-up' | 'pant';

export const MILKY_PHOTO_KINDS: readonly MilkyPhotoMotion[] =
  ['tilt', 'chin-rest', 'sleepy-peek', 'paws-rest', 'belly-up', 'pant'];

export type MilkyPhotoFrameName =
  | 'tilt-near' | 'tilt-full'
  | 'pant-soft' | 'pant-open'
  | 'paws-lower' | 'paws-rest'
  | 'peek-low' | 'peek-up' | 'peek-blink'
  | 'chin-lower' | 'chin-rest'
  | 'roll-side' | 'roll-half' | 'belly-up' | 'belly-relaxed';

export interface MilkyPhotoFrame {
  /** File name under {@link MILKY_PHOTO_PREFIX}; one independent file per frame. */
  readonly file: string;
  /**
   * Logical-space (1536×1024) approved body-registration anchor that lands on the
   * shared floor point (795, 970) — NOT a raw silhouette footprint.
   */
  readonly supportAnchor: readonly [number, number];
  /**
   * Logical-space chin landmark for the frame whose chin meets the actual bed rim.
   * Only the final contact frame carries one.
   */
  readonly chinPoint?: readonly [number, number];
  /** Lying silhouettes must rise through their authored frames before any walk. */
  readonly lying: boolean;
}

export const MILKY_PHOTO_PREFIX = '/assets/cyberpunk/milky-photo-motions/';
/** The shared v4 floor registration point every measured support anchor maps onto. */
export const MILKY_PHOTO_COMMON_ANCHOR: readonly [number, number] = [795, 970];

const anchor = MILKY_PHOTO_COMMON_ANCHOR;
export const MILKY_PHOTO_FRAMES = {
  'tilt-near': { file: 'tilt-near.webp', supportAnchor: anchor, lying: false },
  'tilt-full': { file: 'tilt-full.webp', supportAnchor: anchor, lying: false },
  'pant-soft': { file: 'pant-soft.webp', supportAnchor: anchor, lying: false },
  'pant-open': { file: 'pant-open.webp', supportAnchor: anchor, lying: false },
  'paws-lower': { file: 'paws-lower.webp', supportAnchor: [932, 950], lying: true },
  'paws-rest': { file: 'paws-rest.webp', supportAnchor: [932, 949], lying: true },
  'peek-low': { file: 'peek-low.webp', supportAnchor: [904, 900], lying: true },
  'peek-up': { file: 'peek-up.webp', supportAnchor: [900, 913], lying: true },
  'peek-blink': { file: 'peek-blink.webp', supportAnchor: [900, 914], lying: true },
  'chin-lower': { file: 'chin-lower.webp', supportAnchor: [898, 730], lying: true },
  'chin-rest': { file: 'chin-rest.webp', supportAnchor: [898, 730], chinPoint: [1138, 872], lying: true },
  'roll-side': { file: 'roll-side.webp', supportAnchor: [898, 820], lying: true },
  'roll-half': { file: 'roll-half.webp', supportAnchor: [898, 821], lying: true },
  'belly-up': { file: 'belly-up.webp', supportAnchor: [898, 831], lying: true },
  'belly-relaxed': { file: 'belly-relaxed.webp', supportAnchor: [898, 831], lying: true },
} as const satisfies Record<MilkyPhotoFrameName, MilkyPhotoFrame>;

export const MILKY_PHOTO_FRAME_NAMES: readonly MilkyPhotoFrameName[] = [
  'tilt-near', 'tilt-full', 'pant-soft', 'pant-open', 'paws-lower', 'paws-rest',
  'peek-low', 'peek-up', 'peek-blink', 'chin-lower', 'chin-rest',
  'roll-side', 'roll-half', 'belly-up', 'belly-relaxed',
];

/** Frames per motion; a group decodes atomically or the whole motion stays unavailable. */
export const MILKY_PHOTO_GROUPS: Record<MilkyPhotoMotion, readonly MilkyPhotoFrameName[]> = {
  tilt: ['tilt-near', 'tilt-full'],
  'chin-rest': ['chin-lower', 'chin-rest'],
  'sleepy-peek': ['peek-low', 'peek-up', 'peek-blink'],
  'paws-rest': ['paws-lower', 'paws-rest'],
  'belly-up': ['roll-side', 'roll-half', 'belly-up', 'belly-relaxed'],
  pant: ['pant-soft', 'pant-open'],
};

/**
 * Where the chin meets the bed, as a fraction of the actual bed element's box — measured
 * from the delivered art (world chin [1465.8684, 880.3055] on the canonical 260×142 bed
 * at 1310/788, ~.48px above the front lip boundary 880.7853). The runtime recomputes the
 * screen point each visit, so the bed sprite is never baked into the dog.
 */
export const MILKY_BED_RIM_FRACTION: Readonly<MilkyPoint> = { x: .599493735, y: .650038400 };

/** Per-frame registration translation onto the shared floor point, native pixels. */
export const milkyPhotoTranslate = (frame: MilkyPhotoFrameName): readonly [number, number] => {
  const [measuredX, measuredY] = MILKY_PHOTO_FRAMES[frame].supportAnchor;
  return [MILKY_PHOTO_COMMON_ANCHOR[0] - measuredX, MILKY_PHOTO_COMMON_ANCHOR[1] - measuredY];
};
