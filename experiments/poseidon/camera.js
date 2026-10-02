import { Euler, Vector3, MathUtils } from 'three/webgpu';

// Small, disposable fly controller. Only the focused sea canvas owns the keys.
export function createCameraControls(camera, canvas, onChange) {
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const keys = new Set();
  const euler = new Euler(0, 0, 0, 'YXZ');
  const direction = new Vector3();
  let drag = null;
  let speed = 18;
  const sync = () => euler.setFromQuaternion(camera.quaternion);
  sync();
  canvas.addEventListener('contextmenu', (event) => event.preventDefault(), options);
  canvas.addEventListener('pointerdown', (event) => {
    canvas.focus({ preventScroll: true });
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  }, options);
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    euler.y -= (event.clientX - drag.x) * 0.0022;
    euler.x = MathUtils.clamp(euler.x - (event.clientY - drag.y) * 0.0022, -1.45, 1.45);
    drag.x = event.clientX;
    drag.y = event.clientY;
    camera.quaternion.setFromEuler(euler);
    onChange();
  }, options);
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag, options);
  canvas.addEventListener('pointercancel', endDrag, options);
  canvas.addEventListener('lostpointercapture', endDrag, options);
  canvas.addEventListener('keydown', (event) => {
    if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight'].includes(event.code)) return;
    event.preventDefault();
    keys.add(event.code);
    onChange();
  }, options);
  window.addEventListener('keyup', (event) => keys.delete(event.code), options);
  const clear = () => { keys.clear(); drag = null; };
  canvas.addEventListener('blur', clear, options);
  window.addEventListener('blur', clear, options);
  document.addEventListener('visibilitychange', clear, options);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    speed = MathUtils.clamp(speed * (event.deltaY < 0 ? 1.15 : 1 / 1.15), 2, 150);
  }, { ...options, passive: false });
  return {
    sync,
    update(dt) {
      const axis = (a, b) => Number(keys.has(a)) - Number(keys.has(b));
      direction.set(axis('KeyD', 'KeyA'), 0, axis('KeyS', 'KeyW'));
      direction.normalize().applyQuaternion(camera.quaternion);
      direction.y += axis('KeyE', 'KeyQ');
      const moving = direction.lengthSq() > 0;
      const boost = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 4 : 1;
      camera.position.addScaledVector(direction.normalize(), speed * boost * dt);
      return moving;
    },
    get moving() {
      return keys.has('KeyD') !== keys.has('KeyA') || keys.has('KeyS') !== keys.has('KeyW') || keys.has('KeyE') !== keys.has('KeyQ');
    },
    dispose() { clear(); listeners.abort(); },
  };
}
