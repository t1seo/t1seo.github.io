import { getCyberMusicTrack, type CyberMusicTrack, type MusicClimate } from './cyber-music-catalog.ts';
import { createSoundMixer, normalizeAudioVolume, type CyberSoundMixer, type MixListener } from './cyber-sound-mix.ts';
export type { CyberSoundMix, CyberSoundMixer } from './cyber-sound-mix.ts';

export interface CyberPlaybackState {
  track: CyberMusicTrack;
  /** User choice: enabled music continues in background tabs. */
  enabled: boolean;
  playing: boolean;
  loading: boolean;
  error: string | null;
}

export type CyberSound = {
  setEnabled(enabled: boolean): Promise<boolean>;
  isEnabled(): boolean;
  setClimate(climate: MusicClimate): void;
  getCurrentTrack(): CyberMusicTrack;
  setRain(enabled: boolean): void;
  setMusicVolume(volume: number): void;
  playBowl(): Promise<void>;
  playCup(): Promise<void>;
  destroy(): void;
};

type Deck = {
  track: CyberMusicTrack;
  element: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  stopTimer?: ReturnType<typeof setTimeout>;
  onError: () => void;
};
type Tone = { nodes: AudioNode[]; sources: OscillatorNode[]; timer: ReturnType<typeof setTimeout> };
const MUSIC_GAIN = 0.34;
const CROSSFADE_SECONDS = 1.35;
type CyberSoundOptions = {
  readonly onTrackChange?: (state: CyberPlaybackState) => void;
  readonly independentMix?: boolean;
  readonly onMixChange?: MixListener;
};

/** Local licensed recordings + gesture-only physical sounds. No audio at mount. */
export function createCyberSound(options: CyberSoundOptions & { independentMix: true }): CyberSoundMixer;
export function createCyberSound(options?: CyberSoundOptions): CyberSound;
export function createCyberSound(options: CyberSoundOptions = {}): CyberSound {
  let publishMix = () => {};
  const music = createCoupledSound({ ...options, onTrackChange: state => {
    options.onTrackChange?.(state);
    publishMix();
  } });
  if (!options.independentMix) return music;
  const mixer = createSoundMixer(music, options.onMixChange);
  publishMix = mixer.publish;
  return mixer.sound;
}

