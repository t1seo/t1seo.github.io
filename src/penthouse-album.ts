import './penthouse-album.css';
import { albumPage, loadAlbumManifest, AlbumLoadError } from './penthouse-album-data';
import type { AlbumPhoto } from './penthouse-album-data';
import { createAlbumImages } from './penthouse-album-images';
import { createAlbumPage, createAlbumView } from './penthouse-album-view';

type AlbumOptions = {
  readonly host?: HTMLElement;
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
  readonly isStill?: () => boolean;
};

export function createMilkyAlbum(options: AlbumOptions = {}) {
  const view = createAlbumView();
  const images = createAlbumImages();
  const lifetime = new AbortController();
  const narrow = matchMedia('(max-width: 700px), (max-height: 520px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let session: AbortController | undefined;
  let trigger: HTMLElement | undefined;
  let photos: readonly AlbumPhoto[] = [];
  let position: number | null = null;
  let revision = 0;
  let manifestRevision = 0;
  let animation: Animation | undefined;
  let pointer: { readonly x: number; readonly y: number; readonly id: number } | undefined;
  (options.host ?? document.body).append(view.dialog);

  function finish(restore = true) {
    if (!session) return;
    session.abort();
    session = undefined;
    revision += 1;
    manifestRevision += 1;
    animation?.cancel();
    images.clear();
    pointer = undefined;
    if (!restore) return;
    options.onClose?.();
    const candidates = [trigger, ...(options.host ?? document.body).querySelectorAll<HTMLElement>('.ph-room .ph-time-object:not([inert]), .ph-restore')];
    const target = candidates.find(element => element?.isConnected && !element.closest('[hidden], [inert]')
      && Array.from(element.getClientRects()).some(rect => rect.width > 0 && rect.height > 0
        && rect.x + rect.width > 0 && rect.y + rect.height > 0 && rect.x < window.innerWidth && rect.y < window.innerHeight));
    target?.focus({ preventScroll: true });
  }

  function close() { if (view.dialog.open) view.dialog.close(); finish(); }

  function render(direction = 0) {
    if (!session || !photos.length) return;
    revision += 1;
    animation?.cancel();
    if (position === null) {
      images.clear();
      const cover = view.showCover(() => { position = 0; render(1); view.next.focus({ preventScroll: true }); });
      if (document.activeElement === view.previous || document.activeElement === view.coverLink) cover.focus({ preventScroll: true });
      return;
    }
    const current = revision;
    const page = albumPage(position, photos.length, narrow.matches ? 1 : 2);
    const spread = document.createElement('div');
    spread.className = 'ph-album-spread';
    spread.dataset.pages = String(page.indices.length);
    const range = page.indices.length === 1 ? `${page.start + 1}` : `${page.start + 1}–${page.start + page.indices.length}`;
    spread.setAttribute('role', 'group');
    spread.setAttribute('aria-label', `Photographs ${range} of ${photos.length}`);
    const keep = [...page.indices, ...page.next].flatMap(index => { const photo = photos[index]; return photo ? [photo] : []; });
    images.retain(keep);
    for (const index of page.indices) {
      const photo = photos[index];
      if (!photo) continue;
      const leaf = createAlbumPage(photo, index + 1);
      spread.append(leaf.page);
      const load = async (retry = false) => {
        const result = await (retry ? images.retry(photo) : images.load(photo));
        if (current !== revision || !session || !leaf.page.isConnected) return;
        if ('url' in result) leaf.ready(result.url);
        else leaf.failed(() => { void load(true); });
      };
      void load();
    }
    for (const index of page.next) { const photo = photos[index]; if (photo) void images.load(photo); }
    view.stage.replaceChildren(spread);
    view.stage.classList.add('ph-album-stage--open');
    view.coverLink.hidden = false;
    view.previous.disabled = false;
    view.previous.textContent = page.previous === null ? '← Cover' : '← Previous';
    view.next.disabled = page.following === null;
    view.next.textContent = 'Next →';
    view.counter.textContent = `${page.indices.length === 1 ? 'Photo' : 'Photos'} ${range} of ${photos.length}`;
    if (view.next.disabled && document.activeElement === view.next) view.previous.focus({ preventScroll: true });
    if (direction && !reduced.matches && !options.isStill?.() && !document.hidden) {
      animation = spread.animate([
        { opacity: .35, transform: `perspective(1400px) rotateY(${direction * -5}deg) translateX(${direction * 10}px)` },
        { opacity: 1, transform: 'perspective(1400px) rotateY(0deg) translateX(0)' },
      ], { duration: 380, easing: 'cubic-bezier(.2,.65,.25,1)' });
    }
  }

  function move(forward: boolean) {
    if (!photos.length || !session) return;
    if (position === null) { if (forward) { position = 0; render(1); } return; }
    const page = albumPage(position, photos.length, narrow.matches ? 1 : 2);
    if (forward && page.following === null) return;
    position = forward ? page.following : page.previous;
    render(forward ? 1 : -1);
  }

  async function loadManifest() {
    if (!session) return;
    const current = ++manifestRevision;
    const signal = session.signal;
    view.showMessage('Opening the photo album…');
    try {
      const loaded = await loadAlbumManifest(signal);
      if (signal.aborted || current !== manifestRevision) return;
      photos = loaded;
      render();
    } catch (error) {
      if (signal.aborted || current !== manifestRevision) return;
      const message = error instanceof AlbumLoadError ? error.message : new AlbumLoadError().message;
      view.showMessage(message, () => { void loadManifest(); });
    }
  }

  function open(opener?: HTMLElement) {
    if (lifetime.signal.aborted || view.dialog.open) return;
    trigger = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : undefined);
    session = new AbortController();
    position = null;
    view.dialog.showModal();
    options.onOpen?.();
    view.close.focus({ preventScroll: true });
    if (photos.length) render();
    else void loadManifest();
  }

  const events = { signal: lifetime.signal };
  view.close.addEventListener('click', close, events);
  view.coverLink.addEventListener('click', () => { position = null; render(-1); }, events);
  view.previous.addEventListener('click', () => move(false), events);
  view.next.addEventListener('click', () => move(true), events);
  view.dialog.addEventListener('close', () => { if (!view.dialog.open) finish(); }, events);
  view.dialog.addEventListener('cancel', event => { event.preventDefault(); event.stopPropagation(); close(); }, events);
  view.dialog.addEventListener('click', event => { if (event.target === view.dialog) close(); }, events);
  view.dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key) || !photos.length) return;
    event.preventDefault();
    event.stopPropagation();
    switch (event.key) {
      case 'ArrowRight': move(true); break;
      case 'ArrowLeft': move(false); break;
      case 'Home': position = 0; render(-1); break;
      case 'End': position = photos.length - 1; render(1); break;
    }
  }, events);
  view.stage.addEventListener('pointerdown', event => {
    pointer = undefined;
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }, events);
  view.stage.addEventListener('pointerup', event => {
    const start = pointer;
    pointer = undefined;
    if (!start || start.id !== event.pointerId) return;
    const delta = event.clientX - start.x;
    if (Math.abs(delta) > 45 && Math.abs(delta) > Math.abs(event.clientY - start.y) * 1.4) move(delta < 0);
  }, events);
  view.stage.addEventListener('pointercancel', () => { pointer = undefined; }, events);
  narrow.addEventListener('change', () => render(), events);
  reduced.addEventListener('change', () => { if (reduced.matches) animation?.cancel(); }, events);
  document.addEventListener('visibilitychange', () => { if (document.hidden) animation?.cancel(); }, events);

  return { open, close, destroy() { finish(false); lifetime.abort(); view.dialog.remove(); } };
}
