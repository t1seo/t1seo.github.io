import './cyber-studio.css';
import { mountCyberAtmosphere } from './cyber-atmosphere';
import { mountCyberTerminal } from './cyber-terminal';
import { createCyberSound, type CyberPlaybackState } from './cyber-sound';
import { mountCyberDeskEffects } from './cyber-desk-effects';
import { applyDeskLayout, DESK_FOREGROUND } from './cyber-desk-layout';
import { mountCyberPet } from './cyber-pet';
import { createCyberClimate, type ClimateState } from './cyber-climate';
import { mountCyberClimateControls } from './cyber-climate-controls';
import { mountScenePlates } from './cyber-scene-plates';
import { mountCyberIntro } from './cyber-intro';

const icons = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  rain: '<path d="M5 11a5 5 0 0 1 3-9 6 6 0 0 1 10 5 3 3 0 0 1 0 6H5m2 3-1 3m6-3-1 3m6-3-1 3"/>',
  climate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  sound: '<path d="M11 5 6 9H3v6h3l5 4V5Zm4 4a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>',
  lamp: '<path d="M8 4h8l4 10H4L8 4Zm4 10v6m-4 0h8"/>',
  focus: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  desk: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
};
const svg = (key: keyof typeof icons) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg>`;

const root = document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML = `
<main class="night-studio" data-intro="visible" data-lamp="off" data-rain="off" data-sound="off" aria-label="Taewon Seo's studio">
  <div class="night-scene" aria-label="A high-rise workspace overlooking a modern riverside city">
    <div class="night-plane">
      <div class="night-plates" role="img" aria-label="An illustrated workspace above a modern riverside city, with a glowing computer.">
        <img class="night-plate" data-season="summer" src="/assets/cyberpunk/climate/summer-night.webp" alt="" fetchpriority="high" draggable="false" />
      </div>
      <div class="night-atmosphere" aria-hidden="true"></div>
      <div class="night-lamp-light" aria-hidden="true"><i class="night-lamp-bulb"></i><i class="night-lamp-halo"></i><i class="night-lamp-pool"></i></div>
      <div class="night-monitor"><div data-terminal></div></div>
      <div class="night-monitor-glow" aria-hidden="true"></div>
      <div class="night-keyboard-glow" aria-hidden="true"></div>
      <div class="night-pet" data-pet></div>
      <button class="night-object night-object--monitor" data-action="code" aria-label="Start coding on the monitor"></button>
      <button class="night-object night-object--keyboard" data-action="code" aria-label="Type on the keyboard"></button>
      <button class="night-object night-object--lamp" data-action="lamp" aria-label="Desk lamp" aria-pressed="true"></button>
      <button class="night-object night-object--speaker" data-action="sound" aria-label="Play music on the right speaker" aria-pressed="false"></button>
      <button class="night-object night-object--speaker-left" data-action="sound" aria-label="Play music on the left speaker" aria-pressed="false"></button>
      <button class="night-object night-object--bowl" data-action="bowl" aria-label="Gently strike the singing bowl"></button>
      <button class="night-object night-object--coffee" data-action="coffee" aria-label="Take a coffee break"></button>
      <button class="night-object night-object--book" data-action="note" aria-label="Open the notebook"></button>
      <button class="night-object night-object--pen" data-action="pen" aria-label="Write a note with the fountain pen"></button>
    </div>
  </div>
  <div class="night-vignette" aria-hidden="true"></div>
  <div class="night-grain" aria-hidden="true"></div>
  <header class="night-header">
    <button class="night-brand" data-action="intro" aria-label="Show Taewon Seo introduction"><img class="night-brand-mark" src="/assets/logo-options/smile-01-white-ears.webp" width="48" height="48" alt="" draggable="false" /><span>TAEWON SEO</span></button>
    <div class="night-header-right"><span class="night-edition">A PERSONAL SPACE</span><button class="night-about" data-action="about">About the room <span aria-hidden="true">↗</span></button></div>
  </header>
  <section class="night-intro" aria-label="Introduction">
    <p class="night-eyebrow"><span></span> SOMEWHERE AFTER HOURS</p>
    <h1 aria-label="Taewon Seo"><span class="night-title-line"><span>Taewon</span></span><span class="night-title-line"><span>Seo<span class="night-period">.</span></span></span></h1>
    <p class="night-intro-copy">Above the noise.<br />A little closer to the next idea.</p>
    <button class="night-enter" data-action="enter"><span class="night-enter-icon">${svg('arrow')}</span><span>Step inside</span></button>
  </section>
  <aside class="night-scene-label" aria-hidden="true"><span>01 — NIGHT SHIFT</span><i></i><span>THE CITY NEVER REALLY SLEEPS</span></aside>
  <footer class="night-footer">
    <div class="night-footer-caption"><span class="night-live-dot"></span><span class="night-caption-title">STILL MAKING THINGS.</span><span class="night-caption-sub">A room of one's own.</span></div>
    <div class="night-controls" role="group" aria-label="Room atmosphere">
      <button data-action="climate" aria-label="Change season, time and weather" aria-haspopup="dialog">${svg('climate')}<span>Climate</span></button>
      <button data-action="sound" aria-label="Play climate-selected music" aria-pressed="false">${svg('sound')}<span>Music</span><span class="night-equalizer" aria-hidden="true"><i></i><i></i><i></i></span></button>
      <span class="night-control-divider" aria-hidden="true"></span>
      <button data-action="lamp" aria-label="Desk lamp" aria-pressed="true">${svg('lamp')}<span class="night-control-extra">Light</span></button>
      <button data-action="focus" aria-label="Focus on the room" aria-pressed="false">${svg('focus')}<span class="night-control-extra">Focus</span></button>
      <button class="night-desk-control" data-action="desk" aria-label="Open desk controls">${svg('desk')}<span>Desk</span></button>
    </div>
  </footer>
  <a class="night-now-playing" href="/assets/music/CREDITS.html" target="_blank" rel="noopener noreferrer" hidden><span class="night-track-label">NOW PLAYING</span><span class="night-track-title"></span><span class="night-track-artist"></span></a>
  <div class="night-toast" role="status" aria-live="polite"></div>
  <dialog class="night-dialog" aria-labelledby="room-dialog-title">
    <button class="night-dialog-close" data-action="close" aria-label="Close panel">${svg('close')}</button>
    <div class="night-dialog-content"></div>
  </dialog>
  <span class="night-live sr-only" aria-live="polite"></span>
