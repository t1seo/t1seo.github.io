import './paper-intro.css';

const IDLE_DELAY = 30_000;
const FRAME_DURATION = 7_800;
const FADE_DURATION = 700;
const FRAME_GAP = 150;
const NAME = 'Jieun Jeon';
const roles = ['Software Engineer', 'Lifelong Learner', 'Builder of Little Things', 'Sharing What I Learn'] as const;

/** Decorative introduction; all pointer and keyboard interactions stay with the room. */
export function mountPaperIntro(root: HTMLElement): { destroy(): void } {
  const intro = document.createElement('div');
  intro.className = 'paper-intro';
  intro.dataset.visible = 'true';
  intro.setAttribute('aria-hidden', 'true');
  intro.innerHTML = `<div class="paper-intro-copy">
    <p class="paper-intro-title"><span class="paper-intro-line"><span class="paper-intro-ghost" aria-hidden="true" data-intro-title-ghost></span><span class="paper-intro-typed"><span data-intro-title></span><i class="paper-intro-cursor" aria-hidden="true"></i></span></span></p>
    <p class="paper-intro-name"><span class="paper-intro-line"><span class="paper-intro-ghost" aria-hidden="true" data-intro-name-ghost></span><span class="paper-intro-typed"><span data-intro-name></span><i class="paper-intro-cursor" aria-hidden="true"></i></span></span></p>
  </div>`;
  root.append(intro);

  const title = intro.querySelector<HTMLElement>('[data-intro-title]')!;
  const subtitle = intro.querySelector<HTMLElement>('[data-intro-name]')!;
  const titleGhost = intro.querySelector<HTMLElement>('[data-intro-title-ghost]')!;
  const subtitleGhost = intro.querySelector<HTMLElement>('[data-intro-name-ghost]')!;
  const abort = new AbortController();
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let destroyed = false;
  let frameIndex = 0;
  let reducedMotion = readReducedMotion();
  let suspended = isSuspended();
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let sequenceTimer: ReturnType<typeof setTimeout> | undefined;
  let sequenceTask: (() => void) | undefined;
  let sequenceDue = 0;
  let sequenceRemaining = 0;

  function readReducedMotion() {
    const setting = root.closest('[data-motion]')?.getAttribute('data-motion');
    if (setting === 'on' || setting === 'true') return false;
    if (setting === 'off' || setting === 'false') return true;
    return media.matches;
  }

  function isSuspended() {
    return document.visibilityState === 'hidden' || !!root.closest('[inert], [hidden]') || !!root.querySelector('dialog[open]');
  }

  function stopIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = undefined;
  }

  function stopSequence() {
    clearTimeout(sequenceTimer);
    sequenceTimer = undefined;
    sequenceTask = undefined;
    sequenceRemaining = 0;
  }

  function canAnimate() {
    return !destroyed && visible && !suspended && !reducedMotion;
  }

  function resumeSequence() {
    if (!canAnimate() || !sequenceTask || sequenceTimer !== undefined) return;
    sequenceDue = performance.now() + sequenceRemaining;
    sequenceTimer = setTimeout(() => {
      sequenceTimer = undefined;
      sequenceRemaining = 0;
      if (!canAnimate()) return;
      const task = sequenceTask;
      sequenceTask = undefined;
      task?.();
    }, sequenceRemaining);
  }

  function scheduleSequence(task: () => void, delay: number) {
    stopSequence();
    sequenceTask = task;
    sequenceRemaining = delay;
    resumeSequence();
  }

  function pauseSequence() {
    if (sequenceTimer === undefined) return;
    sequenceRemaining = Math.max(0, sequenceDue - performance.now());
    clearTimeout(sequenceTimer);
    sequenceTimer = undefined;
  }

  function prepareFrame(index: number) {
    frameIndex = index;
    intro.dataset.frame = String(index);
    intro.dataset.phase = 'showing';
    titleGhost.textContent = NAME;
    subtitleGhost.textContent = roles[index];
  }

  function showStaticFrame() {
    stopSequence();
    prepareFrame(0);
    title.textContent = NAME;
    subtitle.textContent = roles[0];
    intro.dataset.typing = 'none';
  }

  function startFrame(index: number, typeName = false) {
    stopSequence();
    prepareFrame(index);
    title.textContent = typeName ? '' : NAME;
    subtitle.textContent = '';
    intro.dataset.typing = typeName ? 'title' : 'name';
    const startedAt = performance.now();

    function typeLine(target: HTMLElement, text: string, offset: number, speed: number, done: () => void) {
      target.textContent = text.slice(0, offset + 1);
      if (offset + 1 < text.length) {
        scheduleSequence(() => typeLine(target, text, offset + 1, speed, done), speed + (offset % 3) * 8);
      } else done();
    }

    function holdFrame() {
      intro.dataset.typing = 'none';
      const hold = Math.max(4_000, FRAME_DURATION - (performance.now() - startedAt) - FADE_DURATION - FRAME_GAP);
      scheduleSequence(() => {
        intro.dataset.phase = 'leaving';
        scheduleSequence(() => {
          scheduleSequence(() => startFrame((frameIndex + 1) % roles.length), FRAME_GAP);
        }, FADE_DURATION);
      }, hold);
    }

    function typeRole() {
      intro.dataset.typing = 'name';
      typeLine(subtitle, roles[index], 0, 52, holdFrame);
    }

    scheduleSequence(() => {
      if (typeName) typeLine(title, NAME, 0, 72, () => scheduleSequence(typeRole, 260));
      else typeRole();
    }, 160);
  }

  function canWaitForIdle() {
    return !destroyed && !visible && !suspended;
  }

  function restartIdleTimer() {
    stopIdleTimer();
    if (!canWaitForIdle()) return;
    idleTimer = setTimeout(() => {
      idleTimer = undefined;
      if (!canWaitForIdle()) return;
      visible = true;
      intro.dataset.visible = 'true';
      if (reducedMotion) showStaticFrame();
      else startFrame((frameIndex + 1) % roles.length, true);
    }, IDLE_DELAY);
  }

  function onSceneInteraction(event: Event) {
    const target = event.target;
    if (target instanceof Element && (target === root || target.closest('.paper-immersive-scene'))) {
      visible = false;
      intro.dataset.visible = 'false';
      stopSequence();
    }
    restartIdleTimer();
  }

  function syncContext() {
    if (destroyed) return;
    const nextReducedMotion = readReducedMotion();
    suspended = isSuspended();
    intro.dataset.suspended = String(suspended);
    if (nextReducedMotion !== reducedMotion) {
      reducedMotion = nextReducedMotion;
      if (reducedMotion) showStaticFrame();
      else if (visible) startFrame(frameIndex, true);
    }
    if (suspended) {
      pauseSequence();
      stopIdleTimer();
    } else {
      resumeSequence();
      restartIdleTimer();
    }
  }

  root.addEventListener('pointerdown', onSceneInteraction, { capture: true, passive: true, signal: abort.signal });
  root.addEventListener('click', onSceneInteraction, { capture: true, passive: true, signal: abort.signal });
  for (const type of ['pointermove', 'pointerup', 'pointercancel', 'keydown', 'focusin', 'wheel'] as const) {
    root.addEventListener(type, restartIdleTimer, { capture: true, passive: true, signal: abort.signal });
  }
  window.addEventListener('scroll', restartIdleTimer, { capture: true, passive: true, signal: abort.signal });
  document.addEventListener('visibilitychange', syncContext, { signal: abort.signal });
  media.addEventListener('change', syncContext, { signal: abort.signal });

  // Dialogs, page navigation and motion preferences can change without a pointer event.
  const contextObserver = new MutationObserver(syncContext);
  contextObserver.observe(root, { subtree: true, attributes: true, attributeFilter: ['open', 'data-motion', 'inert', 'hidden'] });
  for (let ancestor = root.parentElement; ancestor; ancestor = ancestor.parentElement) {
    contextObserver.observe(ancestor, { attributes: true, attributeFilter: ['data-motion', 'inert', 'hidden'] });
  }
  intro.dataset.suspended = String(suspended);
  if (reducedMotion) showStaticFrame();
  else startFrame(0, true);

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopIdleTimer();
      stopSequence();
      abort.abort();
      contextObserver.disconnect();
      intro.remove();
    },
  };
}
