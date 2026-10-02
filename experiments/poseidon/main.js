import './style.css';
import {
  Scene, PerspectiveCamera, WebGPURenderer, Color, Vector2, Vector3,
  Mesh, MathUtils, NeutralToneMapping, DefaultLoadingManager,
} from 'three/webgpu';
import { uniform } from 'three/tsl';
import { params, applySky, SKIES } from './vendor/ocean/params.js';
import { Ocean } from './vendor/ocean/Ocean.js';
import { validateFFT } from './vendor/ocean/fft.js';
import { createOceanSurfaceMaterial } from './vendor/ocean/oceanSurfaceMaterial.js';
import { makeDetailTexture } from './vendor/ocean/detailTexture.js';
import { createSkyDome } from './vendor/ocean/sky.js';
import { createRadialGrid } from './vendor/ocean/oceanGrid.js';
import { createAerialPerspective } from './vendor/ocean/atmosphere.js';
import { presets, presetFromPath, aimCamera } from './presets.js';
import { createCameraControls } from './camera.js';
import { createSoundtrack } from './soundtrack.js';

const personal = document.body.dataset.personal === 'true';
const mode = personal ? 'whitecaps' : presetFromPath(location.pathname);
const preset = presets[mode];
document.body.classList.toggle('personal', personal);
document.title = personal ? 'Taewon Seo' : `${preset.title} · Poseidon`;
document.querySelector('#app').innerHTML = `
  <div class="shade" aria-hidden="true"></div>
  <header class="top">
    <span class="brand">Ocean studies</span>
    <nav class="switch" aria-label="Ocean style">
      <a href="/sun-glitter/" ${mode === 'sun-glitter' ? 'aria-current="page"' : ''}>Sun glitter</a>
      <a href="/whitecaps/" ${mode === 'whitecaps' ? 'aria-current="page"' : ''}>Whitecaps</a>
    </nav>
  </header>
  <section class="caption" aria-labelledby="title">
    <div class="eyebrow">${preset.number} / A study in water & light</div>
    <h1 id="title">${preset.title}</h1>
    <p>${preset.description}</p>
  </section>
  <footer class="bottom">
    <a class="credit" href="https://github.com/owenyuwono/poseidon" target="_blank" rel="noopener noreferrer">Powered by Poseidon · owenyuwono ↗</a>
    <div class="actions">
      <button id="pause" disabled>Pause</button>
      <button id="reset" disabled>Reset view</button>
      <details class="settings">
        <summary>Adjust</summary>
        <div class="panel">
          <label for="speed">Wave speed <output id="speed-value">1.00×</output><input disabled id="speed" type="range" min="0.25" max="1.5" step="0.05" value="1"></label>
          <label for="exposure">Light <output id="exposure-value">1.20</output><input disabled id="exposure" type="range" min="0.7" max="1.6" step="0.05" value="1.2"></label>
          <label for="foam">Whitecap coverage <output id="foam-value">${preset.foamThreshold.toFixed(2)}</output><input disabled id="foam" type="range" min="0.27" max="0.38" step="0.01" value="${preset.foamThreshold}"></label>
          <p>Drag the water to look around. Focus the water, then use W A S D to fly and Q / E to move down / up. Scroll to change flying speed.</p>
          <div class="status" id="status">Preparing ocean…</div>
        </div>
      </details>
    </div>
  </footer>
  ${personal ? `<main class="identity"><h1>TAEWON SEO</h1></main>
  <div class="site-controls">
    <details class="site-credit"><summary aria-label="Music and artwork credits" title="Credits">i</summary>
      <div class="credit-panel"><p><a href="https://www.scottbuckley.com.au/library/reverie/" target="_blank" rel="noopener noreferrer">Reverie</a> by Scott Buckley<br><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · Full recording, normalized MP3.</p><p>Ocean: <a href="https://github.com/owenyuwono/poseidon" target="_blank" rel="noopener noreferrer">Poseidon</a> by owenyuwono · MIT.<br>Sky: <a href="https://freestylized.com/skybox/sky_131/" target="_blank" rel="noopener noreferrer">FreeStylized, Skybox 131</a>.</p></div>
    </details>
    <button id="site-reset" class="icon-button" aria-label="Reset view" title="Reset view · drag to look around, W A S D to move" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 5v5h5"/></svg></button>
    <button id="site-pause" class="icon-button motion-button" aria-label="Pause ocean animation" title="Pause ocean" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path class="pause-mark" d="M8 6v12M16 6v12"/><path class="play-mark" d="m9 6 9 6-9 6Z"/></svg></button>
    <button id="music" class="icon-button sound-button" aria-label="Play background music" aria-pressed="false" title="Play background music"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 4 0 5-4v12l-5-4H3z"/><path class="sound-waves" d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="sound-muted" d="m17 10 4 4m0-4-4 4"/></svg></button>
  </div>` : ''}
  <div class="loading" role="status"><strong>${personal ? 'Taewon Seo' : preset.title}</strong><p id="loading-message">Preparing the water and light…</p>${personal ? '' : `<a href="${mode === 'whitecaps' ? '/sun-glitter/' : '/whitecaps/'}">${mode === 'whitecaps' ? 'Sun glitter' : 'Whitecaps'} ↗</a>`}</div>`;

