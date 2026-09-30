# Cozy studio implementation contract

## Product
A full-screen illustrated lakeside developer studio for Jieun Jeon. Keep the cream ID badge, blue glasses-face logo, black lanyard, flip and drag motion faithful to https://jieun.ai. Root owns art assets, scene layers, overall page and integration.

## Module boundaries

### Badge worker
Own `src/badge.ts`, `src/badge.css`, `public/assets/badge/*` only.
Export `mountBadge(container: HTMLElement): { destroy(): void }`.
The container is absolutely positioned by root in the scene on the right wall; fill its width. The badge component includes lanyard, front/back, pointer drag/swing, click/keyboard flip and reduced-motion support. CSS should be scoped `.id-badge-*`. Use original public site CSS/assets as reference and keep brand identity. Include meaningful accessible labels, no trap, back AI Class link to https://learn.jieun.ai. No need to own app shell.

### Environment worker
Own `src/environment.ts`, `src/environment.test.ts`, `src/environment-controls.ts`, `src/environment-controls.css` only.
Export types `Season = 'spring'|'summer'|'autumn'|'winter'`, `TimeOfDay = 'morning'|'noon'|'afternoon'|'evening'|'night'`.
Export `StudioState` with `{ season: Season; timeOfDay: TimeOfDay; auto: boolean; lampOn: boolean; curtainOpen: boolean; monitorOn: boolean; soundOn: boolean; motionOn: boolean }`.
Export `createEnvironment()` returning `{ getState(): StudioState; subscribe(listener:(state:StudioState)=>void):()=>void; setSeason(season:Season):void; setTimeOfDay(time:TimeOfDay):void; setAuto():void; toggleLamp():void; toggleCurtain():void; toggleMonitor():void; toggleSound():void; toggleMotion():void; destroy():void }`.
Use Seoul local time and calendar seasons by default. Manual lamp choice persists across time changes until Auto reset. Explicit season/time controls turn auto false. `setAuto()` returns all environment selections to real Seoul clock; curtain and monitor stay user-controlled. Safe localStorage, ignore invalid stored values, no browser dependencies at module top level so pure helpers can be tested with node. Offer `getSeoulEnvironment(date?:Date)` and `deriveTimeOfDay(hour:number,season:Season)` for tests. Automatic tick each minute and visibility return; detach on destroy. Respect OS reduced motion by default.
Export `mountEnvironmentControls(container:HTMLElement, environment:ReturnType<typeof createEnvironment>):{destroy():void}`. Compact refined off-white glass panel; all 5 times and 4 seasons selectable, Auto control, motion toggle. Korean accessible names, English small labels acceptable. CSS scoped `.env-*`; styles rely on `--ui-text`, `--ui-muted`, `--ui-surface`, `--ui-border`, `--ui-accent` defined by root. Controls will sit at bottom center, must fit mobile <=390px (can wrap or collapsible). No sound button required unless actual audio exists, so hide sound UI in first version.

## Root responsibilities
Generated production scene artwork, landscape, CSS lighting/day cycle, actual lamp/window/curtain/monitor/mug/plant/book interactions, season Easter eggs, mobile composition, main.ts, style.css, HTML. Root will mount environment control and badge modules. Don't edit these files from worker tasks.

## Acceptance
Production build, meaningful state tests, actual browser clicks and visual QA at desktop and mobile widths, working local preview. No live deployment is required. Final result includes project files and a localhost preview.
