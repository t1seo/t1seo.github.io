type LightPaint = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type LightSurface = HTMLCanvasElement | OffscreenCanvas;
type LightPoint = readonly [number, number];

function paintLoungeLight(c: LightPaint): void {
  const clip = (points: readonly LightPoint[]) => {
    const [first,...remaining] = points;
    if (!first) return;
    c.beginPath(); c.moveTo(...first);
    for (const point of remaining) c.lineTo(...point);
    c.closePath(); c.clip();
  };
  const wash = (x: number, y: number, width: number, height: number, opacity: number) => {
    c.save(); c.translate(x,y); c.scale(width,height);
    const gradient = c.createRadialGradient(0,0,0,0,0,1);
    gradient.addColorStop(0,'#ffdfb0'); gradient.addColorStop(.45,'#f6d6a777'); gradient.addColorStop(1,'#f6d6a700');
    c.fillStyle = gradient; c.globalAlpha = opacity; c.fillRect(-1,-1,2,2); c.restore();
  };
  c.save(); c.translate(0,-380);
  c.save(); clip([[176,390],[223,390],[250,447],[154,447]]);
  wash(204,434,51,52,.4); c.restore();
  wash(204,447,43,3,.3);
  c.save(); clip([[45,566],[165,547],[189,553],[217,614],[164,631],[69,618]]);
  wash(175,574,114,100,.095); c.restore();
  c.save(); clip([[216,627],[290,631],[327,649],[321,678],[296,693],[251,694],[241,659]]);
  wash(263,646,92,63,.08); c.restore();
  wash(190,745,130,24,.12);
  c.restore();
}

export class LoungeLight {
  private surface: LightSurface | null = null;
  private initialized = false;

  private prepare(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (typeof OffscreenCanvas !== 'undefined') {
      const surface = new OffscreenCanvas(360,400);
      const paint = surface.getContext('2d');
      if (paint) { paintLoungeLight(paint); this.surface = surface; return; }
    }
    const surface = document.createElement('canvas');
    surface.width = 360; surface.height = 400;
    const paint = surface.getContext('2d');
    if (paint) { paintLoungeLight(paint); this.surface = surface; }
  }

  draw(destination: CanvasRenderingContext2D, night: number): void {
    this.prepare();
    if (!this.surface) return;
    destination.save(); destination.globalAlpha = .5 + night * .5;
    destination.drawImage(this.surface,0,380); destination.restore();
  }

  clear(): void {
    if (this.surface) { this.surface.width = 0; this.surface.height = 0; }
    this.surface = null;
  }
}
