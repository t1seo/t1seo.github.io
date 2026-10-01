import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomLife } from './penthouse-room-life.ts';

const advance = (room: RoomLife, seconds: number) => {
  for (let tick = 0; tick < seconds * 30; tick++) room.advance(1 / 30);
};

test('coffee releases visible steam from the desk cup only after a click', () => {
  const room = new RoomLife();
  assert.equal(room.active, false);
  assert.deepEqual(room.steamWisps(), []);
  room.savorCoffee('desk');
  advance(room, 1);
  assert.equal(room.active, true);
  assert.ok(room.steamWisps().some(wisp => wisp.opacity > 0));
  assert.ok(room.steamWisps().every(wisp => wisp.x > 587 && wisp.x < 623 && wisp.y <= 520));
});

test('coffee steam completely expires after seven visible seconds', () => {
  const room = new RoomLife();
  room.savorCoffee('desk');
  advance(room, 7.1);
  assert.equal(room.active, false);
  assert.deepEqual(room.steamWisps(), []);
});

test('repeated coffee and diffuser clicks restart separate bounded effects', () => {
  const room = new RoomLife();
  room.savorCoffee('desk');
  advance(room, 6);
  for (let click = 0; click < 100; click++) room.savorCoffee('desk');
  for (let click = 0; click < 100; click++) room.scentDiffuser();
  advance(room, 2);
  assert.equal(room.active, true);
  assert.equal(room.steamWisps().length, 3);
  assert.equal(room.fragranceWisps().length, 2);
  assert.ok(room.fragranceWisps().every(wisp => wisp.x < 150));
  assert.ok(room.steamWisps().some(wisp => wisp.x > 580));
});

test('still diffuser fragrance responds immediately without requiring a simulation tick', () => {
  const room = new RoomLife();
  room.scentDiffuser(true);
  const pose = room.fragranceWisps(true);
  assert.ok(pose.some(wisp => wisp.opacity > 0));
  assert.deepEqual(room.fragranceWisps(true), pose);
  assert.ok(pose.every(wisp => wisp.x > 110 && wisp.x < 138 && wisp.y <= 612));
});

test('a stalled frame cannot consume the full coffee interaction', () => {
  const room = new RoomLife();
  room.savorCoffee('desk');
  room.advance(600);
  assert.equal(room.active, true);
  assert.ok(room.steamWisps().some(wisp => wisp.opacity > 0));
});

test('still coffee and diffuser interactions can be dismissed independently', () => {
  const room = new RoomLife();
  room.savorCoffee('desk', true);
  room.scentDiffuser(true);
  room.savorCoffee('desk', true);
  assert.deepEqual(room.steamWisps(true), []);
  assert.ok(room.fragranceWisps(true).every(wisp => wisp.opacity > 0));
  room.scentDiffuser(true);
  assert.equal(room.active, false);
});

test('diffuser fragrance begins only on a click and rises gently from the bottle neck', () => {
  const room = new RoomLife();
  assert.deepEqual(room.fragranceWisps(), []);
  room.scentDiffuser();
  advance(room, 1.5);
  const wisps = room.fragranceWisps();
  assert.equal(room.active, true);
  assert.equal(wisps.length, 2);
  assert.ok(wisps.every(wisp => wisp.x > 110 && wisp.x < 138 && wisp.y >= 609 && wisp.y <= 612));
  assert.ok(wisps.every(wisp => wisp.y - wisp.height < 590 && wisp.opacity > 0 && wisp.opacity < .04));
  assert.ok(wisps.every(wisp => wisp.width < 2 && Math.abs(wisp.bend) > 5));
  assert.deepEqual(room.steamWisps(), []);
});

test('diffuser fragrance completely expires after seven visible seconds', () => {
  const room = new RoomLife();
  room.scentDiffuser();
  advance(room, 7.1);
  assert.equal(room.active, false);
  assert.deepEqual(room.fragranceWisps(), []);
});

test('clearing the room removes both coffee and diffuser effects', () => {
  const room = new RoomLife();
  room.scentDiffuser();
  room.savorCoffee('desk');
  room.clear();
  assert.equal(room.active, false);
  assert.deepEqual(room.fragranceWisps(), []);
  assert.deepEqual(room.steamWisps(), []);
});
