import type { StudioState } from './environment';
import type { PaperInteractionId } from './paper-types';
import { mountPaperTerminal } from './paper-terminal';
import { mountPaperDesk } from './paper-desk';
import './paper-scene.css';
import './paper-radio.css';

const asset = '/assets/paper/';
const objects: { id: PaperInteractionId; label: string; x: number; y: number; w: number; h: number }[] = [
  { id: 'lamp', label: '작은 램프를 켜고 끄기', x: 25, y: 36, w: 12, h: 24 },
  { id: 'monitor', label: '모니터에서 코딩 시작하기', x: 38, y: 41, w: 16, h: 14 },
  { id: 'cup', label: '차 한 잔의 여유', x: 52, y: 56, w: 5, h: 7 },
  { id: 'book', label: '책장을 펼쳐 보기', x: 57, y: 59, w: 7, h: 5 },
  { id: 'plant', label: '초록 친구에게 물 주기', x: 70, y: 38, w: 13, h: 29 },
  { id: 'curtain', label: '창가 커튼 열고 닫기', x: 76, y: 9, w: 4, h: 27 },
  { id: 'tree', label: '계절 장식에 작은 반짝임 더하기', x: 82, y: 46, w: 15, h: 36 },
  { id: 'weather', label: '창밖에 바람 불어넣기', x: 56, y: 17, w: 18, h: 17 },
  { id: 'calendar', label: '달력: 시간과 계절 바꾸기', x: 91.5, y: 37, w: 6, h: 12 },
  { id: 'music', label: '라디오: 잔잔한 음악 켜고 끄기', x: 63.5, y: 55.3, w: 6.5, h: 5.2 },
  { id: 'keyboard', label: '키보드로 코딩 시작하기', x: 40, y: 57.5, w: 10.5, h: 4.5 },
  { id: 'frame', label: '벽의 그림 바꾸기', x: 27.8, y: 22, w: 4.8, h: 12 },
  { id: 'bird', label: '창가에 새 부르기', x: 68, y: 28, w: 8, h: 13 },
  { id: 'lights', label: '벽 조명 켜고 끄기', x: 92.2, y: 28, w: 7, h: 10 },
  { id: 'shelf', label: '책장 속 작은 편지 찾기', x: 17, y: 29, w: 7, h: 15 },
  { id: 'globe', label: '지구본 속 여행 메모 찾기', x: 18, y: 34, w: 6, h: 10 },
  { id: 'pencils', label: '연필통에서 작은 아이디어 찾기', x: 54, y: 50, w: 4, h: 9 },
  { id: 'cat', label: '잠든 고양이 쓰다듬기', x: 62, y: 84, w: 10, h: 10 },
];

/** Layered licensed illustration assets are translated independently behind the
 * transparent window of the room. No canvas or WebGL runtime is required. */
