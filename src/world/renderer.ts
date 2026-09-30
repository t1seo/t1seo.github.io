import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createInterior } from './interior';
import { createExterior } from './exterior';
import type { StudioState, TimeOfDay } from '../environment';
import type { InteractionId, InteractiveObject } from './types';

interface Lighting {
  sky: string; ground: string; sun: string; sunPower: number; ambient: number;
  environment: number; exposure: number; position: [number, number, number];
}
const lighting: Record<TimeOfDay, Lighting> = {
  morning: { sky: '#c7deea', ground: '#aa8160', sun: '#ffe5b1', sunPower: 3.1, ambient: 1.0, environment: .42, exposure: 1.02, position: [-8, 7, -10] },
  noon: { sky: '#d9ecf6', ground: '#b1a393', sun: '#fff6df', sunPower: 3.7, ambient: 1.1, environment: .5, exposure: .94, position: [-3, 12, -8] },
  afternoon: { sky: '#d2dfdf', ground: '#a17c57', sun: '#ffdfab', sunPower: 3.0, ambient: .9, environment: .42, exposure: 1.01, position: [5, 8, -10] },
  evening: { sky: '#b1baca', ground: '#936648', sun: '#ffb174', sunPower: 1.7, ambient: .62, environment: .31, exposure: 1.10, position: [8, 4.6, -12] },
  night: { sky: '#7c9bcd', ground: '#554439', sun: '#a7c7f6', sunPower: .36, ambient: .34, environment: .16, exposure: 1.12, position: [-5, 11, -12] },
};

