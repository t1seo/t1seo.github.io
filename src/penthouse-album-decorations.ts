export type AlbumSticker = 'tiny-red-ball' | 'cream-cloud' | 'moon-stars' | 'pawprint' | 'rose-heart' | 'oatmeal-bow' | 'flower-sprig' | 'cozy-blanket';

type AlbumDecoration = {
  readonly note: string;
  readonly stickers: readonly [AlbumSticker] | readonly [AlbumSticker, AlbumSticker];
};

const decorations: Readonly<Record<string, AlbumDecoration | undefined>> = {
  'milky-01': { note: 'In a rosy little nest.', stickers: ['rose-heart', 'cozy-blanket'] },
  'milky-02': { note: 'A little tousled.', stickers: ['cream-cloud', 'oatmeal-bow'] },
  'milky-03': { note: 'A pause by the hedge.', stickers: ['flower-sprig', 'pawprint'] },
  'milky-04': { note: 'One ear up.', stickers: ['rose-heart', 'oatmeal-bow'] },
  'milky-05': { note: 'A nap among flowers.', stickers: ['cozy-blanket', 'moon-stars'] },
  'milky-06': { note: 'Among the little flowers.', stickers: ['flower-sprig', 'cozy-blanket'] },
  'milky-07': { note: 'Under the leafy canopy.', stickers: ['flower-sprig', 'pawprint'] },
  'milky-08': { note: 'Soft light, little face.', stickers: ['cream-cloud', 'rose-heart'] },
  'milky-09': { note: 'That tiny smile.', stickers: ['cream-cloud', 'rose-heart'] },
  'milky-10': { note: 'Peeking from a cozy corner.', stickers: ['cozy-blanket', 'oatmeal-bow'] },
  'milky-11': { note: 'A moment under the trees.', stickers: ['flower-sprig', 'pawprint'] },
  'milky-12': { note: 'Paws up, belly out.', stickers: ['moon-stars', 'cozy-blanket'] },
  'milky-13': { note: 'Sitting pretty on the quilt.', stickers: ['cozy-blanket', 'rose-heart'] },
  'milky-14': { note: 'That little button nose.', stickers: ['cream-cloud', 'rose-heart'] },
  'milky-15': { note: 'Those eyes, those little ears.', stickers: ['oatmeal-bow', 'cream-cloud'] },
  'milky-16': { note: 'Little paws on the path.', stickers: ['pawprint', 'flower-sprig'] },
  'milky-17': { note: 'Peeking through the soft folds.', stickers: ['cozy-blanket', 'oatmeal-bow'] },
  'milky-18': { note: 'All fluff and tiny paws.', stickers: ['cream-cloud', 'oatmeal-bow'] },
  'milky-19': { note: 'Among the green hedges.', stickers: ['flower-sprig', 'pawprint'] },
  'milky-20': { note: 'A little sunshine.', stickers: ['flower-sprig', 'pawprint'] },
  'milky-21': { note: 'Paws up, soft edges.', stickers: ['cozy-blanket', 'moon-stars'] },
  'milky-22': { note: 'Two paws, neatly together.', stickers: ['cozy-blanket', 'oatmeal-bow'] },
  'milky-23': { note: 'Fluff against rosy folds.', stickers: ['rose-heart', 'cozy-blanket'] },
  'milky-24': { note: 'A glance up, a curled tail.', stickers: ['pawprint', 'flower-sprig'] },
  'milky-25': { note: 'Nestled in a floral blanket.', stickers: ['cozy-blanket', 'moon-stars'] },
  'milky-26': { note: 'Just peeking over the pillow.', stickers: ['cozy-blanket', 'rose-heart'] },
};

export function albumDecoration(photoId: string): AlbumDecoration | undefined { return decorations[photoId]; }
export function albumStickerSource(sticker: AlbumSticker): string { return `/assets/penthouse/milky-album/stickers/${sticker}.webp`; }
