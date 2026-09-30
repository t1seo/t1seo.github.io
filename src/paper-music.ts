import type { StudioState } from './environment';
import { getPaperMusicTrack, type PaperMusicTrack } from './paper-music-catalog';

type Scene = Pick<StudioState, 'season' | 'timeOfDay'>;
type Deck = {
  audio: HTMLAudioElement;
  track?: PaperMusicTrack;
  removeError?: () => void;
};
type PendingPlay = { revision: number; deck: Deck; reject: (error: Error) => void };

const VOLUME = 0.24;

/** Two real recordings, loaded only after the listener explicitly enables music. */
export function createPaperMusic(initial: Scene, options: { onError?: (error: Error) => void } = {}) {
  let selected = getPaperMusicTrack(initial);
  const decks: Deck[] = [];
  let enabled = false;
  let destroyed = false;
  let revision = 0;
  let frame: number | undefined;
  let pending: PendingPlay | undefined;
  let starting: Promise<void> | undefined;
  const page = typeof document === 'undefined' ? undefined : document;

  function cancelFade() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  }

  function pauseAll() {
    cancelFade();
    for (const { audio } of decks) {
      audio.pause();
      audio.volume = 0;
    }
  }

  function invalidate() {
    revision += 1;
    cancelFade();
    // Settle callers even if a browser never settles an interrupted play request.
    pending?.reject(new Error('Music playback was superseded.'));
    pending = undefined;
    starting = undefined;
    return revision;
  }

  function fail(error: unknown, attempt: number, report: boolean): Error | undefined {
    if (destroyed || attempt !== revision || !enabled) return;
    const failure = error instanceof Error ? error : new Error('The music could not be played.');
    enabled = false;
    invalidate();
    pauseAll();
    if (report) {
      try { options.onError?.(failure); } catch { /* UI callbacks must not reject background playback work. */ }
    }
    return failure;
  }

  function fade(target: Deck | undefined, duration: number, attempt: number) {
    cancelFade();
    if (decks.length === 0) return;
    const volumes = decks.map(({ audio }) => audio.volume);
    const started = performance.now();
    const step = (now: number) => {
      if (destroyed || attempt !== revision || page?.hidden) return;
      const progress = Math.min(1, Math.max(0, (now - started) / duration));
      for (let index = 0; index < decks.length; index += 1) {
        const deck = decks[index];
        const destination = deck === target ? VOLUME : 0;
        deck.audio.volume = volumes[index] + (destination - volumes[index]) * progress;
      }
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        frame = undefined;
        for (const deck of decks) if (deck !== target) deck.audio.pause();
      }
    };
    frame = requestAnimationFrame(step);
  }

  function prepareDeck(): Deck {
    if (typeof Audio === 'undefined') throw new Error('Audio playback is unavailable in this browser.');
    while (decks.length < 2) {
      const audio = new Audio();
      audio.preload = 'none';
      audio.loop = true;
      audio.volume = 0;
      decks.push({ audio });
    }
    const existing = decks.find((deck) => deck.track?.id === selected.id);
    if (existing) {
      // A failed resource needs a fresh load to allow an explicit retry to recover.
      if (existing.audio.error) existing.audio.load();
      return existing;
    }
    // Keep the louder recording playing when a new scene interrupts a crossfade.
    const deck = [...decks].sort((left, right) => left.audio.volume - right.audio.volume)[0];
    deck.audio.pause();
    deck.audio.volume = 0;
    deck.removeError?.();
    deck.track = selected;
    const resource = selected;
    const onError = () => {
      if (destroyed || !enabled || page?.hidden || deck.track !== resource || selected.id !== resource.id) return;
      const mediaError = deck.audio.error;
      if (!mediaError) return;
      const error = new Error(`Unable to play “${resource.title}” (audio error ${mediaError.code}).`);
      if (pending?.deck === deck && pending.revision === revision) {
        pending.reject(error);
      } else {
        fail(error, revision, true);
      }
    };
    deck.audio.addEventListener('error', onError);
    deck.removeError = () => deck.audio.removeEventListener('error', onError);
    deck.audio.src = resource.src;
    return deck;
  }

  function playSelected(report: boolean): Promise<void> {
    const attempt = invalidate();
    let deck: Deck;
    let played: Promise<void>;
    let failed: Promise<never>;
    try {
      deck = prepareDeck();
      failed = new Promise<never>((_resolve, reject) => {
        pending = { revision: attempt, deck, reject };
      });
      // Keep this call synchronous: a radio click's user activation must reach play().
      played = deck.audio.play();
    } catch (error) {
      pending = undefined;
      const failure = fail(error, attempt, report);
      return failure && !report ? Promise.reject(failure) : Promise.resolve();
    }
    const request = Promise.race([played, failed]).then(() => {
      if (destroyed || attempt !== revision || !enabled || page?.hidden) return;
      pending = undefined;
      const crossfading = decks.some((other) => other !== deck && !other.audio.paused && other.audio.volume > 0);
      fade(deck, crossfading ? 1500 : 800, attempt);
    }).catch((error: unknown) => {
      const failure = fail(error, attempt, report);
      // Obsolete requests resolve quietly so they cannot turn a newer session off.
      if (failure && !report) throw failure;
    }).finally(() => {
      if (starting === request) starting = undefined;
    });
    starting = request;
    return request;
  }

  function setEnabled(value: boolean): Promise<void> {
    if (destroyed) return value ? Promise.reject(new Error('Paper music has been destroyed.')) : Promise.resolve();
    if (!value) {
      enabled = false;
      const attempt = invalidate();
      if (page?.hidden) pauseAll();
      else fade(undefined, 280, attempt);
      return Promise.resolve();
    }
    if (enabled) {
      if (starting) return starting;
      if (page?.hidden || decks.some((deck) => deck.track?.id === selected.id && !deck.audio.paused)) return Promise.resolve();
    }
    enabled = true;
    if (page?.hidden) return Promise.resolve();
    return playSelected(false);
  }

  function setScene(state: Scene) {
    if (destroyed) return;
    const track = getPaperMusicTrack(state);
    if (selected.id === track.id) return;
    selected = track;
    if (enabled && !page?.hidden) void playSelected(true);
  }

  function onVisibilityChange() {
    if (destroyed) return;
    if (page?.hidden) {
      invalidate();
      pauseAll();
    } else if (enabled) {
      void playSelected(true);
    }
  }
  page?.addEventListener('visibilitychange', onVisibilityChange);

  return {
    setEnabled,
    setScene,
    getTrack: () => selected,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      enabled = false;
      invalidate();
      pauseAll();
      page?.removeEventListener('visibilitychange', onVisibilityChange);
      for (const deck of decks) {
        deck.removeError?.();
        deck.audio.removeAttribute('src');
        deck.audio.load();
      }
      decks.length = 0;
    },
  };
}
