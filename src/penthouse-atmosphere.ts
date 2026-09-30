import type { ClimateState } from './cyber-climate.ts';

export type Point = readonly [number, number];
export const ROOM_SIZE = [1672, 941] as const;
// Measured on the workspace master. Intersect these panes with the sofa silhouette.
export const GLASS_PANES: readonly (readonly Point[])[] = [
  [[0,0],[68,0],[68,550],[0,563]],
  [[89,0],[199,79],[199,483],[89,544]],
  [[215,92],[273,133],[273,475],[215,479]],
  [[289,145],[333,176],[333,462],[289,469]],
  [[350,187],[367,198],[367,457],[350,459]],
  [[389,170],[627,150],[627,480],[389,459]],
  [[641,149],[873,129],[873,501],[641,486]],
  [[888,128],[1066,113],[1066,501],[888,501]],
];
export const GLASS_EDGE: readonly Point[] = [[0,0],[376,155],[1070,118],[1070,501],[874,501],[874,489],[705,461],[705,456],[507,442],[492,437],[301,461],[201,468],[100,494],[100,539],[0,555]];
export function inPolygon(x: number, y: number, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export const isGlass = (x: number, y: number) => inPolygon(x, y, GLASS_EDGE) && GLASS_PANES.some(p => inPolygon(x, y, p));
export const isSky = (x: number, y: number) => isGlass(x,y) && y < 293;
export function seededRandom(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
export function atmosphereProfile(state: ClimateState) {
  const night = state.time === 'night' ? 1 : state.time === 'evening' ? .58 : 0;
  return {
    night, stars: night === 1 && state.weather === 'clear',
    rain: state.weather === 'rain', snow: state.weather === 'snow',
    mist: state.weather === 'mist',
    clouds: ({ clear: 0, cloudy: .52, rain: .76, snow: .62, mist: .45 })[state.weather],
  };
}
export interface Drop { x: number; y: number; radius: number; life: number; speed: number; phase: number }
export interface Meteor { x: number; y: number; age: number; duration: number }
/** Simulation time never includes time spent in a hidden tab. No timers to orphan. */
export class AtmosphereSimulation {
  readonly random = seededRandom(92704);
  time = 0;
  wetness = 0;
  drops: Drop[] = [];
  meteor: Meteor | null = null;
  meteorWait = 12;
  private wasClearNight = false;
  private spawn = 0;
  constructor() {
    for (let i = 0; i < 64; i++) this.drops.push(this.newDrop(false));
  }
  private newDrop(moving: boolean): Drop {
    let x = 0, y = 0;
    for (let tries = 0; tries < 100; tries++) {
      x = this.random() * 1060; y = 130 + this.random() * 375;
      if (isGlass(x,y)) break;
    }
    return { x,y,radius: moving ? 2.2 + this.random() * 1.5 : .8 + this.random() * 1.7,
      life: 1, speed: moving ? 12 + this.random() * 18 : 0, phase: this.random() * 6.28 };
  }
  advance(seconds: number, state: ClimateState) {
    const dt = Math.max(0, Math.min(seconds, .1));
    const p = atmosphereProfile(state);
    this.time += dt;
    this.wetness = Math.max(0, Math.min(1, this.wetness + (p.rain ? dt * .45 : -dt / 22)));
    if (p.rain) {
      this.spawn += dt;
      if (this.spawn >= .9) {
        this.spawn = 0;
        if (this.drops.length < 76) this.drops.push(this.newDrop(true));
        else { const index = this.drops.findIndex(d => d.speed === 0); if (index >= 0) this.drops[index] = this.newDrop(true); }
      }
    }
    for (const d of this.drops) {
      if (!d.speed) continue;
      d.y += d.speed * dt; d.x += Math.sin(this.time + d.phase) * dt * 1.4;
      // A moving bead absorbs a small bead it actually touches.
      for (const other of this.drops) {
        if (other === d || other.speed || other.life <= 0) continue;
        if (Math.hypot(other.x - d.x, other.y - d.y) < d.radius + other.radius) {
          d.radius = Math.min(5.5, Math.sqrt(d.radius ** 2 + other.radius ** 2));
          d.speed = Math.min(45, d.speed + 2); other.life = 0;
        }
      }
      if (!isGlass(d.x,d.y)) Object.assign(d, this.newDrop(p.rain));
    }
    for (const d of this.drops) if (d.life === 0) Object.assign(d, this.newDrop(false));
    if (!p.stars) { this.meteor = null; this.wasClearNight = false; return; }
    if (!this.wasClearNight) { this.meteorWait = 12 + this.random() * 8; this.wasClearNight = true; }
    this.meteorWait -= dt;
    if (this.meteorWait <= 0 && !this.meteor) {
      this.meteor = { x: 435 + this.random() * 400, y: 183 + this.random() * 32, age: 0, duration: 1.05 };
      this.meteorWait = 28 + this.random() * 28;
    }
    if (this.meteor) { this.meteor.age += dt; if (this.meteor.age >= this.meteor.duration) this.meteor = null; }
  }
}
