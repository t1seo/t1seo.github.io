import type { MilkyPoint } from './cyber-pet-geometry.ts';

interface MilkyDragRuntime {
  readonly available: () => boolean;
  readonly start: () => void;
  readonly move: (offset: Readonly<MilkyPoint>) => void;
  readonly release: (offset: Readonly<MilkyPoint>) => void;
  readonly cancel: () => void;
}
type Gesture = { readonly pointer: number; readonly x: number; readonly y: number; dragging: boolean };

export function mountMilkyToyDrag(target: HTMLButtonElement, runtime: MilkyDragRuntime, signal: AbortSignal) {
  let gesture: Gesture | undefined;
  target.dataset.draggable = 'true';
  function cancel() {
    const previous = gesture;
    gesture = undefined;
    if (previous?.dragging) target.dataset.dragged = 'true';
    target.dataset.dragging = 'false';
    if (previous && target.hasPointerCapture(previous.pointer)) target.releasePointerCapture(previous.pointer);
  }
  function pointerCancel(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointer) return;
    const dragging = gesture.dragging;
    target.dataset.dragged = String(dragging);
    cancel();
    if (dragging) runtime.cancel();
  }
  target.addEventListener('pointerdown', (event) => {
    if (gesture || event.button !== 0 || !event.isPrimary || target.disabled || !runtime.available()) return;
    target.dataset.dragged = 'false';
    gesture = { pointer: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
    target.setPointerCapture(event.pointerId);
  }, { signal });
  target.addEventListener('pointermove', (event) => {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    if (!runtime.available()) { pointerCancel(event); return; }
    const offset = { x: event.clientX - gesture.x, y: event.clientY - gesture.y };
    if (!gesture.dragging && Math.hypot(offset.x, offset.y) < 6) return;
    event.preventDefault();
    if (!gesture.dragging) {
      gesture.dragging = true;
      target.dataset.dragging = 'true';
      runtime.start();
    }
    runtime.move(offset);
  }, { signal });
  target.addEventListener('pointerup', (event) => {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    const current = gesture;
    const offset = { x: event.clientX - current.x, y: event.clientY - current.y };
    target.dataset.dragged = String(current.dragging);
    cancel();
    if (!current.dragging) return;
    event.preventDefault();
    if (runtime.available()) { runtime.move(offset); runtime.release(offset); }
    else runtime.cancel();
  }, { signal });
  target.addEventListener('pointercancel', pointerCancel, { signal });
  target.addEventListener('lostpointercapture', pointerCancel, { signal });
  signal.addEventListener('abort', cancel, { once: true });
  return { cancel };
}
