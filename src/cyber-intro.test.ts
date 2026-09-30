import assert from 'node:assert/strict';
import test from 'node:test';
import { mountCyberIntro } from './cyber-intro.ts';

// A small DOM/clock harness exercises the actual controller without a browser dependency.
function fixture(reduced = false) {
  let now = 0;
  let nextId = 0;
  const tasks = new Map<number, { at: number; callback: () => void }>();
  const media = Object.assign(new EventTarget(), { matches: reduced });

  class Element extends EventTarget {
    ownerDocument!: Page;
    nodeName: string;
    className = '';
    dataset: Record<string, string> = {};
    attributes = new Map<string, string>();
    childNodes: Element[] = [];
    parent: Element | null = null;
    value = '';
    constructor(name: string) { super(); this.nodeName = name.toUpperCase(); }
    get textContent(): string { return this.nodeName === '#TEXT' ? this.value : this.childNodes.map(node => node.textContent).join(''); }
    set textContent(value: string) {
      if (this.nodeName === '#TEXT') this.value = value;
      else this.replaceChildren(this.ownerDocument.text(value));
    }
    append(...nodes: Element[]) {
      for (const node of nodes) {
        if (node.parent) node.parent.childNodes = node.parent.childNodes.filter(child => child !== node);
        node.parent = this;
        this.childNodes.push(node);
      }
    }
    replaceChildren(...nodes: Element[]) {
      this.childNodes.forEach(node => { node.parent = null; });
      this.childNodes = [];
      this.append(...nodes);
    }
    cloneNode(deep = false) {
      const node = this.ownerDocument.createElement(this.nodeName);
      node.className = this.className;
      node.attributes = new Map(this.attributes);
      node.value = this.value;
      if (deep) node.append(...this.childNodes.map(child => child.cloneNode(true)));
      return node;
    }
    dataKey(key: string) { return key.slice(5).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()); }
    setAttribute(key: string, value: string) {
      if (key.startsWith('data-')) this.dataset[this.dataKey(key)] = value;
      else this.attributes.set(key, value);
    }
    getAttribute(key: string) { return key.startsWith('data-') ? this.dataset[this.dataKey(key)] ?? null : this.attributes.get(key) ?? null; }
    removeAttribute(key: string) {
      if (key.startsWith('data-')) delete this.dataset[this.dataKey(key)];
      else this.attributes.delete(key);
    }
    matches(selector: string) { return selector.startsWith('.') ? this.className.split(' ').includes(selector.slice(1)) : this.nodeName === selector.toUpperCase(); }
    querySelectorAll(selector: string): Element[] {
      return this.childNodes.flatMap(node => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]);
    }
    querySelector(selector: string) { return this.querySelectorAll(selector)[0] ?? null; }
  }
  class Page extends EventTarget {
    hidden = false;
    defaultView = { matchMedia: () => media };
    createElement(name: string) {
      const node = new Element(name);
      node.ownerDocument = this;
      return node;
    }
    text(value: string) { const node = this.createElement('#text'); node.value = value; return node; }
  }
  const page = new Page();
  const intro = page.createElement('section');
  const h1 = page.createElement('h1');
  h1.setAttribute('aria-label', 'Taewon Seo');
  const originals: Element[][] = [];
  for (const name of ['Taewon', 'Seo']) {
    const line = page.createElement('span');
    line.className = 'night-title-line';
    const word = page.createElement('span');
    word.textContent = name;
    if (name === 'Seo') {
      const dot = page.createElement('span');
      dot.className = 'night-period';
      dot.textContent = '.';
      word.append(dot);
    }
    line.append(word);
    originals.push([...line.childNodes]);
    h1.append(line);
  }
  const copy = page.createElement('p');
  copy.className = 'night-intro-copy';
  copy.append(page.text('Above the noise.'), page.createElement('br'), page.text('A little closer to the next idea.'));
  const originalCopy = [...copy.childNodes];
  intro.append(h1, copy);
  const old = { setTimeout, clearTimeout };
  globalThis.setTimeout = ((callback: () => void, delay = 0) => {
    const id = ++nextId;
    tasks.set(id, { at: now + delay, callback });
    return id;
  }) as unknown as typeof setTimeout;
  globalThis.clearTimeout = ((id: number) => { tasks.delete(id); }) as unknown as typeof clearTimeout;
  const mount = () => mountCyberIntro(intro as unknown as HTMLElement);
  const controller = mount();
  function advance(duration: number) {
    const until = now + duration;
    let executions = 0;
    while (true) {
      const entry = [...tasks].sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry || entry[1].at > until) break;
      assert.ok(++executions < 100, 'a reveal must always finish');
      now = entry[1].at;
      tasks.delete(entry[0]);
      entry[1].callback();
    }
    now = until;
  }
  return {
    intro, h1, copy, originals, originalCopy, controller, mount, tasks, advance,
    glyphs: () => intro.querySelectorAll('.night-type-glyph'),
    revealed: () => intro.querySelectorAll('.night-type-glyph').filter(glyph => glyph.dataset.revealed).map(glyph => glyph.textContent).join(''),
    caret: () => intro.querySelectorAll('.night-type-glyph').filter(glyph => glyph.dataset.caret),
    copies: () => intro.querySelectorAll('.night-copy-line'),
    motion(value: boolean) { media.matches = value; media.dispatchEvent(new Event('change')); },
    hidden(value: boolean) { page.hidden = value; page.dispatchEvent(new Event('visibilitychange')); },
    restore() { controller.destroy(); globalThis.setTimeout = old.setTimeout; globalThis.clearTimeout = old.clearTimeout; },
  };
}

