type OpeningCreditsHost = Pick<HTMLElement, 'textContent' | 'dataset' | 'hidden'>;
type OpeningPhase = 'waiting' | 'typing' | 'holding' | 'fading' | 'done';
const TITLE = 'TAEWON SEO';

export function mountOpeningCredits(element: OpeningCreditsHost): () => void {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let phase: OpeningPhase = 'waiting';
  let timer: number | undefined;
  let remaining = 900;
  let started = 0;
  let letters = 0;
  let disposed = false;
  element.textContent = '';
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
    element.textContent = TITLE;
    setPhase('holding');
    schedule(3000);
  }
  function typeLetter() {
    letters++;
    element.textContent = TITLE.slice(0, letters);
    if (letters === TITLE.length) hold();
    else schedule(100);
  }
  function finish() {
    if (disposed) return;
    disposed = true;
    pause();
    document.removeEventListener('visibilitychange', visibility);
    motion.removeEventListener('change', preference);
    setPhase('done');
    element.hidden = true;
    element.textContent = '';
    delete element.dataset.paused;
  }
  function advance() {
    switch (phase) {
      case 'waiting':
        if (motion.matches) hold();
        else { setPhase('typing'); typeLetter(); }
        return;
      case 'typing': typeLetter(); return;
      case 'holding':
        if (motion.matches) finish();
        else { setPhase('fading'); schedule(1000); }
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
