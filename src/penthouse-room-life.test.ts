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

test('repeated cup clicks restart a bounded effect independently for both cups', () => {
  const room = new RoomLife();
  room.savorCoffee('desk');
  advance(room, 6);
  for (let click = 0; click < 100; click++) room.savorCoffee('desk');
  room.savorCoffee('lounge');
  advance(room, 2);
  assert.equal(room.active, true);
  assert.ok(room.steamWisps().length <= 6);
  assert.ok(room.steamWisps().some(wisp => wisp.x < 150));
  assert.ok(room.steamWisps().some(wisp => wisp.x > 580));
});

test('still steam responds immediately without requiring a simulation tick', () => {
  const room = new RoomLife();
  room.savorCoffee('lounge');
  const pose = room.steamWisps(true);
  assert.ok(pose.some(wisp => wisp.opacity > 0));
  assert.deepEqual(room.steamWisps(true), pose);
  assert.ok(pose.every(wisp => wisp.x > 106 && wisp.x < 138 && wisp.y <= 642));
});

test('a stalled frame cannot consume the full coffee interaction', () => {
  const room = new RoomLife();
  room.savorCoffee('desk');
  room.advance(600);
  assert.equal(room.active, true);
  assert.ok(room.steamWisps().some(wisp => wisp.opacity > 0));
});

test('a still interaction can be dismissed without moving or consuming the other cup', () => {
  const room = new RoomLife();
  room.savorCoffee('desk', true);
  room.savorCoffee('lounge', true);
  room.savorCoffee('desk', true);
  assert.ok(room.steamWisps(true).every(wisp => wisp.x < 150));
  room.savorCoffee('lounge', true);
  assert.equal(room.active, false);
});
