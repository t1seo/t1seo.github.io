import type { ClimateState } from './cyber-climate.ts';

// Full alpha-image rectangles, registered to the 1672 × 941 room. Transparent
// margins preserve the soft painted edges. The low speaker rests between the
// books and monitor with feet at y558; the capped pen lies beside the keyboard.
export const ROOM_OBJECTS = [
  { id: 'horizontal-speaker', src: '/assets/penthouse/objects/horizontal-speaker.webp', rect: [684,517,118,47.66] },
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
