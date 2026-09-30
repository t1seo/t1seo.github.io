import { type Season, type TimeOfDay, type StudioState, createEnvironment } from './environment.ts';
import './environment-controls.css';

type IconName = TimeOfDay | Season | 'motion' | 'still';
const iconPaths: Record<IconName, string> = {
  morning: '<path d="M3 17h18M5 13h2m10 0h2M12 3v2M5.6 6.6 7 8m11.4-1.4L17 8"/><path d="M8 13a4 4 0 0 1 8 0"/><path d="m10 21 2-2 2 2"/>',
  noon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  afternoon: '<circle cx="12" cy="10" r="4"/><path d="M12 1v2M3 10h2m14 0h2M5.6 3.6 7 5m11.4-1.4L17 5M3 18h18M7 22h10"/>',
  evening: '<path d="M3 16h18M5 12h2m10 0h2M5.6 5.6 7 7m11.4-1.4L17 7M8 12a4 4 0 0 1 8 0M12 1v2M7 20h10"/>',
  night: '<path d="M19.4 15.3A8 8 0 0 1 8.7 4.6 8 8 0 1 0 19.4 15.3Z"/><path d="m18 3 .6 1.8L20.5 5l-1.9.6L18 7.5l-.6-1.9-1.9-.6 1.9-.2L18 3Z"/>',
  spring: '<path d="M12 12c-7 0-7-7-3-7 0-5 6-5 6 0 4 0 4 7-3 7Z"/><path d="M12 12v9m0-4c-4 0-6-2-6-4 4 0 6 2 6 4m0 2c4 0 6-2 6-4-4 0-6 2-6 4"/>',
  summer: '<path d="M5 19c-2-9 4-15 14-14 1 10-5 16-14 14ZM5 19 15 9m-6 6h6m-6 0V9"/>',
  autumn: '<path d="m12 2 3 5 4-1-1 5 4 2-7 4v3H9v-3l-7-4 4-2-1-5 4 1 3-5Zm0 8v12"/>',
  winter: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M3.7 10.5l4.1-1.1-1.1-4.1M17.3 18.7l-1.1-4.1 4.1-1.1M6.7 18.7l1.1-4.1-4.1-1.1M20.3 10.5l-4.1-1.1 1.1-4.1"/>',
  motion: '<path d="M4 8h11a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M5 16h5a3 3 0 1 1-3 3"/>',
  still: '<path d="M9 5v14M15 5v14"/>',
};

