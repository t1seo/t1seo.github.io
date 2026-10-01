import type { mountPenthouseScene } from './penthouse-scene.ts';

type FireworksScene = Pick<ReturnType<typeof mountPenthouseScene>, 'fireworksActive' | 'startFireworks' | 'stopFireworks' | 'subscribeFireworks'>;

export function mountFireworksControl(root: HTMLElement, scene: FireworksScene, isAnimated: () => boolean, onStart: () => void) {
  const abort = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let unavailable = false;

  function refresh() {
    const button = root.querySelector<HTMLButtonElement>('[data-action="fireworks"]');
    const status = root.querySelector<HTMLElement>('[data-fireworks-status]');
    if (!button || !status) return;
    const active = scene.fireworksActive;
    button.textContent = active ? 'Stop fireworks' : 'Watch fireworks';
    button.setAttribute('aria-pressed', String(active));
    button.disabled = !active && (reduced.matches || !isAnimated());
    status.textContent = reduced.matches ? 'Fireworks stay off while reduced motion is enabled.'
      : !isAnimated() ? 'Turn on “Animate the view” to watch the fireworks.'
      : unavailable ? 'The festival is unavailable. Please try again.'
      : active ? 'The celebration is playing outside your window.'
      : 'A one-minute celebration over the Han River.';
  }

  const unsubscribe = scene.subscribeFireworks(() => { unavailable = false; refresh(); });
  root.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button[data-action="fireworks"]');
    if (!button || button.disabled) return;
    if (scene.fireworksActive) scene.stopFireworks();
    else {
      unavailable = !scene.startFireworks();
      if (!unavailable) onStart();
    }
    refresh();
  }, { signal: abort.signal });
  root.addEventListener('change', event => {
    if (event.target instanceof HTMLInputElement && event.target.name === 'animated') refresh();
  }, { signal: abort.signal });
  reduced.addEventListener('change', refresh, { signal: abort.signal });

  return { refresh, destroy() { abort.abort(); unsubscribe(); } };
}
