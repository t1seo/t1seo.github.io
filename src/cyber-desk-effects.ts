import type { ClimateState } from './cyber-climate.ts';
import './cyber-desk-effects.css';

export interface CyberDeskEffects {
  strikeBowl(): void;
  coffee(): void;
  setMusic(enabled: boolean): void;
  setClimate(state: ClimateState): void;
  setActive(active: boolean): void;
  destroy(): void;
}

/** Light, liquid and steam only: the illustrated objects remain untouched. */
export function mountCyberDeskEffects(plane: HTMLElement): CyberDeskEffects {
  const layer = document.createElement('div');
  layer.className = 'cyber-desk-effects';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `
    <div class="cyber-bowl-shimmer"><i></i><i></i><i></i><b></b></div>
    <div class="cyber-coffee-surface"><i></i><i></i></div>
    <div class="cyber-coffee-steam">
      ${Array.from({ length: 5 }, (_, index) => `<svg class="cyber-steam-wisp" viewBox="0 0 40 100" style="--wisp:${index}" fill="none"><path d="M20 95 C9 79 33 70 22 54 C8 36 31 23 19 7"/><path d="M22 94 C12 76 34 67 23 53 C12 38 29 24 20 12"/></svg>`).join('')}
    </div>
    <div class="cyber-speaker-presence cyber-speaker-presence--left"><i></i><b></b></div>
    <div class="cyber-speaker-presence cyber-speaker-presence--right"><i></i><b></b></div>`;
  plane.append(layer);

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bowl = layer.querySelector<HTMLElement>('.cyber-bowl-shimmer')!;
  const surface = layer.querySelector<HTMLElement>('.cyber-coffee-surface')!;
  const steam = layer.querySelector<HTMLElement>('.cyber-coffee-steam')!;
  const groups = new Map<'bowl' | 'coffee', Set<Animation>>();
  const staticTimers = new Map<'bowl' | 'coffee', ReturnType<typeof setTimeout>>();
  let active = true;
  let music = false;
  let destroyed = false;

  function canPlay() { return !destroyed && active && !document.hidden; }

  function cancel(group: 'bowl' | 'coffee') {
    groups.get(group)?.forEach(animation => animation.cancel());
    groups.delete(group);
    clearTimeout(staticTimers.get(group));
    staticTimers.delete(group);
    delete layer.dataset[group];
  }

  function animate(group: 'bowl' | 'coffee', element: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
    const animation = element.animate(frames, { fill: 'none', ...options });
    const animations = groups.get(group) ?? new Set<Animation>();
    animations.add(animation);
    groups.set(group, animations);
    // Using events avoids a rejected .finished promise when a repeated click cancels a run.
    const forget = () => {
      animations.delete(animation);
      if (!animations.size && groups.get(group) === animations) groups.delete(group);
    };
    animation.addEventListener('finish', forget, { once: true });
    animation.addEventListener('cancel', forget, { once: true });
  }

  function stillFeedback(group: 'bowl' | 'coffee') {
    layer.dataset[group] = 'still';
    staticTimers.set(group, setTimeout(() => {
      delete layer.dataset[group];
      staticTimers.delete(group);
    }, 700));
  }

  function syncActivity() {
    const playing = canPlay();
    layer.dataset.active = String(playing);
    layer.dataset.music = String(music);
    layer.dataset.reducedMotion = String(motion.matches);
    if (!playing || motion.matches) {
      cancel('bowl');
      cancel('coffee');
    }
  }

  document.addEventListener('visibilitychange', syncActivity);
  motion.addEventListener('change', syncActivity);
  syncActivity();

  return {
    strikeBowl() {
      if (!canPlay()) return;
      cancel('bowl');
      if (motion.matches || typeof bowl.animate !== 'function') { stillFeedback('bowl'); return; }
      for (const [index, ring] of [...bowl.querySelectorAll('i')].entries()) {
        animate('bowl', ring, [
          { opacity: 0, transform: 'scale(.96)' },
          { opacity: .56 - index * .1, offset: .12, transform: 'scale(1.02)' },
          { opacity: 0, transform: `scale(${1.25 + index * .05},${1.45 + index * .1})` },
        ], { duration: 1700 + index * 450, delay: index * 470, easing: 'cubic-bezier(.2,.7,.3,1)' });
      }
      animate('bowl', bowl.querySelector('b')!, [
        { opacity: .68, transform: 'translateX(0)' },
        { opacity: .5, offset: .08, transform: 'translateX(-.6px)' },
        { opacity: .45, offset: .15, transform: 'translateX(.45px)' },
        { opacity: .3, offset: .25, transform: 'translateX(-.3px)' },
        { opacity: .22, offset: .4, transform: 'translateX(.15px)' },
        { opacity: 0, transform: 'translateX(0)' },
      ], { duration: 2800, easing: 'linear' });
    },
    coffee() {
      if (!canPlay()) return;
      cancel('coffee');
      if (motion.matches || typeof surface.animate !== 'function') { stillFeedback('coffee'); return; }
      for (const [index, ring] of [...surface.querySelectorAll('i')].entries()) {
        animate('coffee', ring, [
          { opacity: 0, transform: 'scale(.3)' },
          { opacity: .42, offset: .18, transform: 'scale(.6)' },
          { opacity: 0, transform: 'scale(1)' },
        ], { duration: 1600, delay: index * 300, easing: 'cubic-bezier(.2,.7,.3,1)' });
      }
      for (const [index, wisp] of [...steam.children].entries()) {
        const drift = index % 2 ? -13 : 16;
        animate('coffee', wisp, [
          { opacity: 0, transform: 'translate(0,17%) scale(.7,.65)' },
          { opacity: .46, offset: .22, transform: `translate(${drift * .22}%,0) scale(.9,.86)` },
          { opacity: .23, offset: .6, transform: `translate(${drift * .6}%,-22%) scale(1.1,1.05)` },
          { opacity: 0, transform: `translate(${drift}%,-48%) scale(1.32,1.15)` },
        ], { duration: 2350, delay: index * 740, easing: 'cubic-bezier(.25,.46,.45,.94)' });
      }
    },
    setMusic(enabled) { if (!destroyed) { music = enabled; syncActivity(); } },
    setClimate(state) {
      if (destroyed) return;
      layer.dataset.time = state.time;
      layer.dataset.season = state.season;
      layer.dataset.weather = state.weather;
    },
    setActive(value) { if (!destroyed) { active = value; syncActivity(); } },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancel('bowl');
      cancel('coffee');
      document.removeEventListener('visibilitychange', syncActivity);
      motion.removeEventListener('change', syncActivity);
      layer.remove();
    },
  };
}
