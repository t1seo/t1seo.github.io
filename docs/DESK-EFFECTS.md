# Registered desk responses

`mountCyberDeskEffects(plane)` adds one decorative, pointer-transparent layer to the scene plane. It imports its own CSS and exposes `strikeBowl`, `coffee`, `setMusic`, `setClimate`, `setActive`, and `destroy`.

The supplied master scene is 1672 × 941. Coordinates below are percentages of that plane, so the existing cover crop, parallax and mobile scaling carry all responses with their source objects.

| Response | Registration | Behaviour |
| --- | --- | --- |
| Singing bowl | Rim centre (42.805%, 62.85%); width 2.83%, height 0.98% | Three small, fading bronze ellipses and a damped subpixel rim glint. No copied image patch, replaced bowl or large sound rings. Last response ends at 3.54 seconds. |
| Coffee | Mouth centre (82.135%, 62.79%); width 2.43%, height 0.86% | Two faint surface ripples clipped to the mouth and five soft, offset steam wisps. The last wisp ends at 5.31 seconds. No new drink is drawn over the original cup. |
| Left speaker | Box starts (49.32%, 56.25%); width 3.12%, height 8.35% | Small stable power light and a very low-opacity reflection while music is playing. Adjusted for the new linen-faced master. |
| Right speaker | Box starts (76.11%, 56.93%); width 2.86%, height 7.78% | Same treatment, with a slight phase offset. This is playback feedback, not an audio spectrum analyser. |

Climate changes adjust the visibility of the responses and the steam tint, without replacing or recolouring the underlying furniture. The desk master changes should keep the illustrated bowl, cup and speakers registered to these locations; if their positions change, adjust these CSS registrations after inspecting the new images.

## Integration

```ts
const deskEffects = mountCyberDeskEffects(plane);
// Bowl action: audio and visual feedback are independently controlled.
void sound.playBowl();
deskEffects.strikeBowl();
// Cup action:
void sound.playCup();
deskEffects.coffee();
// Update whenever the actual playback state or climate changes:
deskEffects.setMusic(sound.isEnabled());
deskEffects.setClimate(climate.getState());
// Pause with the other room effects when a modal is open:
deskEffects.setActive(!dialog.open);
// Dispose with the rest of the scene:
deskEffects.destroy();
```

Remove the old `.night-steam` element/coffee animation when integrating, to avoid doubled steam. No source HTML, root stylesheet or audio module is changed in this worker branch.

## Motion and lifecycle

- No requestAnimationFrame loop, intervals, or runtime dependencies are added.
- A repeated click cancels the previous transient group and begins one fresh response. Animation cancellation uses events instead of rejected `finished` promises.
- Hiding the document or calling `setActive(false)` cancels every transient response and removes the speaker animation. Returning restores only the current music indication; old steam and bowl echoes do not replay.
- Reduced motion creates no Web Animations. A static rim/surface highlight confirms the click for 700 ms; music uses only the stable light. Preference changes immediately stop existing motion.
- `destroy()` is idempotent and removes animation groups, timers, document/media listeners and the layer. Later method calls are ignored.
- This is an illustrative response to the user-triggered objects, following the `emil-design-eng` principles of immediate feedback, controlled scale and transform/opacity animation. There are no keyboard interaction delays.

## Verification

- TypeScript check and existing Vite app build pass.
- Existing suite: 25 tests pass.
- A separate Vite library build compiled the new module and CSS successfully: 4.78 kB JavaScript / 3.00 kB CSS before gzip.
- A manual DOM/Web Animations stub check passed repeated-click cancellation, inactive/hidden cancellation, no transient replay on resume, reduced-motion static feedback, and idempotent destruction. This verifies lifecycle logic, not browser rendering.
- This module needs root integration before interactive Chrome verification; the current app build does not yet include the unreferenced module.
- Coordinates were inspected against both `climate/summer-noon.webp` and the root integration worktree's new `desk-reference.webp`. The bowl and cup retain their positions; the left speaker response was adjusted to the new linen face. Animation appearance still needs interactive Chrome verification.
