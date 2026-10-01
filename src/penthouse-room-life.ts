import { isGlass, seededRandom } from './penthouse-atmosphere.ts';

export type CupSpot = 'desk' | 'lounge';
export type SteamWisp = { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly opacity: number; readonly bend: number };

const CUP_RIMS = { desk: [605, 520], lounge: [122, 642] } as const;
const FACADES = [[244,260,28,45],[320,254,37,48],[419,258,30,50],[554,248,36,59],[718,214,20,90],[964,244,29,60],[1205,260,35,47],[1280,211,25,92],[1358,244,32,63],[1439,245,27,60]] as const;
const softStep = (value: number) => value * value * (3 - 2 * value);
const LIGHT_CELL = 16, LIGHT_COLUMNS = 16, LIGHT_PADDING = 6;

export class RoomLife {
  private readonly cups = new Map<CupSpot, number>();
  private cityLights: OffscreenCanvas | null | undefined;
  private readonly windows = (() => {
    const random = seededRandom(301026);
    return FACADES.flatMap(([x,y,width,height]) => Array.from({ length: 16 }, () => ({
      x: x + Math.floor(random() * width / 4) * 4,
      y: y + 80 + Math.floor(random() * height / 6) * 6,
      width: 1.1 + random(), period: 11 + random() * 23,
      offset: random() * 30, seed: random() * 100, warm: random() > .25,
    }))).filter(window => isGlass(window.x, window.y));
  })();

  get active(): boolean { return this.cups.size > 0; }
  savorCoffee(kind: CupSpot, still = false): void {
    if (still && this.cups.has(kind)) this.cups.delete(kind);
    else this.cups.set(kind, 0);
  }
  clear(): void { this.cups.clear(); this.cityLights = undefined; }

  advance(seconds: number): void {
    const dt = Math.max(0, Math.min(seconds, .1));
    for (const [kind, age] of this.cups) {
      if (age + dt >= 7) this.cups.delete(kind);
      else this.cups.set(kind, age + dt);
    }
  }

  steamWisps(still = false): readonly SteamWisp[] {
    return [...this.cups].flatMap(([kind, elapsed]) => {
      const age = still ? 1.6 : elapsed;
      const [x,y] = CUP_RIMS[kind];
      const fade = softStep(Math.min(age / .3, 1)) * softStep(Math.max(0, Math.min((7 - age) / 2, 1)));
      return [0, 1, 2].map(index => {
        const phase = age * .8 + index * 2.1;
        return {
          x: x + (index - 1) * 5 + Math.sin(phase) * 1.8,
          y: y - 1 - Math.sin(phase * .65) ** 2 * 2,
          width: 2.4 + Math.sin(phase * .7) ** 2 * 1.8,
          height: 27 + index * 5 + Math.sin(phase) * 5 + Math.min(age, 2) * 4,
          bend: Math.sin(phase * .7 + index) * 5,
          opacity: fade * (.065 + Math.sin(phase * .6) ** 2 * .035),
        };
      });
    });
  }

  private cityTexture(): OffscreenCanvas | null {
    if (this.cityLights !== undefined) return this.cityLights;
    if (typeof OffscreenCanvas === 'undefined') { this.cityLights = null; return null; }
    const texture = new OffscreenCanvas(LIGHT_COLUMNS * LIGHT_CELL, Math.ceil(this.windows.length / LIGHT_COLUMNS) * LIGHT_CELL);
    const paint = texture.getContext('2d');
    if (!paint) { this.cityLights = null; return null; }
    paint.filter = 'blur(.3px)'; paint.shadowBlur = 2; paint.shadowColor = '#e9c89c55';
    for (const warm of [true, false]) {
      paint.beginPath();
      this.windows.forEach((window,index) => {
        if (window.warm === warm) paint.rect(index % LIGHT_COLUMNS * LIGHT_CELL + LIGHT_PADDING, Math.floor(index / LIGHT_COLUMNS) * LIGHT_CELL + LIGHT_PADDING, window.width, 1.8);
      });
      paint.fillStyle = warm ? '#e9c594' : '#e1ddd0';
      paint.fill();
    }
    this.cityLights = texture;
    return texture;
  }

  drawCity(ctx: CanvasRenderingContext2D, time: number, night: number): void {
    const texture = this.cityTexture();
    ctx.save();
    for (let index = 0; index < this.windows.length; index++) {
      const window = this.windows[index];
      const phase = (time + window.offset) / window.period;
      const cycle = Math.floor(phase), blend = softStep(phase - cycle);
      const previous = Math.sin(cycle * 2.39 + window.seed) * .5 + .5;
      const next = Math.sin((cycle + 1) * 2.39 + window.seed) * .5 + .5;
      const intensity = previous + (next - previous) * blend;
      ctx.globalAlpha = night * (.045 + intensity ** 2 * .4);
      if (texture) {
        ctx.drawImage(texture, index % LIGHT_COLUMNS * LIGHT_CELL, Math.floor(index / LIGHT_COLUMNS) * LIGHT_CELL, LIGHT_CELL, LIGHT_CELL, window.x - LIGHT_PADDING, window.y - LIGHT_PADDING, LIGHT_CELL, LIGHT_CELL);
      } else {
        ctx.fillStyle = window.warm ? '#e9c594' : '#e1ddd0';
        ctx.fillRect(window.x, window.y, window.width, 1.8);
      }
    }
    ctx.restore();
  }

  drawSteam(ctx: CanvasRenderingContext2D, still: boolean): void {
    ctx.save();
    for (const wisp of this.steamWisps(still)) {
      for (let dab = 0; dab < 10; dab++) {
        const progress = (dab + .5) / 10;
        const x = wisp.x + Math.sin(progress * Math.PI) * wisp.bend;
        const y = wisp.y - progress * wisp.height;
        ctx.save(); ctx.translate(x, y); ctx.scale(wisp.width * (.55 + progress), 5.5);
        const wash = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        wash.addColorStop(0, '#eee6d6'); wash.addColorStop(.45, '#ded8ca99'); wash.addColorStop(1, 'transparent');
        ctx.globalAlpha = wisp.opacity * Math.sin(progress * Math.PI);
        ctx.fillStyle = wash; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
      }
    }
    ctx.restore();
  }
}
