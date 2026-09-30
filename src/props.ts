import type { StudioState } from './environment';
import './props.css';

type PropAction = 'lamp' | 'cup' | 'monitor' | 'plant' | 'book';
type PropsOptions = { onAction: (action: PropAction) => void };

let instanceCount = 0;

const lamp = (id: string) => `
  <svg viewBox="0 0 180 220" aria-hidden="true">
    <defs>
      <linearGradient id="${id}-shade" x1="0" y1="0" x2="1" y2=".7"><stop stop-color="#fffae8"/><stop offset=".45" stop-color="#e9dfbf"/><stop offset="1" stop-color="#b4a583"/></linearGradient>
      <linearGradient id="${id}-stem"><stop stop-color="#aa8460"/><stop offset=".38" stop-color="#e7cda0"/><stop offset=".65" stop-color="#cba572"/><stop offset="1" stop-color="#886849"/></linearGradient>
      <linearGradient id="${id}-base" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#ebe0c2"/><stop offset=".55" stop-color="#c5b598"/><stop offset="1" stop-color="#8e806a"/></linearGradient>
      <radialGradient id="${id}-warm"><stop stop-color="#fffbd8"/><stop offset=".65" stop-color="#ffd890"/><stop offset="1" stop-color="#eab860"/></radialGradient>
      <radialGradient id="${id}-pool"><stop stop-color="#ffe4a0" stop-opacity=".76"/><stop offset="1" stop-color="#ffe4a0" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="studio-prop-lamp-pool" cx="89" cy="184" rx="105" ry="32" fill="url(#${id}-pool)"/>
    <ellipse class="studio-prop-shadow" cx="96" cy="193" rx="63" ry="8"/>
    <path d="M125 187 Q155 188 173 194" fill="none" stroke="#66503e" stroke-width="2.3" opacity=".6"/>
    <path d="M48 183 Q49 173 87 170 Q122 170 131 181 L132 188 Q119 199 55 192 Q48 190 48 183Z" fill="url(#${id}-base)"/>
    <ellipse cx="89" cy="181" rx="42" ry="10" fill="#e1d5b7"/>
    <ellipse cx="90" cy="179" rx="25" ry="5" fill="#c8b899"/>
    <path d="M85 75 L96 75 L97 175 Q92 180 84 175Z" fill="url(#${id}-stem)"/>
    <path d="M87 79 L88 170" fill="none" stroke="#f4ddb4" stroke-width="1.2" opacity=".7"/>
    <path d="M24 91 C27 46 49 21 88 20 C128 19 151 46 157 91Z" fill="url(#${id}-shade)"/>
    <path d="M30 75 C37 45 57 27 82 25" fill="none" stroke="#fffcec" stroke-width="2" stroke-linecap="round" opacity=".75"/>
    <ellipse cx="90" cy="91" rx="67" ry="13" fill="#8c7956"/>
    <ellipse class="studio-prop-lamp-inner" cx="90" cy="90" rx="61" ry="9" fill="url(#${id}-warm)"/>
    <ellipse cx="90" cy="91" rx="67" ry="13" fill="none" stroke="#d4c4a0" stroke-width="2"/>
    <path d="M126 100 L126 129" stroke="#947d51" stroke-width="1.5"/><ellipse cx="126" cy="131" rx="2.5" ry="3.3" fill="#c5a466"/>
    <ellipse class="studio-prop-lamp-switch" cx="119" cy="182" rx="4" ry="2.3" fill="#8e7d5a"/>
  </svg>`;

