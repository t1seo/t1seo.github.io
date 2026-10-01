type AutomaticFireworksOptions = {
  readonly isEligible: () => boolean;
  readonly start: () => boolean;
  readonly random?: () => number;
};

export function mountAutomaticFireworks(options: AutomaticFireworksOptions) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const random = options.random ?? Math.random;
  let timer: number | undefined;
  let disposed = false;
  const eligible = () => !document.hidden && !reduced.matches && options.isEligible();

  function clear() {
    window.clearTimeout(timer);
    timer = undefined;
  }
  function refresh() {
    if (disposed) return;
    if (!eligible()) { clear(); return; }
    if (timer !== undefined) return;
    timer = window.setTimeout(() => {
      timer = undefined;
      if (!eligible()) return;
      options.start();
      refresh();
    }, (8 + random() * 7) * 60000);
  }

  document.addEventListener('visibilitychange', refresh);
  reduced.addEventListener('change', refresh);
  refresh();
  return {
    refresh,
    destroy() {
      disposed = true;
      clear();
      document.removeEventListener('visibilitychange', refresh);
      reduced.removeEventListener('change', refresh);
    },
  };
}