const $ = (selector) => document.querySelector(selector);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const listeners = new AbortController();
const options = { signal: listeners.signal };
let renderer, scene, camera, controls, detailTexture, ocean;
let frame = 0;
let disposed = false;
let ready = false;
let failed = false;
let paused = reduceMotion.matches;
let elapsed = 36;
let warmup = 120;
let last = 0;
let renderCount = 0;
let lastStatus = 0;
let averageMs = 16.7;
let forceDraw = true;
let shading, grid, oceanMesh, skyDome;
const soundtrack = personal ? createSoundtrack($('#music'), new URL('./assets/reverie.mp3', import.meta.url).href) : null;

// Public diagnostics for this local study; never persists or sends data anywhere.
const diagnostics = { mode, ready: false, fft: null, frames: 0, time: elapsed, running: false, error: null };
Object.defineProperty(diagnostics, 'audio', { enumerable: true, get: () => soundtrack?.state ?? null });
Object.defineProperty(diagnostics, 'camera', { enumerable: true, get: () => camera ? { position: camera.position.toArray(), quaternion: camera.quaternion.toArray() } : null });
window.__poseidon = diagnostics;

function fail(error) {
  if (disposed || failed) return;
  failed = true;
  diagnostics.error = String(error?.message ?? error);
  diagnostics.running = false;
  cancelAnimationFrame(frame);
  frame = 0;
  $('.loading').hidden = false;
  $('.loading').setAttribute('role', 'alert');
  $('#loading-message').textContent = diagnostics.error;
  $('#pause').disabled = true;
  console.error(error);
  dispose();
}

function schedule() {
  if (!disposed && !failed && !document.hidden && !frame) frame = requestAnimationFrame(tick);
}

function invalidate() { forceDraw = true; schedule(); }

function placeWorld() {
  const x = Math.round(camera.position.x / grid.innerSpacing) * grid.innerSpacing;
  const z = Math.round(camera.position.z / grid.innerSpacing) * grid.innerSpacing;
  oceanMesh.position.set(x, 0, z);
  shading.originXZ.value.set(x, z);
  skyDome.position.copy(camera.position);
}

function step(dt) {
  elapsed += dt;
  ocean.evolve(elapsed, dt);
  shading.time.value = elapsed;
  diagnostics.time = elapsed;
}

