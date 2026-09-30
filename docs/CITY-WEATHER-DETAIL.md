# City and weather detail

The window now has 44 registered building panes with independent, slow occupancy changes, three depths of rain/snow, eight sparse glass-drop paths, and moving river glints. The existing bridge traffic follows its original registered path. No controls, artwork, dependencies, storage preferences, or room layout were changed.

## Behavior

- Building panes hold a warm glow, then dim over approximately 11–19 seconds. Their cycles differ, with only a small secondary fluctuation. Daylight and rain/mist continue to attenuate city lighting.
- Rain uses longer, clearer streaks whose angle matches their scene-space movement. Snow has separate fall speeds, sizes, and gentle shared/individual drift. Near particles remain sparse.
- Glass droplets pause on the pane, then trickle vertically, fading before recycling. They use the same window and foreground clipping as the outdoor weather.
- River glints advance within registered water channels and fade before wrapping. Two columns hidden entirely behind the monitor were removed. Bridge traffic is retained.
- Analytical motion depends only on retained scene time. Hidden tabs, `setActive(false)`, and reduced motion stop RAF work without accumulating wall-clock catch-up. Reduced motion keeps a still weather illustration.
- Canvas painting remains capped at 30 fps and DPR 1.5. Particle budgets are capped at 140 rain / 100 snow / 10 seasonal fragments; the normal window uses fewer. No particle DOM nodes, new timers, libraries, network requests, or full-scene filters were added.

## Occlusion and integration

The window clip, winter tree silhouette, host mullion mask, and independent desk/plant foreground erasures remain in use. Spring blossom clusters now supplement the shared leaf masks.

`CyberAtmosphereController.setVisibleSeasons(seasons: readonly string[])` accepts the union of all still-mounted scene plates, including an outgoing plate during its fade. The host should pass the plate loader's visible-season callback to this method. Winter and spring occluders remain until the corresponding image has actually retired. Before the first callback, standalone users retain the existing `climate.season` fallback. A null canvas context also returns this method as a safe no-op.

This change deliberately does not modify `cyber-main.ts` or the plate loader. Their callback wiring is integrated by the root task in separately owned files.

## Verification

- `npm run build`: TypeScript and Vite production build passed.
- `npm test`: all 89 tests passed, including 18 city/weather tests.
- `git diff --check`: passed.
- Motion tests cover bounded/repeatable particle budgets, depth speeds, streak direction, visible continuity at recycling, sustained window occupancy, and river containment.
- A deterministic DOM/recording-canvas/RAF harness executes the actual atmosphere controller. It verifies 30 fps at a 120 Hz clock, visibility/active/reduced-motion suspension, retained scene time, all 100 climate combinations, invalid-window recovery, separate opaque foreground erasures, mounted-season union handling, null-context behavior, and complete listener/observer/RAF/layer cleanup.
- Static artwork inspection used `view_image` on summer-night, winter-morning, autumn-evening, and spring-morning plates. The contemporary skyline and its registered geometry are preserved.
- A separate read-only review found no new material motion/render defects and independently reran all 18 city/weather tests successfully. It confirmed that the visible-season callback wiring remains a required integration step.

## Limits

Chrome/native CUA was unavailable for this task. No Playwright, CDP, other browser control, live screenshot, or runtime visual/performance claim is made. The recording-canvas tests verify drawing order and lifecycle; they cannot verify rasterized clip edges, exact blossom outlines, perceived brightness, mobile crop appearance, or real-device frame time. Those still need Chrome visual QA.

Static inspection also suggested that the host's original left window-bottom point (`.255, .63`) sits below the glass edge (approximately `.622`). That caller-owned coordinate was reported to the root integrator; it is not altered by this scoped change.
