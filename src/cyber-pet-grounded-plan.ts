import { GROUNDED_ART, GROUNDED_FEET, GROUNDED_LIMBS } from './cyber-pet-grounded-geometry.ts';
import type { GroundPoint, GroundedFoot } from './cyber-pet-grounded-geometry.ts';
export type GroundedRoute = {
  readonly from: GroundPoint; readonly to: GroundPoint; readonly scale: number;
  readonly endScale: number; readonly facing: 1 | -1;
  readonly scaleAt?: (progress: number) => number;
};
export type GroundedStep = {
  readonly lift: number; readonly land: number; readonly from: GroundPoint; readonly to: GroundPoint;
  readonly height: number; readonly initialLift: number; readonly velocity: GroundPoint; readonly liftVelocity: number;
};
export type GroundedPlan = {
  readonly route: GroundedRoute; readonly distance: number;
  readonly initialLoad: number; readonly loadRelease: number; readonly initial: Readonly<GroundedPose>; readonly steps: Readonly<Record<GroundedFoot, readonly GroundedStep[]>>;
};
// Mutable sampling buffers carry world contact, lift and distance derivatives through retargets.
export interface GroundedFootSample {
  x: number; y: number; contact: boolean; lift: number;
  velocityX: number; velocityY: number; liftVelocity: number; nextLift: number; untilLand: number;
}
export type GroundedPose = Record<GroundedFoot, GroundedFootSample>;
export function createGroundedPose(): GroundedPose {
  const foot = () => ({ x: 0, y: 0, contact: true, lift: 0, velocityX: 0, velocityY: 0, liftVelocity: 0, nextLift: 0, untilLand: 0 });
  return { nearHind: foot(), nearFore: foot(), farHind: foot(), farFore: foot() };
}
const smooth = (u: number) => u * u * u * (10 + u * (-15 + u * 6));
const slope = (u: number) => 30 * u * u * (1 - u) * (1 - u);
const tangent = (u: number) => u - 6 * u ** 3 + 8 * u ** 4 - 3 * u ** 5;
const tangentSlope = (u: number) => 1 - 18 * u * u + 32 * u ** 3 - 15 * u ** 4;
export function createGroundedPlan(route: GroundedRoute, carried?: Readonly<GroundedPose>, initialLoad = 0): GroundedPlan {
  const distance = Math.hypot(route.to.x - route.from.x, route.to.y - route.from.y);
  const initial = createGroundedPose();
  const steps: Record<GroundedFoot, GroundedStep[]> = { nearHind: [], nearFore: [], farHind: [], farFore: [] };
  const point = (name: GroundedFoot, d: number, advance: number): GroundPoint => {
    const u = distance > 0 ? d / distance : 0;
    const scale = route.scaleAt?.(u) ?? route.scale + (route.endScale - route.scale) * u, limb = GROUNDED_LIMBS[name];
    return { x: route.from.x + (route.to.x - route.from.x) * u + route.facing * (limb.idle.x - GROUNDED_ART.anchorX + advance) * scale,
      y: route.from.y + (route.to.y - route.from.y) * u + (limb.idle.y - GROUNDED_ART.anchorY) * scale };
  };
  for (const name of GROUNDED_FEET) Object.assign(initial[name], carried ? carried[name] : point(name, 0, 0));
  const add = (name: GroundedFoot, lift: number, land: number, final: boolean): void => {
    const previous = steps[name].at(-1), source = previous?.to ?? initial[name];
    const state = initial[name], first = previous === undefined;
    const from = { x: source.x, y: source.y + (first ? state.lift : 0) };
    const endpoint = point(name, distance, 0);
    // A downward screen path needs less forward reach while the shoulder catches the landing depth.
    const descent = Math.max(0, (route.to.y - route.from.y) / Math.max(1e-8, distance));
    const entry = !carried && route.to.y < route.from.y ? Math.max(0, 1 - land / (54 * route.scale)) : 0;
    const target = final ? endpoint : point(name, land, GROUNDED_LIMBS[name].touchX - GROUNDED_LIMBS[name].idle.x - 80 * descent - 40 * entry);
    const to = { x: route.facing * Math.min(route.facing * target.x, route.facing * endpoint.x), y: target.y };
    steps[name].push({ lift, land, from, to,
      height: Math.min(55 * route.scale, Math.hypot(to.x - from.x, to.y - from.y) * .20),
      initialLift: first ? state.lift : 0,
      velocity: { x: first ? state.velocityX : 0, y: first ? state.velocityY + state.liftVelocity : 0 },
      liftVelocity: first ? state.liftVelocity : 0 });
  };
  let start = 0;
  if (carried) {
    const airborne = GROUNDED_FEET.filter(name => !carried[name].contact).sort((a, b) => carried[a].untilLand - carried[b].untilLand);
    const waiting = GROUNDED_FEET.filter(name => carried[name].contact).sort((a, b) => carried[a].nextLift - carried[b].nextLift);
    if (waiting.at(-1) === 'nearFore' && waiting.length > 1) {
      waiting.splice(waiting.length - 1, 1); waiting.splice(waiting.length - 1, 0, 'nearFore');
    }
    const prefix = Math.min(distance, 120 * Math.min(route.scale, route.endScale));
    const quarter = prefix / 4;
    // Two swing slots are released only by real landings, preserving two world-pinned supports.
    const freeAt: [number, number] = [0, 0];
    for (const [index, name] of airborne.entries()) {
      const state = carried[name];
      // This bound keeps the inherited quintic descent nonnegative without clipping its velocity.
      const descentLimit = state.liftVelocity < 0 ? 2 * state.lift / -state.liftVelocity : Infinity;
      const land = Math.min(quarter * (index + 1), state.untilLand, descentLimit);
      add(name, 0, land, prefix === distance); freeAt[index] = land;
    }
    for (const [index, name] of waiting.entries()) {
      const slot = freeAt[0] <= freeAt[1] ? 0 : 1;
      const preferred = airborne.length === 0 ? quarter * index : Math.min(carried[name].nextLift, quarter * (airborne.length + index));
      const lift = Math.max(freeAt[slot], preferred);
      add(name, lift, lift + quarter, prefix === distance);
      freeAt[slot] = lift + quarter;
    }
    start = prefix;
  }
  const remaining = distance - start;
  if (remaining > 0) {
    const edge = (route.to.y < route.from.y ? 200 : 240) * Math.min(route.scale, route.endScale);
    const stride = route.to.y < route.from.y ? 240 : GROUNDED_ART.stride;
    const middleCount = Math.max(0, Math.ceil((remaining - 2 * edge) / (stride * Math.min(route.scale, route.endScale))));
    const edgeLength = remaining <= edge ? remaining : Math.min(edge, (remaining - middleCount * 180 * route.scale) / 2);
    const shortApproach = route.to.y < route.from.y && remaining > 20 * route.scale && remaining <= edge;
    const cycles = shortApproach ? [remaining * .35, remaining * .65] : remaining <= edge ? [remaining] : [edgeLength, ...Array.from({ length: middleCount }, () => (remaining - 2 * edgeLength) / middleCount), edgeLength];
    for (const [cycle, length] of cycles.entries()) {
      const final = cycle === cycles.length - 1;
      const depthEntry = route.to.y < route.from.y && cycle === 0 && !final;
      const depthArrival = final && (route.to.y - route.from.y) / distance > .3;
      const phases = depthArrival ? { nearHind: 0, nearFore: .25, farHind: .6, farFore: .85 } : depthEntry ? { nearHind: 0, nearFore: .005, farHind: .26, farFore: .35 } : { nearHind: 0, nearFore: .25, farHind: .5, farFore: .75 };
      const swings = depthArrival ? { nearHind: .6, nearFore: .65, farHind: .25, farFore: .15 } : depthEntry ? { nearHind: .25, nearFore: .25, farHind: .25, farFore: .375 } : { nearHind: .375, nearFore: .375, farHind: .375, farFore: .375 };
      for (const [index, name] of GROUNDED_FEET.entries()) {
        const phase = phases[name], swing = swings[name];
        const lift = start + length * phase;
        // The front support lands later on arrival so its nearly straight authored leg stays reachable.
        add(name, lift, Math.min(distance, lift + length * (depthArrival ? swing : final ? (index === 1 ? .46 : .25) : swing)), final);
      }
      start += length;
    }
  }
  if (route.to.y < route.from.y) {
    for (const name of GROUNDED_FEET) {
      let prior: GroundPoint | undefined;
      steps[name] = steps[name].map((step, index, sequence) => {
        const next = sequence[index + 1];
        const to = next ? { x: step.to.x, y: point(name, next.lift, 0).y } : step.to;
        const from = prior ?? step.from;
        prior = to;
        return { ...step, from, to };
      });
    }
  }
  const loadRelease = Math.max(distance - GROUNDED_ART.stride * route.scale * .15, steps.nearFore.at(-1)?.land ?? 0);
  return { route, distance, initial, steps, initialLoad, loadRelease };
}
export function sampleGroundedPlan(plan: GroundedPlan, travelled: number, out: GroundedPose): void {
  const d = Math.max(0, Math.min(plan.distance, travelled));
  for (const name of GROUNDED_FEET) {
    const result = out[name];
    Object.assign(result, plan.initial[name]);
    if (d === 0) continue;
    for (const step of plan.steps[name]) {
      result.nextLift = Math.max(0, step.lift - d); result.untilLand = 0;
      if (d <= step.lift) {
        result.x = step.from.x; result.y = step.from.y; result.contact = true; result.lift = 0;
        result.velocityX = 0; result.velocityY = 0; result.liftVelocity = 0; break;
      }
      if (d < step.land) {
        const span = step.land - step.lift, u = (d - step.lift) / span, eased = smooth(u), speed = slope(u) / span;
        const carry = tangent(u) * span, carrySpeed = tangentSlope(u);
        const liftShape = step.initialLift * (1 + 3 * u + 6 * u * u) + step.liftVelocity * span * u * (1 + 3 * u) + 64 * step.height * u ** 3;
        const liftSlope = step.initialLift * (3 + 12 * u) + step.liftVelocity * span * (1 + 6 * u) + 192 * step.height * u * u;
        const lift = (1 - u) ** 3 * liftShape;
        const liftVelocity = ((1 - u) ** 3 * liftSlope - 3 * (1 - u) ** 2 * liftShape) / span;
        result.x = step.from.x + (step.to.x - step.from.x) * eased + step.velocity.x * carry;
        result.y = step.from.y + (step.to.y - step.from.y) * eased + step.velocity.y * carry - lift;
        result.velocityX = (step.to.x - step.from.x) * speed + step.velocity.x * carrySpeed;
        result.velocityY = (step.to.y - step.from.y) * speed + step.velocity.y * carrySpeed - liftVelocity;
        result.contact = false; result.lift = lift; result.liftVelocity = liftVelocity; result.untilLand = step.land - d; break;
      }
      result.x = step.to.x; result.y = step.to.y; result.contact = true; result.lift = 0;
      result.velocityX = 0; result.velocityY = 0; result.liftVelocity = 0;
    }
  }
}
export function sampleGroundedLoad(plan: GroundedPlan, travelled: number): number {
  if (plan.distance === 0) return 0;
  const d = Math.max(0, Math.min(plan.distance, travelled));
  const entry = Math.min(1, d / Math.min(GROUNDED_ART.stride * plan.route.scale * .15, plan.distance / 2));
  const exit = d <= plan.loadRelease ? 1 : (plan.distance - d) / (plan.distance - plan.loadRelease);
  return (plan.initialLoad + (GROUNDED_ART.bodyLoad - plan.initialLoad) * smooth(entry)) * smooth(exit);
}
