import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGroundedPainter } from './cyber-pet-grounded-render.ts';
import { createGroundedPlan, createGroundedPose, sampleGroundedLoad, sampleGroundedPlan } from './cyber-pet-grounded-plan.ts';
import type { GroundedWalkAssets } from './cyber-pet-grounded-assets.ts';

test('the painted forepaw does not turn inside out while flexing or landing', () => {
  const foreleg = {}, hindleg = {}, torso = {};
  let corners: { x: number; y: number }[] = [], matrix = [1, 0, 0, 1, 0, 0];
  let position = 0, routeName = '';
  let checked = 0;
  const context = {
    globalAlpha: 1,
    getTransform: () => ({ a: .11 }),
    save() {}, restore() {}, closePath() {}, clip() {},
    beginPath() { corners = []; },
    moveTo(x: number, y: number) { corners.push({ x, y }); },
    lineTo(x: number, y: number) { corners.push({ x, y }); },
    transform(...values: number[]) { matrix = values; },
    drawImage(image: object) {
      if (image !== foreleg) return;
      const [a, b, c, d, e, f] = matrix;
      const determinant = a * d - b * c;
      const center = corners.reduce((p, corner) => ({ x: p.x + corner.x / 3, y: p.y + corner.y / 3 }), { x: 0, y: 0 });
      // Invert the submitted affine transform to locate this triangle in the
      // unchanged source image. The sole/paw's painted region is below y925.
      const x = (d * (center.x - e) - c * (center.y - f)) / determinant;
      const y = (-b * (center.x - e) + a * (center.y - f)) / determinant;
      if (x < 910 || x > 1170 || y < 925 || y > 990) return;
      checked++;
      assert.ok(determinant > 0, `painted paw folds at ${routeName}, distance ${position}, source ${x},${y}: ${determinant}`);
      const lowestSourceY = Math.min(...corners.map(point => (-b * (point.x - e) + a * (point.y - f)) / determinant));
      if (lowestSourceY >= 945 - 1e-6) assert.ok(Math.abs(determinant - 1) < 1e-6, 'the sole must rotate rigidly without stretching');
    },
  } as unknown as CanvasRenderingContext2D;
  const assets = { foreleg: { image: foreleg }, hindleg: { image: hindleg }, torso: { image: torso } } as unknown as GroundedWalkAssets;
  const painter = createGroundedPainter(context, assets);
  for (const facing of [1, -1] as const) for (const delta of [{ x: 180, y: 0 }, { x: 91.96, y: -20.702 }, { x: 35, y: -23 }, { x: 108.6, y: -66.2 }, { x: 108.6, y: 66.2 }]) {
    routeName = `${facing}: ${JSON.stringify(delta)}`;
    const route = { from: { x: 400, y: 900 }, to: { x: 400 + facing * delta.x, y: 900 + delta.y }, scale: .11, endScale: .11, facing };
    const plan = createGroundedPlan(route), feet = createGroundedPose();
    for (let frame = 0; frame <= 600; frame++) {
      const u = frame / 600;
      position = plan.distance * u;
      sampleGroundedPlan(plan, position, feet);
      // Zero edge padding makes submitted clip triangles exactly inspectable.
      assert.equal(painter.draw({ root: { x: 400 + facing * delta.x * u, y: 900 + delta.y * u }, scale: .11, facing, load: sampleGroundedLoad(plan, position), feet }, Infinity), true);
    }
  }
  assert.ok(checked > 1000, 'exercise actual submitted paw triangles, not only skeleton coordinates');
});
