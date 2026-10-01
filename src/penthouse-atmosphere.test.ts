import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { AtmosphereSimulation, atmosphereProfile, isGlass, isSky } from './penthouse-atmosphere.ts';
import { mountPenthouseEffects } from './penthouse-effects.ts';
import { penthousePlate } from './penthouse-scene.ts';
import { CYBER_SEASONS, type ClimateState } from './cyber-climate.ts';

const state = (weather: ClimateState['weather'] = 'clear', time: ClimateState['time'] = 'night', season: ClimateState['season'] = 'autumn'): ClimateState => ({ weather,time,season,auto:false });
const step = (s: AtmosphereSimulation, seconds: number, climate: ClimateState) => { for (let i = 0; i < seconds * 30; i++) s.advance(1/30,climate); };

test('frontal glazing excludes the remaining furniture and horizontal speaker, leaving removed furniture areas clear', () => {
  for (const [x,y] of [[280,450],[450,250],[700,280],[900,200],[1470,370],[550,410],[1020,480],[750,520],[1400,550],[1198,518],[1218,518],[1239,518],[806,540],[480,360],[568,420],[270,420],[1060,461],[1126,505],[1142,538],[1188,520]]) assert.equal(isGlass(x,y),true,`${x},${y}`);
  for (const [x,y] of [[505,200],[1173,200],[200,300],[250,610],[915,465],[1140,480],[1140,520],[1134,538],[675,540],[605,520],[743,540],[900,560],[1250,570],[700,650],[1600,150],[235,420]]) assert.equal(isGlass(x,y),false,`${x},${y}`);
  assert.equal(isSky(457,250),false); // city facade
  assert.equal(isSky(350,160),false); // N Seoul Tower
  assert.equal(isSky(305,210),false); // neighboring mast
  assert.equal(isSky(700,275),false); // Namsan hills
  assert.equal(isSky(470,100),true);
  assert.equal(isSky(1300,100),true);
});
test('slim lamp bar, upright and base stay protected while the removed dome reveals glass', () => {
  for (const [x,y] of [[1050,472],[1093,472],[1135,472],[1134,490],[1134,530],[1134,550],[1110,558],[1130,559],[1150,558]]) {
    assert.equal(isGlass(x,y),false,`painted slim lamp ${x},${y}`);
  }
  for (const [x,y] of [[1078,509],[1114,541],[1110,531],[1117,509],[1144,515],[1142,538],[1060,461],[1095,485],[1146,480]]) {
    assert.equal(isGlass(x,y),true,`clear space around slim lamp ${x},${y}`);
  }
});
test('painted calendar and digital clock exclude weather without hiding adjacent glass', () => {
  for (const [x,y] of [[651,516],[675,540],[681,542],[1196,538],[1220,540],[1249,542]]) {
    assert.equal(isGlass(x,y),false,`painted time object ${x},${y}`);
  }
  for (const [x,y] of [[641,530],[686,524],[668,507],[1187,540],[1258,540],[1220,529]]) {
    assert.equal(isGlass(x,y),true,`glass beside time object ${x},${y}`);
  }
});
test('meteors require clear night, and adverse weather keeps each seasons diffuse daylight', () => {
  for (const season of CYBER_SEASONS) for (const time of ['morning','noon','afternoon','evening','night'] as const) for (const weather of ['clear','rain','snow','mist','cloudy'] as const) {
    assert.equal(atmosphereProfile(state(weather,time,season)).stars,time === 'night' && weather === 'clear');
    if (time === 'morning' || time === 'afternoon') assert.equal(penthousePlate(time,weather,season),penthousePlate(weather === 'clear' ? time : 'noon','clear',season));
    else assert.equal(penthousePlate(time,weather,season),penthousePlate(time,'clear',season));
  }
  assert.equal(new Set(['morning','noon','afternoon','evening','night'].map(t => penthousePlate(t as ClimateState['time']))).size,5);
});
test('rain beads accumulate with bounded density and dry after the rain stops', () => {
  const sim = new AtmosphereSimulation();
  step(sim,120,state('rain'));
  assert.equal(sim.wetness,1); assert.ok(sim.drops.length <= 76);
  assert.ok(sim.drops.some(d => d.speed > 0));
  assert.ok(sim.drops.every(d => isGlass(d.x,d.y) && d.radius <= 5.5 && d.speed <= 45));
  assert.ok(sim.drops.some(d => d.x < 495), 'rain reaches the left pane');
  assert.ok(sim.drops.some(d => d.x > 1181), 'rain reaches the right pane');
  step(sim,10,state()); assert.ok(sim.wetness > .5 && sim.wetness < .6);
  step(sim,13,state()); assert.equal(sim.wetness,0);
});
test('moving beads absorb nearby stationary beads and remain bounded', () => {
  const sim = new AtmosphereSimulation();
  sim.drops = [{x:450,y:250,radius:3,life:1,speed:12,phase:0},{x:450,y:251,radius:2,life:1,speed:0,phase:0}];
  sim.advance(.03,state('rain'));
  assert.ok(sim.drops[0].radius > 3); assert.ok(sim.drops[0].speed > 12);
});
test('clear-night meteors are sparse and precipitation removes one immediately on simulation update', () => {
  const sim = new AtmosphereSimulation(); let starts = 0, previous = false;
  for (let i = 0; i < 120 * 30; i++) {
    sim.advance(1/30,state());
    if (sim.meteor && !previous) {
      starts++;
      for (const progress of [0,.25,.5,.75,1]) {
        assert.equal(isSky(sim.meteor.x + progress * 125,sim.meteor.y + progress * 67),true,'the meteor stays above Namsan and clear of the towers');
      }
    }
    previous = Boolean(sim.meteor);
  }
  assert.ok(starts >= 2 && starts <= 4,`starts: ${starts}`);
  sim.meteor = {x:450,y:200,age:.1,duration:1};
  sim.advance(.03,state('rain')); assert.equal(sim.meteor,null);
});
test('a resumed or stalled frame cannot fast-forward the simulation', () => {
  const sim = new AtmosphereSimulation(); sim.advance(600,state('rain'));
  assert.equal(sim.time,.1); assert.ok(sim.wetness < .05);
});

