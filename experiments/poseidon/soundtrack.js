/** Gesture-started music. Visibility changes never interrupt chosen playback. */
export function createSoundtrack(button, src) {
  const audio = new Audio();
  audio.preload = 'none';
  audio.loop = true;
  audio.volume = 0;
  audio.src = src;

  let disposed = false;
  let wantsPlayback = false;
  let attempt = 0;
  let failed = false;
  let fadeTimer;

  const updateButton = () => {
    const label = wantsPlayback ? 'Pause background music' : 'Play background music';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(wantsPlayback));
    button.dataset.playing = String(wantsPlayback);
    button.title = label;
  };

  const cancelFade = () => {
    clearTimeout(fadeTimer);
    fadeTimer = undefined;
  };

  const pause = () => {
    wantsPlayback = false;
    attempt += 1;
    cancelFade();
    audio.pause();
    audio.volume = 0;
    updateButton();
  };

  const fail = () => {
    if (disposed) return;
    failed = true;
    pause();
  };

  const fadeIn = (id) => {
    let step = 0;
    const advance = () => {
      if (disposed || !wantsPlayback || attempt !== id) return;
      step += 1;
      audio.volume = 0.28 * Math.min(1, step / 30);
      if (step < 30) fadeTimer = setTimeout(advance, 50);
      else fadeTimer = undefined;
    };
    cancelFade();
    fadeTimer = setTimeout(advance, 50);
  };

  const toggle = () => {
    if (disposed) return;
    if (wantsPlayback) {
      pause();
      return;
    }

    wantsPlayback = true;
    const id = ++attempt;
    updateButton();
    try {
      // Clear a failed media resource before retrying from another gesture.
      if (failed || audio.error) {
        failed = false;
        audio.load();
      }
      const result = audio.play();
      Promise.resolve(result).then(() => {
        if (disposed) {
          audio.pause();
          return;
        }
        if (id !== attempt) {
          // An older play promise must not override a newer play gesture.
          if (!wantsPlayback) audio.pause();
          return;
        }
        if (wantsPlayback) fadeIn(id);
      }, () => {
        if (!disposed && id === attempt) fail();
      });
    } catch {
      if (id === attempt) fail();
    }
  };

  button.addEventListener('click', toggle);
  audio.addEventListener('error', fail);
  updateButton();

  return {
    get state() {
      return { playing: !audio.paused, time: audio.currentTime, duration: audio.duration,
        volume: audio.volume, readyState: audio.readyState, error: audio.error?.code ?? null };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pause();
      button.removeEventListener('click', toggle);
      audio.removeEventListener('error', fail);
      audio.removeAttribute('src');
      audio.load();
    },
  };
}