function createCoupledSound(options: CyberSoundOptions): CyberSound {
  let context: AudioContext | null = null;
  let climate: MusicClimate = { season: 'autumn', time: 'night', weather: 'clear' };
  let selected = getCyberMusicTrack(climate);
  let enabled = false;
  let musicVolume = .65;
  let playing = false;
  let loading = false;
  let destroyed = false;
  let error: string | null = null;
  let revision = 0;
  let visibilityRevision = 0;
  let activeDeck: Deck | null = null;
  let pendingDeck: Deck | null = null;
  let musicGain: GainNode | null = null;
  let rain: { source: AudioBufferSourceNode; gain: GainNode; nodes: AudioNode[] } | null = null;
  let rainEnabled = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const decks = new Set<Deck>();
  const tones = new Set<Tone>();

  function publish(): void {
    if (destroyed) return;
    const state: CyberPlaybackState = { track: selected, enabled, playing, loading, error };
    options.onTrackChange?.(state);
    document.dispatchEvent(new CustomEvent<CyberPlaybackState>('cyber:track', { detail: state }));
  }

  function clearIdle(): void {
    if (idleTimer !== undefined) clearTimeout(idleTimer);
    idleTimer = undefined;
  }

  function audioContext(): AudioContext {
    clearIdle();
    context ??= new AudioContext();
    return context;
  }

  function resumeContext(audio: AudioContext): Promise<void> {
    // Reconcile late resumes after failure or teardown. Background music stays
    // running; a delayed object gesture must not wake an otherwise silent tab.
    return audio.resume().then(async () => {
      if (audio.state === 'closed') return;
      if (destroyed || audio !== context) {
        await audio.close().catch(() => {});
      } else if (document.hidden && !enabled) {
        await audio.suspend().catch(() => {});
      } else if (!enabled && tones.size === 0) {
        suspendWhenIdle();
      }
    });
  }

  function fade(param: AudioParam, value: number, seconds: number): void {
    if (!context || context.state === 'closed') return;
    const now = context.currentTime;
    if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
    else {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
    }
    param.linearRampToValueAtTime(value, now + seconds);
  }

  function retire(deck: Deck): void {
    if (!decks.delete(deck)) return;
    if (deck.stopTimer !== undefined) clearTimeout(deck.stopTimer);
    deck.element.removeEventListener('error', deck.onError);
    deck.element.pause();
    deck.element.removeAttribute('src');
    deck.element.load(); // Abort an unfinished request and release the decoder.
    deck.source.disconnect();
    deck.gain.disconnect();
    if (activeDeck === deck) activeDeck = null;
    if (pendingDeck === deck) pendingDeck = null;
  }

  function retireAfterFade(deck: Deck, seconds: number): void {
    if (deck.stopTimer !== undefined) clearTimeout(deck.stopTimer);
    fade(deck.gain.gain, 0, seconds);
    deck.stopTimer = setTimeout(() => retire(deck), seconds * 1000 + 40);
  }

  function suspendWhenIdle(): void {
    clearIdle();
    idleTimer = setTimeout(() => {
      idleTimer = undefined;
      if (context && !destroyed && !enabled && tones.size === 0 && context.state === 'running') {
        void context.suspend().catch(() => {});
      }
    }, 280);
  }

  function updateRain(): void {
    if (!context || context.state !== 'running') return;
    if (!rain && rainEnabled && playing) {
      const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2400;
      const gain = context.createGain();
      gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
      rain = { source, gain, nodes: [source, filter, gain] };
    }
    if (rain) fade(rain.gain.gain, rainEnabled && playing && enabled ? 0.014 : 0, 0.6);
  }

  function fail(token: number): void {
    if (destroyed || token !== revision) return;
    revision++;
    enabled = false;
    playing = false;
    loading = false;
    error = 'Music could not start. Please try the speaker again.';
    for (const deck of decks) retire(deck);
    updateRain();
    suspendWhenIdle();
    publish();
  }

  function buildDeck(audio: AudioContext, track: CyberMusicTrack): Deck {
    if (!musicGain) {
      musicGain = audio.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(audio.destination);
      fade(musicGain.gain, MUSIC_GAIN * musicVolume / .65, .12);
    }
    const element = new Audio();
    element.preload = 'none';
    element.loop = true;
    const source = audio.createMediaElementSource(element);
    const gain = audio.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(musicGain);
    const deck: Deck = { track, element, source, gain, onError: () => {
      // An outgoing recording can fail while its replacement is buffering.
      // Retire that deck without discarding the newer, healthy request.
      if (activeDeck === deck && pendingDeck && pendingDeck !== deck) {
        retire(deck);
        playing = false;
        updateRain();
        publish();
      } else if (activeDeck === deck || pendingDeck === deck) fail(revision);
    } };
    element.addEventListener('error', deck.onError);
    element.src = track.src;
    decks.add(deck);
    return deck;
  }

  async function startSelected(): Promise<boolean> {
    const token = ++revision;
    if (destroyed || !enabled) return false;
    clearIdle();
    if (pendingDeck) retire(pendingDeck);
    loading = true;
    error = null;
    publish();
    try {
      const audio = audioContext();
      // Both permission-sensitive calls happen before the first await.
      const resumed = resumeContext(audio);
      const next = activeDeck?.track.id === selected.id ? activeDeck : buildDeck(audio, selected);
      if (next.stopTimer !== undefined) clearTimeout(next.stopTimer);
      next.stopTimer = undefined;
      pendingDeck = next;
      const started = next.element.play();
      await Promise.all([resumed, started]);
      if (destroyed || token !== revision || !enabled) {
        if (next !== activeDeck) retire(next);
        return false;
      }
      if (audio.state !== 'running') {
        fail(token);
        return false;
      }
      pendingDeck = null;
      for (const deck of decks) {
        if (deck !== next && deck.stopTimer === undefined) retireAfterFade(deck, CROSSFADE_SECONDS);
      }
      activeDeck = next;
      if (next.stopTimer !== undefined) clearTimeout(next.stopTimer);
      next.stopTimer = undefined;
      fade(next.gain.gain, 1, CROSSFADE_SECONDS);
      playing = true;
      loading = false;
      updateRain();
      publish();
      return true;
    } catch {
      fail(token);
      return false;
    }
  }

  function stopMusic(): void {
    revision++;
    playing = false;
    loading = false;
    if (pendingDeck && pendingDeck !== activeDeck) retire(pendingDeck);
    pendingDeck = null;
    for (const deck of decks) retireAfterFade(deck, 0.2);
    updateRain();
    if (!enabled) suspendWhenIdle();
  }

  function disposeTone(tone: Tone): void {
    if (!tones.delete(tone)) return;
    clearTimeout(tone.timer);
    for (const source of tone.sources) { try { source.stop(); } catch { /* Already ended. */ } }
    for (const node of tone.nodes) node.disconnect();
    if (!enabled) suspendWhenIdle();
  }

  async function physicalTone(kind: 'bowl' | 'cup'): Promise<void> {
    if (destroyed || document.hidden) return;
    const visibleAtStart = visibilityRevision;
    try {
      const audio = audioContext();
      await resumeContext(audio);
      if (destroyed || document.hidden || visibleAtStart !== visibilityRevision || audio.state !== 'running') return;
      // Keep repeated taps soft: at most two resonances can ring together.
      if (tones.size >= 2) disposeTone(tones.values().next().value!);
      const now = audio.currentTime;
      const duration = kind === 'bowl' ? 8.2 : 0.62;
      const master = audio.createGain();
      master.gain.value = kind === 'bowl' ? 0.2 : 0.07;
      master.connect(audio.destination);
      const nodes: AudioNode[] = [master];
      const sources: OscillatorNode[] = [];
      const partials = kind === 'bowl'
        ? [[174.6, 0.5, 7.8], [176.1, 0.2, 7.3], [468.4, 0.17, 5.4], [927.1, 0.075, 3.8], [1518, 0.022, 1.9]]
        : [[1420, 0.45, 0.42], [2308, 0.2, 0.3], [3920, 0.065, 0.16]];
      for (const [frequency, level, decay] of partials) {
        const source = audio.createOscillator();
        source.type = 'sine';
        source.frequency.value = frequency;
        const gain = audio.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(level, now + (kind === 'bowl' ? 0.018 : 0.004));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        source.connect(gain).connect(master);
        source.start(now);
        source.stop(now + duration);
        nodes.push(source, gain);
        sources.push(source);
      }
      const tone: Tone = { nodes, sources, timer: setTimeout(() => disposeTone(tone), duration * 1000 + 50) };
      tones.add(tone);
    } catch { /* An unavailable audio device must not break the object interaction. */ }
  }

  function onVisibilityChange(): void {
    if (destroyed) return;
    visibilityRevision++;
    if (document.hidden) {
      // Object sounds belong to the visible scene. Music and rain keep playing
      // until the listener turns them off, regardless of the selected tab.
      for (const tone of tones) disposeTone(tone);
      if (!enabled && context && context.state !== 'closed') void context.suspend().catch(() => {});
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    isEnabled: () => enabled && !destroyed,
    getCurrentTrack: () => selected,
    async setEnabled(value): Promise<boolean> {
      if (destroyed) return false;
      enabled = value;
      error = null;
      if (!value) {
        stopMusic();
        publish();
        return false;
      }
      return startSelected();
    },
    setClimate(value): void {
      if (destroyed) return;
      climate = { ...value };
      const next = getCyberMusicTrack(climate);
      const changed = selected.id !== next.id;
      selected = next;
      rainEnabled = !options.independentMix && climate.weather === 'rain';
      updateRain();
      if (changed && enabled) void startSelected();
      else publish();
    },
    setRain(value): void {
      if (destroyed) return;
      rainEnabled = !options.independentMix && value;
      updateRain();
    },
    setMusicVolume(value): void {
      if (destroyed) return;
      musicVolume = normalizeAudioVolume(value, musicVolume);
      if (musicGain) fade(musicGain.gain, MUSIC_GAIN * musicVolume / .65, .12);
    },
    playBowl: () => physicalTone('bowl'),
    playCup: () => physicalTone('cup'),
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      enabled = false;
      playing = false;
      revision++;
      clearIdle();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      for (const deck of decks) retire(deck);
      musicGain?.disconnect();
      musicGain = null;
      for (const tone of tones) disposeTone(tone);
      clearIdle();
      if (rain) {
        rain.source.stop();
        for (const node of rain.nodes) node.disconnect();
        rain = null;
      }
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      context = null;
    },
  };
}
