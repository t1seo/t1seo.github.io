import { createGroundedWalkAssetLoader, decodeGroundedWalkImage } from '../../src/cyber-pet-grounded-assets.ts';
import { AUTHORED_CANINE_URL, loadAuthoredCanine } from '../../src/cyber-pet-authored-clip.ts';
import type { AuthoredCanine } from '../../src/cyber-pet-authored-clip.ts';
import { createAuthoredRig } from '../../src/cyber-pet-authored-rig.ts';
import { createGroundedPainter } from '../../src/cyber-pet-grounded-render.ts';
import type { GroundedRenderSample } from '../../src/cyber-pet-grounded-render.ts';
import { createGroundedPose } from '../../src/cyber-pet-grounded-plan.ts';
import { GROUNDED_ART, GROUNDED_FEET, GROUNDED_JOINTS, GROUNDED_LIMBS } from '../../src/cyber-pet-grounded-geometry.ts';
import { GROUNDED_PADS } from '../../src/cyber-pet-grounded-articulation.ts';
import type { GroundedFoot } from '../../src/cyber-pet-grounded-geometry.ts';
import type { GroundedSkeleton } from '../../src/cyber-pet-grounded-articulation.ts';
import { createNaturalPainter } from '../../src/cyber-pet-natural-render.ts';
import type { NaturalSkeleton } from '../../src/cyber-pet-natural-render.ts';
import { loadNaturalMotion } from '../../src/cyber-pet-natural-motion.ts';