test('full name and exact copy are reserved from mount, with a stable native accessible heading', t => {
  const f = fixture(); t.after(f.restore);
  assert.equal(f.h1.getAttribute('aria-label'), 'Taewon Seo');
  assert.equal(f.h1.getAttribute('aria-live'), null);
  assert.equal(f.glyphs().map(glyph => glyph.textContent).join(''), 'TaewonSeo.');
  assert.equal(f.revealed(), '');
  assert.equal(f.caret().length, 1);
  assert.equal(f.caret()[0].dataset.caret, 'before');
  f.intro.querySelectorAll('.night-title-line').forEach(line => assert.equal(line.getAttribute('aria-hidden'), 'true'));
  assert.equal(f.copy.querySelector('.night-copy-visual')!.getAttribute('aria-hidden'), 'true');
  assert.deepEqual(f.copy.querySelector('.sr-only')!.childNodes, f.originalCopy);
  assert.deepEqual(f.copies().map(line => line.textContent), ['Above the noise.', 'A little closer to the next idea.']);
  const stableGlyphs = [...f.glyphs()];
  f.advance(3000);
  assert.deepEqual(f.glyphs(), stableGlyphs, 'typing changes opacity state rather than inserting text or altering line allocation');
});

test('name leads, caret tracks the last glyph, line break pauses, and copy settles within two seconds', t => {
  const f = fixture(); t.after(f.restore);
  f.advance(179);
  assert.equal(f.revealed(), '');
  f.advance(1);
  assert.equal(f.revealed(), 'T');
  assert.equal(f.caret()[0].textContent, 'T');
  assert.equal(f.caret()[0].dataset.caret, 'after');
  f.advance(769);
  assert.equal(f.revealed(), 'Taewon');
  assert.equal(f.caret()[0].textContent, 'n');
  f.advance(1);
  assert.equal(f.revealed(), 'TaewonS');
  f.advance(375);
  assert.equal(f.revealed(), 'TaewonSeo.');
  assert.equal(f.caret()[0].textContent, '.');
  assert.ok(f.copies().every(line => !line.dataset.revealed));
  f.advance(130);
  assert.equal(f.copies()[0].dataset.revealed, 'true');
  assert.equal(f.copies()[1].dataset.revealed, undefined);
  f.advance(120);
  assert.equal(f.caret().length, 0);
  assert.equal(f.copies()[1].dataset.revealed, 'true');
  f.advance(425);
  assert.equal(f.intro.dataset.typeState, 'complete');
  assert.equal(f.tasks.size, 0, 'there is no permanent blink, interval, or animation loop');
});

