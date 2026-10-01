export type GuestbookTurnstileState = {
  readonly token: string;
  readonly status: 'loading' | 'ready' | 'verified' | 'error';
  readonly message: string;
};

type TurnstileOptions = {
  readonly sitekey: string;
  readonly action: 'guestbook';
  readonly theme: 'dark';
  readonly size: 'flexible';
  readonly language: 'en';
  readonly retry: 'never';
  readonly 'refresh-expired': 'never';
  readonly 'refresh-timeout': 'never';
  readonly 'response-field': false;
  readonly callback: (token: string) => void;
  readonly 'error-callback': () => void;
  readonly 'expired-callback': () => void;
  readonly 'timeout-callback': () => void;
  readonly 'unsupported-callback': () => void;
};

type TurnstileApi = {
  readonly render: (container: HTMLElement, options: TurnstileOptions) => string | undefined;
  readonly remove: (widget: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

type Subscriber = (api: TurnstileApi | undefined) => void;
type PendingScript = { readonly subscribe: (subscriber: Subscriber) => () => void };
const pendingScripts = new WeakMap<Document, PendingScript>();

function loadTurnstile(document: Document, view: Window, subscriber: Subscriber): () => void {
  if (view.turnstile) { subscriber(view.turnstile); return () => {}; }
  const pending = pendingScripts.get(document);
  if (pending) return pending.subscribe(subscriber);
  const subscribers = new Set<Subscriber>();
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  let settled = false;
  const finish = (api?: TurnstileApi) => {
    if (settled) return;
    settled = true;
    view.clearTimeout(timeout);
    script.removeEventListener('load', loaded);
    script.removeEventListener('error', failed);
    pendingScripts.delete(document);
    if (!api) script.remove();
    const receivers = [...subscribers];
    subscribers.clear();
    for (const receiver of receivers) receiver(api);
  };
  const loaded = () => finish(view.turnstile);
  const failed = () => finish();
  const timeout = view.setTimeout(failed, 15_000);
  script.addEventListener('load', loaded);
  script.addEventListener('error', failed);
  const loading: PendingScript = {
    subscribe(receiver) {
      subscribers.add(receiver);
      return () => {
        subscribers.delete(receiver);
        if (!settled && subscribers.size === 0) finish();
      };
    },
  };
  pendingScripts.set(document, loading);
  const release = loading.subscribe(subscriber);
  document.head.append(script);
  return release;
}

export function mountGuestbookTurnstile(
  container: HTMLElement,
  siteKey: string,
  onChange: (state: GuestbookTurnstileState) => void,
) {
  const document = container.ownerDocument;
  const view = document.defaultView;
  let destroyed = false;
  let generation = 0;
  let releaseLoad = () => {};
  let widget: { readonly api: TurnstileApi; readonly id: string } | undefined;
  const removeWidget = () => {
    const previous = widget;
    widget = undefined;
    if (previous) previous.api.remove(previous.id);
    container.replaceChildren();
  };
  const start = () => {
    if (destroyed) return;
    const current = ++generation;
    releaseLoad();
    removeWidget();
    const emit = (status: GuestbookTurnstileState['status'], message: string, token = '') => {
      if (!destroyed && current === generation) onChange({ status, message, token });
    };
    emit('loading', 'Loading verification…');
    if (!view || !siteKey.trim()) {
      emit('error', 'Verification is unavailable. Please try again later.');
      return;
    }
    releaseLoad = loadTurnstile(document, view, api => {
      if (destroyed || current !== generation) return;
      if (!api) {
        emit('error', 'Verification could not load. Please retry.');
        return;
      }
      emit('ready', 'Complete the verification to leave a note.');
      try {
        const id = api.render(container, {
          sitekey: siteKey, action: 'guestbook', theme: 'dark', size: 'flexible', language: 'en',
          retry: 'never', 'refresh-expired': 'never', 'refresh-timeout': 'never', 'response-field': false,
          callback: token => {
            if (token) emit('verified', 'Verification complete.', token);
            else emit('error', 'Verification failed. Please retry.');
          },
          'error-callback': () => emit('error', 'Verification failed. Please retry.'),
          'expired-callback': () => emit('error', 'Verification expired. Please retry.'),
          'timeout-callback': () => emit('error', 'Verification timed out. Please retry.'),
          'unsupported-callback': () => emit('error', 'Verification is unavailable in this browser.'),
        });
        if (id === undefined) emit('error', 'Verification could not start. Please retry.');
        else if (destroyed || current !== generation) api.remove(id);
        else widget = { api, id };
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        container.replaceChildren();
        emit('error', 'Verification could not start. Please retry.');
      }
    });
  };
  start();
  return {
    retry: start,
    reset: start,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      generation++;
      releaseLoad();
      removeWidget();
    },
  };
}
