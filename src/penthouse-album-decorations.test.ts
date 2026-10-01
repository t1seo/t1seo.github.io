import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { albumDecoration, albumStickerSource } from './penthouse-album-decorations.ts';
import { parseAlbumManifest } from './penthouse-album-data.ts';

test('gives every shipped photograph its own concise note and bounded decoration pair', async () => {
  const manifest: unknown = JSON.parse(await readFile(new URL('../public/assets/penthouse/milky-album/photos.json', import.meta.url), 'utf8'));
  const photos = parseAlbumManifest(manifest);
  const notes = new Set<string>();
  for (const photo of photos) {
    const decoration = albumDecoration(photo.id);
    assert.ok(decoration, photo.id);
    assert.ok(decoration.note.length > 0 && decoration.note.length <= 40);
    assert.ok(decoration.stickers.length >= 1 && decoration.stickers.length <= 2);
    assert.equal(new Set(decoration.stickers).size, decoration.stickers.length);
    for (const sticker of decoration.stickers) {
      const source = albumStickerSource(sticker);
      assert.match(source, /^\/assets\/penthouse\/milky-album\/stickers\/[a-z-]+\.webp$/);
      await access(new URL(`../public${source}`, import.meta.url));
    }
    notes.add(decoration.note);
  }
  assert.equal(notes.size, photos.length);
});

test('leaves an unknown photograph uncaptioned instead of inventing a note', () => {
  assert.equal(albumDecoration('milky-99'), undefined);
});