export function mountWorld(container: HTMLElement, options: {
  state: StudioState;
  onAction: (id: InteractionId) => void;
  onHover: (label: string | null, x: number, y: number) => void;
  onReady: () => void;
  onError: () => void;
}) {
  let state = options.state;
  let destroyed = false;
  let dirty = true;
  const abort = new AbortController();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, .08, 650);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor('#b7b0a2');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'world-canvas';
  renderer.domElement.setAttribute('aria-label', '지은의 3D 작업실. 마우스로 시점을 움직이거나 아래 물건 메뉴로 소품을 조작할 수 있습니다.');
  renderer.domElement.setAttribute('role', 'img');
  container.append(renderer.domElement);

  const roomEnvironment = new RoomEnvironment();
  const generator = new THREE.PMREMGenerator(renderer);
  const environmentMap = generator.fromScene(roomEnvironment, .04);
  scene.environment = environmentMap.texture;
  roomEnvironment.dispose();
  generator.dispose();
  const sun = new THREE.DirectionalLight('#ffe4b4', 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 7, bottom: -7, near: .1, far: 35 });
  sun.shadow.bias = -.00015;
  sun.shadow.normalBias = .025;
  sun.shadow.radius = 3;
  sun.target.position.set(0, 1, -.7);
  const hemisphere = new THREE.HemisphereLight('#dce8ee', '#947255', .9);
  scene.add(sun, sun.target, hemisphere);

  const exterior = createExterior();
  const interior = createInterior();
  scene.add(exterior.group, interior.group);
  const parts = [interior, exterior];
  const interactions = parts.flatMap(part => part.interactives);
  const interactiveMap = new Map<THREE.Object3D, InteractiveObject>();
  interactions.forEach(item => item.object.traverse(object => interactiveMap.set(object, item)));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .065;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = .24;
  controls.minAzimuthAngle = .27;
  controls.maxAzimuthAngle = .70;
  controls.minPolarAngle = 1.20;
  controls.maxPolarAngle = 1.48;
  controls.addEventListener('change', () => { dirty = true; });
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new SSAOPass(scene, camera, 1, 1, 16);
  ao.kernelRadius = .26;
  ao.minDistance = .0002;
  ao.maxDistance = .018;
  composer.addPass(ao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .16, .42, 1.15);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let width = 1, height = 1;
  let mobile = false;
  const home = () => {
    camera.position.set(mobile ? 4.4 : 4.8, mobile ? 3.05 : 3.2, mobile ? 8.7 : 6.8);
    controls.target.set(mobile ? .15 : -.3, mobile ? 1.95 : 1.75, -1.8);
    camera.fov = mobile ? 58 : 48;
    camera.updateProjectionMatrix();
    controls.update();
    dirty = true;
  };
  function resize() {
    width = container.clientWidth; height = container.clientHeight;
    if (!width || !height) return;
    const wasMobile = mobile;
    mobile = width < 700;
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // AO remains full quality on desktop; smaller mobile screens favour responsiveness.
    ao.enabled = width >= 700;
    if (wasMobile !== mobile) home();
    dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize(); home();

  const lightTarget = { ...lighting[state.timeOfDay] };
  const color = new THREE.Color();
  const sunPosition = new THREE.Vector3();
  function update(next: StudioState) {
    state = next;
    parts.forEach(part => part.update(state));
    Object.assign(lightTarget, lighting[state.timeOfDay]);
    controls.enableDamping = state.motionOn;
    dirty = true;
  }
  function lightFrame(blend: number) {
    const curtain = state.curtainOpen ? 1 : .4;
    sun.color.lerp(color.set(lightTarget.sun), blend);
    sun.position.lerp(sunPosition.fromArray(lightTarget.position), blend);
    sun.intensity = THREE.MathUtils.lerp(sun.intensity, lightTarget.sunPower * curtain, blend);
    hemisphere.color.lerp(color.set(lightTarget.sky), blend);
    hemisphere.groundColor.lerp(color.set(lightTarget.ground), blend);
    hemisphere.intensity = THREE.MathUtils.lerp(hemisphere.intensity, lightTarget.ambient, blend);
    scene.environmentIntensity = THREE.MathUtils.lerp(scene.environmentIntensity, lightTarget.environment, blend);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, lightTarget.exposure, blend);
  }
  update(state); lightFrame(1);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function visible(object: THREE.Object3D): boolean {
    for (let node: THREE.Object3D | null = object; node; node = node.parent) if (!node.visible) return false;
    return true;
  }
  function pick(x: number, y: number) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set(((x - bounds.left) / bounds.width) * 2 - 1, -((y - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    // Raycast the entire room first so objects cannot be pressed through walls or curtains.
    const hits = raycaster.intersectObjects([interior.group, exterior.group], true);
    for (const hit of hits) {
      if (!visible(hit.object)) continue;
      const material = (hit.object as THREE.Mesh).material;
      if (material && !Array.isArray(material) && (!material.visible || (material.transparent && material.opacity < .15))) continue;
      const found = interactiveMap.get(hit.object);
      if (found?.id === 'weather' && !state.curtainOpen) return null;
      return found ?? null;
    }
    return null;
  }
  let down: { x: number; y: number; id: number; distance: number } | null = null;
  let lastHover = 0;
  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    down = { x: event.clientX, y: event.clientY, id: event.pointerId, distance: 0 };
    options.onHover(null, 0, 0);
  }, { signal: abort.signal });
  renderer.domElement.addEventListener('pointermove', event => {
    if (down) {
      down.distance = Math.max(down.distance, Math.hypot(event.clientX - down.x, event.clientY - down.y));
      return;
    }
    if (performance.now() - lastHover < 70 || event.pointerType === 'touch') return;
    lastHover = performance.now();
    const item = pick(event.clientX, event.clientY);
    renderer.domElement.style.cursor = item ? 'pointer' : 'grab';
    options.onHover(item?.label ?? null, event.clientX, event.clientY);
  }, { signal: abort.signal });
  renderer.domElement.addEventListener('pointerup', event => {
    if (!down || event.pointerId !== down.id) return;
    const tap = down.distance < 6 && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 6;
    down = null;
    if (tap) { const item = pick(event.clientX, event.clientY); if (item) options.onAction(item.id); }
  }, { signal: abort.signal });
  renderer.domElement.addEventListener('pointercancel', () => { down = null; }, { signal: abort.signal });
  renderer.domElement.addEventListener('pointerleave', () => options.onHover(null, 0, 0), { signal: abort.signal });
  window.addEventListener('pointerup', () => { down = null; }, { signal: abort.signal });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); options.onError(); }, { signal: abort.signal });
  renderer.domElement.addEventListener('webglcontextrestored', () => window.location.reload(), { signal: abort.signal });

  let elapsed = 0, previous = 0, first = true, frames = 0;
  let frame = 0;
  function animate(time: number) {
    if (destroyed) return;
    frame = requestAnimationFrame(animate);
    const delta = previous ? Math.min((time - previous) / 1000, .05) : 1 / 60;
    previous = time;
    if (document.hidden) return;
    controls.update();
    if (!state.motionOn && !dirty) return;
    elapsed += state.motionOn ? delta : 0;
    parts.forEach(part => part.tick(elapsed, state.motionOn ? delta : 0));
    lightFrame(state.motionOn ? 1 - Math.exp(-delta * 4) : 1);
    composer.render();
    dirty = false;
    frames++;
    if (first) { first = false; options.onReady(); }
  }
  frame = requestAnimationFrame(animate);
  return {
    update,
    react(id: InteractionId) { parts.forEach(part => part.react(id)); dirty = true; },
    home,
    info() { return { frames, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }; },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame); abort.abort(); observer.disconnect(); controls.dispose();
      parts.forEach(part => part.dispose());
      ao.dispose(); bloom.dispose(); composer.dispose(); sun.shadow.dispose();
      environmentMap.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
