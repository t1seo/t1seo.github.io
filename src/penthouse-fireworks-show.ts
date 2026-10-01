export type FireworkCue = {
  readonly at: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly kind: 'chrysanthemum' | 'willow' | 'palm';
  readonly palette: 0 | 1 | 2;
  readonly seed: number;
};

export const FIREWORKS_DURATION = 60;
export const FIREWORK_CUES = [
  { at: 0, x: 740, y: 135, radius: 49, kind: 'chrysanthemum', palette: 0, seed: 103 },
  { at: 3.2, x: 1110, y: 154, radius: 43, kind: 'palm', palette: 1, seed: 211 },
  { at: 5.9, x: 510, y: 126, radius: 56, kind: 'willow', palette: 0, seed: 307 },
  { at: 7, x: 1190, y: 164, radius: 38, kind: 'chrysanthemum', palette: 2, seed: 409 },
  { at: 10, x: 890, y: 112, radius: 61, kind: 'willow', palette: 1, seed: 503 },
  { at: 12.6, x: 590, y: 156, radius: 42, kind: 'palm', palette: 2, seed: 601 },
  { at: 13.7, x: 1240, y: 120, radius: 56, kind: 'chrysanthemum', palette: 0, seed: 701 },
  { at: 16.6, x: 980, y: 146, radius: 50, kind: 'willow', palette: 0, seed: 809 },
  { at: 19.2, x: 460, y: 142, radius: 44, kind: 'chrysanthemum', palette: 1, seed: 907 },
  { at: 20.3, x: 1120, y: 107, radius: 64, kind: 'palm', palette: 2, seed: 1009 },
  { at: 23.4, x: 770, y: 137, radius: 57, kind: 'willow', palette: 0, seed: 1103 },
  { at: 26, x: 560, y: 111, radius: 59, kind: 'chrysanthemum', palette: 2, seed: 1201 },
  { at: 27.1, x: 1290, y: 159, radius: 41, kind: 'palm', palette: 1, seed: 1301 },
  { at: 30, x: 1040, y: 122, radius: 60, kind: 'willow', palette: 0, seed: 1409 },
  { at: 32.7, x: 430, y: 155, radius: 40, kind: 'palm', palette: 1, seed: 1511 },
  { at: 33.8, x: 870, y: 109, radius: 66, kind: 'chrysanthemum', palette: 0, seed: 1601 },
  { at: 36.7, x: 1270, y: 128, radius: 57, kind: 'willow', palette: 2, seed: 1709 },
  { at: 39.4, x: 600, y: 132, radius: 54, kind: 'chrysanthemum', palette: 0, seed: 1801 },
  { at: 40.5, x: 1080, y: 166, radius: 41, kind: 'palm', palette: 1, seed: 1901 },
  { at: 43.4, x: 1320, y: 111, radius: 61, kind: 'willow', palette: 0, seed: 2003 },
  { at: 46, x: 480, y: 119, radius: 57, kind: 'palm', palette: 2, seed: 2111 },
  { at: 47.1, x: 940, y: 139, radius: 49, kind: 'chrysanthemum', palette: 1, seed: 2203 },
  { at: 49.2, x: 670, y: 106, radius: 66, kind: 'chrysanthemum', palette: 0, seed: 2309 },
  { at: 50.3, x: 1210, y: 143, radius: 48, kind: 'palm', palette: 2, seed: 2411 },
  { at: 51.4, x: 840, y: 103, radius: 68, kind: 'willow', palette: 0, seed: 2609 },
] as const satisfies readonly FireworkCue[];

export class FireworksShow {
  private running = false;
  private elapsed = 0;
  private readonly onChange: ((active: boolean) => void) | undefined;

  constructor(onChange?: (active: boolean) => void) {
    this.onChange = onChange;
  }

  get active(): boolean { return this.running; }
  get time(): number { return this.elapsed; }

  start(): void {
    if (this.running) return;
    this.elapsed = 0;
    this.running = true;
    this.onChange?.(true);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.onChange?.(false);
  }

  advance(seconds: number): void {
    if (!this.running || !Number.isFinite(seconds) || seconds <= 0) return;
    this.elapsed = Math.min(FIREWORKS_DURATION, this.elapsed + seconds);
    if (this.elapsed === FIREWORKS_DURATION) this.stop();
  }
}
