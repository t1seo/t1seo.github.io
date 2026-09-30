import './cyber-pet.css';
import { placeMilky, milkyHasVisibleFloor, type MilkyPoint } from './cyber-pet-geometry';
import { createMilkyWalk, sampleMilkyWalk, milkyCanContinue, milkyDepthScale, milkyDistance, milkyStride, milkyGaitStride, milkyGaitFrame, type MilkyWalk } from './cyber-pet-motion';
import { chooseMilkyDestination, milkyKeyboardDestination, milkyRoamPause, type MilkyHeading } from './cyber-pet-roam';
import { planMilkyIdleMoment, milkySniffHold, milkyGreetHold, MILKY_BLINK_GAP, type MilkyIdleMoment } from './cyber-pet-life';
import { planMilkyRestCycle, milkyRestTransitionHold, milkyStandHold, milkyExplicitRestHold, type MilkyRestPoseName } from './cyber-pet-rest';
import { planMilkyMeal, planMilkyPlay, planMilkyRun, milkyBallAtRest, milkyNudgeBall, stepMilkyBall, type MilkyActivityPoseName, type MilkyBallState, type MilkyBallBounds } from './cyber-pet-activity';

export interface CyberPetController {
  /** Milky notices you and chooses a small walk across the visible floor. */
  pet(): void;
  /** Milky settles onto her haunches for a while. A no-op until the sit art is decoded. */
  sit(): void;
  /** Milky lies down and naps (deepest delivered rest pose). Waking is gentle. */
  sleep(): void;
  /** Milky walks to a real bowl and eats. A no-op until the eat poses and bowl decode. */
  feed(): void;
  /** Milky bows, nudges and chases a small rolling ball. Needs the play poses and ball. */
  play(): void;
  /** A brisk trot across the floor: the distance-linked gait at a faster cadence. */
  run(): void;
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
interface MilkyArt { scale: number; x: number; y: number; stepOffsetX: number[] }
const art = (centerX: number, groundY: number, scale: number, stepOffsetX: number[]): MilkyArt => ({
  scale,
  x: (.5 - centerX / 1536) * scale * 100,
  y: (.94 - groundY / 1024) * scale * 100,
  stepOffsetX,
});
const MILKY_ART: Record<MilkyArtVersion, MilkyArt> = {
  v4: art(795, 970, .847, [0, 0, 0, 0, 0, 0, 0, 0]),
  v3: art(811, 973, .82, [.49, .01, -.20, .93, 5.73, 2.15, 2.44, 2.08]),
};
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
 * Only listed files are requested (no 404s for unproduced art). The optional sitdown/wake
 * transitionals are implemented but dormant until root confirms and lists them.
 */
export const MILKY_SHIPPED_REST: readonly MilkyRestPoseName[] = ['sit', 'drowsy', 'sleep'];
// Delivered rest registration (milky-rest-registration.json): translate each pose's
// support-footprint anchor (sit 889/977, drowsy 932/951, sleep 898/915) onto the shared
// floor point (795, 970) at the common .847 scale. Transitionals ship unadjusted.
const REST_TRANSLATE: Record<MilkyRestPoseName, readonly [number, number]> = {
  sit: [-94, -7], drowsy: [-137, 19], sleep: [-103, 55], sitdown: [0, 0], wake: [0, 0],
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
  const shadow = page.createElement('span');
  shadow.className = 'cyber-pet-shadow';
  shadow.setAttribute('aria-hidden', 'true');
  const figure = page.createElement('span');
  figure.className = 'cyber-pet-figure';
  button.append(shadow, figure);
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
  propsLayer.setAttribute('aria-hidden', 'true');
  const propItems = PROP_NAMES.filter((name) => shippedActivity.includes(`prop-${name}` as MilkyActivityAsset)).map((name) => {
    const wrap = page.createElement('span');
    wrap.className = 'cyber-pet-prop';
    wrap.dataset.prop = name;
    wrap.dataset.visible = 'false';
    const propShadow = page.createElement('span');
    propShadow.className = 'cyber-pet-prop-shadow';
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
    propsLayer.append(wrap);
    return { name, wrap, image, ready: false, disabled: false };
  });

  let active = true;
  let destroyed = false;
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
  let walk: { plan: MilkyWalk; started: number; travelled: number; stride: number; autonomous: boolean; onDone?: () => void } | undefined;
  let ball: MilkyBallState | undefined;
  let ballBounds: MilkyBallBounds | undefined;
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
  const canWalk = () => available() && primaryArtwork && gaitReady && !reducedMotion.matches;
  const passiveAvailable = () => canWalk() && !keyboardFocused && studio?.dataset.intro !== 'visible';
  const bound = (point: MilkyPoint) => placeMilky(host.getBoundingClientRect(), scene.getBoundingClientRect(), point);
  const poseReady = (name: MilkyPoseName) => version === 'v4' && (poses.find((entry) => entry.name === name)?.ready ?? false);
  const restReady = (name: MilkyRestPoseName) => version === 'v4' && (rests.find((entry) => entry.name === name)?.ready ?? false);
  const activityReady = (name: MilkyActivityPoseName) => version === 'v4' && (activities.find((entry) => entry.name === name)?.ready ?? false);
  const propReady = (name: (typeof PROP_NAMES)[number]) => version === 'v4' && (propItems.find((entry) => entry.name === name)?.ready ?? false);
  const prop = (name: (typeof PROP_NAMES)[number]) => propItems.find((entry) => entry.name === name);
  const restPoseActive = () => (REST_NAMES as readonly string[]).includes(button.dataset.pose ?? '');
  const busyPoseActive = () => restPoseActive() || (ACTIVITY_NAMES as readonly string[]).includes(button.dataset.pose ?? '');
  const forwardActive = () => version === 'v4' && !forwardFailed && (forwardIdle?.ready ?? false) && forwardSteps.length === 8 && forwardSteps.every((entry) => entry.ready);
  const trotActive = () => version === 'v4' && !trotFailed && trotSteps.length === 4 && trotSteps.every((entry) => entry.ready);

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
      registerArt(step.image, `${registration.x - registration.stepOffsetX[index] / 1536 * registration.scale * 100}%`);
      step.image.src = `${ASSET_ROOT}${stepAsset(version, index)}`;
    }
    registerArt(idleImage);
    idleImage.src = `${ASSET_ROOT}${idleAsset(version)}`;
  }
  function cancelAction() {
    actionRevision++;
    view.cancelAnimationFrame(tickHandle);
    tickHandle = 0;
    clearTimeout(actionTimer);
    clearTimeout(roamTimer);
    clearTimeout(lifeTimer);
    actionTimer = roamTimer = lifeTimer = undefined;
    walk = undefined;
    autonomousAction = false;
    currentSpeed = 0;
  }
  /** A finished session leaves no toy or bowl behind. Called from settle and destroy. */
  function clearSession() {
    ball = undefined;
    ballBounds = undefined;
    for (const entry of propItems) entry.wrap.dataset.visible = 'false';
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
  function renderProp(entry: (typeof propItems)[number], point: MilkyPoint, lift = 0) {
    const depth = milkyDepthScale(point.y);
    entry.wrap.style.transform = `translate3d(${(point.x * width).toFixed(2)}px, ${(point.y * height).toFixed(2)}px, 0) translate(-50%, -100%) scale(${depth.toFixed(4)})`;
    entry.wrap.style.setProperty('--milky-prop-lift', `${(-lift * height).toFixed(2)}px`);
    entry.wrap.style.setProperty('--milky-prop-shadow', Math.max(.15, 1 - lift * 12).toFixed(3));
  }
  function showProp(name: (typeof PROP_NAMES)[number], point: MilkyPoint) {
    const entry = prop(name);
    if (!entry) return;
    entry.wrap.dataset.facing = facing < 0 ? 'left' : 'right';
    entry.wrap.dataset.visible = 'true';
    renderProp(entry, point);
  }
  function renderBall() {
    const entry = prop('ball');
    if (entry && ball) renderProp(entry, { x: ball.x, y: ball.y }, ball.h);
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
      gaitPhase += Math.max(0, sample.distance - walk.travelled) / walk.stride;
      walk.travelled = sample.distance;
      currentSpeed = sample.speed;
      position = sample.position;
      renderPosition();
      spriteFrame(milkyGaitFrame(gaitPhase, currentFrames));
      if (sample.done) finishWalk();
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
      if (spark < .05 && propReady('ball') && activityReady('play-bow') && activityReady('play-reach') && !reducedMotion.matches) {
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
      // A rest pause may deepen into sitting, lying and napping instead of another walk.
      const restPlan = planMilkyRestCycle({ sit: restReady('sit'), drowsy: restReady('drowsy'), sleep: restReady('sleep') });
      if (restPlan.length > 0) { startAutonomousRest(restPlan); return; }
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
    if (lifeTimer !== undefined || !available() || reducedMotion.matches || version !== 'v4') return;
    if (button.dataset.motion !== 'idle' || button.dataset.pose !== 'idle') return;
    // Micro-poses are camera-look art; they never blink a front face onto a forward gaze.
    if (button.dataset.gaze === 'forward') return;
    const moment = planMilkyIdleMoment({ blink: poseReady('blink'), attend: poseReady('attend'), sniff: poseReady('sniff') });
    if (!moment) return;
    lifeTimer = setTimeout(() => { lifeTimer = undefined; playMoment(moment); }, moment.delay);
  }
  function playMoment(moment: MilkyIdleMoment, second = false) {
    if (!available() || reducedMotion.matches || button.dataset.motion !== 'idle' || !poseReady(moment.kind)) return;
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
    cancelAction();
    clearSession();
    button.dataset.motion = 'idle';
    showIdle();
    // At quiet rest Milky mostly looks ahead rather than staring at the camera; the
    // camera-look idle remains the greeting face and the only base for blinking.
    button.dataset.gaze = forwardActive() && Math.random() < .75 ? 'forward' : 'camera';
    queueRoam(afterWalk);
    queueLife();
  }
  // ---- Rest and activity cycles: held raster postures at a fixed floor point. No
  // crossfades, no sliding, no CSS squashing; transitions are short still holds. ----
  type MilkyPoseStep = { pose: string; hold: number; motion?: string };
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
  function finishRest(revision: number) {
    if (revision !== actionRevision) return;
    showIdle();
    button.dataset.motion = 'settling';
    actionTimer = setTimeout(() => {
      actionTimer = undefined;
      if (revision === actionRevision) settle();
    }, milkyStandHold());
  }
  function startAutonomousRest(stages: { pose: 'sit' | 'drowsy' | 'sleep'; hold: number }[]) {
    cancelAction();
    autonomousAction = true;
    const revision = actionRevision;
    const steps: MilkyPoseStep[] = [];
    if (stages[0]?.pose === 'sit' && restReady('sitdown')) steps.push({ pose: 'sitdown', hold: milkyRestTransitionHold('sitdown') });
    steps.push(...stages);
    if (stages.at(-1)?.pose === 'sleep' && restReady('wake')) steps.push({ pose: 'wake', hold: milkyRestTransitionHold('wake') });
    playPoseSteps(steps, 0, revision, () => finishRest(revision));
  }
  /** Explicit sit/nap request from the controller API or the S/N keys. */
  function restNow(kind: 'sit' | 'sleep') {
    if (!available() || idleFailed) return;
    const deepest: MilkyRestPoseName | undefined = kind === 'sit'
      ? (restReady('sit') ? 'sit' : undefined)
      : restReady('sleep') ? 'sleep' : restReady('drowsy') ? 'drowsy' : restReady('sit') ? 'sit' : undefined;
    if (!deepest) return;
    const fromPose = button.dataset.pose ?? 'idle';
    cancelAction();
    clearSession();
    if (reducedMotion.matches) {
      // A still posture change on explicit request only: no timers, no auto-progression.
      button.dataset.pose = deepest;
      button.dataset.motion = deepest === 'sleep' ? 'sleeping' : 'resting';
      return;
    }
    const revision = actionRevision;
    const steps: MilkyPoseStep[] = [];
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
  function wakeThenRun(next: () => void) {
    if (!busyPoseActive()) { next(); return; }
    const fromSleep = button.dataset.pose === 'sleep';
    cancelAction();
    if (ball && !ball.resting) ensureTick();
    if (reducedMotion.matches) { showIdle(); button.dataset.motion = 'idle'; next(); return; }
    const revision = actionRevision;
    const steps: MilkyPoseStep[] = fromSleep && restReady('wake')
      ? [{ pose: 'wake', hold: milkyRestTransitionHold('wake') }]
      : [];
    playPoseSteps(steps, 0, revision, () => {
      if (revision !== actionRevision) return;
      showIdle();
      button.dataset.motion = 'waking';
      actionTimer = setTimeout(() => {
        actionTimer = undefined;
        if (revision !== actionRevision) return;
        button.dataset.motion = 'idle';
        next();
      }, milkyStandHold());
    });
  }
  const gentleSettle = () => { if (busyPoseActive() && !reducedMotion.matches) wakeThenRun(() => settle()); else settle(); };
  function finishWalk() {
    const done = walk?.onDone;
    walk = undefined;
    currentSpeed = 0;
    // A short still pause preserves the real dog's identity instead of swapping to a new face.
    // The stride was fitted so this walk ended near phase 4, whose stance matches the photo.
    button.dataset.motion = 'settling';
    showIdle();
    const revision = actionRevision;
    actionTimer = setTimeout(() => {
      actionTimer = undefined;
      if (revision !== actionRevision) return;
      if (done) done();
      else settle(true);
    }, done ? 200 : 320);
  }
  function startWalk(target: MilkyPoint, autonomous: boolean, initialSpeed = 0, opts?: { cadence?: number; onDone?: () => void }) {
    if (!canWalk() || (autonomous && !passiveAvailable())) { settle(); return; }
    if (milkyDistance(position, target) < .002 || Math.abs(target.x - position.x) < .008) { settle(); return; }
    const bodyWidth = (portrait ? .11 : .14) * .66 * milkyDepthScale(position.y);
    // Phase 4 begins from the planted hind-paw position closest to the standing photo.
    // A same-heading continuation keeps its accumulated phase so no limb jumps.
    if (initialSpeed === 0) gaitPhase = .5;
    const stride = milkyGaitStride(milkyStride(bodyWidth), milkyDistance(position, target), gaitPhase);
    // A compatible retarget may fit a slightly different stride. Never let that clamp the
    // carried momentum: the cruise speed rises to meet it, keeping the join continuous,
    // and frames stay distance-driven so a faster cadence cannot skate. A brisk cadence
    // (run/chase) raises the cruise speed the same distance-linked way.
    const speed = Math.max(stride / .72 * (opts?.cadence ?? 1), initialSpeed);
    facing = target.x < position.x ? -1 : 1;
    button.dataset.facing = facing < 0 ? 'left' : 'right';
    lastHeading = { x: target.x - position.x, y: target.y - position.y };
    const plan = createMilkyWalk(position, target, speed, initialSpeed);
    actionRevision++;
    autonomousAction = autonomous;
    button.dataset.motion = 'walking';
    // One walk uses one frame set, fixed for the whole leg — never mixed mid-walk. A
    // brisk leg (cadence > 1.25) may use the atomic 4-frame trot when all four decoded;
    // otherwise the honest faster-stepped walk frames stand in.
    const brisk = (opts?.cadence ?? 1) > 1.25;
    currentSteps = brisk && trotActive() ? trotSteps : forwardActive() ? forwardSteps : steps;
    currentFrames = currentSteps.length;
    walk = { plan, started: view.performance.now(), travelled: 0, stride, autonomous, onDone: opts?.onDone };
    spriteFrame(milkyGaitFrame(gaitPhase, currentFrames));
    ensureTick();
  }
  /** Internal targeted walk for activity sessions, with a turn pause and a completion hook. */
  function walkTo(destination: MilkyPoint, opts: { autonomous?: boolean; cadence?: number; onDone?: () => void }) {
    const target = bound(destination);
    const turning = (target.x < position.x ? -1 : 1) !== facing;
    cancelAction();
    if (ball && !ball.resting) ensureTick();
    if (!canWalk()) { settle(); return; }
    if (milkyDistance(position, target) < .002 || Math.abs(target.x - position.x) < .008) {
      if (opts.onDone) opts.onDone(); else settle();
      return;
    }
    if (busyPoseActive()) showIdle();
    autonomousAction = opts.autonomous ?? false;
    if (!turning) { startWalk(target, autonomousAction, 0, opts); return; }
    showIdle();
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
    const turning = (target.x < position.x ? -1 : 1) !== facing;
    cancelAction();
    if (!canWalk()) { button.dataset.motion = 'idle'; showIdle(); return; }
    if (milkyDistance(position, target) < .002 || Math.abs(target.x - position.x) < .008) { settle(); return; }
    // Safety net: a walk may never start from a resting silhouette; wakeThenRun is the
    // normal path, but any direct call stands the dog up first.
    if (restPoseActive()) showIdle();
    if (carry > 0) { startWalk(target, autonomous, carry); return; }
    // A still, three-quarter glance precedes the turn. Never fake a 3D turn by squashing the dog.
    // A greeted, same-heading walk instead holds the happy look up toward the viewer.
    showIdle();
    const attending = greeting && !turning && poseReady('attend');
    if (attending) button.dataset.pose = 'attend';
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
    (portrait ? .11 : .14) * .847 * (nativeAhead / 1536) * milkyDepthScale(depthY);
  function beginFeed() {
    cancelAction();
    clearSession();
    const muzzleReach = (depthY: number) => reachAhead(MUZZLE_AHEAD_NATIVE, depthY);
    if (reducedMotion.matches) {
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
    const { point: ballSpot, direction } = spotAhead(.09);
    ball = milkyBallAtRest(ballSpot);
    ballBounds = {
      left: bound({ x: 0, y: ballSpot.y }).x,
      right: bound({ x: 1, y: ballSpot.y }).x,
      top: bound({ x: ballSpot.x, y: 0 }).y,
      bottom: bound({ x: ballSpot.x, y: 1 }).y,
    };
    showProp('ball', ballSpot);
    renderBall();
    if (reducedMotion.matches) {
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
            else finishRest(actionRevision);
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
    const next = leg + 1 < plan.legs ? () => runLeg(plan, leg + 1, Math.random() < .6 ? -dir : dir, autonomous) : undefined;
    walkTo(target, { autonomous, cadence: plan.cadence, onDone: next });
  }
  function notify(kind: 'greet' | 'walk' | 'feed' | 'play' | 'run') {
    host.dispatchEvent(new CustomEvent('cyber:pet', { bubbles: true, detail: { kind } }));
  }
  function pet() {
    if (!available() || idleFailed) return;
    notify('greet');
    // A greeting is the one moment Milky deliberately looks up at the camera.
    button.dataset.gaze = 'camera';
    wakeThenRun(() => {
      const target = chooseMilkyDestination(position, bound, lastHeading);
      if (target) requestWalk(target, false, true);
      else settle();
    });
  }
  function feed() {
    if (!available() || idleFailed) return;
    if (!activityReady('eat-low') || !activityReady('eat-lift') || !propReady('bowl')) return;
    notify('feed');
    wakeThenRun(beginFeed);
  }
  function play() {
    if (!available() || idleFailed) return;
    if (!activityReady('play-bow') || !activityReady('play-reach') || !propReady('ball')) return;
    notify('play');
    wakeThenRun(() => beginPlay(false));
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
    if ((!arrow && !posture) || !available()) return;
    event.preventDefault();
    if (event.repeat) return;
    keyboardFocused = true;
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
    button.disabled = !available() || idleFailed;
    // Until the atomic set decodes, no art is exposed at all — not even a still v4 idle.
    button.hidden = !floorVisible || idleFailed || !displayReady();
    if (!available() || reducedMotion.matches) settle();
    else if (button.dataset.motion === 'idle') { queueRoam(); queueLife(); }
  }
  // The whole displayed set demotes together: a v4 face on the idle photo must never
  // alternate with a v3 face inside the gait. v3 remains the verified complete fallback.
  function demote() {
    if (version !== 'v4' || destroyed) return;
    version = 'v3';
    idleDecoded = false;
    gaitReady = false;
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
      try { await entry.image.decode(); } catch { entry.ready = false; return; }
      if (destroyed || entry.disabled || entry.image.src !== loadedSrc || version !== 'v4') return;
      entry.ready = validPetRatio(entry.image);
    }, { signal: listeners.signal });
    entry.image.addEventListener('error', () => {
      entry.ready = false;
      entry.disabled = true;
    }, { signal: listeners.signal });
  }
  for (const entry of propItems) {
    entry.image.addEventListener('load', async () => {
      const loadedSrc = entry.image.src;
      try { await entry.image.decode(); } catch { entry.ready = false; return; }
      if (destroyed || entry.disabled || entry.image.src !== loadedSrc || version !== 'v4') return;
      entry.ready = validPropRatio(entry.image);
    }, { signal: listeners.signal });
    entry.image.addEventListener('error', () => {
      entry.ready = false;
      entry.disabled = true;
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
  button.addEventListener('pointerdown', () => { keyboardFocused = false; }, { signal: listeners.signal });
  button.addEventListener('focus', () => {
    keyboardFocused = button.matches(':focus-visible');
    if (keyboardFocused) {
      clearTimeout(roamTimer);
      roamTimer = undefined;
      if (autonomousAction) gentleSettle();
    }
  }, { signal: listeners.signal });
  button.addEventListener('blur', () => { keyboardFocused = false; queueRoam(); queueLife(); }, { signal: listeners.signal });
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
    const viewport = scene.getBoundingClientRect();
    const room = host.getBoundingClientRect();
    width = host.clientWidth || room.width;
    height = host.clientHeight || room.height;
    portrait = viewport.width / viewport.height < 4 / 3;
    floorVisible = milkyHasVisibleFloor(room, viewport);
    button.dataset.portrait = String(portrait);
    propsLayer.dataset.portrait = String(portrait);
    if (!placed) {
      position = { x: portrait ? .595 : .58, y: portrait ? .84 : .865 };
      placed = viewport.width > 0 && viewport.height > 0;
    }
    if (walk || button.dataset.motion !== 'idle') settle();
    if (floorVisible) position = bound(position);
    renderPosition();
    syncActivity();
  }
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
    registerArt(entry.image);
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
    feed,
    play,
    run,
    setActive(nextActive) { if (!destroyed) { active = nextActive; syncActivity(); } },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAction();
      clearSession();
      listeners.abort();
      observer.disconnect();
      introObserver?.disconnect();
      button.remove();
      propsLayer.remove();
    },
  };
}
