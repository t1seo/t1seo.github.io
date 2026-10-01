import type { CyberMusicTrack } from './cyber-music-catalog.ts';

export type MusicSession = { close(): void };
export type MusicBookmark = {
  readonly track: CyberMusicTrack;
  readonly position: number;
  readonly enabled: boolean;
};
type MusicSessionPort = {
  readonly snapshot: () => MusicBookmark;
  readonly apply: (bookmark: MusicBookmark) => void;
};

/** Temporary listening owns one bookmark; explicit playback choices take priority. */
export function createMusicSession(port: MusicSessionPort) {
  let active: MusicSession | undefined;
  let chosenEnabled: boolean | undefined;
  let destroyed = false;
  return {
    begin(track: CyberMusicTrack): MusicSession {
      if (active) return active;
      if (destroyed) return { close() {} };
      const previous = port.snapshot();
      chosenEnabled = undefined;
      const session: MusicSession = { close() {
        if (active !== session || destroyed) return;
        active = undefined;
        const position = previous.track.id === track.id ? port.snapshot().position : previous.position;
        port.apply({ ...previous, position, enabled: chosenEnabled ?? previous.enabled });
        chosenEnabled = undefined;
      } };
      active = session;
      port.apply({ track, position: previous.track.id === track.id ? previous.position : 0, enabled: true });
      return session;
    },
    isActive: () => active !== undefined,
    chooseEnabled(value: boolean) { if (active) chosenEnabled = value; },
    destroy() { destroyed = true; active = undefined; },
  };
}
