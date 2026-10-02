import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

type ViewName = 'three-quarter' | 'side' | 'front' | 'rear';
type SurfaceName = 'fur' | 'gray' | 'wire';
const $ = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing review control: ${id}`);
  return element as T;
};

const viewport = $('viewport');
const stage = $('stage');
const loading = $('loading');
const surfaceControl = $<HTMLSelectElement>('surface');
const clipControl = $<HTMLSelectElement>('clip');
const playControl = $<HTMLButtonElement>('play');
const speedControl = $<HTMLSelectElement>('speed');
const timelineControl = $<HTMLInputElement>('timeline');
const roomControl = $<HTMLInputElement>('room');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const abort = new AbortController();
const on = <K extends keyof HTMLElementEventMap>(element: HTMLElement, event: K, listener: (event: HTMLElementEventMap[K]) => void) => {
  element.addEventListener(event, listener as EventListener, { signal: abort.signal });
};

let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
} catch (error) {
  loading.textContent = 'The 3D preview could not start.\nThis browser needs WebGL support.';
  loading.classList.add('error');
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', 'Milky 3D preview. Use the camera buttons to change angle.');
viewport.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-2, 2, 1.5, -1.5, 0.01, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.minZoom = 0.5;
controls.maxZoom = 3;
controls.minPolarAngle = 0.08;
controls.maxPolarAngle = Math.PI / 2 + 0.04;
controls.enablePan = true;
controls.target.set(0, 0.65, 0);

scene.add(new THREE.HemisphereLight(0xfff9ee, 0xb3a78e, 2.2));
const key = new THREE.DirectionalLight(0xfff7e5, 3.2);
key.position.set(2.8, 5, 3.4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = key.shadow.camera.bottom = -2.4;
key.shadow.camera.right = key.shadow.camera.top = 2.4;
key.shadow.camera.near = 0.1;
key.shadow.camera.far = 12;
key.shadow.normalBias = 0.025;
key.shadow.bias = -0.00015;
scene.add(key);
const rim = new THREE.DirectionalLight(0xe6edf6, 1.4);
rim.position.set(-3, 2.5, -3);
scene.add(rim);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.17, color: 0x716352 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.006;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(6, 24, 0xaaa08f, 0xb9b09e);
grid.position.y = -0.005;
const gridMaterial = grid.material as THREE.Material;
gridMaterial.transparent = true;
gridMaterial.opacity = 0.14;
gridMaterial.depthWrite = false;
scene.add(grid);

const clay = new THREE.MeshStandardMaterial({ color: 0xb5ad9d, roughness: 0.87 });
const wire = new THREE.MeshBasicMaterial({ color: 0x626c55, wireframe: true, transparent: true, opacity: 0.8 });
const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
const originalVisibility = new Map<THREE.Mesh, boolean>();
const furMeshes = new Set<THREE.Mesh>();
const modelBox = new THREE.Box3();
const modelSize = new THREE.Vector3(2, 1.3, 0.6);
const center = new THREE.Vector3(0, 0.65, 0);
let model: THREE.Group | null = null;
let mixer: THREE.AnimationMixer | null = null;
let activeAction: THREE.AnimationAction | null = null;
let animations: THREE.AnimationClip[] = [];
let selectedView: ViewName = 'three-quarter';
let selectedSurface: SurfaceName = 'fur';
let disposed = false;
let ready = false;
let failure: string | null = null;
let playing = false;
let frameHandle = 0;
let lastTime = 0;
let motionTime = 0;
let duration = 0;
let meshCount = 0;
let triangles = 0;
let boneCount = 0;

function updateReadout() {
  timelineControl.value = String(motionTime);
  $('time-readout').textContent = `${motionTime.toFixed(2)} / ${duration.toFixed(2)} s`;
}

function requestFrame() {
  if (disposed || document.hidden || frameHandle) return;
  frameHandle = requestAnimationFrame(render);
}

function render(now: number) {
  frameHandle = 0;
  if (disposed || document.hidden) return;
  if (playing && mixer && activeAction && duration > 0) {
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
    motionTime = (motionTime + delta * Number(speedControl.value)) % duration;
    mixer.setTime(motionTime);
    updateReadout();
  }
  lastTime = now;
  renderer.render(scene, camera);
  if (playing) requestFrame();
}

function setPlaying(value: boolean) {
  playing = Boolean(value && ready && activeAction && duration > 0 && !disposed);
  playControl.textContent = playing ? 'Pause' : 'Play';
  playControl.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
  lastTime = 0;
  requestFrame();
}

function seek(seconds: number) {
  if (!Number.isFinite(seconds) || disposed) return;
  setPlaying(false);
  motionTime = THREE.MathUtils.clamp(seconds, 0, duration);
  mixer?.setTime(motionTime);
  updateReadout();
  requestFrame();
}

function selectClip(name: string) {
  const selected = animations.find((clip) => clip.name === name);
  if (!mixer || !selected || disposed) return false;
  const wasPlaying = playing;
  mixer.stopAllAction();
  activeAction = mixer.clipAction(selected);
  activeAction.reset().setLoop(THREE.LoopRepeat, Infinity).play();
  activeAction.clampWhenFinished = false;
  duration = selected.duration;
  motionTime = 0;
  mixer.setTime(0);
  clipControl.value = name;
  timelineControl.max = String(duration || 1);
  timelineControl.disabled = duration <= 0;
  playControl.disabled = duration <= 0;
  updateReadout();
  setPlaying(wasPlaying);
  requestFrame();
  return true;
}

const viewLabels: Record<ViewName, string> = { 'three-quarter': 'Three-quarter', side: 'Side', front: 'Front', rear: 'Rear' };
const cameraDirections: Record<ViewName, THREE.Vector3> = {
  'three-quarter': new THREE.Vector3(3.2, 1.4, 4.6),
  side: new THREE.Vector3(0, 0.35, 5),
  front: new THREE.Vector3(5, 0.35, 0),
  rear: new THREE.Vector3(-5, 0.35, 0),
};
function setView(view: ViewName) {
  if (!(view in cameraDirections) || disposed) return;
  selectedView = view;
  camera.position.copy(center).add(cameraDirections[view]);
  controls.target.copy(center);
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  controls.update();
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  $('stage-caption').textContent = `Original model · ${viewLabels[view]} view`;
  requestFrame();
}

function setSurface(surface: SurfaceName) {
  if (!['fur', 'gray', 'wire'].includes(surface) || disposed) return;
  selectedSurface = surface;
  surfaceControl.value = surface;
  originalMaterials.forEach((original, mesh) => {
    mesh.material = surface === 'fur' ? original : surface === 'gray' ? clay : wire;
    // Transparent coat cards obscure the underlying anatomy if made opaque.
    mesh.visible = (originalVisibility.get(mesh) ?? true) && (surface === 'fur' || !furMeshes.has(mesh));
  });
  requestFrame();
}

function resize() {
  if (disposed) return;
  const width = Math.max(1, viewport.clientWidth);
  const height = Math.max(1, viewport.clientHeight);
  const aspect = width / height;
  // A little extra floor and headroom keeps the complete silhouette in view.
  const halfHeight = Math.max(modelSize.y * 0.72, modelSize.x * 0.7 / aspect, 0.8);
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  requestFrame();
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(viewport);
controls.addEventListener('change', requestFrame);
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => on(button, 'click', () => setView(button.dataset.view as ViewName)));
on($('fit'), 'click', () => { resize(); setView(selectedView); });
on(surfaceControl, 'change', () => setSurface(surfaceControl.value as SurfaceName));
on(clipControl, 'change', () => selectClip(clipControl.value));
on(playControl, 'click', () => setPlaying(!playing));
on(timelineControl, 'input', () => seek(Number(timelineControl.value)));
on(roomControl, 'change', () => {
  stage.classList.toggle('room', roomControl.checked);
  $('room-note').hidden = !roomControl.checked;
  grid.visible = !roomControl.checked;
  requestFrame();
});
document.addEventListener('visibilitychange', () => {
  if (frameHandle) cancelAnimationFrame(frameHandle);
  frameHandle = 0;
  lastTime = 0;
  if (!document.hidden) requestFrame();
}, { signal: abort.signal });
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) setPlaying(false);
}, { signal: abort.signal });

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      geometries.add(object.geometry);
      const source = object instanceof THREE.Mesh ? originalMaterials.get(object) ?? object.material : object.material;
      (Array.isArray(source) ? source : [source]).forEach((material) => materials.add(material));
      if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
    }
  });
  materials.forEach((material) => {
    Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) textures.add(value); });
    material.dispose();
  });
  textures.forEach((texture) => texture.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

function dispose() {
  if (disposed) return;
  disposed = true;
  playing = false;
  if (frameHandle) cancelAnimationFrame(frameHandle);
  frameHandle = 0;
  abort.abort();
  resizeObserver.disconnect();
  controls.removeEventListener('change', requestFrame);
  controls.dispose();
  mixer?.stopAllAction();
  if (model) mixer?.uncacheRoot(model);
  disposeObject(scene);
  originalMaterials.clear();
  originalVisibility.clear();
  furMeshes.clear();
  clay.dispose();
  wire.dispose();
  key.shadow.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  renderer.domElement.remove();
}
window.addEventListener('pagehide', dispose, { once: true });

// Explicit screenshot tooling only: draw this exact pose when a background
// browser surface is not servicing requestAnimationFrame. Never advances time.
function renderNow() {
  if (disposed) return false;
  renderer.render(scene, camera);
  return true;
}

function setFurSampling(alphaTest: number, alphaToCoverage = false, mipmaps = true) {
  furMeshes.forEach((mesh) => {
    const original = originalMaterials.get(mesh);
    (Array.isArray(original) ? original : [original]).forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) return;
      material.alphaTest = THREE.MathUtils.clamp(alphaTest, 0, 1);
      material.alphaToCoverage = alphaToCoverage;
      if (material.map) {
        material.map.generateMipmaps = mipmaps;
        material.map.minFilter = mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
        material.map.needsUpdate = true;
      }
      material.needsUpdate = true;
    });
  });
  requestFrame();
}

const qa = {
  state: () => ({
    ready, disposed, error: failure, playing, hidden: document.hidden, reducedMotion: reducedMotion.matches,
    view: selectedView, surface: selectedSurface, clip: clipControl.value, clips: animations.map(({ name, duration }) => ({ name, duration })),
    time: motionTime, duration, speed: Number(speedControl.value), frameScheduled: frameHandle !== 0,
    meshes: meshCount, triangles, bones: boneCount,
    bounds: ready ? { min: modelBox.min.toArray(), max: modelBox.max.toArray() } : null,
    viewport: { width: viewport.clientWidth, height: viewport.clientHeight },
    render: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures },
  }),
  seek: (seconds: number) => { seek(seconds); renderNow(); },
  view: (view: ViewName) => { setView(view); renderNow(); },
  surface: (surface: SurfaceName) => { setSurface(surface); renderNow(); },
  clip: (name: string) => { const selected = selectClip(name); renderNow(); return selected; },
  furSampling: (alphaTest: number, alphaToCoverage = false, mipmaps = true) => {
    setFurSampling(alphaTest, alphaToCoverage, mipmaps);
    renderNow();
  },
  play: setPlaying, renderNow, dispose,
};
(window as Window & { milkyCustomQA?: typeof qa }).milkyCustomQA = qa;

setView(selectedView);
resize();
try {
  const gltf = await new GLTFLoader().loadAsync('/assets/milky-custom/milky.glb');
  if (disposed) {
    disposeObject(gltf.scene);
  } else {
    model = gltf.scene;
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        meshCount += 1;
        triangles += (object.geometry.index?.count ?? object.geometry.attributes.position?.count ?? 0) / 3;
        object.castShadow = true;
        object.receiveShadow = false;
        originalMaterials.set(object, object.material);
        originalVisibility.set(object, object.visible);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        if (/Milky.fur/i.test(object.name) || materials.some((material) => /Milky directional silk fur/i.test(material.name))) {
          furMeshes.add(object);
        }
      }
      if (object instanceof THREE.Bone) boneCount += 1;
    });
    scene.add(model);
    model.updateMatrixWorld(true);
    modelBox.setFromObject(model);
    modelBox.getSize(modelSize);
    modelBox.getCenter(center);
    animations = gltf.animations;
    mixer = new THREE.AnimationMixer(model);
    ready = true;
    loading.hidden = true;
    clipControl.replaceChildren();
    animations.forEach((clip) => {
      const option = document.createElement('option');
      option.value = clip.name;
      option.textContent = clip.name;
      clipControl.append(option);
    });
    if (animations.length) {
      clipControl.disabled = false;
      const requestedClip = new URLSearchParams(location.search).get('clip');
      const initialClip = animations.find((clip) => clip.name === requestedClip) ?? animations.find((clip) => /idle/i.test(clip.name)) ?? animations[0];
      selectClip(initialClip.name);
      const autoPlay = new URLSearchParams(location.search).get('autoplay') !== '0';
      setPlaying(autoPlay && !reducedMotion.matches);
      if (reducedMotion.matches) $('motion-note').textContent = 'Reduced motion is enabled. Press Play to inspect the animation.';
    } else {
      const option = document.createElement('option');
      option.textContent = 'Static model';
      clipControl.append(option);
      $('motion-note').textContent = 'This file contains no animation clips. Shape review is available.';
    }
    $('model-details').textContent = `${Math.round(triangles).toLocaleString()} triangles · ${boneCount} bones\n${animations.length} animation ${animations.length === 1 ? 'clip' : 'clips'} · original custom geometry`;
    setSurface(selectedSurface);
    // Sparse filaments average to ~0.106 alpha in the small-card mip levels.
    // The exported 0.28 mask erases that coat at review scale; retain mipmaps
    // with a lower cutoff. A2C produces conspicuous white stippling here.
    setFurSampling(0.08);
    setView(selectedView);
    resize();
  }
} catch (error) {
  if (!disposed) {
    failure = error instanceof Error ? error.message : String(error);
    loading.hidden = false;
    loading.classList.add('error');
    loading.textContent = 'Milky’s model is not available yet.\nExpected file: /assets/milky-custom/milky.glb';
    $('model-details').textContent = 'Waiting for the local model export. Reload after it is ready.';
    clipControl.replaceChildren(new Option('Model unavailable'));
  }
}
