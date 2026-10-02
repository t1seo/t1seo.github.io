import './milky-atlas.css';

const SOURCE = '/assets/penthouse/milky-pet/spritesheet.png';
const COUNTS = [6, 8, 8, 4, 5, 8, 6, 6, 6, 8, 8] as const;
/** The Pets sheet is presentation only: the room keeps its existing movement/lifecycle. */
export function mountMilkyAtlas(host: HTMLElement) {
  const button = host.querySelector<HTMLElement>('.cyber-pet-button')!;
  const figure = button.querySelector<HTMLElement>('.cyber-pet-figure')!;
  const sprite = document.createElement('span');
  sprite.className = 'milky-atlas';
  sprite.setAttribute('aria-hidden', 'true');
  figure.append(sprite);
  const image = new Image();
  let disposed = false;
  let ready = false;
  let animation: Animation | undefined;
  let state = '';
  let gaze: number | undefined;
  const view = host.ownerDocument.defaultView!;
  const position = (row: number, column: number) => `${column / 7 * 100}% ${row / 10 * 100}%`;
  const enabled = () => button.dataset.active === 'true' && button.dataset.animated === 'true' && !document.hidden;
  function render() {
    if (!ready || disposed) return;
    const pose = button.dataset.pose ?? 'idle';
    const hopping = ['anticipating', 'hopping', 'landing'].includes(button.dataset.motion ?? '');
    const moving = pose === 'side' && !hopping;
    if (pose !== 'idle') gaze = undefined;
    if (!hopping && !['idle', 'side', 'blink', 'attend', 'sniff'].includes(pose)) {
      animation?.cancel(); animation = undefined; state = '';
      delete button.dataset.atlas;
      return;
    }
    button.dataset.atlas = 'ready';
    const row = hopping ? 4 : moving ? (button.dataset.facing === 'left' ? 2 : 1)
      : gaze !== undefined ? (gaze < 8 ? 9 : 10)
      : pose === 'sniff' ? 8 : pose === 'attend' ? 7 : 0;
    const gaitSet = button.querySelector<HTMLElement>('.cyber-pet-step[data-visible="true"]')?.dataset.set;
    const column = hopping ? (button.dataset.motion === 'anticipating' ? 1 : button.dataset.motion === 'landing' ? 4 : [1, 2, 4, 3][Number(button.dataset.frame ?? 0)]) : moving ? (Number(button.dataset.frame ?? 0) * (gaitSet === 'trot' ? 2 : 1)) % 8 : gaze !== undefined ? gaze % 8 : 0;
    sprite.style.setProperty('--milky-atlas-scale', moving ? '1.42' : hopping ? '1.07' : '1');
    const key = `${row}:${moving || hopping || gaze !== undefined ? column : 'loop'}:${enabled()}`;
    if (state === key) return;
    state = key;
    animation?.cancel();
    animation = undefined;
    sprite.style.backgroundPosition = position(row, column);
    // Movement is driven by the room's one existing RAF; idle poses use the browser's
    // declarative animation clock and stop immediately for modal/hidden/still states.
    if (!moving && !hopping && gaze === undefined && enabled()) {
      const count = COUNTS[row];
      const frames = Array.from({ length: count + 1 }, (_, i) => ({
        backgroundPosition: position(row, i % count), offset: i / count,
      }));
      animation = sprite.animate(frames, { duration: row === 0 ? 2400 : count * 180, iterations: Infinity, easing: 'steps(1, end)' });
    }
    sprite.dataset.row = String(row);
    sprite.dataset.frame = String(column);
  }
  const observer = new MutationObserver(render);
  observer.observe(button, { attributes: true, attributeFilter: ['data-pose', 'data-motion', 'data-frame', 'data-facing', 'data-active', 'data-animated'] });
  const onVisibility = () => render();
  document.addEventListener('visibilitychange', onVisibility);
  const aim = (event: PointerEvent) => {
    if (!enabled() || button.dataset.pose !== 'idle' || event.pointerType === 'touch') return;
    const bounds = button.getBoundingClientRect();
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height * .25);
    gaze = (Math.round(Math.atan2(dx, -dy) / (Math.PI * 2) * 16) + 16) % 16;
    render();
  };
  const clearGaze = () => { gaze = undefined; render(); };
  button.addEventListener('pointermove', aim);
  button.addEventListener('pointerleave', clearGaze);
  image.src = SOURCE;
  void image.decode().then(() => {
    if (disposed || image.naturalWidth !== 1536 || image.naturalHeight !== 2288) return;
    ready = true;
    button.dataset.atlas = 'ready';
    render();
  }).catch(() => { /* Keep the existing artwork if the new sheet cannot decode. */ });
  return { destroy() {
    disposed = true;
    animation?.cancel(); observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    button.removeEventListener('pointermove', aim);
    button.removeEventListener('pointerleave', clearGaze);
    delete button.dataset.atlas;
    sprite.remove();
  } };
}
