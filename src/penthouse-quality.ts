export type EffectDetail = 'full' | 'balanced' | 'quiet';
export const EFFECT_DENSITY = {
  full: { particles: 1, beads: 1, reflections: 1 },
  balanced: { particles: .66, beads: .7, reflections: .65 },
  quiet: { particles: .38, beads: .45, reflections: .36 },
} as const;

export class AdaptiveEffectQuality {
  private level: EffectDetail = 'full';
  private frameAverage = 1000 / 60;
  private paintAverage = 0;
  private pressure = 0;
  private recovery = 0;
  private cooldown = 0;

  get detail(): EffectDetail { return this.level; }

  sample(frameMilliseconds: number, paintMilliseconds?: number): void {
    // Long gaps belong to suspended tabs or OS scheduling, not steady rendering.
    if (frameMilliseconds <= 0 || frameMilliseconds > 250) return;
    const elapsed = Math.min(frameMilliseconds, 50);
    this.frameAverage += (Math.min(frameMilliseconds, 100) - this.frameAverage) * .06;
    if (paintMilliseconds !== undefined) this.paintAverage += (Math.min(paintMilliseconds, 60) - this.paintAverage) * .1;
    this.cooldown = Math.max(0, this.cooldown - elapsed);
    const overloaded = this.paintAverage > 8 || this.frameAverage > 27;
    const healthy = this.paintAverage < 4.5 && this.frameAverage < 20;
    this.pressure = overloaded ? this.pressure + elapsed : Math.max(0, this.pressure - elapsed * 2);
    this.recovery = healthy ? this.recovery + elapsed : 0;
    if (this.cooldown > 0) return;
    if (this.pressure >= 2000 && this.level !== 'quiet') {
      this.level = this.level === 'full' ? 'balanced' : 'quiet';
      this.pressure = 0; this.recovery = 0; this.cooldown = 4000;
    } else if (this.recovery >= 20000 && this.level !== 'full') {
      this.level = this.level === 'quiet' ? 'balanced' : 'full';
      this.pressure = 0; this.recovery = 0; this.cooldown = 6000;
    }
  }

  resetSampling(): void {
    this.frameAverage = 1000 / 60; this.paintAverage = 0;
    this.pressure = 0; this.recovery = 0;
  }
}
