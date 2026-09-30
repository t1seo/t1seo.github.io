import assert from 'node:assert/strict';
import test from 'node:test';
import { createWeatherParticles, GLASS_DROP_COUNT, sampleGlassDrop, sampleWeatherParticle } from './cyber-weather-motion.ts';

const bounds = { left: .255, right: 1, top: 0, bottom: .63 };

test('weather budgets are bounded, repeatable and include sparse near-depth particles', () => {
  for (const kind of ['rain', 'snow', 'seasonal'] as const) {
    const particles = createWeatherParticles(kind, bounds, .45);
    assert.deepEqual(createWeatherParticles(kind, bounds, .45), particles);
    assert.ok(particles.length > 0);
    assert.ok(particles.filter(particle => particle.depth === 2).length <= particles.length * .12);
    const full = createWeatherParticles(kind, bounds, 1);
    assert.ok(full.length <= (kind === 'rain' ? 140 : kind === 'snow' ? 100 : 10));
    assert.deepEqual(createWeatherParticles(kind, bounds, 0), []);
  }
});

test('rain and snow stay within the padded window and advance smoothly at all depths', () => {
  for (const kind of ['rain', 'snow'] as const) {
    const particles = createWeatherParticles(kind, bounds, .45);
    for (const particle of particles) {
      for (let second = 0; second < 70; second += .5) {
        const point = sampleWeatherParticle(particle, second, kind, bounds);
        const next = sampleWeatherParticle(particle, second + 1 / 30, kind, bounds);
        assert.ok(point.x >= bounds.left - .045 && point.x <= bounds.right + .045);
        assert.ok(point.y >= bounds.top - .045 && point.y <= bounds.bottom + .045);
        if (next.y >= point.y) assert.ok(next.y - point.y < .02);
        else assert.ok(point.y > bounds.bottom && next.y < bounds.top, 'recycling is outside the visible window');
      }
    }
  }
});

test('near snow falls faster and drifts independently; rain streaks follow their travel', () => {
  const particles = createWeatherParticles('snow', bounds, .45);
  const far = { ...particles[0], x: .5, y: .2, depth: 0 };
  const near = { ...far, depth: 2 };
  const step = (particle: typeof far, kind: 'snow' | 'rain') => {
    const start = sampleWeatherParticle(particle, 0, kind, bounds);
    const end = sampleWeatherParticle(particle, .1, kind, bounds);
    return { start, dx: end.x - start.x, dy: end.y - start.y };
  };
  assert.ok(step(near, 'snow').dy > step(far, 'snow').dy * 2);
  assert.notEqual(step(near, 'snow').dx, step(far, 'snow').dx);
  const rain = step(near, 'rain');
  assert.ok(Math.abs(rain.dx * 1672 / (rain.dy * 941) - rain.start.slant) < .003);
});

test('glass droplets remain sparse, stay on the pane and fade invisibly at resets', () => {
  assert.ok(GLASS_DROP_COUNT <= 8);
  for (let index = 0; index < GLASS_DROP_COUNT; index++) {
    for (let second = 0; second < 80; second += .05) {
      const drop = sampleGlassDrop(second, index, bounds);
      const next = sampleGlassDrop(second + .05, index, bounds);
      assert.ok(drop.x > bounds.left && drop.x < bounds.right);
      assert.ok(drop.y - drop.tail > bounds.top && drop.y < bounds.bottom);
      assert.ok(drop.opacity >= 0 && drop.opacity <= .29);
      assert.ok(Math.abs(next.opacity - drop.opacity) < .012);
      if (next.y < drop.y - .01) assert.ok(drop.opacity < .001 && next.opacity < .001);
    }
  }
});
