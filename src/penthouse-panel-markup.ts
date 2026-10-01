import { CYBER_SEASONS, CYBER_TIMES, CYBER_WEATHER } from './cyber-climate';
import { roomTimeObjectsMarkup } from './penthouse-time-objects';
import { focusMarkup, memoMarkup, presetsMarkup } from './penthouse-personal-markup';
import { photoMotionButtonsMarkup } from './penthouse-photo-motions-ui';

const pretty = (value: string) => (value[0] ?? '').toUpperCase() + value.slice(1);
const group = (key: string, values: readonly string[]) => `<fieldset><legend>${pretty(key)}</legend><div class="ph-options">${values.map(value => `<label><input type="radio" name="${key}" value="${value}"><span>${pretty(value)}</span></label>`).join('')}</div></fieldset>`;
const action = (name: string, label: string) => `<button data-action="${name}">${label}<span aria-hidden="true">↗</span></button>`;

function atmosphereMarkup(name: string): string {
  return `<p class="ph-overline">SETTLE INTO THE MOMENT</p>
    <h2 id="ph-dialog-title" tabindex="-1">${name === 'clock' ? 'Time & focus.' : 'Your atmosphere.'}</h2>
    <p class="ph-panel-intro">A different light, a change of season. Make the room yours.</p>
    ${name === 'clock' ? focusMarkup() : ''}
    <div class="ph-auto">
      <label><input type="checkbox" name="auto"> Follow my local time</label>
      <p class="ph-local-status" data-local></p>
      <button data-action="location">Use my location</button>
      <p class="ph-panel-note">Location adds local weather. Approximate coordinates stay only for this visit.</p>
    </div>
    ${name === 'calendar' ? group('season', CYBER_SEASONS) + group('time', CYBER_TIMES) : group('time', CYBER_TIMES) + group('season', CYBER_SEASONS)}
    ${group('weather', CYBER_WEATHER)}
    <label class="ph-motion-control"><input type="checkbox" name="animated"> Animate the view</label>
    <p class="ph-panel-note">Choosing a scene pauses Auto. Reduced motion keeps the room still.</p>
    <section class="ph-panel-section" aria-label="Fireworks festival"><span class="ph-section-label">Fireworks festival</span>
      <div class="ph-pet-actions"><button type="button" data-action="fireworks" aria-pressed="false" aria-describedby="ph-fireworks-status">Watch fireworks</button></div>
      <p id="ph-fireworks-status" class="ph-panel-note" role="status" data-fireworks-status>A one-minute celebration over the Han River.</p>
    </section>
    ${name === 'clock' ? '' : `<div class="ph-pet-actions">${action('clock', 'Open the focus timer')}</div>`}
    ${presetsMarkup()}`;
}

function workspaceMarkup(): string {
  return `<p class="ph-overline">A PLACE FOR IDEAS</p><h2 id="ph-dialog-title">Facing Seoul.</h2>
    <p class="ph-panel-intro">A walnut desk, a quiet view, and a little space to think.</p>
    <div class="ph-desk-detail"><canvas class="ph-desk-preview" aria-label="Close-up of the monitor, keyboard, small speaker, singing bowl, clock and tall desk lamp"></canvas>${roomTimeObjectsMarkup()}</div>
    <div class="ph-quick-links">
      <button data-action="memo"><strong>Your desk note <span aria-hidden="true">↗</span></strong><small>Private · saved in this browser</small></button>
      <button data-action="guestbook"><strong>The guestbook <span aria-hidden="true">↗</span></strong><small>Public · a hello for everyone</small></button>
    </div>
    <section class="ph-panel-section" aria-label="Desk and lighting"><span class="ph-section-label">Desk & lighting</span><div class="ph-pet-actions ph-compact-actions">
      <button data-action="monitor" aria-pressed="true"><span data-monitor-label>Turn off monitor</span><span aria-hidden="true">↗</span></button>
      <button data-action="lamp" aria-pressed="true"><span data-lamp-label>Turn off desk light</span><span aria-hidden="true">↗</span></button>
      <button data-action="floorLamp" aria-pressed="true"><span data-floorLamp-label>Turn off lounge light</span><span aria-hidden="true">↗</span></button>
      ${action('clock', 'Focus timer')}
    </div><p class="ph-workspace-status" role="status" data-workspace-status></p></section>
    <section class="ph-panel-section" aria-label="Small rituals"><span class="ph-section-label">Small rituals</span><div class="ph-pet-actions ph-compact-actions">
      ${action('coffee', 'Warm coffee')}${action('bowl', 'Singing bowl')}${action('diffuser', 'Reed diffuser')}${action('calendar', 'Saved atmospheres')}
    </div></section>
    <canvas class="ph-screen-preview" aria-label="Detailed studio screen showing a TypeScript editor, file list and the current Seoul view" hidden></canvas>
    <details class="ph-panel-disclosure"><summary>The objects in the room</summary><p class="ph-panel-note">An Apple Studio Display, ivory HHKB, fountain pen and fabric-front speaker share the walnut desk. Switch the monitor off and on to replay the editor. Each lamp has its own light.</p><div class="ph-about-links"><a href="/design/research/penthouse-objects/report.html" target="_blank" rel="noopener">Objects, materials & research <span aria-hidden="true">↗</span></a></div></details>`;
}

