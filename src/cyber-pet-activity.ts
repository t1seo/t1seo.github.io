import type { MilkyRandom } from './cyber-pet-roam.ts';
import type { MilkyPoint } from './cyber-pet-geometry.ts';

/**
 * Pure planning and toy physics for Milky's activities: meals at a real bowl, play with a
 * small rolling ball, and brisk trotting. Everything renders as held raster postures and a
 * genuinely moving prop — no whole-body fades, deformation or teleporting. The ball obeys
 * modest gravity, rolling friction and wall bounces inside the actual visible floor.
 */
export type MilkyActivityPoseName = 'eat-low' | 'eat-lift' | 'play-bow' | 'play-reach';
export type MilkyPropName = 'bowl' | 'ball';

const unit = (random: MilkyRandom) => Math.max(0, Math.min(0.999999, random()));

export interface MilkyMealBite { pose: 'eat-low' | 'eat-lift'; hold: number }

/** A short meal: lowered bites alternating with brief chewing lifts, ending head-raised. */
export function planMilkyMeal(random: MilkyRandom = Math.random): MilkyMealBite[] {
  const bites = 3 + Math.floor(unit(random) * 3);
  const steps: MilkyMealBite[] = [];
  for (let i = 0; i < bites; i++) {
    steps.push({ pose: 'eat-low', hold: 1400 + unit(random) * 1200 });
    steps.push({ pose: 'eat-lift', hold: 520 + unit(random) * 520 });
  }
  steps[steps.length - 1].hold = 900 + unit(random) * 700;
  return steps;
}

export interface MilkyPlayPlan { rounds: number; bowHold: number; reachHold: number }

/** A short, discoverable play session: bow, nudge, chase — once or twice, then rest. */
export function planMilkyPlay(random: MilkyRandom = Math.random): MilkyPlayPlan {
  return {
    rounds: unit(random) < .4 ? 2 : 1,
    bowHold: 520 + unit(random) * 380,
    reachHold: 420 + unit(random) * 300,
  };
}

export interface MilkyRunPlan { legs: number; cadence: number }

/**
 * Brisk stepping of the existing distance-linked gait (~1.4× cadence). This is honestly a
 * hurried light trot of the walk poses, not authored running anatomy (see activity brief).
 */
export function planMilkyRun(random: MilkyRandom = Math.random): MilkyRunPlan {
  return { legs: 2 + (unit(random) < .5 ? 1 : 0), cadence: 1.32 + unit(random) * .16 };
}

/** Ball state in normalized room units; h is height above the floor in room-height units. */
export interface MilkyBallState {
  x: number;
  y: number;
  h: number;
  vx: number;
  vy: number;
  vh: number;
  resting: boolean;
}
export interface MilkyBallBounds { left: number; right: number; top: number; bottom: number }

export function milkyBallAtRest(point: MilkyPoint): MilkyBallState {
  return { x: point.x, y: point.y, h: 0, vx: 0, vy: 0, vh: 0, resting: true };
}

/** A paw/nose nudge: a modest hop forward in the facing direction with a hint of depth. */
export function milkyNudgeBall(state: MilkyBallState, direction: number, random: MilkyRandom = Math.random): MilkyBallState {
  return {
    ...state,
    vx: direction * (.085 + unit(random) * .055),
    vy: (unit(random) * 2 - 1) * .02,
    vh: .16 + unit(random) * .10,
    h: Math.max(state.h, .002),
    resting: false,
  };
}

const GRAVITY = 1.15;
const ROLL_FRICTION = 1.9;
const BOUNCE = .42;
const WALL_BOUNCE = .45;
// A rebound must be able to lift the ball at least this visible height (room-height
// units) or the ball settles onto the floor. Comparing rebound ENERGY, not a per-step
// velocity that each step's gravity re-inflates, keeps settling dt-robust: a fixed-point
// micro-bounce like vh = BOUNCE·G·dt/(1+BOUNCE) can otherwise persist forever at low fps.
const MIN_HOP = .0006;

/** One physics step; pure. The ball never leaves the given visible-floor bounds. */
export function stepMilkyBall(state: MilkyBallState, dt: number, bounds: MilkyBallBounds): MilkyBallState {
  if (state.resting || !(dt > 0)) return state;
  const step = Math.min(dt, .1);
  let { x, y, h, vx, vy, vh } = state;
  x += vx * step;
  y += vy * step;
  if (h > 0 || vh > 0) {
    vh -= GRAVITY * step;
    h += vh * step;
    if (h <= 0) {
      h = 0;
      const rebound = -vh * BOUNCE;
      vh = rebound > 0 && rebound * rebound / (2 * GRAVITY) > MIN_HOP ? rebound : 0;
    }
  } else {
    const decay = Math.exp(-ROLL_FRICTION * step);
    vx *= decay;
    vy *= decay;
  }
  if (x < bounds.left) { x = bounds.left; vx = Math.abs(vx) * WALL_BOUNCE; }
  else if (x > bounds.right) { x = bounds.right; vx = -Math.abs(vx) * WALL_BOUNCE; }
  if (y < bounds.top) { y = bounds.top; vy = Math.abs(vy) * WALL_BOUNCE; }
  else if (y > bounds.bottom) { y = bounds.bottom; vy = -Math.abs(vy) * WALL_BOUNCE; }
  const resting = h === 0 && vh === 0 && Math.hypot(vx, vy) < .004;
  return { x, y, h, vx: resting ? 0 : vx, vy: resting ? 0 : vy, vh, resting };
}