type Mode = 'travelling' | 'treadmill';
type Motion = Awaited<ReturnType<typeof loadNaturalMotion>> & { dispose?: () => void };
const $ = <T extends HTMLElement>(id: string) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing motion lab element: ${id}`);
  return element as T;
};
const canvases = [$<HTMLCanvasElement>('released'), $<HTMLCanvasElement>('candidate')] as const;
const contexts = canvases.map(canvas => canvas.getContext('2d'));
if (!contexts[0] || !contexts[1]) throw new Error('The motion comparison needs Canvas 2D.');
const releasedContext = contexts[0], candidateContext = contexts[1];
const playButton = $<HTMLButtonElement>('play');
const timeInput = $<HTMLInputElement>('time');
const speedInput = $<HTMLSelectElement>('speed');
const sizeInput = $<HTMLSelectElement>('size');
const modeInput = $<HTMLSelectElement>('mode');
const feetInput = $<HTMLInputElement>('feet');
const diagnosticsInput = $<HTMLInputElement>('diagnostics');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const abort = new AbortController();
const assetsLoader = createGroundedWalkAssetLoader(decodeGroundedWalkImage);
let canine: AuthoredCanine | null = null;
let motion: Motion | null = null;
let rig: ReturnType<typeof createAuthoredRig> | null = null;
let releasedPainter: ReturnType<typeof createGroundedPainter> | null = null;
let candidatePainter: ReturnType<typeof createNaturalPainter> | null = null;
let ready = false, disposed = false, playing = false;
let error: string | null = null;
let seconds = 0, replay = 0, handle = 0, lastFrame = 0;
let mode: Mode = 'travelling';
let width = 900, height = 300, pixelRatio = 1;
let root = { x: 0, y: 0 }, phase = 0;
let currentContacts: Record<GroundedFoot, boolean> | null = null;
let releasedSkeleton: GroundedSkeleton | null = null;
let candidateSkeleton: GroundedSkeleton | null = null;
const sample: GroundedRenderSample = { root: { x: 0, y: 0 }, scale: 1, facing: 1, load: 0, feet: createGroundedPose() };
const routeCycles = 3;
const routeDuration = () => (motion?.duration ?? 1) * routeCycles;
const artScale = () => Number(sizeInput.value) / GROUNDED_ART.width;

function clear() {
  for (const context of [releasedContext, candidateContext]) {
    context.resetTransform();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  }
}

function stop() {
  playing = false;
  if (handle) cancelAnimationFrame(handle);
  handle = 0;
  lastFrame = 0;
  playButton.textContent = 'Play';
  if (ready && !disposed) $('status').textContent = reducedMotion.matches
    ? 'Reduced motion: use the timeline to inspect poses.'
    : 'Paused for review. Candidate is a work in progress.';
}

function requestFrame() {
  if (!handle && playing && !disposed && !document.hidden && !reducedMotion.matches) handle = requestAnimationFrame(frame);
}

function setPlaying(value: boolean) {
  if (!value || !ready || disposed || document.hidden || reducedMotion.matches) { stop(); return; }
  playing = true;
  lastFrame = 0;
  playButton.textContent = 'Pause';
  $('status').textContent = 'Playing the comparison. Candidate is a work in progress.';
  requestFrame();
}

function frame(now: number) {
  handle = 0;
  if (!playing || disposed || document.hidden || reducedMotion.matches) { stop(); return; }
  const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) * Number(speedInput.value) : 0;
  lastFrame = now;
  seconds += delta;
  if (seconds > routeDuration()) {
    seconds %= routeDuration();
    replay += 1;
  }
  renderNow();
  requestFrame();
}

function ground(context: CanvasRenderingContext2D) {
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.lineWidth = 1;
  context.strokeStyle = '#a8af9d';
  context.beginPath(); context.moveTo(0, root.y); context.lineTo(width, root.y); context.stroke();
  const spacing = Math.max(16, (motion?.stride ?? 480) * artScale() / 2);
  context.strokeStyle = '#d1d5c6';
  for (let x = 20; x < width; x += spacing) {
    context.beginPath(); context.moveTo(x, root.y - 3); context.lineTo(x, root.y + 8); context.stroke();
  }
  context.fillStyle = '#7b836f';
  context.font = '10px ui-sans-serif, sans-serif';
  context.fillText(mode === 'travelling' ? 'Fixed ground' : 'Root fixed — treadmill view', 13, height - 13);
}

function toCanvas(point: { x: number; y: number }) {
  const scale = artScale();
  return { x: root.x + (point.x - GROUNDED_ART.anchorX) * scale, y: root.y + (point.y - GROUNDED_ART.anchorY) * scale };
}

function solePoint(skeleton: GroundedSkeleton, name: GroundedFoot) {
  const limb = skeleton.limbs[name], kind = GROUNDED_LIMBS[name].kind;
  const toe = GROUNDED_JOINTS[kind][3], pad = GROUNDED_PADS[kind];
  const dx = toe.x - pad.x, dy = toe.y - pad.y;
  const c = Math.cos(limb.pawAngle), s = Math.sin(limb.pawAngle);
  return { x: limb.pad.x + dx * c - dy * s, y: limb.pad.y + dx * s + dy * c };
}

function soles(skeleton: GroundedSkeleton | null) {
  return skeleton ? Object.fromEntries(GROUNDED_FEET.map(name => {
    const art = solePoint(skeleton, name);
    return [name, { art, canvas: toCanvas(art) }];
  })) : null;
}

function markers(context: CanvasRenderingContext2D, skeleton: GroundedSkeleton, contacts: Record<GroundedFoot, boolean> | null) {
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  for (const name of GROUNDED_FEET) {
    const limb = skeleton.limbs[name];
    const points = [limb.root, limb.joint, limb.wrist, limb.pad, solePoint(skeleton, name)].map(toCanvas);
    context.strokeStyle = name.startsWith('far') ? '#53696666' : '#536966a6';
    context.lineWidth = 1;
    context.beginPath(); points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y)); context.stroke();
    const point = points[4];
    context.fillStyle = contacts ? contacts[name] ? '#3d7c50' : '#ad7727' : '#64716e';
    context.strokeStyle = '#fff'; context.lineWidth = 1;
    context.beginPath(); context.arc(point.x, point.y, name.startsWith('far') ? 3 : 4, 0, Math.PI * 2); context.fill(); context.stroke();
  }
}

function setArtTransform(context: CanvasRenderingContext2D) {
  const scale = artScale();
  context.setTransform(pixelRatio * scale, 0, 0, pixelRatio * scale,
    pixelRatio * (root.x - GROUNDED_ART.anchorX * scale), pixelRatio * (root.y - GROUNDED_ART.anchorY * scale));
}

function renderNow() {
  if (!ready || disposed || !motion || !canine || !rig || !releasedPainter || !candidatePainter) return false;
  try {
    const cycle = seconds / motion.duration;
    phase = cycle % 1;
    const scale = artScale();
    const startX = 24 + GROUNDED_ART.anchorX * scale;
    root = { x: mode === 'travelling' ? startX + cycle * motion.stride * scale : width / 2, y: height - 38 };
    const releasedPose = rig.sample('walk', phase * canine.durations.walk);
    const candidatePose: NaturalSkeleton = motion.sample(phase);
    releasedSkeleton = releasedPose;
    candidateSkeleton = candidatePose;
    currentContacts = motion.contacts(phase);
    ground(releasedContext); ground(candidateContext);
    setArtTransform(releasedContext);
    const releasedDrawn = releasedPainter.draw(sample, pixelRatio * scale, releasedPose);
    setArtTransform(candidateContext);
    const candidateDrawn = candidatePainter.draw(candidatePose, pixelRatio * scale);
    if (!releasedDrawn || !candidateDrawn) throw new Error('A painter could not produce a finite pose.');
    if (feetInput.checked) {
      markers(releasedContext, releasedPose, null);
      markers(candidateContext, candidatePose, currentContacts);
    }
    timeInput.value = String(seconds);
    $('time-label').textContent = `${seconds.toFixed(2)} / ${routeDuration().toFixed(2)} s · phase ${(phase * 100).toFixed(1)}%`;
    $('route-label').textContent = `Cycle ${Math.min(routeCycles, Math.floor(cycle) + 1)} of 3 · route replay ${replay + 1}. ${mode === 'travelling' ? 'Position resets after three strides; each gait cycle remains continuous.' : 'The root is fixed. The three-cycle timeline repeats without root movement.'}`;
    if (diagnosticsInput.checked) {
      const inspection = candidatePainter.inspect();
      $('candidate-diagnostics').textContent = `Finite: ${inspection.finite} · flipped triangles: ${inspection.flippedTriangles} · degenerate: ${inspection.degenerateTriangles}\nArea ratios: ${inspection.minAreaRatio.toFixed(3)}–${inspection.maxAreaRatio.toFixed(3)} · max segment error: ${(inspection.maxSegmentLengthError * 100).toFixed(3)}%\nFace rigid error: ${inspection.face.maxRigidError.toFixed(5)} art units · pair-distance error: ${inspection.face.maxPairDistanceError.toFixed(5)} art units`;
    }
    return true;
  } catch (cause) {
    fail(cause);
    return false;
  }
}

function resize() {
  if (disposed) return;
  const available = canvases[0].parentElement!.clientWidth;
  const scale = artScale();
  width = Math.ceil(Math.max(available, mode === 'travelling' ? 48 + Number(sizeInput.value) + routeCycles * (motion?.stride ?? 480) * scale : Number(sizeInput.value) + 48));
  height = Math.ceil(Math.max(175, Number(sizeInput.value) * 2 / 3 + 60));
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  for (const canvas of canvases) {
    canvas.width = Math.ceil(width * pixelRatio); canvas.height = Math.ceil(height * pixelRatio);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
  }
  renderNow();
}

function setMode(value: Mode) {
  if (!['travelling', 'treadmill'].includes(value)) return;
  mode = value; modeInput.value = value; resize();
}

function seek(value: number) {
  if (!Number.isFinite(value) || disposed) return;
  stop();
  seconds = Math.max(0, Math.min(routeDuration(), value));
  replay = 0;
  renderNow();
}

function fail(cause: unknown) {
  error = cause instanceof Error ? cause.message : String(cause);
  ready = false;
  stop(); clear();
  $('status').textContent = `Comparison unavailable: ${error}`;
  $('status').classList.add('error');
  playButton.disabled = true; timeInput.disabled = true;
  assetsLoader.destroy(); canine?.dispose(); canine = null;
  motion?.dispose?.(); motion = null;
  rig = null; releasedPainter = null; candidatePainter = null;
}

const events = { signal: abort.signal };
playButton.addEventListener('click', () => setPlaying(!playing), events);
timeInput.addEventListener('input', () => seek(Number(timeInput.value)), events);
sizeInput.addEventListener('change', resize, events);
modeInput.addEventListener('change', () => setMode(modeInput.value as Mode), events);
feetInput.addEventListener('change', () => { $('marker-note').hidden = !feetInput.checked; renderNow(); }, events);
diagnosticsInput.addEventListener('change', () => {
  $('released-diagnostics').hidden = $('candidate-diagnostics').hidden = !diagnosticsInput.checked;
  renderNow();
}, events);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, events);
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) stop();
  playButton.disabled = !ready || reducedMotion.matches;
  if (ready) $('status').textContent = reducedMotion.matches ? 'Reduced motion: use the timeline to inspect poses.' : 'Paused for review. Candidate is a work in progress.';
}, events);
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvases[0].parentElement!);

function dispose() {
  if (disposed) return;
  disposed = true; stop(); abort.abort(); resizeObserver.disconnect();
  assetsLoader.destroy(); canine?.dispose(); canine = null;
  motion?.dispose?.(); motion = null;
  releasedPainter = null; candidatePainter = null; rig = null;
  for (const canvas of canvases) { canvas.width = 0; canvas.height = 0; }
}
window.addEventListener('pagehide', dispose, { once: true });

const qa = {
  state: () => ({ ready, disposed, error, playing, hidden: document.hidden, reducedMotion: reducedMotion.matches,
    time: seconds, phase, replay, mode, duration: motion?.duration ?? null, routeDuration: routeDuration(), stride: motion?.stride ?? null,
    releasedDuration: canine?.durations.walk ?? null, speed: Number(speedInput.value), artWidth: Number(sizeInput.value),
    root: { ...root }, contacts: currentContacts, releasedSkeleton, candidateSkeleton,
    soles: { released: soles(releasedSkeleton), candidate: soles(candidateSkeleton) },
    canvas: { width, height, pixelRatio }, frameScheduled: handle !== 0,
    inspection: candidatePainter?.inspect() ?? null }),
  seek, play: setPlaying, renderNow, mode: setMode,
  size: (value: 132 | 350) => { if (value === 132 || value === 350) { sizeInput.value = String(value); resize(); } },
  overlays: (feet: boolean, diagnostics: boolean) => {
    feetInput.checked = feet; diagnosticsInput.checked = diagnostics;
    $('marker-note').hidden = !feet;
    $('released-diagnostics').hidden = $('candidate-diagnostics').hidden = !diagnostics;
    renderNow();
  },
  dispose,
};
(window as Window & { milkyMotionQA?: typeof qa }).milkyMotionQA = qa;
resize();

const results = await Promise.allSettled([
  assetsLoader.load(),
  (async () => {
    const response = await fetch(AUTHORED_CANINE_URL, { signal: abort.signal });
    if (!response.ok) throw new Error(`Released motion returned HTTP ${response.status}`);
    return loadAuthoredCanine(await response.arrayBuffer());
  })(),
  loadNaturalMotion(),
] as const);
const [assetsResult, canineResult, motionResult] = results;
if (canineResult.status === 'fulfilled') canine = canineResult.value;
if (motionResult.status === 'fulfilled') motion = motionResult.value;
if (disposed) {
  canine?.dispose(); canine = null; motion?.dispose?.(); motion = null;
} else {
  const rejected = results.find(result => result.status === 'rejected');
  if (rejected?.status === 'rejected') fail(rejected.reason);
  else if (assetsResult.status !== 'fulfilled' || !assetsResult.value || !canine || !motion) fail(new Error('The shared artwork or motion did not load.'));
  else if (!Number.isFinite(motion.duration) || !Number.isFinite(motion.stride) || !(motion.duration > 0) || !(motion.stride > 0)) fail(new Error('Candidate duration and stride must be finite and positive.'));
  else {
    rig = createAuthoredRig(canine);
    releasedPainter = createGroundedPainter(releasedContext, assetsResult.value);
    candidatePainter = createNaturalPainter(candidateContext, assetsResult.value);
    ready = true;
    playButton.disabled = reducedMotion.matches;
    timeInput.disabled = false; timeInput.max = String(routeDuration());
    $('status').textContent = reducedMotion.matches ? 'Reduced motion: use the timeline to inspect poses.' : 'Paused for review. Candidate is a work in progress.';
    resize();
  }
}
