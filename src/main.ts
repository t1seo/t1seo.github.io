import './style.css';
import { createEnvironment, type Season, type StudioState } from './environment';
import { mountEnvironmentControls } from './environment-controls';
import { mountBadge } from './badge';
import { mountProps } from './props';

const icon = (paths: string, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const arrowIcon = icon('<path d="M7 17 17 7M7 7h10v10"/>');
const sparkleIcon = icon('<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>');
const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="studio" aria-label="Jieun의 작은 작업실">
    <div class="scene-viewport">
      <div class="scene" id="scene" data-motion="on">
        <img class="room-art" src="/assets/studio/room.webp" alt="따뜻한 나무 책상과 큰 창문이 있는 아늑한 작업실" fetchpriority="high" draggable="false" />
        <div class="room-tint" aria-hidden="true"></div>
        <div class="sunlight" aria-hidden="true"></div>
        <div class="window-view" id="windowView">
          <div class="landscape landscape-spring" aria-hidden="true"></div>
          <div class="landscape landscape-summer" aria-hidden="true"></div>
          <div class="landscape landscape-autumn" aria-hidden="true"></div>
          <div class="landscape landscape-winter" aria-hidden="true"></div>
          <div class="sky-color" aria-hidden="true"></div>
          <div class="cloud cloud-one" aria-hidden="true"></div>
          <div class="cloud cloud-two" aria-hidden="true"></div>
          <div class="stars" id="stars" aria-hidden="true"></div>
          <div class="moon" aria-hidden="true"></div>
          <div class="lake-light" aria-hidden="true"></div>
          <div class="mist" aria-hidden="true"></div>
          <div class="ambient-particles" id="ambientParticles" aria-hidden="true"></div>
          <div class="secret-constellation" aria-hidden="true">
            <svg viewBox="0 0 220 100"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M26 30 48 14 74 20 89 43 77 67 50 74 28 57ZM131 30 155 14 182 20 196 43 184 67 157 74 135 57ZM89 43h42M75 89q37 16 73-1"/></g><g fill="currentColor"><circle cx="26" cy="30" r="2"/><circle cx="48" cy="14" r="2"/><circle cx="74" cy="20" r="2"/><circle cx="89" cy="43" r="2"/><circle cx="77" cy="67" r="2"/><circle cx="50" cy="74" r="2"/><circle cx="28" cy="57" r="2"/><circle cx="131" cy="30" r="2"/><circle cx="155" cy="14" r="2"/><circle cx="182" cy="20" r="2"/><circle cx="196" cy="43" r="2"/><circle cx="184" cy="67" r="2"/><circle cx="157" cy="74" r="2"/><circle cx="135" cy="57" r="2"/></g></svg>
          </div>
          <div class="window-reflection" aria-hidden="true"></div>
          <div class="season-surprise" id="seasonSurprise" aria-hidden="true"></div>
          <button class="window-touch object-control" id="windowTouch" aria-label="창밖의 숨은 반응 찾아보기"><span class="object-tip">창밖에도 작은 이야기가 있어요</span></button>
        </div>
        <div class="curtains" aria-hidden="true"><div class="curtain curtain-left"></div><div class="curtain curtain-right"></div></div>
        <button class="curtain-pull object-control" id="curtainPull" aria-label="커튼 닫기" aria-pressed="false"><span class="pull-cord"></span><span class="pull-bead"></span><span class="object-tip">커튼을 당겨보세요</span></button>
        <div class="lamp-light lamp-wall-light" aria-hidden="true"></div>
        <div class="lamp-light lamp-desk-light" aria-hidden="true"></div>
        <div class="monitor-light" aria-hidden="true"></div>
        <div class="props-layer" id="propsLayer"></div>
        <div class="badge-slot" id="badgeSlot"></div>
      </div>
    </div>

    <header class="site-header">
      <a class="wordmark" href="/" aria-label="Jieun의 작업실 처음으로"><img src="/favicon.svg" width="29" height="29" alt=""/><span>jieun.ai</span><span class="wordmark-note">a little place to build</span></a>
      <div class="header-right"><span class="local-time"><span class="live-dot"></span><span>SEOUL</span><time id="seoulClock"></time></span><button class="help-button" id="helpButton" aria-label="작업실 사용 안내 열기">${icon('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4M12 17h.01"/>')}</button></div>
    </header>

    <section class="introduction" aria-labelledby="pageTitle">
      <div class="eyebrow"><span></span> JIEUN JEON</div>
      <h1 id="pageTitle">Software<br/><em>Engineer.</em></h1>
      <p class="intro-description">배우고, 만들고, 나누는<br/>저의 작은 작업실에 오신 걸 환영해요.</p>
      <a class="learn-link" href="https://learn.jieun.ai" target="_blank" rel="noopener noreferrer">함께 배우기 ${arrowIcon}</a>
      <div class="intro-divider"></div>
      <p class="room-observation" id="roomObservation"></p>
    </section>

    <footer class="studio-footer">
      <div class="discovery"><button class="discover-button" id="discoverButton" aria-pressed="false">${sparkleIcon}<span>작은 것들을 발견해보세요</span></button><span class="discovery-note">램프, 커튼, 그리고 따뜻한 커피 한 잔.</span></div>
      <div class="environment-slot" id="environmentSlot"></div>
      <span class="footer-signature">Made of quiet moments<span>© ${new Date().getFullYear()} Jieun Jeon</span></span>
    </footer>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <dialog class="studio-dialog" id="helpDialog" aria-labelledby="helpTitle">
      <button class="dialog-close" id="closeHelp" aria-label="안내 닫기">${icon('<path d="m6 6 12 12M18 6 6 18"/>')}</button>
      <span class="dialog-eyebrow">WELCOME TO MY LITTLE STUDIO</span><h2 id="helpTitle">천천히 둘러보세요.</h2><p>조용한 방에도 작은 이야기들이 숨어 있어요.<br/>물건을 누르면 조금씩 달라집니다.</p>
      <ul class="discovery-list"><li><span>01</span><div><strong>스탠드</strong><p>따뜻한 불빛을 켜고 꺼보세요.</p></div></li><li><span>02</span><div><strong>커튼의 작은 끈</strong><p>창밖을 열어두거나, 포근하게 가려보세요.</p></div></li><li><span>03</span><div><strong>커피와 화분</strong><p>가볍게 건드리면 작은 반응이 생겨요.</p></div></li><li><span>04</span><div><strong>사원증</strong><p>잡아 흔들거나 눌러 뒤집을 수 있어요.</p></div></li><li><span>05</span><div><strong>창밖</strong><p>계절마다 다른 선물이 숨어 있어요.</p></div></li></ul>
      <div class="secret-hint">밤에 방의 불빛을 모두 끄면, 별이 더 잘 보여요.</div><p class="dialog-footnote">아래의 시간·계절 버튼으로 다른 순간도 구경해보세요.<br/>‘자동’을 누르면 지금 서울의 시간으로 돌아옵니다.</p>
    </dialog>
    <dialog class="studio-dialog notebook-dialog" id="notebookDialog" aria-labelledby="noteTitle"><button class="dialog-close" id="closeNote" aria-label="메모 닫기">${icon('<path d="m6 6 12 12M18 6 6 18"/>')}</button><span class="dialog-eyebrow">A NOTE FROM THE DESK</span><h2 id="noteTitle">매일 조금씩.</h2><p class="handwritten">배우고,<br/>작게 만들어보고,<br/>배운 것을 나누기.</p><div class="notebook-line"></div><a class="learn-link" href="https://learn.jieun.ai" target="_blank" rel="noopener noreferrer">AI와 함께 만드는 이야기 ${arrowIcon}</a></dialog>
  </main>`;

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const scene = byId('scene');
const windowView = byId('windowView');
const environment = createEnvironment();
const controls = mountEnvironmentControls(byId('environmentSlot'), environment);
const badge = mountBadge(byId('badgeSlot'));
const cleanups: Array<() => void> = [];
const timeouts = new Set<ReturnType<typeof setTimeout>>();
const later = (fn: () => void, ms: number) => { const id = setTimeout(() => { timeouts.delete(id); fn(); }, ms); timeouts.add(id); return id; };
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const notify = (message: string) => {
  if (toastTimer) { clearTimeout(toastTimer); timeouts.delete(toastTimer); }
  const toast = byId('toast'); toast.textContent = message; toast.classList.add('is-visible');
  toastTimer = later(() => toast.classList.remove('is-visible'), 3200);
};
const listen = (id: string, event: string, fn: EventListener) => {
  const element = byId(id); element.addEventListener(event, fn); cleanups.push(() => element.removeEventListener(event, fn));
};

const props = mountProps(byId('propsLayer'), { onAction(action) {
  const state = environment.getState();
  props.react(action);
  if (action === 'lamp') { environment.toggleLamp(); notify(state.lampOn ? '불빛을 잠시 쉬게 해주었어요.' : '책상 위에 따뜻한 빛이 내려앉았어요.'); }
  if (action === 'monitor') { environment.toggleMonitor(); notify(state.monitorOn ? '잠시 화면에서 눈을 떼어보세요.' : '다시, 작은 무언가를 만들 시간.'); }
  if (action === 'cup') notify(state.season === 'summer' ? '얼음이 달그락. 잠깐 쉬어가세요.' : '따뜻한 한 모금. 서두르지 않아도 괜찮아요.');
  if (action === 'plant') notify(state.season === 'spring' ? '작은 새잎이 나왔네요.' : '초록도 잠깐 기지개를 켰어요.');
  if (action === 'book') byId<HTMLDialogElement>('notebookDialog').showModal();
}});

const starContainer = byId('stars');
starContainer.innerHTML = Array.from({ length: 24 }, (_, i) => `<i style="left:${12 + (i * 37) % 83}%;top:${3 + (i * 19) % 32}%;--delay:${(i % 7) * -.8}s;--size:${i % 4 === 0 ? 2 : 1}px"></i>`).join('');

const seasonNames: Record<Season, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
const observations: Record<StudioState['timeOfDay'], string> = {
  morning: '아침 햇살과 함께, 천천히 시작하는 하루.', noon: '창밖에는 햇살이, 책상 위에는 작은 아이디어가.',
  afternoon: '햇살이 길어지는 오후. 오늘도 조금씩 만들어요.', evening: '하루가 저물고, 작은 불빛이 켜지는 시간.', night: '세상이 조용해지면, 작은 생각들이 선명해져요.'
};
const light = {
  morning: { room: .98, outside: .93, tint: '#f8dbac', tintOpacity: .16, sky: '#ffe2b3', skyOpacity: .18, sun: .28, rotation: '-24deg' },
  noon: { room: 1.04, outside: 1.02, tint: '#fff4db', tintOpacity: .02, sky: '#8cd3fc', skyOpacity: .03, sun: .12, rotation: '-6deg' },
  afternoon: { room: 1, outside: .94, tint: '#efb76d', tintOpacity: .12, sky: '#ffb96c', skyOpacity: .12, sun: .4, rotation: '15deg' },
  evening: { room: .62, outside: .65, tint: '#6e4263', tintOpacity: .22, sky: '#ea879c', skyOpacity: .43, sun: .13, rotation: '32deg' },
  night: { room: .27, outside: .22, tint: '#111d3d', tintOpacity: .38, sky: '#101c4d', skyOpacity: .45, sun: 0, rotation: '32deg' },
};
let lastSeason: Season | undefined;
let secretWasVisible = false;
const update = (state: StudioState) => {
  const preset = light[state.timeOfDay];
  scene.dataset.season = state.season; scene.dataset.time = state.timeOfDay;
  scene.dataset.lamp = String(state.lampOn); scene.dataset.monitor = String(state.monitorOn);
  scene.dataset.curtain = state.curtainOpen ? 'open' : 'closed'; scene.dataset.motion = state.motionOn ? 'on' : 'off';
  document.body.dataset.time = state.timeOfDay; document.body.dataset.season = state.season;
  document.body.dataset.motion = state.motionOn ? 'on' : 'off';
  scene.style.setProperty('--room-brightness', String(preset.room)); scene.style.setProperty('--outside-brightness', String(preset.outside));
  scene.style.setProperty('--tint', preset.tint); scene.style.setProperty('--tint-opacity', String(preset.tintOpacity));
  scene.style.setProperty('--sky-tint', preset.sky); scene.style.setProperty('--sky-opacity', String(preset.skyOpacity));
  scene.style.setProperty('--sun-opacity', String(state.curtainOpen ? preset.sun : 0)); scene.style.setProperty('--sun-angle', preset.rotation);
  const curtain = byId<HTMLButtonElement>('curtainPull'); curtain.setAttribute('aria-pressed', String(!state.curtainOpen));
  curtain.setAttribute('aria-label', state.curtainOpen ? '커튼 닫기' : '커튼 열기');
  byId('roomObservation').textContent = observations[state.timeOfDay];
  byId('windowTouch').setAttribute('aria-label', `${seasonNames[state.season]} 창밖의 숨은 반응 찾아보기`);
  const secret = state.timeOfDay === 'night' && !state.lampOn && !state.monitorOn && state.curtainOpen;
  scene.dataset.secret = String(secret);
  if (secret && !secretWasVisible) notify('불빛이 잦아드니, 익숙한 별자리가 보이네요.');
  secretWasVisible = secret;
  props.update(state);
  if (lastSeason !== state.season) { renderAmbient(state.season); byId('seasonSurprise').replaceChildren(); lastSeason = state.season; }
};

function renderAmbient(season: Season) {
  byId('ambientParticles').innerHTML = season === 'winter' ? Array.from({ length: 22 }, (_, i) => `<i class="snowflake" style="left:${(i * 47) % 100}%;--duration:${12 + i % 10}s;--delay:${-i * 1.9}s;--size:${2 + i % 3}px"></i>`).join('') : '';
}

let surpriseTimer: ReturnType<typeof setTimeout> | undefined;
const surprise = () => {
  const state = environment.getState(); const area = byId('seasonSurprise');
  if (!state.curtainOpen) return;
  if (surpriseTimer) { clearTimeout(surpriseTimer); timeouts.delete(surpriseTimer); }
  const messages = { spring: '바람에 꽃잎 몇 장이 날아왔어요.', summer: '숲 가장자리에서 작은 빛을 발견했어요.', autumn: '가을이 창가에 인사를 건네네요.', winter: '차가운 유리 위에 남긴 작은 인사.' };
  if (state.season === 'winter') area.innerHTML = `<svg class="frost-smile" viewBox="0 0 100 100"><circle cx="35" cy="38" r="3"/><circle cx="66" cy="38" r="3"/><path d="M29 58Q50 78 73 55" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`;
  else area.innerHTML = Array.from({ length: 14 }, (_, i) => `<i class="surprise-particle particle-${state.season}" style="left:${8 + i * 6}%;top:${state.season === 'summer' ? 50 + (i * 11) % 30 : -8 + (i * 7) % 22}%;--delay:${i * .12}s;--sway:${(i % 2 ? 1 : -1) * (35 + i * 6)}px;--rotation:${i * 27}deg"></i>`).join('');
  area.classList.remove('is-active'); void area.offsetWidth; area.classList.add('is-active');
  notify(messages[state.season]); surpriseTimer = later(() => { area.replaceChildren(); area.classList.remove('is-active'); }, 7000);
};

listen('windowTouch', 'click', surprise);
listen('curtainPull', 'click', () => { environment.toggleCurtain(); notify(environment.getState().curtainOpen ? '창밖을 조금 더 가까이.' : '지금은, 나만의 시간.'); });
listen('discoverButton', 'click', () => {
  const active = scene.dataset.discover !== 'true'; scene.dataset.discover = String(active);
  byId('discoverButton').setAttribute('aria-pressed', String(active));
  if (active) notify('은은하게 표시된 물건들을 눌러보세요.');
});
const wireDialog = (dialogId: string, closeId: string) => {
  const dialog = byId<HTMLDialogElement>(dialogId);
  listen(closeId, 'click', () => dialog.close());
  listen(dialogId, 'click', (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); const e = event as MouseEvent; if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close(); } });
};
wireDialog('helpDialog', 'closeHelp'); wireDialog('notebookDialog', 'closeNote');
listen('helpButton', 'click', () => byId<HTMLDialogElement>('helpDialog').showModal());
const updateClock = () => { byId('seoulClock').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); };
updateClock(); const clockInterval = setInterval(updateClock, 30_000);
const unsubscribe = environment.subscribe(update);

if (import.meta.hot) import.meta.hot.dispose(() => {
  unsubscribe(); environment.destroy(); controls.destroy(); badge.destroy(); props.destroy();
  clearInterval(clockInterval); timeouts.forEach(clearTimeout); cleanups.forEach(fn => fn());
});

// Tiny inspection surface for deterministic component integration checks, without personal data.
Object.defineProperty(window, '__studioState', { configurable: true, get: () => ({ ...environment.getState() }) });
windowView.addEventListener('dragstart', event => event.preventDefault());
