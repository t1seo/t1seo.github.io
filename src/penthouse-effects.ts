import type { ClimateState } from './cyber-climate.ts';
import { SCREEN_SIZE } from './penthouse-monitor.ts';
import { StudioScreenCache } from './penthouse-monitor-cache.ts';
import { LoungeLight } from './penthouse-lounge-light.ts';
import { ROOM_OBJECTS, objectLighting } from './penthouse-objects.ts';
import { RoomLife, type CupSpot } from './penthouse-room-life.ts';
import { SingingBowl } from './penthouse-singing-bowl.ts';
import { AdaptiveEffectQuality, EFFECT_DENSITY } from './penthouse-quality.ts';
import { FireworksShow } from './penthouse-fireworks-show.ts';
import { FireworksPaint } from './penthouse-fireworks-paint.ts';
import { AtmosphereSimulation, GLASS_EDGE, GLASS_PANES, GLASS_OCCLUDERS, SKY_EDGE, WORKSPACE_CROP, MONITOR_SCREEN, ROOM_SIZE, atmosphereProfile, isSky, seededRandom, type Point } from './penthouse-atmosphere.ts';

export interface WorkspaceState { monitor: boolean; lamp: boolean; floorLamp?: boolean }
type LitObject = { readonly image: HTMLImageElement; readonly rect: readonly [number, number, number, number]; texture?: OffscreenCanvas; lighting?: string };

