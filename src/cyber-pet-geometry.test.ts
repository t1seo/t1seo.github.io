import assert from 'node:assert/strict';
import test from 'node:test';
import { placeMilky, milkyWalkProgress, milkyHasVisibleFloor } from './cyber-pet-geometry.ts';
import { MILKY_STUDY_FLOOR } from './penthouse-atmosphere.ts';

test('Milky stays in the cropped mobile floor above the controls', () => {
  const room = { left: -749, top: -7, width: 1500, height: 857 };
  const viewport = { left: 0, top: 0, width: 390, height: 844 };
  for (const requested of [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: .595, y: .878 }]) {
    const p = placeMilky(room, viewport, requested);
    const x = room.left + p.x * room.width;
    const paws = room.top + p.y * room.height;
    assert.ok(x >= 86 && x <= 304, `visible center: ${x}`);
    assert.ok(paws <= 742, `paws above controls: ${paws}`);
  }
});

test('Milky stays away from the furniture at desktop edges', () => {
  const rect = { left: 0, top: 0, width: 1672, height: 941 };
  assert.equal(placeMilky(rect, rect, { x: -1, y: 1 }).x, .4);
  assert.equal(placeMilky(rect, rect, { x: 2, y: 1 }).x, .745);
});

test('compact phones retain Milky above the footer instead of hiding available floor', () => {
  const viewport = { left: 0, top: 0, width: 320, height: 568 };
  const height = viewport.height * 1.016;
  const width = height * 1672 / 941;
  const room = { left: (viewport.width - width) * .675, top: (viewport.height - height) / 2, width, height };
  assert.equal(milkyHasVisibleFloor(room, viewport), true);
  const pose = placeMilky(room, viewport, { x: .595, y: .878 });
  assert.ok(pose.y >= .83);
  assert.ok(room.top + pose.y * room.height <= 484);
});

test('an ultrawide cover crop hides Milky rather than lifting him onto the desk', () => {
  const height = 3840 * 941 / 1672;
  const room = { left: 0, top: (1080 - height) / 2, width: 3840, height };
  const viewport = { left: 0, top: 0, width: 3840, height: 1080 };
  assert.equal(milkyHasVisibleFloor(room, viewport), false);
  assert.ok(placeMilky(room, viewport, { x: .58, y: .955 }).y >= .83);
  const normal = { left: 0, top: 0, width: 1672, height: 941 };
  assert.equal(milkyHasVisibleFloor(normal, normal), true);
});

test('walk advances monotonically and arrives exactly, with gentle acceleration', () => {
  assert.equal(milkyWalkProgress(-1), 0);
  assert.equal(milkyWalkProgress(1.5), 1);
  let last = 0;
  for (let i = 0; i <= 100; i++) {
    const next = milkyWalkProgress(i / 100);
    assert.ok(next >= last && next <= 1);
    last = next;
  }
  assert.ok(milkyWalkProgress(.02) < .02);
  assert.ok(milkyWalkProgress(.98) > .98);
});

test('Seoul foreground keeps Milkys full pose below the chair and desk', () => {
  const room = { left: 0, top: 0, width: 1672, height: 941 };
  for (const requested of [{x:0,y:0},{x:1,y:0}]) {
    const p = placeMilky(room,room,requested,MILKY_STUDY_FLOOR);
    const fullButtonHeightAbovePaws = .14 * room.width / 1.5 * .94;
    assert.ok(p.y * room.height - fullButtonHeightAbovePaws > 640);
  }
  assert.equal(placeMilky(room,room,{x:0,y:.865},MILKY_STUDY_FLOOR).x,.35);
  assert.equal(placeMilky(room,room,{x:1,y:.865},MILKY_STUDY_FLOOR).x,.66);
  // Archived interiors retain their former, larger floor range.
  assert.equal(placeMilky(room,room,{x:1,y:.865}).x,.745);
});

// Bounds produced by the window-focused camera: a top-aligned 1672×800 view
// with the native 1672×941 coordinate plane retained for all scene objects.
const seoulCameraFixtures = [
  { screen: [1440,900], viewport: {left:0,top:0,width:1440,height:810}, room: {left:-126.45,top:0,width:1692.9,height:952.7625} },
  { screen: [320,568], viewport: {left:0,top:0,width:320,height:478}, room: {left:-339.51,top:0,width:999.02,height:562.2475} },
  { screen: [390,844], viewport: {left:0,top:0,width:390,height:754}, room: {left:-592.93,top:0,width:1575.86,height:886.8925} },
  { screen: [430,932], viewport: {left:0,top:0,width:430,height:842}, room: {left:-664.89,top:0,width:1759.78,height:990.9025} },
  { screen: [3840,1080], viewport: {left:885.45,top:0,width:2069.1,height:990}, room: {left:885.45,top:0,width:2069.1,height:1164.4875} },
];

test('window-focused Seoul camera keeps Milky on the floor above its separate control strip', () => {
  assert.equal(MILKY_STUDY_FLOOR.footerInset,0);
  for (const { screen, room, viewport } of seoulCameraFixtures) {
    assert.equal(milkyHasVisibleFloor(room,viewport,MILKY_STUDY_FLOOR),true,`${screen}`);
    for (const requested of [{x:0,y:0},{x:1,y:1}]) {
      const p = placeMilky(room,viewport,requested,MILKY_STUDY_FLOOR);
      assert.ok(p.x >= MILKY_STUDY_FLOOR.left && p.x <= MILKY_STUDY_FLOOR.right);
      assert.ok(room.left + p.x * room.width >= viewport.left + 45);
      assert.ok(room.left + p.x * room.width <= viewport.left + viewport.width-45);
      const paws = room.top + p.y * room.height;
      assert.ok(paws <= viewport.height + .01, `paws remain above controls: ${screen}`);
      assert.ok(p.y * 941 >= .84 * 941, 'the camera never lifts Milky onto furniture');
    }
  }
});

test('the desktop camera preserves the complete window and N Seoul Tower while reducing floor', () => {
  const { room, viewport } = seoulCameraFixtures[0];
  const screenX = (x: number) => room.left + x / 1672 * room.width;
  const screenY = (y: number) => room.top + y / 941 * room.height;
  assert.ok(screenX(191) >= viewport.left && screenX(1486) <= viewport.width);
  assert.ok(screenX(350) > 0 && screenY(63) > 0, 'N Seoul Tower remains within the frame');
  assert.ok(screenY(487) < viewport.height);
  const sourceBottom = viewport.height / room.height * 941;
  assert.ok(sourceBottom >= 799 && sourceBottom <= 801);
  assert.ok((sourceBottom - 640) / sourceBottom <= .21, 'empty foreground occupies at most 21% of the picture');
});

test('a separate control strip avoids subtracting the footer twice without changing archive rules', () => {
  const { room, viewport } = seoulCameraFixtures[0];
  assert.equal(milkyHasVisibleFloor(room,viewport,{...MILKY_STUDY_FLOOR,footerInset:undefined}),false);
  assert.equal(milkyHasVisibleFloor(room,viewport,MILKY_STUDY_FLOOR),true);
  assert.equal(placeMilky({left:0,top:0,width:1672,height:941},{left:0,top:0,width:1672,height:941},{x:1,y:1}).x,.745);
});
