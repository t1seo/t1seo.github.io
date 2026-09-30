import { createEnvironment, type StudioState } from './environment';
import { mountEnvironmentControls } from './environment-controls';
import { mountBadge } from './badge';
import { mountPaperIntro } from './paper-intro';
import type { PaperInteractionId } from './paper-types';
import './paper-immersive-shell.css';

const objects: { id: PaperInteractionId; label: string; description: string }[] = [
  { id: 'lamp', label: 'Desk lamp', description: 'Switch the lamp on or off' },
  { id: 'monitor', label: 'Monitor', description: 'Start typing a little code' },
  { id: 'curtain', label: 'Curtains', description: 'Open or close the curtains' },
  { id: 'cup', label: 'Tea', description: 'Take a little tea break' },
  { id: 'plant', label: 'Plant', description: 'Water a green friend' },
  { id: 'book', label: 'Book', description: 'Find a note between the pages' },
  { id: 'tree', label: 'Seasonal decor', description: 'Add a little seasonal sparkle' },
  { id: 'weather', label: 'Window', description: 'Send a breeze through the trees' },
  { id: 'calendar', label: 'Calendar', description: 'Choose a time and season' },
  { id: 'music', label: 'Radio', description: 'Turn the music on or off' },
  { id: 'keyboard', label: 'Keyboard', description: 'Write a few lines of code' },
  { id: 'frame', label: 'Artwork', description: 'Choose a little picture' },
  { id: 'bird', label: 'Bird', description: 'Welcome a visitor to the window' },
  { id: 'lights', label: 'Wall light', description: 'Switch the wall light on or off' },
  { id: 'shelf', label: 'Bookshelf', description: 'Find a hidden letter' },
  { id: 'cat', label: 'Sleeping cat', description: 'Say hello to a sleepy friend' },
  { id: 'globe', label: 'Globe', description: 'Find a little travel note' },
  { id: 'pencils', label: 'Pencils', description: 'Make room for a playful idea' },
];
const toggles = new Set<PaperInteractionId>(['lamp', 'curtain', 'music']);

