import type { ClimateState } from './cyber-climate.ts';
import { AtmosphereSimulation, GLASS_EDGE, GLASS_PANES, ROOM_SIZE, atmosphereProfile, isGlass, isSky, seededRandom, type Point } from './penthouse-atmosphere.ts';

export interface WorkspaceState { monitor: boolean; lamp: boolean }
const CODE = ['// AFTER HOURS', 'const home = {', '  companion: "Milky",', '  city: "asleep",', '  ideas: Infinity', '};', '', 'makeSomethingGood();'];

/** One bounded 30 fps compositor. Glass, skyline and workspace have separate masks. */
export function mountPenthouseEffects(canvas: HTMLCanvasElement, initialPlate: HTMLImageElement | null) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController();
  const sim = new AtmosphereSimulation();
  const random = seededRandom(310730);
  const dust = Array.from({length: 180}, () => ({ x: random() * 1150, y: random() * 600, speed: .55 + random(), phase: random() * 6.28 }));
  const stars = Array.from({length: 48}, () => ({ x: random() * 1050, y: 70 + random() * 215, phase: random() * 6.28, r: .35 + random() * .5 })).filter(p => isSky(p.x,p.y));
  // Small facade zones measured on the actual illustrated buildings, not the sky.
  const facades = [[450,316,20,89],[510,316,18,89],[20,379,43,126],[245,389,23,66],[910,382,16,70],[997,369,20,88],[1026,375,22,83]];
  const lights = facades.flatMap(([x,y,w,h]) => Array.from({length: 20}, () => ({
    x: x + Math.floor(random() * w / 4) * 4, y: y + Math.floor(random() * h / 6) * 6,
    phase: random() * 6.28, period: 9 + random() * 24, width: 1 + random() * 1.2,
  }))).filter(p => isGlass(p.x,p.y));
  let state: ClimateState = { season: 'autumn', time: 'night', weather: 'clear', auto: true };
  let workspace: WorkspaceState = { monitor: false, lamp: false };
  let plate = initialPlate;
  let preview: HTMLCanvasElement | null = null;
  let animateView = true;
  let frame = 0, last = 0, painted = 0, typing = 0;
  let dead = false;
  canvas.width = ROOM_SIZE[0]; canvas.height = ROOM_SIZE[1];

  function path(points: readonly Point[]) {
    ctx!.moveTo(...points[0]); for (const point of points.slice(1)) ctx!.lineTo(...point); ctx!.closePath();
  }
  function clipGlass() {
    ctx!.beginPath(); path(GLASS_EDGE); ctx!.clip();
    ctx!.beginPath(); for (const pane of GLASS_PANES) path(pane); ctx!.clip();
  }
  function glow(x: number, y: number, rx: number, ry: number, color: string, alpha: number) {
    ctx!.save(); ctx!.translate(x,y); ctx!.scale(rx,ry);
    const g = ctx!.createRadialGradient(0,0,0,0,0,1); g.addColorStop(0,color); g.addColorStop(1,'transparent');
    ctx!.globalAlpha = alpha; ctx!.fillStyle = g; ctx!.fillRect(-1,-1,2,2); ctx!.restore();
  }
  function drawSky() {
    const p = atmosphereProfile(state), t = sim.time;
    ctx!.save(); clipGlass();
    // Clouds build up over the sky; river/facades retain depth through the lower haze.
    if (p.clouds) {
      const g = ctx!.createLinearGradient(0,120,0,540);
      g.addColorStop(0, p.night ? '#242c3e' : '#8e9ca7'); g.addColorStop(.65,p.night ? '#38434d' : '#b3bdc3'); g.addColorStop(1,'transparent');
      ctx!.globalAlpha = p.clouds; ctx!.fillStyle = g; ctx!.fillRect(0,0,1100,570);
      for (let i = 0; i < 5; i++) glow(120 + i * 230 + Math.sin(t * .025 + i) * 55, 230 + i % 2 * 48, 235,55,p.night ? '#66727f' : '#e2e5e4',p.clouds * .13);
    }
    ctx!.globalAlpha = 1;
    if (p.night) {
      for (const l of lights) {
        const a = (.35 + Math.sin(t / l.period * 6.28 + l.phase) * .23) * p.night;
        ctx!.fillStyle = `rgba(255,220,163,${a})`; ctx!.fillRect(l.x,l.y,l.width,2.2);
      }
      // Narrow reflections follow the river's perspective and exclude the near bank.
      ctx!.save(); ctx!.beginPath(); path([[643,429],[719,421],[868,449],[1066,489],[1066,500],[794,469],[704,458],[643,450]]); ctx!.clip();
      for (let i = 0; i < 60; i++) {
        const y = 424 + i * 1.4, x = 650 + i * 6.5 + Math.sin(t * .32 + i) * 3;
        ctx!.fillStyle = `rgba(246,209,151,${(.12 + .12 * Math.sin(t + i)) * p.night})`;
        ctx!.fillRect(x,y,5 + i % 9, .65);
      }
      ctx!.restore();
      // Faint room-light reflections in the glass, strongest after sunset.
      ctx!.save(); ctx!.globalAlpha = p.night * .12; ctx!.lineWidth = 1.2; ctx!.strokeStyle = '#f1d7ac';
      ctx!.beginPath(); ctx!.moveTo(4,128); ctx!.lineTo(336,158); ctx!.moveTo(403,182); ctx!.lineTo(483,254); ctx!.stroke(); ctx!.restore();
      glow(480,307,29,123,'#d7cfbf',p.night * .035);
    }
    if (p.stars) {
      ctx!.save(); ctx!.beginPath(); ctx!.rect(0,0,1100,293); ctx!.clip();
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
    if (p.mist) for (let i = 0; i < 4; i++) glow(230 + i * 210 + Math.sin(t * .022 + i) * 65, 370 + i * 23,390,68,p.night ? '#a5b1be' : '#e8e7df',.18);
    if (p.rain || p.snow) {
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i], near = i % 3 === 0;
        const y = (d.y + t * d.speed * (p.snow ? 19 : near ? 480 : 300)) % 620 - 20;
        const x = (d.x + (p.snow ? Math.sin(t * .35 + d.phase) * 15 : y * .11)) % 1120;
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
        if (plate?.complete && plate.naturalWidth) {
          // Local plate sample magnified inside each bead: actual optical distortion.
          ctx!.drawImage(plate,(d.x-r*.7) / 1672 * plate.naturalWidth,(d.y-r*.8) / 941 * plate.naturalHeight,r*1.4 / 1672 * plate.naturalWidth,r*1.6 / 941 * plate.naturalHeight,d.x-r,d.y-r*1.7,r*2,r*3.4);
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
      // Desk top receives the pool; the chair and monitor do not get painted over.
      ctx!.save(); ctx!.beginPath(); path([[1415,461],[1588,478],[1590,496],[1408,478]]); ctx!.clip();
      glow(1493,470,100,25,'#ffe0a3',.52); ctx!.restore();
      glow(1484,423,36,49,'#ffe9bd',.13);
      ctx!.strokeStyle = '#fff1ce'; ctx!.lineWidth = 2; ctx!.beginPath(); ctx!.moveTo(1462,382); ctx!.lineTo(1513,381); ctx!.stroke();
      glow(1487,383,37,7,'#ffe0a3',.28);
    }
    if (workspace.monitor) {
      glow(1383,471,72,16,'#bad4e9',.09 + night * .1);
      ctx!.save(); ctx!.beginPath(); path([[1331,369],[1431,362],[1428,440],[1328,435]]); ctx!.clip();
      ctx!.fillStyle = '#152432'; ctx!.fillRect(1320,357,115,90);
      // Register a gently sloping display plane to the illustrated monitor bezel.
      ctx!.transform(1,-.055,-.035,1,1334,373);
      ctx!.font = '3.6px ui-monospace, monospace';
      const total = reduced.matches || !animateView ? 500 : Math.floor(typing * 22);
      let remaining = total;
      CODE.forEach((line,i) => {
        ctx!.fillStyle = i === 0 ? '#99afa9' : i < 6 ? '#d0dce2' : '#d6bea0';
        const visible = line.slice(0,Math.max(0,remaining)); remaining -= line.length;
        ctx!.fillText(visible,1,5 + i * 6.7);
        if (remaining >= -line.length && remaining <= 0 && Math.floor(typing * 2) % 2 === 0 && animateView && !reduced.matches) ctx!.fillRect(1 + ctx!.measureText(visible).width,1 + i*6.7,1.8,4);
      });
      ctx!.restore();
    }
  }
  function drawPreview() {
    const c = preview?.getContext('2d'); if (!c || !preview) return;
    c.clearRect(0,0,preview.width,preview.height);
    if (plate?.complete && plate.naturalWidth) c.drawImage(plate,1140 / 1672 * plate.naturalWidth,320 / 941 * plate.naturalHeight,530 / 1672 * plate.naturalWidth,330 / 941 * plate.naturalHeight,0,0,530,330);
    c.drawImage(canvas,1140,320,530,330,0,0,530,330);
  }
  function render() {
    if (!ctx || dead) return;
    ctx.clearRect(0,0,...ROOM_SIZE); drawSky(); drawWorkspace(); drawPreview();
  }
  function needsMotion() {
    return atmosphereProfile(state).night > 0 || state.weather !== 'clear' || sim.wetness > .01 || (workspace.monitor && typing < 10);
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
    setPlate(image: HTMLImageElement) { plate = image; restart(); },
    setWorkspace(next: WorkspaceState) { if (!workspace.monitor && next.monitor) typing = 0; workspace = next; restart(); },
    setAnimated(enabled: boolean) { animateView = enabled; sim.meteor = null; restart(); },
    setPreview(next: HTMLCanvasElement | null) { preview = next; if (preview) { preview.width = 530; preview.height = 330; } render(); },
    destroy() { dead = true; abort.abort(); cancelAnimationFrame(frame); frame = 0; preview = null; plate = null; },
  };
}
