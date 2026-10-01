export type RiverBoatSchedule = (callback: () => void, delayMs: number) => () => void;
type BoatPaint = Pick<CanvasRenderingContext2D, 'save' | 'restore' | 'beginPath' | 'moveTo' | 'lineTo' | 'closePath' | 'fill' | 'stroke' | 'fillRect' | 'globalAlpha' | 'fillStyle' | 'strokeStyle' | 'lineWidth'>;
type RiverBoatOptions = { readonly schedule?: RiverBoatSchedule; readonly random?: () => number };
type RiverBoatPose = { readonly x: number; readonly y: number; readonly opacity: number };
const CROSSING_SECONDS = 42;

export function riverBoatPose(seconds: number, direction: 1 | -1 = 1): RiverBoatPose {
  const progress = Math.max(0, Math.min(1, seconds / CROSSING_SECONDS));
  const fade = Math.min(1, progress * 12, (1 - progress) * 12);
  return {
    x: direction === 1 ? 210 + progress * 1280 : 1490 - progress * 1280,
    y: 458 + Math.sin(seconds * .9) * .22,
    opacity: fade * fade * (3 - 2 * fade),
  };
}

export class RiverBoat {
  private readonly onWake: () => void;
  private readonly schedule: RiverBoatSchedule;
  private readonly random: () => number;
  private cancelWake: (() => void) | null = null;
  private elapsed: number | null = null;
  private direction: 1 | -1 = 1;
  private enabled = false;
  private departed = false;
  private dead = false;
  private revision = 0;

  constructor(onWake: () => void, options: RiverBoatOptions = {}) {
    this.onWake = onWake;
    this.random = options.random ?? Math.random;
    this.schedule = options.schedule ?? ((callback, delayMs) => {
      const timer = window.setTimeout(callback, delayMs);
      return () => window.clearTimeout(timer);
    });
  }

  get active(): boolean { return this.elapsed !== null; }

  setEnabled(enabled: boolean): void {
    if (this.dead || enabled === this.enabled) return;
    this.enabled = enabled;
    if (enabled) this.scheduleNext();
    else {
      this.revision++;
      this.cancelWake?.(); this.cancelWake = null;
      this.elapsed = null;
    }
  }

  advance(seconds: number): void {
    if (this.elapsed === null) return;
    this.elapsed += Math.max(0, seconds);
    if (this.elapsed >= CROSSING_SECONDS) {
      this.elapsed = null;
      this.scheduleNext();
    }
  }

  private scheduleNext(): void {
    if (!this.enabled || this.dead || this.cancelWake || this.active) return;
    const revision = ++this.revision;
    const delayMs = this.departed ? 95000 + this.random() * 55000 : 18000 + this.random() * 12000;
    this.cancelWake = this.schedule(() => {
      if (revision !== this.revision || !this.enabled || this.dead || !this.cancelWake) return;
      this.cancelWake = null;
      this.direction = this.random() < .5 ? -1 : 1;
      this.elapsed = 0;
      this.departed = true;
      this.onWake();
    }, delayMs);
  }

  draw(ctx: BoatPaint, night: number, detail = 1): void {
    if (this.elapsed === null) return;
    const { x, y, opacity } = riverBoatPose(this.elapsed, this.direction);
    const dusk = Math.max(0, Math.min(1, night)), direction = this.direction;
    ctx.save();
    ctx.globalAlpha = opacity * .22;
    ctx.strokeStyle = dusk > .4 ? '#c8b498' : '#d9d9c3'; ctx.lineWidth = .55;
    for (let line = 0; line < 3; line++) {
      ctx.beginPath(); ctx.moveTo(x - direction * (12 + line * 3), y + .8 + line * .7);
      ctx.lineTo(x - direction * (22 + line * 5), y + .8 + line * .7); ctx.stroke();
    }
    ctx.globalAlpha = opacity * .87;
    ctx.fillStyle = dusk > .4 ? '#646666' : '#898b7e';
    ctx.beginPath(); ctx.moveTo(x - direction * 12, y - 2.5);
    ctx.lineTo(x + direction * 13, y - 2.1); ctx.lineTo(x + direction * 9, y + .7);
    ctx.lineTo(x - direction * 9, y + .5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dusk > .4 ? '#a79e87' : '#d4cdb7';
    ctx.beginPath(); ctx.moveTo(x - direction * 8, y - 3);
    ctx.lineTo(x - direction * 7, y - 6.6); ctx.lineTo(x + direction * 6, y - 6.8);
    ctx.lineTo(x + direction * 9, y - 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b1ab97'; ctx.lineWidth = .6;
    ctx.beginPath(); ctx.moveTo(x - direction * 9, y - 7.1);
    ctx.lineTo(x + direction * 6, y - 7.3); ctx.stroke();
    ctx.fillStyle = dusk > .4 ? '#edce8d' : '#5d7378';
    for (let window = 0; window < 4; window++) ctx.fillRect(x - 6 + window * 3.2, y - 5.6, 1.7, 1.6);
    if (dusk > 0) {
      ctx.fillStyle = '#e3be7e';
      const count = detail < .65 ? 3 : 6;
      for (let ripple = 0; ripple < count; ripple++) {
        const width = 3.5 + (ripple % 3) * 2;
        const drift = Math.sin(this.elapsed * 1.6 + ripple * 2) * 2.4;
        ctx.globalAlpha = opacity * dusk * .24 * (1 - ripple / 7);
        ctx.fillRect(x - width / 2 + drift, y + 3 + ripple * 3.6, width, .65);
      }
    }
    ctx.restore();
  }

  destroy(): void {
    this.setEnabled(false);
    this.dead = true;
  }
}
