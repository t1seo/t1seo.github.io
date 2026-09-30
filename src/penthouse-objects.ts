import type { ClimateState } from './cyber-climate.ts';

// Full alpha-image rectangles, registered to the 1672 × 941 room. Transparent
// margins preserve the soft painted edges. The compact speaker rests on the
// desktop at y550; the capped pen lies directly beside the keyboard.
export const ROOM_OBJECTS = [
  { id: 'compact-speaker', src: '/assets/penthouse/objects/compact-speaker.webp', rect: [1194,482,49,73.5] },
  { id: 'fountain-pen', src: '/assets/penthouse/objects/fountain-pen.webp', rect: [998,551,48,19.24] },
] as const;

export function objectLighting(state: Pick<ClimateState, 'time' | 'weather'>): string {
  const time = state.weather !== 'clear' && ['morning','noon','afternoon'].includes(state.time) ? 'noon' : state.time;
  return {
    morning: 'brightness(.92) saturate(.68)',
    noon: 'brightness(.95) saturate(.48)',
    afternoon: 'brightness(.94) saturate(.8)',
    evening: 'brightness(.79) saturate(.84)',
    night: 'brightness(.69) saturate(.8)',
  }[time];
}
