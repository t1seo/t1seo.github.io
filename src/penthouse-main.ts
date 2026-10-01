import './penthouse.css';
import { createCyberClimate, CYBER_SEASONS, CYBER_TIMES, CYBER_WEATHER, type ClimateState, type LocalClimateInfo } from './cyber-climate';
import { createCyberSound, type CyberPlaybackState } from './cyber-sound';
import { mountCyberPet } from './cyber-pet';
import { mountPenthouseScene } from './penthouse-scene';
import { MILKY_STUDY_FLOOR } from './penthouse-atmosphere';
import { roomTimeObjectsMarkup, updateRoomTimeObjects } from './penthouse-time-objects';
import './penthouse-time-objects.css';

const mount = document.querySelector<HTMLDivElement>('#app');
if (!mount) throw new Error('Studio mount element is missing.');
const root: HTMLDivElement = mount;
root.innerHTML = `
<main class="ph-studio night-studio" data-intro="hidden" data-focus="false" aria-label="Taewon Seo's Seoul studio">
  <div class="ph-stage night-scene">
    <div class="ph-room" data-time="night" data-season="autumn" data-weather="clear">
      <div class="ph-plates" data-plates role="img" aria-label="A frontal Seoul studio overlooking the Han River and N Seoul Tower through a wide window. A walnut desk faces the view with an Apple Studio Display, HHKB keyboard and a slim brushed-metal LED desk lamp. An ivory-shade articulated floor lamp stands to the left of the lounge chair, casting warm light across its back and seat. A small black and gold fountain pen rests directly beside the keyboard, with a low horizontal oak-slat speaker in the open space between the books and monitor. A lounge and warm shelves frame the room."><img class="ph-plate" src="/assets/penthouse/seoul/autumn/night.webp" alt="" fetchpriority="high" draggable="false"></div>
      <div class="ph-weather" data-weather-wash aria-hidden="true"></div>
      <canvas class="ph-weather-canvas" aria-hidden="true"></canvas>
      <div class="ph-pet" data-pet></div>
      <button class="ph-hotspot ph-hotspot--monitor" data-action="monitor" aria-label="Turn on the computer monitor" aria-pressed="false"><span>THE WORKSPACE</span><i aria-hidden="true">+</i></button>
      <button class="ph-hotspot ph-hotspot--lamp" data-action="lamp" aria-label="Turn on the desk light" aria-pressed="false"><span>DESK LIGHT</span><i aria-hidden="true">+</i></button>
      <button class="ph-hotspot ph-hotspot--audio" data-action="music" aria-label="Play music on the horizontal desktop speaker" aria-pressed="false"><span>DESKTOP AUDIO</span><i aria-hidden="true">+</i></button>
      <button class="ph-hotspot ph-hotspot--pen" data-action="workspace" aria-label="Explore the fountain pen and desk objects" aria-haspopup="dialog"><span>THE WRITING RITUAL</span><i aria-hidden="true">+</i></button>
      <button class="ph-hotspot ph-hotspot--book" data-action="about" aria-label="Read about this studio"><span>THE STUDIO</span><i aria-hidden="true">+</i></button>
      <button class="ph-hotspot ph-hotspot--coffee" data-action="coffee" aria-label="Enjoy the aroma of the desk coffee"><span>A QUIET COFFEE</span><i aria-hidden="true">+</i></button>
      <button class="ph-hotspot ph-hotspot--tea" data-action="tea" aria-label="Let the lounge tea steep"><span>A MOMENT TO STEEP</span><i aria-hidden="true">+</i></button>
      ${roomTimeObjectsMarkup()}
    </div>
  </div>
  <button class="ph-restore" data-action="focus" aria-label="Show clock and calendar" hidden>Return to the room</button>
  <div class="ph-toast" role="status" aria-live="polite"></div>
  <dialog class="ph-dialog" aria-labelledby="ph-dialog-title"><form method="dialog"><button class="ph-close" aria-label="Close panel">×</button></form><nav class="ph-panel-nav" aria-label="Studio settings"><button data-action="climate">Atmosphere</button><button data-action="workspace">Desk</button><button data-action="milky">Milky</button><button data-action="about">About</button></nav><div data-dialog-content></div><div class="ph-panel-sound"><button data-action="music" aria-pressed="false"><span data-music-label>Play music</span></button><a class="ph-track" href="/assets/music/CREDITS.html" target="_blank" rel="noopener noreferrer" aria-label="Music credits"><span data-track-status>SOUND IS OFF</span><span data-track-title>Make yourself at home.</span></a></div><button class="ph-immerse" data-action="focus">Immerse in the room</button></dialog>
</main>`;