</main>`;

const studio = root.querySelector<HTMLElement>('.night-studio')!;
const scene = root.querySelector<HTMLElement>('.night-scene')!;
const plane = root.querySelector<HTMLElement>('.night-plane')!;
const intro = root.querySelector<HTMLElement>('.night-intro')!;
const plate = root.querySelector<HTMLImageElement>('.night-plate')!;
const terminalHost = root.querySelector<HTMLElement>('[data-terminal]')!;
const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
const content = root.querySelector<HTMLElement>('.night-dialog-content')!;
const toast = root.querySelector<HTMLElement>('.night-toast')!;
const live = root.querySelector<HTMLElement>('.night-live')!;
const abort = new AbortController();
const options = { signal: abort.signal };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(pointer: fine)');
const terminal = mountCyberTerminal(terminalHost);
const atmosphere = mountCyberAtmosphere(root.querySelector<HTMLElement>('.night-atmosphere')!, {
  windowPolygon: [[.255,.03],[1,0],[1,.60],[.93,.60],[.93,.63],[.255,.622]],
  foregroundPolygons: DESK_FOREGROUND,
});
const sound = createCyberSound();
const deskEffects = mountCyberDeskEffects(plane);
applyDeskLayout(root);
const pet = mountCyberPet(root.querySelector<HTMLElement>('[data-pet]')!);
const introMotion = mountCyberIntro(intro);
introMotion.setVisible(false);
let lightOn = true;
let lampOverride: boolean | null = null;
let soundOn = false;
let soundRequested = false;
let soundRequest = 0;
let focused = false;
let showIntro = true;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let compileTimer: ReturnType<typeof setTimeout> | undefined;
let lastDialogTrigger: HTMLElement | null = null;
let disposed = false;
let climatePanel: ReturnType<typeof mountCyberClimateControls> | undefined;
let sceneRevision = 0;
const plates = mountScenePlates(root.querySelector<HTMLElement>('.night-plates')!, () => {
  announce('This room scene could not load. Your previous view is still available. Try another time, or reload.');
}, seasons => atmosphere.setVisibleSeasons(seasons));
const climate = createCyberClimate(applyClimate);

const setPressed = (action: string, value: boolean) => {
  root.querySelectorAll(`[data-action="${action}"]`).forEach(button => button.setAttribute('aria-pressed', String(value)));
};

function announce(message: string) { live.textContent = message; }
function flashNote(message: string) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4400);
}
function setIntro(visible: boolean) {
  showIntro = visible;
  studio.dataset.intro = visible ? 'visible' : 'hidden';
  intro.inert = !visible;
  intro.setAttribute('aria-hidden', String(!visible));
  syncIntroMotion();
}
function syncIntroMotion() {
  introMotion.setVisible(showIntro && studio.classList.contains('is-ready') && !dialog.open);
}
function scheduleIntro() {
  clearTimeout(idleTimer);
  if (!showIntro && !focused && !dialog.open && !document.hidden) {
    idleTimer = setTimeout(() => { if (!dialog.open && !focused) setIntro(true); }, 45_000);
  }
}
function enterRoom() { setIntro(false); scheduleIntro(); }

function toggleLight() {
  lightOn = !lightOn;
  lampOverride = lightOn;
  studio.dataset.lamp = lightOn ? 'on' : 'off';
  setPressed('lamp', lightOn);
  announce(`Desk lamp ${lightOn ? 'on' : 'off'}.`);
}
function applyClimate(state: ClimateState) {
  const labels = { morning: 'Morning light', noon: 'At midday', afternoon: 'The golden hours', evening: 'Blue hour', night: 'After hours' };
  const caption = `${state.season} · ${state.time} · ${state.weather}`;
  studio.dataset.season = state.season;
  studio.dataset.time = state.time;
  studio.dataset.weather = state.weather;
  studio.dataset.rain = state.weather === 'rain' ? 'on' : 'off';
  studio.dataset.daylight = String(!['evening', 'night'].includes(state.time));
  atmosphere.setClimate(state);
  sound.setClimate(state);
  deskEffects.setClimate(state);
  lightOn = lampOverride ?? (['evening', 'night'].includes(state.time) || ['rain', 'snow', 'mist'].includes(state.weather));
  studio.dataset.lamp = lightOn ? 'on' : 'off';
  setPressed('lamp', lightOn);
  root.querySelector<HTMLElement>('.night-caption-sub')!.textContent = caption;
  root.querySelector<HTMLElement>('.night-eyebrow')!.innerHTML = `<span></span> ${labels[state.time].toUpperCase()}`;
  root.querySelector<HTMLElement>('.night-scene-label > span')!.textContent = `${state.season.toUpperCase()} — ${state.time.toUpperCase()}`;
  root.querySelector<HTMLElement>('.night-scene-label > span:last-child')!.textContent = 'ONE ROOM, A THOUSAND LITTLE MOMENTS';
  root.querySelector<HTMLElement>('.night-plates')!.setAttribute('aria-label', `An illustrated ${state.season} studio above a contemporary riverside city, ${state.time}, ${state.weather} weather.`);
  root.querySelector<HTMLElement>('[data-action="climate"]')!.setAttribute('title', caption);
  climatePanel?.sync(state);
  const revision = ++sceneRevision;
  studio.dataset.changing = 'true';
  void plates.setScene(state.season, state.time).then(() => {
    if (!disposed && revision === sceneRevision) studio.dataset.changing = 'false';
  });
}
async function toggleSound() {
  const revision = ++soundRequest;
  soundRequested = !soundRequested;
  await sound.setEnabled(soundRequested);
  if (disposed || revision !== soundRequest) return;
  soundOn = sound.isEnabled();
  soundRequested = soundOn;
  setPressed('sound', soundOn);
  if (!soundOn) announce('Music off.');
}
function updatePlayback(state: CyberPlaybackState) {
  soundOn = state.enabled;
  soundRequested = state.enabled;
  studio.dataset.sound = state.playing ? 'on' : 'off';
  studio.dataset.musicLoading = String(state.loading);
  setPressed('sound', state.enabled);
  deskEffects.setMusic(state.playing);
  const nowPlaying = root.querySelector<HTMLAnchorElement>('.night-now-playing')!;
  nowPlaying.hidden = !state.enabled;
  nowPlaying.querySelector<HTMLElement>('.night-track-label')!.textContent = state.loading ? 'TUNING IN' : state.playing ? 'NOW PLAYING' : 'PAUSED';
  nowPlaying.querySelector<HTMLElement>('.night-track-title')!.textContent = state.track.title;
  nowPlaying.querySelector<HTMLElement>('.night-track-artist')!.textContent = state.track.artist;
  nowPlaying.setAttribute('aria-label', `${state.track.title} by ${state.track.artist}. Music credits, opens in a new tab.`);
  if (state.error) flashNote(state.error);
  else if (state.playing) announce(`Now playing ${state.track.title} by ${state.track.artist}.`);
}
function showPanel(type: 'about' | 'note' | 'desk' | 'climate', trigger: HTMLElement) {
  const replacing = dialog.open;
  if (!replacing) lastDialogTrigger = trigger;
  clearTimeout(idleTimer);
  climatePanel?.destroy();
  climatePanel = undefined;
  dialog.dataset.panel = type;
  if (type === 'climate') {
    content.innerHTML = `<p class="night-panel-kicker">A DIFFERENT KIND OF DAY</p><h2 id="room-dialog-title">Stay a little.<br />Change the view.</h2><div class="night-climate-controls"></div><span class="night-panel-foot">SAME ROOM. A NEW FEELING.</span>`;
    climatePanel = mountCyberClimateControls(content.querySelector<HTMLElement>('.night-climate-controls')!, climate);
  } else if (type === 'note') {
    content.innerHTML = `<p class="night-panel-kicker">PRIVATE NOTES / 001</p><h2 id="room-dialog-title">Good things<br />take quiet hours.</h2><div class="night-note-rule"></div><p>Leave a little space for the idea you haven't had yet.</p><label class="night-note-label" for="quiet-note">One thought worth keeping</label><textarea id="quiet-note" class="night-note-input" maxlength="500" rows="3" placeholder="A thought, in your own words…" spellcheck="true"></textarea><p class="night-note-saved">Saved on this device.</p><p class="night-note-signature">Keep going,<br /><span>Taewon.</span></p><span class="night-panel-foot">SOMEWHERE ABOVE THE NOISE</span>`;
    const note = content.querySelector<HTMLTextAreaElement>('#quiet-note')!;
    try { note.value = localStorage.getItem('taewon.studio.note.v1') ?? ''; } catch { content.querySelector('.night-note-saved')!.textContent = 'Your note stays here while this panel is open.'; }
    note.addEventListener('input', () => {
      try { localStorage.setItem('taewon.studio.note.v1', note.value); }
      catch { content.querySelector('.night-note-saved')!.textContent = 'Your note stays here while this panel is open.'; }
    });
  } else if (type === 'desk') {
    content.innerHTML = `<p class="night-panel-kicker">THE SMALL HOURS</p><h2 id="room-dialog-title">At your desk.</h2><div class="night-desk-actions"><button data-action="code"><span>01</span> Write a little code ${svg('arrow')}</button><button data-action="coffee"><span>02</span> Take a coffee break ${svg('arrow')}</button><button data-action="bowl"><span>03</span> Ring the singing bowl ${svg('arrow')}</button><button data-action="sound" aria-pressed="${soundOn}"><span>04</span> Listen to the room ${svg('arrow')}</button><button data-action="pen"><span>05</span> Put a thought on paper ${svg('arrow')}</button></div><fieldset class="night-pet-actions"><legend>A MOMENT WITH MILKY</legend><button data-action="pet">Say hello</button><button data-action="pet-sit">Sit together</button><button data-action="pet-sleep">Take a nap</button><button data-action="pet-feed">Meal time</button><button data-action="pet-play">Play ball</button><button data-action="pet-run">A little trot</button></fieldset><span class="night-panel-foot">TAEWON SEO — AFTER HOURS</span>`;
  } else {
    content.innerHTML = `<p class="night-panel-kicker">A ROOM OF ONE'S OWN</p><h2 id="room-dialog-title">After hours.<br />Before the next idea.</h2><p>A personal space for Taewon Seo, looking out on a city that never quite goes to sleep.</p><p>Four seasons outside. Little changes inside. And Milky, keeping you company.</p><div class="night-note-rule"></div><p class="night-panel-credits">Seasonal room illustrations created for this space. Milky's appearance and movement are inspired by his real photos and video. Milky’s white-ear smile is our little signature. <a href="/milky-logo-options.html">Explore the logo collection</a>. Typography: <a href="https://github.com/floriankarsten/space-grotesk" target="_blank" rel="noopener noreferrer">Space Grotesk</a> &amp; <a href="https://www.jetbrains.com/lp/mono/" target="_blank" rel="noopener noreferrer">JetBrains Mono</a>. Music by Kevin MacLeod and Scott Buckley, licensed under CC BY 4.0 — <a href="/assets/music/CREDITS.html" target="_blank" rel="noopener noreferrer">tracks &amp; credits</a>. Rain, singing bowl and cup sounds synthesized locally.</p><span class="night-panel-foot">TAEWON SEO — AFTER HOURS</span>`;
  }
  terminal.setActive(false);
  atmosphere.setActive(false);
  pet.setActive(false);
  deskEffects.setActive(false);
  if (!dialog.open) dialog.showModal();
  syncIntroMotion();
  if (replacing) {
    const heading = content.querySelector<HTMLElement>('h2');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
}
function closePanel() { if (dialog.open) dialog.close(); }

