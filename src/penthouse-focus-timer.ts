export type FocusTimerState = {
  readonly status: 'idle' | 'running' | 'paused';
  readonly durationMs: number;
  readonly remainingMs: number;
};

export interface FocusTimerScheduler {
  setTimeout(callback: () => void, delayMs: number): number;
  clearTimeout(id: number): void;
}

export type FocusTimerOptions = {
  readonly onChange: (state: FocusTimerState) => void;
  readonly onComplete: () => void;
  readonly now?: () => number;
  readonly scheduler?: FocusTimerScheduler;
};

export interface FocusTimer {
  start(minutes: number): boolean;
  pause(): void;
  resume(): void;
  cancel(): void;
  setVisible(visible: boolean): void;
  getState(): FocusTimerState;
  destroy(): void;
}

type FocusSession =
  | { readonly status: 'idle' }
  | { readonly status: 'running'; readonly durationMs: number; readonly deadline: number }
  | { readonly status: 'paused'; readonly durationMs: number; readonly remainingMs: number };

export function createFocusTimer(options: FocusTimerOptions): FocusTimer {
  const now = options.now ?? Date.now;
  const scheduler: FocusTimerScheduler = options.scheduler ?? {
    setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimeout: id => window.clearTimeout(id),
  };
  let session: FocusSession = { status: 'idle' };
  let scheduled: number | undefined;
  let visible = true;
  let destroyed = false;

  function getState(): FocusTimerState {
    switch (session.status) {
      case 'idle': return { status: 'idle', durationMs: 0, remainingMs: 0 };
      case 'paused': return { ...session };
      case 'running': return {
        status: 'running', durationMs: session.durationMs,
        remainingMs: Math.max(0, Math.min(session.durationMs, session.deadline - now())),
      };
      default: {
        const unexpected: never = session;
        throw new TypeError(`Unknown focus session: ${unexpected}`);
      }
    }
  }
  function unschedule() {
    if (scheduled === undefined) return;
    scheduler.clearTimeout(scheduled);
    scheduled = undefined;
  }
  function schedule() {
    if (destroyed || !visible || scheduled !== undefined) return;
    switch (session.status) {
      case 'idle':
      case 'paused': return;
      case 'running':
        scheduled = scheduler.setTimeout(() => { scheduled = undefined; tick(); }, Math.min(1_000, getState().remainingMs));
        return;
      default: {
        const unexpected: never = session;
        throw new TypeError(`Unknown focus session: ${unexpected}`);
      }
    }
  }
  function finish() {
    unschedule();
    session = { status: 'idle' };
    options.onChange(getState());
    if (!destroyed) options.onComplete();
  }
  function tick() {
    if (destroyed || !visible) return;
    switch (session.status) {
      case 'idle':
      case 'paused': return;
      case 'running':
        if (getState().remainingMs === 0) finish();
        else { options.onChange(getState()); schedule(); }
        return;
      default: {
        const unexpected: never = session;
        throw new TypeError(`Unknown focus session: ${unexpected}`);
      }
    }
  }
  return {
    start(minutes) {
      if (destroyed || !Number.isFinite(minutes) || minutes < 1 || minutes > 180) return false;
      unschedule();
      const durationMs = Math.round(minutes * 60_000);
      session = { status: 'running', durationMs, deadline: now() + durationMs };
      options.onChange(getState());
      schedule();
      return true;
    },
    pause() {
      if (destroyed) return;
      switch (session.status) {
        case 'idle':
        case 'paused': return;
        case 'running': {
          const state = getState();
          if (state.remainingMs === 0) { if (visible) finish(); return; }
          unschedule();
          session = { status: 'paused', durationMs: state.durationMs, remainingMs: state.remainingMs };
          options.onChange(getState());
          return;
        }
        default: {
          const unexpected: never = session;
          throw new TypeError(`Unknown focus session: ${unexpected}`);
        }
      }
    },
    resume() {
      if (destroyed) return;
      switch (session.status) {
        case 'idle':
        case 'running': return;
        case 'paused':
          session = { status: 'running', durationMs: session.durationMs, deadline: now() + session.remainingMs };
          options.onChange(getState());
          schedule();
          return;
        default: {
          const unexpected: never = session;
          throw new TypeError(`Unknown focus session: ${unexpected}`);
        }
      }
    },
    cancel() {
      if (destroyed) return;
      unschedule();
      session = { status: 'idle' };
      options.onChange(getState());
    },
    setVisible(next) {
      if (destroyed || visible === next) return;
      visible = next;
      if (visible) tick();
      else unschedule();
    },
    getState,
    destroy() {
      destroyed = true;
      unschedule();
      session = { status: 'idle' };
    },
  };
}
