import { createEnvironment, type StudioState } from './environment';
import { mountEnvironmentControls } from './environment-controls';
import { mountBadge } from './badge';
import type { InteractionId } from './world/types';
import './studio-v2.css';

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <main class="studio" data-motion="on">
    <div class="world" id="world"></div>
    <div class="world-shade" aria-hidden="true"></div>
    <div class="loading-scene" role="status"><span class="loading-ring"></span><b>Opening the studio</b><span>작업실의 불을 켜고 있어요.</span></div>
    <header class="studio-header">
      <a class="wordmark" href="/" aria-label="jieun.ai 홈"><img src="/assets/badge/jieun-mark.svg" alt=""/>jieun.ai<span>THE STUDIO</span></a>
      <nav aria-label="주 메뉴">
        <button id="badgeToggle" class="text-button" aria-expanded="true" aria-controls="badgeShelf">About me</button>
        <a class="class-link" href="https://learn.jieun.ai" target="_blank" rel="noopener noreferrer">AI Class ${arrow}</a>
      </nav>
    </header>
    <aside class="badge-shelf" id="badgeShelf" aria-label="지은의 사원증"><div id="badgeMount"></div></aside>
    <section class="studio-intro" aria-labelledby="name">
      <p class="eyebrow"><span></span> SOFTWARE ENGINEER · KOREA</p>
      <h1 id="name">A little place<br/>to <em>build.</em></h1>
      <p class="intro-byline">Jieun Jeon <span>—</span> 배우고, 만들고, 나눕니다.</p>
    </section>
    <div class="environment-dock" id="environmentDock"></div>
    <div class="room-tools">
      <div class="objects-panel" id="objectsPanel" hidden>
        <div class="objects-heading"><span>Make yourself at home.</span><small>물건을 눌러 보세요.</small></div>
        <div class="object-grid">
          <button data-action="lamp" aria-label="스탠드 조명 켜고 끄기">램프 <span>On / off</span></button>
          <button data-action="monitor" aria-label="모니터 켜고 끄기">모니터 <span>A little focus</span></button>
          <button data-action="curtain" aria-label="커튼 열고 닫기">커튼 <span>Let the light in</span></button>
          <button data-action="cup">오늘의 한 잔 <span>Take a break</span></button>
          <button data-action="plant">초록 친구 <span>A gentle hello</span></button>
          <button data-action="book">책 한 권 <span>One more page</span></button>
          <button data-action="tree">계절의 장식 <span>A little sparkle</span></button>
          <button data-action="weather">창밖의 호수 <span>Make a ripple</span></button>
        </div>
      </div>
      <div class="tool-row">
        <button class="icon-button" id="resetView" aria-label="처음 시점으로 돌아가기" title="처음 시점"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg></button>
        <button class="discover-button" id="objectsToggle" aria-controls="objectsPanel" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/></svg><span>Little discoveries</span><small id="discoveryCount">0 / 8</small></button>
      </div>
    </div>
    <footer class="studio-footer"><span id="sceneCaption">A room for every season.</span><span>Drag to look around <i>·</i> Click to discover</span></footer>
    <div class="object-tooltip" id="tooltip" role="tooltip" hidden></div>
    <div class="studio-toast" id="toast" role="status" aria-live="polite"></div>
    <div class="scene-error" hidden><h2>잠시 작업실을 열지 못했어요.</h2><p>브라우저의 그래픽 가속을 켠 뒤 다시 열어 주세요.</p><button onclick="location.reload()">다시 열기</button></div>
  </main>