function compositor(t: TestContext, reducedMotion = false, textureSupport: 'available' | 'missing' | 'no-context' = 'available') {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const install = (key: string,value: unknown) => { originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key)); Object.defineProperty(globalThis,key,{configurable:true,writable:true,value}); };
  const page = Object.assign(new EventTarget(),{hidden:false});
  const media = Object.assign(new EventTarget(),{matches:reducedMotion});
  const frames = new Map<number,FrameRequestCallback>(); let id = 0, draws = 0;
  const text: string[] = [];
  const paintCommands: string[] = [];
  const liveFilters: string[] = [];
  const textureSizes: number[] = [];
  const colorFilters: string[] = [];
  let texturePaints = 0;
  const context = new Proxy({}, { get(_target,key) {
    if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => ({addColorStop() {}});
    if (key === 'measureText') return (value: string) => ({width:value.length * 2});
    if (key === 'fillText') return (value: string) => text.push(value);
    return (...args: unknown[]) => {
      if (key === 'clearRect') draws++;
      if (key === 'clearRect' || key === 'fillRect' || key === 'drawImage') paintCommands.push(key);
      for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg));
    };
  }, set(_target,key,value) {
    if ((key === 'filter' && String(value).includes('blur')) || (key === 'shadowBlur' && Number(value) > 0)) liveFilters.push(`${String(key)}=${String(value)}`);
    if (key === 'filter' && String(value).includes('brightness')) colorFilters.push(String(value));
    return true;
  } });
  install('document',page); install('matchMedia',() => media);
  install('OffscreenCanvas', textureSupport === 'missing' ? undefined : class {
    constructor(width: number,height: number) { textureSizes.push(width * height); }
    getContext() { return textureSupport === 'no-context' ? null : { fillRect() {}, beginPath() {}, rect() {}, fill() {}, clearRect() {}, drawImage() { texturePaints++; } }; }
  });
  const images: Array<EventTarget & { src: string; complete: boolean; naturalWidth: number }> = [];
  install('Image', class extends EventTarget {
    src = ''; complete = false; naturalWidth = 0;
    constructor() { super(); images.push(this); }
  });
  install('requestAnimationFrame',(cb: FrameRequestCallback) => { frames.set(++id,cb); return id; });
  install('cancelAnimationFrame',(n: number) => frames.delete(n));
  const canvas = { getContext: () => context } as unknown as HTMLCanvasElement;
  const effects = mountPenthouseEffects(canvas,null);
  t.after(() => { effects.destroy(); for (const [key,value] of originals) { if (value) Object.defineProperty(globalThis,key,value); else Reflect.deleteProperty(globalThis,key); } });
  return {effects,page,media,frames,text,images,paintCommands,liveFilters,textureSizes,colorFilters,texturePaints:()=>texturePaints,draws:()=>draws,run(now:number) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn=>fn(now)); }};
}
test('loaded desk objects reuse their lighting until the atmosphere changes', t => {
  const f = compositor(t);
  f.effects.update(state());
  for (const image of f.images) { image.complete = true; image.naturalWidth = 512; image.dispatchEvent(new Event('load')); }
  for (let tick = 0; tick < 30; tick++) f.run(1000 + tick * 40);
  assert.deepEqual(f.colorFilters, [], 'steady frames must not re-filter the full-size source images');
  assert.equal(f.texturePaints(), 2, 'each loaded object is lit once');
  const textures = f.textureSizes.length;
  f.effects.update(state('clear', 'morning'));
  assert.equal(f.texturePaints(), 4, 'a different light rebuilds both cached colors');
  assert.equal(f.textureSizes.length, textures, 'lighting changes reuse existing pixel buffers');
  f.effects.update(state('clear', 'morning', 'winter'));
  assert.equal(f.texturePaints(), 4, 'the same lighting remains cached across seasons');
});
test('night lights animate without blurring the full room canvas every frame', t => {
  const f = compositor(t);
  f.effects.update(state());
  for (let tick = 0; tick < 60; tick++) f.run(1000 + tick * 40);
  assert.deepEqual(f.liveFilters, [], 'window softness must be rasterized once, outside the room compositor');
  assert.equal(f.textureSizes.length, 1, 'all night frames reuse one bounded texture');
  assert.ok(f.textureSizes[0] < 65536, 'window texture stays much smaller than the room');
  assert.ok(f.paintCommands.filter(command => command === 'drawImage').length > 60, 'city lights remain visible throughout the animation');
});
for (const textureSupport of ['missing', 'no-context'] as const) {
  test(`night lights remain usable when offscreen textures are ${textureSupport}`, t => {
    const f = compositor(t, false, textureSupport);
    f.effects.update(state());
    for (let tick = 0; tick < 5; tick++) f.run(1000 + tick * 40);
    assert.deepEqual(f.liveFilters, []);
    assert.equal(f.textureSizes.length, textureSupport === 'missing' ? 0 : 1, 'an unavailable texture is not retried every frame');
    assert.ok(f.paintCommands.includes('fillRect'), 'unfiltered city lights still render');
    assert.equal(f.frames.size, 1, 'scene animation continues');
  });
}
test('object images arriving in a still scene repaint once and release on teardown', t => {
  const f = compositor(t,true);
  f.effects.update(state('clear','noon'));
  const before = f.draws();
  assert.equal(f.images.length,2);
  for (const image of f.images) { image.complete = true; image.naturalWidth = 512; image.dispatchEvent(new Event('load')); }
  assert.equal(f.draws(),before + 2);
  assert.equal(f.frames.size,0);
  f.effects.destroy();
  const after = f.draws();
  for (const image of f.images) { assert.equal(image.src,''); image.dispatchEvent(new Event('load')); }
  assert.equal(f.draws(),after);
});
test('all 100 season, weather and time combinations render finite canvas geometry', t => {
  const f = compositor(t);
  for (const season of CYBER_SEASONS) for (const time of ['morning','noon','afternoon','evening','night'] as const) for (const weather of ['clear','cloudy','rain','snow','mist'] as const) {
    f.effects.update(state(weather,time,season)); f.run(1000); f.run(1040);
  }
  assert.ok(f.draws() >= 200); assert.equal(f.frames.size,1);
});
test('hidden tabs stop all scene frames and resume with one loop; destroy removes listeners', t => {
  const f = compositor(t); f.effects.update(state('rain'));
  assert.equal(f.frames.size,1); f.page.hidden = true; f.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.frames.size,0); const count = f.draws(); f.effects.update(state('snow')); assert.equal(f.draws(),count);
  f.page.hidden = false; f.page.dispatchEvent(new Event('visibilitychange')); assert.equal(f.frames.size,1);
  f.effects.destroy(); assert.equal(f.frames.size,0); f.page.dispatchEvent(new Event('visibilitychange')); assert.equal(f.frames.size,0);
});
test('reduced motion and manual still mode render once without animation frames', t => {
  const f = compositor(t,true); f.effects.update(state('rain')); assert.ok(f.draws()); assert.equal(f.frames.size,0);
  f.media.matches = false; f.media.dispatchEvent(new Event('change')); assert.equal(f.frames.size,1);
  f.effects.setAnimated(false); assert.equal(f.frames.size,0); f.effects.update(state()); assert.equal(f.frames.size,0);
});
test('monitor starts off and writes code only after an explicit workspace action', t => {
  const f = compositor(t,true); f.effects.update(state()); assert.equal(f.text.length,0);
  f.effects.setWorkspace({monitor:true,lamp:true}); assert.ok(f.text.join('').includes('  companion: "Milky",'));
  f.text.length = 0; f.effects.setWorkspace({monitor:false,lamp:false}); assert.equal(f.text.length,0);
});
test('clear daytime without active coding is static and uses no animation loop', t => {
  const f = compositor(t); f.effects.update(state('clear','noon')); assert.equal(f.frames.size,0);
  f.effects.setWorkspace({monitor:true,lamp:false}); assert.equal(f.frames.size,1);
  f.effects.setWorkspace({monitor:false,lamp:false}); assert.equal(f.frames.size,0);
});
test('desk lamp toggles replace the light overlay without accumulating paint or idle frames', t => {
  const f = compositor(t); f.effects.update(state('clear','noon'));
  for (const lamp of [false,true,false,true,false]) {
    f.paintCommands.length = 0;
    f.effects.setWorkspace({monitor:false,lamp});
    assert.equal(f.paintCommands[0],'clearRect','each state replaces the previous overlay');
    assert.equal(f.paintCommands.filter(command => command === 'clearRect').length,1);
    if (lamp) assert.ok(f.paintCommands.includes('fillRect'),'turning on paints the light');
    else assert.deepEqual(f.paintCommands,['clearRect'],'turning off leaves no light behind');
    assert.equal(f.frames.size,0,'a steady lamp needs no animation loop');
  }
});
