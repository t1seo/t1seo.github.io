/** A quiet radio motif. Audio is created only by an explicit setEnabled(true). */
export interface PaperAudio {
  setEnabled(enabled: boolean): Promise<void>;
  destroy(): void;
}

interface Voice {
  oscillators: OscillatorNode[];
  envelope: GainNode;
  partials: GainNode[];
}

// Cmaj9, Fmaj9, Am9, G6/9. Sparse broken voicings leave room between notes.
const HARMONIES = [
  [48, 64, 67, 71, 74, 67, 64, 71],
  [41, 60, 64, 69, 72, 67, 64, 60],
  [45, 60, 64, 67, 71, 64, 60, 67],
  [43, 59, 62, 67, 69, 64, 62, 59],
] as const;
const NOTE_SPACING = 1.35;
const MASTER_VOLUME = 0.035;

export function createPaperAudio(): PaperAudio {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let filter: BiquadFilterNode | undefined;
  let scheduler: ReturnType<typeof setInterval> | undefined;
  let suspendTimer: ReturnType<typeof setTimeout> | undefined;
  let desired = false;
  let disposed = false;
  let revision = 0;
  let noteIndex = 0;
  let nextNoteAt = 0;
  const voices = new Set<Voice>();
  const page = typeof document === 'undefined' ? undefined : document;

  function clearTimers() {
    if (scheduler !== undefined) clearInterval(scheduler);
    if (suspendTimer !== undefined) clearTimeout(suspendTimer);
    scheduler = undefined;
    suspendTimer = undefined;
  }

  function rampVolume(value: number, duration: number) {
    if (!context || !master) return;
    const now = context.currentTime;
    // Hold the instantaneous value when a fast second click interrupts a fade.
    if (typeof master.gain.cancelAndHoldAtTime === 'function') {
      master.gain.cancelAndHoldAtTime(now);
    } else {
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
    }
    master.gain.linearRampToValueAtTime(value, now + duration);
  }

  function stopVoices(at: number) {
    for (const voice of voices) {
      for (const oscillator of voice.oscillators) {
        try { oscillator.stop(at); } catch { /* An already-ended note is harmless. */ }
      }
    }
  }

  function pause() {
    clearTimers();
    if (!context || context.state === 'closed') return;
    rampVolume(0, 0.22);
    stopVoices(context.currentTime + 0.24);
    const activeContext = context;
    const currentRevision = revision;
    suspendTimer = setTimeout(() => {
      suspendTimer = undefined;
      if (disposed || revision !== currentRevision || activeContext.state === 'closed') return;
      void activeContext.suspend().catch(() => { /* Gain has already faded to zero. */ });
    }, 270);
  }

  function playNote(midi: number, when: number, bass: boolean) {
    if (!context || !filter) return;
    const audio = context;
    const envelope = audio.createGain();
    const fundamental = 440 * 2 ** ((midi - 69) / 12);
    const level = bass ? 0.18 : 0.22;
    const duration = bass ? 3.8 : 3.1;
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(level, when + 0.045);
    envelope.gain.exponentialRampToValueAtTime(level * 0.32, when + 0.48);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    envelope.gain.linearRampToValueAtTime(0, when + duration + 0.06);
    envelope.connect(filter);

    // A sine fundamental with two restrained overtones gives a rounded tine sound.
    const oscillators: OscillatorNode[] = [];
    const partialGains: GainNode[] = [];
    const voice: Voice = { oscillators, envelope, partials: partialGains };
    let ended = 0;
    const partials = [[1, 1], [2, 0.11], [3, 0.018]] as const;
    for (const [multiple, strength] of partials) {
      const oscillator = audio.createOscillator();
      const partial = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(fundamental * multiple, when);
      partial.gain.value = strength;
      oscillator.connect(partial);
      partial.connect(envelope);
      oscillators.push(oscillator);
      partialGains.push(partial);
      oscillator.onended = () => {
        oscillator.disconnect();
        partial.disconnect();
        ended += 1;
        if (ended === partials.length) {
          envelope.disconnect();
          voices.delete(voice);
        }
      };
      oscillator.start(when);
      oscillator.stop(when + duration + 0.07);
    }
    voices.add(voice);
  }

  function schedule() {
    if (!context || !desired || disposed || page?.hidden || context.state !== 'running') return;
    // Background throttling must never create a burst of all the missed notes.
    if (nextNoteAt < context.currentTime) nextNoteAt = context.currentTime + 0.08;
    while (nextNoteAt < context.currentTime + 0.45) {
      const step = noteIndex % HARMONIES[0].length;
      const bar = Math.floor(noteIndex / HARMONIES[0].length) % HARMONIES.length;
      playNote(HARMONIES[bar][step], nextNoteAt, step === 0);
      nextNoteAt += NOTE_SPACING;
      noteIndex += 1;
    }
  }

  async function setEnabled(enabled: boolean): Promise<void> {
    if (disposed) {
      if (enabled) throw new Error('Paper audio has been destroyed.');
      return;
    }
    if (enabled && desired && scheduler !== undefined && context?.state === 'running' && !page?.hidden) return;
    desired = enabled;
    const currentRevision = ++revision;
    if (!enabled) {
      pause();
      return;
    }
    clearTimers();
    try {
      if (!context) {
        if (typeof AudioContext === 'undefined') throw new Error('Web Audio is unavailable.');
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = 0;
        filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1750;
        filter.Q.value = 0.25;
        filter.connect(master);
        master.connect(context.destination);
      }
      if (context.state === 'closed') throw new Error('The audio context is closed.');
      // Intentionally before the first await: preserve the radio click's user activation.
      const resumed = context.resume();
      await resumed;
      if (disposed || currentRevision !== revision || !desired) return;
      if (page?.hidden) {
        pause();
        return;
      }
      if (context.state !== 'running') throw new Error('The browser did not enable audio.');
      nextNoteAt = context.currentTime + 0.08;
      rampVolume(MASTER_VOLUME, 0.65);
      schedule();
      scheduler = setInterval(schedule, 160);
    } catch (error) {
      if (currentRevision === revision && !disposed) {
        desired = false;
        pause();
      }
      throw error;
    }
  }

  function onVisibilityChange() {
    if (disposed || !desired) return;
    if (page?.hidden) {
      revision += 1;
      pause();
    } else {
      // Only a previously enabled radio may resume; never start from a page event.
      void setEnabled(true).catch(() => { /* A new explicit click can retry. */ });
    }
  }
  page?.addEventListener('visibilitychange', onVisibilityChange);

  return {
    setEnabled,
    destroy() {
      if (disposed) return;
      disposed = true;
      desired = false;
      revision += 1;
      clearTimers();
      page?.removeEventListener('visibilitychange', onVisibilityChange);
      stopVoices(context?.currentTime ?? 0);
      for (const voice of voices) {
        for (const oscillator of voice.oscillators) {
          oscillator.onended = null;
          oscillator.disconnect();
        }
        for (const partial of voice.partials) partial.disconnect();
        voice.envelope.disconnect();
      }
      voices.clear();
      filter?.disconnect();
      master?.disconnect();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      context = undefined;
      filter = undefined;
      master = undefined;
    },
  };
}
