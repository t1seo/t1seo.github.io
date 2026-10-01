import type { ClimateState } from './cyber-climate.ts';
import { drawStudioScreen, SCREEN_SIZE, type ScreenContext } from './penthouse-monitor.ts';

type ScreenSurface = HTMLCanvasElement | OffscreenCanvas;

export class StudioScreenCache {
  private surface: ScreenSurface | null = null;
  private paint: ScreenContext | null = null;
  private initialized = false;
  private revision = '';
  private plate: HTMLImageElement | null = null;

  private prepare(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (typeof OffscreenCanvas !== 'undefined') {
      const surface = new OffscreenCanvas(...SCREEN_SIZE);
      const paint = surface.getContext('2d');
      if (paint) { this.surface = surface; this.paint = paint; return; }
    }
    const surface = document.createElement('canvas');
    surface.width = SCREEN_SIZE[0]; surface.height = SCREEN_SIZE[1];
    this.surface = surface; this.paint = surface.getContext('2d');
  }

  draw(destination: CanvasRenderingContext2D, seconds: number, still: boolean, state: ClimateState, plate: HTMLImageElement | null): void {
    this.prepare();
    const complete = still || seconds >= 12;
    const progress = complete ? 'complete' : `${Math.floor(seconds * 38)}:${Math.floor(seconds * 2) % 2}`;
    const revision = `${state.season}:${state.time}:${state.weather}:${progress}:${plate?.src}:${plate?.complete}:${plate?.naturalWidth}:${plate?.naturalHeight}`;
    if (!this.surface || !this.paint) { drawStudioScreen(destination,seconds,still,state,plate); return; }
    if (revision !== this.revision || plate !== this.plate) {
      drawStudioScreen(this.paint,seconds,complete,state,plate);
      this.revision = revision; this.plate = plate;
    }
    destination.drawImage(this.surface,0,0);
  }

  clear(): void {
    if (this.surface) { this.surface.width = 0; this.surface.height = 0; }
    this.surface = null; this.paint = null; this.plate = null; this.revision = '';
  }
}
