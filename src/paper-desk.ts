import './paper-desk.css';

const svgNS = 'http://www.w3.org/2000/svg';

/** Small effects aligned to the existing 1536 × 1024 desk illustration.
 * The source cup, keyboard and room image never move or get duplicated. */
export function mountPaperDesk(theatre: HTMLElement): {
  sip(): void;
  strikeKey(): void;
  destroy(): void;
} {
  const world = theatre.closest<HTMLElement>('.paper-world') ?? theatre.parentElement;
  const root = document.createElement('div');
  root.className = 'paper-desk-fx';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <svg class="desk-aroma" viewBox="0 0 140 180" fill="none" focusable="false">
      <g class="desk-idle-steam">
        <path d="M70 173C55 154 86 148 74 128C66 114 76 107 79 94"/>
        <path d="M75 174C90 157 60 144 74 126C84 113 79 101 73 90"/>
        <path d="M67 172C56 162 64 150 67 143C74 129 59 121 66 109"/>
      </g>
      <g class="desk-sip-steam">
        <path d="M68 174C46 151 89 133 63 108C40 84 89 64 65 34"/>
        <path d="M73 174C96 153 48 126 79 105C107 84 61 65 85 35"/>
        <path d="M70 175C64 151 81 142 69 125C51 102 73 93 66 76C59 60 80 46 72 21"/>
      </g>
      <path class="desk-aroma-heart" d="M71 106C61 99 59 93 63 89C66 86 70 89 71 92C73 89 76 86 80 89C84 94 79 100 71 106Z"/>
      <g class="desk-cool-sip">
        <ellipse class="desk-cool-ripple" cx="70" cy="172" rx="18" ry="3.5"/>
        <path class="desk-cool-drop" d="M48 150C48 150 44 156 44 159A4 4 0 0 0 52 159C52 156 48 150 48 150Z"/>
        <path class="desk-cool-drop" d="M91 142C91 142 87 148 87 151A4 4 0 0 0 95 151C95 148 91 142 91 142Z"/>
        <path class="desk-cool-drop" d="M67 124C67 124 64 129 64 131A3 3 0 0 0 70 131C70 129 67 124 67 124Z"/>
      </g>
    </svg>
    <svg class="desk-keyboard-feedback" viewBox="0 0 150 26" fill="none" focusable="false"></svg>`;
  theatre.append(root);

  const keyLayer = root.querySelector<SVGSVGElement>('.desk-keyboard-feedback')!;
  const keys = Array.from({ length: 6 }, () => {
    const key = document.createElementNS(svgNS, 'rect');
    key.setAttribute('width', '6.5');
    key.setAttribute('height', '3.3');
    key.setAttribute('rx', '.65');
    key.style.opacity = '0';
    keyLayer.append(key);
    return key;
  });
  // Pick real keycap positions across the staggered rows, never the whole board.
  const keyRhythm = [
    [52, 5], [83, 9], [37, 13], [63, 9], [108, 13], [73, 17],
    [44, 9], [96, 5], [56, 13], [119, 9], [70, 17], [91, 13],
    [29, 9], [77, 5], [48, 13], [104, 9], [65, 17], [85, 13],
  ];
  let cursor = 0;
  let sipTimer: ReturnType<typeof setTimeout> | undefined;
  const keyTimers = new Map<SVGRectElement, ReturnType<typeof setTimeout>>();
  const keyAnimations = new Map<SVGRectElement, Animation>();
  let destroyed = false;
  const quiet = () => world?.dataset.motion === 'off';

  function clearKeys() {
    for (const animation of keyAnimations.values()) animation.cancel();
    keyAnimations.clear();
    for (const timer of keyTimers.values()) clearTimeout(timer);
    keyTimers.clear();
    for (const key of keys) key.style.opacity = '0';
  }

  function clearSip() {
    clearTimeout(sipTimer);
    sipTimer = undefined;
    root.removeAttribute('data-sip');
  }

  const observer = new MutationObserver(() => {
    if (quiet()) {
      clearKeys();
      clearSip();
    }
  });
  if (world) observer.observe(world, { attributes: true, attributeFilter: ['data-motion'] });

  return {
    sip() {
      if (destroyed) return;
      clearSip();
      // One composed response at a time; repeated clicks never accumulate steam.
      if (!quiet()) void root.offsetWidth;
      root.dataset.sip = quiet() ? 'still' : 'flow';
      sipTimer = setTimeout(clearSip, quiet() ? 850 : 3800);
    },
    strikeKey() {
      if (destroyed) return;
      const key = keys[cursor % keys.length];
      const [x, y] = keyRhythm[cursor % keyRhythm.length];
      cursor += 1;
      keyAnimations.get(key)?.cancel();
      keyAnimations.delete(key);
      clearTimeout(keyTimers.get(key));
      keyTimers.delete(key);
      key.setAttribute('x', String(x));
      key.setAttribute('y', String(y));
      key.style.opacity = '0';
      if (quiet() || typeof key.animate !== 'function') {
        key.style.opacity = '.6';
        keyTimers.set(key, setTimeout(() => {
          key.style.opacity = '0';
          keyTimers.delete(key);
        }, 120));
        return;
      }
      const animation = key.animate([
        { opacity: .1, transform: 'translateY(0)' },
        { opacity: .82, transform: 'translateY(.65px)', offset: .3 },
        { opacity: 0, transform: 'translateY(0)' },
      ], { duration: 180, easing: 'ease-out' });
      keyAnimations.set(key, animation);
      animation.onfinish = () => {
        if (keyAnimations.get(key) === animation) keyAnimations.delete(key);
      };
    },
    destroy() {
      destroyed = true;
      observer.disconnect();
      clearSip();
      clearKeys();
      root.remove();
    },
  };
}