root.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target || !root.contains(target)) return;
  const action = target.dataset.action;
  if (target.classList.contains('night-object')) enterRoom();
  switch (action) {
    case 'enter': enterRoom(); root.querySelector<HTMLButtonElement>('[data-action="code"]')?.focus({ preventScroll: true }); break;
    case 'intro': focused = false; setPressed('focus', false); studio.dataset.focus = 'false'; setIntro(true); break;
    case 'focus': focused = !focused; setPressed('focus', focused); studio.dataset.focus = String(focused); setIntro(!focused); scheduleIntro(); break;
    case 'code': closePanel(); terminal.setActive(true); enterRoom(); terminal.start(); announce('Coding started.'); break;
    case 'lamp': toggleLight(); break;
    case 'climate': showPanel('climate', target); break;
    case 'sound': void toggleSound(); break;
    case 'bowl':
      closePanel(); enterRoom(); deskEffects.setActive(true);
      deskEffects.strikeBowl(); void sound.playBowl();
      announce('A gentle note, and a little space to breathe.');
      break;
    case 'coffee':
      closePanel(); enterRoom();
      deskEffects.setActive(true); deskEffects.coffee(); void sound.playCup();
      flashNote('The city can wait. Take a little moment.');
      break;
    case 'pen': showPanel('note', target); content.querySelector<HTMLTextAreaElement>('#quiet-note')?.focus({ preventScroll: true }); break;
    case 'note': showPanel('note', target); break;
    case 'about': showPanel('about', target); break;
    case 'desk': showPanel('desk', target); break;
    case 'pet': closePanel(); pet.setActive(true); enterRoom(); pet.pet(); break;
    case 'pet-sit': closePanel(); pet.setActive(true); enterRoom(); pet.sit(); break;
    case 'pet-sleep': closePanel(); pet.setActive(true); enterRoom(); pet.sleep(); break;
    case 'pet-feed': closePanel(); pet.setActive(true); enterRoom(); pet.feed(); break;
    case 'pet-play': closePanel(); pet.setActive(true); enterRoom(); pet.play(); break;
    case 'pet-run': closePanel(); pet.setActive(true); enterRoom(); pet.run(); break;
    case 'close': closePanel(); break;
  }
}, options);

