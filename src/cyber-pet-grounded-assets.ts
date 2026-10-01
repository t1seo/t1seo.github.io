export type GroundedWalkImage<Image = CanvasImageSource> = {
  readonly image: Image;
  readonly width: number;
  readonly height: number;
};

export type GroundedWalkAssets<Image = CanvasImageSource> = {
  readonly torso: GroundedWalkImage<Image>;
  readonly foreleg: GroundedWalkImage<Image>;
  readonly hindleg: GroundedWalkImage<Image>;
};

export type GroundedWalkDecoder<Image = CanvasImageSource> = (
  url: string, signal: AbortSignal,
) => Promise<GroundedWalkImage<Image>>;

export type GroundedWalkAssetLoader<Image = CanvasImageSource> = {
  readonly load: () => Promise<GroundedWalkAssets<Image> | null>;
  readonly current: () => GroundedWalkAssets<Image> | null;
  readonly abort: () => void;
  readonly destroy: () => void;
};

const GROUNDED_WALK_URLS = {
  torso: '/assets/cyberpunk/milky-grounded-walk/torso.webp',
  foreleg: '/assets/cyberpunk/milky-grounded-walk/foreleg.webp',
  hindleg: '/assets/cyberpunk/milky-grounded-walk/hindleg.webp',
} as const;

function settledImage<Image>(
  result: PromiseSettledResult<GroundedWalkImage<Image>>,
): GroundedWalkImage<Image> | null {
  switch (result.status) {
    case 'rejected': return null;
    case 'fulfilled': {
      const { image, width, height } = result.value;
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || width * 2 !== height * 3) return null;
      return Object.freeze({ image, width, height });
    }
    default: return result satisfies never;
  }
}

export function createGroundedWalkAssetLoader<Image>(
  decode: GroundedWalkDecoder<Image>,
): GroundedWalkAssetLoader<Image> {
  let assets: GroundedWalkAssets<Image> | null = null;
  let pending: Promise<GroundedWalkAssets<Image> | null> | null = null;
  let controller: AbortController | null = null;
  let destroyed = false;

  const decodeImage = async (url: string, signal: AbortSignal) => decode(url, signal);
  const loadBatch = async (signal: AbortSignal): Promise<GroundedWalkAssets<Image> | null> => {
    const [torsoResult, forelegResult] = await Promise.allSettled([
      decodeImage(GROUNDED_WALK_URLS.torso, signal),
      decodeImage(GROUNDED_WALK_URLS.foreleg, signal),
    ]);
    const torso = settledImage(torsoResult);
    const foreleg = settledImage(forelegResult);
    if (signal.aborted || !torso || !foreleg) return null;
    const [hindlegResult] = await Promise.allSettled([
      decodeImage(GROUNDED_WALK_URLS.hindleg, signal),
    ]);
    const hindleg = settledImage(hindlegResult);
    if (signal.aborted || !hindleg) return null;
    return Object.freeze({ torso, foreleg, hindleg });
  };

  return {
    load: () => {
      if (destroyed) return Promise.resolve(null);
      if (assets) return Promise.resolve(assets);
      if (pending) return pending;
      const attempt = new AbortController();
      controller = attempt;
      pending = loadBatch(attempt.signal).then(result => {
        if (destroyed || attempt.signal.aborted) return null;
        assets = result;
        return result;
      }).finally(() => { pending = null; controller = null; });
      return pending;
    },
    current: () => assets,
    abort: () => controller?.abort(),
    destroy: () => {
      destroyed = true;
      controller?.abort();
      assets = null;
    },
  };
}

export function decodeGroundedWalkImage(url: string, signal: AbortSignal): Promise<GroundedWalkImage> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const image = new Image();
    image.decoding = 'async';
    const abort = () => {
      image.removeAttribute('src');
      signal.removeEventListener('abort', abort);
      reject(new DOMException('Grounded walk image cancelled', 'AbortError'));
    };
    signal.addEventListener('abort', abort, { once: true });
    image.src = url;
    void image.decode().then(() => {
      signal.removeEventListener('abort', abort);
      if (!signal.aborted) resolve({ image, width: image.naturalWidth, height: image.naturalHeight });
    }, (error: unknown) => {
      signal.removeEventListener('abort', abort);
      reject(error);
    });
  });
}
