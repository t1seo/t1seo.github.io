import type { ClimateState } from './cyber-climate.ts';

export type Point = readonly [number, number];
export const ROOM_SIZE = [1672, 941] as const;
// Registered on the frontal Seoul master. These conservative visible regions
// exclude the mullions, tree, lounge, chair, Studio Display and task lamp.
export const GLASS_PANES: readonly (readonly Point[])[] = [
  [[191,42],[495,42],[495,487],[336,487],[336,433],[228,433],[228,173],[191,173]],
  [[515,42],[1163,42],[1163,306],[515,306]],
  [[515,306],[829,306],[829,366],[641,366],[641,406],[585,406],[585,428],[515,428]],
  [[1005,306],[1029,306],[1029,403],[1005,403]],
  [[1029,306],[1151,306],[1151,322],[1029,322]],
  [[1099,323],[1163,323],[1163,350],[1148,350],[1148,355],[1099,337]],
  [[1030,379],[1129,379],[1129,405],[1030,405]],
  [[855,416],[1029,416],[1029,426],[855,426]],
  [[1151,307],[1163,307],[1163,426],[1151,426]],
  [[1181,42],[1486,42],[1486,487],[1274,487],[1274,429],[1181,429]],
];
export const GLASS_EDGE: readonly Point[] = [[191,42],[1486,42],[1486,487],[191,487]];
// Keep stars and meteors above Namsan, including the two tower silhouettes.
export const SKY_EDGE: readonly Point[] = [[191,42],[1486,42],[1486,168],[365,168],[365,55],[336,55],[336,168],[312,168],[312,118],[298,118],[298,168],[191,168]];
export const WORKSPACE_CROP = [515,290,770,355] as const;
export const MONITOR_SCREEN: readonly Point[] = [[840,319],[991,319],[991,404],[840,404]];
export const MILKY_STUDY_FLOOR = { left: .35, right: .66, top: .84, bottom: .955, footerInset: 0 };
export function inPolygon(x: number, y: number, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export const isGlass = (x: number, y: number) => inPolygon(x, y, GLASS_EDGE) && GLASS_PANES.some(p => inPolygon(x, y, p));
export const isSky = (x: number, y: number) => isGlass(x,y) && inPolygon(x,y,SKY_EDGE);
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
      x = 191 + this.random() * 1295; y = 42 + this.random() * 445;
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
      this.meteor = { x: 575 + this.random() * 430, y: 55 + this.random() * 24, age: 0, duration: 1.05 };
      this.meteorWait = 28 + this.random() * 28;
    }
    if (this.meteor) { this.meteor.age += dt; if (this.meteor.age >= this.meteor.duration) this.meteor = null; }
  }
}
