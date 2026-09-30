import './penthouse.css';
import { createCyberClimate, CYBER_SEASONS, CYBER_TIMES, CYBER_WEATHER, type ClimateState, type LocalClimateInfo } from './cyber-climate';
import { createCyberSound, type CyberPlaybackState } from './cyber-sound';
import { mountCyberPet } from './cyber-pet';
import { mountPenthouseScene } from './penthouse-scene';
import { MILKY_STUDY_FLOOR, GLASS_PANES, ROOM_SIZE } from './penthouse-atmosphere';

const root = document.querySelector<HTMLDivElement>('#app')!;
const icon = (path: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const glyphs = {
  desk: icon('<rect x="3" y="3" width="18" height="13" rx="1"/><path d="M12 16v5m-5 0h10"/>'),
  sun: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>'),
  music: icon('<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>'),
  focus: icon('<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>'),
  pet: icon('<path d="M7 13c-1 1-3 3-2 5s4 0 7 0 6 2 7 0-1-4-2-5c-2-2-8-2-10 0Z"/><ellipse cx="5" cy="8" rx="2" ry="3"/><ellipse cx="11" cy="5" rx="2" ry="3"/><ellipse cx="17" cy="7" rx="2" ry="3"/>'),
};
root.innerHTML = `
<main class="ph-studio night-studio" data-intro="hidden" data-focus="false" aria-label="Taewon Seo's Seoul studio">
  <div class="ph-stage night-scene">
    <svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs><clipPath id="ph-glass" clipPathUnits="objectBoundingBox">${GLASS_PANES.map(p => `<polygon points="${p.map(([x,y]) => `${x/ROOM_SIZE[0]},${y/ROOM_SIZE[1]}`).join(" ")}"/>`).join("")}</clipPath></defs></svg>
    <div class="ph-room" data-time="night" data-season="autumn" data-weather="clear">
      <div class="ph-plates" data-plates role="img" aria-label="A frontal Seoul studio overlooking the Han River and N Seoul Tower through a wide window. A walnut desk faces the view with an Apple Studio Display, HHKB keyboard and task lamp; a lounge and warm shelves frame the room."><img class="ph-plate" src="/assets/penthouse/seoul/interior/night.webp" alt="" fetchpriority="high" draggable="false"><img class="ph-plate ph-exterior" src="/assets/penthouse/seoul/autumn/night.webp" alt="" draggable="false" style="clip-path:url(#ph-glass)"></div>
      <div class="ph-weather" data-weather-wash aria-hidden="true"></div>
      <canvas class="ph-weather-canvas" aria-hidden="true"></canvas>
      <img class="ph-floor-lamp" src="/assets/penthouse/seoul/interior/floor-lamp.webp" alt="A silver articulated floor lamp with an ivory fabric shade beside the lounge" draggable="false">
      <div class="ph-pet" data-pet></div>
      <button class="ph-hotspot ph-hotspot--monitor" data-action="monitor" aria-label="Turn on the computer monitor" aria-pressed="false"><span>THE WORKSPACE</span><i aria-hidden="true">+</i></button>
      <button class="ph-hotspot ph-hotspot--lamp" data-action="lamp" aria-label="Turn on the desk light" aria-pressed="false"><span>DESK LIGHT</span><i aria-hidden="true">+</i></button>
      <button class="ph-hotspot ph-hotspot--audio" data-action="music" aria-label="Play music in the listening corner" aria-pressed="false"><span>THE LISTENING CORNER</span><i aria-hidden="true">+</i></button>
      <button class="ph-hotspot ph-hotspot--book" data-action="about" aria-label="Read about this studio"><span>THE STUDIO</span><i aria-hidden="true">+</i></button>
    </div>
  </div>
  <div class="ph-shade" aria-hidden="true"></div>
  <header class="ph-header">
    <a class="ph-wordmark" href="/" aria-label="Taewon Seo home">TAEWON SEO<span>PRIVATE STUDIO</span></a>
    <span class="ph-edition">SEOUL, THROUGH THE WINDOW &nbsp; / &nbsp; 03</span>
    <button class="ph-about" data-action="about" aria-haspopup="dialog">Inside the studio <span aria-hidden="true">↗</span></button>
  </header>
  <section class="ph-intro" aria-label="Welcome"><p>A LITTLE LIGHT. A LATE IDEA.</p><h1>After hours.</h1><div>A quiet place.<br>A little company.</div></section>
  <div class="ph-live-climate"><span data-clock></span><span data-summary></span></div>
  <footer class="ph-footer">
    <div class="ph-caption"><span class="ph-status-dot"></span><span>MILKY IS HOME</span></div>
    <nav class="ph-controls" aria-label="Studio controls">
      <button data-action="climate" aria-haspopup="dialog">${glyphs.sun}<span>Atmosphere</span></button>
      <button data-action="music" aria-pressed="false">${glyphs.music}<span data-music-label>Music</span></button>
      <button data-action="workspace" aria-haspopup="dialog">${glyphs.desk}<span>Desk</span></button>
      <button data-action="milky" aria-haspopup="dialog">${glyphs.pet}<span>Milky</span></button>
      <button data-action="focus" aria-pressed="false" aria-label="Hide room interface">${glyphs.focus}<span>Immerse</span></button>
    </nav>
    <a class="ph-track" href="/assets/music/CREDITS.html" target="_blank" rel="noopener noreferrer"><span data-track-status>SOUND IS OFF</span><span data-track-title>Make yourself at home.</span></a>
  </footer>
  <button class="ph-restore" data-action="focus" aria-label="Show room interface" hidden>${glyphs.focus} <span>Return</span></button>
  <div class="ph-toast" role="status" aria-live="polite"></div>
  <dialog class="ph-dialog" aria-labelledby="ph-dialog-title"><form method="dialog"><button class="ph-close" aria-label="Close panel">×</button></form><div data-dialog-content></div></dialog>
</main>`;

const $ = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
const studio = $('.ph-studio');
const dialog = $<HTMLDialogElement>('dialog');
const content = $('[data-dialog-content]');
const abort = new AbortController();
const options = { signal: abort.signal };
let panel = '';
let opener: HTMLElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let destroyed = false;
let playing: CyberPlaybackState | undefined;
let animated = true;
const workspace = { monitor: false, lamp: true };
const pretty = (value: string) => value[0].toUpperCase() + value.slice(1);
function toast(message: string) {
  clearTimeout(toastTimer);
  $('.ph-toast').textContent = message;
  toastTimer = setTimeout(() => { $('.ph-toast').textContent = ''; }, 4500);
}
const scene = mountPenthouseScene($('.ph-room'), () => toast('The next view could not load. Your current view is still here.'));
const pet = mountCyberPet($('[data-pet]'), undefined, undefined, undefined, undefined, undefined, {
  ball: { src: '/assets/penthouse/workspace/ball.webp', anchor: [256.204, 407.885] },
}, MILKY_STUDY_FLOOR);
const sound = createCyberSound({ onTrackChange: updatePlayback });
const climate = createCyberClimate(applyClimate);

function updatePlayback(next: CyberPlaybackState) {
  playing = next;
  root.querySelectorAll('[data-action="music"]').forEach(button => button.setAttribute('aria-pressed', String(next.enabled)));
  $('[data-music-label]').textContent = next.enabled ? 'Pause' : 'Music';
  $('[data-track-status]').textContent = next.loading ? 'LOADING RECORD' : next.playing ? 'NOW PLAYING' : next.error ? 'PLAYBACK UNAVAILABLE' : 'SOUND IS OFF';
  $('[data-track-title]').textContent = next.enabled ? next.track.title : 'Make yourself at home.';
  if (next.error) toast('Music could not load. Please try again.');
}
function applyClimate(state: ClimateState) {
  scene.update(state);
  sound.setClimate(state);
  sound.setRain(state.weather === 'rain');
  $('[data-summary]').textContent = `${pretty(state.season)} / ${pretty(state.weather)}${state.auto ? ' / Auto' : ''}`;
  updateClimatePanel();
}

const localCopy = (info: LocalClimateInfo) => ({
  device: 'Your device sets the clock. Enable location for local weather.',
  locating: 'Finding your approximate location…', loading: 'Checking the local weather…',
  live: 'Local weather is connected. The illustrated view remains Seoul.',
  denied: 'Location is blocked. You can still choose the atmosphere below.',
  unavailable: 'Live weather is unavailable. Your last view is preserved; you can retry.',
})[info.status];
function updateLocalInfo(info: LocalClimateInfo) {
  $('[data-clock]').textContent = `${info.localDateTime} · ${info.timeZone.split('/').pop()?.replaceAll('_', ' ')}`;
  updateClimatePanel();
}
const stopInfo = climate.subscribeLocalInfo(updateLocalInfo);
updateLocalInfo(climate.getLocalInfo());

function openPanel(name: string, trigger: HTMLElement) {
  scene.setPreview(null);
  panel = name;
  opener = trigger;
  if (name === 'climate') {
    const group = (key: string, values: readonly string[]) => `<fieldset><legend>${pretty(key)}</legend><div class="ph-options">${values.map(value => `<label><input type="radio" name="${key}" value="${value}"><span>${pretty(value)}</span></label>`).join('')}</div></fieldset>`;
    content.innerHTML = `<p class="ph-overline">SET THE SCENE</p><h2 id="ph-dialog-title">Atmosphere</h2><p data-local></p><div class="ph-auto"><label><input type="checkbox" name="auto"> Follow my local time</label><button data-action="location">Use my location</button></div>${group('season', CYBER_SEASONS)}${group('time', CYBER_TIMES)}${group('weather', CYBER_WEATHER)}<div class="ph-auto"><label><input type="checkbox" name="animated"> Animate the view</label></div><p class="ph-panel-note">Clear nights bring slow city lights and an occasional shooting star. Rain leaves beads on the glass that dry gradually. Reduced motion keeps the scene still.</p><p class="ph-panel-note">A manual choice pauses Auto. Location is requested only with your permission. Approximate coordinates stay in memory.</p>`;
    updateClimatePanel();
  } else if (name === 'workspace') {
    content.innerHTML = `<p class="ph-overline">A PLACE FOR IDEAS</p><h2 id="ph-dialog-title">Facing Seoul.</h2><p>A walnut desk, an Apple Studio Display and a Happy Hacking Keyboard (HHKB). A Herman Miller Aeron chair, refined task light and silver floor lamp complete the room.</p><canvas class="ph-desk-preview" aria-label="Close-up of the Apple Studio Display, HHKB keyboard and desk lighting"></canvas><div class="ph-pet-actions"><button data-action="monitor" aria-pressed="false"><span data-monitor-label>Turn on monitor</span><span aria-hidden="true">↗</span></button><button data-action="lamp" aria-pressed="false"><span data-lamp-label>Turn on desk light</span><span aria-hidden="true">↗</span></button></div><p class="ph-panel-note">The monitor starts a quiet coding sketch when you turn it on. The desk light adds a warm pool beside the screen.</p><p class="ph-workspace-status" role="status" data-workspace-status></p>`;
    scene.setPreview(content.querySelector<HTMLCanvasElement>('canvas'));
    updateWorkspace();
  } else if (name === 'milky') {
    content.innerHTML = `<p class="ph-overline">THE ONE WARM EXCEPTION</p><h2 id="ph-dialog-title">Meet Milky.</h2><p>A little Maltese, with the run of the place.</p><div class="ph-pet-actions">${[['pet','Say hello'],['sit','Sit with me'],['sleep','Take a nap'],['feed','Dinner time'],['play','Play ball'],['run','A little run']].map(([action,label])=>`<button data-action="${action}">${label}<span aria-hidden="true">↗</span></button>`).join('')}</div><p class="ph-panel-note">You can also click Milky in the room. When focused, arrow keys walk, S sits and N naps.</p>`;
  } else {
    content.innerHTML = `<p class="ph-overline">TAEWON SEO / THE SEOUL STUDIO</p><h2 id="ph-dialog-title">Seoul, in view.</h2><p>A wide window straight ahead. A desk facing the Han River, with N Seoul Tower on the horizon. A quiet lounge, warm shelves and Milky nearby.</p><p>Four seasons and five times of day change the illustrated Seoul view. Auto follows your local clock; permitted location adds your local weather. Choose any season, time or weather in Atmosphere.</p><div class="ph-about-links"><a href="/design/research/penthouse-layout/report.html" target="_blank" rel="noopener">Compare the new room layout <span>↗</span></a><a href="/design/research/penthouse-atmosphere/report.html" target="_blank" rel="noopener">The workspace & living weather research <span>↗</span></a><a href="/design/research/penthouse-rebuild/report.html" target="_blank" rel="noopener">Read the design research <span>↗</span></a><a href="/?interior=original">Visit the original studio <span>↗</span></a><a href="/?interior=noir">Visit the first Noir restyle <span>↗</span></a><a href="/assets/music/CREDITS.html" target="_blank" rel="noopener">Music credits <span>↗</span></a></div>`;
  }
  if (!dialog.open) dialog.showModal();
  pet.setActive(false);
}

function updateClimatePanel() {
  if (panel !== 'climate') return;
  const state = climate.getState();
  const info = climate.getLocalInfo();
  const status = content.querySelector('[data-local]');
  if (status) status.textContent = `${info.localDateTime} · ${info.timeZone}. ${localCopy(info)}`;
  content.querySelectorAll<HTMLInputElement>('input').forEach(input => {
    input.checked = input.name === 'animated' ? animated : input.name === 'auto' ? state.auto : state[input.name as 'season'|'time'|'weather'] === input.value;
  });
  const button = content.querySelector<HTMLButtonElement>('[data-action="location"]');
  if (button) {
    button.disabled = info.status === 'locating' || info.status === 'loading';
    button.textContent = button.disabled ? 'Connecting…' : info.status === 'live' ? 'Refresh location' : info.status === 'device' ? 'Use my location' : 'Retry location';
  }
}

function updateWorkspace() {
  scene.setWorkspace(workspace);
  for (const key of ['monitor', 'lamp'] as const) {
    root.querySelectorAll(`[data-action="${key}"]`).forEach(button => {
      button.setAttribute('aria-pressed', String(workspace[key]));
      button.setAttribute('aria-label', `Turn ${workspace[key] ? 'off' : 'on'} the ${key === 'monitor' ? 'computer monitor' : 'desk light'}`);
    });
    const label = content.querySelector(`[data-${key}-label]`);
    if (label) label.textContent = `Turn ${workspace[key] ? 'off' : 'on'} ${key === 'monitor' ? 'monitor' : 'desk light'}`;
  }
  const status = content.querySelector('[data-workspace-status]');
  if (status) status.textContent = `Monitor ${workspace.monitor ? 'on' : 'off'} · Desk light ${workspace.lamp ? 'on' : 'off'}`;
}

root.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'climate' || action === 'milky' || action === 'about' || action === 'workspace') openPanel(action, button);
  else if (action === 'monitor' || action === 'lamp') { workspace[action] = !workspace[action]; updateWorkspace(); }
  else if (action === 'music') void sound.setEnabled(!sound.isEnabled());
  else if (action === 'location') void climate.useLocation();
  else if (action === 'focus') {
    const focus = studio.dataset.focus !== 'true';
    studio.dataset.focus = String(focus);
    const restore = $<HTMLButtonElement>('.ph-restore');
    restore.hidden = !focus;
    root.querySelector('.ph-controls [data-action="focus"]')?.setAttribute('aria-pressed', String(focus));
    (focus ? restore : $<HTMLButtonElement>('.ph-controls [data-action="focus"]')).focus();
  } else if (action && ['pet','sit','sleep','feed','play','run'].includes(action)) {
    dialog.close();
    pet.setActive(true);
    pet[action as 'pet'|'sit'|'sleep'|'feed'|'play'|'run']();
  }
}, options);
content.addEventListener('change', event => {
  const input = event.target as HTMLInputElement;
  if (input.name === 'animated') { animated = input.checked; scene.setAnimated(animated); }
  if (input.name === 'auto') climate.setAuto(input.checked);
  if (input.name === 'season') climate.setSeason(input.value as ClimateState['season']);
  if (input.name === 'time') climate.setTime(input.value as ClimateState['time']);
  if (input.name === 'weather') climate.setWeather(input.value as ClimateState['weather']);
}, options);
dialog.addEventListener('close', () => { panel = ''; scene.setPreview(null); pet.setActive(true); opener?.focus(); }, options);
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
}, options);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && studio.dataset.focus === 'true') $<HTMLButtonElement>('.ph-restore').click();
}, options);

applyClimate(climate.getState());
updateWorkspace();
if (!playing) $('[data-track-title]').textContent = 'Make yourself at home.';
// Clock is automatic immediately; location is an explicit, understandable action.
function destroy() {
  if (destroyed) return;
  destroyed = true; abort.abort(); clearTimeout(toastTimer); stopInfo();
  climate.destroy(); scene.destroy(); pet.destroy(); sound.destroy();
}
window.addEventListener('pagehide', event => { if (!event.persisted) destroy(); }, options);
if (import.meta.hot) import.meta.hot.dispose(destroy);
