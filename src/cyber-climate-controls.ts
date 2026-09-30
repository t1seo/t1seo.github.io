import './cyber-climate-controls.css';
import { CYBER_SEASONS, CYBER_TIMES, CYBER_WEATHER } from './cyber-climate';
import type { ClimateState, CyberClimateController, Season, TimeOfDay, Weather } from './cyber-climate';

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
      <div><span class="cyber-climate-auto-title">Follow Seoul</span><span class="cyber-climate-auto-caption">The local hour &amp; season</span></div>
      <button class="cyber-climate-auto" type="button" role="switch" aria-label="Automatically follow Seoul's time and season" aria-checked="false"><span>Auto</span><i aria-hidden="true"></i></button>
    </div>
    ${group('time', 'Time of day', CYBER_TIMES)}
    ${group('season', 'Season', CYBER_SEASONS)}
    ${group('weather', 'Weather', CYBER_WEATHER)}
    <div class="cyber-climate-note">Choose a little change of atmosphere.<br />Weather is a scene setting, not a live forecast.</div>`;
  host.append(section);

  const autoButton = section.querySelector<HTMLButtonElement>('.cyber-climate-auto')!;
  const choices = [...section.querySelectorAll<HTMLInputElement>('input[data-climate-choice]')];

  function sync(state: ClimateState) {
    if (destroyed) return;
    autoButton.setAttribute('aria-checked', String(state.auto));
    for (const input of choices) {
      const kind = input.dataset.climateChoice as 'season' | 'time' | 'weather';
      input.checked = input.value === state[kind];
    }
  }

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
      section.remove();
    },
  };
}