const plant = (id: string) => `
  <svg viewBox="0 0 140 220" aria-hidden="true">
    <defs>
      <linearGradient id="${id}-pot" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#e9e2d2"/><stop offset=".4" stop-color="#f5eee0"/><stop offset="1" stop-color="#aba697"/></linearGradient>
      <linearGradient id="${id}-leaf"><stop class="studio-prop-leaf-light"/><stop offset="1" class="studio-prop-leaf-dark"/></linearGradient>
      <linearGradient id="${id}-young"><stop stop-color="#b1c680"/><stop offset="1" stop-color="#6f925c"/></linearGradient>
    </defs>
    <ellipse class="studio-prop-shadow" cx="72" cy="197" rx="42" ry="7"/>
    <ellipse cx="70" cy="191" rx="38" ry="8" fill="#a9987f"/><ellipse cx="70" cy="188" rx="38" ry="8" fill="#dfd6c5"/>
    <g class="studio-prop-foliage">
      <path d="M70 151 Q73 97 66 37 M69 126 Q51 105 37 86 M72 110 Q91 87 101 63 M70 139 Q97 129 109 107 M69 94 Q45 75 33 52" stroke="#637049" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M66 58 C43 41 54 18 70 7 C83 29 84 46 66 58Z" fill="url(#${id}-leaf)"/>
      <path d="M66 56 Q69 35 70 16" stroke="#c2cb96" stroke-width=".7" opacity=".5" fill="none"/>
      <path d="M39 84 C13 84 10 63 13 49 C37 50 49 62 39 84Z" fill="url(#${id}-leaf)"/>
      <path d="M37 80 Q22 65 16 54" stroke="#c2cb96" stroke-width=".8" opacity=".5" fill="none"/>
      <path d="M97 77 C87 52 102 36 124 36 C122 62 114 79 97 77Z" fill="url(#${id}-leaf)"/>
      <path d="M101 72 Q112 57 120 41" stroke="#c2cb96" stroke-width=".8" opacity=".5" fill="none"/>
      <path d="M52 111 C29 117 12 102 9 82 C31 78 49 89 52 111Z" fill="url(#${id}-leaf)"/>
      <path d="M48 108 Q29 93 15 87" stroke="#c2cb96" stroke-width=".8" opacity=".5" fill="none"/>
      <path d="M87 120 C87 94 108 87 129 92 C121 115 108 128 87 120Z" fill="url(#${id}-leaf)"/>
      <path d="M93 116 Q111 102 123 97" stroke="#c2cb96" stroke-width=".8" opacity=".5" fill="none"/>
      <path class="studio-prop-new-leaf" d="M72 93 Q60 72 77 60 Q88 78 72 93Z" fill="url(#${id}-young)"/>
    </g>
    <path d="M37 145 L103 145 L95 183 Q92 197 70 197 Q48 197 45 183Z" fill="url(#${id}-pot)"/>
    <ellipse cx="70" cy="145" rx="33" ry="10" fill="#d8cebc"/><ellipse cx="70" cy="145" rx="27" ry="6.5" fill="#705a40"/>
    <path d="M70 147 L70 134" stroke="#637049" stroke-width="3" stroke-linecap="round"/>
    <path d="M43 153 L49 181 Q51 188 58 191" stroke="#fff9ed" stroke-width="1.5" fill="none" opacity=".55"/>
    <g fill="#897d64" opacity=".22"><circle cx="55" cy="168" r=".8"/><circle cx="88" cy="157" r=".7"/><circle cx="60" cy="186" r=".7"/><circle cx="78" cy="181" r="1"/><circle cx="67" cy="160" r=".5"/><circle cx="90" cy="174" r=".8"/><circle cx="49" cy="157" r=".6"/></g>
  </svg>`;

