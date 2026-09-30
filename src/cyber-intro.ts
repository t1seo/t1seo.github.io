export interface CyberIntro {
  /** False cancels the current reveal; the next true starts a fresh introduction. */
  setVisible(visible: boolean): void;
  destroy(): void;
}

const mounted = new WeakMap<HTMLElement, CyberIntro>();

/** A finite signature-like reveal. The full text always occupies its final space. */
export function mountCyberIntro(intro: HTMLElement): CyberIntro {
  const existing = mounted.get(intro);
  if (existing) return existing;

  const document = intro.ownerDocument;
  const heading = intro.querySelector<HTMLElement>('h1');
  const lines = [...intro.querySelectorAll<HTMLElement>('.night-title-line')];
  const copy = intro.querySelector<HTMLElement>('.night-intro-copy');
  if (!heading || !lines.length || !copy) return { setVisible() {}, destroy() {} };

  const media = document.defaultView!.matchMedia('(prefers-reduced-motion: reduce)');
  const savedLabel = heading.getAttribute('aria-label');
  const savedState = intro.getAttribute('data-type-state');
  const savedLines = lines.map(line => ({ line, nodes: [...line.childNodes], hidden: line.getAttribute('aria-hidden') }));
  const savedCopy = [...copy.childNodes];
  const glyphs: HTMLElement[] = [];
  const groups: HTMLElement[][] = [];
  const copyLines: HTMLElement[] = [];
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let caret: HTMLElement | undefined;
  let visible = true;
  let destroyed = false;
  let generation = 0;
  let complete = false;

  // A stable native heading name is read once, regardless of the decorative reveal.
  if (!savedLabel) heading.setAttribute('aria-label', lines.map(line => line.textContent).join(' '));
  for (const line of lines) {
    const text = line.textContent ?? '';
    const word = document.createElement('span');
    word.className = 'night-type-word';
    line.setAttribute('aria-hidden', 'true');
    const group: HTMLElement[] = [];
    for (const character of Array.from(text)) {
      const glyph = document.createElement('span');
      glyph.className = `night-type-glyph${character === '.' ? ' night-period' : ''}`;
      const ink = document.createElement('span');
      ink.className = 'night-type-ink';
      ink.textContent = character;
      glyph.append(ink);
      word.append(glyph);
      group.push(glyph);
      glyphs.push(glyph);
    }
    groups.push(group);
    line.replaceChildren(word);
  }

  // Keep the original paragraph in the accessibility tree; only its visual twin animates.
  const readable = document.createElement('span');
  readable.className = 'sr-only';
  readable.append(...savedCopy);
  const visual = document.createElement('span');
  visual.className = 'night-copy-visual';
  visual.setAttribute('aria-hidden', 'true');
  let copyLine = document.createElement('span');
  copyLine.className = 'night-copy-line';
  copyLines.push(copyLine);
  visual.append(copyLine);
  for (const node of savedCopy) {
    if (node.nodeName === 'BR') {
      copyLine = document.createElement('span');
      copyLine.className = 'night-copy-line';
      copyLines.push(copyLine);
      visual.append(copyLine);
    } else copyLine.append(node.cloneNode(true));
  }
  copy.replaceChildren(readable, visual);

  function moveCaret(next?: HTMLElement, position = 'after') {
    if (caret) delete caret.dataset.caret;
    caret = next;
    if (caret) caret.dataset.caret = position;
  }

  function cancel() {
    generation++;
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();
    moveCaret();
  }

  function finish() {
    cancel();
    glyphs.forEach(glyph => { glyph.dataset.revealed = 'true'; });
    copyLines.forEach(line => { line.dataset.revealed = 'true'; });
    intro.dataset.typeState = 'complete';
    complete = true;
  }

  function schedule(at: number, action: () => void) {
    const run = generation;
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!destroyed && visible && !document.hidden && generation === run) action();
    }, at);
    timers.add(timer);
  }

  function play() {
    cancel();
    if (media.matches) { finish(); return; }
    if (!visible || document.hidden) { intro.dataset.typeState = 'paused'; return; }
    complete = false;
    intro.dataset.typeState = 'typing';
    glyphs.forEach(glyph => { delete glyph.dataset.revealed; });
    copyLines.forEach(line => { delete line.dataset.revealed; });
    moveCaret(glyphs[0], 'before');

    // Slightly uneven keystrokes, a breath between names, and a deliberate final dot.
    const cadence = [105, 90, 115, 95, 110, 100];
    let at = 180;
    let index = 0;
    groups.forEach((group, lineIndex) => {
      if (lineIndex) at += 155;
      group.forEach(glyph => {
        if (glyph.textContent === '.') at += 65;
        schedule(at, () => { glyph.dataset.revealed = 'true'; moveCaret(glyph); });
        at += cadence[index++ % cadence.length];
      });
    });
    const nameEnd = at - cadence[(index - 1) % cadence.length];
    schedule(nameEnd + 250, () => moveCaret());
    copyLines.forEach((line, index) => {
      schedule(nameEnd + 130 + index * 120, () => { line.dataset.revealed = 'true'; });
    });
    schedule(nameEnd + 130 + (copyLines.length - 1) * 120 + 360, finish);
  }

  function onVisibility() {
    if (document.hidden) {
      cancel();
      if (!complete) intro.dataset.typeState = 'paused';
    } else if (visible && !complete) play();
  }

  function onMotion() {
    if (media.matches) finish();
    // Disabling reduced motion never erases text already on screen.
  }

  document.addEventListener('visibilitychange', onVisibility);
  media.addEventListener('change', onMotion);
  const controller: CyberIntro = {
    setVisible(next) {
      if (destroyed || next === visible) return;
      visible = next;
      if (visible) play();
      else { cancel(); intro.dataset.typeState = 'paused'; }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancel();
      document.removeEventListener('visibilitychange', onVisibility);
      media.removeEventListener('change', onMotion);
      for (const { line, nodes, hidden } of savedLines) {
        line.replaceChildren(...nodes);
        if (hidden === null) line.removeAttribute('aria-hidden'); else line.setAttribute('aria-hidden', hidden);
      }
      copy.replaceChildren(...savedCopy);
      if (savedLabel === null) heading.removeAttribute('aria-label'); else heading.setAttribute('aria-label', savedLabel);
      if (savedState === null) intro.removeAttribute('data-type-state'); else intro.setAttribute('data-type-state', savedState);
      mounted.delete(intro);
    },
  };
  mounted.set(intro, controller);
  play();
  return controller;
}
