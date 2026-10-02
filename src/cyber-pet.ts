import './cyber-pet.css';
import { mountGroundedWalk } from './cyber-pet-grounded-walk';
import { GROUNDED_ART } from './cyber-pet-grounded-geometry';
import { AUTHORED_STRIDE, AUTHORED_DURATION } from './cyber-pet-authored-controller';
import { placeMilky, milkyHasVisibleFloor, milkyWidthRatio, DEFAULT_MILKY_FLOOR, type MilkyPoint } from './cyber-pet-geometry';
import { createMilkyWalk, sampleMilkyWalk, milkyCanContinue, milkyDepthScale, milkyDistance, milkyStride, milkyGaitStride, milkyGaitFinishAdjustment, milkyGaitPhase, milkyGaitFrame, type MilkyWalk } from './cyber-pet-motion';
import { chooseMilkyDestination, milkyKeyboardDestination, milkyRoamPause, type MilkyHeading } from './cyber-pet-roam';
import { planMilkyIdleMoment, milkySniffHold, milkyGreetHold, MILKY_BLINK_GAP, type MilkyIdleMoment } from './cyber-pet-life';
import { planMilkyRestCycle, milkyRestTransitionHold, milkyStandHold, milkyExplicitRestHold, type MilkyRestPoseName } from './cyber-pet-rest';
import { planMilkyMeal, planMilkyPlay, planMilkyRun, milkyBallAtRest, milkyNudgeBall, stepMilkyBall, type MilkyActivityPoseName, type MilkyBallState, type MilkyBallBounds } from './cyber-pet-activity';
import { createMilkyBed, type MilkyBedOptions } from './cyber-pet-bed';
import { createMilkyToyTarget, type MilkyToyOptions } from './cyber-pet-toy';
import { mountMilkyToyDrag } from './cyber-pet-drag';
import { throwMilkyBall, predictMilkyBallRest } from './cyber-pet-throw';
import { planMilkyWalkArrival, planMilkyBedWakeStretch } from './cyber-pet-transitions';
import { sampleMilkyBedHop, type MilkyBedHop } from './cyber-pet-hop';
import {
  createMilkyPhotoRuntime, milkyChinRimTranslation, MILKY_BED_RIM_FRACTION, MILKY_PHOTO_FRAMES,
  planMilkyTilt, planMilkyPant, planMilkyPawsRest, planMilkySleepyPeek, planMilkyChinRest, planMilkyBellyUp,
  planMilkyStandBridge,
  type CyberPetPhotoOptions, type MilkyPhotoMotion, type MilkyPhotoRestContext, type MilkyPhotoStep,
} from './cyber-pet-photo';

export type { CyberPetPhotoOptions, MilkyPhotoMotion } from './cyber-pet-photo';

export type MilkyPhotoMotionEvent =
  | { readonly type: 'availability' }
  | { readonly type: 'load'; readonly kind: MilkyPhotoMotion; readonly state: 'loading' | 'ready' | 'failed' };

export interface CyberPetController {
  /** Milky notices you and chooses a small walk across the visible floor. */
  pet(): void;
  /** Milky settles onto her haunches for a while. A no-op until the sit art is decoded. */
  sit(): void;
  /** Milky lies down and naps (deepest delivered rest pose). Waking is gentle. */
  sleep(): void;
  napInBed(): boolean;
  /** Milky walks to a real bowl and eats. A no-op until the eat poses and bowl decode. */
  feed(): void;
  /** Milky bows, nudges and chases a small rolling ball. Needs the play poses and ball. */
  play(): void;
  /** A brisk trot across the floor: the distance-linked gait at a faster cadence. */
  run(): void;
  /**
   * Requests one of the six photo-inspired motions. True means the request was accepted
   * (including a first-time lazy art load that will start when it decodes); false means
   * the motion is unavailable right now. Requires the photoMotions opt-in.
   */
  photoMotion(kind: MilkyPhotoMotion): boolean;
  /**
   * Capability, geometry and animation check suitable for a controls drawer: it ignores
   * the modal-driven active flag and never issues a network request.
   */
  canPhotoMotion(kind: MilkyPhotoMotion): boolean;
  /** Readiness updates for controls that may already be open when artwork decodes. */
  subscribePhotoMotions(listener: (event: MilkyPhotoMotionEvent) => void): () => void;
  setAnimated(enabled: boolean): void;
  setActive(active: boolean): void;
  destroy(): void;
}

const ASSET_ROOT = '/assets/cyberpunk/';
// Per-version registration keeps paws at 94% of the button and the visible body width at
// ~66% of it. v3: silhouette x194..1428, ground y973 (docs/MILKY-ROAM.md). v4: final
// smile-art bounds x197..1393, ground y970, nose (1145.39, 353.34) per the delivered
// milky-v4-registration.json. The v4 step offsets are DELIBERATELY zero: the per-frame
// heads were redrawn, so nose landmarks vary (~20×7 px in 768-space) and translating whole
// bodies to align them would shift the torso and stance paws instead of fixing the heads.
// Keep the common body-space transform (docs/MILKY-FABLE-ASSET-BRIEF.md).
type MilkyArtVersion = 'v4' | 'v3';
interface MilkyArt { scale: number; x: number; y: number; stepOffsetX: number[]; stepOffsetY: readonly number[] }
const art = (centerX: number, groundY: number, scale: number, stepOffsetX: number[], stepOffsetY: readonly number[]): MilkyArt => ({
  scale,
  x: (.5 - centerX / 1536) * scale * 100,
  y: (.94 - groundY / 1024) * scale * 100,
  stepOffsetX,
  stepOffsetY,
});
// Rigid contact-height offsets in native pixels, positive down; proportions stay intact.
// Paw-window measurements improve maximum floor error from 16→6 px (v4), 19→5 (forward)
// at export size. Torso variation and foot slide remain; this does not stabilize the head.
const MILKY_ART: Record<MilkyArtVersion, MilkyArt> = {
  v4: art(795, 970, .847, [0, 0, 0, 0, 0, 0, 0, 0], [20, 14, 20, 28, 26, 14, 2, 14] as const),
  v3: art(811, 973, .82, [.49, .01, -.20, .93, 5.73, 2.15, 2.44, 2.08], [0, 0, 0, 0, 0, 0, 0, 0] as const),
};
// The forward-look walk frames are redrawn bodies with their own measured bottoms, so
// they carry their own grounding table.
const FORWARD_STEP_OFFSET_Y = [32, 20, 20, 24, 26, 16, 12, 24] as const;
const idleAsset = (version: MilkyArtVersion) => version === 'v4' ? 'milky-v4-idle.webp' : 'milky-awake.webp';
const stepAsset = (version: MilkyArtVersion, index: number) => `milky-${version}-step-${index}.webp`;
const POSE_NAMES = ['blink', 'attend', 'sniff'] as const;
export type MilkyPoseName = (typeof POSE_NAMES)[number];
/**
 * Optional micro-poses confirmed shipped by root's art delivery. Only listed files are
 * requested, so an omitted optional pose causes no 404 at all; the attend and sniff
 * behaviors stay implemented and activate once root confirms and lists those files.
 */
export const MILKY_SHIPPED_POSES: readonly MilkyPoseName[] = ['blink'];
const REST_NAMES = ['sit', 'drowsy', 'sleep', 'sitdown', 'wake'] as const;
/**
 * Rest poses confirmed shipped by root's art delivery (docs/MILKY-FABLE-REST-ASSET-BRIEF.md).
 * Only listed files are requested. Archived rooms retain their original three-pose
 * set; the active photo-motion room explicitly opts into the authored bridges.
 */
export const MILKY_SHIPPED_REST: readonly MilkyRestPoseName[] = ['sit', 'drowsy', 'sleep'];
export const MILKY_PHOTO_REST: readonly MilkyRestPoseName[] = [...MILKY_SHIPPED_REST, 'sitdown', 'wake'];
// Delivered rest registration (milky-rest-registration.json): translate each pose's
// support-footprint anchor (sit 889/977, drowsy 932/951, sleep 898/915) onto the shared
// floor point (795, 970) at the common .847 scale. Bridge measurements are archived in
// asset-sources/milky-photo-motions/bridges/registration.json.
const REST_TRANSLATE: Record<MilkyRestPoseName, readonly [number, number]> = {
  sit: [-94, -7], drowsy: [-137, 19], sleep: [-103, 55], sitdown: [-81.5, -3], wake: [-135, -2],
};
const ACTIVITY_NAMES = ['eat-low', 'eat-lift', 'play-bow', 'play-reach'] as const;
const PROP_NAMES = ['bowl', 'ball'] as const;
export type MilkyActivityAsset = MilkyActivityPoseName | 'prop-bowl' | 'prop-ball';
/**
 * Delivered activity assets; only listed files are requested. Per-pose registration
 * follows the final art measurements in docs/milky-activity-registration.json.
 */
export const MILKY_SHIPPED_ACTIVITY: readonly MilkyActivityAsset[] =
  ['eat-low', 'eat-lift', 'play-bow', 'play-reach', 'prop-bowl', 'prop-ball'];
// FINAL per-pose registration from the delivered milky-activity-registration.json:
// offsetToSharedAnchor translations onto (795, 970) at scale .847. Interaction reaches
// are calculated from the JSON's registered landmarks, not hardcoded screen constants:
// registered eat-low muzzle tip x 1474 → 1474 − 795 = 679 native px ahead; registered
// raised paw tip (1511.5, 812) → 716.5 native px ahead for the ball contact.
const ACTIVITY_TRANSLATE: Record<MilkyActivityPoseName, readonly [number, number]> = {
  'eat-low': [104, 19], 'eat-lift': [101.5, 17], 'play-bow': [-22, 2], 'play-reach': [125.5, 32],
};
const MUZZLE_AHEAD_NATIVE = 1474 - 795;
const PAW_REACH_NATIVE = 1511.5 - 795;
// Prop ground anchors measured on the 512² canvases (bowl base (257.5, 506), ball bottom
// (255, 406)): the image shifts so that point sits on the wrapper's floor origin.
const PROP_ANCHOR: Record<(typeof PROP_NAMES)[number], readonly [number, number]> = {
  bowl: [257.5, 506], ball: [255, 406],
};
/**
 * The optional forward-look locomotion set (milky-forward-idle + 8 forward steps): the
 * same v4 body with the head looking ahead. Used atomically — all nine decode or the set
 * is ignored — for walking and quiet idle gaze; the camera-look idle stays the greeting
 * face. Root flips this off if the set is withdrawn.
 */
export const MILKY_SHIPPED_FORWARD = true;
/**
 * The optional 4-frame diagonal-pair trot set (milky-trot-0..3.webp, 768×512) from the
 * activity brief is now delivered. It is atomic — all four decode or the set is ignored
 * — and is used only for brisk legs (cadence > 1.25). Faster walk frames remain the
 * fallback. Every trot frame receives the SAME +28 native-pixel Y translation: its
 * measured contact floor942 becomes970 while the two airborne clearances are preserved.
 */
export const MILKY_SHIPPED_TROT = true;
const validPetRatio = (image: HTMLImageElement) =>
  image.naturalHeight > 0 && Math.abs(image.naturalWidth / image.naturalHeight - 1.5) < .02;
const validPropRatio = (image: HTMLImageElement) =>
  image.naturalHeight > 0 && Math.abs(image.naturalWidth / image.naturalHeight - 1) < .02;

