import assert from 'node:assert/strict';
import test from 'node:test';
import { placeMilky, milkyWalkProgress, milkyHasVisibleFloor, milkyWidthRatio, DEFAULT_MILKY_FLOOR } from './cyber-pet-geometry.ts';
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
    const fullButtonHeightAbovePaws = milkyWidthRatio(MILKY_STUDY_FLOOR, false) * room.width / 1.5 * .94;
    assert.ok(p.y * room.height - fullButtonHeightAbovePaws > 772);
  }
  assert.equal(placeMilky(room,room,{x:0,y:.865},MILKY_STUDY_FLOOR).x,.35);
  assert.equal(placeMilky(room,room,{x:1,y:.865},MILKY_STUDY_FLOOR).x,.66);
  // Archived interiors retain their former, larger floor range.
  assert.equal(placeMilky(room,room,{x:1,y:.865}).x,.745);
});

// Bounds produced by the taller window camera: a top-aligned 1672×925 view
// with the native 1672×941 coordinate plane retained for all scene objects.
const seoulCameraFixtures = [[1440,900],[320,568],[390,844],[430,932],[3840,1080]].map(screen => {
  const height = screen[1] - 90;
  const width = height * 1672 / 925;
  const viewportWidth = Math.min(screen[0], width);
  return {
    screen,
    viewport: { left: (screen[0] - viewportWidth) / 2, top: 0, width: viewportWidth, height },
    room: { left: (screen[0] - width) / 2, top: 0, width, height: height * 941 / 925 },
  };
});

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
      assert.ok(p.y * 941 >= .965 * 941, 'the camera never lifts Milky onto furniture');
      const portrait = viewport.width / viewport.height < 4 / 3;
      const fullPoseHeight = milkyWidthRatio(MILKY_STUDY_FLOOR, portrait) * 1672 / 1.5 * .94;
      assert.ok(p.y * 941 - fullPoseHeight > 772, 'the full pose clears the chair feet');
    }
  }
});

test('the desktop camera preserves the complete window and N Seoul Tower while reducing floor', () => {
  const { room, viewport } = seoulCameraFixtures[0];
  const screenX = (x: number) => room.left + x / 1672 * room.width;
  const screenY = (y: number) => room.top + y / 941 * room.height;
  assert.ok(screenX(191) >= viewport.left && screenX(1486) <= viewport.width);
  assert.ok(screenX(350) > 0 && screenY(63) > 0, 'N Seoul Tower remains within the frame');
  assert.ok(screenY(32) > viewport.top && screenY(614) < viewport.height);
  const sourceBottom = viewport.height / room.height * 941;
  assert.ok(sourceBottom >= 924 && sourceBottom <= 926);
  assert.ok((614 - 32) / sourceBottom >= .62, 'the taller window occupies at least 62% of the picture');
  assert.ok((sourceBottom - 772) / sourceBottom <= .17, 'floor below the chair occupies at most 17% of the picture');
});

test('scene-specific sprite widths change crop safety margins while archives keep their widths', () => {
  assert.equal(milkyWidthRatio(DEFAULT_MILKY_FLOOR, false), .14);
  assert.equal(milkyWidthRatio(DEFAULT_MILKY_FLOOR, true), .11);
  assert.equal(milkyWidthRatio(MILKY_STUDY_FLOOR, false), .12);
  assert.equal(milkyWidthRatio(MILKY_STUDY_FLOOR, true), .11);
  const room = { left: 0, top: 0, width: 1672, height: 941 };
  const viewport = { left: 700, top: 0, width: 300, height: 900 };
  const floor = { left: 0, right: 1, top: .8, bottom: .9, footerInset: 0, portraitWidth: .08 };
  const point = placeMilky(room, viewport, { x: 0, y: .85 }, floor);
  const leftmostBody = point.x * room.width - .08 * room.width * .43;
  assert.ok(Math.abs(leftmostBody - (viewport.left + 16)) < .001);
});

test('a separate control strip avoids subtracting the footer twice without changing archive rules', () => {
  const { room, viewport } = seoulCameraFixtures[0];
  assert.equal(milkyHasVisibleFloor(room,viewport,{...MILKY_STUDY_FLOOR,footerInset:undefined}),false);
  assert.equal(milkyHasVisibleFloor(room,viewport,MILKY_STUDY_FLOOR),true);
  assert.equal(placeMilky({left:0,top:0,width:1672,height:941},{left:0,top:0,width:1672,height:941},{x:1,y:1}).x,.745);
});
