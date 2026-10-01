import { GuestbookApiError, type GuestbookApi, type GuestbookConfig, type GuestbookEntry } from './penthouse-guestbook-api.ts';
import { guestbookElement } from './penthouse-guestbook-markup.ts';
import { mountGuestbookTurnstile } from './penthouse-guestbook-turnstile.ts';

const draft = { name: '', message: '', uncertain: false };

type ComposeActions = {
  readonly published: (entry: GuestbookEntry) => void;
  readonly refresh: () => void;
};

export function mountGuestbookCompose(root: HTMLElement, api: GuestbookApi, lifetime: AbortSignal, actions: ComposeActions) {
  const form = guestbookElement<HTMLFormElement>(root, '[data-guestbook-form]');
  const toggle = guestbookElement<HTMLButtonElement>(root, '[data-guestbook-write]');
  const name = guestbookElement<HTMLInputElement>(form, '#guestbook-name');
  const message = guestbookElement<HTMLTextAreaElement>(form, '#guestbook-message');
  const website = guestbookElement<HTMLInputElement>(form, '#guestbook-website');
  const submit = guestbookElement<HTMLButtonElement>(form, '[data-guestbook-submit]');
  const status = guestbookElement(form, '[data-guestbook-post-status]');
  const verification = guestbookElement(form, '[data-guestbook-verification]');
  const verificationStatus = guestbookElement(form, '[data-guestbook-verification-status]');
  const retry = guestbookElement<HTMLButtonElement>(form, '[data-guestbook-verification-retry]');
  let widget: ReturnType<typeof mountGuestbookTurnstile> | undefined;
  let config: GuestbookConfig | undefined;
  let configuring = false;
  let posting = false;
  let token = '';
  let retryAt = 0;
  let cooldownTimer: ReturnType<typeof setTimeout> | undefined;
  name.value = draft.name;
  message.value = draft.message;
  function update() {
    guestbookElement(form, '[data-guestbook-name-count]').textContent = `${name.value.length} / 40`;
    guestbookElement(form, '[data-guestbook-message-count]').textContent = `${message.value.length.toLocaleString('en-US')} / 1,000`;
    submit.disabled = posting || !token || !name.value.trim() || !message.value.trim() || Date.now() < retryAt;
    submit.textContent = posting ? 'Publishing…' : 'Publish note';
    toggle.disabled = posting;
    name.readOnly = posting;
    message.readOnly = posting;
    form.setAttribute('aria-busy', String(posting));
  }
  async function prepare() {
    if (configuring || widget || lifetime.aborted) return;
    configuring = true;
    retry.hidden = true;
    verificationStatus.textContent = 'Preparing a quick spam check…';
    try {
      config ??= await api.readConfig();
      if (lifetime.aborted) return;
      widget = mountGuestbookTurnstile(verification, config.siteKey, state => {
        if (lifetime.aborted) return;
        token = state.token;
        verificationStatus.textContent = state.message;
        retry.hidden = state.status !== 'error';
        update();
      });
    } catch (error) {
      if (lifetime.aborted) return;
      if (error instanceof GuestbookApiError) {
        verificationStatus.textContent = error.message;
        retry.hidden = false;
      } else throw error;
    } finally { configuring = false; }
  }
  function cooldown(seconds: number) {
    clearTimeout(cooldownTimer);
    retryAt = Date.now() + seconds * 1000;
    const time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(retryAt));
    status.textContent = `Please take a short pause. You can publish again after ${time}. Your draft is still here.`;
    cooldownTimer = setTimeout(() => {
      if (lifetime.aborted) return;
      retryAt = 0;
      status.textContent = 'You can try publishing again. Your draft is still here.';
      update();
    }, seconds * 1000);
  }
  function failure(error: GuestbookApiError) {
    switch (error.code) {
      case 'rate_limited':
        draft.uncertain = false;
        cooldown(error.retryAfter || 60);
        break;
      case 'duplicate_entry':
        draft.uncertain = false;
        status.textContent = 'This note has already been received. Refresh the visitor notes to find it. Your draft is still here.';
        actions.refresh();
        break;
      case 'request_timeout': case 'network_error': case 'invalid_response':
        draft.uncertain = true;
        status.textContent = 'We could not confirm whether your note was published. Your draft is still here. Refresh the visitor notes before trying again.';
        actions.refresh();
        break;
      default:
        draft.uncertain = false;
        status.textContent = `${error.message} Your draft is still here.`;
    }
  }
  async function publish(event: SubmitEvent) {
    event.preventDefault();
    if (posting || !token || Date.now() < retryAt || lifetime.aborted || !form.reportValidity()) return;
    if (!name.value.trim() || !message.value.trim()) {
      status.textContent = 'Please add your name and a note before publishing.';
      return;
    }
    posting = true;
    draft.uncertain = true;
    status.textContent = 'Publishing your note…';
    update();
    try {
      const entry = await api.postEntry({ name: name.value.trim(), message: message.value.trim(), website: website.value, turnstileToken: token });
      if (lifetime.aborted) return;
      draft.message = '';
      draft.uncertain = false;
      message.value = '';
      website.value = '';
      form.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Leave another note ↗';
      widget?.destroy();
      widget = undefined;
      token = '';
      status.textContent = '';
      actions.published(entry);
    } catch (error) {
      if (lifetime.aborted) return;
      if (error instanceof GuestbookApiError) {
        failure(error);
        widget?.reset();
      } else throw error;
    } finally {
      posting = false;
      if (!lifetime.aborted) update();
    }
  }
  toggle.addEventListener('click', () => {
    form.hidden = !form.hidden;
    toggle.setAttribute('aria-expanded', String(!form.hidden));
    toggle.textContent = form.hidden ? 'Leave a note ↗' : 'Close writing';
    if (!form.hidden) {
      if (draft.uncertain) status.textContent = 'Your last note may have been published. Refresh the visitor notes before trying again. Your draft is still here.';
      name.focus();
      void prepare();
    }
  }, { signal: lifetime });
  form.addEventListener('input', () => {
    draft.name = name.value;
    draft.message = message.value;
    update();
  }, { signal: lifetime });
  form.addEventListener('submit', event => { void publish(event); }, { signal: lifetime });
  retry.addEventListener('click', () => { if (widget) widget.retry(); else void prepare(); }, { signal: lifetime });
  update();
  return { destroy() { clearTimeout(cooldownTimer); widget?.destroy(); } };
}
