import type { CyberSoundMix, CyberSoundMixer } from './cyber-sound';

export function mountSoundMixer(root: HTMLElement, sound: CyberSoundMixer) {
  const abort = new AbortController();
  function refresh(mix = sound.getMix(), error: string | null = null) {
    const rain = root.querySelector<HTMLInputElement>('[data-mix-rain]');
    if (rain) rain.checked = mix.rainEnabled;
    for (const layer of ['music', 'rain'] as const) {
      const percent = Math.round(mix[layer === 'music' ? 'musicVolume' : 'rainVolume'] * 100);
      const slider = root.querySelector<HTMLInputElement>(`[data-mix-volume="${layer}"]`);
      if (slider) slider.value = String(percent);
      const label = root.querySelector(`[data-volume-label="${layer}"]`);
      if (label) label.textContent = `${percent}%`;
    }
    const status = root.querySelector('[data-mix-status]');
    if (status) status.textContent = error ?? '';
  }
  function apply(patch: Partial<CyberSoundMix>) {
    void sound.setMix(patch, true).catch((error: unknown) => {
      refresh(sound.getMix(), 'Sound could not start. Please try again.');
      console.error('Room sound unavailable', error instanceof Error ? error.message : error);
    });
  }
  root.addEventListener('input', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const volume = input.dataset.mixVolume;
    if (volume !== 'music' && volume !== 'rain') return;
    const level = Number(input.value) / 100;
    if (!Number.isFinite(level) || level < 0 || level > 1) return;
    apply(volume === 'music' ? { musicVolume: level } : { rainVolume: level });
  }, { signal: abort.signal });
  root.addEventListener('change', event => {
    if (event.target instanceof HTMLInputElement && event.target.matches('[data-mix-rain]')) apply({ rainEnabled: event.target.checked });
  }, { signal: abort.signal });
  refresh();
  return { refresh, destroy() { abort.abort(); } };
}
