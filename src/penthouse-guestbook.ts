import './penthouse-guestbook.css';
import { createGuestbookApi } from './penthouse-guestbook-api.ts';
import { mountGuestbookCompose } from './penthouse-guestbook-compose.ts';
import { mountGuestbookEntries } from './penthouse-guestbook-entries.ts';
import { guestbookElement } from './penthouse-guestbook-markup.ts';
export { guestbookMarkup } from './penthouse-guestbook-markup.ts';

export function mountGuestbook(panelElement: HTMLElement, apiUrl: string): { destroy(): void } {
  const lifetime = new AbortController();
  if (!apiUrl.trim()) {
    guestbookElement<HTMLButtonElement>(panelElement, '[data-guestbook-write]').disabled = true;
    guestbookElement<HTMLButtonElement>(panelElement, '[data-guestbook-refresh]').hidden = true;
    guestbookElement(panelElement, '[data-guestbook-list-status]').textContent = 'The guestbook is not connected yet. Please visit again a little later.';
    return { destroy() { lifetime.abort(); } };
  }
  const api = createGuestbookApi(apiUrl.trim(), lifetime.signal);
  const entries = mountGuestbookEntries(panelElement, api, lifetime.signal);
  const compose = mountGuestbookCompose(panelElement, api, lifetime.signal, { published: entries.add, refresh: entries.refresh });
  return { destroy() { lifetime.abort(); compose.destroy(); } };
}