const $ = <T extends Element = HTMLElement>(selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing studio element: ${selector}`);
  return element;
};
const studio = $('.ph-studio');
const dialog = $<HTMLDialogElement>('dialog');
const content = $('[data-dialog-content]');
const abort = new AbortController();
const options = { signal: abort.signal };
const visibleHotspots = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!(entry.target instanceof HTMLElement)) continue;
    entry.target.inert = entry.intersectionRatio < .95;
    entry.target.style.visibility = entry.target.inert ? 'hidden' : '';
  }
}, { root: $('.ph-stage'), threshold: .95 });
root.querySelectorAll('.ph-hotspot').forEach(button => visibleHotspots.observe(button));
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
  $('[data-music-label]').textContent = next.enabled ? 'Pause music' : 'Play music';
  $('[data-track-status]').textContent = next.loading ? 'LOADING RECORD' : next.playing ? 'NOW PLAYING' : next.error ? 'PLAYBACK UNAVAILABLE' : 'SOUND IS OFF';
  $('[data-track-title]').textContent = next.enabled ? next.track.title : 'Make yourself at home.';
  if (next.error) toast('Music could not load. Please try again.');
}
function applyClimate(state: ClimateState) {
  scene.update(state);
  sound.setClimate(state);
  sound.setRain(state.weather === 'rain');
  studio.dataset.time = state.time;
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
  updateRoomTimeObjects(root, info.timeZone);
  updateClimatePanel();
}
const stopInfo = climate.subscribeLocalInfo(updateLocalInfo);
updateLocalInfo(climate.getLocalInfo());

function openPanel(name: string, trigger: HTMLElement) {
  scene.setPreview(null);
  panel = name === 'clock' || name === 'calendar' ? 'climate' : name;
  if (!dialog.open) opener = trigger;
  root.querySelectorAll<HTMLElement>('.ph-panel-nav [data-action]').forEach(button => {
    if (button.dataset.action === panel) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (panel === 'climate') {
    const group = (key: string, values: readonly string[]) => `<fieldset><legend>${pretty(key)}</legend><div class="ph-options">${values.map(value => `<label><input type="radio" name="${key}" value="${value}"><span>${pretty(value)}</span></label>`).join('')}</div></fieldset>`;
    content.innerHTML = `<p class="ph-overline">${name === 'calendar' ? 'A SEASON FOR EVERY MOOD' : 'MAKE THIS MOMENT YOURS'}</p><h2 id="ph-dialog-title" tabindex="-1">${name === 'calendar' ? 'Calendar & seasons' : name === 'clock' ? 'Time & atmosphere' : 'Room atmosphere'}</h2><p data-local></p><div class="ph-auto"><label><input type="checkbox" name="auto"> Follow my local time</label><button data-action="location">Use my location</button></div>${name === 'calendar' ? group('season', CYBER_SEASONS) + group('time', CYBER_TIMES) : group('time', CYBER_TIMES) + group('season', CYBER_SEASONS)}${group('weather', CYBER_WEATHER)}<div class="ph-auto"><label><input type="checkbox" name="animated"> Animate the view</label></div><p class="ph-panel-note">Clear nights bring slow city lights and an occasional shooting star. Rain leaves beads on the glass that dry gradually. Reduced motion keeps the scene still.</p><p class="ph-panel-note">The clock and calendar show your local date and time. A manual scene choice pauses Auto. Location is requested only with your permission. Approximate coordinates stay in memory.</p>`;
    updateClimatePanel();
  } else if (name === 'workspace') {
    content.innerHTML = `<p class="ph-overline">A PLACE FOR IDEAS</p><h2 id="ph-dialog-title">Facing Seoul.</h2><p>A walnut desk, an Apple Studio Display and a Happy Hacking Keyboard (HHKB). A slim brushed-metal desk lamp casts a soft pool across the walnut. A painted digital clock and paper calendar open the room settings. A small fountain pen rests beside the keyboard; a low horizontal speaker sits between the books and monitor. Beside the window, a silver floor lamp casts warm light onto the lounge chair from its left.</p><canvas class="ph-desk-preview" aria-label="Close-up of the Apple Studio Display, HHKB keyboard, fountain pen, horizontal desktop speaker and desk lighting"></canvas><div class="ph-pet-actions"><button data-action="monitor" aria-pressed="false"><span data-monitor-label>Turn on monitor</span><span aria-hidden="true">↗</span></button><button data-action="lamp" aria-pressed="false"><span data-lamp-label>Turn on desk light</span><span aria-hidden="true">↗</span></button><button data-action="coffee">Enjoy a warm coffee<span aria-hidden="true">↗</span></button></div><p class="ph-panel-note">Turn on the monitor to see the editor, live Seoul preview and a detailed screen view below. The light bar casts a warm pool across the left side of the desktop. Click the coffee or tea in the room for a quiet moment.</p><p class="ph-workspace-status" role="status" data-workspace-status></p><canvas class="ph-screen-preview" aria-label="Detailed studio screen showing a TypeScript editor, file list and the current Seoul view" hidden></canvas><div class="ph-objects"><article><div class="ph-object-art"><img src="/assets/penthouse/objects/fountain-pen.webp" alt="Painted capped black and gold fountain pen" width="1981" height="794" loading="lazy"></div><h3>A place for a thought.</h3><p>A small black and gold fountain pen inspired by Montblanc, resting directly on the walnut desk.</p></article><article><div class="ph-object-art"><img src="/assets/penthouse/objects/horizontal-speaker.webp" alt="Painted low horizontal speaker with oak slats, a charcoal case and a muted champagne frame" width="1100" height="445" loading="lazy"></div><h3>Room for a record.</h3><p>A low speaker with oak slats, a matte charcoal case and a muted champagne frame. Its custom proportions draw from Bang &amp; Olufsen’s material palette.</p><a href="https://www.bang-olufsen.com/en/int/speakers/beosound-level" target="_blank" rel="noopener noreferrer">Explore Bang &amp; Olufsen ↗</a><button class="ph-object-play" data-action="music" aria-pressed="false">Play / pause room music</button></article></div><p class="ph-panel-note"><a href="/design/research/penthouse-objects/report.html" target="_blank" rel="noopener">The objects, materials &amp; research ↗</a></p>`;
    scene.setPreview(content.querySelector<HTMLCanvasElement>('.ph-desk-preview'),content.querySelector<HTMLCanvasElement>('.ph-screen-preview'));
    updateWorkspace();
    if (playing) updatePlayback(playing);
  } else if (name === 'milky') {
    content.innerHTML = `<p class="ph-overline">THE ONE WARM EXCEPTION</p><h2 id="ph-dialog-title">Meet Milky.</h2><p>A little Maltese, with the run of the place.</p><div class="ph-pet-actions">${[['pet','Say hello'],['sit','Sit with me'],['sleep','Take a nap'],['feed','Dinner time'],['play','Play ball'],['run','A little run']].map(([action,label])=>`<button data-action="${action}">${label}<span aria-hidden="true">↗</span></button>`).join('')}</div><p class="ph-panel-note">You can also click Milky in the room. When focused, arrow keys walk, S sits and N naps.</p>`;
  } else {
    content.innerHTML = `<p class="ph-overline">TAEWON SEO / THE SEOUL STUDIO</p><h2 id="ph-dialog-title">Seoul, in view.</h2><p>A wide window straight ahead. A desk facing the Han River, with N Seoul Tower on the horizon. A quiet lounge, warm shelves and Milky nearby.</p><p>Four seasons and five times of day change the illustrated Seoul view. Auto follows your local clock; permitted location adds your local weather. Choose any season, time or weather in Atmosphere.</p><div class="ph-about-links"><a href="/design/research/penthouse-objects/report.html" target="_blank" rel="noopener">The fountain pen &amp; desktop audio <span>↗</span></a><a href="/design/research/penthouse-layout/report.html" target="_blank" rel="noopener">Compare the new room layout <span>↗</span></a><a href="/design/research/penthouse-atmosphere/report.html" target="_blank" rel="noopener">The workspace & living weather research <span>↗</span></a><a href="/design/research/penthouse-rebuild/report.html" target="_blank" rel="noopener">Read the design research <span>↗</span></a><a href="/?interior=original">Visit the original studio <span>↗</span></a><a href="/?interior=noir">Visit the first Noir restyle <span>↗</span></a><a href="/assets/music/CREDITS.html" target="_blank" rel="noopener">Music credits <span>↗</span></a></div>`;
  }
  if (!dialog.open) dialog.showModal();
  else {
    const heading = content.querySelector<HTMLElement>('h2');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
  }
  dialog.scrollTop = 0;
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
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLElement>('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'climate' || action === 'clock' || action === 'calendar' || action === 'milky' || action === 'about' || action === 'workspace') openPanel(action, button);
  else if (action === 'monitor' || action === 'lamp') { workspace[action] = !workspace[action]; updateWorkspace(); }
  else if (action === 'music') void sound.setEnabled(!sound.isEnabled());
  else if (action === 'coffee' || action === 'tea') { scene.savorCoffee(action === 'coffee' ? 'desk' : 'lounge'); toast(action === 'coffee' ? 'A warm cup. A little pause.' : 'Let the tea steep for a moment.'); }
  else if (action === 'location') void climate.useLocation();
  else if (action === 'focus') {
    const focus = studio.dataset.focus !== 'true';
    studio.dataset.focus = String(focus);
    const restore = $<HTMLButtonElement>('.ph-restore');
    restore.hidden = !focus;
    if (dialog.open) dialog.close();
    (focus ? restore : opener ?? $<HTMLButtonElement>('[data-action="clock"]')).focus();
  } else if (action && ['pet','sit','sleep','feed','play','run'].includes(action)) {
    dialog.close();
    pet.setActive(true);
    pet[action as 'pet'|'sit'|'sleep'|'feed'|'play'|'run']();
  }
}, options);
content.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.name === 'animated') { animated = input.checked; scene.setAnimated(animated); }
  if (input.name === 'auto') climate.setAuto(input.checked);
  const season = CYBER_SEASONS.find(value => value === input.value);
  const time = CYBER_TIMES.find(value => value === input.value);
  const weather = CYBER_WEATHER.find(value => value === input.value);
  if (input.name === 'season' && season) climate.setSeason(season);
  if (input.name === 'time' && time) climate.setTime(time);
  if (input.name === 'weather' && weather) climate.setWeather(weather);
}, options);
dialog.addEventListener('close', () => { panel = ''; scene.setPreview(null); pet.setActive(true); (studio.dataset.focus === 'true' ? $('.ph-restore') : opener && !opener.inert ? opener : $('[data-action="clock"]')).focus(); }, options);
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
  destroyed = true; abort.abort(); visibleHotspots.disconnect(); clearTimeout(toastTimer); stopInfo();
  climate.destroy(); scene.destroy(); pet.destroy(); sound.destroy();
}
window.addEventListener('pagehide', event => { if (!event.persisted) destroy(); }, options);
if (import.meta.hot) import.meta.hot.dispose(destroy);
