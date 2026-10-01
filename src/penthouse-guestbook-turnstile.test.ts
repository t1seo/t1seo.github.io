import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mountGuestbookTurnstile, type GuestbookTurnstileState } from './penthouse-guestbook-turnstile.ts';

class FakeElement extends EventTarget {
  readonly ownerDocument: FakeDocument;
  readonly tag: string;
  readonly children: FakeElement[] = [];
  parent: FakeElement | undefined;
  src = '';
  async = false;
  defer = false;
  constructor(document: FakeDocument, tag: string) { super(); this.ownerDocument = document; this.tag = tag; }
  append(child: FakeElement) { child.parent = this; this.children.push(child); }
  remove() {
    const index = this.parent?.children.indexOf(this) ?? -1;
    if (index >= 0) this.parent?.children.splice(index, 1);
    this.parent = undefined;
  }
  replaceChildren() { for (const child of [...this.children]) child.remove(); }
}

class FakeDocument {
  readonly head = new FakeElement(this, 'head');
  readonly defaultView = new FakeView();
  createElement(tag: string) { return new FakeElement(this, tag); }
}

class FakeView {
  turnstile?: NonNullable<Window['turnstile']>;
  setTimeout(callback: () => void, delay: number) { return setTimeout(callback, delay); }
  clearTimeout(handle: ReturnType<typeof setTimeout>) { clearTimeout(handle); }
}

function fixture(t: TestContext) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fakeDocument = new FakeDocument();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: fakeDocument });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else Reflect.deleteProperty(globalThis, 'document');
  });
  const changes: GuestbookTurnstileState[] = [];
  const container = document.createElement('div');
  const controller = mountGuestbookTurnstile(container, 'site-key', state => changes.push(state));
  t.after(() => controller.destroy());
  const renders: Parameters<NonNullable<Window['turnstile']>['render']>[1][] = [];
  const removed: string[] = [];
  const widgets = new Map<string, HTMLElement>();
  const api: NonNullable<Window['turnstile']> = {
    render(target, options) {
      renders.push(options);
      target.append(document.createElement('iframe'));
      const id = `widget-${renders.length}`;
      widgets.set(id, target);
      return id;
    },
    remove(id) { removed.push(id); widgets.get(id)?.replaceChildren(); widgets.delete(id); },
  };
  function load() {
    const script = fakeDocument.head.children.at(-1);
    assert.ok(script);
    fakeDocument.defaultView.turnstile = api;
    script.dispatchEvent(new Event('load'));
    const options = renders.at(-1);
    assert.ok(options);
    return options;
  }
  return { fakeDocument, changes, controller, container, renders, removed, api, load };
}

test('creates the verification script only when the guestbook is mounted', t => {
  // Given: the module was safely imported without document or window.
  const f = fixture(t);
  // When: the guestbook form mounts.
  const scripts = f.fakeDocument.head.children;
  // Then: only the official explicit-render script loads, with a clear loading state.
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0]?.src, 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
  assert.equal(f.changes.at(-1)?.status, 'loading');
});

test('retries a failed script request with a new script and clears the failure', t => {
  const f = fixture(t), first = f.fakeDocument.head.children[0];
  assert.ok(first);
  first.dispatchEvent(new Event('error'));
  assert.equal(f.changes.at(-1)?.status, 'error');
  assert.equal(f.fakeDocument.head.children.length, 0);
  f.controller.retry();
  assert.notEqual(f.fakeDocument.head.children[0], first);
  const options = f.load();
  options.callback('fresh-token');
  t.mock.timers.tick(20_000);
  assert.deepEqual(f.changes.at(-1), { status: 'verified', token: 'fresh-token', message: 'Verification complete.' });
});

test('times out after fifteen seconds and ignores an abandoned script load', t => {
  const f = fixture(t), first = f.fakeDocument.head.children[0];
  assert.ok(first);
  t.mock.timers.tick(14_999);
  assert.equal(f.changes.at(-1)?.status, 'loading');
  t.mock.timers.tick(1);
  assert.equal(f.changes.at(-1)?.status, 'error');
  f.controller.retry();
  first.dispatchEvent(new Event('load'));
  assert.equal(f.changes.at(-1)?.status, 'loading');
  f.load();
  assert.equal(f.changes.at(-1)?.status, 'ready');
});

test('treats script completion without the Turnstile API as a retryable error', t => {
  const f = fixture(t), script = f.fakeDocument.head.children[0];
  assert.ok(script);
  script.dispatchEvent(new Event('load'));
  assert.equal(f.changes.at(-1)?.status, 'error');
  f.controller.retry();
  f.load();
  assert.equal(f.changes.at(-1)?.status, 'ready');
});