function icon(name: IconName) {
  return `<svg class="env-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;
}

const timeOptions: { value: TimeOfDay; label: string; name: string }[] = [
  { value: 'morning', label: 'Morning', name: '아침' },
  { value: 'noon', label: 'Noon', name: '점심' },
  { value: 'afternoon', label: 'Afternoon', name: '오후' },
  { value: 'evening', label: 'Evening', name: '저녁' },
  { value: 'night', label: 'Night', name: '밤' },
];
const seasonOptions: { value: Season; label: string; name: string }[] = [
  { value: 'spring', label: 'Spring', name: '봄' },
  { value: 'summer', label: 'Summer', name: '여름' },
  { value: 'autumn', label: 'Autumn', name: '가을' },
  { value: 'winter', label: 'Winter', name: '겨울' },
];

export function mountEnvironmentControls(
  container: HTMLElement,
  environment: ReturnType<typeof createEnvironment>,
  options: { language?: 'ko' | 'en' } = {},
) {
  const english = options.language === 'en';
  const panel = document.createElement('section');
  panel.className = 'env-panel';
  panel.lang = english ? 'en' : 'ko';
  panel.setAttribute('aria-label', english ? 'Studio time and season settings' : '작업실 시간과 계절 설정');
  panel.innerHTML = `
    <div class="env-heading">
      <span class="env-heading-title"><span class="env-status-dot" aria-hidden="true"></span> ${english ? 'Time & season' : 'A little change of scenery'}</span>
      <button type="button" class="env-auto" data-env-auto aria-label="${english ? 'Automatic mode: current time and season in Seoul' : '자동 모드: 현재 한국 시간과 계절로 돌아가기'}" aria-pressed="true"><span class="env-auto-dot" aria-hidden="true"></span>Auto</button>
    </div>
    <div class="env-times" role="group" aria-label="${english ? 'Choose a time of day' : '시간대 선택'}">
      ${timeOptions.map(({ value, label, name }) => `<button type="button" class="env-time" data-env-time="${value}" aria-label="${english ? `${label} scenery` : `${name} 풍경`}" aria-pressed="false">${icon(value)}<span>${label}</span></button>`).join('')}
    </div>
    <div class="env-bottom">
      <div class="env-seasons" role="group" aria-label="${english ? 'Choose a season' : '계절 선택'}">
        ${seasonOptions.map(({ value, label, name }) => `<button type="button" class="env-season" data-env-season="${value}" aria-label="${english ? `${label} scenery` : `${name} 풍경`}" aria-pressed="false" title="${english ? label : name}">${icon(value)}<span>${label}</span></button>`).join('')}
      </div>
      <span class="env-divider" aria-hidden="true"></span>
      <button type="button" class="env-motion" data-env-motion aria-label="${english ? 'Room animation' : '작업실 움직임'}" aria-pressed="true" title="${english ? 'Pause animation' : '움직임 끄기'}">${icon('motion')}</button>
    </div>
    <span class="env-sr-only" data-env-status role="status" aria-live="polite"></span>
  `;
  container.append(panel);
  const timeButtons = panel.querySelectorAll<HTMLButtonElement>('[data-env-time]');
  const seasonButtons = panel.querySelectorAll<HTMLButtonElement>('[data-env-season]');
  const autoButton = panel.querySelector<HTMLButtonElement>('[data-env-auto]')!;
  const motionButton = panel.querySelector<HTMLButtonElement>('[data-env-motion]')!;
  const status = panel.querySelector<HTMLElement>('[data-env-status]')!;

  function render(state: StudioState) {
    for (const button of timeButtons) button.setAttribute('aria-pressed', String(button.dataset.envTime === state.timeOfDay));
    for (const button of seasonButtons) button.setAttribute('aria-pressed', String(button.dataset.envSeason === state.season));
    autoButton.setAttribute('aria-pressed', String(state.auto));
    motionButton.setAttribute('aria-pressed', String(state.motionOn));
    motionButton.setAttribute('aria-label', english
      ? state.motionOn ? 'Pause animation' : 'Resume animation'
      : state.motionOn ? '작업실 움직임 끄기' : '작업실 움직임 켜기');
    motionButton.title = english
      ? state.motionOn ? 'Pause animation' : 'Resume animation'
      : state.motionOn ? '움직임 끄기' : '움직임 켜기';
    motionButton.innerHTML = icon(state.motionOn ? 'motion' : 'still');
    const season = seasonOptions.find((option) => option.value === state.season)!;
    const time = timeOptions.find((option) => option.value === state.timeOfDay)!;
    const description = english
      ? `${state.auto ? 'Automatic mode: current time and season in Seoul' : 'Selected scenery'}. ${season.label}, ${time.label.toLowerCase()}.`
      : `${state.auto ? '한국 시간 자동 모드' : '직접 선택한 풍경'}, ${season.name} ${time.name}`;
    if (status.textContent !== description) status.textContent = description;
  }

  function onClick(event: MouseEvent) {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!target || !panel.contains(target)) return;
    if (target.dataset.envTime) environment.setTimeOfDay(target.dataset.envTime as TimeOfDay);
    else if (target.dataset.envSeason) environment.setSeason(target.dataset.envSeason as Season);
    else if (target.hasAttribute('data-env-auto')) environment.setAuto();
    else if (target.hasAttribute('data-env-motion')) environment.toggleMotion();
  }

  panel.addEventListener('click', onClick);
  const unsubscribe = environment.subscribe(render);
  return {
    destroy() {
      unsubscribe();
      panel.removeEventListener('click', onClick);
      panel.remove();
    },
  };
}
