import type { CyberSound } from './cyber-sound.ts';
import { createRainAudio } from './cyber-rain-audio.ts';

export type CyberSoundMix = {
  readonly musicEnabled: boolean;
  readonly rainEnabled: boolean;
  readonly musicVolume: number;
  readonly rainVolume: number;
};
export type CyberSoundMixer = CyberSound & {
  getMix(): CyberSoundMix;
  /** Only pass activate=true from a user gesture. Restore without it cannot start either layer. */
  setMix(patch: Partial<CyberSoundMix>, activate?: boolean): Promise<CyberSoundMix>;
};
export type MixListener = (mix: CyberSoundMix, error: string | null) => void;
export function normalizeAudioVolume(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

export function createSoundMixer(music: CyberSound, onChange?: MixListener) {
  let musicVolume = .65;
  let rainVolume = .5;
  let destroyed = false;
  const rain = createRainAudio((_enabled, error) => publish(error));
  const getMix = (): CyberSoundMix => ({
    musicEnabled: music.isEnabled(), rainEnabled: rain.isEnabled(), musicVolume, rainVolume,
  });
  function publish(error: string | null = null): void {
    if (!destroyed) onChange?.(getMix(), error);
  }
  function setMusicVolume(value: number): void {
    musicVolume = normalizeAudioVolume(value, musicVolume);
    music.setMusicVolume(musicVolume);
  }
  const sound: CyberSoundMixer = {
    ...music,
    getMix,
    setMusicVolume(value): void { if (!destroyed) { setMusicVolume(value); publish(); } },
    async setMix(patch, activate = false): Promise<CyberSoundMix> {
      if (destroyed) return getMix();
      if (patch.musicVolume !== undefined) setMusicVolume(patch.musicVolume);
      if (patch.rainVolume !== undefined) {
        rainVolume = normalizeAudioVolume(patch.rainVolume, rainVolume);
        rain.setVolume(rainVolume);
      }
      const pending: Promise<unknown>[] = [];
      if (patch.musicEnabled !== undefined && (activate || !patch.musicEnabled) && patch.musicEnabled !== music.isEnabled()) {
        pending.push(music.setEnabled(patch.musicEnabled));
      }
      if (patch.rainEnabled !== undefined && (activate || !patch.rainEnabled) && patch.rainEnabled !== rain.isEnabled()) {
        pending.push(rain.setEnabled(patch.rainEnabled));
      }
      publish();
      await Promise.all(pending);
      return getMix();
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      rain.destroy();
      music.destroy();
    },
  };
  return { sound, publish };
}
