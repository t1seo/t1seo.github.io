import { milkyBallAtRest, stepMilkyBall, type MilkyBallBounds, type MilkyBallState } from './cyber-pet-activity.ts';
import type { MilkyPoint } from './cyber-pet-geometry.ts';

export function throwMilkyBall(point: Readonly<MilkyPoint>, drag: Readonly<MilkyPoint>): MilkyBallState {
  const distance = Math.hypot(drag.x, drag.y);
  if (distance === 0) return milkyBallAtRest(point);
  const strength = Math.min(1, distance / .14);
  const speed = .055 + strength * .245;
  return {
    ...point, h: .001, vx: drag.x / distance * speed, vy: drag.y / distance * speed,
    vh: .045 + strength * .085, resting: false,
  };
}

export function predictMilkyBallRest(state: Readonly<MilkyBallState>, bounds: Readonly<MilkyBallBounds>): MilkyPoint {
  let forecast = state;
  for (let step = 0; step < 600 && !forecast.resting; step++) forecast = stepMilkyBall(forecast, 1 / 60, bounds);
  return { x: forecast.x, y: forecast.y };
}