export function panelMarkup(name: string): string {
  if (name === 'memo') return memoMarkup();
  if (name === 'guestbook') return '<h2 id="ph-dialog-title" tabindex="-1">Guestbook.</h2><p role="status">Opening the guestbook…</p>';
  if (name === 'clock' || name === 'calendar' || name === 'climate') return atmosphereMarkup(name);
  if (name === 'workspace') return workspaceMarkup();
  if (name === 'milky') return `<p class="ph-overline">YOUR LITTLE ROOMMATE</p><h2 id="ph-dialog-title">Meet Milky.</h2>
    <p class="ph-panel-intro">A little Maltese, with the run of the place.</p>
    <button class="ph-album-link" data-action="album" aria-haspopup="dialog"><span class="ph-album-link-book" aria-hidden="true"></span><span><strong>Milky’s Photo Album</strong><small>Open the photo album</small></span><span aria-hidden="true">↗</span></button>
    <span class="ph-section-label">Spend a moment together</span><div class="ph-pet-actions ph-compact-actions">
      ${[['pet','Say hello'],['sit','Sit with me'],['sleep','Take a nap'],['bed','Rest in the bed'],['feed','Dinner time'],['play','Play ball'],['run','A little run']].map(([name,label]) => action(name ?? '', label ?? '')).join('')}
    </div>
    <details class="ph-panel-disclosure ph-photo-moments"><summary>Little moments</summary>
      <div class="ph-pet-actions ph-compact-actions">${photoMotionButtonsMarkup()}</div>
      <p class="ph-panel-note" id="ph-photo-motion-status" data-photo-motion-status role="status">Small moments inspired by Milky’s photographs.</p>
    </details>
    <div class="ph-auto ph-milky-note"><p>Roll the red ball across the floor and Milky will follow. A short drag makes a gentle roll; a longer one invites a chase.</p><p class="ph-panel-note">You can also click Milky. With Milky focused, use the arrow keys to walk, S to sit and N to nap.</p></div>`;
  return `<p class="ph-overline">A PERSONAL SPACE BY TAEWON SEO</p><h2 id="ph-dialog-title">Seoul, in view.</h2>
    <p class="ph-panel-intro">A quiet room above the Han River. A desk facing the horizon, warm shelves, and a soft corner for Milky.</p>
    <p>Four seasons, five times of day, and weather on the glass. Stay a while, put a record on, or leave a hello in the guestbook.</p>
    <div class="ph-pet-actions">${action('guestbook', 'Leave a little hello')}${action('climate', 'Find your atmosphere')}</div>
    <details class="ph-panel-disclosure"><summary>Behind the room</summary><p class="ph-panel-note">The view is an illustration of Seoul. Auto follows your local clock; optional location adds your local weather.</p><div class="ph-about-links">
      <a href="/design/research/penthouse-objects/report.html" target="_blank" rel="noopener">Objects & materials <span aria-hidden="true">↗</span></a>
      <a href="/design/research/penthouse-layout/report.html" target="_blank" rel="noopener">Room composition <span aria-hidden="true">↗</span></a>
      <a href="/design/research/penthouse-atmosphere/report.html" target="_blank" rel="noopener">Living weather <span aria-hidden="true">↗</span></a>
      <a href="/design/research/penthouse-rebuild/report.html" target="_blank" rel="noopener">Design journal <span aria-hidden="true">↗</span></a>
      <a href="/?interior=original">The original studio <span aria-hidden="true">↗</span></a>
      <a href="/?interior=noir">The first Noir restyle <span aria-hidden="true">↗</span></a>
      <a href="/assets/music/CREDITS.html" target="_blank" rel="noopener">Music credits <span aria-hidden="true">↗</span></a>
    </div></details>`;
}
