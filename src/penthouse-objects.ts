import type { ClimateState } from './cyber-climate.ts';

// Full alpha-image rectangles, registered to the 1672 × 941 room. Transparent
// margins preserve the soft painted edges; the floor speaker's feet sit around y733.
export const ROOM_OBJECTS = [
  { id: 'beosound-a9', src: '/assets/penthouse/objects/beosound-a9.webp', rect: [1244,405,278,360.6] },
  { id: 'pen-rest', src: '/assets/penthouse/objects/pen-rest.webp', rect: [978,546,100,40.08] },
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
