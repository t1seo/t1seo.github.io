import type { TestContext } from 'node:test';
import type { MilkyPhotoMotionEvent } from './cyber-pet.ts';
import { mountPhotoMotionControls, PHOTO_MOTION_ACTIONS } from './penthouse-photo-motions-ui.ts';

export function photoMotionUiFixture(t: TestContext) {
  const window = new EventTarget();
  const media = Object.assign(new EventTarget(), { matches: false });
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldMatchMedia = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: window });
  Object.defineProperty(globalThis, 'matchMedia', { configurable: true, value: () => media });
  const newButtons = () => PHOTO_MOTION_ACTIONS.map(({ kind }) => Object.assign(new EventTarget(), {
    dataset: { photoMotion: kind }, disabled: false,
  }));
  const buttons = newButtons();
  const status = { textContent: '' };
  const state = { animated: true, bedVisible: true, accepts: true, ready: true };
  const events: string[] = [];
  const subscribers = new Set<(event: MilkyPhotoMotionEvent) => void>();
  let lastSubscriber: ((event: MilkyPhotoMotionEvent) => void) | undefined;
  let unsubscribes = 0;
  const emit = (event: MilkyPhotoMotionEvent) => { for (const listener of subscribers) listener(event); };
  const controls = mountPhotoMotionControls({ buttons: () => buttons, status: () => status }, {
    canPhotoMotion: kind => state.ready && (state.bedVisible || (kind !== 'chin-rest' && kind !== 'belly-up')),
    photoMotion: kind => { events.push(kind); if (state.accepts) emit({ type: 'load', kind, state: 'loading' }); return state.accepts; },
    subscribePhotoMotions(listener) {
      lastSubscriber = listener;
      subscribers.add(listener);
      return () => { unsubscribes++; subscribers.delete(listener); };
    },
  }, () => state.animated, () => events.push('close-and-reactivate'));
  t.after(() => {
    controls.destroy();
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (oldMatchMedia) Object.defineProperty(globalThis, 'matchMedia', oldMatchMedia);
    else Reflect.deleteProperty(globalThis, 'matchMedia');
  });
  const reduced = (matches: boolean) => { media.matches = matches; media.dispatchEvent(new Event('change')); };
  const reopen = () => { buttons.splice(0, buttons.length, ...newButtons()); controls.refresh(); };
  return { controls, buttons, status, state, events, window, media, reduced, emit, reopen,
    emitLate: (event: MilkyPhotoMotionEvent) => lastSubscriber?.(event), unsubscribes: () => unsubscribes };
}
