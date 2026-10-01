type GuestbookModule = {
  readonly guestbookMarkup: () => string;
  readonly mountGuestbook: (panel: HTMLElement, apiUrl: string) => { destroy(): void };
};

type GuestbookLoader = () => Promise<GuestbookModule>;

export function createGuestbookPanel(
  content: HTMLElement,
  apiUrl: string,
  load: GuestbookLoader = () => import('./penthouse-guestbook'),
) {
  let revision = 0;
  let mounted: { destroy(): void } | undefined;
  let events: AbortController | undefined;

  function close() {
    revision += 1;
    events?.abort();
    mounted?.destroy();
    mounted = undefined;
  }

  async function open() {
    close();
    const current = revision;
    events = new AbortController();
    content.innerHTML = '<p class="ph-overline">A NOTE BEFORE YOU GO</p><h2 id="ph-dialog-title" tabindex="-1">Guestbook.</h2><p role="status">Opening the guestbook…</p>';
    try {
      const module = await load();
      if (current !== revision || !content.isConnected) return;
      const restoreFocus = content.contains(document.activeElement);
      content.innerHTML = module.guestbookMarkup();
      mounted = module.mountGuestbook(content, apiUrl);
      if (restoreFocus) {
        const heading = content.querySelector<HTMLElement>('#ph-dialog-title');
        heading?.setAttribute('tabindex', '-1');
        heading?.focus();
      }
    } catch (error) {
      if (current !== revision || !content.isConnected) return;
      if (!(error instanceof Error)) throw error;
      content.innerHTML = '<h2 id="ph-dialog-title" tabindex="-1">Guestbook.</h2><p role="status">The guestbook could not open. Please try again.</p><button type="button" data-guestbook-retry>Try again</button>';
      content.querySelector('[data-guestbook-retry]')?.addEventListener('click', () => { void open(); }, { signal: events.signal });
      content.querySelector<HTMLButtonElement>('[data-guestbook-retry]')?.focus();
    }
  }

  return { open, close };
}
