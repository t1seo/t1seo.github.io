export type AlbumPhoto = {
  readonly id: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
};

export class AlbumLoadError extends Error {
  constructor() { super('The photographs could not load. Please try again.'); this.name = 'AlbumLoadError'; }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseAlbumManifest(value: unknown): readonly AlbumPhoto[] {
  if (!record(value) || !Array.isArray(value.photos) || !value.photos.length || value.photos.length > 100) throw new AlbumLoadError();
  const ids = new Set<string>();
  return value.photos.map((photo: unknown) => {
    if (!record(photo) || typeof photo.id !== 'string' || !/^milky-\d{2,3}$/.test(photo.id) || ids.has(photo.id)
      || typeof photo.src !== 'string' || !/^\/assets\/penthouse\/milky-album\/photos\/\d{2,3}\.webp$/.test(photo.src)
      || typeof photo.width !== 'number' || !Number.isInteger(photo.width) || photo.width < 1 || photo.width > 8192
      || typeof photo.height !== 'number' || !Number.isInteger(photo.height) || photo.height < 1 || photo.height > 8192
      || typeof photo.alt !== 'string' || !photo.alt.trim() || photo.alt.length > 400) throw new AlbumLoadError();
    ids.add(photo.id);
    return { id: photo.id, src: photo.src, width: photo.width, height: photo.height, alt: photo.alt };
  });
}

export function albumPage(position: number, count: number, size: 1 | 2) {
  const final = Math.max(0, count - size);
  const start = Math.max(0, Math.min(position, final));
  const following = start + size < count ? Math.min(start + size, final) : null;
  const indices = Array.from({ length: Math.min(size, count - start) }, (_, offset) => start + offset);
  const next = following === null ? [] : Array.from({ length: Math.min(size, count - following) }, (_, offset) => following + offset);
  return { start, indices, next, previous: start ? Math.max(0, start - size) : null, following };
}

export async function loadAlbumManifest(signal: AbortSignal): Promise<readonly AlbumPhoto[]> {
  try {
    const response = await fetch('/assets/penthouse/milky-album/photos.json', {
      signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]), credentials: 'omit', headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new AlbumLoadError();
    const value: unknown = await response.json();
    return parseAlbumManifest(value);
  } catch (error) {
    if (signal.aborted || error instanceof AlbumLoadError) throw error;
    if (error instanceof Error) throw new AlbumLoadError();
    throw error;
  }
}