/** One bounded 30 fps compositor. Glass, skyline and workspace have separate masks. */
export function mountPenthouseEffects(canvas: HTMLCanvasElement, initialPlate: HTMLImageElement | null, onFireworksChange?: (active: boolean) => void) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController();
  const sim = new AtmosphereSimulation();
  const roomLife = new RoomLife();
  const bowl = new SingingBowl();
  const screen = new StudioScreenCache();
  const loungeLight = new LoungeLight();
  const quality = new AdaptiveEffectQuality();
  const fireworks = new FireworksShow(onFireworksChange);
  let fireworksPaint: FireworksPaint | null = null;
  let fireworksTick: number | null = null;
  const random = seededRandom(310730);
  const dust = Array.from({length: 180}, () => ({ x: random() * 1295, y: random() * 582, speed: .55 + random(), phase: random() * 6.28 }));
  const stars = Array.from({length: 48}, () => ({ x: 191 + random() * 1295, y: 40 + random() * 185, phase: random() * 6.28, r: .35 + random() * .5 })).filter(p => isSky(p.x,p.y));
  let state: ClimateState = { season: 'autumn', time: 'night', weather: 'clear', auto: true };
  let workspace: WorkspaceState = { monitor: true, lamp: true };
  let plate = initialPlate;
  let exterior = initialPlate;
  let preview: HTMLCanvasElement | null = null;
  let screenPreview: HTMLCanvasElement | null = null;
  let animateView = true;
  let frame = 0, last = 0, painted = 0, sampled = 0, typing = 12;
  let dead = false;
  const objects: LitObject[] = ctx ? ROOM_OBJECTS.map(object => {
    const image = new Image();
    image.addEventListener('load', restart, { signal: abort.signal });
    image.src = object.src;
    return { ...object, image };
  }) : [];
  canvas.width = ROOM_SIZE[0]; canvas.height = ROOM_SIZE[1];
  canvas.dataset.effectDetail = quality.detail;

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
  function drawSky(ctx: CanvasRenderingContext2D) {
    const p = atmosphereProfile(state), t = sim.time;
    const density = EFFECT_DENSITY[quality.detail];
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
    if (fireworks.active) fireworksPaint?.draw(ctx, fireworks.time, p.night, density.particles);
    if (p.night) {
      roomLife.drawCity(ctx, t, p.night);
      // Short horizontal glints ripple within the Han River, below the far bank.
      ctx!.save(); ctx!.beginPath(); path([[228,433],[1486,433],[1486,495],[228,495]]); ctx!.clip();
      for (let i = 0; i < Math.ceil(26 * density.reflections); i++) {
        const index = Math.floor(i / density.reflections);
        const x = 242 + index * 47 + Math.sin(t * .35 + index) * 2;
        const y = 437 + (index * 17 % 51);
        ctx!.strokeStyle = `rgba(255,219,155,${p.night * (.13 + .08 * Math.sin(t * .65 + index))})`;
        ctx!.lineWidth = .7; ctx!.beginPath(); ctx!.moveTo(x,y); ctx!.lineTo(x + 3 + (index % 4),y); ctx!.stroke();
      }
      ctx!.restore();
      if (workspace.lamp) glow(1153,426,29,13,'#f1d7ac',p.night * .028);
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
      for (let i = 0; i < Math.ceil(dust.length * density.particles); i++) {
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
      for (let i = 0; i < Math.ceil(sim.drops.length * density.beads); i++) {
        const d = sim.drops[i];
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
    if (workspace.floorLamp && ctx) loungeLight.draw(ctx,night);
    if (workspace.lamp) {
      ctx!.save(); ctx!.beginPath(); path([[1044,550],[1220,550],[1215,575],[1036,575]]); ctx!.clip();
      glow(1129,559,90,14,'#ffdda0',.56 + night * .08); ctx!.restore();
      ctx!.save(); ctx!.beginPath(); path([[1131,431],[1175,442],[1189,568],[1038,568]]); ctx!.clip();
      glow(1127,520,84,67,'#ffe9bd',.075); ctx!.restore();
      ctx!.save(); ctx!.translate(1153,431); ctx!.rotate(.28);
      glow(0,0,22,4.4,'#fff0c6',.68 + night * .1); ctx!.restore();
    }
    if (workspace.monitor) {
      glow(916,562,86,12,'#bad4e9',.08 + night * .09);
      ctx!.save(); ctx!.beginPath(); path(MONITOR_SCREEN); ctx!.clip();
      ctx!.translate(839,429); ctx!.scale(152 / SCREEN_SIZE[0],90 / SCREEN_SIZE[1]);
      screen.draw(ctx!,typing,reduced.matches || !animateView,state,plate);
      ctx!.restore();
    }
  }
  function drawObjects() {
    if (!ctx) return;
    const lighting = objectLighting(state);
    for (const object of objects) {
      const { image, rect } = object;
      if (!image.complete || !image.naturalWidth) continue;
      if (object.lighting !== lighting && typeof OffscreenCanvas !== 'undefined') {
        const texture = object.texture ?? new OffscreenCanvas(Math.ceil(rect[2]), Math.ceil(rect[3]));
        const paint = texture.getContext('2d');
        if (paint) {
          paint.clearRect(0, 0, texture.width, texture.height);
          paint.filter = lighting;
          paint.drawImage(image, 0, 0, rect[2], rect[3]);
          object.texture = texture;
        }
        object.lighting = lighting;
      }
      if (object.texture) ctx.drawImage(object.texture, rect[0], rect[1]);
      else {
        ctx.save(); ctx.filter = lighting;
        ctx.drawImage(image, rect[0], rect[1], rect[2], rect[3]); ctx.restore();
      }
    }
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
      if (workspace.monitor && screenContext) screen.draw(screenContext,typing,reduced.matches || !animateView,state,plate);
    }
  }
  function render() {
    if (!ctx || dead) return;
    ctx.clearRect(0,0,...ROOM_SIZE); drawSky(ctx); drawObjects(); drawWorkspace(); roomLife.drawSteam(ctx, reduced.matches || !animateView); bowl.draw(ctx, reduced.matches || !animateView); drawPreview();
  }
  function needsMotion() {
    return fireworks.active || roomLife.active || bowl.active || atmosphereProfile(state).night > 0 || state.weather !== 'clear' || sim.wetness > .01 || (workspace.monitor && typing < 12);
  }
  function loop(now: number) {
    frame = 0;
    if (dead || !ctx || document.hidden || reduced.matches || !animateView) return;
    const frameDuration = sampled ? now - sampled : 0;
    sampled = now;
    let paintDuration: number | undefined;
    if (now - painted >= 1000 / 30) {
      const paintStart = performance.now();
      const dt = last ? Math.min((now - last) / 1000,.1) : 0;
      last = now; painted = now; sim.advance(dt,state); roomLife.advance(dt); bowl.advance(dt);
      if (fireworks.active) { if (fireworksTick !== null) fireworks.advance(Math.max(0, now - fireworksTick) / 1000); fireworksTick = now; }
      if (workspace.monitor) typing = Math.min(12,typing + dt);
      render();
      paintDuration = performance.now() - paintStart;
    }
    quality.sample(frameDuration, paintDuration);
    if (canvas.dataset.effectDetail !== quality.detail) canvas.dataset.effectDetail = quality.detail;
    if (needsMotion()) frame = requestAnimationFrame(loop);
  }
  function restart() {
    cancelAnimationFrame(frame); frame = 0; last = 0; painted = 0; sampled = 0; quality.resetSampling();
    if (dead || document.hidden || !animateView || reduced.matches) fireworks.stop();
    if (dead || document.hidden) return;
    render();
    if (ctx && animateView && !reduced.matches && needsMotion()) frame = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', restart, { signal: abort.signal });
  reduced.addEventListener('change', restart, { signal: abort.signal });
  initialPlate?.addEventListener?.('load', restart, { signal: abort.signal });
  return {
    get effectDetail() { return quality.detail; },
    get fireworksActive() { return fireworks.active; },
    startFireworks() { if (!ctx || dead || document.hidden || !animateView || reduced.matches) return false; fireworksPaint ??= new FireworksPaint(); if (!fireworks.active) fireworksTick = null; fireworks.start(); restart(); return true; },
    stopFireworks() { fireworks.stop(); restart(); },
    update(next: ClimateState) { state = next; if (state.weather !== 'clear' || state.time !== 'night') sim.meteor = null; restart(); },
    setPlate(image: HTMLImageElement, outside: HTMLImageElement = image) { plate = image; exterior = outside; restart(); },
    setWorkspace(next: WorkspaceState) { if (!workspace.monitor && next.monitor) typing = 0; workspace = { ...next }; restart(); },
    setAnimated(enabled: boolean) { animateView = enabled; sim.meteor = null; restart(); },
    savorCoffee(kind: CupSpot) { roomLife.savorCoffee(kind, reduced.matches || !animateView); restart(); },
    scentDiffuser() { roomLife.scentDiffuser(reduced.matches || !animateView); restart(); },
    strikeBowl() { bowl.strike(reduced.matches || !animateView); restart(); },
    setPreview(next: HTMLCanvasElement | null, screen: HTMLCanvasElement | null = null) { preview = next; screenPreview = screen; if (screenPreview) { screenPreview.width = SCREEN_SIZE[0]; screenPreview.height = SCREEN_SIZE[1]; } if (preview) { preview.width = WORKSPACE_CROP[2]; preview.height = WORKSPACE_CROP[3]; } render(); },
    destroy() { dead = true; abort.abort(); cancelAnimationFrame(frame); fireworks.stop(); fireworksPaint = null; roomLife.clear(); bowl.clear(); screen.clear(); loungeLight.clear(); frame = 0; preview = null; screenPreview = null; plate = null; exterior = null; for (const object of objects) { object.image.src = ''; object.texture = undefined; } },
  };
}
