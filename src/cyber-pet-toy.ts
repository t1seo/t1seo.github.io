import type { MilkyPoint } from './cyber-pet-geometry';

export type MilkyToyOptions = { readonly ballHome: Readonly<MilkyPoint> };

export function createMilkyToyTarget(wrap: HTMLElement, play: () => void, signal: AbortSignal): HTMLButtonElement {
  const target = wrap.ownerDocument.createElement('button');
  target.type = 'button';
  target.className = 'cyber-pet-toy';
  target.setAttribute('aria-label', 'Play ball with Milky');
  target.disabled = true;
  target.hidden = true;
  target.addEventListener('click', play, { signal });
  wrap.append(target);
  return target;
}
