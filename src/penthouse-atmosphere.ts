import type { ClimateState } from './cyber-climate.ts';

export type Point = readonly [number, number];
export const ROOM_SIZE = [1672, 941] as const;
// Registered on the taller, hand-painted 1672×941 master. Occluders are
// separate so overlapping furniture never lets rain through an even-odd overlap.
export const GLASS_PANES: readonly (readonly Point[])[] = [
  [[191,32],[494,32],[494,614],[191,614]],
  [[514,32],[1162,32],[1162,614],[514,614]],
  [[1182,32],[1486,32],[1486,614],[1182,614]],
];
export const GLASS_EDGE: readonly Point[] = [[191,32],[1486,32],[1486,614],[191,614]];
export const GLASS_OCCLUDERS: readonly (readonly Point[])[] = [
  [[191,265],[260,265],[260,480],[223,520],[191,520]], // indoor tree
  [[191,548],[256,548],[256,591],[342,591],[342,614],[191,614]], // lounge
  [[428,322],[474,322],[479,305],[491,305],[535,337],[579,364],[579,552],[564,552],[564,376],[531,351],[535,393],[423,393]], // articulated floor lamp
  [[527,546],[1269,546],[1269,614],[527,614]], // desk and accessories
  [[639,495],[808,495],[808,577],[853,577],[853,614],[639,614]], // Aeron
  [[828,416],[1003,416],[1003,531],[930,531],[930,552],[902,552],[902,531],[828,531]], // Studio Display
  [[1037,455],[1083,455],[1151,479],[1151,553],[1134,553],[1134,490],[1075,473],[1037,473]], // task lamp
  [[589,510],[632,510],[632,551],[589,551]], // mug and books
  [[1027,513],[1104,513],[1104,551],[1027,551]], // pencils and planter
];
export const SKY_EDGE: readonly Point[] = [[191,32],[1486,32],[1486,239],[366,239],[366,113],[332,113],[332,239],[312,239],[312,184],[296,184],[296,239],[191,239]];
export const WORKSPACE_CROP = [422,302,870,490] as const;
export const MONITOR_SCREEN: readonly Point[] = [[839,429],[991,429],[991,519],[839,519]];
export const MILKY_STUDY_FLOOR = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
export function inPolygon(x: number, y: number, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export const isGlass = (x: number, y: number) => inPolygon(x, y, GLASS_EDGE) && GLASS_PANES.some(p => inPolygon(x, y, p)) && !GLASS_OCCLUDERS.some(p => inPolygon(x,y,p));
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
      x = 191 + this.random() * 1295; y = 32 + this.random() * 582;
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
