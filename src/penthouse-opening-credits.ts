type OpeningCreditsHost = Pick<HTMLElement, 'dataset' | 'hidden'>;
type OpeningLetter = Pick<HTMLElement, 'dataset'>;
type OpeningPhase = 'waiting' | 'introducing' | 'typing' | 'holding' | 'fading' | 'done';
type OpeningCreditsOptions = {
  readonly isBlocked?: () => boolean;
  readonly isStill?: () => boolean;
};
type OpeningCreditsControl = (() => void) & { readonly resetIdle: () => void };
const TITLE = 'TAEWON SEO';
const IDLE_DELAY = 60000;
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'touchmove'] as const;

export function openingCreditsMarkup(): string {
  const words = TITLE.split(' ').map(word => `<span class="ph-opening-word">${Array.from(word, letter => `<span data-opening-letter data-visible="false">${letter}</span>`).join('')}</span>`);
  const title = words.join('<span data-opening-letter data-visible="false"> </span>');
  return `<div class="ph-opening-credits" aria-hidden="true" data-phase="waiting"><span class="ph-opening-eyebrow">A PERSONAL SPACE</span><span class="ph-opening-title">${title}</span></div>`;
}

export function mountOpeningCredits(
  element: OpeningCreditsHost,
  letterElements: Iterable<OpeningLetter>,
  options: OpeningCreditsOptions = {},
): OpeningCreditsControl {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const letters = Array.from(letterElements);
  let phase: OpeningPhase = 'waiting';
  let timer: number | undefined;
  let idleTimer: number | undefined;
  let remaining = 1000;
  let started = 0;
  let revealed = 0;
  let disposed = false;
  let replaying = false;
  let interrupted = false;
  for (const letter of letters) letter.dataset.visible = 'false';
  element.hidden = false;
  element.dataset.phase = phase;
  element.dataset.paused = String(document.hidden);
  const isStatic = () => motion.matches || options.isStill?.() === true;

  function clearIdle() {
    window.clearTimeout(idleTimer);
    idleTimer = undefined;
  }
  function armIdle() {
    clearIdle();
    if (disposed || document.hidden || phase !== 'done') return;
    idleTimer = window.setTimeout(() => {
      idleTimer = undefined;
      if (options.isBlocked?.()) { armIdle(); return; }
      replaying = true;
      interrupted = false;
      revealed = 0;
      for (const letter of letters) letter.dataset.visible = 'false';
      element.hidden = false;
      setPhase('waiting');
      schedule(0);
    }, IDLE_DELAY);
  }

  function pause() {
    if (timer === undefined) return;
    window.clearTimeout(timer);
    timer = undefined;
    remaining = Math.max(0, remaining - (window.performance.now() - started));
  }
  function schedule(delay = remaining) {
    remaining = delay;
    if (disposed || document.hidden || timer !== undefined) return;
    started = window.performance.now();
    timer = window.setTimeout(() => { timer = undefined; advance(); }, remaining);
  }
  function setPhase(next: OpeningPhase) {
    phase = next;
    element.dataset.phase = next;
  }
  function hold() {
    for (const letter of letters) letter.dataset.visible = 'true';
    element.dataset.static = String(isStatic());
    setPhase('holding');
    schedule(4200);
  }
  function typeLetter() {
    const letter = letters[revealed];
    if (letter) letter.dataset.visible = 'true';
    const delay = TITLE[revealed] === ' ' ? 480 : 220;
    revealed++;
    if (revealed === letters.length) hold();
    else schedule(delay);
  }
  function finish() {
    if (disposed) return;
    pause();
    setPhase('done');
    element.hidden = true;
    replaying = false;
    armIdle();
  }
  function interrupt() {
    if (interrupted || phase === 'done') return;
    interrupted = true;
    pause();
    if (document.hidden || isStatic() || phase === 'waiting') { finish(); return; }
    element.dataset.interrupted = 'true';
    setPhase('fading');
    schedule(360);
  }
  function activity() {
    if (disposed) return;
    if (replaying || options.isBlocked?.()) interrupt();
    else if (isStatic()) preference();
    armIdle();
  }
  function advance() {
    if (!interrupted && options.isBlocked?.()) { interrupt(); return; }
    switch (phase) {
      case 'waiting':
        delete element.dataset.interrupted;
        element.dataset.static = String(isStatic());
        if (isStatic()) hold();
        else { setPhase('introducing'); schedule(1000); }
        return;
      case 'introducing': setPhase('typing'); typeLetter(); return;
      case 'typing': typeLetter(); return;
      case 'holding':
        if (isStatic()) finish();
        else { setPhase('fading'); schedule(1600); }
        return;
      case 'fading': finish(); return;
      case 'done': return;
      default: {
        const unexpected: never = phase;
        throw new TypeError(`Unexpected opening phase: ${unexpected}`);
      }
    }
  }
  function visibility() {
    element.dataset.paused = String(document.hidden);
    clearIdle();
    if (document.hidden) {
      if (replaying || interrupted) finish();
      else pause();
    } else if (phase === 'done') armIdle();
    else schedule();
  }
  function preference() {
    if (!isStatic()) return;
    element.dataset.static = 'true';
    switch (phase) {
      case 'waiting':
      case 'introducing':
      case 'typing': pause(); hold(); return;
      case 'holding': return;
      case 'fading': finish(); return;
      case 'done': return;
      default: {
        const unexpected: never = phase;
        throw new TypeError(`Unexpected opening phase: ${unexpected}`);
      }
    }
  }
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener('change', preference);
  for (const type of ACTIVITY_EVENTS) document.addEventListener(type, activity, { capture: true, passive: true });
  schedule();
  return Object.assign(() => {
    disposed = true;
    pause();
    clearIdle();
    document.removeEventListener('visibilitychange', visibility);
    motion.removeEventListener('change', preference);
    for (const type of ACTIVITY_EVENTS) document.removeEventListener(type, activity, true);
    setPhase('done');
    element.hidden = true;
    delete element.dataset.paused;
    delete element.dataset.static;
    delete element.dataset.interrupted;
  }, { resetIdle: activity });
}
