type RainGraph = {
  readonly source: AudioBufferSourceNode;
  readonly filter: BiquadFilterNode;
  readonly gain: GainNode;
};

export function createRainAudio(onChange: (enabled: boolean, error: string | null) => void) {
  let context: AudioContext | null = null;
  let graph: RainGraph | null = null;
  let enabled = false;
  let volume = .5;
  let destroyed = false;
  let revision = 0;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;

  function release(): void {
    if (stopTimer !== undefined) clearTimeout(stopTimer);
    stopTimer = undefined;
    if (!graph) return;
    graph.source.stop();
    graph.source.disconnect();
    graph.filter.disconnect();
    graph.gain.disconnect();
    graph = null;
  }

  function ramp(value: number): void {
    if (!context || !graph) return;
    const now = context.currentTime;
    graph.gain.gain.cancelAndHoldAtTime(now);
    graph.gain.gain.linearRampToValueAtTime(value, now + .15);
  }

  async function settleContext(audio: AudioContext, close: boolean): Promise<void> {
    if (audio.state === 'closed') return;
    try { await (close ? audio.close() : audio.suspend()); }
    catch (error) {
      if (!(error instanceof Error)) throw error;
    }
  }

  function build(audio: AudioContext): RainGraph {
    const buffer = audio.createBuffer(1, audio.sampleRate * 3, audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    const gain = audio.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start();
    return { source, filter, gain };
  }

  return {
    isEnabled: () => enabled && !destroyed,
    setVolume(value: number): void { volume = value; ramp(enabled ? .028 * volume : 0); },
    async setEnabled(value: boolean): Promise<void> {
      if (destroyed) return;
      const token = ++revision;
      enabled = value;
      if (stopTimer !== undefined) clearTimeout(stopTimer);
      stopTimer = undefined;
      onChange(enabled, null);
      if (!enabled) {
        ramp(0);
        stopTimer = setTimeout(() => {
          release();
          if (context) void settleContext(context, false);
        }, 180);
        return;
      }
      try {
        context ??= new AudioContext();
        const audio = context;
        await audio.resume();
        if (destroyed || token !== revision || !enabled) {
          if (destroyed || !enabled) await settleContext(audio, destroyed);
          return;
        }
        if (audio.state !== 'running') throw new DOMException('Audio device did not resume', 'InvalidStateError');
        graph ??= build(audio);
        ramp(.028 * volume);
        onChange(true, null);
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        if (destroyed || token !== revision) return;
        enabled = false;
        release();
        if (context) await settleContext(context, false);
        if (!destroyed && token === revision) onChange(false, 'Rain could not start. Please try again.');
      }
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      enabled = false;
      revision++;
      release();
      if (context) void settleContext(context, true);
    },
  };
}