const monitor = (id: string) => `
  <svg viewBox="0 0 420 290" aria-hidden="true">
    <defs>
      <linearGradient id="${id}-case" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#666460"/><stop offset=".1" stop-color="#333a3c"/><stop offset="1" stop-color="#1e2529"/></linearGradient>
      <linearGradient id="${id}-stand"><stop stop-color="#787e79"/><stop offset=".32" stop-color="#b8b9ad"/><stop offset="1" stop-color="#646c69"/></linearGradient>
      <linearGradient id="${id}-screen" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#223b41"/><stop offset="1" stop-color="#101f25"/></linearGradient>
      <linearGradient id="${id}-reflection" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9ecdd" stop-opacity=".1"/><stop offset=".55" stop-color="#d9ecdd" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}-keys" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e1dfcf"/><stop offset="1" stop-color="#aaa998"/></linearGradient>
      <pattern id="${id}-key-pattern" width="15" height="12" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="12" height="8" rx="2" fill="#eeebdd"/><path d="M3 10 H11" stroke="#949487" stroke-width=".7"/></pattern>
    </defs>
    <ellipse class="studio-prop-shadow" cx="210" cy="231" rx="140" ry="11"/>
    <path d="M188 170 L228 170 L235 222 L258 230 Q262 235 254 238 L162 238 Q154 234 162 230 L184 222Z" fill="url(#${id}-stand)"/>
    <path d="M183 227 L236 227 L252 232 L169 232Z" fill="#c1c1b6" opacity=".7"/>
    <path d="M37 9 Q36 2 46 2 L382 2 Q392 2 392 13 L391 188 Q391 198 380 198 L44 198 Q32 198 32 187Z" fill="#1b2224"/>
    <rect x="29" y="0" width="358" height="195" rx="12" fill="url(#${id}-case)" stroke="#9c9d8e" stroke-width=".8"/>
    <rect x="39" y="10" width="338" height="163" rx="4" fill="#132025"/>
    <g class="studio-prop-monitor-screen">
      <rect x="40" y="11" width="336" height="161" rx="3" fill="url(#${id}-screen)"/>
      <rect x="40" y="11" width="336" height="18" rx="3" fill="#314449"/>
      <g fill="#d5ddd0" opacity=".6"><circle cx="49" cy="20" r="2"/><circle cx="57" cy="20" r="2"/><circle cx="65" cy="20" r="2"/></g>
      <text x="83" y="23" fill="#bdcfc5" font-size="7" font-family="monospace" letter-spacing=".8">a little space to build</text>
      <path d="M222 35 V159" stroke="#b1cbbb" stroke-opacity=".12"/>
      <text x="55" y="48" fill="#c3cdb7" font-size="7" font-family="monospace">hello.ts</text>
      <path d="M55 56 H96" stroke="#c6ac79" stroke-width="1.5"/>
      <g stroke-linecap="round" stroke-width="4"><path d="M58 71 H81" stroke="#b2a9cf"/><path d="M90 71 H133" stroke="#e8bc84"/><path d="M142 71 H160" stroke="#a0c6b4"/><path d="M68 84 H99" stroke="#b6cfb5"/><path d="M108 84 H179" stroke="#dac694"/><path d="M68 97 H89" stroke="#b2a9cf"/><path d="M98 97 H156" stroke="#b6cfb5"/><path d="M78 110 H125" stroke="#e8bc84"/><path d="M134 110 H193" stroke="#92b8c6"/><path d="M68 123 H94" stroke="#b6cfb5"/><path d="M58 136 H70" stroke="#b2a9cf"/></g>
      <rect class="studio-prop-cursor" x="78" y="133" width="4" height="7" rx=".5" fill="#d4dcc7"/>
      <g transform="translate(254 64)">
        <path d="M12 5 Q37 7 49 -7 Q63 8 89 9 L94 38 Q96 75 54 79 Q11 77 8 43Z" fill="#809cf2"/>
        <circle cx="33" cy="34" r="16" fill="none" stroke="#26343a" stroke-width="4"/><circle cx="73" cy="34" r="16" fill="none" stroke="#26343a" stroke-width="4"/><path d="M49 33 H57 M39 60 Q53 70 70 59" fill="none" stroke="#26343a" stroke-width="4" stroke-linecap="round"/><circle cx="33" cy="34" r="4" fill="#26343a"/><circle cx="73" cy="34" r="4" fill="#26343a"/>
      </g>
      <text x="261" y="158" fill="#c0cfc0" font-size="7" font-family="monospace" letter-spacing="1.5">MAKE SOMETHING.</text>
    </g>
    <path d="M40 11 H376 V47 L40 146Z" fill="url(#${id}-reflection)"/>
    <circle class="studio-prop-monitor-led" cx="208" cy="184" r="2" fill="#b1c9a1"/>
    <path d="M84 245 L303 245 L324 266 Q326 270 321 271 L68 271 Q63 270 65 266Z" fill="#918e7c"/>
    <path d="M84 242 L303 242 L322 264 Q324 267 319 268 L70 268 Q65 267 68 263Z" fill="url(#${id}-keys)"/>
    <path d="M86 246 L300 246 L313 262 L76 262Z" fill="url(#${id}-key-pattern)"/>
    <path d="M151 261 H232" stroke="#eeeadd" stroke-width="5"/>
    <path d="M346 246 Q357 240 368 247 L377 264 Q378 272 363 273 Q349 273 348 267Z" fill="url(#${id}-keys)"/>
    <path d="M359 247 L362 256" stroke="#9d9b8a" stroke-width="1"/>
    <path d="M355 250 L357 256" stroke="#f7f3e5" stroke-width="1" opacity=".7"/>
  </svg>`;