test('hiding cancels all work; repeated visibility calls are harmless and return replays without rebuilding', t => {
  const f = fixture(); t.after(f.restore);
  f.advance(350);
  const revealed = f.revealed();
  const glyphs = [...f.glyphs()];
  const staleCallbacks = [...f.tasks.values()].map(task => task.callback);
  f.controller.setVisible(false);
  assert.equal(f.tasks.size, 0);
  assert.equal(f.caret().length, 0);
  f.advance(5000);
  staleCallbacks.forEach(callback => callback());
  assert.equal(f.revealed(), revealed);
  f.controller.setVisible(true);
  assert.equal(f.revealed(), '');
  assert.deepEqual(f.glyphs(), glyphs);
  f.advance(180);
  f.controller.setVisible(true);
  assert.equal(f.revealed(), 'T', 'an idempotent visible call must not reset the signature');
  f.advance(2000);
  assert.equal(f.revealed(), 'TaewonSeo.');
  for (let i = 0; i < 5; i++) { f.controller.setVisible(false); f.controller.setVisible(true); }
  assert.equal(f.glyphs().length, 10);
  assert.ok(f.tasks.size < 20, 'returns never accumulate duplicate timers');
});

test('a hidden document cancels incomplete reveals and a completed introduction does not replay on tab return', t => {
  const f = fixture(); t.after(f.restore);
  f.advance(400);
  f.hidden(true);
  assert.equal(f.tasks.size, 0);
  assert.equal(f.intro.dataset.typeState, 'paused');
  f.advance(4000);
  f.hidden(false);
  assert.equal(f.revealed(), '');
  f.advance(2000);
  f.hidden(true); f.hidden(false);
  assert.equal(f.revealed(), 'TaewonSeo.');
  assert.equal(f.tasks.size, 0);
  f.controller.setVisible(false);
  f.hidden(true); f.hidden(false);
  assert.equal(f.tasks.size, 0, 'a tab event cannot reopen an explicitly hidden intro');
});

test('reduced motion is immediate on mount and when enabled mid-reveal, without reanimation on preference reversal', t => {
  const f = fixture(true); t.after(f.restore);
  assert.equal(f.revealed(), 'TaewonSeo.');
  assert.ok(f.copies().every(line => line.dataset.revealed));
  assert.equal(f.caret().length, 0);
  assert.equal(f.tasks.size, 0);
  f.motion(false);
  assert.equal(f.tasks.size, 0);
  f.controller.setVisible(false); f.controller.setVisible(true);
  f.advance(300);
  assert.equal(f.revealed(), 'Ta');
  f.motion(true);
  assert.equal(f.revealed(), 'TaewonSeo.');
  assert.equal(f.tasks.size, 0);
  assert.equal(f.caret().length, 0);
});

test('duplicate mount is idempotent; destroy restores original nodes, cancels stale callbacks and permits clean remount', t => {
  const f = fixture(); t.after(f.restore);
  assert.equal(f.mount(), f.controller);
  assert.equal(f.glyphs().length, 10);
  const callbacks = [...f.tasks.values()].map(task => task.callback);
  f.controller.destroy();
  assert.equal(f.tasks.size, 0);
  assert.equal(f.glyphs().length, 0);
  f.intro.querySelectorAll('.night-title-line').forEach((line, index) => {
    assert.deepEqual(line.childNodes, f.originals[index]);
    assert.equal(line.getAttribute('aria-hidden'), null);
  });
  assert.deepEqual(f.copy.childNodes, f.originalCopy);
  assert.equal(f.h1.getAttribute('aria-label'), 'Taewon Seo');
  assert.equal(f.intro.getAttribute('data-type-state'), null);
  f.hidden(true); f.hidden(false); f.motion(true); f.motion(false);
  f.controller.setVisible(false); f.controller.setVisible(true);
  callbacks.forEach(callback => callback());
  assert.equal(f.tasks.size, 0);
  const remounted = f.mount();
  assert.notEqual(remounted, f.controller);
  assert.equal(f.glyphs().length, 10);
  f.advance(2000);
  assert.equal(f.revealed(), 'TaewonSeo.');
  remounted.destroy();
  assert.equal(f.glyphs().length, 0);
});