`;
const studio = app.querySelector<HTMLElement>('.studio')!;
const tooltip = document.querySelector<HTMLElement>('#tooltip')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
const loading = document.querySelector<HTMLElement>('.loading-scene')!;
const errorPanel = document.querySelector<HTMLElement>('.scene-error')!;
const environment = createEnvironment();
const controls = mountEnvironmentControls(document.querySelector<HTMLElement>('#environmentDock')!, environment);
const badge = mountBadge(document.querySelector<HTMLElement>('#badgeMount')!);
const discovered = new Set<InteractionId>();
const abort = new AbortController();
let world: Awaited<ReturnType<typeof import('./world/renderer').mountWorld>> | undefined;
let toastTimer = 0;
function say(message: string) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 3200);
}
const seasons = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };
const times = { morning: 'Morning light', noon: 'High noon', afternoon: 'A slow afternoon', evening: 'The golden hour', night: 'After hours' };
const cupNotes = { spring: '꽃향기 같은 차 한 잔. 잠깐 쉬어 가세요.', summer: '얼음이 달그락. 시원한 여름의 한 잔입니다.', autumn: '따뜻한 커피 향이 퍼집니다.', winter: '마시멜로를 띄운 코코아. 겨울에는 이거죠.' };
function act(id: InteractionId) {
  const before = environment.getState();
  if (id === 'weather' && !before.curtainOpen) return;
  if (id === 'lamp') environment.toggleLamp();
  if (id === 'monitor') environment.toggleMonitor();
  if (id === 'curtain') environment.toggleCurtain();
  world?.react(id);
  discovered.add(id);
  document.querySelector('#discoveryCount')!.textContent = `${discovered.size} / 8`;
  const next = environment.getState();
  const notes: Record<InteractionId, string> = {
    lamp: next.lampOn ? '작은 불 하나로, 한결 포근해졌어요.' : '조명을 껐어요. 창밖의 빛을 느껴 보세요.',
    monitor: next.monitorOn ? '다시, 만들어 볼까요?' : '오늘은 잠깐 화면 밖을 바라보세요.',
    curtain: next.curtainOpen ? '창문 너머로 계절이 들어옵니다.' : '세상은 잠시 밖에 두고, 나만의 시간.',
    cup: cupNotes[next.season], plant: '초록 친구가 인사를 건넵니다.',
    book: '좋은 생각은, 책장을 넘기는 사이에.',
    tree: next.season === 'winter' ? 'Merry little Christmas. 작은 불빛을 바꿨어요.' : '겨울을 골라 보세요. 특별한 장식이 기다립니다.',
    weather: '호수 위로 작은 물결이 번집니다.',
  };
  say(notes[id]);
}
const unsubscribe = environment.subscribe((state: StudioState) => {
  studio.dataset.motion = state.motionOn ? 'on' : 'off';
  studio.dataset.time = state.timeOfDay;
  studio.dataset.season = state.season;
  document.querySelector('#sceneCaption')!.textContent = `${seasons[state.season]} · ${times[state.timeOfDay]}`;
  const weather = document.querySelector<HTMLButtonElement>('[data-action="weather"]')!;
  weather.disabled = !state.curtainOpen;
  for (const [id, value] of [['lamp', state.lampOn], ['monitor', state.monitorOn], ['curtain', state.curtainOpen]] as const) {
    document.querySelector(`[data-action="${id}"]`)!.setAttribute('aria-pressed', String(value));
  }
  world?.update(state);
});
document.querySelector('#badgeToggle')!.addEventListener('click', event => {
  const button = event.currentTarget as HTMLButtonElement;
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  document.querySelector<HTMLElement>('#badgeShelf')!.hidden = !open;
}, { signal: abort.signal });
const objectsToggle = document.querySelector<HTMLButtonElement>('#objectsToggle')!;
const objectsPanel = document.querySelector<HTMLElement>('#objectsPanel')!;
objectsToggle.addEventListener('click', () => {
  objectsPanel.hidden = !objectsPanel.hidden;
  objectsToggle.setAttribute('aria-expanded', String(!objectsPanel.hidden));
}, { signal: abort.signal });
objectsPanel.addEventListener('click', event => {
  const target = (event.target as Element).closest<HTMLButtonElement>('[data-action]');
  if (target) act(target.dataset.action as InteractionId);
}, { signal: abort.signal });
document.querySelector('#resetView')!.addEventListener('click', () => world?.home(), { signal: abort.signal });
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !objectsPanel.hidden) { objectsPanel.hidden = true; objectsToggle.setAttribute('aria-expanded', 'false'); objectsToggle.focus(); }
}, { signal: abort.signal });
document.addEventListener('pointerdown', event => {
  if (!(event.target as Element).closest('.room-tools')) { objectsPanel.hidden = true; objectsToggle.setAttribute('aria-expanded', 'false'); }
}, { signal: abort.signal });

function showError() { loading.hidden = true; errorPanel.hidden = false; }
async function start() {
  try {
    const { mountWorld } = await import('./world/renderer');
    world = mountWorld(document.querySelector<HTMLElement>('#world')!, {
      state: environment.getState(),
      onAction: act,
      onHover(label, x, y) {
        tooltip.hidden = !label;
        if (label) { tooltip.textContent = label; tooltip.style.left = `${Math.min(x + 16, window.innerWidth - 175)}px`; tooltip.style.top = `${Math.min(y + 18, window.innerHeight - 48)}px`; }
      },
      onReady() { studio.classList.add('ready'); window.setTimeout(() => { loading.hidden = true; }, 500); },
      onError: showError,
    });
    if (import.meta.env.DEV) Object.assign(window, { __studio: { environment, world } });
  } catch (error) { console.error('The studio could not initialize.', error); showError(); }
}
void start();
if (import.meta.hot) import.meta.hot.dispose(() => {
  abort.abort(); unsubscribe(); controls.destroy(); badge.destroy(); environment.destroy(); world?.destroy(); window.clearTimeout(toastTimer);
});