function tick(now) {
  frame = 0;
  if (disposed || failed || document.hidden) return;
  try {
    const wallSeconds = last ? (now - last) / 1000 : 1 / 60;
    const dt = Math.min(wallSeconds, 0.1);
    last = now;
    if (!paused) step(dt * params.timeScale);
    controls?.update(dt);
    placeWorld();
    renderer.render(scene, camera);
    renderCount++;
    diagnostics.frames = renderCount;
    diagnostics.running = ready && !paused;
    forceDraw = false;
    averageMs = averageMs * 0.92 + wallSeconds * 1000 * 0.08;
    if (now - lastStatus > 600 || paused) {
      $('#status').textContent = `WebGPU · FFT verified · ${paused ? 'Paused' : Math.round(1000 / averageMs) + ' fps'} · ${elapsed.toFixed(1)} s`;
      lastStatus = now;
    }
    if (warmup > 0 || !paused || controls?.moving || forceDraw) schedule();
  } catch (error) { fail(error); }
}

function updatePause() {
  $('#pause').textContent = paused ? 'Play' : 'Pause';
  $('#pause').setAttribute('aria-label', paused ? 'Play ocean animation' : 'Pause ocean animation');
  if (personal) {
    $('#site-pause').setAttribute('aria-label', paused ? 'Play ocean animation' : 'Pause ocean animation');
    $('#site-pause').title = paused ? 'Play ocean' : 'Pause ocean';
  }
  diagnostics.running = ready && !paused && !document.hidden;
  document.body.dataset.paused = String(paused);
}

function dispose() {
  if (disposed) return;
  disposed = true;
  diagnostics.running = false;
  cancelAnimationFrame(frame);
  listeners.abort();
  controls?.dispose();
  soundtrack?.dispose();
  scene?.traverse((object) => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
  detailTexture?.dispose();
  // WebGPUBackend.dispose destroys the renderer-owned GPUDevice, including
  // upstream FFT buffers and ping-pong textures without individual disposal.
  renderer?.dispose();
  renderer?.domElement.remove();
}

async function main() {
  if (!navigator.gpu) throw new Error('This ocean needs a WebGPU-compatible browser with graphics acceleration enabled.');
  params.sky = 'golden';
  applySky(params);
  params.palette = 1;
  params.foamThreshold = preset.foamThreshold;
  const c = params.colors;
  scene = new Scene();
  camera = new PerspectiveCamera(preset.camera.fov, innerWidth / innerHeight, 0.5, 60000);
  aimCamera(camera, preset, params);
  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(new Color(c.skyHorizon), 1);
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.domElement.className = 'sea';
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', `${preset.title}. Drag to look around; W A S D to fly, Q and E for height.`);
  $('#app').prepend(renderer.domElement);
  await renderer.init();
  if (disposed) { renderer.dispose(); return; }
  if (!renderer.backend.isWebGPUBackend) throw new Error('WebGPU is unavailable on this device. This study uses GPU compute and cannot run through WebGL.');
  const device = renderer.backend.device;
  device.addEventListener('uncapturederror', (event) => fail(event.error), options);
  device.lost.then((info) => { if (!disposed) fail(new Error(`The graphics device stopped: ${info.message || info.reason}. Reload to try again.`)); });
  $('#loading-message').textContent = 'Checking the wave simulation…';
  diagnostics.fft = await validateFFT(renderer, params.N);
  if (disposed) return;
  if (!diagnostics.fft.pass) throw new Error('The FFT self-test failed on this GPU. The ocean was stopped to avoid showing an incorrect simulation.');
  const sky = SKIES[params.sky];
  shading = {
    sunDir: uniform(new Vector3()),
    sunColor: uniform(new Color(c.sun).multiplyScalar(params.sunIntensity)),
    horizon: uniform(new Color(c.skyHorizon)), zenith: uniform(new Color(c.skyZenith)),
    ambient: uniform(new Color(c.ambient)), deepColor: uniform(new Color(c.deep)),
    scatterColor: uniform(new Color(c.scatter)), palette: uniform(params.palette),
    sssStrength: uniform(params.sssStrength), foamColor: uniform(new Color(c.foam)),
    foamThreshold: uniform(params.foamThreshold), foamScale: uniform(params.foamScale),
    foamBright: uniform(params.foamBright), foamRelief: uniform(params.foamRelief),
    foamMilk: uniform(params.foamMilk), detail: uniform(params.detailStrength),
    time: uniform(0), originXZ: uniform(new Vector2()),
    hazeWater: uniform(1 / sky.hazeWater), hazeAir: uniform(1 / sky.hazeAir),
    specBoost: uniform(sky.specBoost),
  };
  const az = MathUtils.degToRad(params.sunAzimuth);
  const el = MathUtils.degToRad(params.sunElevation);
  shading.sunDir.value.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
  // Load the panorama before exposing the first finished frame.
  await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = () => reject(new Error('The local sky texture could not be loaded.'));
    image.src = sky.file;
  });
  if (disposed) return;
  DefaultLoadingManager.onError = (url) => fail(new Error(`A local texture could not be loaded: ${url}`));
  skyDome = createSkyDome(shading, 45000);
  scene.add(skyDome);
  scene.fogNode = createAerialPerspective(shading, { density: shading.hazeAir });
  detailTexture = makeDetailTexture();
  ocean = new Ocean(renderer, params);
  await ocean.updateInitialSpectrum();
  if (disposed) return;
  const material = createOceanSurfaceMaterial(ocean.cascades, { lengthScales: params.lengthScales, shading, detailTex: detailTexture });
  grid = createRadialGrid({ rings: 620, sectors: 1280, spacing: 0.35, soften: 41 });
  oceanMesh = new Mesh(grid.geometry, material);
  oceanMesh.frustumCulled = false;
  scene.add(oceanMesh);
  controls = createCameraControls(camera, renderer.domElement, invalidate);
  $('#loading-message').textContent = 'Letting the whitecaps gather…';
  // Prepare only the initial foam state offscreen. GPU completion yields keep
  // the UI responsive without depending on an occluded tab's throttled RAF.
  while (warmup > 0 && !disposed) {
    for (let i = 0; i < 8 && warmup > 0; i++, warmup--) step(1 / 30);
    await device.queue.onSubmittedWorkDone();
  }
  if (disposed) return;
  ready = diagnostics.ready = true;
  document.body.dataset.ready = 'true';
  $('.loading').hidden = true;
  document.querySelectorAll('button, input').forEach((el) => { el.disabled = false; });
  updatePause();
  schedule();
}

