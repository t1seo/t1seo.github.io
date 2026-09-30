import './cyber-terminal.css';

export interface CyberTerminal {
  start(): void;
  setActive(active: boolean): void;
  destroy(): void;
}

const SNIPPETS = [
  {
    code: "import { skyline } from './city';\n\nconst lights = skyline.connect({\n  district: 'seoul',\n  mode: 'after-hours',\n});\nawait lights.sync();",
    output: '✓ city connected · 24 lights online',
  },
  {
    code: "const build = await studio.compile({\n  entry: 'night-shift.ts',\n  sourceMaps: true,\n});\n\nawait build.preview();\n// listening on localhost:3000",
    output: '✓ compiled · preview ready in 128ms',
  },
  {
    code: "const frame = await scene.render({\n  exposure: 0.7,\n  bloom: 0.2,\n  palette: 'midnight',\n});\n\nawait cache.put('/night', frame);",
    output: '✓ frame cached · all systems quiet',
  },
] as const;

type Phase = 'idle' | 'typing' | 'running' | 'complete';

/** A decorative editor. Only an explicit start() begins a finite session. */
export function mountCyberTerminal(host: HTMLElement): CyberTerminal {
  const page = host.ownerDocument;
  const view = page.defaultView;
  const reducedMotion = view?.matchMedia('(prefers-reduced-motion: reduce)');
  const originalNodes = [...host.childNodes];
  const originalAriaHidden = host.getAttribute('aria-hidden');
  const hadBaseClass = host.classList.contains('cyber-terminal');
  let active = true;
  let disposed = false;
  let phase: Phase = 'idle';
  let snippetIndex = 0;
  let nextSnippet = 0;
  let visibleCharacters: number = SNIPPETS[0].code.length;
  let revision = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let nextAt = 0;
  let remainingDelay = 20;

  host.classList.add('cyber-terminal');
  // The root monitor button supplies the accessible name and interaction.
  // Avoid announcing every decorative character while the editor is typing.
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = `
    <div class="cyber-terminal__surface">
      <div class="cyber-terminal__chrome">
        <span class="cyber-terminal__tab"><i></i>night-shift.ts</span>
        <span class="cyber-terminal__connection"><i></i><span>LOCAL</span></span>
      </div>
      <div class="cyber-terminal__editor"></div>
      <div class="cyber-terminal__console"><span class="cyber-terminal__prompt">›</span><span class="cyber-terminal__output">ready · click to run</span></div>
      <div class="cyber-terminal__status"><span>main*</span><span class="cyber-terminal__state">READY</span><span>TypeScript <i>UTF-8</i></span></div>
    </div>`;

  const editor = host.querySelector<HTMLDivElement>('.cyber-terminal__editor')!;
  const output = host.querySelector<HTMLSpanElement>('.cyber-terminal__output')!;
  const status = host.querySelector<HTMLSpanElement>('.cyber-terminal__state')!;
  let lines: { row: HTMLDivElement; code: HTMLElement; source: string }[] = [];

  const now = () => view?.performance.now() ?? performance.now();
  const isRunning = () => phase === 'typing' || phase === 'running';
  const canProgress = () => !disposed && active && !page.hidden && isRunning();

  function prepareLines() {
    lines = SNIPPETS[snippetIndex].code.split('\n').map((source, index) => {
      const row = page.createElement('div');
      row.className = 'cyber-terminal__line';
      const number = page.createElement('span');
      number.className = 'cyber-terminal__number';
      number.textContent = String(index + 1).padStart(2, '0');
      const code = page.createElement('code');
      code.className = 'cyber-terminal__code';
      row.append(number, code);
      return { row, code, source };
    });
    editor.replaceChildren(...lines.map(({ row }) => row));
  }

  function colorize(code: HTMLElement, source: string) {
    const tokens: Node[] = [];
    const pattern = /\/\/[^\n]*|'[^']*'?|\b(?:import|from|const|await|true)\b|\b\d+(?:\.\d+)?\b/g;
    let cursor = 0;
    for (const match of source.matchAll(pattern)) {
      if (match.index > cursor) tokens.push(page.createTextNode(source.slice(cursor, match.index)));
      const token = page.createElement('span');
      token.className = `cyber-terminal__${match[0].startsWith('//') ? 'comment' : match[0].startsWith("'") ? 'string' : /^\d/.test(match[0]) ? 'value' : 'keyword'}`;
      token.textContent = match[0];
      tokens.push(token);
      cursor = match.index + match[0].length;
    }
    if (cursor < source.length) tokens.push(page.createTextNode(source.slice(cursor)));
    code.replaceChildren(...tokens);
  }

  function render() {
    let remaining = visibleCharacters;
    const typing = phase === 'typing';
    for (const { row, code, source } of lines) {
      const currentLine = typing && remaining >= 0 && remaining <= source.length;
      colorize(code, source.slice(0, Math.max(0, remaining)));
      row.classList.toggle('cyber-terminal__line--current', currentLine);
      if (currentLine) {
        const caret = page.createElement('i');
        caret.className = 'cyber-terminal__caret';
        code.append(caret);
      }
      remaining -= source.length + 1;
    }
    host.classList.toggle('cyber-terminal--typing', canProgress());
    host.classList.toggle('cyber-terminal--complete', phase === 'complete');
    status.textContent = isRunning() && !canProgress() ? 'PAUSED' : phase === 'typing' ? 'EDITING' : phase === 'running' ? 'RUNNING' : 'READY';
    output.textContent = phase === 'complete' ? SNIPPETS[snippetIndex].output : phase === 'running' ? 'tsc --build · running…' : phase === 'typing' ? 'watching for changes…' : 'ready · click to run';
  }

  function clearTimer(preserveDelay = false) {
    revision += 1;
    if (timeout === undefined) return;
    if (preserveDelay) remainingDelay = Math.max(0, nextAt - now());
    clearTimeout(timeout);
    timeout = undefined;
  }

  function finish() {
    if (!isRunning() || disposed) return;
    clearTimer();
    visibleCharacters = SNIPPETS[snippetIndex].code.length;
    // Commit state before dispatch: a consumer may start another run immediately.
    phase = 'complete';
    render();
    const EventConstructor = view?.CustomEvent ?? CustomEvent;
    host.dispatchEvent(new EventConstructor('cyber:compiled', { bubbles: true }));
  }

  function schedule() {
    if (!canProgress() || timeout !== undefined) return;
    const expectedRevision = revision;
    nextAt = now() + remainingDelay;
    timeout = setTimeout(() => {
      if (disposed || revision !== expectedRevision) return;
      timeout = undefined;
      if (!canProgress()) return;
      if (phase === 'running') {
        finish();
        return;
      }
      visibleCharacters += 1;
      if (visibleCharacters >= SNIPPETS[snippetIndex].code.length) {
        phase = 'running';
        remainingDelay = 260;
      } else {
        remainingDelay = 20;
      }
      render();
      schedule();
    }, remainingDelay);
  }

  function reconcile() {
    if (disposed) return;
    if (isRunning() && reducedMotion?.matches) {
      finish();
      return;
    }
    if (!canProgress()) clearTimer(true);
    render();
    schedule();
  }

  page.addEventListener('visibilitychange', reconcile);
  reducedMotion?.addEventListener('change', reconcile);
  prepareLines();
  render();

  return {
    start() {
      if (disposed || !active || page.hidden) return;
      clearTimer();
      snippetIndex = nextSnippet;
      nextSnippet = (nextSnippet + 1) % SNIPPETS.length;
      visibleCharacters = 0;
      remainingDelay = 20;
      phase = 'typing';
      prepareLines();
      reconcile();
    },
    setActive(nextActive) {
      if (disposed || nextActive === active) return;
      active = nextActive;
      reconcile();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      clearTimer();
      page.removeEventListener('visibilitychange', reconcile);
      reducedMotion?.removeEventListener('change', reconcile);
      host.classList.remove('cyber-terminal--typing', 'cyber-terminal--complete');
      if (!hadBaseClass) host.classList.remove('cyber-terminal');
      if (originalAriaHidden === null) host.removeAttribute('aria-hidden');
      else host.setAttribute('aria-hidden', originalAriaHidden);
      host.replaceChildren(...originalNodes);
    },
  };
}
