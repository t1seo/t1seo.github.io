import * as THREE from 'three';
import type { Season, StudioState, TimeOfDay } from '../environment';
import type { InteractionId, WorldPart } from './types';

/** A completely geometric landscape. Distances follow the view through the cabin,
 * rather than a front-on illustration: the water bends away to the left. */
export function createExterior(): WorldPart {
  const group = new THREE.Group();
  group.name = 'Lakeside · living landscape';
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const ownGeometry = <T extends THREE.BufferGeometry>(value: T): T => { geometries.add(value); return value; };
  const ownMaterial = <T extends THREE.Material>(value: T): T => { materials.add(value); return value; };
  let randomSeed = 94723;
  const random = () => { randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) | 0; return (randomSeed >>> 0) / 4294967296; };
  const range = (low: number, high: number) => low + random() * (high - low);
  const clamp = THREE.MathUtils.clamp;
  const smooth = (a: number, b: number, v: number) => { const n = clamp((v - a) / (b - a), 0, 1); return n * n * (3 - 2 * n); };
  const dummy = new THREE.Object3D();
  const white = new THREE.Color('#eee9d9');
  const lightColor = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  const axis = new THREE.Vector3();
  const wind = { value: 0 };
  let state: StudioState = { season: 'autumn', timeOfDay: 'afternoon', motionOn: true, auto: true, lampOn: false, monitorOn: true, curtainOpen: true, soundOn: false };
  let sceneTime = 0;
  let reactionAt = -100;
  let disposed = false;

  const palettes: Record<Season, { earth: string; shore: string; leaf: string[]; pine: string; water: string }> = {
    spring: { earth: '#71816a', shore: '#a5a47d', leaf: ['#b2c27f', '#90ac6c', '#718f64', '#c6be9a'], pine: '#455f50', water: '#4d817d' },
    summer: { earth: '#667550', shore: '#969579', leaf: ['#658054', '#80925b', '#4b7054', '#a2a76a'], pine: '#395747', water: '#3f7879' },
    autumn: { earth: '#7c7358', shore: '#a9a087', leaf: ['#b78042', '#bf9750', '#916642', '#8c8356'], pine: '#4a6151', water: '#5b7c76' },
    winter: { earth: '#c5cac4', shore: '#acb9b6', leaf: ['#747b70', '#727768', '#899181', '#a9aaa0'], pine: '#435d57', water: '#68878b' },
  };
  const daylight: Record<TimeOfDay, { zenith: string; horizon: string; haze: string; cloud: string; sun: string; direction: [number, number, number]; brightness: number; stars: number; mist: number }> = {
    morning: { zenith: '#87a9b1', horizon: '#e3cbb0', haze: '#b7bab2', cloud: '#ecdfcb', sun: '#ffddb0', direction: [-.6, .17, -.7], brightness: .8, stars: 0, mist: .29 },
    noon: { zenith: '#6297ac', horizon: '#cfdbd3', haze: '#a9c0bc', cloud: '#f2f0df', sun: '#fff4ce', direction: [-.28, .7, -.64], brightness: 1, stars: 0, mist: .045 },
    afternoon: { zenith: '#86a4ad', horizon: '#e7cfa4', haze: '#babda7', cloud: '#eee2c3', sun: '#ffd59b', direction: [-.7, .25, -.7], brightness: .9, stars: 0, mist: .075 },
    evening: { zenith: '#747f9b', horizon: '#e8a984', haze: '#aaa0aa', cloud: '#dfb6a7', sun: '#ffbb7a', direction: [-.54, .055, -.76], brightness: .52, stars: .06, mist: .11 },
    night: { zenith: '#101e35', horizon: '#465c6a', haze: '#344751', cloud: '#5c6a78', sun: '#d9e7ed', direction: [-.45, .085, -.8], brightness: .16, stars: 1, mist: .13 },
  };

  function earthNoise(x: number, z: number): number {
    return Math.sin(x * .143 + Math.cos(z * .037) * 1.7) * .46
      + Math.sin(z * .129 + x * .057) * .31 + Math.cos(x * .317 - z * .087) * .14;
  }
  const lakeAxis = (z: number) => (z + 4) * .47 - 1.4 + Math.sin(z * .032) * 4;
  const lakeWidth = (z: number) => 9.2 + Math.max(0, -z - 8) * .117 + Math.sin(z * .091) * 2.2;
  function terrainHeight(x: number, z: number): number {
    const distance = Math.abs(x - lakeAxis(z)) - lakeWidth(z) + earthNoise(x, z) * 1.1;
    const side = smooth(-1.4, 9, distance);
    const hill = side * (1.05 + Math.max(0, -z - 13) * .018 + Math.max(0, distance - 8) * .13);
    // A small connected headland supports the foreground birch and cedar.
    const headland = 1.12 * Math.exp(-(((x + 10.3) / 4.9) ** 2 + ((z + 11.3) / 6.8) ** 2));
    return -.55 + hill + side * earthNoise(x, z) * .63 + smooth(140, 190, -z) * 17 + headland;
  }

  // The shore is one continuous tessellated surface, below the water in its bed.
  const terrainGeometry = ownGeometry(new THREE.PlaneGeometry(255, 212, 144, 124));
  terrainGeometry.rotateX(-Math.PI / 2);
  terrainGeometry.translate(-24, 0, -110);
  const terrainPositions = terrainGeometry.attributes.position;
  const terrainColors = new Float32Array(terrainPositions.count * 3);
  for (let i = 0; i < terrainPositions.count; i++) {
    const x = terrainPositions.getX(i), z = terrainPositions.getZ(i);
    terrainPositions.setY(i, terrainHeight(x, z));
  }
  terrainGeometry.computeVertexNormals();
  terrainGeometry.setAttribute('color', new THREE.BufferAttribute(terrainColors, 3));
  const terrainMaterial = ownMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .97, metalness: 0 }));
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.receiveShadow = true;
  terrain.name = 'Continuous sculpted shore';
  group.add(terrain);

  // Each mountain is a continuous eroded ridge, with irregular secondary spurs.
  const mountainMaterials: THREE.MeshStandardMaterial[] = [];
  for (let layer = 0; layer < 4; layer++) {
    const zCenter = -99 - layer * 30;
    const geometry = ownGeometry(new THREE.PlaneGeometry(295, 65, 125, 24));
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(-35, 0, zCenter);
    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const across = (z - zCenter) / 32.5;
      const ridge = Math.pow(Math.max(0, 1 - Math.abs(across)), .65);
      const crest = 7 + layer * 3.6 + Math.sin(x * .052 + layer * 1.35) * 3.2 + Math.sin(x * .119 + layer * 3) * 1.6 + Math.cos(x * .267 - layer) * .6;
      pos.setY(i, -.9 + ridge * crest + Math.max(0, ridge - .1) * earthNoise(x * 1.5, z) * 2);
      const shade = .76 + .19 * ridge + earthNoise(x * 2, z * 3) * .035;
      colors.set([shade, shade, shade], i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const material = ownMaterial(new THREE.MeshStandardMaterial({ color: '#8b9b96', vertexColors: true, roughness: 1, metalness: 0 }));
    const mountain = new THREE.Mesh(geometry, material);
    mountain.name = `Atmospheric ridge ${layer + 1}`;
    mountain.receiveShadow = true;
    group.add(mountain);
    mountainMaterials.push(material);
  }

  const skyUniforms = {
    uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
    uSun: { value: new THREE.Color() }, uSunDirection: { value: new THREE.Vector3() },
    uTime: { value: 0 }, uNight: { value: 0 },
  };
  const skyMaterial = ownMaterial(new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: skyUniforms,
    vertexShader: `varying vec3 vDirection;
      void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      uniform vec3 uZenith,uHorizon,uSun,uSunDirection;uniform float uTime,uNight;varying vec3 vDirection;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec3 d=normalize(vDirection);float elevation=max(d.y,0.0);
        vec3 col=mix(uHorizon,uZenith,pow(smoothstep(-.025,.82,elevation),.62));
        float alignment=max(0.0,dot(d,normalize(uSunDirection)));
        col+=uSun*pow(alignment,12.0)*(.16-uNight*.11);
        col+=uSun*pow(alignment,110.0)*(.14-uNight*.09);
        // Faint high cirrus has genuine parallax beneath the geometric clouds.
        vec2 cloudUV=d.xz/max(d.y+.12,.05)*1.25+vec2(uTime*.0006,0.0);
        float cloud=noise(cloudUV*1.2)*.58+noise(cloudUV*3.1)*.27+noise(cloudUV*8.3)*.15;
        float veil=smoothstep(.56,.77,cloud)*smoothstep(.02,.16,d.y)*(1.0-smoothstep(.48,.8,d.y));
        col=mix(col,uHorizon*1.1,veil*(.22-uNight*.13));
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  const sky = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(430, 48, 28)), skyMaterial);
  sky.position.set(-20, 0, -70);
  sky.renderOrder = -10;
  sky.name = 'Procedural atmospheric sky dome';
  group.add(sky);
  const sunMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: '#ffe8be', toneMapped: false, fog: false }));
  const sun = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(2.65, 24, 20)), sunMaterial);
  sun.name = 'Sun and moon';
  group.add(sun);

  const waterUniforms = {
    uTime: { value: 0 }, uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
    uSunColor: { value: new THREE.Color() }, uSunDirection: { value: new THREE.Vector3() },
    uDeep: { value: new THREE.Color() }, uNight: { value: 0 }, uWinter: { value: 0 },
    uRipple: { value: new THREE.Vector3(-9, -18, -100) },
  };
  const waterMaterial = ownMaterial(new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...waterUniforms }, fog: true,
    vertexShader: `#include <fog_pars_vertex>
      varying vec3 vWorld;
      void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <fog_pars_fragment>
      uniform float uTime,uNight,uWinter;uniform vec3 uZenith,uHorizon,uSunColor,uSunDirection,uDeep,uRipple;
      varying vec3 vWorld;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float wave(vec2 p){
        float t=uTime*.38;
        return sin(p.x*.58+p.y*.32+t)*.12+sin(p.x*1.72-p.y*1.15-t*.8)*.042
          +sin(p.x*4.6+p.y*2.3+t*1.7)*.012+noise(p*6.0+vec2(t*.25,0.0))*.027;
      }
      void main(){
        vec2 p=vWorld.xz;float e=.045;
        float h=wave(p),hx=wave(p+vec2(e,0)),hz=wave(p+vec2(0,e));
        vec2 slope=vec2(h-hx,h-hz)/e;
        float age=uTime-uRipple.z;float radius=length(p-uRipple.xy);
        float ring=sin(radius*7.0-age*3.4)*exp(-abs(radius-age*1.65)*1.8)*exp(-age*.29)*step(0.0,age);
        slope+=normalize(p-uRipple.xy+vec2(.001))*ring*.18;
        vec3 N=normalize(vec3(slope.x*.27,1.0,slope.y*.27));
        vec3 V=normalize(cameraPosition-vWorld);vec3 R=reflect(-V,N);
        float fresnel=.035+.965*pow(1.0-max(dot(N,V),0.0),4.0);
        vec3 reflected=mix(uHorizon,uZenith,pow(clamp(R.y*1.4,0.0,1.0),.7));
        // Soft fragmented pine reflections at the far shore, not a pasted mirror image.
        float bank=sin(p.x*.42)*.25+sin(p.x*1.13+1.7)*.14+noise(vec2(p.x*.63,0.0))*.32;
        float distant=1.0-smoothstep(.07,.19+bank*.08,R.y+N.x*.7);
        reflected=mix(reflected,uDeep*.39,distant*.56);
        float glint=pow(max(dot(R,normalize(uSunDirection)),0.0),180.0);
        float gleam=pow(max(dot(R,normalize(uSunDirection)),0.0),20.0);
        vec3 color=mix(uDeep*.43,reflected,clamp(.32+fresnel*.7,0.0,1.0));
        color+=uSunColor*(glint*1.1+gleam*.12)*(1.0-uWinter*.35);
        float shallows=noise(p*.12)*noise(p*.38);
        color+=uDeep*shallows*.08;
        color=mix(color,mix(uHorizon,uDeep,.52)*.8,uWinter*.24);
        gl_FragColor=vec4(color,1.0);
        #include <fog_fragment>
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  const water = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(255, 207, 1, 1)), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-24, -.30, -108);
  water.name = 'Lake · animated Fresnel water';
  group.add(water);

  // Simple leaves and branch geometry are instanced thousands of times. Trees
  // share materials but retain their own size, silhouette and growth direction.
  const branchGeometry = ownGeometry(new THREE.CylinderGeometry(.62, 1, 1, 7, 1));
  const leafGeometry = ownGeometry(new THREE.SphereGeometry(1, 8, 6));
  const needleGeometry = ownGeometry(new THREE.SphereGeometry(1, 8, 5));
  const rockGeometry = ownGeometry(new THREE.IcosahedronGeometry(1, 2));
  const rockPos = rockGeometry.attributes.position;
  for (let i = 0; i < rockPos.count; i++) {
    const scale = 1 + Math.sin(rockPos.getX(i) * 7 + rockPos.getZ(i) * 4) * .08;
    rockPos.setXYZ(i, rockPos.getX(i) * scale, rockPos.getY(i) * .68 * scale, rockPos.getZ(i) * scale);
  }
  rockGeometry.computeVertexNormals();
  const barkMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#655c4d', roughness: .98 }));
  const birchMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#a09b88', roughness: 1 }));
  const leafMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .83, metalness: 0 }));
  const needleMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .94 }));
  const snowMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#dce2dc', roughness: .91 }));
  const rockMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#777c72', roughness: .98 }));
  const flowerMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#e5c9c2', roughness: .83 }));
  for (const material of [leafMaterial, needleMaterial, flowerMaterial]) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uForestTime = wind;
      shader.vertexShader = `uniform float uForestTime;\n${shader.vertexShader}`.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 root=instanceMatrix[3].xyz;
          float sway=sin(uForestTime*.53+root.x*.32+root.z*.19)*.025;
          transformed.x+=sway*max(root.y-.5,0.0)+sin(uForestTime*1.1+root.x)*.014;
          transformed.z+=cos(uForestTime*.39+root.z*.27)*.018*max(root.y,0.0);
        #endif`);
    };
    material.customProgramCacheKey = () => 'studio-forest-wind-v1';
  }
  type Instance = { position: THREE.Vector3; scale: THREE.Vector3; quaternion: THREE.Quaternion; variation: number };
  const trunks: Instance[] = [], birches: Instance[] = [], leaves: Instance[] = [], needles: Instance[] = [], snow: Instance[] = [], rocks: Instance[] = [], blossoms: Instance[] = [];
  function instance(list: Instance[], x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0) {
    list.push({ position: new THREE.Vector3(x, y, z), scale: new THREE.Vector3(sx, sy, sz), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), variation: random() });
  }
  function branch(list: Instance[], a: THREE.Vector3, b: THREE.Vector3, width: number) {
    const center = a.clone().add(b).multiplyScalar(.5);
    axis.copy(b).sub(a);
    list.push({ position: center, scale: new THREE.Vector3(width, axis.length(), width), quaternion: new THREE.Quaternion().setFromUnitVectors(up, axis.normalize()), variation: random() });
  }
  function makePine(x: number, z: number, height: number, detail: boolean) {
    const y = terrainHeight(x, z);
    instance(trunks, x, y + height * .45, z, height * .025, height * .9, height * .025, range(0, 6));
    const tiers = detail ? 9 : 7;
    const phase = range(0, 6);
    for (let tier = 0; tier < tiers; tier++) {
      const t = tier / tiers;
      const branchY = y + height * (.22 + t * .73);
      const radius = height * .26 * Math.pow(1 - t, .74);
      const whorls = detail ? 9 : 7;
      for (let twig = 0; twig < whorls; twig++) {
        const angle = twig / whorls * Math.PI * 2 + phase + tier * 1.69 + range(-.2, .2);
        const length = radius * range(.69, 1.12);
        const dx = Math.cos(angle), dz = Math.sin(angle);
        const px = x + dx * length * .53, pz = z + dz * length * .53;
        instance(needles, px, branchY + range(-.07, .07) * height, pz, length * .54, height * (.052 + (1 - t) * .015), length * .39, -angle, range(-.15, .15), range(-.18, .18));
        if ((twig + tier) % 3 === 0) instance(snow, px, branchY + height * .044, pz, length * .43, height * .024, length * .29, -angle);
        if (detail && tier < 6 && twig % 2 === 0) {
          branch(trunks, new THREE.Vector3(x, branchY - height * .022, z), new THREE.Vector3(x + dx * length * .87, branchY, z + dz * length * .87), height * .009);
        }
      }
    }
    instance(needles, x, y + height * .962, z, height * .043, height * .09, height * .043);
  }
  function makeBroadleaf(x: number, z: number, height: number, detail: boolean) {
    const y = terrainHeight(x, z), turn = range(0, 6);
    const list = detail ? birches : trunks;
    branch(list, new THREE.Vector3(x, y, z), new THREE.Vector3(x + .1, y + height * .79, z), height * .025);
    const branches = detail ? 11 : 7;
    for (let b = 0; b < branches; b++) {
      const t = b / branches, angle = turn + b * 2.399;
      const spread = height * (.19 + Math.sin(t * Math.PI) * .13) * range(.8, 1.15);
      const bx = x + Math.cos(angle) * spread, bz = z + Math.sin(angle) * spread;
      const by = y + height * (.49 + t * .43);
      branch(list, new THREE.Vector3(x, y + height * (.26 + t * .4), z), new THREE.Vector3(bx, by, bz), height * .011 * (1 - t * .5));
      const clumps = detail ? 8 : 4;
      for (let c = 0; c < clumps; c++) {
        const a = angle + c * 2.4;
        const cr = height * range(.035, .13);
        const px = bx + Math.cos(a) * cr, py = by + range(-.055, .07) * height, pz = bz + Math.sin(a) * cr;
        const size = height * range(.075, .14);
        instance(leaves, px, py, pz, size * range(.9, 1.3), size * range(.58, .84), size, range(0, 6), range(-.2, .2));
        if (detail && c % 2 === 0) instance(blossoms, px + size * .55, py + size * .38, pz, size * .42, size * .22, size * .36, a);
        if (detail && c < 2) {
          branch(list, new THREE.Vector3(bx, by, bz), new THREE.Vector3(px + Math.cos(a) * cr, py + .16, pz + Math.sin(a) * cr), height * .004);
        }
      }
    }
  }
  // Organic groves along both banks. The central view cone remains open to water.
  for (let i = 0; i < 226; i++) {
    const z = range(-119, -13);
    const side = random() > .47 ? 1 : -1;
    const offset = lakeWidth(z) + range(2.3, 24);
    const x = lakeAxis(z) + side * offset;
    const near = z > -35;
    const height = range(4.1, 8.5) * (near ? 1 : range(.83, 1.22));
    if (random() < .64) makePine(x, z, height, near);
    else makeBroadleaf(x, z, height, near);
  }
  // Two graceful close branches establish the depth of the actual window view.
  makeBroadleaf(-9.2, -10.5, 7.9, true);
  makeBroadleaf(5.6, -13.5, 8.5, true);
  makePine(-13.1, -12.3, 10.2, true);
  makePine(8.3, -15.8, 9.3, true);
  for (let i = 0; i < 95; i++) {
    const z = range(-100, -7), side = random() > .5 ? 1 : -1;
    const x = lakeAxis(z) + side * (lakeWidth(z) + range(-.4, 2));
    const size = range(.2, .85);
    instance(rocks, x, Math.max(-.25, terrainHeight(x, z)) + size * .22, z, size * range(.8, 1.8), size, size * .83, range(0, 6), range(-.2, .2));
  }
  function makeInstances(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, entries: Instance[], shadow: boolean): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, material, entries.length);
    mesh.name = name;
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      dummy.position.copy(entry.position); dummy.scale.copy(entry.scale); dummy.quaternion.copy(entry.quaternion); dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.computeBoundingSphere();
    group.add(mesh);
    return mesh;
  }
  const splitDistance = -38;
  const distantLeafGeometry = ownGeometry(new THREE.SphereGeometry(1, 5, 4));
  const nearTrunks = trunks.filter((entry) => entry.position.z > splitDistance);
  const farTrunks = trunks.filter((entry) => entry.position.z <= splitDistance);
  makeInstances('Branching cedar trunks', branchGeometry, barkMaterial, nearTrunks, true);
  makeInstances('Distant cedar trunks', branchGeometry, barkMaterial, farTrunks, false);
  makeInstances('Pale birch branching silhouettes', branchGeometry, birchMaterial, birches, true);
  const nearLeaves = leaves.filter((entry) => entry.position.z > splitDistance);
  const farLeaves = leaves.filter((entry) => entry.position.z <= splitDistance);
  const nearNeedles = needles.filter((entry) => entry.position.z > splitDistance);
  const farNeedles = needles.filter((entry) => entry.position.z <= splitDistance);
  const leafMesh = makeInstances('Seasonal broadleaf canopy', leafGeometry, leafMaterial, nearLeaves, true);
  const farLeafMesh = makeInstances('Distant deciduous grove', distantLeafGeometry, leafMaterial, farLeaves, false);
  const needleMesh = makeInstances('Individual cedar branch whorls', needleGeometry, needleMaterial, nearNeedles, true);
  const farNeedleMesh = makeInstances('Distant cedar forest', distantLeafGeometry, needleMaterial, farNeedles, false);
  const snowMesh = makeInstances('Snow resting on cedar branches', distantLeafGeometry, snowMaterial, snow, false);
  makeInstances('Rounded shore stones', rockGeometry, rockMaterial, rocks, true);
  const blossomMesh = makeInstances('Spring flowering branches', leafGeometry, flowerMaterial, blossoms, false);

  // Reeds and quiet wildflowers are actual stems and small flowerheads at shore.
  const reedEntries: Instance[] = [], meadowFlowers: Instance[] = [];
  for (let i = 0; i < 310; i++) {
    const z = range(-39, -8), side = random() > .5 ? 1 : -1;
    const x = lakeAxis(z) + side * (lakeWidth(z) + range(.6, 3.7));
    const y = terrainHeight(x, z), height = range(.15, .68);
    if (y < -.24) continue;
    instance(reedEntries, x, y + height / 2, z, .011, height, .011, 0, range(-.17, .17), range(-.19, .19));
    if (i % 3 === 0) instance(meadowFlowers, x, y + height, z, .055, .025, .055);
  }
  const reedMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#879276', roughness: 1 }));
  const reedMesh = makeInstances('Lakeside grasses', branchGeometry, reedMaterial, reedEntries, false);
  const meadowMesh = makeInstances('Spring meadow flowers', leafGeometry, flowerMaterial, meadowFlowers, false);

  // Soft cloud volumes, shaded with actual geometric curvature rather than cards.
  const cloudMaterial = ownMaterial(new THREE.MeshLambertMaterial({ color: '#efe7d5', transparent: true, opacity: .47, depthWrite: false, fog: true }));
  const cloudEntries: Instance[] = [];
  for (let bank = 0; bank < 8; bank++) {
    const x = -120 + bank * 29, z = range(-135, -80), y = range(10.5, 17);
    for (let p = 0; p < 15; p++) {
      const size = range(2, 6);
      instance(cloudEntries, x + range(-13, 13), y + range(-1.1, 1.1), z + range(-3.5, 3.5), size * 1.7, size * .23, size * .65);
    }
  }
  const clouds = makeInstances('Slow high cloud volumes', ownGeometry(new THREE.SphereGeometry(1, 12, 8)), cloudMaterial, cloudEntries, false);

  const mistUniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color('#c3c5b7') }, uOpacity: { value: .1 } };
  const mistMaterial = ownMaterial(new THREE.ShaderMaterial({
    uniforms: mistUniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec2 vUv;uniform vec3 uColor;uniform float uTime,uOpacity;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){float edge=sin(vUv.x*3.14159)*sin(vUv.y*3.14159);float n=noise(vUv*vec2(7.0,3.0)+vec2(uTime*.006,0.0));float opacity=edge*edge*(.25+n*.75)*uOpacity;gl_FragColor=vec4(uColor,opacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  }));
  const mistGeometry = ownGeometry(new THREE.PlaneGeometry(80, 3.5));
  for (let i = 0; i < 4; i++) {
    const mist = new THREE.Mesh(mistGeometry, mistMaterial);
    mist.position.set(-17 - i * 8, .8 + i * .24, -28 - i * 19);
    mist.rotation.y = -.22;
    mist.name = `Low lake mist ${i + 1}`;
    group.add(mist);
  }

  // Stars are point geometry on the celestial dome. Weather never enters the room.
  const starGeometry = ownGeometry(new THREE.BufferGeometry());
  const starPositions = new Float32Array(360 * 3);
  const starSizes = new Float32Array(360);
  for (let i = 0; i < 360; i++) {
    const angle = range(Math.PI * .7, Math.PI * 2.2), elevation = range(.05, .8);
    starPositions.set([Math.sin(angle) * 280, elevation * 185 + 12, -Math.abs(Math.cos(angle)) * 250 - 30], i * 3);
    starSizes[i] = range(1, 2.4);
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
  const starUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 } };
  const starMaterial = ownMaterial(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, uniforms: starUniforms,
    vertexShader: `attribute float aSize;varying float vAlpha;uniform float uTime;
      void main(){vAlpha=.68+.32*sin(uTime*.6+position.x);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize;}`,
    fragmentShader: `varying float vAlpha;uniform float uOpacity;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.87,.94,1.0,(1.0-smoothstep(.05,.5,d))*vAlpha*uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  }));
  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.name = 'Dimensional night stars';
  group.add(stars);

  const weatherGeometry = ownGeometry(new THREE.BufferGeometry());
  const weatherPositions = new Float32Array(330 * 3), weatherSeeds = new Float32Array(330 * 3);
  for (let i = 0; i < 330; i++) weatherSeeds.set([range(-26, 11), range(.5, 17), range(-42, -5.5)], i * 3);
  weatherPositions.set(weatherSeeds);
  weatherGeometry.setAttribute('position', new THREE.BufferAttribute(weatherPositions, 3));
  const weatherUniforms = { uSize: { value: 2.2 }, uColor: { value: new THREE.Color('#eee8df') }, uOpacity: { value: .8 }, uPetals: { value: 0 } };
  const weatherMaterial = ownMaterial(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: weatherUniforms,
    vertexShader: `uniform float uSize;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(uSize*35.0/-mv.z,1.1,7.0);}`,
    fragmentShader: `uniform vec3 uColor;uniform float uOpacity,uPetals;void main(){vec2 p=gl_PointCoord-.5;p.x*=1.0+uPetals*.6;float d=length(p);if(d>.48)discard;gl_FragColor=vec4(uColor,(1.0-smoothstep(.12,.48,d))*uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  }));
  const weather = new THREE.Points(weatherGeometry, weatherMaterial);
  weather.name = 'Outdoor snowfall and falling petals';
  weather.frustumCulled = false;
  group.add(weather);

  const fireflyGeometry = ownGeometry(new THREE.BufferGeometry());
  const fireflyPositions = new Float32Array(55 * 3), fireflySeeds = new Float32Array(55 * 3);
  for (let i = 0; i < 55; i++) fireflySeeds.set([range(-18, 5), range(.15, 2.8), range(-32, -7)], i * 3);
  fireflyPositions.set(fireflySeeds);
  fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  const fireflyUniforms = { uTime: { value: 0 }, uOpacity: { value: 1 } };
  const fireflyMaterial = ownMaterial(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: fireflyUniforms,
    vertexShader: `uniform float uTime;varying float vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(95.0/-mv.z,2.0,8.0);vAlpha=pow(.5+.5*sin(uTime*1.2+position.x*3.0),2.0);}`,
    fragmentShader: `uniform float uOpacity;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.77,.91,.37,pow(1.0-d*2.0,2.0)*vAlpha*uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  }));
  const fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
  fireflies.name = 'Summer lakeside fireflies';
  group.add(fireflies);

  const target = {
    zenith: new THREE.Color(), horizon: new THREE.Color(), sun: new THREE.Color(), haze: new THREE.Color(), cloud: new THREE.Color(),
    sunDirection: new THREE.Vector3(), deep: new THREE.Color(), night: 0, mist: 0, winter: 0, stars: 0,
  };
  // Aerial perspective belongs only to outdoor surfaces, so the cabin never
  // needs scene-wide fog. This makes far cedar groves dissolve into the ridges.
  const atmosphere = { value: new THREE.Color('#aebeb5') };
  for (const material of [terrainMaterial, barkMaterial, birchMaterial, leafMaterial, needleMaterial, snowMaterial, rockMaterial, flowerMaterial, reedMaterial, ...mountainMaterials]) {
    const previous = material.onBeforeCompile.bind(material);
    const cacheKey = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous(shader, renderer);
      shader.uniforms.uLandscapeHaze = atmosphere;
      shader.fragmentShader = `uniform vec3 uLandscapeHaze;\n${shader.fragmentShader}`.replace('#include <tonemapping_fragment>', `
        float landscapeDistance=max(length(vViewPosition)-24.0,0.0);
        float landscapeHaze=1.0-exp(-landscapeDistance*.006);
        gl_FragColor.rgb=mix(gl_FragColor.rgb,uLandscapeHaze,landscapeHaze*.78);
        #include <tonemapping_fragment>`);
    };
    material.customProgramCacheKey = () => `${cacheKey}-landscape-atmosphere-v1`;
  }
  function colorInstances(mesh: THREE.InstancedMesh, entries: Instance[], colors: string[], shade: number) {
    const choices = colors.map((value) => new THREE.Color(value));
    for (let i = 0; i < entries.length; i++) {
      const t = entries[i].variation;
      lightColor.copy(choices[Math.floor(t * choices.length)]).multiplyScalar(shade * (.84 + (t * 7 % 1) * .32));
      mesh.setColorAt(i, lightColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  function setSeason(season: Season) {
    const palette = palettes[season];
    const earth = new THREE.Color(palette.earth), shore = new THREE.Color(palette.shore);
    for (let i = 0; i < terrainPositions.count; i++) {
      const x = terrainPositions.getX(i), y = terrainPositions.getY(i), z = terrainPositions.getZ(i);
      const variation = clamp(.5 + earthNoise(x * 2, z * 2) * .45, 0, 1);
      lightColor.copy(earth).lerp(shore, (1 - smooth(-.1, 1.4, y)) * .55).multiplyScalar(.88 + variation * .23);
      if (season === 'winter') lightColor.lerp(white, smooth(.1, 3, y) * .52);
      terrainColors.set([lightColor.r, lightColor.g, lightColor.b], i * 3);
    }
    terrainGeometry.attributes.color.needsUpdate = true;
    colorInstances(leafMesh, nearLeaves, palette.leaf, 1);
    colorInstances(farLeafMesh, farLeaves, palette.leaf, 1);
    colorInstances(needleMesh, nearNeedles, [palette.pine], 1);
    colorInstances(farNeedleMesh, farNeedles, [palette.pine], 1);
    leafMesh.visible = season !== 'winter';
    farLeafMesh.visible = season !== 'winter';
    snowMesh.visible = season === 'winter';
    blossomMesh.visible = season === 'spring';
    meadowMesh.visible = season === 'spring' || season === 'summer';
    reedMesh.visible = season !== 'winter';
    reedMaterial.color.set(season === 'autumn' ? '#ac9970' : '#819271');
    weather.visible = season === 'winter' || season === 'spring' || season === 'autumn';
    weatherUniforms.uColor.value.set(season === 'winter' ? '#e1e9ed' : season === 'spring' ? '#ecd2c8' : '#bd965f');
    weatherUniforms.uPetals.value = season === 'winter' ? 0 : 1;
    weatherUniforms.uSize.value = season === 'winter' ? 1.4 : 2;
    weatherGeometry.setDrawRange(0, season === 'winter' ? 330 : season === 'spring' ? 74 : 44);
  }
  function applyAtmosphere(blend: number) {
    skyUniforms.uZenith.value.lerp(target.zenith, blend);
    skyUniforms.uHorizon.value.lerp(target.horizon, blend);
    skyUniforms.uSun.value.lerp(target.sun, blend);
    skyUniforms.uSunDirection.value.lerp(target.sunDirection, blend).normalize();
    skyUniforms.uNight.value = THREE.MathUtils.lerp(skyUniforms.uNight.value, target.night, blend);
    waterUniforms.uZenith.value.copy(skyUniforms.uZenith.value);
    waterUniforms.uHorizon.value.copy(skyUniforms.uHorizon.value);
    waterUniforms.uSunColor.value.copy(skyUniforms.uSun.value);
    waterUniforms.uSunDirection.value.copy(skyUniforms.uSunDirection.value);
    waterUniforms.uDeep.value.lerp(target.deep, blend);
    waterUniforms.uNight.value = skyUniforms.uNight.value;
    waterUniforms.uWinter.value = THREE.MathUtils.lerp(waterUniforms.uWinter.value, target.winter, blend);
    mistUniforms.uColor.value.lerp(target.haze, blend);
    atmosphere.value.lerp(target.haze, blend);
    mistUniforms.uOpacity.value = THREE.MathUtils.lerp(mistUniforms.uOpacity.value, target.mist, blend);
    cloudMaterial.color.lerp(target.cloud, blend);
    sunMaterial.color.lerp(target.sun, blend);
    sun.position.copy(skyUniforms.uSunDirection.value).multiplyScalar(230).add(new THREE.Vector3(-20, 0, -70));
    sun.scale.setScalar(state.timeOfDay === 'night' ? .73 : 1);
    starUniforms.uOpacity.value = THREE.MathUtils.lerp(starUniforms.uOpacity.value, target.stars, blend);
    for (let i = 0; i < mountainMaterials.length; i++) {
      lightColor.copy(target.haze).lerp(new THREE.Color(state.season === 'winter' ? '#c2cfcb' : '#536b62'), .58 - i * .11);
      mountainMaterials[i].color.lerp(lightColor, blend);
    }
  }
  let initialized = false;
  function update(next: StudioState) {
    if (disposed) return;
    const seasonChanged = !initialized || next.season !== state.season;
    state = { ...next };
    const phase = daylight[state.timeOfDay];
    target.zenith.set(phase.zenith); target.horizon.set(phase.horizon); target.sun.set(phase.sun);
    target.haze.set(phase.haze); target.cloud.set(phase.cloud); target.sunDirection.set(...phase.direction).normalize();
    target.deep.set(palettes[state.season].water).multiplyScalar(.47 + phase.brightness * .53);
    target.night = state.timeOfDay === 'night' ? 1 : 0;
    target.winter = state.season === 'winter' ? 1 : 0;
    target.mist = phase.mist * (state.season === 'winter' ? .78 : 1);
    target.stars = phase.stars;
    if (state.season === 'winter') { target.zenith.lerp(new THREE.Color('#a0b0bc'), .1); target.horizon.lerp(new THREE.Color('#c2cacc'), .16); }
    if (seasonChanged) setSeason(state.season);
    fireflies.visible = state.season === 'summer' && (state.timeOfDay === 'night' || state.timeOfDay === 'evening');
    stars.visible = phase.stars > 0;
    if (!initialized || !state.motionOn) applyAtmosphere(1);
    initialized = true;
  }
  update(state);

  return {
    group,
    interactives: [{ id: 'weather', label: '호수에 작은 파문 만들기', object: water, anchor: new THREE.Vector3(-8.1, .2, -16) }],
    update,
    tick(_elapsed: number, delta: number) {
      if (disposed) return;
      const dt = Math.min(delta, .08);
      applyAtmosphere(state.motionOn ? 1 - Math.exp(-dt * 2.2) : 1);
      if (!state.motionOn) return;
      sceneTime += dt;
      wind.value = sceneTime;
      skyUniforms.uTime.value = sceneTime;
      waterUniforms.uTime.value = sceneTime;
      mistUniforms.uTime.value = sceneTime;
      starUniforms.uTime.value = sceneTime;
      fireflyUniforms.uTime.value = sceneTime;
      clouds.position.x = Math.sin(sceneTime * .009) * 4;
      const reaction = Math.exp(-(sceneTime - reactionAt) * .65);
      if (weather.visible) {
        const speed = state.season === 'winter' ? .42 : .28;
        for (let i = 0; i < weatherSeeds.length / 3; i++) {
          const x = weatherSeeds[i * 3], y = weatherSeeds[i * 3 + 1], z = weatherSeeds[i * 3 + 2];
          weatherPositions[i * 3] = x + Math.sin(sceneTime * .24 + y) * .54 + Math.sin(sceneTime * .62 + z) * .16;
          weatherPositions[i * 3 + 1] = ((y + 18 - sceneTime * speed * (.65 + (i % 9) * .09)) % 18 + 18) % 18 - .1;
          weatherPositions[i * 3 + 2] = z + Math.sin(sceneTime * .18 + x) * .34;
        }
        weatherGeometry.attributes.position.needsUpdate = true;
        weatherUniforms.uOpacity.value = .63 + reaction * .35;
      }
      if (fireflies.visible) {
        for (let i = 0; i < fireflySeeds.length / 3; i++) {
          fireflyPositions[i * 3] = fireflySeeds[i * 3] + Math.sin(sceneTime * .31 + i * 1.8) * .54;
          fireflyPositions[i * 3 + 1] = fireflySeeds[i * 3 + 1] + Math.sin(sceneTime * .38 + i) * .24;
          fireflyPositions[i * 3 + 2] = fireflySeeds[i * 3 + 2] + Math.cos(sceneTime * .21 + i) * .39;
        }
        fireflyGeometry.attributes.position.needsUpdate = true;
        fireflyUniforms.uOpacity.value = .65 + reaction * .6;
      }
    },
    react(id: InteractionId) {
      if (id !== 'weather' || disposed) return;
      reactionAt = sceneTime;
      waterUniforms.uRipple.value.set(-9, -18, sceneTime);
      // Reduced-motion visitors still receive an immediate, quiet visual response.
      if (!state.motionOn) waterUniforms.uRipple.value.z = sceneTime - 1.5;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.traverse((object) => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      group.clear();
    },
  };
}
