import type { ClimateState } from './cyber-climate.ts';
import { drawStudioScreen, SCREEN_SIZE } from './penthouse-monitor.ts';
import { ROOM_OBJECTS, objectLighting } from './penthouse-objects.ts';
import { AtmosphereSimulation, GLASS_EDGE, GLASS_PANES, GLASS_OCCLUDERS, SKY_EDGE, WORKSPACE_CROP, MONITOR_SCREEN, ROOM_SIZE, atmosphereProfile, isGlass, isSky, seededRandom, type Point } from './penthouse-atmosphere.ts';

export interface WorkspaceState { monitor: boolean; lamp: boolean }

/** One bounded 30 fps compositor. Glass, skyline and workspace have separate masks. */
export function mountPenthouseEffects(canvas: HTMLCanvasElement, initialPlate: HTMLImageElement | null) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController();
  const sim = new AtmosphereSimulation();
  const random = seededRandom(310730);
  const dust = Array.from({length: 180}, () => ({ x: random() * 1295, y: random() * 582, speed: .55 + random(), phase: random() * 6.28 }));
  const stars = Array.from({length: 48}, () => ({ x: 191 + random() * 1295, y: 40 + random() * 185, phase: random() * 6.28, r: .35 + random() * .5 })).filter(p => isSky(p.x,p.y));
  // Small facade zones measured on the actual illustrated buildings, not the sky.
  const facades = [[244,260,28,45],[320,254,37,48],[419,258,30,50],[554,248,36,59],[718,214,20,90],[964,244,29,60],[1205,260,35,47],[1280,211,25,92],[1358,244,32,63],[1439,245,27,60]];
  const lights = facades.flatMap(([x,y,w,h]) => Array.from({length: 16}, () => ({
    x: x + Math.floor(random() * w / 4) * 4, y: y + 80 + Math.floor(random() * h / 6) * 6,
    phase: random() * 6.28, period: 9 + random() * 24, width: 1 + random() * 1.2,
  }))).filter(p => isGlass(p.x,p.y));
  let state: ClimateState = { season: 'autumn', time: 'night', weather: 'clear', auto: true };
  let workspace: WorkspaceState = { monitor: false, lamp: false };
  let plate = initialPlate;
  let exterior = initialPlate;
  let preview: HTMLCanvasElement | null = null;
  let screenPreview: HTMLCanvasElement | null = null;
  let animateView = true;
  let frame = 0, last = 0, painted = 0, typing = 0;
  let dead = false;
  const objects = ctx ? ROOM_OBJECTS.map(object => {
    const image = new Image();
    image.addEventListener('load', restart, { signal: abort.signal });
    image.src = object.src;
    return { ...object, image };
  }) : [];
  canvas.width = ROOM_SIZE[0]; canvas.height = ROOM_SIZE[1];

  function path(points: readonly Point[]) {
    ctx!.moveTo(...points[0]); for (const point of points.slice(1)) ctx!.lineTo(...point); ctx!.closePath();
  }
  function clipGlass() {
    ctx!.beginPath(); path(GLASS_EDGE); ctx!.clip();
    ctx!.beginPath(); for (const pane of GLASS_PANES) path(pane); ctx!.clip();
    for (const object of GLASS_OCCLUDERS) { ctx!.beginPath(); path(GLASS_EDGE); path(object); ctx!.clip('evenodd'); }
  }
  function glow(x: number, y: number, rx: number, ry: number, color: string, alpha: number) {
    ctx!.save(); ctx!.translate(x,y); ctx!.scale(rx,ry);
    const g = ctx!.createRadialGradient(0,0,0,0,0,1); g.addColorStop(0,color); g.addColorStop(1,'transparent');
    ctx!.globalAlpha = alpha; ctx!.fillStyle = g; ctx!.fillRect(-1,-1,2,2); ctx!.restore();
  }
  function drawSky() {
    const p = atmosphereProfile(state), t = sim.time;
    ctx!.save();
    ctx!.beginPath(); for (const pane of GLASS_PANES) path(pane); ctx!.clip();
    // Broad sky haze fades before indoor objects. Applying a haze wash through
    // conservative object masks would reveal rectangular clear holes at foliage.
    if (p.clouds) {
      const g = ctx!.createLinearGradient(0,32,0,270);
      g.addColorStop(0, p.night ? '#242c3e' : '#8e9ca7'); g.addColorStop(.35,p.night ? '#38434d' : '#b3bdc3'); g.addColorStop(1,'transparent');
      ctx!.globalAlpha = p.clouds; ctx!.fillStyle = g; ctx!.fillRect(191,32,1295,582);
      for (let i = 0; i < 5; i++) glow(290 + i * 265 + Math.sin(t * .025 + i) * 40, 110 + i % 2 * 40, 255,43,p.night ? '#66727f' : '#e2e5e4',p.clouds * .13);
    }
    if (p.mist) for (let i = 0; i < 4; i++) glow(320 + i * 320 + Math.sin(t * .022 + i) * 45, 155 + i % 2 * 15,390,58,p.night ? '#a5b1be' : '#e8e7df',.23);
    ctx!.globalAlpha = 1;
    clipGlass();
    if (p.night) {
      for (const l of lights) {
        const a = (.35 + Math.sin(t / l.period * 6.28 + l.phase) * .23) * p.night;
        ctx!.fillStyle = `rgba(255,220,163,${a})`; ctx!.fillRect(l.x,l.y,l.width,2.2);
      }
      // Short horizontal glints ripple within the Han River, below the far bank.
      ctx!.save(); ctx!.beginPath(); path([[228,433],[1486,433],[1486,495],[228,495]]); ctx!.clip();
      for (let i = 0; i < 26; i++) {
        const x = 242 + i * 47 + Math.sin(t * .35 + i) * 2;
        const y = 437 + (i * 17 % 51);
        ctx!.strokeStyle = `rgba(255,219,155,${p.night * (.13 + .08 * Math.sin(t * .65 + i))})`;
        ctx!.lineWidth = .7; ctx!.beginPath(); ctx!.moveTo(x,y); ctx!.lineTo(x + 3 + (i % 4),y); ctx!.stroke();
      }
      ctx!.restore();
      // A faint task-light reflection belongs to the same pane as the desk.
      if (workspace.lamp) glow(1098,380,20,57,'#f1d7ac',p.night * .035);
    }
    if (p.stars) {
      ctx!.save(); ctx!.beginPath(); path(SKY_EDGE); ctx!.clip();
      for (const s of stars) {
        ctx!.fillStyle = `rgba(220,228,239,${.15 + .12 * Math.sin(t * .4 + s.phase)})`;
        ctx!.beginPath(); ctx!.arc(s.x,s.y,s.r,0,6.28); ctx!.fill();
      }
      if (sim.meteor && animateView && !reduced.matches) {
        const m = sim.meteor, progress = m.age / m.duration;
        const x = m.x + progress * 125, y = m.y + progress * 67;
        const gradient = ctx!.createLinearGradient(x - 80,y - 43,x,y);
        gradient.addColorStop(0,'transparent'); gradient.addColorStop(1,`rgba(244,236,216,${Math.sin(progress * Math.PI) * .85})`);
        ctx!.strokeStyle = gradient; ctx!.lineWidth = 1.2; ctx!.beginPath(); ctx!.moveTo(x - 80,y - 43); ctx!.lineTo(x,y); ctx!.stroke();
      }
      ctx!.restore();
    }
    if (p.rain || p.snow) {
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i], near = i % 3 === 0;
        const y = 32 + (d.y + t * d.speed * (p.snow ? 19 : near ? 480 : 300)) % 582;
        const x = 191 + (d.x + (p.snow ? Math.sin(t * .35 + d.phase) * 15 : y * .11) + 1295) % 1295;
        ctx!.beginPath();
        if (p.snow) {
          ctx!.fillStyle = `rgba(241,244,246,${near ? .7 : .34})`; ctx!.arc(x,y,near ? 1.9 : .85,0,6.28); ctx!.fill();
        } else {
          ctx!.strokeStyle = `rgba(202,218,233,${near ? .34 : .18})`; ctx!.lineWidth = near ? 1.1 : .6;
          ctx!.moveTo(x,y); ctx!.lineTo(x + (near ? 3 : 1.5),y + (near ? 25 : 12)); ctx!.stroke();
        }
      }
    }
    const wetness = reduced.matches || !animateView ? (p.rain ? 1 : 0) : sim.wetness;
    if (wetness > .01) {
      for (const d of sim.drops) {
        const r = d.radius, moving = d.speed > 0;
        ctx!.save(); ctx!.globalAlpha = wetness * .74;
        if (moving) {
          const trail = ctx!.createLinearGradient(d.x,d.y - 42,d.x,d.y);
          trail.addColorStop(0,'transparent'); trail.addColorStop(1,'#d5e0e733');
          ctx!.strokeStyle = trail; ctx!.lineWidth = r * .65; ctx!.beginPath(); ctx!.moveTo(d.x - 1,d.y - 42); ctx!.quadraticCurveTo(d.x + 2,d.y - 17,d.x,d.y); ctx!.stroke();
        }
        ctx!.beginPath(); ctx!.ellipse(d.x,d.y,r,moving ? r * 1.7 : r * 1.2,0,0,6.28);
        ctx!.save(); ctx!.clip();
        if (exterior?.complete && exterior.naturalWidth) {
          // Local plate sample magnified inside each bead: actual optical distortion.
          ctx!.drawImage(exterior,(d.x-r*.7) / 1672 * exterior.naturalWidth,(d.y-r*.8) / 941 * exterior.naturalHeight,r*1.4 / 1672 * exterior.naturalWidth,r*1.6 / 941 * exterior.naturalHeight,d.x-r,d.y-r*1.7,r*2,r*3.4);
        }
        ctx!.fillStyle = '#a1c0d321'; ctx!.fill(); ctx!.restore();
        ctx!.strokeStyle = '#12223488'; ctx!.lineWidth = .65; ctx!.stroke();
        ctx!.beginPath(); ctx!.ellipse(d.x - r*.2,d.y - r*.25,r*.6,r*.9,-.2,3.4,5.3); ctx!.strokeStyle = '#e5eff7a0'; ctx!.lineWidth = .6; ctx!.stroke(); ctx!.restore();
      }
    }
    ctx!.restore();
  }
  function drawWorkspace() {
    const night = atmosphereProfile(state).night;
    if (workspace.lamp) {
      ctx!.save(); ctx!.beginPath(); path([[1007,552],[1215,552],[1254,573],[1003,573]]); ctx!.clip();
      glow(1090,560,120,15,'#ffdf9d',.42); ctx!.restore();
      glow(1078,516,27,44,'#ffe9bd',.075);
      // The Kelvin head varies subtly with each lighting plate; a soft emission
      // avoids a detached hard-coded bulb over the softly painted metal edge.
      glow(1060,466,31,5,'#fff0c8',.44);
    }
    if (workspace.monitor) {
      glow(916,562,86,12,'#bad4e9',.08 + night * .09);
      ctx!.save(); ctx!.beginPath(); path(MONITOR_SCREEN); ctx!.clip();
      ctx!.translate(839,429); ctx!.scale(152 / SCREEN_SIZE[0],90 / SCREEN_SIZE[1]);
      drawStudioScreen(ctx!,typing,reduced.matches || !animateView,state,plate);
      ctx!.restore();
    }
  }
  function drawObjects() {
    ctx!.save();
    ctx!.filter = objectLighting(state);
    for (const { image, rect } of objects) {
      if (image.complete && image.naturalWidth) ctx!.drawImage(image, rect[0], rect[1], rect[2], rect[3]);
    }
    ctx!.restore();
  }
  function drawPreview() {
    const c = preview?.getContext('2d'); if (!c || !preview) return;
    c.clearRect(0,0,preview.width,preview.height);
    const [x,y,width,height] = WORKSPACE_CROP;
    if (plate?.complete && plate.naturalWidth) c.drawImage(plate,x / 1672 * plate.naturalWidth,y / 941 * plate.naturalHeight,width / 1672 * plate.naturalWidth,height / 941 * plate.naturalHeight,0,0,width,height);
    c.drawImage(canvas,x,y,width,height,0,0,width,height);
    if (screenPreview) {
      screenPreview.hidden = !workspace.monitor;
      const screenContext = screenPreview.getContext('2d');
      if (workspace.monitor && screenContext) drawStudioScreen(screenContext,typing,reduced.matches || !animateView,state,plate);
    }
  }
  function render() {
    if (!ctx || dead) return;
    ctx.clearRect(0,0,...ROOM_SIZE); drawSky(); drawObjects(); drawWorkspace(); drawPreview();
  }
  function needsMotion() {
    return atmosphereProfile(state).night > 0 || state.weather !== 'clear' || sim.wetness > .01 || (workspace.monitor && typing < 12);
  }
  function loop(now: number) {
    frame = 0;
    if (dead || !ctx || document.hidden || reduced.matches || !animateView) return;
    if (now - painted >= 1000 / 30) {
      const dt = last ? Math.min((now - last) / 1000,.1) : 0;
      last = now; painted = now; sim.advance(dt,state);
      if (workspace.monitor) typing += dt;
      render();
    }
    if (needsMotion()) frame = requestAnimationFrame(loop);
  }
  function restart() {
    cancelAnimationFrame(frame); frame = 0; last = 0; painted = 0;
    if (dead || document.hidden) return;
    render();
    if (ctx && animateView && !reduced.matches && needsMotion()) frame = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', restart, { signal: abort.signal });
  reduced.addEventListener('change', restart, { signal: abort.signal });
  initialPlate?.addEventListener?.('load', restart, { signal: abort.signal });
  return {
    update(next: ClimateState) { state = next; if (state.weather !== 'clear' || state.time !== 'night') sim.meteor = null; restart(); },
    setPlate(image: HTMLImageElement, outside: HTMLImageElement = image) { plate = image; exterior = outside; restart(); },
    setWorkspace(next: WorkspaceState) { if (!workspace.monitor && next.monitor) typing = 0; workspace = next; restart(); },
    setAnimated(enabled: boolean) { animateView = enabled; sim.meteor = null; restart(); },
    setPreview(next: HTMLCanvasElement | null, screen: HTMLCanvasElement | null = null) { preview = next; screenPreview = screen; if (screenPreview) { screenPreview.width = SCREEN_SIZE[0]; screenPreview.height = SCREEN_SIZE[1]; } if (preview) { preview.width = WORKSPACE_CROP[2]; preview.height = WORKSPACE_CROP[3]; } render(); },
    destroy() { dead = true; abort.abort(); cancelAnimationFrame(frame); frame = 0; preview = null; screenPreview = null; plate = null; exterior = null; for (const {image} of objects) image.src = ''; },
  };
}
