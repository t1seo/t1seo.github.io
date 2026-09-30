import assert from 'node:assert/strict';
import test from 'node:test';
import { BRIDGE_PATH, RIVER_COLUMNS, RIVER_RIPPLES_PER_COLUMN, TRAFFIC_COUNT, cityVisibility, samplePath, sampleRiverRipple, sampleTraffic, windowGlow } from './cyber-ambient-paths.ts';

test('traffic progresses by physical distance and clamps at the bridge endpoints', () => {
  const elbow = [[0, 0], [1, 0], [1, 3]] as const;
  assert.deepEqual(samplePath(elbow, .5), [1, 1]);
  assert.deepEqual(samplePath(BRIDGE_PATH, -1), BRIDGE_PATH[0]);
  assert.deepEqual(samplePath(BRIDGE_PATH, 2), BRIDGE_PATH.at(-1));
});

test('both traffic lanes stay on the bridge and avoid a visibly fast light streak', () => {
  const directions = new Set<number>();
  for (let index = 0; index < TRAFFIC_COUNT; index++) {
    for (let second = 0; second < 95; second++) {
      const car = sampleTraffic(second, index);
      directions.add(car.direction);
      assert.ok(car.x >= .33 && car.x <= .88);
      assert.ok(car.y >= .362 && car.y <= .454);
      assert.ok(car.opacity >= 0 && car.opacity <= 1);
      const later = sampleTraffic(second + .1, index);
      if (car.opacity === 1 && later.opacity === 1) {
        assert.ok(Math.hypot(later.x - car.x, later.y - car.y) < .0017, 'less than 28 source pixels per second');
      }
    }
  }
  assert.deepEqual([...directions].sort(), [-1, 1]);
});

test('registered windows have smooth independent lighting with no flash jumps', () => {
  for (let index = 0; index < 24; index++) {
    for (let second = 0; second < 90; second += .5) {
      const light = windowGlow(second, index);
      assert.ok(light >= .08 && light <= .70);
      assert.ok(Math.abs(windowGlow(second + 1 / 30, index) - light) < .006);
    }
  }
  assert.notEqual(windowGlow(5, 0), windowGlow(5, 1));
});

test('daylight and obscuring weather attenuate decorative city lights', () => {
  assert.ok(cityVisibility('noon', 'clear') < cityVisibility('evening', 'clear'));
  assert.ok(cityVisibility('evening', 'clear') < cityVisibility('night', 'clear'));
  for (const time of ['morning', 'noon', 'afternoon', 'evening', 'night']) {
    assert.ok(cityVisibility(time, 'mist') < cityVisibility(time, 'rain'));
    assert.ok(cityVisibility(time, 'rain') < cityVisibility(time, 'clear'));
  }
});

test('windows have long occupied and dark intervals without synchronized switching', () => {
  const levels = Array.from({ length: 44 }, (_, index) => windowGlow(20, index));
  assert.ok(levels.filter(level => level < .12).length >= 5);
  assert.ok(levels.filter(level => level > .55).length >= 5);
  for (let index = 0; index < 44; index++) {
    let occupied = 0, dark = 0;
    for (let second = 0; second < 130; second++) {
      const level = windowGlow(second, index);
      if (level > .55) occupied++;
      if (level < .12) dark++;
    }
    assert.ok(occupied >= 25, 'windows hold light instead of simply blinking');
    assert.ok(dark >= 15, 'occupancy changes include a sustained dim interval');
  }
});

test('river glints flow inside their water channels and disappear before recycling', () => {
  RIVER_COLUMNS.forEach(([column, top, bottom], index) => {
    for (let ripple = 0; ripple < RIVER_RIPPLES_PER_COLUMN; ripple++) {
      for (let second = 0; second < 90; second += .25) {
        const glint = sampleRiverRipple(second, index, ripple);
        const next = sampleRiverRipple(second + 1 / 30, index, ripple);
        assert.ok(glint.x >= column - .0023 && glint.x <= column + .0023);
        assert.ok(glint.y >= top && glint.y <= bottom);
        assert.ok(glint.opacity >= 0 && glint.opacity <= .3);
        if (Math.abs(next.y - glint.y) > .01) {
          assert.ok(glint.opacity < .001 && next.opacity < .001, 'wrap must not visibly jump');
        } else assert.ok(Math.abs(next.y - glint.y) < .00013);
      }
    }
  });
});
