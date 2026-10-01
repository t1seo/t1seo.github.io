import { openingCreditsMarkup } from './penthouse-opening-credits';
import { roomTimeObjectsMarkup } from './penthouse-time-objects';
import { mixerMarkup } from './penthouse-personal-markup';

export function roomMarkup(): string {
  return `
<main class="ph-studio night-studio" data-intro="hidden" data-focus="false" aria-label="Taewon Seo's Seoul studio">
  <div class="ph-stage night-scene">
    ${openingCreditsMarkup()}
    <div class="ph-room" data-time="night" data-season="autumn" data-weather="clear">
      <div class="ph-plates" data-plates role="img" aria-label="A frontal Seoul studio overlooking the Han River and N Seoul Tower through a wide window. A walnut desk faces the view with an Apple Studio Display, HHKB keyboard and a tall graphite and bronze desk lamp. An ivory-shade articulated floor lamp stands to the left of the lounge chair, casting warm light across its back and seat. A small black and gold fountain pen rests directly beside the keyboard, with a small fabric-front speaker between the books and monitor, a bronze singing bowl beside the pen, and a digital clock between the bowl and the right-hand desk lamp. A lounge and warm shelves frame the room."><img class="ph-plate" src="/assets/penthouse/seoul/autumn/night.webp" alt="" fetchpriority="high" draggable="false"></div>
      <div class="ph-weather" data-weather-wash aria-hidden="true"></div>
      <canvas class="ph-weather-canvas" aria-hidden="true"></canvas>
      <button class="ph-bed" data-action="bed" aria-label="Invite Milky to rest in the soft dog bed"><img src="/assets/penthouse/objects/milky-bed.webp" alt="" draggable="false" width="520" height="284"></button>
      <div class="ph-bed-front" aria-hidden="true"><img src="/assets/penthouse/objects/milky-bed.webp" alt="" draggable="false" width="520" height="284"></div>
      <div class="ph-pet" data-pet></div>
      <button class="ph-hotspot ph-hotspot--monitor" data-action="monitor" aria-label="Turn off the computer monitor" aria-pressed="true"></button>
      <button class="ph-hotspot ph-hotspot--lamp" data-action="lamp" aria-label="Turn on the desk light" aria-pressed="false"></button>
      <button class="ph-hotspot ph-hotspot--audio" data-action="music" aria-label="Play music on the small desktop speaker" aria-pressed="false"></button>
      <button class="ph-hotspot ph-hotspot--pen" data-action="guestbook" aria-label="Open the guestbook" aria-haspopup="dialog"></button>
      <button class="ph-hotspot ph-hotspot--book" data-action="about" aria-label="Read about this studio"></button>
      <button class="ph-hotspot ph-hotspot--coffee" data-action="coffee" aria-label="Enjoy the aroma of the desk coffee"></button>
      <button class="ph-hotspot ph-hotspot--diffuser" data-action="diffuser" aria-label="Release a little fragrance from the reed diffuser"></button>
      <button class="ph-hotspot ph-hotspot--floor-lamp" data-action="floorLamp" aria-label="Turn off the lounge floor lamp" aria-pressed="true"></button>
      <button class="ph-hotspot ph-hotspot--bowl" data-action="bowl" aria-label="Ring the bronze singing bowl"></button>
      ${roomTimeObjectsMarkup()}
    </div>
  </div>
  <button class="ph-restore" data-action="focus" aria-label="Show clock and calendar" hidden>Return to the room</button>
  <div class="ph-toast" role="status" aria-live="polite"></div>
  <dialog class="ph-dialog" aria-labelledby="ph-dialog-title">
    <header class="ph-panel-header"><span class="ph-panel-identity"><span aria-hidden="true">✦</span> THE SEOUL STUDIO</span><form method="dialog"><button class="ph-close" aria-label="Close panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></form></header>
    <nav class="ph-panel-nav" aria-label="Studio settings"><button data-action="climate">Atmosphere</button><button data-action="workspace">Desk</button><button data-action="milky">Milky</button><button data-action="guestbook">Guestbook</button><button data-action="about">About</button></nav>
    <div class="ph-panel-scroll" data-panel-scroll><div data-dialog-content></div><div data-panel-mixer hidden>${mixerMarkup()}</div></div>
    <footer class="ph-panel-footer"><div class="ph-panel-sound"><button data-action="music" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/></svg><span data-music-label>Play music</span></button><a class="ph-track" href="/assets/music/CREDITS.html" target="_blank" rel="noopener noreferrer" aria-label="Music credits"><span data-track-status>MUSIC IS OFF</span><span data-track-title>Make yourself at home.</span></a></div><button class="ph-immerse" data-action="focus" aria-label="Immerse in the room"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/></svg><span>Immerse</span></button></footer>
  </dialog>
</main>`;
}
