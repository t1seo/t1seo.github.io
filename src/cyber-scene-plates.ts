/** Keep the last decoded scene visible while a new season or light is loading. */
export function createLatestScene<T>(
  load: (source: string) => Promise<T>,
  commit: (value: T, source: string) => void,
  fail: (error: unknown, source: string) => void,
) {
  let revision = 0;
  let disposed = false;
  let committed = '';
  const pending = new Map<string, Promise<T>>();
  return {
    async request(source: string) {
      if (disposed) return false;
      const token = ++revision;
      if (source === committed) return true;
      let task = pending.get(source);
      if (!task) {
        task = Promise.resolve().then(() => load(source));
        pending.set(source, task);
        // Browser HTTP caching carries reuse; do not keep 20 decoded bitmaps in JS.
        void task.then(() => pending.delete(source), () => pending.delete(source));
      }
      try {
        const value = await task;
        if (disposed || token !== revision) return false;
        commit(value, source);
        committed = source;
        return true;
      } catch (error) {
        if (!disposed && token === revision) fail(error, source);
        return false;
      }
    },
    destroy() { disposed = true; revision += 1; pending.clear(); },
  };
}

function seasonFromSource(source: string) {
  return source.match(/(?:^|\/)assets\/cyberpunk\/climate\/(spring|summer|autumn|winter)-(?:morning|noon|afternoon|evening|night)\.webp(?:[?#].*)?$/)?.[1];
}

/** Report mounted artwork seasons immediately, on append, and after fade retirement. */
export function mountScenePlates(
  host: HTMLElement,
  onError: () => void,
  onVisibleSeasons?: (seasons: readonly string[]) => void,
) {
  let disposed = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const frames = new Set<number>();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const reportVisibleSeasons = () => {
    if (disposed || !onVisibleSeasons) return;
    const seasons = new Set<string>();
    for (const layer of host.children) {
      const declared = layer.getAttribute('data-season');
      const season = declared && /^(spring|summer|autumn|winter)$/.test(declared)
        ? declared
        : seasonFromSource(layer.getAttribute('src') ?? '');
      if (season) seasons.add(season);
    }
    // Every mounted layer can still be visible through a newer layer's fade.
    onVisibleSeasons([...seasons]);
  };
  reportVisibleSeasons();
  const loader = createLatestScene<HTMLImageElement>(
    async source => {
      const image = new Image();
      image.className = 'night-plate night-plate--climate';
      image.alt = '';
      image.draggable = false;
      image.decoding = 'async';
      image.src = source;
      const season = seasonFromSource(source);
      if (season) image.dataset.season = season;
      await image.decode();
      return image;
    },
    image => {
      // The existing image stays opaque underneath until the new one is visible.
      host.append(image);
      reportVisibleSeasons();
      if (disposed) return;
      const retire = () => {
        if (disposed || host.lastElementChild !== image) return;
        for (const child of [...host.children]) if (child !== image) child.remove();
        reportVisibleSeasons();
      };
      if (reduced.matches) { image.classList.add('is-visible'); retire(); return; }
      const frame = requestAnimationFrame(() => {
        frames.delete(frame);
        if (disposed) return;
        // Force the opacity start state before transitioning a newly mounted layer.
        void image.offsetWidth;
        image.classList.add('is-visible');
        const timer = setTimeout(() => { timers.delete(timer); retire(); }, 1100);
        timers.add(timer);
      });
      frames.add(frame);
    },
    onError,
  );
  return {
    setScene(season: string, time: string) {
      return loader.request(`/assets/cyberpunk/climate/${season}-${time}.webp`);
    },
    destroy() {
      disposed = true;
      loader.destroy();
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
      timers.clear();
      frames.clear();
    },
  };
}
