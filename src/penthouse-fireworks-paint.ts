import { seededRandom, SKY_EDGE } from './penthouse-atmosphere.ts';
import { FIREWORK_CUES, type FireworkCue } from './penthouse-fireworks-show.ts';

type Paint = Pick<CanvasRenderingContext2D, 'save' | 'restore' | 'beginPath' | 'closePath' | 'moveTo' | 'lineTo' | 'clip' | 'stroke' | 'fillRect' | 'drawImage' | 'globalAlpha' | 'globalCompositeOperation' | 'strokeStyle' | 'fillStyle' | 'lineWidth' | 'lineCap'>;
type Spark = { readonly vx: number; readonly vy: number; readonly drag: number; readonly gravity: number; readonly life: number; readonly width: number; readonly phase: number; readonly drift: number };
type Burst = { readonly cue: FireworkCue; readonly sparks: readonly Spark[]; readonly life: number };
const PALETTES = [
  { glow: '#dbaf74', tail: '#d9a765', head: '#fff0cd' },
  { glow: '#d49e98', tail: '#c79186', head: '#ffe0cf' },
  { glow: '#e8dac0', tail: '#c6b48d', head: '#fff5dd' },
] as const;
const LAUNCH = 1.45;
const ATLAS_CELL = 48;

function burst(cue: FireworkCue): Burst {
  const random = seededRandom(cue.seed);
  let count: number, life: number, gravity: number;
  switch (cue.kind) {
    case 'chrysanthemum': count = 126; life = 4.2; gravity = 5.6; break;
    case 'willow': count = 114; life = 5.2; gravity = 7.8; break;
    case 'palm': count = 64; life = 3.6; gravity = 6.4; break;
  }
  const sparks = Array.from({ length: count }, (_, index) => {
    const angle = cue.kind === 'palm'
      ? -Math.PI + (index % 9) / 8 * Math.PI + (random() - .5) * .08
      : index * Math.PI * 2 / count + (random() - .5) * .13;
    const layer = index % 4 === 0 ? .48 + random() * .22 : .79 + random() * .22;
    const speed = cue.radius * (cue.kind === 'palm' ? 1.8 : 1.42) * layer;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * (.88 + random() * .14),
      drag: .94 + random() * .27, gravity: gravity * (.86 + random() * .26),
      life: life * (.68 + random() * .32), width: .5 + random() * .55,
      phase: random() * Math.PI * 2, drift: .4 + random() * 1.8,
    };
  });
  return { cue, sparks, life };
}

export class FireworksPaint {
  private readonly bursts = FIREWORK_CUES.map(burst);
  private readonly atlas: HTMLCanvasElement | null;

  constructor() {
    const atlas = document.createElement('canvas');
    atlas.width = ATLAS_CELL * PALETTES.length; atlas.height = ATLAS_CELL;
    const paint = atlas.getContext('2d');
    if (!paint) { this.atlas = null; return; }
    PALETTES.forEach((palette, index) => {
      const x = index * ATLAS_CELL + ATLAS_CELL / 2, y = ATLAS_CELL / 2;
      const glow = paint.createRadialGradient(x, y, 0, x, y, ATLAS_CELL / 2);
      glow.addColorStop(0, palette.head); glow.addColorStop(.12, palette.glow);
      glow.addColorStop(.4, `${palette.glow}60`); glow.addColorStop(1, `${palette.glow}00`);
      paint.fillStyle = glow; paint.fillRect(index * ATLAS_CELL, 0, ATLAS_CELL, ATLAS_CELL);
    });
    this.atlas = atlas;
  }

