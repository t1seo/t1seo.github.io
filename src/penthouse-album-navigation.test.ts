import test from 'node:test';
import assert from 'node:assert/strict';
import { albumDestination } from './penthouse-album-navigation.ts';
import { albumPage } from './penthouse-album-data.ts';

test('opens the closing letter after the final photo in either page layout', () => {
  assert.equal(albumDestination(24, true, 26, 2), 'letter');
  assert.equal(albumDestination(25, true, 26, 1), 'letter');
});

test('keeps the final photo selected after returning from the letter and resizing', () => {
  const selected = albumDestination('letter', false, 26, 2);
  assert.equal(selected, 25);
  assert.equal(typeof selected, 'number');
  if (typeof selected !== 'number') return;
  assert.deepEqual(albumPage(selected, 26, 2).indices, [24, 25]);
  assert.deepEqual(albumPage(selected, 26, 1).indices, [25]);
});

test('does not advance beyond the letter or before the cover', () => {
  assert.equal(albumDestination('letter', true, 26, 2), 'letter');
  assert.equal(albumDestination(null, false, 26, 2), null);
});

test('preserves ordinary spread navigation and returns from the first photo to the cover', () => {
  assert.equal(albumDestination(null, true, 26, 2), 0);
  assert.equal(albumDestination(0, true, 26, 2), 2);
  assert.equal(albumDestination(2, false, 26, 2), 0);
  assert.equal(albumDestination(0, false, 26, 1), null);
});

test('gives a one-photo album the same cover, photograph and letter sequence', () => {
  assert.equal(albumDestination(null, true, 1, 2), 0);
  assert.equal(albumDestination(0, true, 1, 2), 'letter');
  assert.equal(albumDestination('letter', false, 1, 2), 0);
});
