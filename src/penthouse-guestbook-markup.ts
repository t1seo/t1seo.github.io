export function guestbookMarkup(): string {
  return `<section class="ph-guestbook" aria-labelledby="ph-dialog-title">
    <p class="ph-overline">A NOTE FROM YOU</p><h2 id="ph-dialog-title" tabindex="-1">The guestbook.</h2>
    <p class="ph-guestbook-intro">A hello, a thought, a little trace of your visit.</p>
    <button class="ph-guestbook-write" type="button" data-guestbook-write aria-expanded="false" aria-controls="guestbook-compose">Leave a note <span aria-hidden="true">↗</span></button>
    <form id="guestbook-compose" class="ph-guestbook-compose" data-guestbook-form hidden>
      <p class="ph-guestbook-notice" id="guestbook-public-notice">Your name and message will be public. No account needed. Please avoid sharing personal information.</p>
      <label for="guestbook-name">Name <span data-guestbook-name-count>0 / 40</span></label>
      <input id="guestbook-name" name="guestbook-name" type="text" maxlength="40" required autocomplete="off" placeholder="How should we call you?" aria-describedby="guestbook-public-notice">
      <label for="guestbook-message">Your note <span data-guestbook-message-count>0 / 1,000</span></label>
      <textarea id="guestbook-message" name="guestbook-message" maxlength="1000" rows="5" required placeholder="Make yourself at home…" aria-describedby="guestbook-public-notice"></textarea>
      <div class="ph-guestbook-trap" aria-hidden="true"><label for="guestbook-website">Leave this field empty</label><input id="guestbook-website" name="website" tabindex="-1" autocomplete="off" type="text"></div>
      <div class="ph-guestbook-verification" data-guestbook-verification></div>
      <p class="ph-guestbook-status" data-guestbook-verification-status role="status"></p>
      <button class="ph-guestbook-text-button" type="button" data-guestbook-verification-retry hidden>Retry verification</button>
      <button class="ph-guestbook-submit" type="submit" data-guestbook-submit disabled>Publish note</button>
      <p class="ph-guestbook-status" data-guestbook-post-status role="status" aria-atomic="true"></p>
      <p class="ph-guestbook-small">Protected against spam with Cloudflare Turnstile.</p>
    </form>
    <section class="ph-guestbook-entries" aria-label="Notes from visitors">
      <div class="ph-guestbook-list-header"><h3>Visitor notes</h3><button class="ph-guestbook-text-button" type="button" data-guestbook-refresh>Refresh</button></div>
      <p class="ph-guestbook-status" data-guestbook-list-status role="status" aria-atomic="true">Opening the guestbook…</p>
      <ol class="ph-guestbook-list" data-guestbook-list></ol>
      <button class="ph-guestbook-more" type="button" data-guestbook-more hidden>Read earlier notes</button>
    </section>
  </section>`;
}

export class GuestbookMarkupError extends Error {
  constructor(selector: string) { super(`Missing guestbook element: ${selector}`); this.name = 'GuestbookMarkupError'; }
}

export function guestbookElement<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new GuestbookMarkupError(selector);
  return element;
}
