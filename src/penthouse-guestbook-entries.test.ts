import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mountGuestbookEntries, createGuestbookEntryElement } from './penthouse-guestbook-entries.ts';
import type { GuestbookApi, GuestbookEntry, GuestbookPage } from './penthouse-guestbook-api.ts';

class GuestbookElement extends EventTarget {
  readonly ownerDocument: GuestbookDocument;
  readonly tag: string;
  readonly children: GuestbookElement[] = [];
  readonly dataset: Record<string, string> = {};
  readonly selectors = new Map<string, GuestbookElement>();
  readonly attributes = new Map<string, string>();
  disabled = false;
  hidden = false;
  textContent = '';
  className = '';
  tabIndex = 0;
  dateTime = '';
  isConnected = true;
  constructor(owner: GuestbookDocument, tag: string) { super(); this.ownerDocument = owner; this.tag = tag; }
  querySelector(selector: string) { return this.selectors.get(selector) ?? null; }
  append(...children: GuestbookElement[]) { this.children.push(...children); }
  replaceChildren(...children: GuestbookElement[]) { this.children.splice(0, this.children.length, ...children); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  contains(element: GuestbookElement): boolean { return this === element || this.children.some(child => child.contains(element)); }
  focus() { this.ownerDocument.activeElement = this; }
}

class GuestbookDocument {
  activeElement: GuestbookElement | null = null;
  createElement(tag: string) { return new GuestbookElement(this, tag); }
}

const entry: GuestbookEntry = { id: 'new', name: 'Guest', message: 'A new note', createdAt: '2026-10-01T11:00:00.000Z' };
const earlier: GuestbookEntry = { id: 'old', name: 'Earlier guest', message: 'An earlier note', createdAt: '2026-10-01T10:00:00.000Z' };
const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

function fixture(t: TestContext) {
  const owner = new GuestbookDocument();
  for (const [key, value] of Object.entries({ document: owner, HTMLElement: GuestbookElement })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => { if (original) Object.defineProperty(globalThis, key, original); else Reflect.deleteProperty(globalThis, key); });
  }
  const root = document.createElement('div');
  const list = owner.createElement('ol');
  const more = owner.createElement('button');
  const refresh = owner.createElement('button');
  const status = owner.createElement('p');
  assert.ok(root instanceof GuestbookElement);
  for (const [selector, element] of [['[data-guestbook-list]', list], ['[data-guestbook-more]', more], ['[data-guestbook-refresh]', refresh], ['[data-guestbook-list-status]', status]] as const) root.selectors.set(selector, element);
  const reads: { readonly cursor: string | null; readonly resolve: (page: GuestbookPage) => void }[] = [];
  const api: GuestbookApi = {
    async readConfig() { return { siteKey: 'key', maxNameLength: 40, maxMessageLength: 1000 }; },
    readEntries(cursor) { return new Promise<GuestbookPage>(resolve => reads.push({ cursor, resolve })); },
    async postEntry() { return entry; },
  };
  const lifetime = new AbortController();
  t.after(() => lifetime.abort());
  const controller = mountGuestbookEntries(root, api, lifetime.signal);
  function resolve(page: GuestbookPage) { const read = reads.shift(); assert.ok(read); read.resolve(page); }
  return { owner, list, more, refresh, status, reads, lifetime, controller, resolve };
}

test('renders public names and messages as text instead of HTML', t => {
  const f = fixture(t);
  const item = createGuestbookEntryElement({ ...entry, name: '<script>bad()</script>', message: '<img src=x onerror=bad()> & hello' }, document);
  assert.ok(item instanceof GuestbookElement);
  assert.equal(item.children[0]?.children[0]?.textContent, '<script>bad()</script>');
  assert.equal(item.children[1]?.textContent, '<img src=x onerror=bad()> & hello');
  assert.deepEqual(item.children.map(child => child.tag), ['header', 'p']);
  f.lifetime.abort();
});

test('merges a new post with an older in-flight initial page and preserves focus', async t => {
  const f = fixture(t);
  f.controller.add(entry);
  await settle();
  f.resolve({ entries: [earlier], nextCursor: 'next' });
  await settle();
  assert.deepEqual(f.list.children.map(child => child.dataset.guestbookId), ['new', 'old']);
  assert.equal(f.more.hidden, false);
  assert.equal(f.owner.activeElement, f.list.children[0]);
});

test('queues a confirmation refresh when an older read is already in flight', async t => {
  const f = fixture(t);
  f.controller.refresh();
  f.resolve({ entries: [earlier], nextCursor: null });
  await settle();
  assert.equal(f.reads.length, 1);
  assert.equal(f.reads[0]?.cursor, null);
  f.resolve({ entries: [entry, earlier], nextCursor: null });
  await settle();
  assert.equal(f.list.children[0]?.dataset.guestbookId, 'new');
});

test('ignores an old response when its panel lifetime has ended', async t => {
  const f = fixture(t);
  f.lifetime.abort();
  f.resolve({ entries: [entry], nextCursor: 'next' });
  await settle();
  assert.equal(f.list.children.length, 0);
});
