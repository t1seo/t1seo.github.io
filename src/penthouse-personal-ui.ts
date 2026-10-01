import { createPersonalStorage, type PersonalSnapshot, type PersonalState } from './penthouse-personal-storage';

type PersonalActions = {
  readonly snapshot: () => PersonalSnapshot;
  readonly apply: (snapshot: PersonalSnapshot) => void;
};
const persistenceCopy = (where: PersonalState['persistence']) => where === 'browser' ? 'Saved in this browser.' : 'Browser storage is unavailable. Kept for this visit.';

export function mountPersonalTools(root: HTMLElement, actions: PersonalActions) {
  const store = createPersonalStorage();
  const abort = new AbortController();
  const status = (selector: string, text: string) => {
    const element = root.querySelector(selector);
    if (element) element.textContent = text;
  };
  function refreshPresets() {
    const list = root.querySelector('[data-preset-list]');
    if (!list) return;
    list.replaceChildren();
    for (const preset of store.getState().presets) {
      const row = document.createElement('div');
      row.className = 'ph-preset-row';
      for (const action of ['apply', 'delete'] as const) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = `preset-${action}`;
        button.dataset.presetId = preset.id;
        button.textContent = action === 'apply' ? preset.name : 'Delete';
        button.setAttribute('aria-label', `${action === 'apply' ? 'Apply' : 'Delete'} atmosphere ${preset.name}`);
        row.append(button);
      }
      list.append(row);
    }
  }
  function refresh() {
    const state = store.getState();
    const memo = root.querySelector<HTMLTextAreaElement>('[data-personal-memo]');
    if (memo) memo.value = state.memo;
    status('[data-memo-count]', `${state.memo.length.toLocaleString('en-US')} / 2,000`);
    status('[data-memo-status]', persistenceCopy(state.persistence));
    refreshPresets();
  }
  function saveMemo(text: string) {
    const result = store.saveMemo(text);
    status('[data-memo-count]', `${text.length.toLocaleString('en-US')} / 2,000`);
    status('[data-memo-status]', result.status === 'saved' ? persistenceCopy(result.persistence) : 'Keep your note within 2,000 characters.');
  }
  root.addEventListener('input', event => {
    if (event.target instanceof HTMLTextAreaElement && event.target.matches('[data-personal-memo]')) saveMemo(event.target.value);
  }, { signal: abort.signal });
  root.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>('[data-action]');
    const action = button?.dataset.action;
    if (action === 'memo-clear') {
      saveMemo('');
      const memo = root.querySelector<HTMLTextAreaElement>('[data-personal-memo]');
      if (memo) { memo.value = ''; memo.focus(); }
    } else if (action === 'preset-save') {
      const name = root.querySelector<HTMLInputElement>('[data-preset-name]');
      if (!name) return;
      const result = store.savePreset(name.value, actions.snapshot());
      if (result.status === 'saved') { name.value = ''; refreshPresets(); }
      status('[data-preset-status]', result.status === 'saved' ? persistenceCopy(result.persistence) : result.status === 'full' ? 'You have five atmospheres. Delete one to make room.' : 'Give this atmosphere a name, up to 40 characters.');
      if (result.status === 'invalid') name.focus();
    } else if (action === 'preset-apply') {
      const preset = store.getState().presets.find(item => item.id === button?.dataset.presetId);
      if (!preset) return;
      actions.apply(preset.snapshot);
      status('[data-preset-status]', `${preset.name} applied. Auto is paused.`);
    } else if (action === 'preset-delete') {
      const result = store.deletePreset(button?.dataset.presetId ?? '');
      if (result.status === 'deleted') {
        refreshPresets();
        status('[data-preset-status]', `Atmosphere deleted. ${persistenceCopy(result.persistence)}`);
        root.querySelector<HTMLInputElement>('[data-preset-name]')?.focus();
      }
    }
  }, { signal: abort.signal });
  return { refresh, destroy() { abort.abort(); } };
}
