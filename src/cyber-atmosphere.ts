import './cyber-atmosphere.css';
import { cityVisibility, RIVER_COLUMNS, RIVER_RIPPLES_PER_COLUMN, sampleRiverRipple, sampleTraffic, TRAFFIC_COUNT, windowGlow } from './cyber-ambient-paths';
import { createWeatherParticles, GLASS_DROP_COUNT, sampleGlassDrop, sampleWeatherParticle } from './cyber-weather-motion';
import type { FallingWeather, WeatherParticle } from './cyber-weather-motion';

export interface CyberAtmosphereClimate {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  time: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
  weather: 'clear' | 'cloudy' | 'rain' | 'snow' | 'mist';
}

export interface CyberAtmosphereOptions {
  /** Window vertices in scene coordinates, normalized from 0 to 1. */
  windowPolygon?: number[][];
  /** Opaque foreground silhouettes, in the same normalized scene coordinates. */
  foregroundPolygons?: number[][][];
}

export interface CyberAtmosphereController {
  /** Compatibility shortcut: rain on, or clear skies. Keeps season and time. */
  setRain(enabled: boolean): void;
  setClimate(climate: CyberAtmosphereClimate): void;
  /** Seasons of all currently displayed/crossfading plates; union their occluders. */
  setVisibleSeasons(seasons: readonly string[]): void;
  /** Pause or resume animation, retaining the current frame while paused. */
  setActive(active: boolean): void;
  /** An empty or invalid polygon clears the effect until a valid one is set. */
  setWindowPolygon(points: number[][]): void;
  destroy(): void;
}

