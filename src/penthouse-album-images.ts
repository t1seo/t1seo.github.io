import type { AlbumPhoto } from './penthouse-album-data';

type PhotoImage = { readonly url: string } | { readonly error: true };
type ImageRequest = { readonly controller: AbortController; readonly pending: Promise<PhotoImage>; url?: string };

export function createAlbumImages() {
  const requests = new Map<string, ImageRequest>();

  function release(id: string, entry: ImageRequest) {
    entry.controller.abort();
    if (entry.url) URL.revokeObjectURL(entry.url);
    requests.delete(id);
  }

  function load(photo: AlbumPhoto): Promise<PhotoImage> {
    const existing = requests.get(photo.id);
    if (existing) return existing.pending;
    const controller = new AbortController();
    const entry: ImageRequest = { controller, pending: read() };
    requests.set(photo.id, entry);
    async function read(): Promise<PhotoImage> {
      let url: string | undefined;
      try {
        const response = await fetch(photo.src, {
          credentials: 'omit', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
        });
        if (!response.ok) return { error: true };
        const blob = await response.blob();
        if (controller.signal.aborted) return { error: true };
        url = URL.createObjectURL(blob);
        entry.url = url;
        const image = new Image();
        image.src = url;
        await image.decode();
        if (controller.signal.aborted) return { error: true };
        return { url };
      } catch (error) {
        if (url && !controller.signal.aborted) { URL.revokeObjectURL(url); delete entry.url; }
        if (error instanceof Error || controller.signal.aborted) return { error: true };
        throw error;
      }
    }
    return entry.pending;
  }

  return {
    load,
    retain(photos: readonly AlbumPhoto[]) {
      const keep = new Set(photos.map(photo => photo.id));
      for (const [id, entry] of requests) if (!keep.has(id)) release(id, entry);
    },
    retry(photo: AlbumPhoto) {
      const entry = requests.get(photo.id);
      if (entry) release(photo.id, entry);
      return load(photo);
    },
    clear() { for (const [id, entry] of requests) release(id, entry); },
  };
}
