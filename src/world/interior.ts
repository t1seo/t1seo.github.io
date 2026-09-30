import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Season, StudioState } from '../environment';
import type { InteractiveObject, InteractionId, WorldPart } from './types';

/** A furnished, inhabited room. Every silhouette is geometry; only material grain and screen ink use a canvas. */
export function createInterior(): WorldPart {
  const group = new THREE.Group();
  group.name = 'The collected lakeside studio';
  const interactives: InteractiveObject[] = [];
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let seed = 190724;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  let state: StudioState = { season: 'autumn', timeOfDay: 'afternoon', auto: true, lampOn: false, curtainOpen: true, monitorOn: true, soundOn: false, motionOn: true };
  let motionTime = 0;
  let curtainProgress = 1;
  let lampProgress = 0;
  let reactionTime = 0;
  let reaction: InteractionId | null = null;

  function proceduralTexture(kind: 'oak' | 'walnut' | 'linen' | 'plaster'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const isWood = kind === 'oak' || kind === 'walnut';
    ctx.fillStyle = kind === 'oak' ? '#c7a579' : kind === 'walnut' ? '#806047' : '#e5e0d5';
    ctx.fillRect(0, 0, 512, 512);
    if (isWood) {
      for (let i = 0; i < 850; i++) {
        const y = random() * 512;
        ctx.beginPath();
        ctx.strokeStyle = random() > .3 ? `rgba(63,39,19,${.014 + random() * .066})` : `rgba(255,244,218,${.06 + random() * .1})`;
        ctx.lineWidth = .3 + random() * 1.7;
        ctx.moveTo(-10, y);
        ctx.bezierCurveTo(120, y + random() * 10 - 5, 310, y + random() * 12 - 6, 520, y + random() * 4 - 2);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const x = random() * 512, y = random() * 512;
        for (let r = 2; r < 25; r += 3) {
          ctx.beginPath(); ctx.strokeStyle = 'rgba(45,30,16,.035)'; ctx.lineWidth = .8;
          ctx.ellipse(x, y, r * 5, r * .25, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
    } else {
      for (let i = 0; i < 35000; i++) {
        const value = Math.floor(140 + random() * 110);
        ctx.fillStyle = `rgba(${value},${value},${value},${kind === 'plaster' ? .13 : .19})`;
        ctx.fillRect(random() * 512, random() * 512, kind === 'plaster' ? 2 : 1, kind === 'plaster' ? 2 : 1);
      }
      if (kind === 'linen') {
        ctx.lineWidth = 1;
        for (let i = 0; i < 512; i += 3) {
          ctx.strokeStyle = i % 2 ? 'rgba(80,70,58,.12)' : 'rgba(255,255,255,.25)';
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    textures.add(texture);
    return texture;
  }
  const oakTexture = proceduralTexture('oak');
  const walnutTexture = proceduralTexture('walnut');
  const linenTexture = proceduralTexture('linen');
  const plasterTexture = proceduralTexture('plaster');
  const mat = (color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: .6, ...options });
    materials.add(material); return material;
  };
  const physical = (color: THREE.ColorRepresentation, options: THREE.MeshPhysicalMaterialParameters = {}) => {
    const material = new THREE.MeshPhysicalMaterial({ color, roughness: .3, ...options });
    materials.add(material); return material;
  };
  const oak = mat('#cfb18a', { map: oakTexture, bumpMap: oakTexture, bumpScale: .015, roughness: .49 });
  const walnut = mat('#a88560', { map: walnutTexture, bumpMap: walnutTexture, bumpScale: .012, roughness: .42 });
  const floorMat = mat('#ccbb99', { map: oakTexture, bumpMap: oakTexture, bumpScale: .013, roughness: .66 });
  const plaster = mat('#f0e4cf', { map: plasterTexture, bumpMap: plasterTexture, bumpScale: .028, roughness: .97 });
  const deepWood = mat('#493c30', { map: walnutTexture, roughness: .54 });
  const cream = mat('#eee5d3', { map: linenTexture, bumpMap: linenTexture, bumpScale: .018, roughness: .97 });
  const sageFabric = mat('#727b5b', { map: linenTexture, bumpMap: linenTexture, bumpScale: .025, roughness: .93 });
  const charcoal = mat('#22282a', { roughness: .46 });
  const black = mat('#151a1b', { roughness: .28, metalness: .15 });
  const brass = mat('#c0a269', { roughness: .29, metalness: .82 });
  const ivoryCeramic = physical('#e4d9bf', { roughness: .28, clearcoat: .32 });
  const greenCeramic = physical('#5d715e', { roughness: .24, clearcoat: .4 });
  const terracotta = mat('#ac7355', { roughness: .91, bumpMap: plasterTexture, bumpScale: .025 });
  const soil = mat('#342b21', { roughness: 1, map: plasterTexture });
  const leafMat = mat('#3e694a', { roughness: .68, side: THREE.DoubleSide });
  const leafLight = mat('#74916a', { roughness: .71, side: THREE.DoubleSide });
  const paper = mat('#e6ddc7', { roughness: .99 });
  const wireMat = mat('#464239', { roughness: .58 });
  const snowCream = mat('#f2ead9', { map: linenTexture, roughness: 1, bumpMap: linenTexture, bumpScale: .024 });

  const sphereGeometry = new THREE.SphereGeometry(1, 24, 16); geometries.add(sphereGeometry);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 32); geometries.add(cylinderGeometry);
  const boxCache = new Map<string, THREE.BufferGeometry>();
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = group): THREE.Mesh {
    geometries.add(geometry);
    const result = new THREE.Mesh(geometry, material); result.castShadow = true; result.receiveShadow = true;
    parent.add(result); return result;
  }
  function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, radius = .025, parent: THREE.Object3D = group): THREE.Mesh {
    const r = Math.min(radius, w * .45, h * .45, d * .45);
    const key = `${w},${h},${d},${r}`;
    let geometry = boxCache.get(key);
    if (!geometry) { geometry = r > .001 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d); boxCache.set(key, geometry); }
    const result = mesh(geometry, material, parent); result.position.set(x, y, z); return result;
  }
  function ellipsoid(rx: number, ry: number, rz: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = group): THREE.Mesh {
    const result = mesh(sphereGeometry, material, parent); result.scale.set(rx, ry, rz); result.position.set(x, y, z); return result;
  }
  function cylinder(radius: number, h: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = group): THREE.Mesh {
    const result = mesh(cylinderGeometry, material, parent); result.scale.set(radius, h, radius); result.position.set(x, y, z); return result;
  }
  function tube(points: THREE.Vector3[], radius: number, material: THREE.Material, parent: THREE.Object3D = group, segments = 32): THREE.Mesh {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 8, false), material, parent);
  }
  const vec = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  function between(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material, parent: THREE.Object3D = group) {
    const result = cylinder(radius, a.distanceTo(b), material, 0, 0, 0, parent);
    result.position.copy(a).add(b).multiplyScalar(.5);
    result.quaternion.setFromUnitVectors(vec(0, 1, 0), b.clone().sub(a).normalize()); return result;
  }
  function torus(radius: number, thickness: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = group) {
    const result = mesh(new THREE.TorusGeometry(radius, thickness, 8, 48), material, parent); result.position.set(x, y, z); return result;
  }
  function lathe(points: number[][], material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = group) {
    const result = mesh(new THREE.LatheGeometry(points.map(([r, h]) => new THREE.Vector2(r, h)), 48), material, parent);
    result.position.set(x, y, z); return result;
  }
  function objectGroup(name: string, parent: THREE.Object3D = group, x = 0, y = 0, z = 0) {
    const result = new THREE.Group(); result.name = name; result.position.set(x, y, z); parent.add(result); return result;
  }
  const register = (id: InteractionId, label: string, object: THREE.Object3D, anchor: THREE.Vector3) => interactives.push({ id, label, object, anchor });
  function instance(geometry: THREE.BufferGeometry, material: THREE.Material, transforms: { position: THREE.Vector3; scale?: THREE.Vector3; rotation?: THREE.Euler; color?: THREE.ColorRepresentation }[], parent: THREE.Object3D = group) {
    geometries.add(geometry);
    const result = new THREE.InstancedMesh(geometry, material, transforms.length);
    const dummy = new THREE.Object3D();
    transforms.forEach((item, i) => {
      dummy.position.copy(item.position); dummy.scale.copy(item.scale ?? vec(1, 1, 1)); dummy.rotation.copy(item.rotation ?? new THREE.Euler()); dummy.updateMatrix();
      result.setMatrixAt(i, dummy.matrix); if (item.color) result.setColorAt(i, new THREE.Color(item.color));
    });
    result.castShadow = result.receiveShadow = true; parent.add(result); return result;
  }

  // Shell: the window is an actual six-metre opening, never a painted view.
  const architecture = objectGroup('Limewashed walls, solid oak floors, and joinery');
  box(12.6, .15, 15.9, deepWood, .9, -.12, 4.15, .012, architecture);
  const planks: Parameters<typeof instance>[2] = [];
  for (let row = 0; row < 43; row++) {
    for (let col = 0; col < 6; col++) {
      const width = 2.07;
      planks.push({ position: vec(-4.14 + col * 2.07, -.025, -3.65 + row * .37), scale: vec(width - .008, .05, .362), color: new THREE.Color().setHSL(.1, .16 + random() * .07, .76 + random() * .1) });
    }
  }
  instance(new RoundedBoxGeometry(1, 1, 1, 2, .035), floorMat, planks, architecture);
  box(12.1, 1.25, .23, plaster, .85, .625, -3.71, .025, architecture);
  box(12.1, .57, .23, plaster, .85, 4.635, -3.71, .025, architecture);
  box(2.3, 3.1, .23, plaster, -4.05, 2.8, -3.71, .02, architecture);
  box(3.62, 3.1, .23, plaster, 5.06, 2.8, -3.71, .02, architecture);
  box(.22, 4.95, 15.9, plaster, -5.1, 2.4, 4.15, .025, architecture);
  box(.22, 4.95, 15.9, plaster, 6.8, 2.4, 4.15, .025, architecture);
  box(12.15, .22, 15.96, plaster, .85, 4.88, 4.13, .018, architecture);
  box(11.72, .17, .11, oak, .85, .115, -3.525, .015, architecture);
  box(.12, .17, 15.8, oak, -4.935, .115, 4.2, .014, architecture);
  box(.12, .17, 15.8, oak, 6.655, .115, 4.2, .014, architecture);
  // A deep head beam establishes a complete architectural space without hiding its contents.
  box(11.76, .22, .3, walnut, .85, 4.63, -3.49, .03, architecture);
  box(.25, .24, 15.85, oak, -4.85, 4.63, 4.2, .025, architecture);
  box(.25, .24, 15.85, oak, 6.53, 4.63, 4.2, .025, architecture);
  for (const z of [.6, 4.7, 8.8]) box(11.65, .18, .2, oak, .85, 4.69, z, .025, architecture);
  const windowJoinery = objectGroup('Deep oak window reveals', architecture);
  box(6.43, .14, .57, oak, .175, 1.24, -3.5, .025, windowJoinery);
  box(6.43, .13, .35, oak, .175, 4.35, -3.52, .025, windowJoinery);
  box(.145, 3.17, .34, oak, -2.915, 2.79, -3.52, .022, windowJoinery);
  box(.145, 3.17, .34, oak, 3.265, 2.79, -3.52, .022, windowJoinery);
  box(.075, 3.04, .16, walnut, -.77, 2.8, -3.565, .01, windowJoinery);
  box(.075, 3.04, .16, walnut, 1.3, 2.8, -3.565, .01, windowJoinery);
  box(6.11, .05, .12, walnut, .175, 3.83, -3.565, .008, windowJoinery);
  box(.025, .14, .065, brass, 1.39, 2.4, -3.35, .009, windowJoinery);

  // Soft linen curtains have physical pleats, weighted hems, brass rings, and a continuous opening motion.
  const curtains = objectGroup('Linen curtains');
  const curtainMaterial = mat('#d9ceb8', { map: linenTexture, bumpMap: linenTexture, bumpScale: .022, side: THREE.DoubleSide, roughness: 1 });
  const rod = cylinder(.032, 6.86, brass, .17, 4.53, -3.11, curtains); rod.rotation.z = Math.PI / 2;
  for (const x of [-3.3, 3.65]) ellipsoid(.064, .064, .064, brass, x, 4.53, -3.11, curtains);
  const curtainMeshes: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const geometry = new THREE.PlaneGeometry(1, 3.28, 32, 28);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i);
      positions.setZ(i, Math.sin((x + .5) * Math.PI * 10) * .1 + Math.sin((y + 1.64) * 1.1) * .025);
    }
    geometry.computeVertexNormals();
    const curtain = mesh(geometry, curtainMaterial, curtains); curtain.position.set(side < 0 ? -2.92 : 3.27, 2.8, -3.11);
    curtain.userData.side = side; curtainMeshes.push(curtain);
    for (let i = 0; i < 6; i++) {
      const ring = torus(.054, .01, brass, (side < 0 ? -3.16 : 3.01) + i * .098, 4.47, -3.11, curtains); ring.rotation.y = Math.PI / 2;
    }
  }
  register('curtain', '커튼을 열고 닫아보세요', curtains, vec(3.04, 3.5, -2.98));

  // Wall library: many individually sized books and objects, leaving purposeful breathing space.
  const library = objectGroup('Collected library');
  const bookColors = ['#b6ad86', '#697d70', '#d6c6a8', '#895c46', '#506571', '#ac7964', '#b7b6a1', '#393e3a'];
  const bookCoverMaterial = mat('#ffffff', { roughness: .87 });
  function books(parent: THREE.Object3D, x: number, y: number, z: number, count: number, maxWidth: number, rotate = 0) {
    const covers: Parameters<typeof instance>[2] = [];
    const pages: Parameters<typeof instance>[2] = [];
    const labels: Parameters<typeof instance>[2] = [];
    let cursor = x;
    for (let i = 0; i < count; i++) {
      const width = maxWidth / count * (.66 + random() * .5), height = .26 + random() * .17, depth = .21 + random() * .06;
      covers.push({ position: vec(cursor + width / 2, y + height / 2, z), scale: vec(width, height, depth), rotation: new THREE.Euler(0, rotate, 0), color: bookColors[Math.floor(random() * bookColors.length)] });
      pages.push({ position: vec(cursor + width / 2, y + height - .007, z), scale: vec(width * .75, .007, depth * .88) });
      labels.push({ position: vec(cursor + width / 2, y + height * .76, z + depth / 2 + .006), scale: vec(width * .7, .014, .005) });
      cursor += width + .012;
    }
    instance(new RoundedBoxGeometry(1, 1, 1, 2, .018), bookCoverMaterial, covers, parent);
    instance(new THREE.BoxGeometry(1, 1, 1), paper, pages, parent);
    instance(new THREE.BoxGeometry(1, 1, 1), brass, labels, parent);
  }
  box(1.46, 3.95, .11, deepWood, -4.06, 2.08, -3.48, .018, library);
  box(.09, 4.02, .51, walnut, -4.84, 2.08, -3.2, .017, library);
  box(.09, 4.02, .51, walnut, -3.28, 2.08, -3.2, .017, library);
  for (let row = 0; row < 6; row++) {
    const y = .17 + row * .67;
    box(1.65, .075, .57, walnut, -4.06, y, -3.18, .018, library);
    if (row !== 2 && row !== 4) books(library, -4.74, y + .043, -3.03, row === 0 ? 9 : 11, 1.29);
  }
  box(1.66, .11, .58, walnut, -4.06, 4.16, -3.19, .022, library);
  // Storage baskets make the room feel used instead of staged.
  const basketMat = mat('#b89970', { map: linenTexture, bumpMap: linenTexture, bumpScale: .035, roughness: .94 });
  for (const x of [-4.48, -3.77]) {
    box(.58, .35, .36, basketMat, x, 1.68, -3.0, .05, library);
    box(.18, .043, .012, deepWood, x, 1.75, -2.814, .015, library);
    box(.6, .036, .38, oak, x, 1.85, -3.0, .012, library);
  }
  // Turned ceramics, sculpture, camera, and a small framed print occupy the upper bays.
  lathe([[0,0],[.14,0],[.16,.03],[.16,.16],[.11,.23],[.08,.31],[.087,.34],[.065,.34],[.06,.25],[0,.04]], greenCeramic, -4.57, 2.9, -3.08, library);
  const littleSculpture = torus(.13, .047, ivoryCeramic, -3.61, 3.1, -3.05, library); littleSculpture.rotation.y = -.2;
  box(.34, .055, .22, walnut, -3.61, 2.93, -3.05, .014, library);
  box(.28, .16, .15, charcoal, -4.35, 3.67, -3.01, .023, library);
  const cameraLens = cylinder(.072, .08, black, -4.35, 3.67, -2.895, library); cameraLens.rotation.x = Math.PI / 2;
  const lensGlass = physical('#334343', { metalness: .25, roughness: .1, clearcoat: 1 });
  const lens = cylinder(.05, .01, lensGlass, -4.35, 3.67, -2.85, library); lens.rotation.x = Math.PI / 2;
  books(library, -4.0, 3.565, -3.07, 4, .5);

  // Left return shelves are oriented onto the side wall and hold a second layer of personal objects.
  for (let row = 0; row < 2; row++) {
    const sideShelf = objectGroup(`Side shelf ${row}`, group, -4.72, 2.5 + row * .82, -.87);
    sideShelf.rotation.y = Math.PI / 2;
    box(2.65, .075, .47, oak, 0, 0, 0, .018, sideShelf);
    box(.035, .33, .3, brass, -.85, -.17, -.035, .007, sideShelf);
    box(.035, .33, .3, brass, .85, -.17, -.035, .007, sideShelf);
    books(sideShelf, -.92, .043, 0, row ? 8 : 5, row ? 1.08 : .75);
    lathe([[0,0],[.13,0],[.16,.05],[.15,.2],[.095,.3],[.07,.39],[.073,.42],[.05,.42],[.05,.3],[0,.05]], row ? terracotta : ivoryCeramic, .65, .041, .02, sideShelf);
    if (!row) {
      const leaningFrame = objectGroup('Leaning small artwork', sideShelf, -.98, .25, -.11); leaningFrame.rotation.x = -.12;
      box(.32, .42, .035, walnut, 0, 0, 0, .012, leaningFrame);
      box(.26, .36, .008, cream, 0, 0, .023, .002, leaningFrame);
      ellipsoid(.075, .11, .007, greenCeramic, 0, .01, .032, leaningFrame);
    }
    // Layer objects front-to-back, as on a real shelf: records leaning behind stacked books,
    // hand-thrown little bowls, a compact camera, and framed mementos among the upright spines.
    const record = objectGroup('Collected vinyl record', sideShelf, 1.06, .285, -.12);
    record.rotation.set(-.11, 0, row ? .06 : -.04);
    box(.42, .47, .018, mat(row ? '#807f62' : '#b19470', { roughness: .91 }), 0, 0, 0, .004, record);
    const recordDisc = cylinder(.152, .008, charcoal, 0, 0, .018, record); recordDisc.rotation.x = Math.PI / 2;
    const recordLabel = cylinder(.047, .01, row ? terracotta : ivoryCeramic, 0, 0, .025, record); recordLabel.rotation.x = Math.PI / 2;
    torus(.125, .0015, deepWood, 0, 0, .025, record);
    const pile = objectGroup('Well-thumbed book stack', sideShelf, .24, .076, .043); pile.rotation.y = row ? -.05 : .09;
    for (let b = 0; b < 3; b++) {
      const volume = objectGroup('Stacked volume', pile, 0, b * .061, 0); volume.rotation.y = (b - 1) * .055;
      box(.43, .056, .29, bookCoverMaterial, 0, 0, 0, .005, volume);
      box(.41, .042, .283, paper, .006, .001, .001, .002, volume);
      box(.024, .057, .295, b === 1 ? greenCeramic : walnut, -.212, 0, 0, .003, volume);
    }
    if (row) {
      const shelfCamera = objectGroup('Travel camera on books', sideShelf, .24, .322, .045);
      box(.19, .125, .1, charcoal, 0, 0, 0, .018, shelfCamera);
      const bodyLens = cylinder(.043, .052, black, 0, 0, .072, shelfCamera); bodyLens.rotation.x = Math.PI / 2;
      const frontLens = cylinder(.03, .008, lensGlass, 0, 0, .102, shelfCamera); frontLens.rotation.x = Math.PI / 2;
      box(.062, .014, .037, brass, -.049, .069, -.011, .005, shelfCamera);
    } else {
      lathe([[0,0],[.096,0],[.12,.035],[.14,.087],[.137,.099],[.121,.09],[.09,.02],[0,.017]], ivoryCeramic, .23, .235, .055, sideShelf);
      ellipsoid(.044, .029, .041, walnut, .21, .27, .065, sideShelf);
      ellipsoid(.035, .026, .03, terracotta, .265, .279, .045, sideShelf);
    }
    if (row) {
      const familyFrame = objectGroup('Small personal print', sideShelf, -.96, .28, -.13); familyFrame.rotation.x = -.095;
      box(.29, .39, .022, brass, 0, 0, 0, .005, familyFrame);
      box(.255, .352, .01, cream, 0, 0, .016, .002, familyFrame);
      ellipsoid(.068, .09, .006, terracotta, .012, .022, .025, familyFrame);
      box(.15, .022, .005, sageFabric, 0, -.12, .026, .002, familyFrame);
    }
  }

  // Framed relief art on the left wall: dimensional blocks, paper, and a small sculpted sun.
  const art = objectGroup('Tactile landscape study', group, -4.934, 2.11, 1.84); art.rotation.y = Math.PI / 2;
  box(1.28, 1.63, .09, walnut, 0, 0, 0, .022, art);
  box(1.15, 1.5, .045, paper, 0, 0, .06, .004, art);
  box(.93, 1.28, .02, mat('#c4b9a0', { roughness: 1 }), 0, 0, .089, .005, art);
  ellipsoid(.2, .2, .025, mat('#ba8156'), .19, .32, .112, art);
  const artHill = ellipsoid(.54, .34, .023, mat('#6d7660'), -.15, -.4, .12, art); artHill.rotation.z = -.15;
  const artHill2 = ellipsoid(.47, .25, .023, mat('#9b9c79'), .23, -.39, .147, art); artHill2.rotation.z = .18;
  const pictureLight = cylinder(.024, .7, brass, -4.71, 3.04, 1.84); pictureLight.rotation.x = Math.PI / 2;

  // The working desk is substantial solid walnut with soft routed edges and proper joinery.
  const desk = objectGroup('Solid walnut writing desk');
  box(5.38, .15, 1.58, walnut, .5, 1.14, -1.85, .055, desk);
  box(5.22, .075, 1.48, oak, .5, 1.057, -1.85, .024, desk);
  for (const x of [-1.84, 2.85]) {
    for (const z of [-2.43, -1.28]) {
      const leg = box(.13, 1.03, .13, walnut, x, .52, z, .035, desk); leg.rotation.z = x < 0 ? -.035 : .035;
    }
    box(.08, .1, 1.25, walnut, x, .42, -1.86, .023, desk);
  }
  box(4.7, .21, .055, walnut, .5, .925, -2.47, .012, desk);
  box(1.08, .24, 1.03, walnut, 2.38, .935, -1.91, .025, desk);
  box(.97, .17, .04, oak, 2.38, .938, -1.367, .015, desk);
  const drawerHandle = cylinder(.017, .21, brass, 2.38, .94, -1.33, desk); drawerHandle.rotation.z = Math.PI / 2;
  const deskPad = mat('#59635b', { map: linenTexture, roughness: .92 });
  box(2.0, .012, .75, deskPad, .4, 1.223, -1.61, .048, desk);

  // A real screen embedded in a bevelled aluminium enclosure; the display drawing is screen content only.
  const monitor = objectGroup('Studio monitor', group, .3, 1.235, -2.27);
  const aluminium = mat('#555c5c', { roughness: .26, metalness: .83 });
  box(.51, .035, .39, aluminium, 0, .007, .01, .085, monitor);
  box(.075, .46, .075, aluminium, 0, .22, -.04, .016, monitor);
  box(1.66, 1.05, .1, charcoal, 0, .79, 0, .055, monitor);
  box(1.58, .966, .01, black, 0, .801, .054, .032, monitor);
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1200; screenCanvas.height = 720;
  const screenTexture = new THREE.CanvasTexture(screenCanvas); screenTexture.colorSpace = THREE.SRGBColorSpace; screenTexture.anisotropy = 4; textures.add(screenTexture);
  const screenMaterial = mat('#ffffff', { map: screenTexture, emissiveMap: screenTexture, emissive: '#ffffff', emissiveIntensity: .36, roughness: .31, metalness: .02 });
  const screen = box(1.522, .906, .008, screenMaterial, 0, .815, .065, .018, monitor); screen.castShadow = false;
  function drawScreen(on: boolean, focused = false) {
    const ctx = screenCanvas.getContext('2d')!;
    ctx.fillStyle = on ? '#182323' : '#101515'; ctx.fillRect(0, 0, 1200, 720);
    if (on) {
      ctx.fillStyle = '#233231'; ctx.fillRect(0, 0, 1200, 43);
      ['#cc847a', '#cbb276', '#87ab8a'].forEach((color, i) => { ctx.beginPath(); ctx.fillStyle = color; ctx.arc(25 + i * 24, 22, 6, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#bac8bb'; ctx.font = '17px monospace'; ctx.fillText('jieun / a little place to make things', 160, 28);
      ctx.fillStyle = '#1d2a29'; ctx.fillRect(0, 43, 246, 677);
      ctx.fillStyle = '#92a58e'; ctx.font = '17px monospace'; ctx.fillText('EXPLORER', 26, 94);
      ['studio', '  src', '    ideas.ts', '    small-joys.ts', '    tomorrow.ts', '  garden', '  README.md'].forEach((line, i) => {
        ctx.fillStyle = i === 2 ? '#e5d5ac' : '#879b94'; ctx.fillText(line, 27, 143 + i * 34);
      });
      ctx.font = '20px monospace';
      const lines = [
        ['#6e8a7d', '// a small corner of the internet'],
        ['#b4c2be', 'const studio = {'],
        ['#9fc3c1', '  maker: "Jieun Jeon",'],
        ['#dfc69c', '  things: ["learn", "build", "share"],'],
        ['#afbf9b', '  everyday: aLittleBetter(),'],
        ['#b4c2be', '};'],
        ['#b4c2be', ''],
        ['#6e8a7d', focused ? '// hello there. glad you stopped by :)' : '// leave a little room for wonder.'],
      ];
      lines.forEach(([color, line], i) => {
        ctx.fillStyle = '#526963'; ctx.fillText(String(i + 1).padStart(2, ' '), 271, 124 + i * 37);
        ctx.fillStyle = color; ctx.fillText(line, 320, 124 + i * 37);
      });
      // The blue, glasses-wearing identity is redrawn as screen ink, not a replacement for the real badge.
      ctx.save(); ctx.translate(1000, 528);
      ctx.beginPath(); ctx.fillStyle = '#698cf1'; ctx.moveTo(-87, -49); ctx.quadraticCurveTo(-25, -58, -8, -88); ctx.quadraticCurveTo(28, -55, 82, -49); ctx.quadraticCurveTo(103, 75, 0, 87); ctx.quadraticCurveTo(-102, 79, -87, -49); ctx.fill();
      ctx.strokeStyle = '#172527'; ctx.lineWidth = 10;
      for (const x of [-38, 39]) { ctx.beginPath(); ctx.arc(x, -2, 29, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-9, -7); ctx.lineTo(10, -7); ctx.stroke();
      for (const x of [-37, 40]) { ctx.beginPath(); ctx.fillStyle = '#172527'; ctx.arc(x, -1, 7, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 27, 31, .33, Math.PI - .33); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#364a42'; ctx.fillRect(246, 682, 954, 38); ctx.fillStyle = '#bac7ad'; ctx.font = '16px monospace'; ctx.fillText('main  ·  all good things take a little time', 268, 706);
    }
    screenTexture.needsUpdate = true;
  }
  drawScreen(true);
  const statusLED = ellipsoid(.009, .009, .005, mat('#d9e9c4', { emissive: '#c9dbab', emissiveIntensity: .6 }), .73, .305, .055, monitor);
  const screenLight = new THREE.PointLight('#afcbd8', .6, 2.6, 2); screenLight.position.set(0, .68, .38); monitor.add(screenLight);
  register('monitor', '모니터를 켜고 꺼보세요', monitor, vec(.3, 2.0, -2.18));

  // Tactile mechanical keys, with a contrasting escape key and thumb-sized spacebar.
  const keyboard = objectGroup('Mechanical keyboard', desk, .32, 1.25, -1.52); keyboard.rotation.x = .035;
  box(1.15, .055, .385, mat('#c8c6b6', { metalness: .18, roughness: .46 }), 0, 0, 0, .033, keyboard);
  const keys: Parameters<typeof instance>[2] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 14; col++) {
      if (row === 3 && col > 3 && col < 10) continue;
      keys.push({ position: vec(-.525 + col * .0805 + (row % 2) * .01, .045, -.135 + row * .087), scale: vec(.069, .029, .073), color: row === 0 && col === 0 ? '#b87855' : col > 11 ? '#80917f' : '#e3deca' });
    }
  }
  keys.push({ position: vec(.034, .045, .126), scale: vec(.47, .029, .072), color: '#e3deca' });
  instance(new RoundedBoxGeometry(1, 1, 1, 2, .12), mat('#ffffff', { roughness: .59 }), keys, keyboard);
  ellipsoid(.105, .049, .16, mat('#cfc9b6', { roughness: .49 }), 1.18, 1.268, -1.55, desk);
  box(.005, .035, .13, charcoal, 1.18, 1.304, -1.598, .001, desk);
  ellipsoid(.018, .01, .038, charcoal, 1.18, 1.312, -1.6, desk);
  // Desk audio and neatly coiled headphones.
  for (const x of [-.96, 1.63]) {
    box(.27, .38, .27, walnut, x, 1.42, -2.17, .035, desk);
    for (const [r, y] of [[.079, 1.37], [.035, 1.52]]) {
      const cone = cylinder(r, .013, charcoal, x, y, -2.025, desk); cone.rotation.x = Math.PI / 2;
      const rim = torus(r + .004, .006, black, x, y, -2.013, desk);
      rim.castShadow = false;
    }
  }
  const headphone = objectGroup('Headphones', desk, 2.54, 1.253, -1.54); headphone.rotation.x = -Math.PI / 2;
  const headband = mesh(new THREE.TorusGeometry(.18, .025, 8, 32, Math.PI * 1.24), charcoal, headphone); headband.rotation.z = -.38;
  for (const side of [-1, 1]) {
    box(.075, .15, .13, charcoal, side * .175, -.03, .018, .035, headphone);
    box(.027, .135, .108, sageFabric, side * .143, -.03, .018, .027, headphone);
  }
  tube([vec(.31, 1.42, -2.35), vec(.4, 1.19, -2.46), vec(.5, .81, -2.52), vec(1.4, .35, -2.47), vec(2.5, .1, -2.48)], .012, wireMat, desk);
  tube([vec(-.22, 1.265, -1.71), vec(-.36, 1.235, -1.83), vec(-.24, 1.235, -1.98)], .006, wireMat, desk);

  // Desk lamp: bent brass stem, dark green spun shade, and actual warm light falling onto the desk.
  const lamp = objectGroup('Brass and enamel desk lamp', group, -1.53, 1.23, -1.99);
  lathe([[0,0],[.24,0],[.25,.025],[.23,.05],[.16,.066],[0,.066]], greenCeramic, 0, 0, 0, lamp);
  tube([vec(0,.04,0), vec(0,.45,0), vec(0,.74,-.015), vec(.05,.91,.04), vec(.27,.93,.1)], .024, brass, lamp);
  const shade = objectGroup('Spun enamel shade', lamp, .29, .8, .1); shade.rotation.z = -.08;
  lathe([[.3,0],[.31,.025],[.26,.135],[.17,.23],[.055,.28],[.034,.28],[.11,.23],[.245,.105],[.278,.016]], greenCeramic, 0, 0, 0, shade);
  const lampInner = mat('#f6e5b8', { emissive: '#ffd89a', emissiveIntensity: 0, side: THREE.DoubleSide, roughness: .8 });
  const diffuser = cylinder(.269, .012, lampInner, 0, .012, 0, shade); diffuser.castShadow = false;
  const lampBulb = new THREE.SpotLight('#ffcc88', 0, 4.5, .95, .78, 2); lampBulb.position.set(.29, .85, .1); lamp.add(lampBulb);
  lampBulb.target.position.set(.34, -.13, .55); lamp.add(lampBulb.target);
  lampBulb.castShadow = true; lampBulb.shadow.mapSize.set(512, 512); lampBulb.shadow.bias = -.0004; lampBulb.shadow.normalBias = .025;
  const lampBounce = new THREE.PointLight('#ffc484', 0, 2.5, 2); lampBounce.position.set(.29, .72, .1); lamp.add(lampBounce);
  const switchMesh = cylinder(.025, .014, brass, -.08, .068, .13, lamp); switchMesh.rotation.x = .2;
  register('lamp', '스탠드를 켜고 꺼보세요', lamp, vec(-1.3, 2.06, -1.87));

  // A low upholstered desk chair: curved back, pillowed seat, tapered wooden legs, and piping.
  const chair = objectGroup('Sage upholstered desk chair', group, .18, 0, .05); chair.rotation.y = -.13;
  for (const x of [-.34, .34]) for (const z of [-.31, .31]) {
    const leg = between(vec(x * 1.16, .035, z * 1.16), vec(x, .66, z), .042, walnut, chair); leg.castShadow = true;
    cylinder(.042, .028, brass, x * 1.15, .039, z * 1.15, chair);
  }
  box(.91, .13, .87, walnut, 0, .66, 0, .12, chair);
  box(.9, .2, .87, sageFabric, 0, .8, -.01, .17, chair);
  const back = box(.93, .63, .19, sageFabric, 0, 1.16, .355, .17, chair); back.rotation.x = -.12;
  const pipingMat = mat('#8b9473', { roughness: .94 });
  tube([vec(-.39,.96,.446),vec(-.41,1.31,.49),vec(-.3,1.43,.507),vec(.3,1.43,.507),vec(.41,1.31,.49),vec(.39,.96,.446)], .008, pipingMat, chair);
  for (const x of [-.45, .45]) {
    between(vec(x, .72, .2), vec(x, 1.0, .19), .028, walnut, chair);
    const arm = box(.1, .082, .59, walnut, x, 1.0, .015, .04, chair); arm.rotation.x = -.07;
  }

  // An oval woven rug grounds the foreground. Individual fringe strands are instanced.
  const rugMat = mat('#c8baa0', { map: linenTexture, bumpMap: linenTexture, bumpScale: .05, roughness: 1 });
  const rug = cylinder(1, .018, rugMat, -.65, .023, .91); rug.scale.set(2.78, .018, 1.89);
  const rugBorder = mesh(new THREE.TorusGeometry(1, .006, 5, 96), mat('#8c8671', { roughness: 1 }));
  rugBorder.rotation.x = Math.PI / 2; rugBorder.scale.set(2.61, 1.75, 1); rugBorder.position.set(-.65, .035, .91);
  const rugInner = rugBorder.clone(); rugInner.scale.set(2.56, 1.71, 1); group.add(rugInner);
  const fringe: Parameters<typeof instance>[2] = [];
  for (let i = 0; i < 95; i++) {
    const t = i / 94 * Math.PI * 2;
    fringe.push({ position: vec(-.65 + Math.cos(t) * 2.82, .024, .91 + Math.sin(t) * 1.93), scale: vec(.009, .009, .115), rotation: new THREE.Euler(0, Math.atan2(Math.cos(t), Math.sin(t)), 0) });
  }
  instance(new THREE.BoxGeometry(1, 1, 1), cream, fringe);

  // The reading corner: sculpted cushions, exposed wood frame, side table, and a linen floor lamp.
  const lounge = objectGroup('Reading chair', group, -3.25, 0, .68); lounge.rotation.y = .4;
  for (const x of [-.48, .48]) {
    between(vec(x, .06, -.37), vec(x, .67, -.23), .055, walnut, lounge);
    between(vec(x, .055, .5), vec(x, .64, .37), .055, walnut, lounge);
    box(.095, .12, 1.2, walnut, x, .58, .04, .035, lounge);
    box(.12, .08, .98, walnut, x, .99, .03, .045, lounge);
    between(vec(x, .56, .36), vec(x, .97, .36), .034, walnut, lounge);
    between(vec(x, .6, -.41), vec(x, 1.08, -.44), .034, walnut, lounge);
  }
  const seat = box(1.0, .26, 1.07, cream, 0, .69, .05, .18, lounge); seat.rotation.x = -.055;
  const backCushion = box(1.02, .81, .3, cream, 0, 1.16, -.44, .19, lounge); backCushion.rotation.x = -.17;
  box(.55, .43, .18, sageFabric, .17, 1.13, -.18, .12, lounge).rotation.z = -.16;
  const throwMaterials: Record<Season, THREE.MeshStandardMaterial> = {
    spring: mat('#baad96', { map: linenTexture, bumpMap: linenTexture, bumpScale: .027, roughness: 1, side: THREE.DoubleSide }),
    summer: mat('#d7dfd1', { map: linenTexture, bumpMap: linenTexture, bumpScale: .025, roughness: 1, side: THREE.DoubleSide }),
    autumn: mat('#a76d47', { map: linenTexture, bumpMap: linenTexture, bumpScale: .03, roughness: 1, side: THREE.DoubleSide }),
    winter: mat('#8f3f37', { map: linenTexture, bumpMap: linenTexture, bumpScale: .04, roughness: 1, side: THREE.DoubleSide }),
  };
  function drapedThrow(parent: THREE.Object3D) {
    const geometry = new THREE.PlaneGeometry(.51, 1.53, 24, 34);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), distance = (positions.getY(i) + .765) / 1.53;
      const z = -.59 + distance * 1.15;
      const y = distance < .5 ? 1.46 - distance * 1.25 : distance < .84 ? .837 - (distance - .5) * .12 : .796 - (distance - .84) * 3.9;
      positions.setXYZ(i, x - .26, y + Math.sin((x + .25) * 30) * .023 + Math.sin(distance * 13) * .012, z);
    }
    geometry.computeVertexNormals();
    return mesh(geometry, throwMaterials.autumn, parent);
  }
  const throwMesh = drapedThrow(lounge);
  const sideTable = objectGroup('Reading side table', group, -2.19, 0, 1.39);
  cylinder(.41, .064, walnut, 0, .57, 0, sideTable);
  cylinder(.067, .49, walnut, 0, .28, 0, sideTable);
  cylinder(.27, .055, walnut, 0, .046, 0, sideTable);
  // A ceramic floor lamp at the edge of the frame gives the corner a warm pool of light at dusk.
  const floorLamp = objectGroup('Linen reading lamp', group, -4.36, 0, -.2);
  cylinder(.29, .06, brass, 0, .042, 0, floorLamp);
  cylinder(.018, 1.83, brass, 0, .98, 0, floorLamp);
  const floorShadeMat = mat('#f0dfbb', { map: linenTexture, side: THREE.DoubleSide, emissive: '#ffd597', emissiveIntensity: 0, roughness: 1 });
  lathe([[.43,0],[.43,.015],[.32,.53],[.31,.54],[.305,.525],[.411,.02]], floorShadeMat, 0, 1.6, 0, floorLamp);
  const readingLight = new THREE.PointLight('#ffcd8a', 0, 4.0, 2); readingLight.position.set(0, 1.68, 0); floorLamp.add(readingLight);

  // A book with real cover, pages, and a lifting cover. Its interaction stays useful in every season.
  const openBook = objectGroup('A bookmarked notebook', sideTable, .01, .62, -.03); openBook.rotation.y = -.28;
  box(.42, .047, .31, walnut, 0, 0, 0, .01, openBook);
  box(.393, .031, .287, paper, .003, .011, .003, .006, openBook);
  const bookLid = objectGroup('Notebook cover hinge', openBook, -.205, .032, 0);
  box(.42, .015, .31, greenCeramic, .205, 0, 0, .008, bookLid);
  box(.026, .005, .12, mat('#b98665'), .33, .013, .126, .002, bookLid);
  register('book', '책갈피에 남긴 작은 기록', openBook, vec(-2.19, .72, 1.37));

  // Curved leaves, branching stems, and rims with an inner soil surface make plants dimensional from every angle.
  const plantPivots: { pivot: THREE.Group; phase: number }[] = [];
  const leafGeometry = new THREE.PlaneGeometry(1, 1, 12, 12);
  {
    const p = leafGeometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + .5, v = p.getY(i) + .5;
      const width = Math.pow(Math.sin(v * Math.PI), .7);
      p.setXYZ(i, (u - .5) * width, v, Math.sin(v * Math.PI) * .18 + Math.pow(u - .5, 2) * .38);
    }
    leafGeometry.computeVertexNormals(); geometries.add(leafGeometry);
  }
  function plant(x: number, y: number, z: number, size: number, potMaterial: THREE.Material, parent: THREE.Object3D = group, name = 'Plant') {
    const result = objectGroup(name, parent, x, y, z); result.scale.setScalar(size);
    lathe([[0,0],[.19,0],[.205,.03],[.24,.37],[.245,.4],[.214,.4],[.206,.07],[0,.05]], potMaterial, 0, 0, 0, result);
    cylinder(.214, .012, soil, 0, .347, 0, result);
    torus(.208, .012, potMaterial, 0, .395, 0, result).rotation.x = Math.PI / 2;
    const foliage = objectGroup('Living leaves', result);
    for (let i = 0; i < 11; i++) {
      const a = i * 2.39996, h = .5 + random() * .8, r = .13 + random() * .22;
      const tip = vec(Math.cos(a) * r, h + .28, Math.sin(a) * r);
      const stem = tube([vec(0,.35,0), vec(Math.cos(a)*.07,h*.65,Math.sin(a)*.07), tip], .009, leafMat, foliage, 10); stem.castShadow = false;
      const pivot = objectGroup('Leaf', foliage, tip.x, tip.y, tip.z); pivot.rotation.set(.45 + random() * .55, -a + Math.PI / 2, -.3 + random() * .6);
      const leaf = mesh(leafGeometry, i % 3 ? leafMat : leafLight, pivot); leaf.scale.set(.22 + random() * .1, .43 + random() * .15, .7);
      leaf.rotation.z = Math.PI * .6; leaf.castShadow = true;
      plantPivots.push({ pivot, phase: a });
    }
    return result;
  }
  const largePlant = plant(4.05, 0, .45, 1.08, terracotta, group, 'Bird of paradise by the window');
  const deskPlant = plant(2.64, 1.225, -2.37, .57, ivoryCeramic, group, 'Little desk plant');
  plant(-4.4, .19, -1.8, .91, terracotta, group, 'Shelf-side rubber plant');
  plant(-3.69, 2.895, -3.0, .39, ivoryCeramic, library, 'Library plant');
  register('plant', '잎사귀를 살짝 건드려보세요', deskPlant, vec(2.64, 1.95, -2.37));
  // A second trailing plant hangs above the library side, with genuine curved vines.
  const trailing = objectGroup('Trailing pothos', group, -4.7, 3.4, -.1);
  lathe([[0,0],[.13,0],[.17,.24],[.17,.26],[.15,.26],[.11,.035],[0,.02]], terracotta, 0, 0, 0, trailing);
  for (let vine = 0; vine < 3; vine++) {
    const points: THREE.Vector3[] = [];
    for (let j = 0; j < 9; j++) points.push(vec(.08 + Math.sin(j * .5 + vine) * .07, .16 - j * .13, (vine - 1) * .11 + Math.sin(j * .5) * .04));
    tube(points, .007, leafMat, trailing, 24);
    for (let j = 1; j < 8; j++) {
      const leaf = mesh(leafGeometry, j % 2 ? leafMat : leafLight, trailing); leaf.position.copy(points[j]); leaf.scale.set(.15, .17, .2); leaf.rotation.set(.4, vine, j % 2 ? -1.1 : 1.1);
    }
  }

  // Seasonal decor changes actual silhouettes, fabrics, objects, and small rituals inside the room.
  const seasonal: Record<Season, THREE.Group> = {
    spring: objectGroup('Spring — blossom branches and soft linen'),
    summer: objectGroup('Summer — iced tea, fan, and pale linen'),
    autumn: objectGroup('Autumn — amber branches, pumpkins, and a rust throw'),
    winter: objectGroup('Winter — a collected Christmas'),
  };
  const cupObjects: THREE.Group[] = [];
  const steamMaterial = mat('#eadac4', { transparent: true, opacity: .12, depthWrite: false, emissive: '#c9b9a5', emissiveIntensity: .14 });
  const steamMeshes: { object: THREE.Object3D; phase: number }[] = [];
  const cupInteraction = objectGroup('Seasonal cup interaction');
  register('cup', '오늘의 음료를 한 모금', cupInteraction, vec(-.55, 1.49, -1.39));
  function mug(parent: THREE.Object3D, color: THREE.Material, cocoa = false) {
    const result = objectGroup('Warm handmade mug', parent, -.55, 1.239, -1.37);
    cylinder(.15, .015, walnut, 0, 0, 0, result);
    lathe([[0,0],[.094,0],[.106,.035],[.11,.2],[.098,.215],[.084,.209],[.086,.05],[0,.035]], color, 0, .009, 0, result);
    const handle = torus(.075, .019, color, .113, .124, 0, result); handle.scale.set(.86, 1, 1);
    cylinder(.086, .006, mat(cocoa ? '#633e28' : '#453825', { roughness: .18 }), 0, .198, 0, result);
    if (cocoa) {
      for (const [x, z] of [[-.03,.015],[.028,-.035],[.031,.033]]) cylinder(.022, .024, snowCream, x, .213, z, result);
      const cane = tube([vec(-.043,.13,-.03),vec(-.069,.27,-.03),vec(-.067,.31,-.03),vec(-.033,.322,-.03),vec(-.017,.3,-.03)], .012, snowCream, result, 16);
      cane.rotation.z = -.2;
    }
    for (let i = 0; i < 3; i++) {
      const steam = tube([vec(0,0,0),vec(.014,.08,.009),vec(-.017,.16,-.005),vec(.014,.24,.001)], .007 + i * .001, steamMaterial, result, 12);
      steam.position.set((i - 1) * .035, .23, 0); steam.castShadow = false; steam.receiveShadow = false;
      steamMeshes.push({ object: steam, phase: i * 1.8 });
    }
    cupObjects.push(result); return result;
  }
  const springCup = mug(seasonal.spring, ivoryCeramic);
  const autumnCup = mug(seasonal.autumn, greenCeramic);
  const winterRed = physical('#913e35', { roughness: .24, clearcoat: .4 });
  const winterCup = mug(seasonal.winter, winterRed, true);
  // Cup roots remain inside their seasonal groups, but also carry a semantic interaction on every mesh.
  for (const cup of [springCup, autumnCup, winterCup]) cup.userData.interactionId = 'cup';

  function vaseBranches(parent: THREE.Object3D, x: number, y: number, z: number, autumn: boolean) {
    const vaseMat = autumn ? physical('#97683e', { transparent: true, opacity: .8, roughness: .18, metalness: .04, clearcoat: .8 }) : ivoryCeramic;
    const arrangement = objectGroup(autumn ? 'Amber autumn branches' : 'Fresh spring blossom', parent, x, y, z);
    lathe([[0,0],[.15,0],[.18,.06],[.17,.3],[.11,.41],[.07,.49],[.077,.52],[.058,.52],[.055,.41],[0,.045]], vaseMat, 0, 0, 0, arrangement);
    const twigMaterial = mat(autumn ? '#715038' : '#64724b', { roughness: .88 });
    const petalMaterials = autumn ? [mat('#b96c37', { side: THREE.DoubleSide }),mat('#c59244', { side: THREE.DoubleSide }),mat('#8d4a2d', { side: THREE.DoubleSide })] : [mat('#ecd4c3'),mat('#f4e9dc'),mat('#d6b9b1')];
    const pollenMaterial = mat('#d4b475');
    for (let b = 0; b < 6; b++) {
      const a = b * 2.4, height = .76 + random() * .48;
      const end = vec(Math.cos(a) * .35, height, Math.sin(a) * .22);
      tube([vec(0,.2,0),vec(end.x*.5,height*.7,end.z*.5),end], .008, twigMaterial, arrangement, 12);
      for (let p = 0; p < 5; p++) {
        const t = .48 + p * .12, cx = end.x * t + Math.sin(p * 2) * .08, cy = height * t + .08, cz = end.z * t;
        between(vec(end.x*t, height*t, end.z*t), vec(cx,cy,cz), .004, twigMaterial, arrangement);
        if (autumn) {
          const leaf = mesh(leafGeometry, petalMaterials[p % 3], arrangement); leaf.position.set(cx,cy,cz); leaf.scale.set(.115,.175,.2); leaf.rotation.set(.4,a+p,1.1);
        } else {
          for (let petal = 0; petal < 5; petal++) {
            const angle = petal / 5 * Math.PI * 2;
            const blossom = ellipsoid(.029,.043,.016, petalMaterials[p % 3], cx+Math.cos(angle)*.028,cy+Math.sin(angle)*.028,cz,arrangement); blossom.rotation.z = angle - Math.PI / 2;
          }
          ellipsoid(.014,.014,.013,pollenMaterial,cx,cy,cz+.014,arrangement);
        }
      }
    }
    return arrangement;
  }
  vaseBranches(seasonal.spring, -2.23, 1.25, -3.36, false);
  vaseBranches(seasonal.autumn, -2.2, 1.25, -3.36, true);
  // Fresh tulips and a seed tray make spring a visible interior change, not merely a palette.
  const springTray = objectGroup('Spring bulb tray', seasonal.spring, 2.3, 1.25, -3.33);
  const tulipMaterials = [mat('#efe0c0'), mat('#e6b8a2')];
  box(.69,.052,.3,oak,0,0,0,.02,springTray);
  for (let i = 0; i < 3; i++) {
    lathe([[0,0],[.08,0],[.11,.18],[.092,.18],[.065,.03],[0,.03]],terracotta,(i-1)*.22,.025,0,springTray);
    between(vec((i-1)*.22,.16,0),vec((i-1)*.22+.035,.51+i*.035,0),.007,leafMat,springTray);
    for (let p = 0; p < 5; p++) {
      const a = p * Math.PI * 2 / 5;
      const petal = ellipsoid(.033,.075,.021,tulipMaterials[i === 1 ? 1 : 0],(i-1)*.22+.035+Math.cos(a)*.025,.53+i*.035,Math.sin(a)*.025,springTray); petal.rotation.y = -a;
    }
    const leaf = mesh(leafGeometry,leafLight,springTray); leaf.position.set((i-1)*.22,.16,0); leaf.scale.set(.08,.28,.2); leaf.rotation.z = -.6;
  }
  box(.33,.028,.26,mat('#aab6a1'),-2.38,.674,1.44,.01,seasonal.spring);

  // Summer's oscillating desk fan is a real wire cage with blades, not a flat icon.
  const fan = objectGroup('Vintage summer desk fan', seasonal.summer, 2.25, 1.24, -1.88);
  const fanEnamel = physical('#b8c5b2',{ roughness:.3, clearcoat:.25 });
  box(.4,.045,.3,fanEnamel,0,.02,0,.09,fan);
  cylinder(.025,.29,brass,0,.18,0,fan);
  const fanHead = objectGroup('Oscillating fan head',fan,0,.46,0);
  torus(.245,.012,fanEnamel,0,0,0,fanHead);
  torus(.225,.005,brass,0,0,.064,fanHead);
  torus(.156,.004,brass,0,0,.078,fanHead);
  torus(.085,.004,brass,0,0,.083,fanHead);
  for(let i=0;i<20;i++) {
    const a=i/20*Math.PI*2;
    tube([vec(Math.cos(a)*.24,Math.sin(a)*.24,0),vec(Math.cos(a)*.16,Math.sin(a)*.16,.071),vec(Math.cos(a)*.03,Math.sin(a)*.03,.083)],.003,brass,fanHead,6);
  }
  const fanBlades = objectGroup('Fan blades',fanHead);
  for(let i=0;i<3;i++) {
    const blade=ellipsoid(.071,.149,.017,fanEnamel,Math.sin(i*2.094)*.08,Math.cos(i*2.094)*.08,.012,fanBlades); blade.rotation.z=-i*2.094+.3;
  }
  const fanCap=cylinder(.04,.034,brass,0,0,.08,fanHead);fanCap.rotation.x=Math.PI/2;
  const iceGlass=objectGroup('Summer iced tea',seasonal.summer,-.55,1.24,-1.37);
  cylinder(.145,.012,oak,0,0,0,iceGlass);
  const glassMat=physical('#f0e8cf',{ transparent:true,opacity:.24,roughness:.09,metalness:.06,clearcoat:1,side:THREE.DoubleSide,depthWrite:false });
  lathe([[.083,0],[.087,.02],[.101,.29],[.091,.29],[.077,.035],[.083,0]],glassMat,0,.012,0,iceGlass);
  cylinder(.087,.18,physical('#b88037',{transparent:true,opacity:.7,roughness:.16}),0,.12,0,iceGlass);
  const iceMat=physical('#dce4df',{transparent:true,opacity:.55,roughness:.13,clearcoat:.9});
  for(let i=0;i<4;i++){ const cube=box(.063,.053,.063,iceMat,(i%2?1:-1)*.033,.216+Math.floor(i/2)*.025,((i+1)%2?1:-1)*.025,.009,iceGlass);cube.rotation.set(.15,i*.8,.2); }
  between(vec(.035,.05,0),vec(.083,.41,-.015),.008,brass,iceGlass);
  cupObjects.push(iceGlass);iceGlass.userData.interactionId='cup';
  const summerBooks=objectGroup('Summer reading stack',seasonal.summer,-2.18,.645,1.37); summerBooks.rotation.y=.19;
  box(.3,.065,.24,mat('#869b98'),0,0,0,.005,summerBooks);
  box(.27,.032,.22,paper,.012,.047,-.005,.004,summerBooks);
  plant(-2.37,1.25,-3.35,.39,greenCeramic,seasonal.summer,'Summer herbs on the sill');

  // Autumn gourds are lobed geometry, with curling stems and amber candles.
  function pumpkin(parent:THREE.Object3D,x:number,y:number,z:number,size:number,color:THREE.ColorRepresentation){
    const g=objectGroup('Ceramic autumn pumpkin',parent,x,y,z);g.scale.setScalar(size);
    const material=physical(color,{roughness:.51,clearcoat:.15});
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;ellipsoid(.115,.17,.12,material,Math.cos(a)*.095,.16,Math.sin(a)*.095,g);}
    tube([vec(0,.28,0),vec(.025,.36,0),vec(.01,.4,.024)],.023,deepWood,g,12);return g;
  }
  pumpkin(seasonal.autumn,2.25,1.25,-3.29,.8,'#b67b4d');
  pumpkin(seasonal.autumn,2.64,1.25,-3.28,.53,'#d5bf92');
  pumpkin(seasonal.autumn,-3.58,2.895,-3.03,.43,'#b58354');
  const candleMat=mat('#ead6ad',{roughness:.86});
  const flameMat=mat('#ffe1a4',{emissive:'#ffc475',emissiveIntensity:1.2,transparent:true,opacity:.85,depthWrite:false});
  const autumnFlames:THREE.Mesh[]=[];
  for(const [x,h] of [[-.13,.18],[.12,.25]]){
    cylinder(.063,h,candleMat,-2.19+x,.63+h/2,1.41,seasonal.autumn);
    const flame=ellipsoid(.012,.028,.012,flameMat,-2.19+x,.65+h,1.41,seasonal.autumn);flame.castShadow=false;autumnFlames.push(flame);
  }
  box(.41,.068,.31,mat('#987950'),2.47,1.26,-1.68,.007,seasonal.autumn);
  box(.37,.052,.3,mat('#636b52'),2.46,1.317,-1.66,.007,seasonal.autumn).rotation.y=.1;

  // Winter: full-dimensional fir with thousands of needles, glass baubles, fairy wire, gifts, and a star.
  const winter=seasonal.winter;
  const christmasTree=objectGroup('Decorated Christmas fir',winter,3.83,0,-1.48);
  const treeNeedle=mat('#315746',{roughness:.88});
  const treeNeedleTips=mat('#42654d',{roughness:.89});
  cylinder(.09,2.57,walnut,0,1.31,0,christmasTree);
  // Curved boughs, flattened foliage sprays, and many needle tufts avoid the stacked-cones silhouette.
  const foliageTransforms:Parameters<typeof instance>[2]=[];
  const twigTransforms:Parameters<typeof instance>[2]=[];
  for(let tier=0;tier<12;tier++){
    const y=.38+tier*.176, radius=.85*(1-tier/13), branches=tier>8?5:8;
    for(let b=0;b<branches;b++){
      const a=b/branches*Math.PI*2+tier*.61, end=vec(Math.cos(a)*radius,y+.055,Math.sin(a)*radius);
      const origin=vec(0,y+.11,0);
      const length=origin.distanceTo(end), direction=end.clone().sub(origin).normalize();
      const quaternion=new THREE.Quaternion().setFromUnitVectors(vec(0,1,0),direction);
      twigTransforms.push({position:origin.clone().add(end).multiplyScalar(.5),scale:vec(.008,length,.008),rotation:new THREE.Euler().setFromQuaternion(quaternion)});
      for(let p=1;p<=7;p++){
        const t=p/7,center=origin.clone().lerp(end,t);
        for(const side of [-1,1]){
          const sprigAngle=a+side*.67;
          const sprigLength=(1-t*.6)*(.22-tier*.009);
          const position=center.clone().add(vec(Math.cos(sprigAngle)*sprigLength*.2,-.015,Math.sin(sprigAngle)*sprigLength*.2));
          foliageTransforms.push({position,scale:vec(.065,sprigLength,.045),rotation:new THREE.Euler(.2,0,-Math.PI/2)});
          const axis=vec(Math.cos(sprigAngle),.25,Math.sin(sprigAngle)).normalize();
          foliageTransforms[foliageTransforms.length-1].rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(vec(0,1,0),axis));
        }
      }
    }
  }
  const tuftGeo=new THREE.ConeGeometry(1,1,7,1);geometries.add(tuftGeo);
  instance(tuftGeo,treeNeedle,foliageTransforms,christmasTree);
  instance(cylinderGeometry,treeNeedleTips,twigTransforms,christmasTree);
  // A smaller centre crown fills the inside without a visible conical outer surface.
  for(let i=0;i<10;i++){
    const r=.5*(1-i/11);
    ellipsoid(r,.2,r,treeNeedle,0,.55+i*.17,0,christmasTree);
  }
  const wirePoints:THREE.Vector3[]=[];
  const bulbTransforms:Parameters<typeof instance>[2]=[];
  for(let i=0;i<260;i++){
    const t=i/259,y=.45+t*1.98,r=.87*(1-t)*.99+.06,a=t*Math.PI*2*5.5;
    const point=vec(Math.cos(a)*r,y+Math.sin(a)*.016,Math.sin(a)*r);
    wirePoints.push(point);
    if(i%3===0)bulbTransforms.push({position:point,scale:vec(.018,.025,.018)});
  }
  tube(wirePoints,.004,deepWood,christmasTree,220);
  const fairyMaterial=mat('#ffe2a1',{emissive:'#ffc36a',emissiveIntensity:2.0,roughness:.3});
  const fairyBulbs=instance(sphereGeometry,fairyMaterial,bulbTransforms,christmasTree);fairyBulbs.castShadow=false;
  const baubleMats=[physical('#a75340',{metalness:.22,roughness:.18,clearcoat:1}),physical('#d4b879',{metalness:.67,roughness:.23,clearcoat:.5}),physical('#ddd7ba',{metalness:.08,roughness:.31,clearcoat:.6})];
  for(let i=0;i<34;i++){
    const t=.1+random()*.79,a=i*2.39996,r=.86*(1-t)+.04,y=.42+t*2.05;
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    between(vec(x,y+.095,z),vec(x,y+.04,z),.003,brass,christmasTree);
    cylinder(.017,.017,brass,x,y+.038,z,christmasTree);
    ellipsoid(.052,.059,.052,baubleMats[i%3],x,y-.011,z,christmasTree);
  }
  // A bevelled five-point star catches the warm lights at the top.
  const starShape=new THREE.Shape();
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5+Math.PI/2,r=i%2?.066:.15,x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(i===0)starShape.moveTo(x,y);else starShape.lineTo(x,y);
  }
  starShape.closePath();
  const star=mesh(new THREE.ExtrudeGeometry(starShape,{depth:.025,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.006,bevelThickness:.006}),brass,christmasTree);star.position.set(0,2.63,0);star.rotation.y=.3;
  const treeLight=new THREE.PointLight('#ffd294',0,3.8,2);treeLight.position.set(0,1.3,.4);christmasTree.add(treeLight);
  // Tree skirt, paper-wrapped gifts, fabric ribbons, and a keepsake train around the base.
  const skirt=cylinder(.99,.025,snowCream,0,.032,0,christmasTree);skirt.scale.z=.85;
  const ribbonMat=mat('#bd9560',{roughness:.62,metalness:.16});
  function gift(x:number,z:number,w:number,h:number,d:number,color:THREE.ColorRepresentation){
    const g=objectGroup('Wrapped present',christmasTree,x,.07,z);g.rotation.y=random()*.4-.2;
    const wrap=mat(color,{map:linenTexture,roughness:.88});
    box(w,h,d,wrap,0,h/2,0,.025,g);
    box(w+.013,.024,d+.013,wrap,0,h-.007,0,.013,g);
    box(w+.02,.015,.04,ribbonMat,0,h+.011,0,.005,g);
    box(.045,h+.028,d+.026,ribbonMat,0,h/2+.006,0,.005,g);
    for(const side of [-1,1]){
      const bow=torus(.048,.009,ribbonMat,side*.038,h+.05,0,g);bow.scale.set(1,.55,1);bow.rotation.set(-.45,side*.3,side*.4);
    }
  }
  gift(-.61,.41,.43,.3,.37,'#9b5147');gift(.4,.45,.4,.25,.32,'#b8ad8c');gift(-.14,.68,.31,.22,.29,'#6a7b66');gift(.73,.13,.22,.4,.25,'#c6af8e');
  register('tree','크리스마스트리의 작은 빛을 찾아보세요',christmasTree,vec(3.83,1.8,-1.48));

  // Garland across the oak lintel, with dimensional fir sprigs and a string of warm bulbs.
  const garlandPoints:THREE.Vector3[]=[];
  const garlandSprigs:Parameters<typeof instance>[2]=[];
  const garlandBulbs:Parameters<typeof instance>[2]=[];
  for(let i=0;i<90;i++){
    const t=i/89,x=-2.92+t*6.18,y=4.28-Math.sin(t*Math.PI*3)**2*.12;
    garlandPoints.push(vec(x,y,-3.225));
    for(const side of [-1,1])garlandSprigs.push({position:vec(x,y+side*.045,-3.2+random()*.025),scale:vec(.08,.16,.06),rotation:new THREE.Euler(.4,0,side*.72)});
    if(i%4===0)garlandBulbs.push({position:vec(x,y-.045,-3.14),scale:vec(.012,.021,.012)});
  }
  tube(garlandPoints,.022,treeNeedle,winter,90);
  instance(tuftGeo,treeNeedle,garlandSprigs,winter);
  const garlandLights=instance(sphereGeometry,fairyMaterial,garlandBulbs,winter);garlandLights.castShadow=false;
  const wreath=objectGroup('Evergreen wreath',winter,-4.943,2.18,1.84);wreath.rotation.y=Math.PI/2;
  torus(.44,.088,treeNeedle,0,0,.22,wreath);
  const wreathSprigs:Parameters<typeof instance>[2]=[];
  for(let i=0;i<55;i++){
    const a=i/55*Math.PI*2;wreathSprigs.push({position:vec(Math.cos(a)*.445,Math.sin(a)*.445,.29),scale:vec(.073,.19,.066),rotation:new THREE.Euler(.3,0,a)});
  }
  instance(tuftGeo,treeNeedleTips,wreathSprigs,wreath);
  for(let i=0;i<11;i++){
    const a=i*2.4;ellipsoid(.024,.024,.024,winterRed,Math.cos(a)*.45,Math.sin(a)*.45,.33,wreath);
  }
  const ribbonRed=mat('#8f3f37',{roughness:.89,side:THREE.DoubleSide});
  for(const side of [-1,1]){
    const bow=torus(.09,.022,ribbonRed,side*.069,-.44,.37,wreath);bow.scale.set(1,.58,1);bow.rotation.z=side*.45;
    box(.07,.22,.014,ribbonRed,side*.058,-.57,.34,.008,wreath).rotation.z=side*.15;
  }
  // A red wool cushion and folded tartan-like blanket replace the spring reading palette.
  const winterPillow=box(.56,.46,.21,throwMaterials.winter,-3.13,1.16,.54,.11,winter);winterPillow.rotation.set(-.12,.4,-.15);
  for(let i=0;i<5;i++)box(.006,.37,.004,snowCream,-3.26+i*.061,1.16,.666,.001,winter).rotation.y=.4;
  // An advent house and warm candle inhabit the sill opposite the large tree.
  const candleHouse=objectGroup('Winter ceramic house',winter,-2.27,1.25,-3.29);
  box(.24,.26,.19,ivoryCeramic,0,.13,0,.014,candleHouse);
  const roofA=box(.19,.025,.24,winterRed,-.06,.302,0,.006,candleHouse);roofA.rotation.z=.62;
  const roofB=box(.19,.025,.24,winterRed,.06,.302,0,.006,candleHouse);roofB.rotation.z=-.62;
  for(const x of [-.06,.06])for(const y of [.09,.19])box(.04,.05,.004,fairyMaterial,x,y,.099,.004,candleHouse);
  box(.028,.064,.005,walnut,0,.04,.1,.006,candleHouse);
  cylinder(.054,.14,candleMat,-1.94,1.32,-3.28,winter);
  ellipsoid(.01,.022,.01,flameMat,-1.94,1.409,-3.28,winter).castShadow=false;

  // Invisible raycast proxies are localized geometry, not a screen-sized interception layer.
  const hitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});materials.add(hitMaterial);
  box(.42,.63,.4,hitMaterial,-.55,1.52,-1.37,.02,cupInteraction).castShadow=false;

  // Batch static pieces by surface material inside each semantic object. Interaction roots and
  // animated parts remain intact, while ornaments, bookcases, pottery, and flower petals share draws.
  const animatedMeshes = new Set<THREE.Object3D>([
    screen, statusLED, throwMesh, ...curtainMeshes, ...autumnFlames,
    ...steamMeshes.map(({ object }) => object),
  ]);
  function batchStaticChildren(parent: THREE.Object3D) {
    for (const child of [...parent.children]) if (child instanceof THREE.Group) batchStaticChildren(child);
    const batches = new Map<string, THREE.Mesh[]>();
    for (const child of parent.children) {
      if (!(child instanceof THREE.Mesh) || child instanceof THREE.InstancedMesh || animatedMeshes.has(child)
        || Array.isArray(child.material) || child.children.length || !child.visible) continue;
      const key = `${child.material.uuid}:${child.castShadow}:${child.receiveShadow}`;
      const batch = batches.get(key) ?? []; batch.push(child); batches.set(key, batch);
    }
    for (const batch of batches.values()) {
      if (batch.length < 2) continue;
      const parts = batch.map(child => {
        child.updateMatrix();
        const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
        geometry.applyMatrix4(child.matrix); return geometry;
      });
      const combined = mergeGeometries(parts, false);
      parts.forEach(geometry => geometry.dispose());
      if (!combined) continue;
      const first = batch[0];
      const batched = mesh(combined, first.material as THREE.Material, parent);
      batched.name = `${parent.name} · ${batch.length} joined details`;
      batched.castShadow = first.castShadow; batched.receiveShadow = first.receiveShadow;
      batch.forEach(child => parent.remove(child));
    }
  }
  batchStaticChildren(group);

  // Keep saved base rotations so organic idle motion never accumulates numerical drift.
  const leafRotations=plantPivots.map(({pivot})=>pivot.rotation.z);
  let treeCelebration=0;
  let screenFocused=false;
  function applyState(next:StudioState){
    const seasonChanged=state.season!==next.season;
    const screenChanged=state.monitorOn!==next.monitorOn;
    state={...next};
    for(const season of Object.keys(seasonal) as Season[])seasonal[season].visible=season===state.season;
    throwMesh.material=throwMaterials[state.season];
    // The large year-round plant shifts slightly to make room for December's full tree.
    largePlant.position.set(state.season==='winter'?4.72:4.05,0,state.season==='winter'?.42:.45);
    if(screenChanged||seasonChanged)drawScreen(state.monitorOn,screenFocused);
    screenMaterial.emissiveIntensity=state.monitorOn?.42:0;
    statusLED.visible=state.monitorOn;
    screenLight.intensity=state.monitorOn?(state.timeOfDay==='night'?.85:.25):0;
    const dark=state.timeOfDay==='night'||state.timeOfDay==='evening';
    readingLight.intensity=dark?5.3:0;
    floorShadeMat.emissiveIntensity=dark?.32:0;
    treeLight.intensity=state.season==='winter'?(dark?4.5:1.2):0;
    fairyMaterial.emissiveIntensity=dark?2.6:1.3;
    for(const flame of autumnFlames)flame.visible=dark;
    if(!state.motionOn){curtainProgress=state.curtainOpen?1:0;lampProgress=state.lampOn?1:0;}
  }
  function animateCurtain(progress:number){
    for(const curtain of curtainMeshes){
      const side=curtain.userData.side as number;
      const width=THREE.MathUtils.lerp(3.07,.67,progress);
      curtain.scale.x=width;
      curtain.position.x=side<0?-2.94+width*.5:3.29-width*.5;
      const p=curtain.geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i);
        const breeze=state.motionOn?Math.sin(motionTime*.58+y*.85+side)*.012*(1-(y+1.64)/3.28):0;
        p.setZ(i,Math.sin((x+.5)*Math.PI*10)*.105+Math.sin((y+1.64)*1.1)*.025+breeze);
      }
      p.needsUpdate=true;
    }
  }
  applyState(state);
  animateCurtain(curtainProgress);

  return {
    group,interactives,
    update:applyState,
    tick(_elapsed:number,delta:number){
      const dt=Math.min(delta,.05);
      if(state.motionOn)motionTime+=dt;
      const blend=state.motionOn?1-Math.exp(-dt*4):1;
      curtainProgress=THREE.MathUtils.lerp(curtainProgress,state.curtainOpen?1:0,blend);
      lampProgress=THREE.MathUtils.lerp(lampProgress,state.lampOn?1:0,blend*1.4>1?1:blend*1.4);
      lampInner.emissiveIntensity=lampProgress*1.6;
      lampBulb.intensity=lampProgress*13;
      lampBounce.intensity=lampProgress*2.6;
      animateCurtain(curtainProgress);
      if(reaction){reactionTime+=dt;if(reactionTime>2.8){reaction=null;reactionTime=0;}}
      const pulse=reaction?(state.motionOn?Math.sin(Math.min(1,reactionTime/2.8)*Math.PI):1):0;
      cupObjects.forEach(cup=>{cup.rotation.z=reaction==='cup'&&state.motionOn?Math.sin(reactionTime*5)*pulse*.035:0;});
      steamMeshes.forEach(({object,phase})=>{
        object.visible=state.season!=='summer';
        object.position.y=.23+(state.motionOn?((motionTime*.055+phase*.025)%.13):phase*.018);
        object.rotation.y=state.motionOn?Math.sin(motionTime*.6+phase)*.6:phase;
        object.scale.setScalar(1+(reaction==='cup'?pulse*.6:0));
      });
      plantPivots.forEach(({pivot,phase},index)=>{
        pivot.rotation.z=leafRotations[index]+(state.motionOn?Math.sin(motionTime*.62+phase)*.016:0)+(state.motionOn&&reaction==='plant'?Math.sin(reactionTime*7+phase)*pulse*.08:0);
      });
      bookLid.rotation.z=reaction==='book'?pulse*.88:0;
      fanHead.rotation.y=state.motionOn?Math.sin(motionTime*.4)*.28:0;
      fanBlades.rotation.z=state.motionOn?motionTime*10:0;
      if(treeCelebration>0){
        treeCelebration=Math.max(0,treeCelebration-dt);
        fairyMaterial.emissiveIntensity=(state.timeOfDay==='night'?2.6:1.3)+(state.motionOn?(Math.sin(motionTime*5)*.4+.5)*Math.min(1,treeCelebration):treeCelebration>0?.65:0);
      }
      if(state.motionOn)autumnFlames.forEach((flame,i)=>flame.scale.y=.028*(1+Math.sin(motionTime*3+i)*.08));
    },
    react(id:InteractionId){
      reaction=id;reactionTime=0;
      if(id==='tree')treeCelebration=5;
      if(id==='monitor'&&state.monitorOn){screenFocused=!screenFocused;drawScreen(true,screenFocused);}
    },
    dispose(){
      group.traverse(object=>{if(object instanceof THREE.InstancedMesh)object.dispose();});
      geometries.forEach(geometry=>geometry.dispose());
      materials.forEach(material=>material.dispose());
      textures.forEach(texture=>texture.dispose());
      lampBulb.shadow.map?.dispose();
      group.clear();
    },
  };
}
