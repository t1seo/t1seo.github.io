import test from 'node:test';
import assert from 'node:assert/strict';
import type { ClimateState } from './cyber-climate.ts';
import { compositor } from './penthouse-effects-test-support.ts';

const state = (weather: ClimateState['weather'] = 'clear', time: ClimateState['time'] = 'night', season: ClimateState['season'] = 'autumn'): ClimateState => ({ weather,time,season,auto:false });

test('monitor starts on with complete code and switches off independently', t => {
  const f = compositor(t,true); f.effects.update(state()); assert.ok(f.text.join('').includes('  companion: "Milky",'));
  f.text.length = 0; f.effects.setWorkspace({monitor:false,lamp:false}); assert.equal(f.text.length,0);
});
test('clear daytime starts with a complete monitor and no animation loop', t => {
  const f = compositor(t); f.effects.update(state('clear','noon'));
  assert.ok(f.text.join('').includes('  companion: "Milky",')); assert.equal(f.frames.size,0);
});
test('explicit monitor power cycling replays code then stops the daytime animation loop', t => {
  const f = compositor(t); f.effects.update(state('clear','noon'));
  f.effects.setWorkspace({monitor:false,lamp:false}); f.text.length = 0;
  f.effects.setWorkspace({monitor:true,lamp:false}); assert.equal(f.frames.size,1);
  assert.ok(!f.text.join('').includes('  companion: "Milky",'));
  for (let tick = 0; tick < 400; tick++) f.run(1000 + tick * 40);
  assert.ok(f.text.join('').includes('  companion: "Milky",')); assert.equal(f.frames.size,0);
});
test('power cycling replays when the caller mutates its existing workspace object', t => {
  const f = compositor(t); f.effects.update(state('clear','noon')); const workspace = { monitor: true, lamp: true };
  f.effects.setWorkspace(workspace); workspace.monitor = false; f.effects.setWorkspace(workspace); f.text.length = 0;
  workspace.monitor = true; f.effects.setWorkspace(workspace);
  assert.equal(f.frames.size,1); assert.ok(!f.text.join('').includes('  companion: "Milky",'));
});
test('completed monitor text is rasterized once while the city continues animating', t => {
  const f = compositor(t); f.effects.update(state()); const textCount = f.text.length;
  for (let tick = 0; tick < 60; tick++) f.run(1000 + tick * 40);
  assert.ok(textCount > 0); assert.equal(f.text.length,textCount);
  assert.equal(f.textureSizes.filter(size => size === 912 * 540).length,1);
});
test('monitor refreshes changed climate text while reusing its pixel buffer', t => {
  const f = compositor(t); f.effects.update(state()); f.text.length = 0;
  f.effects.update(state('snow','morning','winter'));
  assert.ok(f.text.join('').includes('  season: "winter",')); assert.ok(f.text.join('').includes('  weather: "snow",'));
  f.text.length = 0; f.effects.update(state('snow','morning','winter')); assert.equal(f.text.length,0);
  assert.equal(f.textureSizes.filter(size => size === 912 * 540).length,1);
});
test('switching still mode redraws typing once and remains frozen', t => {
  const f = compositor(t); f.effects.update(state('clear','noon'));
  f.effects.setWorkspace({monitor:false,lamp:false}); f.effects.setWorkspace({monitor:true,lamp:false}); f.text.length = 0;
  f.effects.setAnimated(false); assert.ok(f.text.join('').includes('  companion: "Milky",')); const count = f.text.length;
  f.run(1000); assert.equal(f.text.length,count); assert.equal(f.frames.size,0);
});
test('Desk close-up shares the completed screen cache with the room monitor', t => {
  const f = compositor(t); f.effects.update(state()); const count = f.text.length;
  f.effects.setPreview(f.canvas,f.canvas);
  assert.equal(f.text.length,count); assert.equal(f.textureSizes.filter(size => size === 912 * 540).length,1);
});
test('a new room plate refreshes the monitor preview without allocating another texture', t => {
  const f = compositor(t); f.effects.update(state()); f.text.length = 0;
  f.effects.setPlate(new Image());
  assert.ok(f.text.length > 0); assert.equal(f.textureSizes.filter(size => size === 912 * 540).length,1);
});
test('changing the source on the same room image invalidates the monitor preview', t => {
  const f = compositor(t); const plate = new Image(); f.effects.update(state()); f.effects.setPlate(plate); f.text.length = 0;
  plate.src = '/assets/penthouse/seoul/winter/night.webp'; f.effects.setPlate(plate);
  assert.ok(f.text.length > 0);
});
test('hidden monitor changes wait until visibility returns before repainting the cache', t => {
  const f = compositor(t); f.effects.update(state()); f.page.hidden = true; f.page.dispatchEvent(new Event('visibilitychange')); f.text.length = 0;
  f.effects.update(state('snow','noon','winter')); assert.equal(f.text.length,0);
  f.page.hidden = false; f.page.dispatchEvent(new Event('visibilitychange'));
  assert.ok(f.text.join('').includes('  season: "winter",')); assert.equal(f.frames.size,1);
});
test('fallback monitor pixel buffers release their storage on scene teardown', t => {
  const f = compositor(t,false,'missing'); f.effects.update(state());
  assert.equal(f.fallbackCanvases[0].width,912); assert.equal(f.fallbackCanvases[0].height,540);
  f.effects.destroy();
  assert.equal(f.fallbackCanvases[0].width,0); assert.equal(f.fallbackCanvases[0].height,0);
});