/** Milky's paws, not the transparent image box, are anchored to the room's floor. */
export function mountCyberPet(
  host: HTMLElement,
  shippedPoses: readonly MilkyPoseName[] = MILKY_SHIPPED_POSES,
  shippedRest: readonly MilkyRestPoseName[] = MILKY_SHIPPED_REST,
  shippedActivity: readonly MilkyActivityAsset[] = MILKY_SHIPPED_ACTIVITY,
  shippedForward: boolean = MILKY_SHIPPED_FORWARD,
  shippedTrot: boolean = MILKY_SHIPPED_TROT,
  propOverrides: Partial<Record<'ball' | 'bowl', { src: string; anchor: readonly [number, number] }>> = {},
  floorBounds = DEFAULT_MILKY_FLOOR,
  bedOptions?: MilkyBedOptions,
  toyOptions?: MilkyToyOptions,
  photoOptions?: CyberPetPhotoOptions,
): CyberPetController {
  const page = host.ownerDocument;
  const view = page.defaultView!;
  const listeners = new AbortController();
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = host.closest<HTMLElement>('.night-scene') ?? host;
  const studio = host.closest<HTMLElement>('.night-studio');
  const button = page.createElement('button');
  button.type = 'button';
  button.className = 'cyber-pet-button';
  button.setAttribute('aria-label', 'Say hello to Milky. Arrow keys walk, S sits, N naps.');
  button.dataset.pose = 'idle';
  button.dataset.facing = 'right';
  button.dataset.motion = 'idle';
  button.dataset.bed = 'false';
  const desktopWidth = milkyWidthRatio(floorBounds, false);
  const portraitWidth = milkyWidthRatio(floorBounds, true);
  const percent = (value: number) => `${Number(value.toFixed(6))}%`;
  button.style.setProperty('--milky-desktop-width', percent(desktopWidth * 100));
  button.style.setProperty('--milky-portrait-width', percent(portraitWidth * 100));
  const shadow = page.createElement('span');
  shadow.className = 'cyber-pet-shadow';
  shadow.setAttribute('aria-hidden', 'true');
  const figure = page.createElement('span');
  figure.className = 'cyber-pet-figure';
  button.append(shadow, figure);
  const grounded = photoOptions?.groundedWalk ? mountGroundedWalk(figure) : undefined;
  const spriteImage = (className: string) => {
    const image = page.createElement('img');
    image.className = className;
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    image.width = 1536;
    image.height = 1024;
    image.setAttribute('aria-hidden', 'true');
    figure.append(image);
    return image;
  };
  const idleImage = spriteImage('cyber-pet-image');
  idleImage.dataset.look = 'camera';
  // Each pose remains independently drawn. Packing poses into a generated sheet can silently
  // duplicate planted hind legs; independent decoded frames preserve the reviewed anatomy.
  const makeSteps = (set: 'profile' | 'forward' | 'trot', count = 8) => Array.from({ length: count }, (_, index) => {
    const image = spriteImage('cyber-pet-step');
    image.dataset.frame = String(index);
    image.dataset.set = set;
    image.dataset.visible = 'false';
    return { image, ready: false };
  });
  const steps = makeSteps('profile');
  // Optional v4-only micro poses. A missing or malformed file quietly removes its moments.
  const poses = POSE_NAMES.filter((name) => shippedPoses.includes(name)).map((name) => {
    const image = spriteImage('cyber-pet-pose');
    image.dataset.variant = name;
    return { name, image, ready: false, disabled: false };
  });
  // Rest poses share the same optional, v4-only semantics: each independently drawn and
  // held in place; a missing file removes only the behaviors that need it.
  const rests = REST_NAMES.filter((name) => shippedRest.includes(name)).map((name) => {
    const image = spriteImage('cyber-pet-rest');
    image.dataset.variant = name;
    return { name, image, ready: false, disabled: false };
  });
  // Activity poses (eating, play bow, playful reach) — optional, v4-only, look at their prop.
  const activities = ACTIVITY_NAMES.filter((name) => shippedActivity.includes(name)).map((name) => {
    const image = spriteImage('cyber-pet-activity');
    image.dataset.variant = name;
    return { name, image, ready: false, disabled: false };
  });
  // Optional forward-look locomotion set: used only when all nine files decode, so a
  // camera-look face is never mixed into a forward-look walk or vice versa.
  const forwardIdle = shippedForward ? (() => {
    const image = spriteImage('cyber-pet-image');
    image.dataset.look = 'forward';
    return { image, ready: false, failed: false };
  })() : undefined;
  const forwardSteps = shippedForward ? makeSteps('forward') : [];
  let forwardFailed = !shippedForward;
  // Optional atomic 4-frame diagonal-pair trot for brisk legs only (see MILKY_SHIPPED_TROT).
  const trotSteps = shippedTrot ? makeSteps('trot', 4) : [];
  let trotFailed = !shippedTrot;
  // Props live outside the button in their own floor-anchored layer; the runtime moves
  // them on the real floor with a grounded contact shadow. Never inside the dog's figure.
  const propsLayer = page.createElement('span');
  propsLayer.className = 'cyber-pet-props';
  propsLayer.setAttribute('aria-hidden', String(!toyOptions));
  propsLayer.dataset.interactive = String(Boolean(toyOptions));
  // Preserve the archived prop registration, scaling each with its matching dog width.
  propsLayer.style.setProperty('--milky-bowl-width', percent(3.7 * desktopWidth / .14));
  propsLayer.style.setProperty('--milky-ball-width', percent(2.6 * desktopWidth / .14));
  propsLayer.style.setProperty('--milky-bowl-portrait-width', percent(2.907 * portraitWidth / .11));
  propsLayer.style.setProperty('--milky-ball-portrait-width', percent(2.043 * portraitWidth / .11));
  const propItems = PROP_NAMES.filter((name) => shippedActivity.includes(`prop-${name}` as MilkyActivityAsset)).map((name) => {
    const wrap = page.createElement('span');
    wrap.className = 'cyber-pet-prop';
    wrap.dataset.prop = name;
    wrap.dataset.visible = 'false';
    const propShadow = page.createElement('span');
    propShadow.className = 'cyber-pet-prop-shadow';
    propShadow.setAttribute('aria-hidden', 'true');
    const image = page.createElement('img');
    image.className = 'cyber-pet-prop-image';
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    image.width = 512;
    image.height = 512;
    image.setAttribute('aria-hidden', 'true');
    const [anchorX, anchorY] = propOverrides[name]?.anchor ?? PROP_ANCHOR[name];
    image.style.setProperty('--milky-prop-anchor-x', `${((256 - anchorX) / 512 * 100).toFixed(2)}%`);
    image.style.setProperty('--milky-prop-anchor-y', `${((512 - anchorY) / 512 * 100).toFixed(2)}%`);
    wrap.append(propShadow, image);
    const target = name === 'ball' && toyOptions ? createMilkyToyTarget(wrap, play, listeners.signal) : undefined;
    propsLayer.append(wrap);
    return { name, wrap, image, target, ready: false, disabled: false };
  });

  let active = true;
  let animated = true;
  let destroyed = false;
  const photoSubscribers = new Set<(event: MilkyPhotoMotionEvent) => void>();
  function notifyPhotoMotions(event: MilkyPhotoMotionEvent) {
    if (!destroyed) for (const listener of photoSubscribers) listener(event);
  }
  let version: MilkyArtVersion = 'v4';
  let idleDecoded = false;
  let idleFailed = false;
  let primaryArtwork = true;
  let gaitReady = false;
  let floorVisible = false;
  let placed = false;
  let portrait = false;
  let keyboardFocused = false;
  let width = 0;
  let height = 0;
  let position: MilkyPoint = { x: .58, y: .865 };
  let lastHeading: MilkyHeading | undefined;
  let facing = 1;
  let tickHandle = 0;
  let lastTick = 0;
  let actionTimer: ReturnType<typeof setTimeout> | undefined;
  let roamTimer: ReturnType<typeof setTimeout> | undefined;
  let lifeTimer: ReturnType<typeof setTimeout> | undefined;
  let actionRevision = 0;
  let autonomousAction = false;
  let walk: { plan: MilkyWalk; started: number; basePhase: number; adjust: number; stride: number; autonomous: boolean; grounded: boolean; sceneDistance: number; onDone?: () => void } | undefined;
  let groundedIdle = false;
  let groundedRequested = false;
  const groundedFrame = { travelled: 0, root: { x: 0, y: 0 }, scale: 0, wrapperWidth: 0, pixelRatio: 1 };
  let hop: { readonly plan: MilkyBedHop; readonly started: number; readonly autonomous: boolean; readonly onLand: () => void; readonly onDone: () => void; landed: boolean } | undefined;
  let ball: MilkyBallState | undefined;
  let ballBounds: MilkyBallBounds | undefined;
  let ballRotation = 0;
  let previousBallX: number | undefined;
  let dragOrigin: MilkyPoint | undefined;
  let throwAwaitingWake = false;
  let gaitPhase = 0;
  let currentSpeed = 0;
  let currentSteps = steps;
  let currentFrames = 8;
  let shownStep: HTMLImageElement | undefined;

  // v4 readiness is atomic across all nine required assets: the smiling idle may not appear
  // over a stern gait, and a decoded gait may not run under an unproven idle. The already
  // verified v3 set keeps its historical behavior (idle first, walking gated on the gait).
  const displayReady = () => idleDecoded && (version !== 'v4' || gaitReady);
  const available = () => active && !destroyed && !page.hidden && floorVisible && displayReady();
  const motionStopped = () => !animated || reducedMotion.matches;
  const canWalk = () => available() && primaryArtwork && gaitReady && !motionStopped();
  const passiveAvailable = () => canWalk() && !keyboardFocused && studio?.dataset.intro !== 'visible';
  const bound = (point: MilkyPoint) => placeMilky(host.getBoundingClientRect(), scene.getBoundingClientRect(), point, floorBounds);
  const poseReady = (name: MilkyPoseName) => version === 'v4' && (poses.find((entry) => entry.name === name)?.ready ?? false);
  const restReady = (name: MilkyRestPoseName) => version === 'v4' && (rests.find((entry) => entry.name === name)?.ready ?? false);
  const activityReady = (name: MilkyActivityPoseName) => version === 'v4' && (activities.find((entry) => entry.name === name)?.ready ?? false);
  const propReady = (name: (typeof PROP_NAMES)[number]) => version === 'v4' && (propItems.find((entry) => entry.name === name)?.ready ?? false);
  const prop = (name: (typeof PROP_NAMES)[number]) => propItems.find((entry) => entry.name === name);
  const restPoseActive = () => (REST_NAMES as readonly string[]).includes(button.dataset.pose ?? '')
    || (photo?.isLyingPose(button.dataset.pose ?? '') ?? false);
  const busyPoseActive = () => restPoseActive() || (ACTIVITY_NAMES as readonly string[]).includes(button.dataset.pose ?? '')
    || (photo?.isPhotoPose(button.dataset.pose ?? '') ?? false);
  const forwardActive = () => version === 'v4' && !forwardFailed && (forwardIdle?.ready ?? false) && forwardSteps.length === 8 && forwardSteps.every((entry) => entry.ready);
  const trotActive = () => version === 'v4' && !trotFailed && trotSteps.length === 4 && trotSteps.every((entry) => entry.ready);
  const bed = createMilkyBed(bedOptions, {
    room: () => host.getBoundingClientRect(), viewport: () => scene.getBoundingClientRect(), floor: floorBounds,
    position: () => position, bound, canWalk,
    walk: (point, autonomous, onDone) => { if (!throwAwaitingWake) clearSession(); walkTo(point, { autonomous, onDone, bedRoute: true }); },
    hop: startBedHop,
    // A landed rest first honors a bed photo intent queued during the transit; the
    // ordinary nap stages remain the default.
    rest: (stages, autonomous, done) => {
      if (takePendingBedPhoto(done, autonomous)) return;
      startAutonomousRest(stages, autonomous, done);
    },
    occupied: (occupied) => { button.dataset.bed = String(occupied); syncToy(); }, settle: () => settle(),
  });
  // ---- Photo-inspired motions (opt-in): six explicit actions plus rare autonomous
  // accents at existing opportunities. All sequencing reuses actionRevision timers; the
  // art loads lazily on first intent and each frame registers onto the shared v4 floor
  // point exactly like the rest and activity sets. ----
  const photo = photoOptions?.photoMotions === true ? createMilkyPhotoRuntime({
    createImage(frame) {
      const image = spriteImage('cyber-pet-photo');
      image.dataset.variant = frame;
      return image;
    },
    register: (image, translate) => registerPhotoArt(image, translate),
    validRatio: validPetRatio,
    signal: listeners.signal,
    onGroupSettled: (kind, groupReady) => photoGroupSettled(kind, groupReady),
  }) : undefined;
  function registerPhotoArt(image: HTMLImageElement, translate: readonly [number, number]) {
    const v4 = MILKY_ART.v4;
    registerArt(image, `${v4.x + translate[0] / 1536 * v4.scale * 100}%`, `${v4.y + translate[1] / 1024 * v4.scale * 100}%`);
  }
  const photoRestContext = (): MilkyPhotoRestContext =>
    ({ sit: restReady('sit'), drowsy: restReady('drowsy'), sleep: restReady('sleep'), wake: restReady('wake') });
  // A bed-only motion requested while a visit is still in transit (approach, hop, or
  // departure) waits here for a real landing — or a fresh visit once the departure walk
  // resolves. Any new user command or lifecycle invalidation drops it.
  let pendingBedPhoto: MilkyPhotoMotion | undefined;
  function clearPhotoIntents() {
    photo?.clearIntent();
    pendingBedPhoto = undefined;
  }
  /**
   * The native-pixel correction that lands the measured chin landmark on the actual bed
   * rim at the given stance, or undefined when the rim is genuinely out of reach.
   */
  function chinRimOffset(point: MilkyPoint, face: number): readonly [number, number] | undefined {
    if (!bedOptions || width <= 0 || height <= 0) return undefined;
    const pixelsPerNative = width * milkyWidthRatio(floorBounds, portrait) * milkyDepthScale(point.y) * MILKY_ART.v4.scale / 1536;
    const room = host.getBoundingClientRect();
    const bedRect = bedOptions.element.getBoundingClientRect();
    const frame = MILKY_PHOTO_FRAMES['chin-rest'];
    return milkyChinRimTranslation({
      chinPoint: frame.chinPoint,
      supportAnchor: frame.supportAnchor,
      dogScreen: { x: point.x * width, y: point.y * height },
      rimScreen: {
        x: bedRect.left - room.left + MILKY_BED_RIM_FRACTION.x * bedRect.width,
        y: bedRect.top - room.top + MILKY_BED_RIM_FRACTION.y * bedRect.height,
      },
      pixelsPerNative,
      facing: face < 0 ? -1 : 1,
    });
  }
  /** Drawer-friendly capability/geometry/animation check; never a network request. */
  function canPhotoMotion(kind: MilkyPhotoMotion): boolean {
    if (!photo || destroyed || idleFailed || !primaryArtwork) return false;
    if (version !== 'v4' || !displayReady() || !floorVisible) return false;
    if (motionStopped()) return false;
    // A previously failed load does NOT make the capability false: a later explicit
    // request is a deliberate retry. Only autonomy treats a failed group as dead.
    switch (kind) {
      case 'tilt':
      case 'pant':
        return true;
      case 'paws-rest':
        return restReady('sit');
      case 'sleepy-peek':
        return restReady('sit') && restReady('drowsy') && restReady('sleep');
      case 'belly-up':
        return bed.visible() && restReady('sit') && restReady('drowsy') && restReady('sleep');
      case 'chin-rest':
        return restReady('sit') && restReady('drowsy') && bed.visible() && bedOptions !== undefined && chinRimOffset(bedOptions.anchor, 1) !== undefined;
      default: {
        kind satisfies never;
        return false;
      }
    }
  }
  function ensurePhotoMotion(kind: MilkyPhotoMotion) {
    const state = photo?.ensure(kind);
    switch (state) {
      case 'loading':
      case 'ready':
      case 'failed':
        notifyPhotoMotions({ type: 'load', kind, state });
        break;
      case 'idle':
      case undefined:
        break;
      default: state satisfies never;
    }
    return state;
  }
  function photoMotion(kind: MilkyPhotoMotion): boolean {
    if (!photo || !available() || !canPhotoMotion(kind)) return false;
    clearPhotoIntents();
    const state = ensurePhotoMotion(kind);
    if (state === 'failed') return false;
    if (state === 'ready') {
      beginPhoto(kind, false);
    } else photo.setIntent(kind);
    return true;
  }
  function photoGroupSettled(kind: MilkyPhotoMotion, groupReady: boolean) {
    if (!photo || destroyed) return;
    notifyPhotoMotions({ type: 'load', kind, state: groupReady ? 'ready' : 'failed' });
    if (!photo.takeIntent(kind)) return;
    // A stale, canceled or deactivated context never starts from a late decode; on any
    // loading failure the previous working pose simply stays.
    if (!groupReady || !available() || !canPhotoMotion(kind)) return;
    beginPhoto(kind, false);
  }
  function runPhotoSteps(steps: MilkyPoseStep[], autonomous: boolean, done: () => void = settle) {
    const sequence = button.dataset.pose === 'idle' && steps[0]?.pose === 'sit' && restReady('sitdown')
      ? [{ pose: 'sitdown', hold: milkyRestTransitionHold('sitdown'), motion: 'resting' }, ...steps]
      : steps;
    cancelAction();
    // A ball still rolling or airborne from the interrupted play keeps its shared
    // animation frame and lands normally; a photo pose never freezes it mid-air.
    if (ball && !ball.resting) ensureTick();
    autonomousAction = autonomous;
    const revision = actionRevision;
    playPoseSteps(sequence, 0, revision, () => finishRest(revision, done));
  }
  /** The end-of-sequence stand, through whatever rest art actually decoded. */
  const photoStandBridge = (steps: readonly MilkyPhotoStep[]): MilkyPoseStep[] =>
    [...steps, ...planMilkyStandBridge(steps.at(-1)?.pose ?? 'sleep', photoRestContext())];
  /** Runs the cushion sequence for a landed bed photo motion. Requires real occupancy. */
  function startBedPhotoSequence(requested: MilkyPhotoMotion, done: () => void, autonomous: boolean) {
    const kind = pendingBedPhoto ?? requested;
    pendingBedPhoto = undefined;
    if (!photo || photo.state(kind) !== 'ready' || button.dataset.bed !== 'true') { done(); return; }
    // The cushion entry always faces the rim side; fixed here, while still standing,
    // so a lying silhouette can never flip mid-rest.
    setFacing(1);
    if (kind === 'chin-rest') {
      const offset = chinRimOffset(position, facing);
      // Geometry may have shifted since the capability check; an unreachable rim
      // honestly skips the chin contact instead of faking it.
      if (!offset) { done(); return; }
      photo.applyChinOffset(offset);
    }
    runPhotoSteps(kind === 'chin-rest'
      ? photoStandBridge(planMilkyChinRest(photoRestContext()))
      : photoStandBridge(planMilkyBellyUp(photoRestContext())), autonomous, done);
  }
  /** Consumes a bed intent queued during transit, the moment a landing actually rests. */
  function takePendingBedPhoto(done: () => void, autonomous: boolean): boolean {
    const kind = pendingBedPhoto;
    if (kind === undefined) return false;
    pendingBedPhoto = undefined;
    if (!photo || photo.state(kind) !== 'ready' || button.dataset.bed !== 'true' || !canPhotoMotion(kind)) return false;
    startBedPhotoSequence(kind, done, autonomous);
    return true;
  }
  function beginPhoto(kind: MilkyPhotoMotion, autonomous: boolean) {
    if (!photo) return;
    photo.markPerformed(kind, view.performance.now());
    switch (kind) {
      case 'tilt':
        wakeThenRun(() => {
          // Besides greeting, this is the one moment Milky deliberately seeks the camera.
          button.dataset.gaze = 'camera';
          runPhotoSteps(planMilkyTilt(), autonomous);
        });
        break;
      case 'pant':
        wakeThenRun(() => runPhotoSteps(planMilkyPant(), autonomous));
        break;
      case 'paws-rest':
        wakeThenRun(() => runPhotoSteps(planMilkyPawsRest(photoRestContext()), autonomous));
        break;
      case 'sleepy-peek':
        // Already asleep: peek in place, preserving the chosen rest context (bed or floor).
        if (button.dataset.pose === 'sleep') {
          runPhotoSteps(photoStandBridge(planMilkySleepyPeek({ ...photoRestContext(), descend: false })), autonomous);
        } else {
          wakeThenRun(() => runPhotoSteps(photoStandBridge(planMilkySleepyPeek({ ...photoRestContext(), descend: true })), autonomous));
        }
        break;
      case 'chin-rest':
      case 'belly-up': {
        if (button.dataset.bed === 'true') {
          // Genuinely landed on the cushion: rise from any current rest and play in place.
          wakeThenRun(() => startBedPhotoSequence(kind, () => { if (!bed.leave(settle)) settle(); }, autonomous), true);
        } else if (bed.active) {
          // The visit is still in transit (approach, hop, or departure). A lying sequence
          // on the floor would be a lie; the latest bed intent waits for a real landing
          // instead, or re-enters freshly once the departure walk resolves (see settle).
          pendingBedPhoto = kind;
        } else wakeThenRun(() => {
          if (!bed.enter([], autonomous, (done) => {
            if (!takePendingBedPhoto(done, autonomous)) startBedPhotoSequence(kind, done, autonomous);
          })) settle();
        });
        break;
      }
      default: kind satisfies never;
    }
  }
  /** Rare autonomous accent at an existing opportunity; a cold group only warms lazily. */
  function maybePhotoVariation(kind: MilkyPhotoMotion, autonomous: boolean): boolean {
    if (!photo || !canPhotoMotion(kind)) return false;
    if (!photo.wantsAutonomous(kind, view.performance.now())) return false;
    if (photo.state(kind) !== 'ready') {
      // Only a never-tried group warms lazily; a failed one is never auto-retried —
      // a fresh fetch takes a deliberate explicit request.
      if (photo.state(kind) === 'idle') ensurePhotoMotion(kind);
      return false;
    }
    beginPhoto(kind, autonomous);
    return true;
  }
  /** After a genuinely completed play or run, Milky occasionally catches his breath. */
  function afterExertion() {
    if (available() && !motionStopped() && maybePhotoVariation('pant', true)) return;
    settle();
  }

  function registerArt(image: HTMLImageElement, frameX?: string, frameY?: string) {
    const registration = MILKY_ART[version];
    image.style.setProperty('--milky-art-scale', String(registration.scale));
    image.style.setProperty('--milky-frame-x', frameX ?? `${registration.x}%`);
    image.style.setProperty('--milky-frame-y', frameY ?? `${registration.y}%`);
  }
  function applyArtVersion() {
    const registration = MILKY_ART[version];
    for (const [index, step] of steps.entries()) {
      step.ready = false;
      registerArt(step.image,
        `${registration.x - registration.stepOffsetX[index] / 1536 * registration.scale * 100}%`,
        `${registration.y + registration.stepOffsetY[index] / 1024 * registration.scale * 100}%`);
      step.image.src = `${ASSET_ROOT}${stepAsset(version, index)}`;
    }
    registerArt(idleImage);
    idleImage.src = `${ASSET_ROOT}${idleAsset(version)}`;
  }
  function cancelAction(preserveGrounded = false) {
    if (!preserveGrounded) { grounded?.rest(); groundedIdle = false; }
    groundedRequested = false;
    actionRevision++;
    view.cancelAnimationFrame(tickHandle);
    tickHandle = 0;
    clearTimeout(actionTimer);
    clearTimeout(roamTimer);
    clearTimeout(lifeTimer);
    actionTimer = roamTimer = lifeTimer = undefined;
    walk = undefined;
    if (hop) {
      hop = undefined;
      renderHop(0, 1, 1);
      showIdle();
    }
    autonomousAction = false;
    currentSpeed = 0;
  }
  function clearSession() {
    toyDrag?.cancel();
    dragOrigin = undefined;
    throwAwaitingWake = false;
    ball = toyOptions && ball && !destroyed ? milkyBallAtRest(bound(ball)) : undefined;
    ballBounds = undefined;
    for (const entry of propItems) entry.wrap.dataset.visible = 'false';
    syncToy();
  }
  function showIdle() { button.dataset.pose = 'idle'; }
  function spriteFrame(frame: number) {
    const image = currentSteps[frame].image;
    if (shownStep !== image) {
      if (shownStep) shownStep.dataset.visible = 'false';
      image.dataset.visible = 'true';
      button.dataset.frame = String(frame);
      shownStep = image;
    }
    button.dataset.pose = 'side';
  }
  function renderPosition() {
    const depth = milkyDepthScale(position.y);
    button.style.transform = `translate3d(${(position.x * width).toFixed(2)}px, ${(position.y * height).toFixed(2)}px, 0) translate(-50%, -94%) scale(${depth.toFixed(4)})`;
  }
  const groundedScale = (point: MilkyPoint) => width * milkyWidthRatio(floorBounds, portrait)
    * MILKY_ART.v4.scale / GROUNDED_ART.width * Number(milkyDepthScale(point.y).toFixed(4));
  function prepareGrounded() {
    if (grounded && !groundedRequested && forwardActive() && canWalk()) {
      groundedRequested = true;
      void grounded.prepare();
    }
  }
  function drawGrounded(travelled: number): boolean {
    groundedFrame.travelled = travelled;
    groundedFrame.root.x = position.x * width;
    groundedFrame.root.y = position.y * height;
    groundedFrame.scale = groundedScale(position);
    groundedFrame.wrapperWidth = width * milkyWidthRatio(floorBounds, portrait);
    groundedFrame.pixelRatio = view.devicePixelRatio || 1;
    return grounded?.draw(groundedFrame) ?? false;
  }
  function renderHop(lift: number, shadowScale: number, shadowOpacity: number) {
    button.style.setProperty('--milky-hop-lift', `${(-lift * width).toFixed(2)}px`);
    button.style.setProperty('--milky-hop-shadow-scale', shadowScale.toFixed(3));
    button.style.setProperty('--milky-hop-shadow-opacity', shadowOpacity.toFixed(3));
  }
  function startBedHop(target: MilkyPoint, autonomous: boolean, onLand: () => void, onDone: () => void): boolean {
    if (!canWalk() || !trotActive()) return false;
    cancelAction();
    autonomousAction = autonomous;
    const bodyWidth = milkyWidthRatio(floorBounds, portrait) * .66 * milkyDepthScale(position.y);
    hop = { plan: { origin: { ...position }, target: { ...target }, height: bodyWidth * .12 },
      started: view.performance.now(), autonomous, onLand, onDone, landed: false };
    currentSteps = trotSteps;
    currentFrames = 4;
    button.dataset.motion = 'anticipating';
    button.dataset.gaze = forwardActive() ? 'forward' : 'camera';
    if (activityReady('play-bow')) button.dataset.pose = 'play-bow'; else showIdle();
    renderHop(0, 1, 1);
    ensureTick();
    return true;
  }
  function renderProp(entry: (typeof propItems)[number], point: MilkyPoint, lift = 0) {
    const depth = milkyDepthScale(point.y);
    entry.wrap.style.transform = `translate3d(${(point.x * width).toFixed(2)}px, ${(point.y * height).toFixed(2)}px, 0) translate(-50%, -100%) scale(${depth.toFixed(4)})`;
    entry.wrap.style.setProperty('--milky-prop-lift', `${(-lift * height).toFixed(2)}px`);
    entry.wrap.style.setProperty('--milky-prop-shadow', Math.max(.15, 1 - lift * 12).toFixed(3));
  }
  function showProp(name: (typeof PROP_NAMES)[number], point: MilkyPoint) {
    const entry = prop(name);
    if (!entry) return;
    entry.wrap.dataset.facing = name === 'ball' && toyOptions ? 'right' : facing < 0 ? 'left' : 'right';
    entry.wrap.dataset.visible = 'true';
    renderProp(entry, point);
  }
  function renderBall() {
    const entry = prop('ball');
    if (!entry || !ball) return;
    if (toyOptions) {
      if (previousBallX !== undefined && !ball.resting) {
        const diameter = milkyWidthRatio(floorBounds, portrait) * (.026 / .14) * (322 / 512) * milkyDepthScale(ball.y);
        ballRotation = (ballRotation + (ball.x - previousBallX) / (Math.PI * diameter) * 360) % 360;
      }
      previousBallX = ball.x;
      entry.image.style.setProperty('--milky-prop-spin', `${ballRotation.toFixed(2)}deg`);
    }
    renderProp(entry, { x: ball.x, y: ball.y }, ball.h);
  }
  function syncToy() {
    const entry = prop('ball');
    if (!toyOptions || !entry?.target) return;
    const ready = available() && !idleFailed && primaryArtwork && gaitReady && propReady('ball') && activityReady('play-bow') && activityReady('play-reach');
    entry.target.disabled = !ready || (bed.active && motionStopped());
    entry.target.hidden = !ready;
    entry.wrap.dataset.visible = String(ready);
    if (!ready) return;
    ball ??= milkyBallAtRest(bound(toyOptions.ballHome));
    showProp('ball', ball);
    renderBall();
  }
  // One shared animation-frame loop drives both the distance-linked gait and the rolling
  // ball, so lifecycle control (hidden tab, reduced motion, destroy) stays in one place.
  function ensureTick() {
    if (tickHandle === 0 && !destroyed) {
      lastTick = view.performance.now();
      tickHandle = view.requestAnimationFrame(tick);
    }
  }
  function tick(now: number) {
    tickHandle = 0;
    const dt = Math.min(.1, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
    let more = false;
    if (walk) {
      if (!canWalk() || (walk.autonomous && !passiveAvailable())) { settle(); return; }
      const sample = sampleMilkyWalk(walk.plan, now - walk.started);
      gaitPhase = milkyGaitPhase(walk.basePhase, sample.distance, walk.plan.distance, walk.stride, walk.adjust);
      currentSpeed = sample.speed;
      position = sample.position;
      renderPosition();
      spriteFrame(milkyGaitFrame(gaitPhase, currentFrames));
      if (walk.grounded && !drawGrounded(walk.sceneDistance * sample.distance / walk.plan.distance)) walk.grounded = false;
      if (sample.done) finishWalk();
      else more = true;
    }
    if (hop) {
      if (!canWalk() || (hop.autonomous && !passiveAvailable())) { settle(); return; }
      const current = hop;
      const sample = sampleMilkyBedHop(current.plan, now - current.started);
      position = sample.position;
      renderPosition();
      renderHop(sample.lift, sample.shadowScale, sample.shadowOpacity);
      switch (sample.stage) {
        case 'anticipation': break;
        case 'flight':
          button.dataset.motion = 'hopping';
          spriteFrame(sample.frame);
          break;
        case 'landing':
        case 'done':
          button.dataset.motion = 'landing';
          spriteFrame(2);
          if (!current.landed) { current.landed = true; current.onLand(); }
          break;
        default: sample.stage satisfies never;
      }
      if (sample.stage === 'done') { hop = undefined; showIdle(); current.onDone(); }
      else more = true;
    }
    if (ball && !ball.resting && canWalk() && ballBounds) {
      ball = stepMilkyBall(ball, dt, ballBounds);
      renderBall();
      if (!ball.resting) more = true;
    }
    if (more && tickHandle === 0) tickHandle = view.requestAnimationFrame(tick);
  }
  function queueRoam(afterWalk = false) {
    if (roamTimer !== undefined || !passiveAvailable() || button.dataset.motion !== 'idle') return;
    roamTimer = setTimeout(() => {
      roamTimer = undefined;
      if (!passiveAvailable() || button.dataset.motion !== 'idle') return;
      // Rarely, a pause turns playful — a short ball game or a quick trot — but rest and
      // ordinary wandering stay the common rhythm, and feeding remains explicit only.
      const spark = Math.random();
      if (spark < .05 && propReady('ball') && activityReady('play-bow') && activityReady('play-reach') && !motionStopped()) {
        cancelAction();
        beginPlay(true);
        return;
      }
      if (spark < .10) {
        cancelAction();
        autonomousAction = true;
        runLeg({ legs: 1, cadence: 1.3 }, 0, Math.random() < .5 ? -facing : facing, true);
        return;
      }
      // A quiet pause may instead become one of the rare photo moments: the sphinx rest
      // on the floor, or — very rarely — a chin rest or belly roll on the visible bed.
      if (photo && maybePhotoVariation('paws-rest', true)) return;
      if (photo && bed.available() && (maybePhotoVariation('belly-up', true) || maybePhotoVariation('chin-rest', true))) return;
      // A rest pause may deepen into sitting, lying and napping instead of another walk.
      const restPlan = planMilkyRestCycle({ sit: restReady('sit'), drowsy: restReady('drowsy'), sleep: restReady('sleep') });
      if (restPlan.length > 0) {
        const bedNap = bed.available() && restPlan.some((stage) => stage.pose === 'sleep') && Math.random() < 1 / 3;
        if (!bedNap || !bed.enter(restPlan, true)) startAutonomousRest(restPlan);
        return;
      }
      const target = chooseMilkyDestination(position, bound, lastHeading);
      if (!target) { queueRoam(); return; }
      // A nose-down moment of anticipation sometimes precedes a same-heading wander.
      // A reversal already gets its still three-quarter glance inside requestWalk.
      if (poseReady('sniff') && (target.x < position.x ? -1 : 1) === facing && Math.random() < .5) {
        cancelAction();
        button.dataset.pose = 'sniff';
        button.dataset.motion = 'sniffing';
        autonomousAction = true;
        const revision = actionRevision;
        actionTimer = setTimeout(() => {
          actionTimer = undefined;
          if (revision !== actionRevision) return;
          showIdle();
          button.dataset.motion = 'idle';
          if (passiveAvailable()) requestWalk(target, true);
          else settle();
        }, milkySniffHold());
      } else requestWalk(target, true);
    }, milkyRoamPause(Math.random, afterWalk));
  }
  // Blinks and glances belong to genuine rest. They swap raster poses only; the body,
  // its floor anchor and its scale never move, so nothing here counts as movement.
  function queueLife() {
    if (lifeTimer !== undefined || !available() || motionStopped() || version !== 'v4') return;
    if (button.dataset.motion !== 'idle' || button.dataset.pose !== 'idle') return;
    // Micro-poses are camera-look art; they never blink a front face onto a forward gaze.
    if (button.dataset.gaze === 'forward') return;
    const moment = planMilkyIdleMoment({ blink: poseReady('blink'), attend: poseReady('attend'), sniff: poseReady('sniff') });
    if (!moment) return;
    lifeTimer = setTimeout(() => { lifeTimer = undefined; playMoment(moment); }, moment.delay);
  }
  function playMoment(moment: MilkyIdleMoment, second = false) {
    if (!available() || motionStopped() || button.dataset.motion !== 'idle' || !poseReady(moment.kind)) return;
    grounded?.rest(); groundedIdle = false;
    button.dataset.pose = moment.kind;
    lifeTimer = setTimeout(() => {
      lifeTimer = undefined;
      if (button.dataset.pose === moment.kind) showIdle();
      if (moment.repeat && !second) {
        lifeTimer = setTimeout(() => {
          lifeTimer = undefined;
          playMoment({ ...moment, hold: 130, repeat: false }, true);
          if (lifeTimer === undefined) queueLife();
        }, MILKY_BLINK_GAP);
      } else queueLife();
    }, moment.hold);
  }
  function settle(afterWalk = false) {
    cancelAction(afterWalk && groundedIdle);
    clearSession();
    button.dataset.motion = 'idle';
    showIdle();
    // At quiet rest Milky mostly looks ahead rather than staring at the camera; the
    // camera-look idle remains the greeting face and the only base for blinking.
    button.dataset.gaze = groundedIdle || forwardActive() && Math.random() < .75 ? 'forward' : 'camera';
    if (bed.resume()) return;
    // A bed photo requested during the departure walk starts a fresh full visit —
    // approach and hop included — the moment the previous visit has fully resolved.
    if (pendingBedPhoto !== undefined && !bed.active) {
      const queued = pendingBedPhoto;
      pendingBedPhoto = undefined;
      if (photo && photo.state(queued) === 'ready' && available() && canPhotoMotion(queued)) {
        beginPhoto(queued, false);
        return;
      }
    }
    queueRoam(afterWalk);
    queueLife();
  }
  // ---- Rest and activity cycles: held raster postures at a fixed floor point. No
  // crossfades, no sliding, no CSS squashing; transitions are short still holds. ----
  type MilkyPoseStep = { pose: string; hold: number; motion?: string };
  const bedWakeStretch = (fromSleep: boolean) => planMilkyBedWakeStretch({
    enabled: toyOptions?.transitions === true, onBed: button.dataset.bed === 'true', fromSleep,
    playBowReady: activityReady('play-bow'), reducedMotion: motionStopped(),
  });
  function playPoseSteps(steps: MilkyPoseStep[], index: number, revision: number, done: () => void) {
    if (revision !== actionRevision || destroyed) return;
    if (index >= steps.length) { done(); return; }
    const step = steps[index];
    button.dataset.pose = step.pose;
    button.dataset.motion = step.motion ?? (step.pose === 'sleep' ? 'sleeping' : step.pose === 'wake' ? 'waking' : 'resting');
    actionTimer = setTimeout(() => {
      actionTimer = undefined;
      playPoseSteps(steps, index + 1, revision, done);
    }, step.hold);
  }
  function finishRest(revision: number, done: () => void = settle) {
    if (revision !== actionRevision) return;
    showIdle();
    button.dataset.motion = 'settling';
    actionTimer = setTimeout(() => {
      actionTimer = undefined;
      if (revision === actionRevision) done();
    }, milkyStandHold());
  }
  function startAutonomousRest(stages: readonly { pose: 'sit' | 'drowsy' | 'sleep'; hold: number }[], autonomous = true, done: () => void = settle) {
    cancelAction();
    autonomousAction = autonomous;
    const revision = actionRevision;
    const steps: MilkyPoseStep[] = [];
    if (button.dataset.bed === 'true' && stages[0]?.pose === 'sleep') {
      if (restReady('sit')) steps.push({ pose: 'sit', hold: 320 });
      if (restReady('drowsy')) steps.push({ pose: 'drowsy', hold: 460 });
    }
    if (stages[0]?.pose === 'sit' && restReady('sitdown')) steps.push({ pose: 'sitdown', hold: milkyRestTransitionHold('sitdown') });
    steps.push(...stages);
    // Deep in an autonomous nap, a rare half-lifted peek (photos 10/17) may interleave
    // before the wake — planned here, never from an extra timer.
    if (photo && stages.at(-1)?.pose === 'sleep' && restReady('sleep')
      && photo.wantsAutonomous('sleepy-peek', view.performance.now())) {
      if (photo.state('sleepy-peek') === 'ready') {
        photo.markPerformed('sleepy-peek', view.performance.now());
        steps.push(...planMilkySleepyPeek({ sit: false, drowsy: false, sleep: true, wake: false, descend: false }));
      } else if (photo.state('sleepy-peek') === 'idle') ensurePhotoMotion('sleepy-peek');
    }
    if (stages.at(-1)?.pose === 'sleep' && restReady('wake')) steps.push({ pose: 'wake', hold: milkyRestTransitionHold('wake') });
    const stretch = bedWakeStretch(stages.at(-1)?.pose === 'sleep');
    if (stretch) steps.push(stretch);
    playPoseSteps(steps, 0, revision, () => finishRest(revision, done));
  }
  /** Explicit sit/nap request from the controller API or the S/N keys. */
  function restNow(kind: 'sit' | 'sleep') {
    clearPhotoIntents();
    if (!available() || idleFailed) return;
    const deepest: MilkyRestPoseName | undefined = kind === 'sit'
      ? (restReady('sit') ? 'sit' : undefined)
      : restReady('sleep') ? 'sleep' : restReady('drowsy') ? 'drowsy' : restReady('sit') ? 'sit' : undefined;
    if (!deepest) return;
    const requestedPose = button.dataset.pose ?? 'idle';
    cancelAction();
    clearSession();
    if (motionStopped()) {
      // A still posture change on explicit request only: no timers, no auto-progression.
      button.dataset.pose = deepest;
      button.dataset.motion = deepest === 'sleep' ? 'sleeping' : 'resting';
      return;
    }
    const revision = actionRevision;
    // A posture command from a photo pose first finishes the authored reverse exit —
    // truncated the moment it reaches the requested posture, so a belly roll asked to
    // sleep rolls back to prone and simply stays there instead of standing first.
    const steps: MilkyPoseStep[] = [];
    for (const riseStep of (photo?.riseSteps(requestedPose, photoRestContext()) ?? { steps: [] }).steps) {
      steps.push({ ...riseStep });
      if (riseStep.pose === deepest) break;
    }
    const fromPose = steps.at(-1)?.pose ?? requestedPose;
    if (fromPose === 'sleep' && deepest === 'sit' && restReady('wake')) steps.push({ pose: 'wake', hold: milkyRestTransitionHold('wake') });
    if (fromPose === 'idle' && restReady('sitdown')) steps.push({ pose: 'sitdown', hold: milkyRestTransitionHold('sitdown') });
    // Deepening passes briefly through the shallower delivered postures on the way down.
    if (deepest === 'sleep' || deepest === 'drowsy') {
      if (restReady('sit') && fromPose !== 'sit' && fromPose !== 'drowsy' && fromPose !== 'sleep') steps.push({ pose: 'sit', hold: 620 + Math.random() * 320 });
      if (deepest === 'sleep' && restReady('drowsy') && fromPose !== 'drowsy' && fromPose !== 'sleep') steps.push({ pose: 'drowsy', hold: 680 + Math.random() * 360 });
    }
    steps.push({ pose: deepest, hold: milkyExplicitRestHold(deepest) });
    if (deepest === 'sleep' && restReady('wake')) steps.push({ pose: 'wake', hold: milkyRestTransitionHold('wake') });
    playPoseSteps(steps, 0, revision, () => finishRest(revision));
  }
  /** Gently restore standing (never walk, drag or mirror a resting pose) and then act. */
  function wakeThenRun(next: () => void, stayInBed = false) {
    const onFloor = stayInBed ? next : () => { if (!bed.leave(next)) next(); };
    if (!busyPoseActive()) { onFloor(); return; }
    // An interrupted lying photo pose first finishes its authored reverse exit (own
    // frames, then up through whatever rest art decoded) before anything else happens.
    const plainSleep = button.dataset.pose === 'sleep';
    const rise = photo?.riseSteps(button.dataset.pose ?? '', photoRestContext()) ?? { steps: [], fromProne: false };
    const fromSleep = plainSleep || rise.fromProne;
    cancelAction();
    if (ball && !ball.resting) ensureTick();
    if (motionStopped()) { showIdle(); button.dataset.motion = 'idle'; onFloor(); return; }
    const revision = actionRevision;
    const steps: MilkyPoseStep[] = rise.steps.map((step) => ({ ...step }));
    if (plainSleep && restReady('wake')) steps.push({ pose: 'wake', hold: milkyRestTransitionHold('wake') });
    const stretch = bedWakeStretch(fromSleep);
    if (stretch) steps.push(stretch);
    playPoseSteps(steps, 0, revision, () => {
      if (revision !== actionRevision) return;
      showIdle();
      button.dataset.motion = 'waking';
      actionTimer = setTimeout(() => {
        actionTimer = undefined;
        if (revision !== actionRevision) return;
        button.dataset.motion = 'idle';
        onFloor();
      }, milkyStandHold());
    });
  }
  const gentleSettle = () => { if (busyPoseActive() && !motionStopped()) wakeThenRun(() => settle()); else settle(); };
  function finishWalk() {
    const done = walk?.onDone;
    groundedIdle = Boolean(walk?.grounded && grounded?.finish());
    walk = undefined;
    currentSpeed = 0;
    // Keep the final painted stance at rest. The legacy idle has a different leg contour.
    button.dataset.motion = 'settling';
    button.dataset.gaze = forwardActive() ? 'forward' : 'camera';
    showIdle();
    const arrival = !done && !groundedIdle ? planMilkyWalkArrival({
      enabled: toyOptions?.transitions === true, reducedMotion: motionStopped(),
      cameraIdleReady: primaryArtwork && displayReady(), attendShipped: shippedPoses.includes('attend'), attendReady: poseReady('attend'),
    }) : undefined;
    if (arrival) { button.dataset.gaze = arrival.gaze; button.dataset.pose = arrival.pose; }
    const revision = actionRevision;
    actionTimer = setTimeout(() => {
      actionTimer = undefined;
      if (revision !== actionRevision) return;
      if (done) done();
      else settle(true);
    }, arrival?.hold ?? (done ? 200 : 320));
  }
  function startWalk(target: MilkyPoint, autonomous: boolean, initialSpeed = 0, opts?: { cadence?: number; onDone?: () => void; carryGrounded?: boolean; legacyContinuation?: boolean }) {
    if (!canWalk() || (autonomous && !passiveAvailable())) { settle(); return; }
    if (milkyDistance(position, target) < .002 || Math.abs(target.x - position.x) < .008) { settle(); return; }
    const bodyWidth = milkyWidthRatio(floorBounds, portrait) * .66 * milkyDepthScale(position.y);
    // Phase 4 begins from the planted hind-paw position closest to the standing photo.
    // A same-heading continuation keeps its accumulated phase so no limb jumps.
    if (initialSpeed === 0) gaitPhase = .5;
    facing = target.x < position.x ? -1 : 1;
    button.dataset.facing = facing < 0 ? 'left' : 'right';
    const from = { x: position.x * width, y: position.y * height };
    const to = { x: target.x * width, y: target.y * height };
    const originY = position.y;
    const nativeScale = width * milkyWidthRatio(floorBounds, portrait) * MILKY_ART.v4.scale / GROUNDED_ART.width;
    const authoredGait = (opts?.cadence ?? 1) > 1.25 ? 'run' : 'walk';
    const useGrounded = Boolean(!opts?.legacyContinuation && forwardActive() && grounded?.ready()
      && grounded.begin({ from, to, gait: authoredGait, scale: groundedScale(position), endScale: groundedScale(target), facing: facing < 0 ? -1 : 1,
        scaleAt: (progress) => nativeScale * Number(milkyDepthScale(originY + (target.y - originY) * progress).toFixed(4)),
      }, opts?.carryGrounded));
    if (!useGrounded && groundedIdle) grounded?.rest();
    groundedIdle = false;
    const stride = useGrounded ? AUTHORED_STRIDE[authoredGait] * groundedScale(position) / width
      : milkyGaitStride(milkyStride(bodyWidth), milkyDistance(position, target), gaitPhase);
    // Keep the asset's native cadence at cruise. The distance-driven mixer slows
    // with the existing acceleration curve and uses Gallop for a chase.
    const cadence = opts?.cadence ?? 1;
    const cruise = useGrounded
      ? stride / AUTHORED_DURATION[authoredGait] * (authoredGait === 'run' ? cadence / 1.48 : cadence)
      : stride / .72 * cadence;
    const speed = Math.max(cruise, initialSpeed);
    lastHeading = { x: target.x - position.x, y: target.y - position.y };
    const plan = createMilkyWalk(position, target, speed, initialSpeed);
    actionRevision++;
    autonomousAction = autonomous;
    button.dataset.motion = 'walking';
    button.dataset.gaze = forwardActive() ? 'forward' : 'camera';
    // One walk uses one frame set, fixed for the whole leg — never mixed mid-walk. A
    // brisk leg (cadence > 1.25) may use the atomic 4-frame trot when all four decoded;
    // otherwise the honest faster-stepped walk frames stand in.
    const brisk = (opts?.cadence ?? 1) > 1.25;
    currentSteps = !useGrounded && brisk && trotActive() ? trotSteps : forwardActive() ? forwardSteps : steps;
    currentFrames = currentSteps.length;
    // Aim within the support frame before settling, subject to the cadence adjustment cap.
    walk = { plan, started: view.performance.now(), basePhase: gaitPhase,
      adjust: useGrounded ? 0 : milkyGaitFinishAdjustment(gaitPhase, plan.distance, stride, currentFrames), stride, autonomous,
      grounded: useGrounded, sceneDistance: Math.hypot(to.x - from.x, to.y - from.y), onDone: opts?.onDone };
    spriteFrame(milkyGaitFrame(gaitPhase, currentFrames));
    if (walk.grounded && !drawGrounded(0)) walk.grounded = false;
    if (!useGrounded) prepareGrounded();
    ensureTick();
  }
  /** Internal targeted walk for activity sessions, with a turn pause and a completion hook. */
  function walkTo(destination: MilkyPoint, opts: { autonomous?: boolean; cadence?: number; onDone?: () => void; bedRoute?: boolean }) {
    const target = opts.bedRoute ? destination : bound(destination);
    const turning = (target.x < position.x ? -1 : 1) !== facing;
    cancelAction();
    if (ball && !ball.resting) ensureTick();
    if (!canWalk()) { settle(); return; }
    if (milkyDistance(position, target) < .002 || Math.abs(target.x - position.x) < .008) {
      if (opts.onDone) opts.onDone(); else settle();
      return;
    }
    prepareGrounded();
    if (busyPoseActive()) showIdle();
    autonomousAction = opts.autonomous ?? false;
    if (!turning) { startWalk(target, autonomousAction, 0, opts); return; }
    showIdle();
    button.dataset.gaze = 'camera';
    button.dataset.motion = 'turning';
    const revision = actionRevision;
    actionTimer = setTimeout(() => {
      actionTimer = undefined;
      if (revision === actionRevision) startWalk(target, opts.autonomous ?? false, 0, opts);
    }, 240);
  }
  function requestWalk(destination: MilkyPoint, autonomous: boolean, greeting = false) {
    const target = bound(destination);
    const carry = walk && milkyCanContinue(walk.plan, position, target) ? currentSpeed : 0;
    const carryGrounded = carry > 0 && walk?.grounded === true;
    const turning = (target.x < position.x ? -1 : 1) !== facing;
    cancelAction(carryGrounded || groundedIdle && !turning && !greeting);
    if (!canWalk()) { button.dataset.motion = 'idle'; showIdle(); return; }
    if (milkyDistance(position, target) < .002 || Math.abs(target.x - position.x) < .008) { settle(); return; }
    prepareGrounded();
    // Safety net: a walk may never start from a resting silhouette; wakeThenRun is the
    // normal path, but any direct call stands the dog up first.
    if (restPoseActive()) showIdle();
    if (carry > 0) { startWalk(target, autonomous, carry, { carryGrounded, legacyContinuation: !carryGrounded }); return; }
    // A still, three-quarter glance precedes the turn. Never fake a 3D turn by squashing the dog.
    // A greeted, same-heading walk instead holds the happy look up toward the viewer.
    showIdle();
    const attending = greeting && !turning && poseReady('attend');
    if (attending) button.dataset.pose = 'attend';
    if (turning) button.dataset.gaze = 'camera';
    button.dataset.motion = turning ? 'turning' : 'attending';
    autonomousAction = autonomous;
    const revision = actionRevision;
    actionTimer = setTimeout(() => {
      actionTimer = undefined;
      if (revision === actionRevision) { showIdle(); startWalk(target, autonomous); }
    }, turning ? 240 : attending ? milkyGreetHold() : 140);
  }
  // ---- Activity sessions: a real bowl, a really rolling ball, a brisk trot. ----
  const setFacing = (direction: number) => {
    facing = direction < 0 ? -1 : 1;
    button.dataset.facing = facing < 0 ? 'left' : 'right';
  };
  /** A spot a little ahead of Milky, flipping direction when a wall is too close. */
  function spotAhead(distance: number): { point: MilkyPoint; direction: number } {
    let direction = facing;
    let point = bound({ x: position.x + direction * distance, y: position.y });
    if (Math.abs(point.x - position.x) < distance * .7) {
      direction = -direction;
      point = bound({ x: position.x + direction * distance, y: position.y });
    }
    return { point, direction };
  }
  /** A registered native landmark distance ahead of the anchor, in room units at a depth. */
  const reachAhead = (nativeAhead: number, depthY: number) =>
    milkyWidthRatio(floorBounds, portrait) * .847 * (nativeAhead / 1536) * milkyDepthScale(depthY);
  function beginFeed() {
    cancelAction();
    clearSession();
    const muzzleReach = (depthY: number) => reachAhead(MUZZLE_AHEAD_NATIVE, depthY);
    if (motionStopped()) {
      // Static explicit posture with static food and no forced movement: the dog stays
      // put, so the bowl must appear under her actual lowered muzzle, not a walk away.
      const reach = muzzleReach(position.y);
      let direction = facing;
      let spot = bound({ x: position.x + direction * reach, y: position.y });
      if (Math.abs(spot.x - position.x) < reach * .95) {
        direction = -direction;
        spot = bound({ x: position.x + direction * reach, y: position.y });
      }
      setFacing(direction);
      showProp('bowl', spot);
      button.dataset.pose = 'eat-low';
      button.dataset.motion = 'eating';
      return;
    }
    // The bowl lands far enough ahead that reaching it is a real little walk.
    const { point: bowlSpot, direction } = spotAhead(.085);
    showProp('bowl', bowlSpot);
    // Stand where the lowered muzzle meets the bowl.
    const stand = bound({ x: bowlSpot.x - direction * muzzleReach(bowlSpot.y), y: bowlSpot.y });
    walkTo(stand, { onDone: () => {
      // The bowl never slides while Milky eats; she turns to it and works through bites.
      setFacing(bowlSpot.x < position.x ? -1 : 1);
      const revision = actionRevision;
      const bites = planMilkyMeal().map((bite) => ({ pose: bite.pose, hold: bite.hold, motion: 'eating' }));
      playPoseSteps(bites, 0, revision, () => {
        if (revision !== actionRevision) return;
        // Per the activity brief, the bowl leaves only after Milky steps away from it:
        // a still stand-up beat, then a short bounded walk clear of the bowl.
        showIdle();
        button.dataset.motion = 'settling';
        actionTimer = setTimeout(() => {
          actionTimer = undefined;
          if (revision === actionRevision) stepAwayFromBowl(direction);
        }, milkyStandHold());
      });
    } });
  }
  function stepAwayFromBowl(bowlDirection: number) {
    const finish = () => {
      const bowl = prop('bowl');
      if (bowl) bowl.wrap.dataset.visible = 'false';
      settle();
    };
    // Turning back the way she came is the natural clearance; at a wall she walks past
    // the bowl instead. Either way the step stays short and inside the visible floor.
    let target = bound({ x: position.x - bowlDirection * (.05 + Math.random() * .035), y: position.y });
    if (Math.abs(target.x - position.x) < .012) target = bound({ x: position.x + bowlDirection * .06, y: position.y });
    if (Math.abs(target.x - position.x) < .012) { finish(); return; }
    walkTo(target, { onDone: finish });
  }
  function beginPlay(autonomous: boolean) {
    cancelAction();
    clearSession();
    // The ball lands beyond the registered paw reach so the approach is a real walk.
    const { point: ballSpot, direction } = toyOptions && ball
      ? { point: bound(ball), direction: ball.x < position.x ? -1 : 1 }
      : spotAhead(.09);
    ball = milkyBallAtRest(ballSpot);
    ballBounds = {
      left: bound({ x: 0, y: ballSpot.y }).x,
      right: bound({ x: 1, y: ballSpot.y }).x,
      top: bound({ x: ballSpot.x, y: 0 }).y,
      bottom: bound({ x: ballSpot.x, y: 1 }).y,
    };
    showProp('ball', ballSpot);
    renderBall();
    if (motionStopped()) {
      setFacing(direction);
      button.dataset.pose = 'play-bow';
      button.dataset.motion = 'playing';
      return;
    }
    autonomousAction = autonomous;
    playRound(planMilkyPlay(), 0, autonomous);
  }
  /** True only when the resting ball actually sits at the registered raised-paw tip. */
  function ballInPawContact(): boolean {
    if (!ball || !ball.resting) return false;
    const reach = reachAhead(PAW_REACH_NATIVE, ball.y);
    return Math.abs(Math.abs(ball.x - position.x) - reach) <= .006 && Math.abs(ball.y - position.y) <= .004;
  }
  function playRound(plan: ReturnType<typeof planMilkyPlay>, round: number, autonomous: boolean, tries = 0, waits = 0) {
    if (!ball) { settle(); return; }
    // A rolling ball is watched until it settles; an approach commits to a real resting
    // target, and a missed stand retargets, so contact never happens from a distance.
    if (!ball.resting && waits < 60) {
      autonomousAction = autonomous;
      showIdle();
      button.dataset.motion = 'attending';
      const revision = actionRevision;
      actionTimer = setTimeout(() => {
        actionTimer = undefined;
        if (revision === actionRevision) playRound(plan, round, autonomous, tries, waits + 1);
      }, 160);
      return;
    }
    // Stand where the registered raised paw tip actually meets the ball on contact. If
    // the natural side collapses to a no-walk step (a side-view dog cannot take a nearly
    // vertical step) or a wall clamps the stand off target, approach from the other side.
    const reach = reachAhead(PAW_REACH_NATIVE, ball.y);
    const offTarget = (point: MilkyPoint) =>
      Math.abs(Math.abs(ball!.x - point.x) - reach) > .004 || Math.abs(ball!.y - point.y) > .002;
    const approachDir = ball.x < position.x ? -1 : 1;
    let stand = bound({ x: ball.x - approachDir * reach, y: ball.y });
    if ((Math.abs(stand.x - position.x) < .01 && !ballInPawContact()) || offTarget(stand)) {
      const flipped = bound({ x: ball.x + approachDir * reach, y: ball.y });
      if (!offTarget(flipped)) stand = flipped;
    }
    if (toyOptions && !ballInPawContact() && Math.abs(stand.x - position.x) < .008 && tries < 6) {
      const stepBack = bound({ x: stand.x - approachDir * .035, y: stand.y });
      if (Math.abs(stepBack.x - position.x) >= .008) {
        walkTo(stepBack, { autonomous, onDone: () => playRound(plan, round, autonomous, tries + 1) });
        return;
      }
    }
    walkTo(stand, { autonomous, cadence: 1.15, onDone: () => {
      if (!ball) { settle(); return; }
      if (!ballInPawContact() && tries < 6) {
        playRound(plan, round, autonomous, tries + 1);
        return;
      }
      setFacing(ball.x < position.x ? -1 : 1);
      const revision = actionRevision;
      playPoseSteps([{ pose: 'play-bow', hold: plan.bowHold, motion: 'playing' }], 0, revision, () => {
        if (revision !== actionRevision || !ball) return;
        // Contact is verified at the nudge MOMENT, not from an earlier snapshot: if the
        // ball is not genuinely resting under the paw after the bow, retarget — and after
        // bounded attempts give up honestly with no nudge rather than fake a contact.
        if (!ballInPawContact()) {
          if (tries < 8) playRound(plan, round, autonomous, tries + 1);
          else finishRest(revision);
          return;
        }
        // The nudge is the moment the reach pose lands on the ball; it hops and rolls away.
        ball = milkyNudgeBall(ball, facing);
        ensureTick();
        playPoseSteps([{ pose: 'play-reach', hold: plan.reachHold, motion: 'playing' }], 0, revision, () => {
          if (revision !== actionRevision || !ball) return;
          const chaseDir = ball.x < position.x ? -1 : 1;
          walkTo({ x: ball.x - chaseDir * reachAhead(PAW_REACH_NATIVE, ball.y), y: ball.y }, { autonomous, cadence: 1.4, onDone: () => {
            if (round + 1 < plan.rounds) playRound(plan, round + 1, autonomous);
            // Only a genuinely completed session (real contact happened) may end in the
            // occasional photo-20 pant; the honest give-up path above never does.
            else finishRest(actionRevision, photo ? afterExertion : undefined);
          } });
        });
      });
    } });
  }
  function runLeg(plan: ReturnType<typeof planMilkyRun>, leg: number, direction: number, autonomous: boolean) {
    let dir = direction;
    let target = bound({ x: position.x + dir * (.13 + Math.random() * .07), y: position.y + (Math.random() * 2 - 1) * .03 });
    if (Math.abs(target.x - position.x) < .05) {
      dir = -dir;
      target = bound({ x: position.x + dir * (.13 + Math.random() * .07), y: position.y + (Math.random() * 2 - 1) * .03 });
    }
    const next = leg + 1 < plan.legs
      ? () => runLeg(plan, leg + 1, Math.random() < .6 ? -dir : dir, autonomous)
      : photo ? () => afterExertion() : undefined;
    walkTo(target, { autonomous, cadence: plan.cadence, onDone: next });
  }
  function notify(kind: 'greet' | 'walk' | 'feed' | 'play' | 'run') {
    // Any fresh user action supersedes a photo request still waiting on its art or bed.
    clearPhotoIntents();
    host.dispatchEvent(new CustomEvent('cyber:pet', { bubbles: true, detail: { kind } }));
  }
  function pet() {
    if (!available() || idleFailed || (bed.active && !canWalk())) return;
    notify('greet');
    // A greeting is the one moment Milky deliberately looks up at the camera.
    button.dataset.gaze = 'camera';
    wakeThenRun(() => {
      // Rarely the greeting answers with the photo-17 head tilt instead of a walk.
      if (photo && maybePhotoVariation('tilt', false)) return;
      const target = chooseMilkyDestination(position, bound, lastHeading);
      if (target) requestWalk(target, false, true);
      else settle();
    });
  }
  function feed() {
    if (!available() || idleFailed || (bed.active && !canWalk())) return;
    if (!activityReady('eat-low') || !activityReady('eat-lift') || !propReady('bowl')) return;
    notify('feed');
    wakeThenRun(beginFeed);
  }
  function play() {
    if (!available() || idleFailed || (bed.active && !canWalk())) return;
    if (!activityReady('play-bow') || !activityReady('play-reach') || !propReady('ball')) return;
    if (toyOptions) { cancelAction(); clearSession(); }
    notify('play');
    wakeThenRun(() => beginPlay(false));
  }
  function throwBall(offset: Readonly<MilkyPoint>) {
    dragOrigin = undefined;
    if (!ball || !canWalk()) { settle(); return; }
    ball = throwMilkyBall(ball, { x: offset.x / width, y: offset.y / height });
    ballBounds = {
      left: bound({ x: 0, y: ball.y }).x, right: bound({ x: 1, y: ball.y }).x,
      top: bound({ x: ball.x, y: 0 }).y, bottom: bound({ x: ball.x, y: 1 }).y,
    };
    throwAwaitingWake = true;
    ensureTick();
    notify('play');
    wakeThenRun(() => {
      throwAwaitingWake = false;
      if (!ball || !ballBounds) { settle(); return; }
      const landing = predictMilkyBallRest(ball, ballBounds);
      const direction = landing.x < position.x ? -1 : 1;
      const target = { x: landing.x - direction * reachAhead(PAW_REACH_NATIVE, landing.y), y: landing.y };
      walkTo(target, { cadence: 1.4, onDone: () => playRound({ ...planMilkyPlay(), rounds: 1 }, 0, false) });
    });
  }
  function run() {
    // Running is inherently motion: an honest no-op under reduced motion or without a gait.
    if (!canWalk() || idleFailed) return;
    notify('run');
    wakeThenRun(() => { clearSession(); runLeg(planMilkyRun(), 0, facing, false); });
  }
  function keydown(event: KeyboardEvent) {
    const arrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key);
    const posture = event.key.toLowerCase() === 's' ? 'sit' : event.key.toLowerCase() === 'n' ? 'sleep' : undefined;
    if ((!arrow && !posture) || !available() || (arrow && bed.active && !canWalk())) return;
    event.preventDefault();
    if (event.repeat) return;
    keyboardFocused = true;
    clearPhotoIntents();
    if (arrow) {
      notify('walk');
      const key = event.key;
      wakeThenRun(() => requestWalk(milkyKeyboardDestination(position, key, facing, bound), false));
      return;
    }
    // S toggles sitting, N toggles napping. Posture keys are explicit and quiet: no
    // cyber:pet event, and they work under reduced motion as still posture changes.
    if (posture === 'sit') { if (restPoseActive()) wakeThenRun(() => settle()); else restNow('sit'); }
    else { if (button.dataset.pose === 'sleep') wakeThenRun(() => settle()); else restNow('sleep'); }
  }
  function syncActivity() {
    button.dataset.active = String(available());
    button.dataset.animated = String(!motionStopped());
    button.disabled = !available() || idleFailed;
    // Until the atomic set decodes, no art is exposed at all — not even a still v4 idle.
    button.hidden = !floorVisible || idleFailed || !displayReady();
    // Any lifecycle gate (hidden page, modal deactivation, still mode, reduced motion)
    // is a real invalidation boundary: a photo request still waiting on its art or on a
    // bed landing is dropped, so a later decode cannot start a canceled context.
    if (!available() || motionStopped()) { clearPhotoIntents(); settle(); }
    else if (button.dataset.motion === 'idle' && !bed.resume()) { queueRoam(); queueLife(); }
    syncToy();
    notifyPhotoMotions({ type: 'availability' });
  }
  // The whole displayed set demotes together: a v4 face on the idle photo must never
  // alternate with a v3 face inside the gait. v3 remains the verified complete fallback.
  function demote() {
    if (version !== 'v4' || destroyed) return;
    version = 'v3';
    idleDecoded = false;
    gaitReady = false;
    photo?.disable();
    pendingBedPhoto = undefined;
    settle();
    for (const entry of poses) { entry.ready = false; entry.disabled = true; }
    for (const entry of rests) { entry.ready = false; entry.disabled = true; }
    for (const entry of activities) { entry.ready = false; entry.disabled = true; }
    for (const entry of propItems) { entry.ready = false; entry.disabled = true; }
    forwardFailed = true;
    trotFailed = true;
    button.dataset.gaze = 'camera';
    applyArtVersion();
    syncActivity();
  }
  function idleFailure() {
    if (version === 'v4') { demote(); return; }
    if (primaryArtwork) {
      primaryArtwork = false;
      idleDecoded = false;
      settle();
      idleImage.src = `${ASSET_ROOT}maltese-alert.webp`;
      syncActivity();
    } else { idleFailed = true; syncActivity(); }
  }

  idleImage.addEventListener('load', async () => {
    const loadedSrc = idleImage.src;
    try { await idleImage.decode(); } catch {
      if (destroyed || idleImage.src !== loadedSrc) return;
      idleFailure();
      return;
    }
    if (destroyed || idleImage.src !== loadedSrc) return;
    // A v4 idle must genuinely be the contracted 3:2 art; anything else demotes the set.
    if (version === 'v4' && !validPetRatio(idleImage)) { demote(); return; }
    idleDecoded = true;
    button.dataset.artwork = primaryArtwork ? 'photo' : 'fallback';
    button.dataset.identity = primaryArtwork ? version : 'fallback';
    syncActivity();
  }, { signal: listeners.signal });
  idleImage.addEventListener('error', () => {
    if (destroyed) return;
    idleFailure();
  }, { signal: listeners.signal });
  for (const step of steps) {
    step.image.addEventListener('load', async () => {
      const loadedSrc = step.image.src;
      try { await step.image.decode(); } catch {
        if (destroyed || step.image.src !== loadedSrc) return;
        if (version === 'v4') { demote(); return; }
        step.ready = false;
        gaitReady = false;
        settle();
        return;
      }
      if (destroyed || step.image.src !== loadedSrc) return;
      step.ready = validPetRatio(step.image);
      // Malformed required v4 art is a contract failure like any load error: whole-tier fallback.
      if (version === 'v4' && !step.ready) { demote(); return; }
      gaitReady = steps.every((item) => item.ready);
      if (!gaitReady && button.dataset.pose === 'side') settle();
      syncActivity();
    }, { signal: listeners.signal });
    step.image.addEventListener('error', () => {
      if (destroyed) return;
      if (version === 'v4') { demote(); return; }
      step.ready = false;
      gaitReady = false;
      settle();
    }, { signal: listeners.signal });
  }
  for (const entry of poses) {
    entry.image.addEventListener('load', async () => {
      const loadedSrc = entry.image.src;
      try { await entry.image.decode(); } catch { entry.ready = false; return; }
      if (destroyed || entry.disabled || entry.image.src !== loadedSrc || version !== 'v4') return;
      entry.ready = validPetRatio(entry.image);
      queueLife();
    }, { signal: listeners.signal });
    entry.image.addEventListener('error', () => {
      entry.ready = false;
      entry.disabled = true;
    }, { signal: listeners.signal });
  }
  for (const entry of [...rests, ...activities]) {
    entry.image.addEventListener('load', async () => {
      const loadedSrc = entry.image.src;
      try { await entry.image.decode(); } catch (error: unknown) {
        if (!(error instanceof Error)) throw error;
        entry.ready = false;
        syncToy();
        notifyPhotoMotions({ type: 'availability' });
        return;
      }
      if (destroyed || entry.disabled || entry.image.src !== loadedSrc || version !== 'v4') return;
      entry.ready = validPetRatio(entry.image);
      syncToy();
      notifyPhotoMotions({ type: 'availability' });
    }, { signal: listeners.signal });
    entry.image.addEventListener('error', () => {
      entry.ready = false;
      entry.disabled = true;
      syncToy();
      notifyPhotoMotions({ type: 'availability' });
    }, { signal: listeners.signal });
  }
  for (const entry of propItems) {
    entry.image.addEventListener('load', async () => {
      const loadedSrc = entry.image.src;
      try { await entry.image.decode(); } catch (error: unknown) {
        if (!(error instanceof Error)) throw error;
        entry.ready = false;
        syncToy();
        return;
      }
      if (destroyed || entry.disabled || entry.image.src !== loadedSrc || version !== 'v4') return;
      entry.ready = validPropRatio(entry.image);
      syncToy();
    }, { signal: listeners.signal });
    entry.image.addEventListener('error', () => {
      entry.ready = false;
      entry.disabled = true;
      syncToy();
    }, { signal: listeners.signal });
  }
  // The forward-look set is all-or-nothing: any missing, malformed or undecodable file
  // disables the whole set (never a demotion — the camera-look v4 gait keeps working).
  for (const entry of [...(forwardIdle ? [forwardIdle] : []), ...forwardSteps]) {
    entry.image.addEventListener('load', async () => {
      const loadedSrc = entry.image.src;
      try { await entry.image.decode(); } catch {
        if (!destroyed && entry.image.src === loadedSrc) forwardFailed = true;
        return;
      }
      if (destroyed || entry.image.src !== loadedSrc || forwardFailed) return;
      if (!validPetRatio(entry.image)) { forwardFailed = true; return; }
      entry.ready = true;
    }, { signal: listeners.signal });
    entry.image.addEventListener('error', () => { forwardFailed = true; }, { signal: listeners.signal });
  }
  // The trot tier is equally all-or-nothing; a failure only loses the trot, never a walk.
  for (const entry of trotSteps) {
    entry.image.addEventListener('load', async () => {
      const loadedSrc = entry.image.src;
      try { await entry.image.decode(); } catch {
        if (!destroyed && entry.image.src === loadedSrc) trotFailed = true;
        return;
      }
      if (destroyed || entry.image.src !== loadedSrc || trotFailed) return;
      if (!validPetRatio(entry.image)) { trotFailed = true; return; }
      entry.ready = true;
    }, { signal: listeners.signal });
    entry.image.addEventListener('error', () => { trotFailed = true; }, { signal: listeners.signal });
  }
  button.addEventListener('click', pet, { signal: listeners.signal });
  button.addEventListener('keydown', keydown, { signal: listeners.signal });
  for (const control of [button, ...propItems.flatMap((entry) => entry.target ? [entry.target] : [])]) {
    control.addEventListener('pointerdown', () => { keyboardFocused = false; }, { signal: listeners.signal });
    control.addEventListener('focus', () => {
      keyboardFocused = control.matches(':focus-visible');
      if (keyboardFocused) {
        clearTimeout(roamTimer);
        roamTimer = undefined;
        if (autonomousAction) gentleSettle();
      }
    }, { signal: listeners.signal });
    control.addEventListener('blur', () => { keyboardFocused = false; queueRoam(); queueLife(); }, { signal: listeners.signal });
  }
  page.addEventListener('visibilitychange', syncActivity, { signal: listeners.signal });
  reducedMotion.addEventListener('change', syncActivity, { signal: listeners.signal });
  const introObserver = studio ? new MutationObserver(() => {
    if (studio.dataset.intro === 'visible') {
      clearTimeout(roamTimer);
      roamTimer = undefined;
      if (autonomousAction) gentleSettle();
    } else { queueRoam(); queueLife(); }
  }) : undefined;
  if (studio) introObserver?.observe(studio, { attributes: true, attributeFilter: ['data-intro'] });
  // Props paint BENEATH the dog (CSS z-index: button 1, props 0): the lowered face eats
  // over the bowl rim instead of the opaque bowl covering the eyes and muzzle. Smallest
  // correct depth ordering; DOM order and art unchanged.
  host.append(button, propsLayer);
  const observer = new ResizeObserver(resize);
  observer.observe(scene);
  observer.observe(host);
  function resize() {
    if (destroyed) return;
    grounded?.rest(); groundedIdle = false;
    // Relayout invalidates the geometry a pending photo request was accepted under.
    clearPhotoIntents();
    toyDrag?.cancel();
    if (dragOrigin) { dragOrigin = undefined; gentleSettle(); }
    const viewport = scene.getBoundingClientRect();
    const room = host.getBoundingClientRect();
    width = host.clientWidth || room.width;
    height = host.clientHeight || room.height;
    portrait = viewport.width / viewport.height < 4 / 3;
    floorVisible = milkyHasVisibleFloor(room, viewport, floorBounds);
    button.dataset.portrait = String(portrait);
    propsLayer.dataset.portrait = String(portrait);
    if (!placed) {
      position = { x: portrait ? .595 : .58, y: portrait ? .84 : .865 };
      placed = viewport.width > 0 && viewport.height > 0;
    }
    const visitingBed = bed.active;
    bed.revalidate();
    if (!bed.active && (walk || button.dataset.motion !== 'idle')) settle();
    if (floorVisible && !bed.active) position = bound(position);
    if (visitingBed && !bed.active) button.dataset.bed = 'false';
    renderPosition();
    if (toyOptions && ball) { ball = milkyBallAtRest(bound(ball)); renderBall(); }
    syncActivity();
  }
  const toyTarget = prop('ball')?.target;
  const toyDrag = toyOptions?.drag && toyTarget ? mountMilkyToyDrag(toyTarget, {
    available: () => canWalk() && !toyTarget.disabled,
    start: () => {
      clearPhotoIntents();
      cancelAction();
      throwAwaitingWake = false;
      if (ball) { ball = milkyBallAtRest(bound(ball)); dragOrigin = { x: ball.x, y: ball.y }; renderBall(); }
      const bowl = prop('bowl');
      if (bowl) bowl.wrap.dataset.visible = 'false';
      if (!busyPoseActive()) { showIdle(); button.dataset.motion = 'watching'; }
    },
    move: (offset) => {
      if (!dragOrigin) return;
      ball = milkyBallAtRest(bound({ x: dragOrigin.x + offset.x / width, y: dragOrigin.y + offset.y / height }));
      renderBall();
    },
    release: throwBall,
    cancel: () => { dragOrigin = undefined; gentleSettle(); },
  }, listeners.signal) : undefined;
  for (const entry of poses) {
    registerArt(entry.image);
    entry.image.src = `${ASSET_ROOT}milky-v4-${entry.name}.webp`;
  }
  for (const entry of rests) {
    const [dx, dy] = REST_TRANSLATE[entry.name];
    const v4 = MILKY_ART.v4;
    registerArt(entry.image, `${v4.x + dx / 1536 * v4.scale * 100}%`, `${v4.y + dy / 1024 * v4.scale * 100}%`);
    entry.image.src = `${ASSET_ROOT}milky-rest-${entry.name}.webp`;
  }
  // Final per-pose registration from the delivered activity art measurements.
  for (const entry of activities) {
    const [dx, dy] = ACTIVITY_TRANSLATE[entry.name];
    const v4 = MILKY_ART.v4;
    registerArt(entry.image, `${v4.x + dx / 1536 * v4.scale * 100}%`, `${v4.y + dy / 1024 * v4.scale * 100}%`);
    entry.image.src = `${ASSET_ROOT}milky-${entry.name}.webp`;
  }
  if (forwardIdle) {
    registerArt(forwardIdle.image);
    forwardIdle.image.src = `${ASSET_ROOT}milky-forward-idle.webp`;
  }
  forwardSteps.forEach((entry, index) => {
    const v4 = MILKY_ART.v4;
    registerArt(entry.image, undefined, `${v4.y + FORWARD_STEP_OFFSET_Y[index] / 1024 * v4.scale * 100}%`);
    entry.image.src = `${ASSET_ROOT}milky-forward-step-${index}.webp`;
  });
  trotSteps.forEach((entry, index) => {
    const v4 = MILKY_ART.v4;
    registerArt(entry.image, undefined, `${v4.y + 28 / 1024 * v4.scale * 100}%`);
    entry.image.src = `${ASSET_ROOT}milky-trot-${index}.webp`;
  });
  for (const entry of propItems) entry.image.src = propOverrides[entry.name]?.src ?? `${ASSET_ROOT}milky-prop-${entry.name}.webp`;
  applyArtVersion();
  resize();
  return {
    pet,
    sit() { restNow('sit'); },
    sleep() { restNow('sleep'); },
    napInBed() {
      clearPhotoIntents();
      if (!bed.available() || !restReady('sleep')) return false;
      wakeThenRun(() => bed.enter([{ pose: 'sleep', hold: milkyExplicitRestHold('sleep') }], false));
      return true;
    },
    feed,
    play,
    run,
    photoMotion,
    canPhotoMotion,
    subscribePhotoMotions(listener) {
      if (!destroyed) photoSubscribers.add(listener);
      return () => { photoSubscribers.delete(listener); };
    },
    setAnimated(enabled) { if (!destroyed && animated !== enabled) { animated = enabled; syncActivity(); } },
    setActive(nextActive) { if (!destroyed) { active = nextActive; syncActivity(); } },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      photoSubscribers.clear();
      cancelAction();
      grounded?.destroy();
      photo?.disable();
      pendingBedPhoto = undefined;
      bed.destroy();
      clearSession();
      listeners.abort();
      observer.disconnect();
      introObserver?.disconnect();
      button.remove();
      propsLayer.remove();
    },
  };
}
