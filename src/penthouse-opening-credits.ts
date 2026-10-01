type OpeningCreditsHost = Pick<HTMLElement, 'dataset' | 'hidden'>;
type OpeningLetter = Pick<HTMLElement, 'dataset'>;
type OpeningPhase = 'waiting' | 'introducing' | 'typing' | 'holding' | 'fading' | 'done';
const TITLE = 'TAEWON SEO';

export function openingCreditsMarkup(): string {
  const words = TITLE.split(' ').map(word => `<span class="ph-opening-word">${Array.from(word, letter => `<span data-opening-letter data-visible="false">${letter}</span>`).join('')}</span>`);
  const title = words.join('<span data-opening-letter data-visible="false"> </span>');
  return `<div class="ph-opening-credits" aria-hidden="true" data-phase="waiting"><span class="ph-opening-eyebrow">A PERSONAL SPACE</span><span class="ph-opening-title">${title}</span></div>`;
}

export function mountOpeningCredits(element: OpeningCreditsHost, letterElements: Iterable<OpeningLetter>): () => void {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const letters = Array.from(letterElements);
  let phase: OpeningPhase = 'waiting';
  let timer: number | undefined;
  let remaining = 1000;
  let started = 0;
  let revealed = 0;
  let disposed = false;
  for (const letter of letters) letter.dataset.visible = 'false';
  element.hidden = false;
  element.dataset.phase = phase;
  element.dataset.paused = String(document.hidden);

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
    disposed = true;
    pause();
    document.removeEventListener('visibilitychange', visibility);
    motion.removeEventListener('change', preference);
    setPhase('done');
    element.hidden = true;
    delete element.dataset.paused;
  }
  function advance() {
    switch (phase) {
      case 'waiting':
        if (motion.matches) hold();
        else { setPhase('introducing'); schedule(1000); }
        return;
      case 'introducing': setPhase('typing'); typeLetter(); return;
      case 'typing': typeLetter(); return;
      case 'holding':
        if (motion.matches) finish();
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
    if (document.hidden) pause();
    else schedule();
  }
  function preference() {
    if (!motion.matches) return;
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
  schedule();
  return finish;
}
