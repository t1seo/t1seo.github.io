import type { MilkyPhotoMotion, MilkyPhotoMotionEvent } from './cyber-pet.ts';

export const PHOTO_MOTION_ACTIONS = [
  { kind: 'tilt', label: 'A curious little tilt' },
  { kind: 'paws-rest', label: 'Stretch out and rest' },
  { kind: 'sleepy-peek', label: 'A sleepy little peek' },
  { kind: 'pant', label: 'Catch your breath' },
  { kind: 'chin-rest', label: 'Rest your chin' },
  { kind: 'belly-up', label: 'A comfy little roll' },
] as const satisfies readonly { readonly kind: MilkyPhotoMotion; readonly label: string }[];

type MotionButton = EventTarget & {
  readonly dataset: { readonly photoMotion?: string };
  disabled: boolean;
};
type MotionView = {
  readonly buttons: () => Iterable<MotionButton>;
  readonly status: () => { textContent: string | null } | null;
};
type MotionPet = {
  readonly canPhotoMotion: (kind: MilkyPhotoMotion) => boolean;
  readonly photoMotion: (kind: MilkyPhotoMotion) => boolean;
  readonly subscribePhotoMotions: (listener: (event: MilkyPhotoMotionEvent) => void) => () => void;
};

export function photoMotionButtonsMarkup(): string {
  return PHOTO_MOTION_ACTIONS.map(({ kind, label }) => `<button type="button" data-photo-motion="${kind}" aria-describedby="ph-photo-motion-status">${label}<span aria-hidden="true">↗</span></button>`).join('');
}

export function mountPhotoMotionControls(view: MotionView, pet: MotionPet, isAnimated: () => boolean, beforeStart: () => void) {
  const abort = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let buttonEvents = new AbortController();
  let boundButtons: readonly MotionButton[] = [];
  let unavailable = false;
  let loading = false;
  let requested: MilkyPhotoMotion | undefined;
  let destroyed = false;
  const canStart = (kind: MilkyPhotoMotion) => !destroyed && !reduced.matches && isAnimated() && pet.canPhotoMotion(kind);

  function refresh() {
    if (destroyed) return;
    const buttons = [...view.buttons()];
    if (buttons.length !== boundButtons.length || buttons.some((button, index) => button !== boundButtons[index])) {
      buttonEvents.abort();
      buttonEvents = new AbortController();
      boundButtons = buttons;
      for (const button of buttons) {
        button.addEventListener('click', () => {
          const action = PHOTO_MOTION_ACTIONS.find(({ kind }) => kind === button.dataset.photoMotion);
          if (!action || button.disabled || !canStart(action.kind)) { refresh(); return; }
          requested = action.kind;
          unavailable = false;
          loading = false;
          beforeStart();
          if (!pet.photoMotion(action.kind)) { unavailable = true; loading = false; requested = undefined; }
          refresh();
        }, { signal: buttonEvents.signal });
      }
    }
    for (const button of buttons) {
      const action = PHOTO_MOTION_ACTIONS.find(({ kind }) => kind === button.dataset.photoMotion);
      button.disabled = !action || !canStart(action.kind);
    }
    const status = view.status();
    if (status) status.textContent = reduced.matches ? 'These moments rest while reduced motion is enabled.'
      : !isAnimated() ? 'Turn on “Animate the view” in Atmosphere to enjoy these moments.'
      : unavailable ? 'That moment is not ready yet. Please try again.'
      : loading ? 'Getting this little moment ready…'
      : buttons.length > 0 && buttons.every(button => button.disabled) ? 'Milky’s moments are not available in this view yet.'
      : !pet.canPhotoMotion('paws-rest') || !pet.canPhotoMotion('sleepy-peek') ? 'Some quiet moments are not ready yet. You can still enjoy the others.'
      : !pet.canPhotoMotion('chin-rest') || !pet.canPhotoMotion('belly-up') ? 'The two bed moments need Milky’s bed in view. Try a wider window.'
      : 'Small moments inspired by Milky’s photographs. The last two take place in the bed.';
  }

  window.addEventListener('resize', refresh, { signal: abort.signal });
  reduced.addEventListener('change', refresh, { signal: abort.signal });
  const unsubscribe = pet.subscribePhotoMotions(event => {
    if (destroyed) return;
    if (event.type === 'load' && event.kind === requested) {
      loading = event.state === 'loading';
      unavailable = event.state === 'failed';
      if (!loading) requested = undefined;
    }
    refresh();
  });
  return {
    refresh,
    destroy() {
      if (destroyed) return;
      destroyed = true; unsubscribe(); abort.abort(); buttonEvents.abort(); boundButtons = [];
    },
  };
}
