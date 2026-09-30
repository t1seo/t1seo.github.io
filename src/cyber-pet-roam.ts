import type { MilkyPoint } from './cyber-pet-geometry.ts';
import { milkyDistance } from './cyber-pet-motion.ts';

export type MilkyHeading = MilkyPoint;
export type MilkyRandom = () => number;
const randomUnit = (random: MilkyRandom) => Math.max(0, Math.min(0.999999, random()));

/**
 * A pause belongs to one rest period; rendering and repeated load events never reset it.
 * Right after a finished walk there is a modest chance of a shorter, still-curious pause,
 * so rests vary instead of following one fixed rhythm.
 */
export function milkyRoamPause(random: MilkyRandom = Math.random, afterWalk = false): number {
  if (afterWalk && randomUnit(random) < .3) return 3200 + randomUnit(random) * 3400;
  return 9000 + randomUnit(random) * 9000;
}

/**
 * Sample short, mostly sideways paths inside the actual visible floor. A side-view dog must
 * never slide vertically. Continuation has more weight than a reversal, but neither heading
 * nor distance follows a fixed sequence. At an edge, the remaining valid paths win naturally.
 */
export function chooseMilkyDestination(
  origin: MilkyPoint,
  constrain: (point: MilkyPoint) => MilkyPoint,
  previous?: MilkyHeading,
  random: MilkyRandom = Math.random,
): MilkyPoint | undefined {
  const candidates: { point: MilkyPoint; weight: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const direction = randomUnit(random) < .5 ? -1 : 1;
    const length = .050 + randomUnit(random) * .061;
    const depth = (randomUnit(random) * 2 - 1) * .036;
    const point = constrain({ x: origin.x + direction * length, y: origin.y + depth });
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const distance = milkyDistance(origin, point);
    // Clipping must not turn an ordinary diagonal into a front/back moonwalk.
    if (Math.abs(dx) < .012 || Math.abs(dy) * .563 > Math.abs(dx) * .7 || distance < .018) continue;
    let weight = Math.min(1, distance / .045);
    if (previous && Math.abs(previous.x) > .001) {
      if (Math.sign(previous.x) !== Math.sign(dx)) weight *= .28;
      // Encourage a little depth variation without forcing an up/down ping-pong.
      if (Math.abs(dy) < .003 && Math.abs(previous.y) < .003) weight *= .42;
      if (Math.sign(dy) !== Math.sign(previous.y) && Math.abs(dy) > .004) weight *= 1.25;
    }
    candidates.push({ point, weight });
  }
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let pick = randomUnit(random) * total;
  for (const candidate of candidates) {
    pick -= candidate.weight;
    if (pick <= 0) return candidate.point;
  }
  return candidates.at(-1)?.point;
}

/** Up/down keys ask for an honest shallow diagonal using the same side-view gait. */
export function milkyKeyboardDestination(
  origin: MilkyPoint,
  key: string,
  facing: number,
  constrain: (point: MilkyPoint) => MilkyPoint,
): MilkyPoint {
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    return constrain({ x: origin.x + (key === 'ArrowLeft' ? -.066 : .066), y: origin.y });
  }
  const dy = key === 'ArrowUp' ? -.022 : .022;
  const preferred = constrain({ x: origin.x + facing * .055, y: origin.y + dy });
  if (Math.abs(preferred.x - origin.x) >= .018) return preferred;
  return constrain({ x: origin.x - facing * .055, y: origin.y + dy });
}
