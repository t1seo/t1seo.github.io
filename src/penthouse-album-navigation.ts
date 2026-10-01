import { albumPage } from './penthouse-album-data.ts';

export type AlbumPosition = number | null | 'letter';

export function albumDestination(position: AlbumPosition, forward: boolean, count: number, size: 1 | 2): AlbumPosition {
  switch (position) {
    case null: return forward ? 0 : null;
    case 'letter': return forward ? 'letter' : count - 1;
    default: {
      const page = albumPage(position, count, size);
      return forward ? page.following ?? 'letter' : page.previous;
    }
  }
}