const cup = (id: string) => `
  <svg viewBox="0 0 140 140" aria-hidden="true">
    <defs>
      <linearGradient id="${id}-mug"><stop stop-color="#e1e5ce"/><stop offset=".3" stop-color="#f5f1d9"/><stop offset="1" stop-color="#a6b096"/></linearGradient>
      <linearGradient id="${id}-glass"><stop stop-color="#f4f4df" stop-opacity=".76"/><stop offset=".45" stop-color="#cbe1dc" stop-opacity=".25"/><stop offset="1" stop-color="#f4f3dd" stop-opacity=".65"/></linearGradient>
      <linearGradient id="${id}-coffee" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8e6846"/><stop offset=".5" stop-color="#b58959"/><stop offset="1" stop-color="#d1ae78"/></linearGradient>
    </defs>
    <ellipse class="studio-prop-shadow" cx="69" cy="119" rx="51" ry="9"/>
    <ellipse cx="68" cy="114" rx="47" ry="9" fill="#947952"/><ellipse cx="68" cy="111" rx="47" ry="9" fill="#b7986c"/>
    <g class="studio-prop-hot-cup">
      <path d="M96 61 C129 56 131 98 98 101 L95 91 C115 92 119 68 98 73Z" fill="url(#${id}-mug)" stroke="#b7baa2" stroke-width="1"/>
      <path d="M32 57 L102 57 L99 99 Q96 116 67 116 Q37 116 35 101Z" fill="url(#${id}-mug)"/>
      <ellipse cx="67" cy="57" rx="35" ry="10" fill="#f5f1db"/><ellipse cx="67" cy="57" rx="29" ry="6.8" fill="#6f4d33"/>
      <path d="M42 56 Q67 48 88 56" fill="none" stroke="#ba8e5e" stroke-width="1.4"/>
      <path d="M39 68 L41 96 Q42 104 48 108" stroke="#fffcea" stroke-width="2" opacity=".55" fill="none" stroke-linecap="round"/>
      <path d="M62 87 Q66 81 70 87 Q74 81 77 87 Q81 92 70 99 Q59 92 62 87" fill="#9da990" opacity=".6"/>
      <g class="studio-prop-steam" fill="none" stroke="#fff5da" stroke-width="2.7" stroke-linecap="round"><path d="M53 43 C42 34 64 25 54 11"/><path d="M70 40 C59 29 79 19 69 3"/><path d="M85 42 C76 34 94 27 84 17"/></g>
    </g>
    <g class="studio-prop-iced-cup">
      <path d="M84 42 L91 5" stroke="#8b784e" stroke-width="4" stroke-linecap="round"/>
      <path d="M37 38 L101 38 L94 103 Q93 115 69 115 Q45 115 44 104Z" fill="url(#${id}-glass)" stroke="#e6eee1" stroke-width="1.2"/>
      <path d="M41 55 L97 55 L91 101 Q90 110 69 110 Q49 110 48 101Z" fill="url(#${id}-coffee)" opacity=".92"/>
      <ellipse cx="69" cy="56" rx="28" ry="7" fill="#8b6342"/>
      <g class="studio-prop-ice" fill="#e3eade" fill-opacity=".65" stroke="#eef5e9" stroke-width="1"><rect x="47" y="44" width="20" height="17" rx="4" transform="rotate(-12 57 52)"/><rect x="67" y="46" width="20" height="18" rx="4" transform="rotate(14 77 55)"/><rect x="57" y="63" width="20" height="18" rx="4" transform="rotate(12 67 72)"/></g>
      <ellipse cx="69" cy="38" rx="32" ry="8" fill="none" stroke="#f8f7e6" stroke-width="2"/>
      <path d="M45 48 L50 99" stroke="#fffdee" stroke-width="2.5" stroke-linecap="round" opacity=".75"/><path d="M94 50 L89 100" stroke="#edf0e0" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>
      <g fill="#f8f9e9" opacity=".65"><ellipse cx="52" cy="86" rx="1.6" ry="2.5"/><ellipse cx="89" cy="72" rx="1.8" ry="2.7"/><ellipse cx="85" cy="94" rx="1.2" ry="1.8"/><ellipse cx="46" cy="69" rx="1.3" ry="2"/></g>
    </g>
  </svg>`;

