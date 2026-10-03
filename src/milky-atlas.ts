import './milky-atlas.css';

const SOURCE = '/assets/penthouse/milky-pet/spritesheet.png?v=astra-v1';
const COUNTS = [6, 8, 8, 4, 5, 8, 6, 6, 6, 8, 8] as const;
export const MILKY_ATLAS_FLOOR = 184 / 208;
// Atlas bypasses registerArt's scale/translation. Its floor therefore maps directly
// to the button's 94% world anchor, not the source raster's logical y970.
export const MILKY_FIGURE_FLOOR = .94;
// astra-v1 jump row: measured alpha>128 sole bounds, exclusive bottom pixels.
// The room already lifts the figure along its physical hop. Register each complete
// pose's soles to the common floor so the sheet's airborne offset is not added twice.
// This is rigid presentation translation; it never stretches legs or alters the path.
export const MILKY_JUMP_SOLES = [184, 179, 158, 167, 184] as const;
export const milkyAtlasHopOffset = (row: number, column: number) =>
  row === 4 ? (184 - (MILKY_JUMP_SOLES[column] ?? 184)) / 208 : 0;

/** Rows already contain their intended direction: do not mirror the left row again. */
export function selectMilkyAtlasFrame(pose: string, motion: string, facing: string,
  atlasFrame: number, legacyFrame: number, gaze?: number) {
  const hopping = ['anticipating', 'hopping', 'landing'].includes(motion);
  const moving = pose === 'side' && !hopping;
  if (!hopping && !['idle', 'side', 'blink', 'attend', 'sniff'].includes(pose)) return null;
  if (pose !== 'idle') gaze = undefined;
  const row = hopping ? 4 : moving ? (facing === 'left' ? 2 : 1)
    : gaze !== undefined ? (gaze < 8 ? 9 : 10)
    : pose === 'sniff' ? 8 : pose === 'attend' ? 7 : 0;
  const column = hopping ? (motion === 'anticipating' ? 0 : motion === 'landing' ? 4 : [1, 2, 4, 3][legacyFrame] ?? 1)
    : moving ? (Number.isFinite(atlasFrame) ? ((Math.trunc(atlasFrame) % 8) + 8) % 8 : 0)
    : gaze !== undefined ? gaze % 8 : 0;
  return { row, column, loop: !moving && !hopping && gaze === undefined };
}

/** The Pets sheet is presentation only: the room keeps its existing movement/lifecycle. */
export function mountMilkyAtlas(host: HTMLElement) {
  const button = host.querySelector<HTMLElement>('.cyber-pet-button')!;
  const figure = button.querySelector<HTMLElement>('.cyber-pet-figure')!;
  const page = host.ownerDocument;
  const sprite = page.createElement('span');
  sprite.className = 'milky-atlas';
  sprite.setAttribute('aria-hidden', 'true');
  sprite.style.backgroundImage = `url("${SOURCE}")`;
  sprite.style.setProperty('--milky-atlas-floor', `${MILKY_FIGURE_FLOOR * 100}%`);
  sprite.style.setProperty('--milky-atlas-floor-shift', `${-MILKY_ATLAS_FLOOR * 100}%`);
  figure.append(sprite);
  const image = page.createElement('img');
  let disposed = false;
  let ready = false;
  let animation: Animation | undefined;
  let state = '';
  let gaze: number | undefined;
  const position = (row: number, column: number) => `${column / 7 * 100}% ${row / 10 * 100}%`;
  const enabled = () => button.dataset.active === 'true' && button.dataset.animated === 'true' && !page.hidden;
  function render() {
    if (!ready || disposed) return;
    const pose = button.dataset.pose ?? 'idle';
    if (pose !== 'idle') gaze = undefined;
    const selected = selectMilkyAtlasFrame(pose, button.dataset.motion ?? '', button.dataset.facing ?? 'right',
      Number(button.dataset.atlasFrame ?? 0), Number(button.dataset.frame ?? 0), gaze);
    if (!selected) {
      animation?.cancel(); animation = undefined; state = '';
      delete button.dataset.atlas;
      return;
    }
    button.dataset.atlas = 'ready';
    const { row, column, loop } = selected;
    sprite.style.setProperty('--milky-atlas-hop-offset', `${milkyAtlasHopOffset(row, column) * 100}%`);
    const key = `${row}:${loop ? 'loop' : column}:${enabled()}`;
    if (state === key) return;
    state = key;
    animation?.cancel();
    animation = undefined;
    sprite.style.backgroundPosition = position(row, column);
    // Movement is driven by the room's one existing RAF; idle poses use the browser's
    // declarative animation clock and stop immediately for modal/hidden/still states.
    if (loop && enabled()) {
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
  observer.observe(button, { attributes: true, attributeFilter: ['data-pose', 'data-motion', 'data-frame', 'data-atlas-frame', 'data-facing', 'data-active', 'data-animated'] });
  const onVisibility = () => render();
  page.addEventListener('visibilitychange', onVisibility);
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
    page.removeEventListener('visibilitychange', onVisibility);
    button.removeEventListener('pointermove', aim);
    button.removeEventListener('pointerleave', clearGaze);
    delete button.dataset.atlas;
    sprite.remove();
  } };
}