test('shares a pending script and leaves the surviving guestbook operational', t => {
  const f = fixture(t), otherChanges: GuestbookTurnstileState[] = [];
  const other = mountGuestbookTurnstile(document.createElement('div'), 'other-key', state => otherChanges.push(state));
  t.after(() => other.destroy());
  f.controller.destroy();
  assert.equal(f.fakeDocument.head.children.length, 1);
  const options = f.load();
  options.callback('other-token');
  assert.equal(f.renders.length, 1);
  assert.equal(options.sitekey, 'other-key');
  assert.equal(otherChanges.at(-1)?.token, 'other-token');
  assert.equal(f.changes.at(-1)?.status, 'loading');
});

test('closing the final loading form releases its script, timeout and callbacks', t => {
  const f = fixture(t), script = f.fakeDocument.head.children[0];
  assert.ok(script);
  f.controller.destroy();
  script.dispatchEvent(new Event('load'));
  t.mock.timers.tick(20_000);
  f.controller.retry();
  assert.equal(f.fakeDocument.head.children.length, 0);
  assert.equal(f.changes.length, 1);
  assert.equal(f.renders.length, 0);
});

test('reset immediately clears a verified token and rejects the old widget callback', t => {
  const f = fixture(t), first = f.load();
  first.callback('first-token');
  f.controller.reset();
  first.callback('stale-token');
  first['error-callback']();
  assert.equal(f.changes.at(-1)?.token, '');
  assert.equal(f.changes.at(-1)?.status, 'ready');
  assert.deepEqual(f.removed, ['widget-1']);
  assert.equal(f.container.children.length, 1);
  f.renders.at(-1)?.callback('replacement-token');
  assert.equal(f.changes.at(-1)?.token, 'replacement-token');
});

test('reuses a loaded API on reopen without retaining the closed iframe', t => {
  const f = fixture(t), options = f.load();
  f.controller.destroy();
  options.callback('stale-token');
  assert.equal(f.container.children.length, 0);
  assert.equal(f.changes.at(-1)?.status, 'ready');
  const other = mountGuestbookTurnstile(f.container, 'site-key', state => f.changes.push(state));
  t.after(() => other.destroy());
  assert.equal(f.fakeDocument.head.children.length, 1);
  assert.equal(f.renders.length, 2);
  assert.equal(f.container.children.length, 1);
});

for (const callback of ['error-callback', 'expired-callback', 'timeout-callback', 'unsupported-callback'] as const) {
  test(`clears an existing token when ${callback} occurs`, t => {
    const f = fixture(t), options = f.load();
    options.callback('existing-token');
    options[callback]();
    assert.equal(f.changes.at(-1)?.status, 'error');
    assert.equal(f.changes.at(-1)?.token, '');
  });
}

test('renders an English flexible dark widget bound to the guestbook action', t => {
  const f = fixture(t), options = f.load();
  assert.equal(options.action, 'guestbook');
  assert.equal(options.theme, 'dark');
  assert.equal(options.size, 'flexible');
  assert.equal(options.language, 'en');
  assert.equal(options['response-field'], false);
  assert.equal(options.retry, 'never');
});

test('a rapid reopen starts a fresh request and ignores the old load event', t => {
  const f = fixture(t), previous = f.fakeDocument.head.children[0];
  assert.ok(previous);
  f.controller.destroy();
  const other = mountGuestbookTurnstile(f.container, 'site-key', state => f.changes.push(state));
  t.after(() => other.destroy());
  previous.dispatchEvent(new Event('error'));
  assert.equal(f.changes.at(-1)?.status, 'loading');
  assert.equal(f.fakeDocument.head.children.length, 1);
  assert.notEqual(f.fakeDocument.head.children[0], previous);
  f.load();
  assert.equal(f.renders.length, 1);
  assert.equal(f.changes.at(-1)?.status, 'ready');
});

test('a provider render exception remains retryable without breaking the form', t => {
  const f = fixture(t), script = f.fakeDocument.head.children[0];
  assert.ok(script);
  f.fakeDocument.defaultView.turnstile = {
    render() { throw new TypeError('Provider could not render'); }, remove() {},
  };
  script.dispatchEvent(new Event('load'));
  assert.equal(f.changes.at(-1)?.status, 'error');
  assert.equal(f.changes.at(-1)?.token, '');
  f.fakeDocument.defaultView.turnstile = f.api;
  f.controller.retry();
  assert.equal(f.changes.at(-1)?.status, 'ready');
  assert.equal(f.renders.length, 1);
});

test('a provider that returns no widget reports an actionable failure', t => {
  const f = fixture(t), script = f.fakeDocument.head.children[0];
  assert.ok(script);
  f.fakeDocument.defaultView.turnstile = { render: () => undefined, remove() {} };
  script.dispatchEvent(new Event('load'));
  assert.equal(f.changes.at(-1)?.status, 'error');
  assert.match(f.changes.at(-1)?.message ?? '', /retry/i);
});
