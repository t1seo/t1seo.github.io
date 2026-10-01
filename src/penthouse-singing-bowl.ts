type BowlPaint = Pick<CanvasRenderingContext2D, 'save' | 'restore' | 'beginPath' | 'ellipse' | 'stroke' | 'lineWidth' | 'globalAlpha' | 'strokeStyle' | 'lineCap'>;

const RESONANCE_SECONDS = 6;
export const SINGING_BOWL_RIM = { x: 1079, y: 540, radiusX: 20, radiusY: 4 } as const;

export class SingingBowl {
  private elapsed: number | null = null;
  private fixed = false;

  get active(): boolean { return this.elapsed !== null && !this.fixed; }
  strike(still = false): void {
    this.elapsed = still && this.elapsed !== null ? null : 0;
    this.fixed = still;
  }
  advance(seconds: number): void {
    if (this.elapsed === null || this.fixed) return;
    this.elapsed += Math.max(0, Math.min(seconds, .1));
    if (this.elapsed >= RESONANCE_SECONDS) this.clear();
  }
  clear(): void { this.elapsed = null; this.fixed = false; }

  draw(ctx: BowlPaint, still = false): void {
    if (this.elapsed === null) return;
    const age = still || this.fixed ? 1.8 : this.elapsed;
    const fade = Math.exp(-age * .32) * (1 - age / RESONANCE_SECONDS);
    const { x, y, radiusX, radiusY } = SINGING_BOWL_RIM;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineWidth = .8; ctx.strokeStyle = '#e5c99f';
    ctx.globalAlpha = fade * (.2 + Math.cos(age * 8) * .025);
    ctx.beginPath(); ctx.ellipse(x, y, radiusX, radiusY, 0, Math.PI * 1.05, Math.PI * 1.86); ctx.stroke();
    for (let ring = 0; ring < 2; ring++) {
      const progress = (age - ring * 1.35) / 3.5;
      if (progress <= 0 || progress >= 1) continue;
      ctx.globalAlpha = Math.sin(progress * Math.PI) * fade * .12;
      ctx.lineWidth = .65;
      ctx.beginPath();
      ctx.ellipse(x, y, radiusX + progress * 16, radiusY + progress * 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

const PARTIALS = [[174.6, .027, 5.4], [176.1, .023, 5.1], [472.8, .013, 4.1], [904.3, .007, 2.7], [1460, .003, 1.8]] as const;
type Voice = { readonly oscillator: OscillatorNode; readonly gain: GainNode; readonly peak: number; readonly decay: number };
type Resonance = { readonly voices: readonly Voice[]; endsAt: number; remaining: number };

export function createSingingBowlSound(): { prepare(): Promise<boolean>; release(): void; strike(): Promise<boolean>; destroy(): void } {
  let context: AudioContext | null = null;
  let resonance: Resonance | null = null;
  let revision = 0, destroyed = false;
  let held = false, holdRevision = 0;

  function disposeVoices(): void {
    if (!resonance) return;
    for (const { oscillator, gain } of resonance.voices) {
      oscillator.onended = null; oscillator.stop(); oscillator.disconnect(); gain.disconnect();
    }
    resonance = null;
  }
  function closeContext(audio: AudioContext): void {
    if (audio.state !== 'closed') void audio.close().catch(error => {
      if (!(error instanceof DOMException)) throw error;
    });
  }
  function closeIfIdle(): void {
    if (!held && !resonance && context) {
      const audio = context; context = null; closeContext(audio);
    }
  }

  return {
    async prepare(): Promise<boolean> {
      if (destroyed || typeof AudioContext === 'undefined') return false;
      const request = ++holdRevision;
      held = true;
      try {
        context ??= new AudioContext();
        const audio = context;
        if (audio.state !== 'running') await audio.resume();
        const ready = !destroyed && held && request === holdRevision && context === audio && audio.state === 'running';
        if (!ready && request === holdRevision) { held = false; closeIfIdle(); }
        return ready;
      } catch (error) {
        if (!(error instanceof DOMException)) throw error;
        if (request === holdRevision) { held = false; closeIfIdle(); }
        return false;
      }
    },
    release(): void {
      held = false; holdRevision++; revision++;
      closeIfIdle();
    },
    async strike(): Promise<boolean> {
      if (destroyed || typeof AudioContext === 'undefined') return false;
      const request = ++revision;
      try {
        context ??= new AudioContext();
        const audio = context;
        if (audio.state !== 'running') await audio.resume();
        if (destroyed || request !== revision || context !== audio || audio.state !== 'running') return false;
        const now = audio.currentTime;
        if (resonance && now >= resonance.endsAt) disposeVoices();
        if (!resonance) {
          const voices = PARTIALS.map(([frequency, peak, decay]) => {
            const oscillator = audio.createOscillator(), gain = audio.createGain();
            oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, now);
            gain.gain.setValueAtTime(.00001, now);
            oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now);
            return { oscillator, gain, peak, decay };
          });
          const next: Resonance = { voices, endsAt: now + 5.65, remaining: voices.length };
          for (const { oscillator, gain } of voices) oscillator.onended = () => {
            oscillator.disconnect(); gain.disconnect(); next.remaining--;
            if (next.remaining === 0 && resonance === next) {
              resonance = null;
              if (context === audio) closeIfIdle();
            }
          };
          resonance = next;
        }
        resonance.endsAt = now + 5.65;
        for (const { oscillator, gain, peak, decay } of resonance.voices) {
          gain.gain.cancelAndHoldAtTime(now);
          gain.gain.linearRampToValueAtTime(peak, now + .018);
          gain.gain.exponentialRampToValueAtTime(.00001, now + decay);
          oscillator.stop(resonance.endsAt);
        }
        return true;
      } catch (error) {
        if (!(error instanceof DOMException)) throw error;
        return false;
      }
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true; held = false; holdRevision++; revision++;
      disposeVoices();
      closeIfIdle();
    },
  };
}
