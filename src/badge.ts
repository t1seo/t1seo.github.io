import './badge.css';

/** A real, responsive card: the public jieun.ai artwork is used only for its logo and QR. */
export function mountBadge(container: HTMLElement, options: { onPull?: () => void } = {}): { destroy(): void } {
  const root = document.createElement('div');
  root.className = 'id-badge-root';
  root.innerHTML = `
    <div class="id-badge-rail" aria-hidden="true"></div>
    <div class="id-badge-swing">
      <div class="id-badge-lanyard" aria-hidden="true"><span></span></div>
      <div class="id-badge-card">
        <div class="id-badge-flipper">
          <article class="id-badge-face id-badge-front" aria-label="Jieun Jeon 사원증 앞면">
            <div class="id-badge-hole" aria-hidden="true"></div>
            <header class="id-badge-header">
              <div class="id-badge-brand">
                <img class="id-badge-brand-mark" src="/assets/badge/jieun-mark.svg" alt="" draggable="false" />
                <div class="id-badge-brand-text"><b>jieun.ai</b><small>Software Engineer</small></div>
              </div>
              <div class="id-badge-pillars"><span>Learn</span><span>Build</span><span>Share</span><i></i></div>
            </header>
            <div class="id-badge-photo">
              <img src="/assets/badge/jieun-mark.svg" alt="동그란 안경을 쓴 파란색 지은 캐릭터" draggable="false" />
            </div>
            <h2 class="id-badge-name">Jieun Jeon</h2>
            <p class="id-badge-role">Software Engineer</p>
            <div class="id-badge-divider" aria-hidden="true"></div>
            <div class="id-badge-idrow">
              <dl class="id-badge-details">
                <div><dt>ID</dt><dd>—</dd></div>
                <div><dt>Location</dt><dd>Korea</dd></div>
                <div><dt>Valid Thru</dt><dd>—</dd></div>
              </dl>
              <img class="id-badge-qr id-badge-qr-small" src="/assets/badge/ai-class-qr.svg" alt="AI Class 웹사이트 QR 코드" draggable="false" />
            </div>
            <footer class="id-badge-footer">Build <i>·</i> Ship <i>·</i> Iterate</footer>
          </article>
          <article class="id-badge-face id-badge-back" aria-label="사원증 뒷면, AI Class 소개" aria-hidden="true" inert>
            <div class="id-badge-hole" aria-hidden="true"></div>
            <div class="id-badge-stripe" aria-hidden="true"></div>
            <div class="id-badge-idnum"><span>NO. —</span><em>ALWAYS LEARNING</em></div>
            <div class="id-badge-barcode" aria-hidden="true"></div>
            <div class="id-badge-backrow">
              <img class="id-badge-qr" src="/assets/badge/ai-class-qr.svg" alt="learn.jieun.ai로 연결되는 QR 코드" draggable="false" />
              <div class="id-badge-scan"><b>AI Class</b>learn.jieun.ai<br />Building with<br />AI agents</div>
            </div>
            <div class="id-badge-signature"><div>Jieun Jeon</div><small>Behind the code</small></div>
          </article>
        </div>
        <button class="id-badge-flip" type="button" aria-label="사원증 뒤집기. 현재 앞면" aria-pressed="false" title="눌러서 뒤집기 · 끌어서 흔들기"></button>
        <a class="id-badge-link" href="https://learn.jieun.ai" target="_blank" rel="noopener noreferrer" hidden>AI Class 방문하기 <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <p class="id-badge-hint" aria-hidden="true"><span>↔</span> Drag to swing · Click to flip</p>
    <span class="id-badge-announcement" role="status" aria-live="polite"></span>
  `;
  container.append(root);

  const swing = root.querySelector<HTMLElement>('.id-badge-swing')!;
  const flipper = root.querySelector<HTMLElement>('.id-badge-flipper')!;
  const front = root.querySelector<HTMLElement>('.id-badge-front')!;
  const back = root.querySelector<HTMLElement>('.id-badge-back')!;
  const button = root.querySelector<HTMLButtonElement>('.id-badge-flip')!;
  const link = root.querySelector<HTMLAnchorElement>('.id-badge-link')!;
  const announcement = root.querySelector<HTMLElement>('.id-badge-announcement')!;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController();
  const eventOptions = { signal: abort.signal };
  let flipped = false;
  let destroyed = false;
  let angle = 0;
  let velocity = 0;
  let pull = 0;
  let pullVelocity = 0;
  let frame = 0;
  let previousTime = 0;
  let suppressClick = false;
  let drag: { id: number; x: number; y: number; polar: number; angle: number; maxDistance: number; lastTime: number; lastX: number; lastY: number; pivotX: number; pivotY: number; startPull: number; threshold: number; direction: 'pull' | 'swing' | null; armed: boolean } | null = null;

  const updateLabel = () => button.setAttribute('aria-label', `Flip ID badge. Currently showing the ${flipped ? 'back' : 'front'}.${options.onPull ? ' Press Arrow Down to open portfolio.' : ''}`);
  updateLabel();
  if (options.onPull) button.setAttribute('aria-keyshortcuts', 'ArrowDown');

  const reducedMotion = () => {
    const preference = root.closest('[data-motion="on"], [data-motion="true"], [data-motion="off"], [data-motion="false"]')?.getAttribute('data-motion');
    if (preference === 'on' || preference === 'true') return false;
    if (preference === 'off' || preference === 'false') return true;
    return media.matches;
  };
  const paint = () => {
    swing.style.transform = `rotate(${angle.toFixed(3)}deg)`;
    root.style.setProperty('--badge-pull', `${pull.toFixed(3)}px`);
  };
  const stopFrame = () => { cancelAnimationFrame(frame); frame = 0; };
  const rest = () => { stopFrame(); angle = 0; velocity = 0; pull = 0; pullVelocity = 0; paint(); };
  const syncMotion = () => {
    const reduced = reducedMotion();
    root.dataset.badgeMotion = reduced ? 'off' : 'on';
    if (reduced && !drag) rest();
  };
  // Resolve motion once for both physics and CSS, so explicit settings override the OS default.
  const motionObserver = new MutationObserver(syncMotion);
  for (let ancestor: HTMLElement | null = root; ancestor; ancestor = ancestor.parentElement) {
    motionObserver.observe(ancestor, { attributes: true, attributeFilter: ['data-motion'] });
  }
  syncMotion();

  const settle = (time: number) => {
    if (destroyed) return;
    if (reducedMotion()) { rest(); return; }
    const delta = Math.min((time - previousTime) / 1000, 0.032);
    previousTime = time;
    velocity += (-52 * angle - 7.5 * velocity) * delta;
    angle += velocity * delta;
    pullVelocity += (-150 * pull - 24 * pullVelocity) * delta;
    pull = Math.max(0, pull + pullVelocity * delta);
    paint();
    if (Math.abs(angle) < 0.025 && Math.abs(velocity) < 0.08 && pull < 0.1 && Math.abs(pullVelocity) < 0.2) rest();
    else frame = requestAnimationFrame(settle);
  };

  const finishDrag = (cancelled = false) => {
    if (!drag) return;
    const pointerId = drag.id;
    const openPortfolio = !cancelled && drag.armed && !!options.onPull;
    if (performance.now() - drag.lastTime > 100) velocity = 0;
    suppressClick = cancelled || drag.maxDistance > 6;
    drag = null;
    root.classList.remove('id-badge-dragging', 'id-badge-pull-armed');
    if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
    if (reducedMotion()) rest();
    else {
      velocity = Math.max(-90, Math.min(90, velocity));
      previousTime = performance.now();
      frame = requestAnimationFrame(settle);
    }
    // Clear capture and drag state first: navigation may synchronously destroy this badge.
    if (openPortfolio && !destroyed) options.onPull?.();
  };

  const moveDrag = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.maxDistance = Math.max(drag.maxDistance, Math.hypot(dx, dy));
    if (drag.maxDistance <= 6) return;
    if (!drag.direction && Math.hypot(dx, dy) >= 12) {
      drag.direction = options.onPull && dy > Math.abs(dx) * 1.25 ? 'pull' : 'swing';
    }
    if (drag.direction === 'pull') {
      const downward = Math.max(0, drag.startPull + dy);
      pull = Math.min(drag.threshold + 56, downward <= drag.threshold ? downward : drag.threshold + (downward - drag.threshold) * .34);
      drag.armed = dy >= drag.threshold && dy > Math.abs(dx) * 1.25;
      root.classList.toggle('id-badge-pull-armed', drag.armed);
    }
    const polar = Math.atan2(event.clientX - drag.pivotX, event.clientY - drag.pivotY);
    const next = Math.max(-24, Math.min(24, drag.angle - (polar - drag.polar) * 180 / Math.PI));
    const now = performance.now();
    // A pointerup often repeats the last sampled position; preserve fling momentum.
    if (event.clientX !== drag.lastX || event.clientY !== drag.lastY) {
      velocity = (next - angle) / Math.max((now - drag.lastTime) / 1000, 0.016);
      drag.lastTime = now;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
    }
    angle = next;
    paint();
  };

  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isPrimary || drag) return;
    stopFrame();
    suppressClick = false;
    velocity = 0;
    pullVelocity = 0;
    const bounds = root.getBoundingClientRect();
    const pivotX = bounds.left + bounds.width / 2;
    const pivotY = bounds.top;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, polar: Math.atan2(event.clientX - pivotX, event.clientY - pivotY), angle, maxDistance: 0, lastTime: performance.now(), lastX: event.clientX, lastY: event.clientY, pivotX, pivotY, startPull: pull, threshold: Math.min(110, Math.max(84, window.innerHeight * .12)), direction: null, armed: false };
    button.setPointerCapture(event.pointerId);
    root.classList.add('id-badge-dragging', 'id-badge-discovered');
  }, eventOptions);

  button.addEventListener('pointermove', moveDrag, eventOptions);

  button.addEventListener('pointerup', (event) => {
    if (event.pointerId !== drag?.id) return;
    moveDrag(event);
    finishDrag();
  }, eventOptions);
  button.addEventListener('pointercancel', (event) => { if (event.pointerId === drag?.id) finishDrag(true); }, eventOptions);
  button.addEventListener('lostpointercapture', (event) => { if (event.pointerId === drag?.id) finishDrag(true); }, eventOptions);
  button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && options.onPull) {
      event.preventDefault();
      if (!event.repeat && !drag) options.onPull();
    }
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
  }, eventOptions);

  button.addEventListener('click', (event) => {
    if (suppressClick && event.detail > 0) { suppressClick = false; return; }
    flipped = !flipped;
    root.classList.toggle('id-badge-is-flipped', flipped);
    root.classList.add('id-badge-discovered');
    flipper.style.transform = flipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
    front.setAttribute('aria-hidden', String(flipped));
    front.inert = flipped;
    back.setAttribute('aria-hidden', String(!flipped));
    back.inert = !flipped;
    link.hidden = !flipped;
    button.setAttribute('aria-pressed', String(flipped));
    updateLabel();
    announcement.textContent = flipped ? '사원증 뒷면입니다. AI Class를 방문할 수 있습니다.' : 'Jieun Jeon 사원증 앞면입니다.';
  }, eventOptions);

  media.addEventListener('change', syncMotion, eventOptions);
  window.addEventListener('blur', () => { finishDrag(true); rest(); }, eventOptions);
  window.addEventListener('resize', () => { finishDrag(true); rest(); }, eventOptions);

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      finishDrag(true);
      stopFrame();
      motionObserver.disconnect();
      abort.abort();
      root.remove();
    },
  };
}
