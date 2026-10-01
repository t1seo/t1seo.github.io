import test from 'node:test';
import assert from 'node:assert/strict';
import { albumPage, parseAlbumManifest, AlbumLoadError } from './penthouse-album-data.ts';

const photo = { id: 'milky-01', src: '/assets/penthouse/milky-album/photos/01.webp', width: 360, height: 480, alt: 'Milky' };

test('preserves the original photo dimensions and order when reading the album', () => {
  // Given photographs with different native aspect ratios.
  const input = { photos: [photo, { ...photo, id: 'milky-02', src: '/assets/penthouse/milky-album/photos/02.webp', width: 768, height: 576 }] };
  // When the manifest crosses the loading boundary.
  const photos = parseAlbumManifest(input);
  // Then neither the source order nor native dimensions are changed.
  assert.deepEqual(photos, input.photos);
});

test('rejects unrelated URLs and duplicate photographs when reading the album', () => {
  // Given malformed or unrelated image sources.
  const values = [{ photos: [photo, photo] }, { photos: [{ ...photo, src: 'https://example.com/photo.webp' }] }, { photos: [{ ...photo, width: -1 }] }, { photos: [] }];
  // When each manifest is parsed.
  // Then no partial album can be displayed.
  for (const value of values) assert.throws(() => parseAlbumManifest(value), AlbumLoadError);
});

test('keeps the selected photo visible when switching to a two-page spread', () => {
  // Given the final photo viewed on a narrow screen.
  // When a wide screen lays out the same position.
  const page = albumPage(25, 26, 2);
  // Then the final photo remains visible beside its preceding photo.
  assert.deepEqual(page, { start: 24, indices: [24, 25], next: [], previous: 22, following: null });
});

test('prepares only the next spread and stops at the final page', () => {
  // Given an odd number of photos near the end of an album.
  // When the last full spread is requested.
  const page = albumPage(2, 5, 2);
  // Then the next page is bounded and never skips the remaining photo.
  assert.deepEqual(page, { start: 2, indices: [2, 3], next: [3, 4], previous: 0, following: 3 });
});

test('advances one photo at a time on narrow screens', () => {
  // Given a phone-sized album at its fourth photo.
  // When navigation is calculated.
  const page = albumPage(3, 26, 1);
  // Then only the next individual photo is prepared.
  assert.deepEqual(page, { start: 3, indices: [3], next: [4], previous: 2, following: 4 });
});
