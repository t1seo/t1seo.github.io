import { createFocusTimer, type FocusTimerState } from './penthouse-focus-timer';
import { createSingingBowlSound } from './penthouse-singing-bowl';
import { updateRoomTimeObjects } from './penthouse-time-objects';

export function focusTimeText(remainingMs: number): string {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function mountFocusSession(root: HTMLElement, timeZone: () => string, complete: () => void) {
  const abort = new AbortController();
  const sound = createSingingBowlSound();
  let state: FocusTimerState = { status: 'idle', durationMs: 0, remainingMs: 0 };
  let revision = 0;
  let notice = '';
  function refresh() {
    const text = focusTimeText(state.remainingMs);
    const countdown = state.status === 'idle' ? undefined : {
      text, label: `${text} ${state.status === 'paused' ? 'paused' : 'remaining'}. Open focus timer and atmosphere settings`,
    };
    updateRoomTimeObjects(root, timeZone(), new Date(), countdown);
    const readout = root.querySelector('[data-focus-readout]');
    if (readout) readout.textContent = state.status === 'idle' ? 'Ready when you are.' : `${text}${state.status === 'paused' ? ' · paused' : ''}`;
    for (const action of ['start', 'pause', 'resume', 'cancel'] as const) {
      root.querySelectorAll<HTMLElement>(`[data-action="timer-${action}"]`).forEach(button => {
        button.hidden = action === 'start' ? state.status !== 'idle' : action === 'pause' ? state.status !== 'running' : action === 'resume' ? state.status !== 'paused' : state.status === 'idle';
      });
    }
    const status = root.querySelector('[data-focus-status]');
    if (status) status.textContent = notice;
  }
  const timer = createFocusTimer({
    onChange(next) { state = next; refresh(); },
    onComplete() {
      const token = revision;
      notice = 'Your focus session is complete.';
      complete();
      refresh();
      void sound.strike().catch((error: unknown) => {
        console.error('Focus chime unavailable', error instanceof Error ? error.message : error);
      }).finally(() => { if (token === revision) sound.release(); });
    },
  });
  const focusAction = (action: string) => root.querySelector<HTMLButtonElement>(`[data-action="timer-${action}"]`)?.focus();
  root.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>('[data-action]');
    const action = button?.dataset.action;
    if (action === 'timer-start') {
      const minutes = Number(button?.dataset.minutes);
      if (minutes !== 25 && minutes !== 50) return;
      revision++;
      notice = '';
      if (timer.start(minutes)) void sound.prepare().catch((error: unknown) => {
        console.error('Focus chime preparation unavailable', error instanceof Error ? error.message : error);
      });
      focusAction('pause');
    } else if (action === 'timer-pause') { timer.pause(); focusAction('resume'); }
    else if (action === 'timer-resume') { timer.resume(); focusAction('pause'); }
    else if (action === 'timer-cancel') { revision++; notice = ''; timer.cancel(); sound.release(); focusAction('start'); }
  }, { signal: abort.signal });
  timer.setVisible(!document.hidden);
  document.addEventListener('visibilitychange', () => timer.setVisible(!document.hidden), { signal: abort.signal });
  refresh();
  return {
    refresh,
    destroy() { revision++; abort.abort(); timer.destroy(); sound.destroy(); },
  };
}