type Point = [number, number];
// Existing window cells on the actual city plate, rather than random sky dots.
const CITY_WINDOWS: Point[] = [
  [.812, .156], [.819, .182], [.808, .220], [.821, .245],
  [.873, .126], [.882, .162], [.875, .208], [.883, .256],
  [.767, .211], [.777, .238], [.765, .270],
  [.846, .202], [.856, .240], [.850, .285],
  [.801, .269], [.806, .304], [.914, .202], [.919, .246],
  [.612, .229], [.628, .274], [.596, .303],
  [.535, .221], [.529, .273], [.555, .255],
  [.458, .278], [.444, .305], [.488, .253], [.400, .229],
  [.806, .169], [.810, .192], [.817, .230], [.828, .279],
  [.872, .172], [.880, .188], [.870, .222], [.878, .240],
  [.852, .188], [.858, .219], [.767, .190], [.769, .250],
  [.618, .249], [.626, .295], [.451, .257], [.419, .287],
];
// The Christmas tree stands in front of the left window in every winter plate.
// Its silhouette must occlude precipitation and river light just like the desk.
const WINTER_TREE: Point[] = [
  [.217, .154], [.243, .258], [.269, .343], [.284, .426],
  [.305, .530], [.322, .670], [.322, .79], [.129, .79],
  [.134, .548], [.169, .35], [.195, .241],
];
// The spring plant adds blossom clusters outside the shared leaf silhouettes.
// Register these small additional opaque areas on spring-morning.webp (1672 × 941).
const SPRING_BLOSSOMS = [
  [[1640, 300], [1661, 293], [1672, 299], [1672, 324], [1650, 326], [1639, 315]],
  [[1644, 350], [1665, 345], [1672, 358], [1672, 388], [1655, 393], [1641, 378]],
  [[1595, 367], [1607, 361], [1622, 375], [1616, 392], [1602, 389], [1592, 378]],
  [[1553, 393], [1571, 385], [1585, 398], [1577, 416], [1558, 425], [1548, 412]],
  [[1574, 408], [1590, 399], [1607, 410], [1604, 430], [1584, 433], [1575, 425]],
  [[1635, 402], [1652, 393], [1672, 401], [1672, 427], [1645, 430], [1635, 420]],
  [[1629, 447], [1647, 440], [1663, 451], [1652, 468], [1634, 470], [1625, 459]],
  [[1599, 467], [1616, 464], [1633, 478], [1621, 496], [1603, 497], [1590, 481]],
  [[1647, 505], [1665, 504], [1672, 517], [1672, 544], [1656, 545], [1644, 529]],
].map(points => points.map(([x, y]) => [x / 1672, y / 941] as Point));
const DEFAULT_WINDOW: Point[] = [[.16, .02], [.97, .02], [.97, .67], [.16, .67]];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function normalizePolygon(points: number[][]): Point[] {
  if (points.length < 3 || points.some(point => point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) return [];
  const polygon: Point[] = points.map(([x, y]) => [clamp(x), clamp(y)]);
  return polygonArea(polygon) > .000001 ? polygon : [];
}

function polygonArea(points: Point[]): number {
  return Math.abs(points.reduce((area, [x, y], index) => {
    const next = points[(index + 1) % points.length];
    return area + x * next[1] - next[0] * y;
  }, 0)) / 2;
}

/** Mount on a positioned scene plane. The canvas is clipped to the window;
 * .cyber-weather-reflection is inserted immediately after the host so the
 * subtle indoor light can span the room without inheriting its mullion mask.
 * Both layers are decorative, non-interactive, and removed by destroy(). */
export function mountCyberAtmosphere(host: HTMLElement, options: CyberAtmosphereOptions = {}): CyberAtmosphereController {
  const canvas = document.createElement('canvas');
  canvas.className = 'cyber-atmosphere';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return { setRain() {}, setClimate() {}, setVisibleSeasons() {}, setActive() {}, setWindowPolygon() {}, destroy() {} };
  const ctx = context;
  const reflection = document.createElement('div');
  reflection.className = 'cyber-weather-reflection';
  reflection.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  host.after(reflection);

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let climate: CyberAtmosphereClimate = { season: 'summer', time: 'night', weather: 'rain' };
  // null preserves standalone behavior when a host has no plate-loader callback.
  let visibleSeasons: readonly string[] | null = null;
  let polygon = normalizePolygon(options.windowPolygon ?? DEFAULT_WINDOW);
  let bounds = { left: 0, right: 1, top: 0, bottom: 1 };
  let particles: WeatherParticle[] = [];
  let windowPath = new Path2D();
  let winterForegroundMask = new Path2D();
  let foregroundPaths: Path2D[] = [];
  let springForegroundPaths: Path2D[] = [];
  let width = 0, height = 0, pixelRatio = 1;
  let frame = 0, elapsed = 0;
  let lastTime: number | null = null;
  let active = true, destroyed = false;
  let repaintAfter = 0;

  function isDark() { return climate.time === 'night' || climate.time === 'evening'; }
  function seasonVisible(season: string) { return visibleSeasons ? visibleSeasons.includes(season) : climate.season === season; }
  function fallingWeather(): FallingWeather { return climate.weather === 'rain' ? 'rain' : climate.weather === 'snow' ? 'snow' : 'seasonal'; }

  function seedParticles() {
    if (!polygon.length) { particles = []; return; }
    const xs = polygon.map(([x]) => x), ys = polygon.map(([, y]) => y);
    bounds = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
    const falling = climate.weather === 'rain' || climate.weather === 'snow' ||
      climate.weather === 'clear' && (climate.season === 'spring' || climate.season === 'autumn') && !isDark();
    particles = falling ? createWeatherParticles(fallingWeather(), bounds, polygonArea(polygon)) : [];
  }

  function rebuildWindowPath() {
    windowPath = new Path2D();
    polygon.forEach(([x, y], index) => {
      if (index === 0) windowPath.moveTo(x * width, y * height);
      else windowPath.lineTo(x * width, y * height);
    });
    windowPath.closePath();
    winterForegroundMask = new Path2D();
    winterForegroundMask.rect(0, 0, width, height);
    WINTER_TREE.forEach(([x, y], index) => {
      if (index === 0) winterForegroundMask.moveTo(x * width, y * height);
      else winterForegroundMask.lineTo(x * width, y * height);
    });
    winterForegroundMask.closePath();
    const makeForegroundPath = (points: Point[]) => {
      const path = new Path2D();
      points.forEach(([x, y], index) => {
        if (index === 0) path.moveTo(x * width, y * height);
        else path.lineTo(x * width, y * height);
      });
      path.closePath();
      return path;
    };
    foregroundPaths = (options.foregroundPolygons ?? []).map(normalizePolygon).filter(points => points.length > 0).map(makeForegroundPath);
    springForegroundPaths = SPRING_BLOSSOMS.map(makeForegroundPath);
  }

  function syncReflection() {
    const hasWindow = polygon.length > 0;
    for (const layer of [canvas, reflection]) {
      layer.dataset.weather = climate.weather;
      layer.dataset.time = climate.time;
      layer.dataset.season = climate.season;
    }
    reflection.hidden = !hasWindow;
    reflection.style.setProperty('--weather-light-strength', isDark() ? '.46' : '.72');
    reflection.style.setProperty('--room-flow-strength', isDark() ? '.17' : climate.weather === 'clear' ? '.28' : '.16');
  }

  function paintVeil() {
    const weather = climate.weather;
    const dark = isDark();
    if (weather === 'clear') {
      if (!dark) {
        // Broad air and sunlight move over the real sky; no extra cloud outlines.
        const centerX = (.54 + Math.sin(elapsed * .031) * .19) * width;
        const clearHaze = ctx.createRadialGradient(centerX, .09 * height, 0, centerX, .09 * height, width * .35);
        clearHaze.addColorStop(0, 'rgba(240, 244, 239, .075)');
        clearHaze.addColorStop(1, 'rgba(240, 244, 239, 0)');
        ctx.fillStyle = clearHaze;
        ctx.fillRect(0, 0, width, height * .36);
      }
      return;
    }
    // Overcast sky needs a neutral upper bank to suppress the plate's blue.
    // Mist instead gathers over the distant city; nearer buildings stay legible.
    const color = dark ? '116, 140, 152' : weather === 'rain' ? '126, 142, 153' :
      weather === 'cloudy' ? '167, 177, 180' : weather === 'snow' ? '211, 221, 223' : '219, 229, 224';
    const [sky, horizon, near] = weather === 'mist' ? (dark ? [.15, .38, .19] : [.31, .56, .24]) :
      weather === 'rain' ? (dark ? [.22, .13, .04] : [.44, .21, .055]) :
      weather === 'cloudy' ? (dark ? [.14, .08, .03] : [.36, .17, .04]) :
      (dark ? [.16, .18, .08] : [.35, .24, .10]);
    const veil = ctx.createLinearGradient(0, bounds.top * height, 0, bounds.bottom * height);
    veil.addColorStop(0, `rgba(${color}, ${sky})`);
    veil.addColorStop(.22, `rgba(${color}, ${sky * .92})`);
    veil.addColorStop(.57, `rgba(${color}, ${horizon})`);
    veil.addColorStop(1, `rgba(${color}, ${near})`);
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);
    if (weather === 'mist' || weather === 'cloudy' || weather === 'rain') {
      // Several very soft banks move at different rates rather than one sheet.
      for (let index = 0; index < 3; index++) {
        const centerX = (.25 + index * .32 + Math.sin(elapsed * .025 + index * 2) * .10) * width;
        const centerY = (weather === 'mist' ? .20 + index * .125 : .08 + index * .085) * height;
        const radius = width * (.24 + index * .015);
        const cloud = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        const tint = weather === 'mist' ? color : dark ? '63, 83, 102' : '114, 130, 145';
        const opacity = weather === 'mist' ? .10 : dark ? .055 : weather === 'rain' ? .12 : .085;
        cloud.addColorStop(0, `rgba(${tint}, ${opacity})`);
        cloud.addColorStop(1, `rgba(${tint}, 0)`);
        ctx.fillStyle = cloud;
        ctx.fillRect(0, 0, width, height);
      }
    }
  }

  function paintParticles(scale: number) {
    const rain = climate.weather === 'rain';
    const snow = climate.weather === 'snow';
    const dark = isDark();
    for (const particle of particles) {
      const point = sampleWeatherParticle(particle, elapsed, fallingWeather(), bounds);
      const x = point.x * width, y = point.y * height;
      const depth = particle.depth;
      if (rain) {
        const length = [11, 19, 29][depth] * particle.size * scale;
        const slant = length * point.slant;
        ctx.strokeStyle = dark ? '#d0e0e7' : '#b7cdd4';
        ctx.globalAlpha = particle.alpha * [.19, .30, .42][depth];
        ctx.lineWidth = Math.max(.45, [.55, .85, 1.15][depth] * scale);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + slant, y + length);
        ctx.stroke();
      } else if (snow) {
        const radius = Math.max(.55, [.8, 1.65, 3.05][depth] * particle.size * scale);
        ctx.globalAlpha = particle.alpha * [.34, .57, .79][depth];
        ctx.fillStyle = dark ? '#e1e9e9' : '#fbfbf4';
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius * .83, particle.phase, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Tiny falling material fragments fit the illustrated scenery: no icons.
        const size = (2 + depth * .7) * particle.size * scale;
        const turn = Math.sin(elapsed * .6 + particle.phase);
        ctx.globalAlpha = particle.alpha * .52;
        ctx.fillStyle = climate.season === 'spring' ? '#edc3c6' : depth === 1 ? '#b27543' : '#d3a45f';
        ctx.beginPath();
        ctx.ellipse(x, y, Math.max(.4, size * Math.abs(turn)), size * .62, particle.phase + elapsed * .14, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function paintGlass(scale: number) {
    if (climate.weather !== 'rain') return;
    ctx.save();
    for (let index = 0; index < GLASS_DROP_COUNT; index++) {
      const drop = sampleGlassDrop(elapsed, index, bounds);
      const x = drop.x * width, y = drop.y * height;
      const tail = drop.tail * height;
      const tint = isDark() ? '218, 232, 235' : '239, 246, 243';
      const trail = ctx.createLinearGradient(x, y - tail, x, y);
      trail.addColorStop(0, `rgba(${tint}, 0)`);
      trail.addColorStop(1, `rgba(${tint}, .8)`);
      ctx.globalAlpha = drop.opacity;
      ctx.strokeStyle = trail;
      ctx.lineWidth = Math.max(.6, drop.size * .75 * scale);
      ctx.beginPath();
      ctx.moveTo(x + .55 * scale, y - tail);
      ctx.quadraticCurveTo(x - .7 * scale, y - tail * .45, x, y);
      ctx.stroke();
      const radius = Math.max(.65, drop.size * scale);
      ctx.fillStyle = `rgb(${tint})`;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * .70, radius * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function paintCity(scale: number) {
    const visibility = cityVisibility(climate.time, climate.weather);
    const sceneTime = elapsed;
    // Isolated, softly changing rectangular panes preserve the architecture.
    ctx.save();
    CITY_WINDOWS.forEach(([x, y], index) => {
      const light = windowGlow(sceneTime, index);
      // Softly dim only the registered pane when the room is unoccupied. The
      // baked illustration remains intact around it; no new floating sky lights.
      ctx.globalAlpha = (1 - light / .7) * visibility * .24;
      ctx.fillStyle = '#25303a';
      ctx.shadowBlur = 0;
      ctx.fillRect(x * width, y * height, 1.7 * scale, 2.5 * scale);
      ctx.globalAlpha = light * visibility;
      ctx.fillStyle = index % 6 === 0 ? '#e4e4d1' : '#ffe0a9';
      ctx.shadowColor = index % 6 === 0 ? '#e4dfc1' : '#ffd093';
      ctx.shadowBlur = 4 * scale;
      ctx.fillRect(x * width, y * height, Math.max(.65, 1.5 * scale), Math.max(1, 2.3 * scale));
    });
    ctx.shadowBlur = 0;
    const weatherVisibility = climate.weather === 'mist' ? .35 : climate.weather === 'clear' ? 1 : .7;
    for (let index = 0; index < (isDark() ? TRAFFIC_COUNT : 3); index++) {
      const car = sampleTraffic(sceneTime, index);
      const x = car.x * width, y = car.y * height;
      const tail = (isDark() ? 5 : 2.6) * scale * car.direction;
      const color = car.direction === 1 ? '240, 214, 163' : '244, 143, 104';
      const light = ctx.createLinearGradient(x - tail, y, x, y);
      light.addColorStop(0, `rgba(${color}, 0)`);
      light.addColorStop(1, `rgba(${color}, 1)`);
      ctx.globalAlpha = car.opacity * (isDark() ? .88 : .34) * weatherVisibility;
      ctx.strokeStyle = light;
      ctx.lineWidth = Math.max(.6, 1.25 * scale);
      ctx.beginPath();
      ctx.moveTo(x - tail, y + tail * .13);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = isDark() ? '#fff0cb' : '#e7e3d4';
      ctx.fillRect(x - .7 * scale, y - .45 * scale, 1.4 * scale, .9 * scale);
    }
    ctx.restore();
  }

  function paintRiver(scale: number) {
    const sceneTime = elapsed;
    const visibility = climate.weather === 'mist' ? .18 : climate.weather === 'rain' ? .5 : climate.weather === 'snow' ? .6 : 1;
    ctx.save();
    ctx.lineWidth = Math.max(.45, .65 * scale);
    ctx.strokeStyle = isDark() ? '#ffe0a2' : climate.time === 'afternoon' ? '#ffe1b5' : '#e1f2f1';
    RIVER_COLUMNS.forEach((_, index) => {
      for (let ripple = 0; ripple < RIVER_RIPPLES_PER_COLUMN; ripple++) {
        const glint = sampleRiverRipple(sceneTime, index, ripple);
        const x = glint.x * width, y = glint.y * height;
        const halfWidth = glint.halfWidth * scale;
        ctx.globalAlpha = glint.opacity * visibility * (isDark() ? .85 + windowGlow(sceneTime, index) * .3 : .65);
        ctx.beginPath();
        ctx.moveTo(x - halfWidth, y);
        ctx.lineTo(x + halfWidth, y);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function paint() {
    if (destroyed) return;
    ctx.clearRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
    if (!width || !height || !polygon.length) return;
    const scale = Math.min(width / 1672, height / 941);
    ctx.save();
    ctx.clip(windowPath);
    if (seasonVisible('winter')) ctx.clip(winterForegroundMask, 'evenodd');
    ctx.lineCap = 'round';
    paintRiver(scale);
    paintCity(scale);
    paintVeil();
    paintParticles(scale);
    paintGlass(scale);
    ctx.restore();
    // Clear each mask independently: overlapping furniture must remain opaque,
    // unlike one even-odd compound mask which would reopen their intersections.
    if (foregroundPaths.length || seasonVisible('spring')) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      foregroundPaths.forEach(path => ctx.fill(path));
      if (seasonVisible('spring')) springForegroundPaths.forEach(path => ctx.fill(path));
      ctx.restore();
    }
  }

  function canAnimate() {
    return !destroyed && active && !document.hidden && !motionPreference.matches && width > 0 && height > 0 && polygon.length > 0;
  }

  function animate(time: number) {
    frame = 0;
    if (!canAnimate()) { lastTime = null; return; }
    const seconds = lastTime === null ? 0 : Math.min(.08, Math.max(0, (time - lastTime) / 1000));
    lastTime = time;
    elapsed += seconds;
    // Canvas work is capped at 30fps, including high refresh-rate displays.
    repaintAfter += seconds;
    if (repaintAfter >= 1 / 30) {
      repaintAfter %= 1 / 30;
      paint();
    }
    frame = window.requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (destroyed) return;
    reflection.dataset.active = String(canAnimate());
    if (!canAnimate()) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
      repaintAfter = 0;
    } else if (!frame) {
      lastTime = null;
      frame = window.requestAnimationFrame(animate);
    }
    paint();
  }

  function resize() {
    if (destroyed) return;
    const nextWidth = host.clientWidth, nextHeight = host.clientHeight;
    const nextRatio = Math.min(1.5, window.devicePixelRatio || 1);
    if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;
    width = nextWidth; height = nextHeight; pixelRatio = nextRatio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    rebuildWindowPath();
    syncAnimation();
  }

  function setClimate(next: CyberAtmosphereClimate) {
    if (destroyed || (next.season === climate.season && next.time === climate.time && next.weather === climate.weather)) return;
    climate = { ...next };
    seedParticles();
    syncReflection();
    syncAnimation();
  }

  seedParticles();
  syncReflection();
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  document.addEventListener('visibilitychange', syncAnimation);
  motionPreference.addEventListener('change', syncAnimation);
  window.addEventListener('resize', resize);
  resize();

  return {
    setRain(enabled) { setClimate({ ...climate, weather: enabled ? 'rain' : 'clear' }); },
    setClimate,
    setVisibleSeasons(seasons) {
      if (destroyed) return;
      if (visibleSeasons && ['winter', 'spring'].every(season => visibleSeasons!.includes(season) === seasons.includes(season))) return;
      visibleSeasons = [...seasons];
      paint();
    },
    setActive(nextActive) {
      if (destroyed || active === nextActive) return;
      active = nextActive;
      syncAnimation();
    },
    setWindowPolygon(points) {
      if (destroyed) return;
      polygon = normalizePolygon(points);
      seedParticles();
      rebuildWindowPath();
      syncReflection();
      syncAnimation();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncAnimation);
      motionPreference.removeEventListener('change', syncAnimation);
      window.removeEventListener('resize', resize);
      particles = [];
      canvas.remove();
      reflection.remove();
      canvas.width = canvas.height = 0;
    },
  };
}
