import type { StudioState } from './environment';
import './paper-terminal.css';

type TerminalState = Pick<StudioState, 'motionOn' | 'monitorOn'>;

export interface PaperTerminal {
  play(): void;
  update(state: TerminalState): void;
  destroy(): void;
}

const SNIPPETS = [
  "const littleThings = {\n  learn: 'every day',\n  build: 'with care',\n  share: 'what matters'\n};\n// a little, every day.",
  "const today = {\n  start: 'slow mornings',\n  make: 'something good',\n  save: 'small joys'\n};\n// made with care.",
  "const weekend = {\n  coffee: 'always warm',\n  music: 'soft & slow',\n  plans: 'keep creating'\n};\n// room for a little joy.",
  "const home = {\n  light: 'golden hours',\n  view: 'a softer world',\n  heart: 'right here'\n};\n// this is a good place.",
] as const;

type Token = { text: string; tag?: 'b' | 'em' | 'span' };

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /('[^']*'|\/\/[^\n]*|\bconst\b)/g;
  let cursor = 0;
  for (const match of code.matchAll(pattern)) {
    const at = match.index;
    if (at > cursor) tokens.push({ text: code.slice(cursor, at) });
    const text = match[0];
    tokens.push({ text, tag: text.startsWith("'") ? 'em' : text.startsWith('//') ? 'span' : 'b' });
    cursor = at + text.length;
  }
  if (cursor < code.length) tokens.push({ text: code.slice(cursor) });
  return tokens;
}

/** Click-started, finite typing: state updates never start a new session. */
export function mountPaperTerminal(
  container: HTMLElement,
  initialState: TerminalState,
  onKeystroke?: () => void,
): PaperTerminal {
  const page = container.ownerDocument;
  const originalMarkup = container.innerHTML;
  const clock = () => performance.now();
  let state = { ...initialState };
  let currentCode: string = SNIPPETS[0];
  let tokens = tokenize(currentCode);
  let visibleCharacters = currentCode.length;
  let nextSnippet = 0;
  let playing = false;
  let disposed = false;
  let revision = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let nextAt = 0;
  let remainingDelay = 70;

  container.classList.add('paper-terminal');

  function canType() {
    return playing && !disposed && state.motionOn && state.monitorOn && !page.hidden;
  }

  function render() {
    const nodes: Node[] = [];
    let remaining = visibleCharacters;
    for (const token of tokens) {
      if (remaining <= 0) break;
      const text = token.text.slice(0, remaining);
      if (token.tag) {
        const element = page.createElement(token.tag);
        element.textContent = text;
        nodes.push(element);
      } else {
        nodes.push(page.createTextNode(text));
      }
      remaining -= text.length;
    }
    if (playing) {
      const caret = page.createElement('i');
      caret.className = 'paper-terminal-caret';
      caret.setAttribute('aria-hidden', 'true');
      nodes.push(caret);
    }
    container.dataset.terminal = playing ? (canType() ? 'typing' : 'paused') : 'idle';
    container.replaceChildren(...nodes);
  }

  function clearTimer(preserveDelay = false) {
    revision += 1;
    if (timeout !== undefined) {
      if (preserveDelay) remainingDelay = Math.max(0, nextAt - clock());
      clearTimeout(timeout);
      timeout = undefined;
    }
  }

  function delayAfter(character: string) {
    if (character === '\n') return 230;
    if (character === ',' || character === ';') return 150;
    if (character === '{' || character === '}') return 180;
    if (character === "'") return 75;
    return 34 + (visibleCharacters % 4) * 9;
  }

  function schedule() {
    if (!canType() || timeout !== undefined) return;
    const expectedRevision = revision;
    nextAt = clock() + remainingDelay;
    timeout = setTimeout(() => {
      if (disposed || expectedRevision !== revision) return;
      timeout = undefined;
      if (!canType()) return;
      visibleCharacters = Math.min(currentCode.length, visibleCharacters + 1);
      const typedCharacter = currentCode[visibleCharacters - 1];
      if (/\S/.test(typedCharacter)) {
        try { onKeystroke?.(); } catch { /* A decorative key effect must not interrupt typing. */ }
      }
      if (visibleCharacters === currentCode.length) playing = false;
      remainingDelay = delayAfter(typedCharacter);
      render();
      schedule();
    }, remainingDelay);
  }

  function reconcile() {
    if (!state.motionOn && playing) {
      clearTimer();
      visibleCharacters = currentCode.length;
      playing = false;
    } else if (!canType()) {
      clearTimer(true);
    }
    render();
    schedule();
  }

  function onVisibilityChange() {
    if (!disposed) reconcile();
  }
  page.addEventListener('visibilitychange', onVisibilityChange);
  render(); // The initial screen is complete and static. No timer is scheduled.

  return {
    play() {
      if (disposed) return;
      clearTimer();
      currentCode = SNIPPETS[nextSnippet];
      nextSnippet = (nextSnippet + 1) % SNIPPETS.length;
      tokens = tokenize(currentCode);
      remainingDelay = 70;
      visibleCharacters = state.motionOn ? 0 : currentCode.length;
      playing = state.motionOn;
      reconcile();
    },
    update(nextState) {
      if (disposed) return;
      state = { ...nextState };
      reconcile();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      playing = false;
      clearTimer();
      page.removeEventListener('visibilitychange', onVisibilityChange);
      container.classList.remove('paper-terminal');
      delete container.dataset.terminal;
      container.innerHTML = originalMarkup;
    },
  };
}