scene.addEventListener('click', (event) => {
  if (!(event.target as HTMLElement).closest('button')) enterRoom();
}, options);
scene.addEventListener('pointermove', (event) => {
  if (reducedMotion.matches || !finePointer.matches || dialog.open) return;
  const bounds = scene.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  plane.style.setProperty('--pan-x', `${-x * 9}px`);
  plane.style.setProperty('--pan-y', `${-y * 5}px`);
}, options);
scene.addEventListener('pointerleave', () => {
  plane.style.setProperty('--pan-x', '0px'); plane.style.setProperty('--pan-y', '0px');
}, options);
for (const event of ['pointerdown', 'keydown', 'pointermove'] as const) {
  root.addEventListener(event, scheduleIntro, { ...options, passive: true });
}

terminalHost.addEventListener('cyber:compiled', () => {
  clearTimeout(compileTimer);
  studio.classList.add('is-compiled');
  announce('Code compiled. All systems quiet.');
  compileTimer = setTimeout(() => studio.classList.remove('is-compiled'), 1600);
}, options);
root.addEventListener('cyber:pet', (event) => {
  enterRoom();
  const messages: Record<string, string> = { greet: 'Milky is happy to see you.', feed: 'Meal time for Milky.', play: 'Milky is playing with a little ball.', run: 'Milky is off for a little trot.' };
  const message = messages[(event as CustomEvent<{ kind: string }>).detail.kind];
  if (message) announce(message);
}, options);
document.addEventListener('cyber:track', (event) => updatePlayback((event as CustomEvent<CyberPlaybackState>).detail), options);
// Keep the keyboard reflected light in sync with actual typed characters.
const editorObserver = new MutationObserver(() => {
  studio.classList.toggle('is-coding', terminalHost.classList.contains('cyber-terminal--typing'));
});
editorObserver.observe(terminalHost, { attributes: true, attributeFilter: ['class'] });
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePanel();
}, options);
dialog.addEventListener('close', () => {
  climatePanel?.destroy(); climatePanel = undefined;
  terminal.setActive(true); atmosphere.setActive(true); pet.setActive(true); deskEffects.setActive(true); scheduleIntro();
  syncIntroMotion();
  lastDialogTrigger?.focus({ preventScroll: true });
}, options);
document.addEventListener('visibilitychange', () => {
  studio.classList.toggle('is-paused', document.hidden);
  syncIntroMotion();
  scheduleIntro();
}, options);
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) { plane.style.setProperty('--pan-x', '0px'); plane.style.setProperty('--pan-y', '0px'); }
}, options);