$('#pause').addEventListener('click', () => {
  paused = !paused;
  last = 0;
  updatePause();
  invalidate();
}, options);
$('#site-pause')?.addEventListener('click', () => $('#pause').click(), options);
$('#site-reset')?.addEventListener('click', () => $('#reset').click(), options);
$('#reset').addEventListener('click', () => {
  aimCamera(camera, preset, params);
  controls?.sync();
  invalidate();
}, options);
$('#speed').addEventListener('input', (event) => {
  params.timeScale = Number(event.target.value);
  $('#speed-value').textContent = `${params.timeScale.toFixed(2)}×`;
}, options);
$('#exposure').addEventListener('input', (event) => {
  renderer.toneMappingExposure = Number(event.target.value);
  $('#exposure-value').textContent = renderer.toneMappingExposure.toFixed(2);
  invalidate();
}, options);
$('#foam').addEventListener('input', (event) => {
  shading.foamThreshold.value = Number(event.target.value);
  $('#foam-value').textContent = shading.foamThreshold.value.toFixed(2);
  invalidate();
}, options);
document.addEventListener('visibilitychange', () => {
  cancelAnimationFrame(frame);
  frame = 0;
  last = 0;
  diagnostics.running = false;
  if (oceanMesh && !document.hidden) invalidate();
}, options);
reduceMotion.addEventListener('change', () => {
  if (reduceMotion.matches) { paused = true; updatePause(); if (ready) invalidate(); }
}, options);
window.addEventListener('resize', () => {
  if (!renderer || !camera) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  if (oceanMesh) invalidate();
}, options);
window.addEventListener('pagehide', dispose, { once: true });
window.addEventListener('pageshow', (event) => { if (event.persisted) location.reload(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);
main().catch(fail);