/** A quiet full-window frame: the calendar in the scene opens its only visible controls. */
export function mountImmersiveShell(
  app: HTMLElement,
  environment: ReturnType<typeof createEnvironment>,
  onAction: (id: PaperInteractionId) => void,
  options: { onPortfolio?: () => void } = {},
) {
  const root = document.createElement('main');
  root.className = 'paper-immersive';
  root.dataset.motion = environment.getState().motionOn ? 'on' : 'off';
  root.innerHTML = `
    <h1 class="paper-immersive-sr" lang="en">Software Engineer — Jieun Jeon</h1>
    <button class="paper-immersive-settings-shortcut" type="button" lang="en" aria-haspopup="dialog">Open time and season settings</button>
    <div class="paper-immersive-scene" aria-label="A paper studio changing with the time and seasons"></div>
    <div class="paper-immersive-badge" aria-label="Jieun Jeon ID badge"></div>
    <dialog class="paper-immersive-dialog" lang="en" aria-labelledby="paper-immersive-dialog-title">
      <div class="paper-immersive-dialog-top">
        <h2 id="paper-immersive-dialog-title">A change of scenery</h2>
        <button class="paper-immersive-close" type="button" aria-label="Close settings and return to the studio" autofocus><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button>
      </div>
      <div class="paper-immersive-environment"></div>
      <details class="paper-immersive-objects">
        <summary>Little things in the room<span aria-hidden="true">+</span></summary>
        <div class="paper-immersive-object-grid" role="group" aria-label="Explore the objects in the studio">${objects.map(({ id, label, description }) => `<button type="button" data-paper-object="${id}" aria-label="${label}: ${description}"${toggles.has(id) ? ' aria-pressed="false"' : ''}>${label}</button>`).join('')}</div>
      </details>
      <p class="paper-immersive-track" data-paper-track lang="en" aria-live="polite" aria-atomic="true" hidden></p>
      ${options.onPortfolio ? '<button class="paper-immersive-portfolio-link" type="button" data-paper-portfolio>Portfolio <span aria-hidden="true">↗</span></button>' : ''}
      <div class="paper-immersive-credit-links">
        <a class="paper-immersive-credits" href="/assets/music/CREDITS.html" target="_blank" rel="noopener noreferrer">Music credits <span aria-hidden="true">↗</span></a>
        <a class="paper-immersive-credits" href="/assets/paper/CREDITS.html" target="_blank" rel="noopener noreferrer">Art & credits <span aria-hidden="true">↗</span></a>
      </div>
    </dialog>
    <div class="paper-immersive-sr" role="status" aria-live="polite" aria-atomic="true" data-paper-announcement></div>
  `;
  app.append(root);

  const sceneMount = root.querySelector<HTMLElement>('.paper-immersive-scene')!;
  const dialog = root.querySelector<HTMLDialogElement>('.paper-immersive-dialog')!;
  const closeButton = root.querySelector<HTMLButtonElement>('.paper-immersive-close')!;
  const shortcut = root.querySelector<HTMLButtonElement>('.paper-immersive-settings-shortcut')!;
  const announcement = root.querySelector<HTMLElement>('[data-paper-announcement]')!;
  const trackLabel = root.querySelector<HTMLElement>('[data-paper-track]')!;
  const objectButtons = root.querySelectorAll<HTMLButtonElement>('[data-paper-object]');
  const badge = mountBadge(root.querySelector<HTMLElement>('.paper-immersive-badge')!, { onPull: options.onPortfolio });
  const controls = mountEnvironmentControls(root.querySelector<HTMLElement>('.paper-immersive-environment')!, environment, { language: 'en' });
  const abort = new AbortController();
  let returnFocus: HTMLElement | null = null;
  let destroyed = false;
  let active = true;
  let pageReturnFocus: HTMLElement | null = null;

  function openSettings() {
    if (destroyed || !active || dialog.open) return;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
  }

  function render(state: StudioState) {
    root.dataset.motion = state.motionOn ? 'on' : 'off';
    root.dataset.season = state.season;
    root.dataset.time = state.timeOfDay;
    for (const button of objectButtons) {
      const id = button.dataset.paperObject as PaperInteractionId;
      if (id === 'lamp') button.setAttribute('aria-pressed', String(state.lampOn));
      if (id === 'curtain') button.setAttribute('aria-pressed', String(state.curtainOpen));
      if (id === 'music') button.setAttribute('aria-pressed', String(state.soundOn));
      if (id === 'weather' || id === 'bird') button.disabled = !state.curtainOpen;
    }
    // A browser tooltip is still a visible hint, including the original badge's title.
    root.querySelectorAll('[title]').forEach((element) => { element.removeAttribute('title'); });
  }

  shortcut.addEventListener('click', openSettings, { signal: abort.signal });
  closeButton.addEventListener('click', () => dialog.close(), { signal: abort.signal });
  dialog.addEventListener('close', () => {
    if (returnFocus?.isConnected && !destroyed && active) returnFocus.focus({ preventScroll: true });
  }, { signal: abort.signal });
  root.querySelector<HTMLButtonElement>('[data-paper-portfolio]')?.addEventListener('click', () => options.onPortfolio?.(), { signal: abort.signal });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }, { signal: abort.signal });
  dialog.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-paper-object]') : null;
    if (!button || !dialog.contains(button) || button.disabled) return;
    const id = button.dataset.paperObject as PaperInteractionId;
    if (id !== 'calendar') dialog.close();
    onAction(id);
  }, { signal: abort.signal });
  const unsubscribe = environment.subscribe(render);
  const intro = mountPaperIntro(root);

  return {
    sceneMount,
    openSettings,
    setActive(value: boolean) {
      if (destroyed || active === value) return;
      active = value;
      if (!value) {
        const focused = document.activeElement;
        pageReturnFocus = focused instanceof HTMLElement && root.contains(focused) && !dialog.contains(focused) ? focused : null;
        if (dialog.open) dialog.close();
      }
      root.inert = !value;
      root.hidden = !value;
      if (value) {
        const target = pageReturnFocus?.isConnected ? pageReturnFocus : root.querySelector<HTMLButtonElement>('.id-badge-flip');
        target?.focus({ preventScroll: true });
      }
    },
    setMusicLabel(message: string) {
      if (destroyed) return;
      if (trackLabel.textContent !== message) trackLabel.textContent = message;
      trackLabel.hidden = !message;
    },
    say(message: string) {
      if (!destroyed) {
        announcement.lang = /[가-힣]/.test(message) ? 'ko' : 'en';
        announcement.textContent = message;
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      abort.abort();
      intro.destroy();
      unsubscribe();
      if (dialog.open) dialog.close();
      badge.destroy();
      controls.destroy();
      root.remove();
    },
  };
}
