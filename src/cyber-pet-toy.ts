import type { MilkyPoint } from './cyber-pet-geometry';

export type MilkyToyOptions = {
  readonly ballHome: Readonly<MilkyPoint>;
  readonly drag?: boolean;
  readonly transitions?: boolean;
};

export function createMilkyToyTarget(wrap: HTMLElement, play: () => void, signal: AbortSignal): HTMLButtonElement {
  const target = wrap.ownerDocument.createElement('button');
  target.type = 'button';
  target.className = 'cyber-pet-toy';
  target.setAttribute('aria-label', 'Play ball with Milky');
  target.disabled = true;
  target.hidden = true;
  target.addEventListener('click', (event) => {
    const suppressed = target.dataset.dragged === 'true' && event.detail !== 0;
    target.dataset.dragged = 'false';
    if (suppressed) { event.preventDefault(); return; }
    play();
  }, { signal });
  wrap.append(target);
  return target;
}
