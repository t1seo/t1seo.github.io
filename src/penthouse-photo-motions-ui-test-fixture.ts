import type { TestContext } from 'node:test';
import { mountPhotoMotionControls, PHOTO_MOTION_ACTIONS } from './penthouse-photo-motions-ui.ts';

export function photoMotionUiFixture(t: TestContext) {
  const window = new EventTarget();
  const media = Object.assign(new EventTarget(), { matches: false });
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldMatchMedia = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: window });
  Object.defineProperty(globalThis, 'matchMedia', { configurable: true, value: () => media });
  const buttons = PHOTO_MOTION_ACTIONS.map(({ kind }) => Object.assign(new EventTarget(), {
    dataset: { photoMotion: kind }, disabled: false,
  }));
  const status = { textContent: '' };
  const state = { animated: true, bedVisible: true, accepts: true };
  const events: string[] = [];
  const controls = mountPhotoMotionControls({ buttons: () => buttons, status: () => status }, {
    canPhotoMotion: kind => state.bedVisible || (kind !== 'chin-rest' && kind !== 'belly-up'),
    photoMotion: kind => { events.push(kind); return state.accepts; },
  }, () => state.animated, () => events.push('close-and-reactivate'));
  t.after(() => {
    controls.destroy();
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (oldMatchMedia) Object.defineProperty(globalThis, 'matchMedia', oldMatchMedia);
    else Reflect.deleteProperty(globalThis, 'matchMedia');
  });
  const reduced = (matches: boolean) => { media.matches = matches; media.dispatchEvent(new Event('change')); };
  return { controls, buttons, status, state, events, window, media, reduced };
}