const books = (id: string) => `
  <svg viewBox="0 0 230 105" aria-hidden="true">
    <defs>
      <linearGradient id="${id}-pages" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e6d9b9"/><stop offset=".5" stop-color="#fbefd1"/><stop offset="1" stop-color="#caba9b"/></linearGradient>
      <linearGradient id="${id}-cover" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#849580"/><stop offset="1" stop-color="#596e5e"/></linearGradient>
    </defs>
    <ellipse class="studio-prop-shadow" cx="114" cy="86" rx="105" ry="10"/>
    <path d="M17 68 L174 60 L214 72 L209 89 L52 96 L15 81Z" fill="#9f664e"/>
    <path d="M20 68 L174 62 L209 74 L54 82Z" fill="#bd8466"/>
    <path d="M53 82 L207 74 L206 85 L54 92Z" fill="url(#${id}-pages)"/>
    <path d="M62 85 L198 78 M62 88 L198 82" stroke="#bdb092" stroke-width=".7"/>
    <g class="studio-prop-top-book">
      <path d="M30 42 L188 44 L205 57 L200 78 L37 76 L24 62Z" fill="#506456"/>
      <path d="M34 48 L188 49 L199 58 L196 73 L38 71 L30 62Z" fill="url(#${id}-pages)"/>
      <path d="M40 63 L191 65 M41 67 L191 69" stroke="#c8b999" stroke-width=".8"/>
      <path d="M29 39 L188 42 L206 56 L43 55 L24 43Z" fill="url(#${id}-cover)"/>
      <path d="M43 55 L206 56 L205 60 L41 59 L24 46 L24 42Z" fill="#526854"/>
      <path d="M48 44 L179 47" stroke="#c1c2a1" stroke-width=".7" opacity=".55"/>
      <text x="86" y="51" fill="#dcd8b5" font-family="Georgia, serif" font-size="7" letter-spacing="1.8" transform="rotate(1 90 50)">SMALL THINGS</text>
      <path class="studio-prop-bookmark" d="M154 60 L165 60 L165 89 L159 84 L153 89Z" fill="#d2aa6b"/>
    </g>
  </svg>`;

const initialLabels: Record<PropAction, string> = {
  lamp: '스탠드 불 켜기',
  cup: '머그잔에서 피어나는 김 보기',
  monitor: '모니터 화면 켜기',
  plant: '화분의 잎 살짝 흔들기',
  book: '책 속의 메모 펼치기',
};

/** Mounts the desk objects. All state changes belong to the scene controller. */
export function mountProps(container: HTMLElement, options: PropsOptions) {
  const instanceId = `studio-props-${++instanceCount}`;
  const layer = document.createElement('div');
  layer.className = 'studio-props';
  layer.dataset.motion = 'true';
  const illustrations: Record<PropAction, (id: string) => string> = {
    lamp, plant, monitor, cup, book: books,
  };
  const buttons = {} as Record<PropAction, HTMLButtonElement>;
  const listeners: Array<() => void> = [];
  const timers = new Map<PropAction, ReturnType<typeof setTimeout>>();
  let destroyed = false;

  (Object.keys(illustrations) as PropAction[]).forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `studio-prop studio-prop--${action}`;
    button.dataset.action = action;
    button.setAttribute('aria-label', initialLabels[action]);
    button.innerHTML = `${illustrations[action](`${instanceId}-${action}`)}<span class="studio-prop-label" aria-hidden="true">${initialLabels[action]}</span>`;
    const onClick = () => options.onAction(action);
    button.addEventListener('click', onClick);
    listeners.push(() => button.removeEventListener('click', onClick));
    buttons[action] = button;
    layer.append(button);
  });
  container.append(layer);

  const label = (action: PropAction, value: string) => {
    buttons[action].setAttribute('aria-label', value);
    const hint = buttons[action].querySelector('.studio-prop-label');
    if (hint) hint.textContent = value;
  };

  return {
    update(state: StudioState) {
      if (destroyed) return;
      layer.dataset.season = state.season;
      layer.dataset.time = state.timeOfDay;
      layer.dataset.motion = String(state.motionOn);
      layer.dataset.lamp = String(state.lampOn);
      layer.dataset.monitor = String(state.monitorOn);
      buttons.lamp.setAttribute('aria-pressed', String(state.lampOn));
      buttons.monitor.setAttribute('aria-pressed', String(state.monitorOn));
      label('lamp', state.lampOn ? '스탠드 불 끄기' : '스탠드 불 켜기');
      label('monitor', state.monitorOn ? '모니터 화면 끄기' : '모니터 화면 켜기');
      label('cup', state.season === 'summer' ? '아이스 음료의 얼음 흔들기' : '머그잔에서 피어나는 김 보기');
    },
    react(action: string) {
      if (destroyed || !Object.hasOwn(buttons, action)) return;
      const key = action as PropAction;
      const button = buttons[key];
      const previous = timers.get(key);
      if (previous !== undefined) clearTimeout(previous);
      button.classList.remove('is-reacting');
      // Restart an intentional reaction when an object is tapped again.
      void button.offsetWidth;
      button.classList.add('is-reacting');
      timers.set(key, setTimeout(() => {
        button.classList.remove('is-reacting');
        timers.delete(key);
      }, key === 'cup' ? 2400 : 1600));
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      listeners.forEach((remove) => remove());
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      layer.remove();
    },
  };
}