  private glow(ctx: Paint, palette: number, x: number, y: number, size: number, alpha: number): void {
    if (!this.atlas) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.atlas, palette * ATLAS_CELL, 0, ATLAS_CELL, ATLAS_CELL, x - size / 2, y - size / 2, size, size);
  }

  private launch(ctx: Paint, cue: FireworkCue, age: number, night: number): void {
    const progress = Math.min(1, age / LAUNCH);
    const before = Math.max(0, (age - .15) / LAUNCH);
    const startX = cue.x + Math.sin(cue.seed) * 23;
    const x = cue.x + (startX - cue.x) * (1 - progress);
    const y = cue.y + (432 - cue.y) * (1 - progress) ** 2;
    const tailX = cue.x + (startX - cue.x) * (1 - before);
    const tailY = cue.y + (432 - cue.y) * (1 - before) ** 2;
    ctx.strokeStyle = PALETTES[cue.palette].tail; ctx.lineWidth = .65;
    ctx.globalAlpha = .35 + night * .2;
    ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke();
    this.glow(ctx, cue.palette, x, y, 10, .48 + night * .22);
    ctx.fillStyle = PALETTES[cue.palette].head; ctx.globalAlpha = .88;
    ctx.fillRect(x - .6, y - 1.1, 1.2, 2.2);
  }

  private blossom(ctx: Paint, item: Burst, age: number, density: number, night: number): void {
    const { cue, sparks } = item;
    const palette = PALETTES[cue.palette];
    const stride = density < .5 ? 3 : density < .8 ? 2 : 1;
    const tailLength = cue.kind === 'willow' ? .52 : cue.kind === 'palm' ? .38 : .2;
    ctx.lineCap = 'round';
    for (let index = 0; index < sparks.length; index += stride) {
      const spark = sparks[index];
      if (age >= spark.life) continue;
      const fade = Math.min(1, age / .11) * (1 - age / spark.life) ** .85;
      const glimmer = .76 + .24 * Math.sin(age * 5.2 + spark.phase) ** 2;
      const alpha = fade * glimmer * (.68 + night * .24);
      const travel = (1 - Math.exp(-spark.drag * age)) / spark.drag;
      const x = cue.x + spark.vx * travel + spark.drift * age ** 1.3;
      const y = cue.y + spark.vy * travel + spark.gravity * age * age;
      for (let segment = 0; segment < 3; segment++) {
        const t0 = Math.max(0, age - tailLength * (3 - segment) / 3);
        const t1 = Math.max(0, age - tailLength * (2 - segment) / 3);
        const d0 = (1 - Math.exp(-spark.drag * t0)) / spark.drag;
        const d1 = (1 - Math.exp(-spark.drag * t1)) / spark.drag;
        ctx.globalAlpha = alpha * (.14 + segment * .22);
        ctx.lineWidth = spark.width * (.65 + segment * .22);
        ctx.strokeStyle = palette.tail; ctx.beginPath();
        ctx.moveTo(cue.x + spark.vx * d0 + spark.drift * t0 ** 1.3, cue.y + spark.vy * d0 + spark.gravity * t0 * t0);
        ctx.lineTo(cue.x + spark.vx * d1 + spark.drift * t1 ** 1.3, cue.y + spark.vy * d1 + spark.gravity * t1 * t1); ctx.stroke();
      }
      if (index % (stride * 3) === 0) this.glow(ctx, cue.palette, x, y, 7 + spark.width * 2, alpha * .35);
      ctx.globalAlpha = alpha; ctx.fillStyle = palette.head;
      ctx.fillRect(x - spark.width / 2, y - spark.width / 2, spark.width, spark.width * 1.15);
    }
  }

  draw(ctx: Paint, time: number, night: number, density = 1): void {
    ctx.save(); ctx.beginPath(); ctx.moveTo(...SKY_EDGE[0]);
    for (let index = 1; index < SKY_EDGE.length; index++) ctx.lineTo(...SKY_EDGE[index]);
    ctx.closePath(); ctx.clip();
    for (const item of this.bursts) {
      const age = time - item.cue.at;
      if (age < 0 || age >= LAUNCH + item.life) continue;
      if (age < LAUNCH) this.launch(ctx, item.cue, age, night);
      else this.blossom(ctx, item, age - LAUNCH, density, night);
    }
    ctx.restore();
    if (night > 0) this.reflections(ctx, time, night, density);
  }

  private reflections(ctx: Paint, time: number, night: number, density: number): void {
    ctx.save();
    for (const { cue, life } of this.bursts) {
      const age = time - cue.at - LAUNCH;
      if (age <= 0 || age >= life) continue;
      const fade = Math.min(1, age / .5) * (1 - age / life) ** 2;
      const count = density < .5 ? 5 : 10;
      ctx.fillStyle = PALETTES[cue.palette].glow;
      for (let index = 0; index < count; index++) {
        const width = (13 + index * 3) * (1 + Math.sin(index * 2.3) * .3);
        ctx.globalAlpha = fade * night * .095 * (1 - index / count);
        ctx.fillRect(cue.x - width / 2 + Math.sin(time * .7 + index * 2) * 7, 437 + index * 4.3, width, .55);
      }
    }
    ctx.restore();
  }
}