export function mountPaperScene(container: HTMLElement, options: {
  state: StudioState; onAction: (id: PaperInteractionId) => void; onMessage?: (message: string) => void;
}) {
  const root = document.createElement('div');
  root.className = 'paper-world';
  root.innerHTML = `
    <div class="paper-theatre">
      <div class="paper-window">
        <div class="paper-sky"></div>
        <div class="paper-sun"></div><div class="paper-moon"></div>
        <div class="paper-shooting-star" aria-hidden="true"></div>
        <div class="paper-stars">${Array.from({ length: 24 }, (_, i) => `<i style="--sx:${(i * 37 + 7) % 97}%;--sy:${(i * 23 + 5) % 65}%;--delay:${i * .37}s"></i>`).join('')}</div>
        <div class="paper-landscape">
          <img class="landscape-layer land-far" src="${asset}landscape/valley-layer-05.webp" alt="" draggable="false"/>
          <img class="landscape-layer land-mid" src="${asset}landscape/valley-layer-04.webp" alt="" draggable="false"/>
          <img class="landscape-layer land-near" src="${asset}landscape/valley-layer-03.webp" alt="" draggable="false"/>
          <img class="landscape-layer land-meadow" src="${asset}landscape/valley-layer-02.webp" alt="" draggable="false"/>
          <img class="landscape-layer land-front" src="${asset}landscape/valley-layer-01.webp" alt="" draggable="false"/>
        </div>
        <div class="paper-snowcap"></div>
        <div class="paper-atmosphere"></div>
        <div class="paper-particles">${Array.from({ length: 36 }, (_, i) => `<i style="--x:${(i * 47 + 3) % 102}%;--duration:${9 + i % 9}s;--delay:-${i * 2.13}s;--drift:${(i % 5 - 2) * 16}px;--size:${2 + i % 4}px"></i>`).join('')}</div>
        <div class="paper-fireflies">${Array.from({ length: 13 }, (_, i) => `<i style="--x:${(i * 31 + 11) % 95}%;--y:${44 + (i * 19) % 49}%;--delay:-${i * .71}s"></i>`).join('')}</div>
        <div class="paper-curtain curtain-left"></div><div class="paper-curtain curtain-right"></div>
      </div>
      <img class="paper-interior" src="${asset}studio-interior-v1.webp" alt="종이 결이 살아 있는 작은 작업실. 책으로 가득한 선반, 나무 책상과 모니터, 아치형 창문, 초록 식물과 포근한 의자가 있습니다." draggable="false" fetchpriority="high"/>
      <div class="paper-room-tint"></div>
      <div class="paper-lamp-light"></div><div class="paper-lamp-pool"></div>
      <div class="paper-wall-light"></div>
      <div class="paper-screen" aria-hidden="true"><div class="screen-menubar"><i></i><i></i><i></i><span>little-things.ts</span></div><div class="screen-code"><b>const</b> littleThings = {<br/>&nbsp; learn: <em>'every day'</em>,<br/>&nbsp; build: <em>'with care'</em>,<br/>&nbsp; share: <em>'what matters'</em><br/>};<br/><span>// a little, every day.</span></div><img src="/assets/badge/jieun-mark.svg" alt=""/></div>
      <div class="paper-steam" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="plant-watering" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="seasonal-decor" aria-hidden="true"></div>
      <div class="paper-calendar" aria-hidden="true"><span class="calendar-month"></span><b class="calendar-day"></b><div class="calendar-rule"></div><small>Seoul</small></div>
      <div class="paper-radio" aria-hidden="true"><img src="${asset}decor/adapted/speaker.svg" alt=""/><i></i><span>♪</span><span>♫</span></div>
      <div class="paper-gallery" aria-hidden="true"></div>
      <img class="paper-bird" src="${asset}decor/studio-matched/sparrow.webp" alt="" draggable="false"/>
      <div class="paper-cat" aria-hidden="true"><img src="${asset}decor/studio-matched/sleeping-cat.webp" alt=""/><i>♥</i></div>
      <div class="shelf-letter" aria-hidden="true"><img src="/assets/badge/jieun-mark.svg" alt=""/><span>keep making<br/>little things.</span></div>
      <button class="paper-note" type="button" aria-label="Close the note" lang="en" inert tabindex="-1"><span class="paper-note-title"></span><span class="paper-note-body"></span><small></small><img src="/assets/badge/jieun-mark.svg" alt=""/></button>
      <div class="paper-pencil-spark" aria-hidden="true"><i>✦</i><i>·</i><i>✧</i><i>·</i></div>
      <div class="paper-grain" aria-hidden="true"></div>
      <div class="paper-hotspots">${objects.map(({ id, label, x, y, w, h }) => `<button type="button" class="paper-hotspot" data-object="${id}" aria-label="${label}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></button>`).join('')}</div>
    </div>
  `;
  container.append(root);
  const theatre = root.querySelector<HTMLElement>('.paper-theatre')!;
  const desk = mountPaperDesk(theatre);
  const terminal = mountPaperTerminal(root.querySelector<HTMLElement>('.screen-code')!, options.state, () => desk.strikeKey());
  const abort = new AbortController();
  let state = options.state;
  let active = true;
  let globeStep = 0;
  let pencilCount = 0;
  let currentSeason = '';
  let reactionTimer = 0;
  let noteTimer = 0;
  let frame = 0;
  let pointerX = 0, pointerY = 0, x = 0, y = 0;
  let festiveOn = true;
  let gallery = 0;
  let wallLightOverride: boolean | null = null;
  let birdTimer = 0;
  let shelfStep = 0;
  let bookStep = 0;
  let coffeeCount = 0;
  let catCount = 0;
  let secretStep = 0;
  const shelfMessages = ['keep making\nlittle things.', 'a small idea\nis still an idea.', 'less perfect.\nmore you.'];
  const bookNotes = [
    ['BETWEEN THE LINES', 'Some things grow\nwhile you take\na little break.', 'a note to myself'],
    ['WORK IN PROGRESS', 'Small steps.\nVery good coffee.\nA little courage.', 'save. breathe. repeat.'],
    ['DEVELOPER’S NOTE', 'It worked yesterday.\nLet’s make tea.', '// we’ll figure it out.'],
  ];
  function hideNote() {
    window.clearTimeout(noteTimer);
    root.classList.remove('note-open');
    const note = root.querySelector<HTMLElement>('.paper-note')!;
    note.inert = true;
    note.tabIndex = -1;
  }
  function showNote(title: string, body: string, footer: string) {
    const note = root.querySelector<HTMLElement>('.paper-note')!;
    note.querySelector('span')!.textContent = title;
    note.querySelector('.paper-note-body')!.textContent = body;
    note.querySelector('small')!.textContent = footer;
    root.classList.remove('note-open');
    void note.offsetWidth;
    root.classList.add('note-open');
    note.inert = false;
    note.tabIndex = 0;
    window.clearTimeout(noteTimer);
    noteTimer = window.setTimeout(hideNote, 10_000);
    return `${title}. ${body.replaceAll('\n', ' ')} ${footer}`;
  }
  const secretKeys = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  document.addEventListener('keydown', event => {
    if (!active) return;
    if (event.key === 'Escape') { hideNote(); return; }
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || root.closest('main')?.querySelector('dialog[open]')) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    secretStep = key === secretKeys[secretStep] ? secretStep + 1 : key === secretKeys[0] ? 1 : 0;
    if (secretStep === secretKeys.length) {
      secretStep = 0;
      options.onMessage?.(showNote('YOU FOUND A SECRET', 'Stay curious.\nGood things hide\nin little corners.', '↑ ↑ ↓ ↓ ← → ← → B A'));
    }
  }, { signal: abort.signal });
  const decor = root.querySelector<HTMLElement>('.seasonal-decor')!;

  const seasonArt = {
    spring: `<img class="decor-art spring-rose" src="${asset}decor/studio-matched/spring-flowers.webp" alt=""/><div class="paper-bunting">${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`,
    summer: `<div class="paper-summer-print">slow<br/><em>summer.</em></div>`,
    autumn: `<img class="decor-art autumn-pumpkin" src="${asset}decor/studio-matched/autumn-pumpkins.webp" alt=""/>`,
    winter: `<img class="decor-art winter-tree" src="${asset}decor/studio-matched/winter-tree.webp" alt=""/><img class="decor-art winter-wreath" src="${asset}decor/studio-matched/winter-wreath.webp" alt=""/><div class="paper-garland">${Array.from({ length: 18 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div><div class="paper-tree-lights">${Array.from({ length: 15 }, (_, i) => `<i style="left:${43 + Math.sin(i * 2.4) * (7 + i * 1.4)}%;top:${15 + i * 4.9}%;--i:${i}"></i>`).join('')}</div>`,
  };
  function settle() {
    frame = 0;
    x += (pointerX - x) * .095;
    y += (pointerY - y) * .095;
    root.style.setProperty('--look-x', x.toFixed(4));
    root.style.setProperty('--look-y', y.toFixed(4));
    if (Math.abs(x - pointerX) + Math.abs(y - pointerY) > .003) frame = requestAnimationFrame(settle);
  }
  function move(event: PointerEvent) {
    if (!active || !state.motionOn || event.pointerType === 'touch') return;
    const rect = root.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
    if (!frame) frame = requestAnimationFrame(settle);
  }
  root.addEventListener('pointermove', move, { signal: abort.signal });
  root.addEventListener('pointerleave', () => { pointerX = pointerY = 0; if (!frame) frame = requestAnimationFrame(settle); }, { signal: abort.signal });
  root.addEventListener('click', event => {
    if ((event.target as Element).closest('.paper-note')) { hideNote(); return; }
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-object]');
    if (button && !button.disabled) options.onAction(button.dataset.object as PaperInteractionId);
  }, { signal: abort.signal });
  function update(next: StudioState) {
    state = next;
    root.dataset.season = state.season;
    root.dataset.time = state.timeOfDay;
    root.dataset.lamp = String(state.lampOn);
    root.dataset.monitor = String(state.monitorOn);
    root.dataset.curtain = state.curtainOpen ? 'open' : 'closed';
    root.dataset.motion = state.motionOn && active ? 'on' : 'off';
    root.dataset.festive = String(festiveOn);
    root.dataset.music = String(state.soundOn);
    root.dataset.wallLight = String(wallLightOverride ?? ['evening', 'night'].includes(state.timeOfDay));
    root.querySelector('[data-object="music"]')!.setAttribute('aria-pressed', String(state.soundOn));
    root.querySelector<HTMLButtonElement>('[data-object="weather"]')!.disabled = !state.curtainOpen;
    root.querySelector<HTMLButtonElement>('[data-object="bird"]')!.disabled = !state.curtainOpen;
    for (const [id, value] of [['lamp', state.lampOn], ['curtain', state.curtainOpen]] as const) {
      root.querySelector(`[data-object="${id}"]`)!.setAttribute('aria-pressed', String(value));
    }
    if (currentSeason !== state.season) {
      currentSeason = state.season; decor.innerHTML = seasonArt[state.season];
      const bounds = { spring: [35, 52, 3.5, 8], summer: [28.3, 22.4, 4, 9.6], autumn: [35.2, 55.2, 4.2, 4.2], winter: [76.5, 45, 21, 47.3] }[state.season];
      const button = root.querySelector<HTMLElement>('[data-object="tree"]')!;
      Object.assign(button.style, { left: `${bounds[0]}%`, top: `${bounds[1]}%`, width: `${bounds[2]}%`, height: `${bounds[3]}%` });
      resize();
    }
    terminal.update({ ...state, monitorOn: active && state.monitorOn });
    if (!state.motionOn || !active) {
      cancelAnimationFrame(frame); frame = 0; x = y = pointerX = pointerY = 0;
      root.style.setProperty('--look-x', '0'); root.style.setProperty('--look-y', '0');
    }
  }
  function updateDate() {
    const now = new Date();
    root.querySelector('.calendar-month')!.textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'short' }).format(now);
    root.querySelector('.calendar-day')!.textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', day: 'numeric' }).format(now);
  }
  updateDate();
  const dateTimer = window.setInterval(updateDate, 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateDate(); }, { signal: abort.signal });
  update(state);
  function resize() {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    const width = Math.max(w, h * 1.5);
    const height = width / 1.5;
    const left = (w - width) / 2, top = (h - height) / 2;
    Object.assign(theatre.style, { width: `${width}px`, height: `${height}px`, left: `${left}px`, top: `${top}px`, right: 'auto', bottom: 'auto' });
    // Keep the physical paper calendar within reach when the room is cropped on a phone.
    const compact = w < 700 || left + width * .975 > w - 18 || top + height * .37 < 20;
    const calendarStyle = compact ? { left: `${(-left + w - 74) / width * 100}%`, top: `${(-top + 36) / height * 100}%`, width: `${56 / width * 100}%`, height: `${76 / height * 100}%` }
      : { left: '91.5%', top: '37%', width: '6%', height: '12%' };
    Object.assign(root.querySelector<HTMLElement>('.paper-calendar')!.style, calendarStyle);
    Object.assign(root.querySelector<HTMLElement>('[data-object="calendar"]')!.style, calendarStyle);
    for (const button of root.querySelectorAll<HTMLButtonElement>('.paper-hotspot')) {
      const bx = left + parseFloat(button.style.left) / 100 * width;
      const by = top + parseFloat(button.style.top) / 100 * height;
      const bw = parseFloat(button.style.width) / 100 * width;
      const bh = parseFloat(button.style.height) / 100 * height;
      // Cropped objects remain available in the calendar's accessible object list.
      button.tabIndex = bx + bw > 0 && bx < w && by + bh > 0 && by < h ? 0 : -1;
    }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(root); resize();
  return {
    update,
    setActive(nextActive: boolean) {
      active = nextActive;
      if (!active) {
        hideNote();
        secretStep = 0;
        window.clearTimeout(reactionTimer);
        window.clearTimeout(birdTimer);
        delete root.dataset.reaction;
        root.classList.remove('bird-visiting');
      }
      update(state);
      if (active) resize();
    },
    react(id: PaperInteractionId) {
      if (!active) return;
      let discoveredMessage: string | undefined;
      window.clearTimeout(reactionTimer);
      if (root.dataset.reaction === id) {
        delete root.dataset.reaction;
        // Restart a discovered reaction immediately on a repeated click.
        void root.offsetWidth;
      }
      root.dataset.reaction = id;
      if (id === 'tree' && state.season === 'winter') { festiveOn = !festiveOn; root.dataset.festive = String(festiveOn); }
      if (id === 'globe') {
        const places = [
          ['A POSTCARD FROM HERE', 'A little room.\nA very big world.', 'Seoul · 37.5665° N, 126.9780° E'],
          ['SOMEWHERE, SOMEDAY', 'Collect moments.\nLeave room for wonder.', 'next stop: wherever curiosity leads'],
          ['NO PLACE LIKE HOME', 'Sometimes the best trip\nis back to yourself.', 'you are here. that is enough.'],
        ];
        const note = places[globeStep++ % places.length];
        discoveredMessage = showNote(note[0], note[1], note[2]);
      }
      if (id === 'pencils' && ++pencilCount % 2 === 0) discoveredMessage = showNote('A TINY IDEA', 'What if…\nis a wonderful\nplace to start.', 'there is no undo button on paper. just another page.');
      if (id === 'weather' && state.timeOfDay === 'night') discoveredMessage = 'A shooting star. Make a little wish.';
      if (id === 'book') {
        const note = bookNotes[bookStep++ % bookNotes.length];
        discoveredMessage = showNote(note[0], note[1], note[2]);
      }
      if (id === 'cup') {
        desk.sip();
        if (++coffeeCount % 3 === 0) discoveredMessage = showNote('A LITTLE COFFEE BREAK', 'Good ideas\nneed little pauses.', 'refill your cup. take your time.');
      }
      if (id === 'cat' && ++catCount % 3 === 0) discoveredMessage = showNote('RESIDENT DEBUGGER', 'I caught a bug.\nThen I took a nap.', '— the studio cat');
      if (id === 'monitor' || id === 'keyboard') terminal.play();
      if (id === 'frame') {
        gallery = (gallery + 1) % 4;
        const frame = root.querySelector<HTMLElement>('.paper-gallery')!;
        frame.innerHTML = gallery === 0 ? '' : `<img src="${gallery === 1 ? `${asset}decor/studio-matched/spring-flowers.webp` : gallery === 2 ? `${asset}decor/studio-matched/sparrow.webp` : '/assets/badge/jieun-mark.svg'}" alt=""/>`;
        root.dataset.gallery = String(gallery);
      }
      if (id === 'bird') { root.classList.add('bird-visiting'); window.clearTimeout(birdTimer); birdTimer = window.setTimeout(() => root.classList.remove('bird-visiting'), 12000); }
      if (id === 'lights') { wallLightOverride = !(wallLightOverride ?? ['evening', 'night'].includes(state.timeOfDay)); root.dataset.wallLight = String(wallLightOverride); root.querySelector('[data-object="lights"]')!.setAttribute('aria-pressed', String(wallLightOverride)); }
      if (id === 'shelf') {
        shelfStep = (shelfStep + 1) % (shelfMessages.length + 1);
        if (shelfStep) {
          discoveredMessage = shelfMessages[shelfStep - 1];
          root.querySelector('.shelf-letter > span')!.textContent = discoveredMessage;
        }
        root.classList.toggle('shelf-open', shelfStep > 0);
      }
      reactionTimer = window.setTimeout(() => { delete root.dataset.reaction; }, 2600);
      return discoveredMessage;
    },
    destroy() { observer.disconnect(); abort.abort(); terminal.destroy(); desk.destroy(); cancelAnimationFrame(frame); window.clearInterval(dateTimer); window.clearTimeout(reactionTimer); window.clearTimeout(noteTimer); window.clearTimeout(birdTimer); root.remove(); },
  };
}
