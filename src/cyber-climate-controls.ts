import './cyber-climate-controls.css';
import { CYBER_SEASONS, CYBER_TIMES, CYBER_WEATHER } from './cyber-climate';
import type { ClimateState, CyberClimateController, LocalClimateInfo, Season, TimeOfDay, Weather } from './cyber-climate';

let panelSequence = 0;
const label = (value: string) => value[0].toUpperCase() + value.slice(1);

export interface CyberClimateControls {
  sync(state: ClimateState): void;
  destroy(): void;
}

/** Native radio groups provide arrow-key selection and one Tab stop per group. */
export function mountCyberClimateControls(host: HTMLElement, controller: CyberClimateController): CyberClimateControls {
  const id = `cyber-climate-${++panelSequence}`;
  const abort = new AbortController();
  let destroyed = false;
  const section = document.createElement('div');
  section.className = 'cyber-climate';

  const group = (kind: 'season' | 'time' | 'weather', title: string, choices: readonly string[]) => `
    <fieldset class="cyber-climate-group cyber-climate-group--${kind}">
      <legend>${title}</legend>
      <div class="cyber-climate-options">${choices.map(value => `
        <label class="cyber-climate-choice">
          <input type="radio" name="${id}-${kind}" value="${value}" data-climate-choice="${kind}" />
          <span>${label(value)}</span>
        </label>`).join('')}
      </div>
    </fieldset>`;

  section.innerHTML = `
    <div class="cyber-climate-auto-row">
      <div><span class="cyber-climate-auto-title">Follow your surroundings</span><span class="cyber-climate-auto-caption">Local date, time &amp; weather</span></div>
      <button class="cyber-climate-auto" type="button" role="switch" aria-label="Automatically follow your local time, season and weather" aria-checked="false"><span>Auto</span><i aria-hidden="true"></i></button>
    </div>
    <div class="cyber-climate-location">
      <p class="cyber-climate-location-clock"></p>
      <p class="cyber-climate-location-status" role="status" aria-live="polite"></p>
      <button class="cyber-climate-locate" type="button">Use my location</button>
    </div>
    ${group('time', 'Time of day', CYBER_TIMES)}
    ${group('season', 'Season', CYBER_SEASONS)}
    ${group('weather', 'Weather', CYBER_WEATHER)}
    <div class="cyber-climate-note">A manual choice pauses Auto. Location permission connects your local weather; without it, your device clock still works. Approximate coordinates are sent to <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> and are not saved by this site. Weather refreshes every 15 minutes.</div>`;
  host.append(section);

  const autoButton = section.querySelector<HTMLButtonElement>('.cyber-climate-auto')!;
  const locateButton = section.querySelector<HTMLButtonElement>('.cyber-climate-locate')!;
  const clock = section.querySelector<HTMLElement>('.cyber-climate-location-clock')!;
  const status = section.querySelector<HTMLElement>('.cyber-climate-location-status')!;
  const choices = [...section.querySelectorAll<HTMLInputElement>('input[data-climate-choice]')];

  function syncInfo(info: LocalClimateInfo) {
    if (destroyed) return;
    clock.textContent = `${info.timeZone.replaceAll('_', ' ')} · ${info.localDateTime}`;
    const automatic = controller.getState().auto;
    const messages: Record<LocalClimateInfo['status'], string> = {
      device: 'Following your device clock. Use your location for local weather and seasons.',
      locating: 'Finding your location… Please allow location access in your browser.',
      loading: 'Updating local weather…',
      live: 'Following local time, seasons and current weather.',
      denied: 'Location access is blocked. Allow it in your browser settings, then try again. Your device clock still works.',
      unavailable: 'Location or weather is unavailable. Your local clock still works; try again when connected.',
    };
    const message = automatic ? messages[info.status] : 'Manual atmosphere. Turn on Auto to follow your surroundings.';
    if (status.textContent !== message) status.textContent = message;
    locateButton.disabled = automatic && (info.status === 'locating' || info.status === 'loading');
    locateButton.textContent = locateButton.disabled ? 'Updating…'
      : info.status === 'live' && automatic ? 'Refresh local weather'
      : info.status === 'denied' || info.status === 'unavailable' ? 'Try location again' : 'Use my location';
  }

  function sync(state: ClimateState) {
    if (destroyed) return;
    autoButton.setAttribute('aria-checked', String(state.auto));
    for (const input of choices) {
      const kind = input.dataset.climateChoice as 'season' | 'time' | 'weather';
      input.checked = input.value === state[kind];
    }
    syncInfo(controller.getLocalInfo());
  }

  const unsubscribe = controller.subscribeLocalInfo(syncInfo);
  locateButton.addEventListener('click', () => { void controller.useLocation(); }, { signal: abort.signal });

  autoButton.addEventListener('click', () => {
    controller.setAuto(!controller.getState().auto);
    sync(controller.getState());
  }, { signal: abort.signal });

  section.addEventListener('change', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.checked) return;
    const kind = input.dataset.climateChoice;
    if (kind === 'season') controller.setSeason(input.value as Season);
    if (kind === 'time') controller.setTime(input.value as TimeOfDay);
    if (kind === 'weather') controller.setWeather(input.value as Weather);
    sync(controller.getState());
  }, { signal: abort.signal });

  sync(controller.getState());
  return {
    sync,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      abort.abort();
      unsubscribe();
      section.remove();
    },
  };
}
