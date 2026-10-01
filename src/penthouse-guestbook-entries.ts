import { GuestbookApiError, type GuestbookApi, type GuestbookEntry } from './penthouse-guestbook-api.ts';
import { guestbookElement } from './penthouse-guestbook-markup.ts';

export function createGuestbookEntryElement(entry: GuestbookEntry, document: Document): HTMLLIElement {
  const item = document.createElement('li');
  item.className = 'ph-guestbook-entry';
  item.tabIndex = -1;
  item.dataset.guestbookId = entry.id;
  const header = document.createElement('header');
  const name = document.createElement('strong');
  name.textContent = entry.name;
  const date = document.createElement('time');
  date.dateTime = entry.createdAt;
  date.textContent = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(entry.createdAt));
  const message = document.createElement('p');
  message.textContent = entry.message;
  header.append(name, date);
  item.append(header, message);
  return item;
}

export function mountGuestbookEntries(root: HTMLElement, api: GuestbookApi, lifetime: AbortSignal) {
  const list = guestbookElement<HTMLOListElement>(root, '[data-guestbook-list]');
  const status = guestbookElement(root, '[data-guestbook-list-status]');
  const refresh = guestbookElement<HTMLButtonElement>(root, '[data-guestbook-refresh]');
  const more = guestbookElement<HTMLButtonElement>(root, '[data-guestbook-more]');
  const entries = new Map<string, GuestbookEntry>();
  const published = new Map<string, GuestbookEntry>();
  let cursor: string | null = null;
  let loading = false;
  let refreshRequested = false;
  function render(focusId?: string) {
    const active = root.ownerDocument.activeElement;
    const focusedEntry = active instanceof HTMLElement && list.contains(active) ? active.dataset.guestbookId : undefined;
    const nextFocus = focusId ?? focusedEntry;
    const sorted = [...entries.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    list.replaceChildren(...sorted.map(entry => {
      const item = createGuestbookEntryElement(entry, root.ownerDocument);
      if (entry.id === nextFocus) queueMicrotask(() => { if (!lifetime.aborted && item.isConnected) item.focus(); });
      return item;
    }));
  }
  async function load(reset: boolean) {
    if (lifetime.aborted) return;
    if (loading) { refreshRequested ||= reset; return; }
    loading = true;
    refresh.disabled = true;
    more.disabled = true;
    list.setAttribute('aria-busy', 'true');
    status.textContent = reset ? 'Opening the guestbook…' : 'Loading earlier notes…';
    try {
      const page = await api.readEntries(reset ? null : cursor);
      if (lifetime.aborted) return;
      if (reset) entries.clear();
      page.entries.forEach(entry => entries.set(entry.id, entry));
      published.forEach(entry => entries.set(entry.id, entry));
      cursor = page.nextCursor;
      render();
      more.hidden = !cursor;
      status.textContent = entries.size ? '' : 'The first page is yours. Leave a little hello.';
    } catch (error) {
      if (lifetime.aborted) return;
      if (error instanceof GuestbookApiError) status.textContent = `${error.message} ${entries.size ? 'The notes already on screen are still here.' : 'Select Refresh to try again.'}`;
      else throw error;
    } finally {
      if (!lifetime.aborted) {
        loading = false;
        refresh.disabled = false;
        more.disabled = false;
        list.setAttribute('aria-busy', 'false');
        if (refreshRequested) { refreshRequested = false; void load(true); }
      }
    }
  }
  refresh.addEventListener('click', () => { void load(true); }, { signal: lifetime });
  more.addEventListener('click', () => { void load(false); }, { signal: lifetime });
  void load(true);
  return {
    add(entry: GuestbookEntry) {
      published.set(entry.id, entry);
      entries.set(entry.id, entry);
      status.textContent = 'Your note is now part of the guestbook.';
      render(entry.id);
    },
    refresh() { void load(true); },
  };
}