function resize() {
  const bounds = scene.getBoundingClientRect();
  const ratio = 1672 / 941;
  const width = Math.max(bounds.width, bounds.height * ratio);
  const height = width / ratio;
  // Narrow screens retain the actual workstation instead of centering an empty crop.
  const anchor = bounds.width / bounds.height < 1.3 ? .675 : .5;
  plane.style.width = `${width}px`;
  plane.style.height = `${height}px`;
  plane.style.left = `${(bounds.width - width) * anchor}px`;
  plane.style.top = `${(bounds.height - height) * .5}px`;
  // Cover cropping must not leave invisible objects in the keyboard tab order.
  root.querySelectorAll<HTMLButtonElement>('.night-object').forEach(button => {
    const rect = button.getBoundingClientRect();
    const visibleWidth = Math.max(0, Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top));
    const visible = visibleWidth >= Math.min(24, rect.width * .5) && visibleHeight >= Math.min(24, rect.height * .5);
    button.tabIndex = visible ? 0 : -1;
    if (visible) button.removeAttribute('aria-hidden'); else button.setAttribute('aria-hidden', 'true');
  });
}
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(scene);
resize();
applyClimate(climate.getState());
void climate.start();
function ready() { studio.classList.add('is-ready'); syncIntroMotion(); }
if (plate.complete) ready(); else plate.addEventListener('load', ready, { once: true, ...options });
plate.addEventListener('error', () => { ready(); announce('The room image could not load. Please reload the page.'); }, { once: true, ...options });

function destroy() {
  if (disposed) return;
  disposed = true;
  abort.abort();
  for (const timer of [idleTimer, toastTimer, compileTimer]) clearTimeout(timer);
  resizeObserver.disconnect(); editorObserver.disconnect();
  terminal.destroy(); atmosphere.destroy(); sound.destroy(); pet.destroy(); deskEffects.destroy();
  introMotion.destroy();
  climatePanel?.destroy(); climate.destroy(); plates.destroy();
}
if (import.meta.hot) import.meta.hot.dispose(destroy);
