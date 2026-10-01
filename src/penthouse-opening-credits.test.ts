import test from 'node:test';
import assert from 'node:assert/strict';
import { openingCreditsMarkup } from './penthouse-opening-credits.ts';
import { openingFixture as fixture } from './penthouse-opening-credits-test-fixture.ts';

test('reserves every name character in decorative markup before animation begins', () => {
  const markup = openingCreditsMarkup();
  assert.ok(markup.includes('aria-hidden="true"'));
  assert.ok(markup.includes('A PERSONAL SPACE'));
  assert.equal(markup.match(/data-opening-letter/g)?.length, 10);
  assert.ok(!markup.includes('aria-live'));
});

test('introduces the eyebrow, deliberately types the name, then holds and fades before the idle interval', t => {
  const f = fixture(t);
  assert.equal(f.host.hidden, false);
  assert.equal(f.text(), '');
  f.advance(1000);
  assert.equal(f.host.dataset.phase, 'introducing');
  assert.equal(f.text(), '');
  f.advance(1000);
  assert.equal(f.text(), 'T');
  f.advance(2240);
  assert.equal(f.text(), 'TAEWON SEO');
  assert.equal(f.host.dataset.phase, 'holding');
  f.advance(4199);
  assert.equal(f.host.dataset.phase, 'holding');
  f.advance(1);
  assert.equal(f.host.dataset.phase, 'fading');
  f.advance(1600);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 1);
  f.visibility(true); f.visibility(false); f.motion(true);
  assert.equal(f.tasks.size, 1);
});

test('pauses briefly between the first and last name', t => {
  const f = fixture(t);
  f.advance(3320);
  assert.equal(f.text(), 'TAEWON ');
  f.advance(479);
  assert.equal(f.text(), 'TAEWON ');
  f.advance(1);
  assert.equal(f.text(), 'TAEWON S');
});

test('preserves the remaining letter delay when a tab is hidden', t => {
  const f = fixture(t);
  f.advance(2050);
  f.visibility(true);
  f.advance(60000);
  assert.equal(f.text(), 'T');
  assert.equal(f.tasks.size, 0);
  f.visibility(false);
  f.advance(169);
  assert.equal(f.text(), 'T');
  f.advance(1);
  assert.equal(f.text(), 'TA');
});

test('waits for an initially hidden tab to become visible', t => {
  const f = fixture(t, false, true);
  f.advance(10000);
  assert.equal(f.tasks.size, 0);
  assert.equal(f.text(), '');
  f.visibility(false); f.advance(2000);
  assert.equal(f.text(), 'T');
});

test('shows the complete name without typing or fading when reduced motion is requested', t => {
  const f = fixture(t, true);
  f.advance(1000);
  assert.equal(f.text(), 'TAEWON SEO');
  assert.equal(f.host.dataset.phase, 'holding');
  f.advance(4200);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 1);
});

test('finishes typing immediately when reduced motion changes during the title', t => {
  const f = fixture(t);
  f.advance(2400);
  f.motion(true);
  assert.equal(f.text(), 'TAEWON SEO');
  f.advance(4200);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 1);
});

test('cleanup cancels timers and prevents visibility or motion events from restarting the title', t => {
  const f = fixture(t);
  f.advance(2200); f.dispose();
  f.visibility(true); f.visibility(false); f.motion(true); f.advance(10000);
  assert.equal(f.host.hidden, true);
  assert.equal(f.tasks.size, 0);
});
