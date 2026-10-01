import assert from 'node:assert/strict';
import test from 'node:test';
import type { MilkyPhotoMotion } from './cyber-pet.ts';
import { fixture, MILKY_PHOTO_REST } from './cyber-pet-test-support.ts';

const floor = { left: .35, right: .66, top: .965, bottom: .99, footerInset: 0, desktopWidth: .12, portraitWidth: .11 };
const baseRest = ['sit', 'drowsy', 'sleep'] as const;
type RestPrerequisite = typeof baseRest[number];
const lyingActions = [
  { kind: 'paws-rest', required: ['sit'] },
  { kind: 'sleepy-peek', required: ['sit', 'drowsy', 'sleep'] },
  { kind: 'belly-up', required: ['sit', 'drowsy', 'sleep'] },
  { kind: 'chin-rest', required: ['sit', 'drowsy'] },
] as const satisfies readonly {
  readonly kind: MilkyPhotoMotion;
  readonly required: readonly RestPrerequisite[];
}[];
const setup = (rest: readonly string[] = MILKY_PHOTO_REST) => fixture(7829, ['blink'], rest, true,
  floor, { x: 1440 / 1672, y: 865 / 941 },
  { ballHome: { x: .52, y: .977 }, transitions: true }, { photoMotions: true });

for (const { kind, required } of lyingActions) {
  for (const missing of required) {
    test(`${kind} waits for ${missing} art and refreshes availability after its decode`, async t => {
      // Given the actual active-room controller with one required rest image still pending.
      const f = setup(); t.after(f.restore); await f.loadAll();
      await f.loadRest(required.filter(pose => pose !== missing));
      assert.equal(f.controller.canPhotoMotion(kind), false);
      assert.equal(f.controller.photoMotion(kind), false);
      assert.equal(f.document.images.some(image => image.src.includes('milky-photo-motions/')), false);
      const availability: boolean[] = [];
      f.controller.subscribePhotoMotions(event => {
        if (event.type === 'availability') availability.push(f.controller.canPhotoMotion(kind));
      });
      // When the final required transition image decodes.
      await f.loadRest([missing]);
      // Then an already open drawer can enable the action without a photo request or relayout.
      assert.deepEqual(availability, [true]);
      assert.equal(f.controller.canPhotoMotion(kind), true);
      assert.equal(f.document.images.some(image => image.src.includes('milky-photo-motions/')), false);
    });

    for (const failure of ['network', 'decode'] as const) {
      test(`${kind} stays unavailable when ${missing} has a ${failure} failure`, async t => {
        // Given the active room with all other required rest images decoded.
        const f = setup(); t.after(f.restore); await f.loadAll();
        await f.loadRest(required.filter(pose => pose !== missing));
        const availability: boolean[] = [];
        f.controller.subscribePhotoMotions(event => {
          if (event.type === 'availability') availability.push(f.controller.canPhotoMotion(kind));
        });
        // When the missing bridge fails at the browser image boundary.
        const image = f.asset(`milky-rest-${missing}.webp`);
        switch (failure) {
          case 'network': image.dispatchEvent(new Event('error')); break;
          case 'decode': image.decodeFails = true; await f.loadRest([missing]); break;
          default: failure satisfies never;
        }
        // Then the lying motion cannot skip the bridge, while standing moments remain usable.
        assert.deepEqual(availability, [false]);
        assert.equal(f.controller.canPhotoMotion(kind), false);
        assert.equal(f.controller.photoMotion(kind), false);
        assert.equal(f.document.images.some(asset => asset.src.includes('milky-photo-motions/')), false);
        assert.equal(f.controller.canPhotoMotion('tilt'), true);
        assert.equal(f.controller.canPhotoMotion('pant'), true);
      });
    }
  }
}

test('the decoded original three-pose fallback still supports all lying moments', async t => {
  // Given the original three-pose rest set without optional sitdown or wake images.
  const f = setup(baseRest); t.after(f.restore); await f.loadAll(); await f.loadRest(baseRest);
  // When capabilities are queried for each lying action.
  const available = lyingActions.map(({ kind }) => f.controller.canPhotoMotion(kind));
  // Then all required descent and exit bridges exist through sit, drowsy and sleep.
  assert.deepEqual(available, [true, true, true, true]);
  assert.equal(f.document.images.some(image => /milky-rest-(sitdown|wake)\.webp$/.test(image.src)), false);
});
