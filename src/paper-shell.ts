import { createEnvironment, type Season, type StudioState, type TimeOfDay } from './environment';
import { mountEnvironmentControls } from './environment-controls';
import { mountBadge } from './badge';
import type { InteractionId } from './world/types';
import './paper-shell.css';

const seasonNames: Record<Season, string> = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };
const timeNames: Record<TimeOfDay, string> = { morning: 'Morning', noon: 'Noon', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' };
const seasonDescriptions: Record<Season, string> = {
  spring: '창가에 봄을 들이는 중',
  summer: '초록이 가장 짙은 계절',
  autumn: '따뜻한 차와 느린 오후',
  winter: '작업실에도 크리스마스',
};

const objectOptions: { id: InteractionId; label: string; hint: string; path: string }[] = [
  { id: 'lamp', label: '스탠드', hint: '불을 켜거나 끄기', path: '<path d="m8 4-4 9h16l-4-9ZM12 13v7m-4 0h8"/>' },
  { id: 'monitor', label: '모니터', hint: '화면을 켜거나 끄기', path: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4m-4 0h8"/>' },
  { id: 'curtain', label: '커튼', hint: '창을 열거나 가리기', path: '<path d="M3 3h18M5 4v17h5V4m4 0v17h5V4M7 4v11m10-11v11"/>' },
  { id: 'cup', label: '찻잔', hint: '따뜻한 차 한 모금', path: '<path d="M4 8h13v6a6 6 0 0 1-12 0V8m12 1h2a3 3 0 0 1 0 6h-2M8 3v2m5-2v2M3 21h16"/>' },
  { id: 'plant', label: '화분', hint: '초록 친구에게 물 주기', path: '<path d="m7 15 1 6h8l1-6ZM12 15V8m0 2C7 10 4 7 5 3c5 0 7 3 7 7Zm0 3c0-5 3-7 7-7 0 4-2 7-7 7Z"/>' },
  { id: 'book', label: '책', hint: '책 한 권 펼쳐 보기', path: '<path d="M12 5v16m0-16C9 3 6 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z"/>' },
  { id: 'tree', label: '계절 장식', hint: '계절의 작은 변화 찾기', path: '<path d="m12 2 5 6h-3l6 7h-5l5 5H4l5-5H4l6-7H7ZM12 20v2"/>' },
  { id: 'weather', label: '창밖', hint: '창밖에 바람 불어넣기', path: '<path d="M6 15a4 4 0 1 1 1-8 5 5 0 0 1 9 2 3 3 0 1 1 2 6ZM7 18l-1 3m6-3-1 3m6-3-1 3"/>' },
];

function objectIcon(path: string) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

/** The room is mounted separately so artwork and navigation remain independent. */
export function mountPaperShell(
  app: HTMLElement,
  environment: ReturnType<typeof createEnvironment>,
  onAction: (id: InteractionId) => void,
) {
  const root = document.createElement('div');
  root.className = 'paper-shell';
  root.dataset.motion = environment.getState().motionOn ? 'on' : 'off';
  root.innerHTML = `
    <a class="paper-skip" href="#paper-room-tools">작업실 조작으로 건너뛰기</a>
    <header class="paper-header">
      <a class="paper-brand" href="/" aria-label="jieun.ai 홈"><img src="/assets/badge/jieun-mark.svg" alt="" width="25" height="25" /><span>jieun.ai</span></a>
      <span class="paper-header-note">A small corner of the internet.</span>
      <a class="paper-class-link" href="https://learn.jieun.ai" target="_blank" rel="noopener noreferrer">AI Class <span aria-hidden="true">↗</span></a>
    </header>
    <main class="paper-main">
      <aside class="paper-person" aria-labelledby="paper-person-name">
        <div class="paper-person-intro">
          <p class="paper-eyebrow">THE PERSON BEHIND THE DESK</p>
          <h1 id="paper-person-name">Jieun Jeon<span aria-hidden="true">.</span></h1>
          <p class="paper-role">Software Engineer</p>
          <p class="paper-introduction">배우고, 만들고, 나누는<br />저의 작은 작업실에 오신 걸 환영해요.</p>
        </div>
        <div class="paper-badge-wrap"><div class="paper-badge-mount"></div></div>
        <p class="paper-badge-caption"><span aria-hidden="true">↔</span> 사원증을 흔들고, 뒤집어 보세요.</p>
      </aside>
      <section class="paper-room" aria-label="계절과 시간이 흐르는 종이 작업실">
        <div class="paper-room-topline"><span><span class="paper-live-dot" aria-hidden="true"></span> JIEUN’S LITTLE STUDIO</span><span class="paper-room-edition" data-paper-season-note></span></div>
        <div class="paper-scene-frame"><div class="paper-scene-mount"></div><span class="paper-scene-corner" aria-hidden="true"></span></div>
        <div class="paper-room-caption"><span class="paper-caption-season" data-paper-current></span><span>머물고 싶은 계절을 골라 보세요.</span></div>
        <div class="paper-room-tools" id="paper-room-tools" tabindex="-1">
          <div class="paper-environment-mount"></div>
          <div class="paper-exploration">
            <button type="button" class="paper-explore-toggle" aria-expanded="false" aria-controls="paper-discoveries"><span class="paper-explore-mark" aria-hidden="true">✧</span><span>작은 발견들<small>방 안의 물건을 눌러 보세요</small></span><span class="paper-discovery-count" aria-label="발견한 물건 0개, 전체 8개">0 / 8</span><span class="paper-expand-icon" aria-hidden="true">+</span></button>
            <div class="paper-discoveries" id="paper-discoveries" hidden>
              <div class="paper-object-list" role="group" aria-label="작업실 물건 둘러보기">${objectOptions.map(({ id, label, hint, path }) => `<button type="button" class="paper-object" data-paper-object="${id}" aria-label="${label}: ${hint}"${['lamp', 'monitor', 'curtain'].includes(id) ? ' aria-pressed="false"' : ''} title="${hint}">${objectIcon(path)}<span>${label}</span><i aria-hidden="true"></i></button>`).join('')}</div>
              <p class="paper-discovery-help">화면 속 물건을 직접 누르거나, 위 버튼으로 둘러보실 수 있어요.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer class="paper-footer"><span>Learn. Build. Share.</span><span class="paper-footer-middle">A room for all seasons.</span><a href="/assets/paper/CREDITS.html" target="_blank" rel="noopener noreferrer">Art & credits <span aria-hidden="true">↗</span></a></footer>
    <div class="paper-toast" aria-hidden="true"><span class="paper-toast-mark">✧</span><span data-paper-toast-text></span></div>
    <div class="paper-announcement" role="status" aria-live="polite" aria-atomic="true"></div>
  `;
  app.append(root);
  const sceneMount = root.querySelector<HTMLElement>('.paper-scene-mount')!;
  const badge = mountBadge(root.querySelector<HTMLElement>('.paper-badge-mount')!);
  const controls = mountEnvironmentControls(root.querySelector<HTMLElement>('.paper-environment-mount')!, environment);
  const currentLabel = root.querySelector<HTMLElement>('[data-paper-current]')!;
  const seasonNote = root.querySelector<HTMLElement>('[data-paper-season-note]')!;
  const discoveryCount = root.querySelector<HTMLElement>('.paper-discovery-count')!;
  const exploreToggle = root.querySelector<HTMLButtonElement>('.paper-explore-toggle')!;
  const discoveries = root.querySelector<HTMLElement>('.paper-discoveries')!;
  const toast = root.querySelector<HTMLElement>('.paper-toast')!;
  const toastText = root.querySelector<HTMLElement>('[data-paper-toast-text]')!;
  const announcement = root.querySelector<HTMLElement>('.paper-announcement')!;
  const objectButtons = root.querySelectorAll<HTMLButtonElement>('[data-paper-object]');
  const discovered = new Set<InteractionId>();
  const abort = new AbortController();
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  const mobile = window.matchMedia('(max-width: 760px)');
  const main = root.querySelector<HTMLElement>('.paper-main')!;
  const person = root.querySelector<HTMLElement>('.paper-person')!;
  const room = root.querySelector<HTMLElement>('.paper-room')!;
  const orderRegions = () => {
    const first = mobile.matches ? room : person;
    if (main.firstElementChild !== first) main.prepend(first);
  };
  orderRegions();
  mobile.addEventListener('change', orderRegions, { signal: abort.signal });

  // Use readable Korean labels without altering the reusable controller's semantics.
  const koreanTimes = ['아침', '점심', '오후', '저녁', '밤'];
  const koreanSeasons = ['봄', '여름', '가을', '겨울'];
  root.querySelectorAll('.env-time > span').forEach((label, index) => { label.textContent = koreanTimes[index]; });
  root.querySelectorAll('.env-season > span').forEach((label, index) => { label.textContent = koreanSeasons[index]; });
  root.querySelector<HTMLElement>('.env-heading-title')!.innerHTML = '<span class="env-status-dot" aria-hidden="true"></span> 시간과 계절';

  function render(state: StudioState) {
    root.dataset.season = state.season;
    root.dataset.time = state.timeOfDay;
    root.dataset.motion = state.motionOn ? 'on' : 'off';
    currentLabel.textContent = `${seasonNames[state.season]} / ${timeNames[state.timeOfDay]}`;
    seasonNote.textContent = seasonDescriptions[state.season];
    for (const button of objectButtons) {
      const id = button.dataset.paperObject as InteractionId;
      if (id === 'lamp') button.setAttribute('aria-pressed', String(state.lampOn));
      if (id === 'monitor') button.setAttribute('aria-pressed', String(state.monitorOn));
      if (id === 'curtain') button.setAttribute('aria-pressed', String(state.curtainOpen));
      if (id === 'weather') {
        button.disabled = !state.curtainOpen;
        button.title = state.curtainOpen ? '창밖에 바람 불어넣기' : '커튼을 열면 바람을 불러올 수 있어요';
      }
    }
  }

  function setExpanded(expanded: boolean) {
    exploreToggle.setAttribute('aria-expanded', String(expanded));
    discoveries.hidden = !expanded;
  }

  exploreToggle.addEventListener('click', () => setExpanded(exploreToggle.getAttribute('aria-expanded') !== 'true'), { signal: abort.signal });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && exploreToggle.getAttribute('aria-expanded') === 'true') {
      setExpanded(false);
      exploreToggle.focus();
    }
  }, { signal: abort.signal });
  document.addEventListener('pointerdown', (event) => {
    if (event.target instanceof Node && !discoveries.contains(event.target) && !exploreToggle.contains(event.target)) setExpanded(false);
  }, { signal: abort.signal });
  root.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-paper-object]') : null;
    if (button && root.contains(button) && !button.disabled) onAction(button.dataset.paperObject as InteractionId);
  }, { signal: abort.signal });
  const unsubscribe = environment.subscribe(render);

  return {
    sceneMount,
    say(message: string) {
      if (destroyed) return;
      clearTimeout(toastTimer);
      toastText.textContent = message;
      announcement.textContent = message;
      toast.classList.add('is-visible');
      toastTimer = setTimeout(() => { toast.classList.remove('is-visible'); }, 4400);
    },
    discover(id: InteractionId) {
      if (destroyed || discovered.has(id)) return;
      discovered.add(id);
      discoveryCount.textContent = `${discovered.size} / ${objectOptions.length}`;
      discoveryCount.setAttribute('aria-label', `발견한 물건 ${discovered.size}개, 전체 ${objectOptions.length}개`);
      root.querySelector<HTMLButtonElement>(`[data-paper-object="${id}"]`)?.classList.add('is-discovered');
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimeout(toastTimer);
      abort.abort();
      unsubscribe();
      badge.destroy();
      controls.destroy();
      root.remove();
    },
  };
}
