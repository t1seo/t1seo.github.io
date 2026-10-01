import './penthouse.css';
import { panelMarkup } from './penthouse-panel-markup';
import { roomMarkup } from './penthouse-room-markup';
import { mountPersonalTools } from './penthouse-personal-ui';
import { mountFocusSession } from './penthouse-focus-ui';
import { mountFireworksControl } from './penthouse-fireworks-ui';
import { mountAutomaticFireworks } from './penthouse-fireworks-auto';
import { mountSoundMixer } from './penthouse-sound-ui';
import { createGuestbookPanel } from './penthouse-guestbook-panel';
import { createCyberClimate, CYBER_SEASONS, CYBER_TIMES, CYBER_WEATHER, type ClimateState, type LocalClimateInfo } from './cyber-climate';
import { createCyberSound, type CyberPlaybackState } from './cyber-sound';
import { MILKY_ALBUM_MUSIC_TRACK } from './cyber-music-catalog';
import type { MusicSession } from './cyber-music-session';
import { mountCyberPet } from './cyber-pet';
import { mountPenthouseScene } from './penthouse-scene';
import { MILKY_STUDY_FLOOR } from './penthouse-atmosphere';
import { updateRoomTimeObjects } from './penthouse-time-objects';
import { createSingingBowlSound } from './penthouse-singing-bowl';
import { mountSeasonalDecor } from './penthouse-seasonal-decor';
import { mountOpeningCredits } from './penthouse-opening-credits';
import './penthouse-time-objects.css';
import './penthouse-seasonal-decor.css';
import './penthouse-opening-credits.css';
import './penthouse-personal.css';
import './penthouse-object-lighting.css';
import './penthouse-panels.css';
import './penthouse-album-prop.css';
const mount = document.querySelector<HTMLDivElement>('#app');
if (!mount) throw new Error('Studio mount element is missing.');
const root: HTMLDivElement = mount;
root.innerHTML = roomMarkup();
const $ = <T extends Element = HTMLElement>(selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing studio element: ${selector}`);
  return element;
};
const studio = $('.ph-studio');
const opening = $('.ph-opening-credits');
const dialog = $<HTMLDialogElement>('.ph-dialog');
const content = $('[data-dialog-content]');
const guestbookUrl: unknown = import.meta.env.VITE_GUESTBOOK_API_URL;
const guestbook = createGuestbookPanel(content, typeof guestbookUrl === 'string' ? guestbookUrl : '');
const abort = new AbortController();
const options = { signal: abort.signal };
const visibleHotspots = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!(entry.target instanceof HTMLElement)) continue;
    entry.target.inert = entry.intersectionRatio < .95;
    entry.target.style.visibility = entry.target.inert && !entry.target.classList.contains('ph-bed') ? 'hidden' : '';
  }
}, { root: $('.ph-stage'), threshold: .95 });
root.querySelectorAll('.ph-room .ph-hotspot, .ph-room .ph-time-object, .ph-bed').forEach(button => visibleHotspots.observe(button));
let panel = '';
let opener: HTMLElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let destroyed = false;
let playing: CyberPlaybackState | undefined;
let mixer: ReturnType<typeof mountSoundMixer> | undefined;
let animated = true;
let albumViewer: ReturnType<typeof import('./penthouse-album').createMilkyAlbum> | undefined;
let albumLoad: Promise<typeof import('./penthouse-album')> | undefined;
let albumRequest = 0;
let albumOpen = false;
let albumLoading = false;
let albumMusic: MusicSession | undefined;
const workspace = { monitor: true, lamp: true, floorLamp: true };
function toast(message: string) {
  clearTimeout(toastTimer);
  $('.ph-toast').textContent = message;
  toastTimer = setTimeout(() => { $('.ph-toast').textContent = ''; }, 4500);
}
const scene = mountPenthouseScene($('.ph-room'), () => toast('The next view could not load. Your current view is still here.'));
const fireworks = mountFireworksControl(root, scene, () => animated, () => dialog.close());
const stopOpeningCredits = mountOpeningCredits(opening, opening.querySelectorAll<HTMLElement>('[data-opening-letter]'), {
  isBlocked: () => dialog.open || albumOpen || albumLoading || scene.fireworksActive,
  isStill: () => !animated,
});
const automaticFireworks = mountAutomaticFireworks({
  isEligible: () => studio.dataset.time === 'night' && animated && !dialog.open && !albumOpen && !albumLoading && !scene.fireworksActive,
  start: scene.startFireworks,
});
function updateWindowAvailability() { stopOpeningCredits.resetIdle(); automaticFireworks.refresh(); }
const stopFireworksCredits = scene.subscribeFireworks(updateWindowAvailability);
const seasonalDecor = mountSeasonalDecor($('.ph-room'));
const pet = mountCyberPet($('[data-pet]'), undefined, undefined, undefined, undefined, undefined, {
  ball: { src: '/assets/penthouse/objects/milky-ball.webp', anchor: [256, 419] },
}, MILKY_STUDY_FLOOR, { element: $('.ph-bed'), anchor: { x: 1440 / 1672, y: 865 / 941 } }, { ballHome: { x: .52, y: .977 }, drag: true, transitions: true });
const sound = createCyberSound({ independentMix: true, onTrackChange: updatePlayback, onMixChange: (mix, error) => mixer?.refresh(mix, error) });
const bowlSound = createSingingBowlSound();
const climate = createCyberClimate(applyClimate);
const focusSession = mountFocusSession(root, () => climate.getLocalInfo().timeZone, () => scene.strikeBowl());
mixer = mountSoundMixer(root, sound);
const personal = mountPersonalTools(root, {
  snapshot: () => ({ climate: { ...climate.getState(), animated }, workspace: { ...workspace }, sound: sound.getMix() }),
  apply(snapshot) {
    Object.assign(workspace, snapshot.workspace);
    updateWorkspace();
    animated = snapshot.climate.animated;
    scene.setAnimated(animated);
    pet.setAnimated(animated);
    updateWindowAvailability();
    climate.setAtmosphere(snapshot.climate);
    updateClimatePanel();
    void sound.setMix(snapshot.sound, true).catch((error: unknown) => {
      console.error('Saved atmosphere sound unavailable', error instanceof Error ? error.message : error);
    });
  },
});
function updatePlayback(next: CyberPlaybackState) {
  playing = next;
  albumViewer?.updateMusic(next.enabled);
  root.querySelectorAll('[data-action="music"]').forEach(button => button.setAttribute('aria-pressed', String(next.enabled)));
  $('[data-music-label]').textContent = next.enabled ? 'Pause music' : 'Play music';
  $('[data-track-status]').textContent = next.loading ? 'LOADING RECORD' : next.playing ? 'NOW PLAYING' : next.error ? 'PLAYBACK UNAVAILABLE' : 'MUSIC IS OFF';
  $('[data-track-title]').textContent = next.enabled ? next.track.title : 'Make yourself at home.';
  if (next.error) toast('Music could not load. Please try again.');
}
function applyClimate(state: ClimateState) {
  scene.update(state);
  seasonalDecor.update(state);
  sound.setClimate(state);
  sound.setRain(state.weather === 'rain');
  studio.dataset.time = state.time;
  automaticFireworks.refresh();
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
  focusSession.refresh();
  updateClimatePanel();
}
function roomFocusTarget(): HTMLElement {
  if (opener?.isConnected && !opener.inert) return opener;
  return root.querySelector<HTMLElement>('.ph-room .ph-time-object:not([inert])') ?? $('[data-action="calendar"]');
}
const stopInfo = climate.subscribeLocalInfo(updateLocalInfo);
updateLocalInfo(climate.getLocalInfo());

function cancelAlbumLoad() {
  const wasLoading = albumLoading;
  albumLoading = false;
  albumRequest++;
  root.querySelectorAll('[data-action="album"][aria-busy]').forEach(button => button.removeAttribute('aria-busy'));
  $('[data-album-status]').textContent = '';
  if (!albumOpen) { if (!destroyed) albumMusic?.close(); albumMusic = undefined; }
  if (wasLoading && !destroyed) updateWindowAvailability();
}
async function openAlbum(trigger: HTMLElement) {
  if (albumOpen) return;
  cancelAlbumLoad();
  const request = albumRequest;
  albumLoading = true;
  updateWindowAvailability();
  trigger.setAttribute('aria-busy', 'true');
  $('[data-album-status]').textContent = 'Opening Milky’s album…';
  albumMusic = sound.beginMusicSession(MILKY_ALBUM_MUSIC_TRACK);
  try {
    const module = await (albumLoad ??= import('./penthouse-album'));
    if (destroyed || request !== albumRequest || !trigger.isConnected) return;
    albumViewer ??= module.createMilkyAlbum({
      host: root, isStill: () => !animated,
      music: { isEnabled: sound.isEnabled, toggle: () => { void sound.setEnabled(!sound.isEnabled()); } },
      onOpen: () => { albumLoading = false; albumOpen = true; pet.setActive(false); updateWindowAvailability(); },
      onClose: () => { albumOpen = false; albumMusic?.close(); albumMusic = undefined; if (!destroyed) { pet.setActive(!dialog.open); updateWindowAvailability(); } },
    });
    albumViewer.open(trigger);
  } catch {
    albumLoad = undefined;
    if (!destroyed && request === albumRequest) toast('Milky’s album could not open. Please select it again to retry.');
  } finally {
    if (!destroyed && request === albumRequest) cancelAlbumLoad();
  }
}

function openPanel(name: string, trigger: HTMLElement) {
  cancelAlbumLoad();
  guestbook.close();
  scene.setPreview(null);
  panel = name === 'clock' || name === 'calendar' ? 'climate' : name;
  if (!dialog.open) opener = trigger;
  dialog.dataset.panel = panel;
  $('[data-panel-mixer]').hidden = panel !== 'climate';
  root.querySelectorAll<HTMLElement>('.ph-panel-nav [data-action]').forEach(button => {
    if (button.dataset.action === (panel === 'memo' ? 'workspace' : panel)) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  content.innerHTML = panelMarkup(name);
  if (name === 'guestbook') void guestbook.open();
  if (panel === 'climate') updateClimatePanel();
  if (name === 'workspace') {
    updateRoomTimeObjects(root, climate.getLocalInfo().timeZone);
    scene.setPreview(content.querySelector<HTMLCanvasElement>('.ph-desk-preview'),content.querySelector<HTMLCanvasElement>('.ph-screen-preview'));
    updateWorkspace();
    if (playing) updatePlayback(playing);
  }
  personal.refresh();
  focusSession.refresh();
  if (!dialog.open) dialog.showModal();
  updateWindowAvailability();
  const heading = content.querySelector<HTMLElement>('h2');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
  $('[data-panel-scroll]').scrollTop = 0;
  pet.setActive(false);
}

function updateClimatePanel() {
  if (panel !== 'climate') return;
  fireworks.refresh();
  const state = climate.getState();
  const info = climate.getLocalInfo();
  const status = content.querySelector('[data-local]');
  if (status) status.textContent = `${info.localDateTime} · ${info.timeZone}. ${localCopy(info)}`;
  content.querySelectorAll<HTMLInputElement>('input[name]').forEach(input => {
    if (input.name === 'animated') input.checked = animated;
    else if (input.name === 'auto') input.checked = state.auto;
    else if (input.name === 'season' || input.name === 'time' || input.name === 'weather') input.checked = state[input.name] === input.value;
  });
  const button = content.querySelector<HTMLButtonElement>('[data-action="location"]');
  if (button) {
    button.disabled = info.status === 'locating' || info.status === 'loading';
    button.textContent = button.disabled ? 'Connecting…' : info.status === 'live' ? 'Refresh location' : info.status === 'device' ? 'Use my location' : 'Retry location';
  }
}

function updateWorkspace() {
  scene.setWorkspace(workspace);
  for (const key of ['monitor', 'lamp', 'floorLamp'] as const) {
    root.querySelectorAll(`[data-action="${key}"]`).forEach(button => {
      button.setAttribute('aria-pressed', String(workspace[key]));
      button.setAttribute('aria-label', `Turn ${workspace[key] ? 'off' : 'on'} the ${key === 'monitor' ? 'computer monitor' : key === 'floorLamp' ? 'lounge floor lamp' : 'desk light'}`);
    });
    const label = content.querySelector(`[data-${key}-label]`);
    if (label) label.textContent = `Turn ${workspace[key] ? 'off' : 'on'} ${key === 'monitor' ? 'monitor' : key === 'floorLamp' ? 'lounge light' : 'desk light'}`;
  }
  const status = content.querySelector('[data-workspace-status]');
  if (status) status.textContent = `Monitor ${workspace.monitor ? 'on' : 'off'} · Desk light ${workspace.lamp ? 'on' : 'off'} · Lounge light ${workspace.floorLamp ? 'on' : 'off'}`;
}

root.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLElement>('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'climate' || action === 'clock' || action === 'calendar' || action === 'milky' || action === 'about' || action === 'workspace' || action === 'memo' || action === 'guestbook') openPanel(action, button);
  else if (action === 'album') void openAlbum(button);
  else if (action === 'monitor' || action === 'lamp' || action === 'floorLamp') { workspace[action] = !workspace[action]; updateWorkspace(); }
  else if (action === 'music') void sound.setEnabled(!sound.isEnabled());
  else if (action === 'coffee') scene.savorCoffee('desk');
  else if (action === 'diffuser') scene.scentDiffuser();
  else if (action === 'bed') {
    if (dialog.open) dialog.close();
    pet.setActive(true);
    pet.napInBed();
  }
  else if (action === 'bowl') {
    scene.strikeBowl();
    void bowlSound.strike().catch((error: unknown) => { console.error('Singing bowl playback failed', error instanceof Error ? error.message : error); });
  }
  else if (action === 'location') void climate.useLocation();
  else if (action === 'focus') {
    const focus = studio.dataset.focus !== 'true';
    studio.dataset.focus = String(focus);
    const restore = $<HTMLButtonElement>('.ph-restore');
    restore.hidden = !focus;
    if (dialog.open) dialog.close();
    (focus ? restore : roomFocusTarget()).focus();
  } else if (action && ['pet','sit','sleep','feed','play','run'].includes(action)) {
    dialog.close();
    pet.setActive(true);
    pet[action as 'pet'|'sit'|'sleep'|'feed'|'play'|'run']();
  }
}, options);
content.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.name === 'animated') { animated = input.checked; scene.setAnimated(animated); pet.setAnimated(animated); updateWindowAvailability(); }
  if (input.name === 'auto') climate.setAuto(input.checked);
  const season = CYBER_SEASONS.find(value => value === input.value);
  const time = CYBER_TIMES.find(value => value === input.value);
  const weather = CYBER_WEATHER.find(value => value === input.value);
  if (input.name === 'season' && season) climate.setSeason(season);
  if (input.name === 'time' && time) climate.setTime(time);
  if (input.name === 'weather' && weather) climate.setWeather(weather);
}, options);
dialog.addEventListener('close', () => { cancelAlbumLoad(); panel = ''; guestbook.close(); scene.setPreview(null); pet.setActive(!albumOpen); updateWindowAvailability(); if (!albumOpen) (studio.dataset.focus === 'true' ? $('.ph-restore') : roomFocusTarget()).focus(); }, options);
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
}, options);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') cancelAlbumLoad();
  if (root.querySelector('dialog[open]')) return;
  if (event.key === 'Escape' && studio.dataset.focus === 'true') $<HTMLButtonElement>('.ph-restore').click();
}, options);

applyClimate(climate.getState());
updateWorkspace();
if (!playing) $('[data-track-title]').textContent = 'Make yourself at home.';
// Clock is automatic immediately; location is an explicit, understandable action.
function destroy() {
  if (destroyed) return;
  destroyed = true; abort.abort(); visibleHotspots.disconnect(); clearTimeout(toastTimer); stopInfo();
  cancelAlbumLoad(); albumViewer?.destroy();
  focusSession.destroy(); fireworks.destroy(); personal.destroy(); mixer?.destroy(); guestbook.close();
  automaticFireworks.destroy(); stopFireworksCredits(); stopOpeningCredits(); climate.destroy(); scene.destroy(); seasonalDecor.destroy(); pet.destroy(); sound.destroy(); bowlSound.destroy();
}
window.addEventListener('pagehide', event => { if (!event.persisted) destroy(); }, options);
if (import.meta.hot) import.meta.hot.dispose(destroy);
