# Desk, equipment and Aeron reference

The user's additions are applied to one reference image first, then to all 20
season/time scenes using that geometry. The 2.5D room remains an illustration;
these are not interactive product CAD models or branded product assets.

Approved master: `public/assets/cyberpunk/desk-reference.webp` (1672×941).
Built-in imagegen edit source:
`/Users/cillian/.codex/generated_images/01a0ec28-a86f-7212-b864-067620f71e16/exec-4720305b-77e8-42dd-8dc1-f2dd1b3ca334.png`.
The existing summer-noon image was inspected and used as the edit target.
The result was converted whole to WebP with `cwebp -q 92`; no manual image
compositing or Python image editing was used.

## Final master prompt

```text
Use case: precise-object-edit. Edit this exact wide 1672x941 illustrated studio image for a premium 2.5D tactile matte paper website. Preserve the exact camera, framing, window mullions, modern Seoul-like riverside city, all outdoor landscape and architecture, summer noon blue lighting, left shelves/lounge chair, plants, bronze desk lamp (unlit), and existing desk-surface object positions. Change only the desk construction, computer hardware, office chair and notebook pen. CRITICAL: desk MUST have a thin realistic 25mm walnut slab tabletop, NOT the very thick heavy box front apron shown. Keep the top surface at its existing height and perspective, reduce front edge to a slim 12-18 image pixels. Give desk distinct elegant matte charcoal metal legs clearly visible under it, front left leg down from x550 y675 toward x545 y850 and front right leg partly behind chair, rear legs where perspective permits. Legs meet floor with soft contact shadows; remove heavy black plinth/blue underdesk rail and floating box appearance. Desk should look credible and functional. Replace foreground right office chair with an unmistakable Herman Miller Aeron graphite ergonomic chair, recognizable translucent tightly woven charcoal mesh back and seat, rounded oval perimeter, lumbar support visible behind mesh, sculpted arms and five-star caster base partially cropped by right/bottom edge as original. Chair occupies same foreground-right region, no headrest, no upholstered cushion, no gold trim. Premium subtle graphite grey. Computer: Apple Studio Display-like slim silver aluminum bezel, single elegant aluminum pedestal stand. KEEP EXACT black inner screen rectangle at x895 y405 to x1252 y575; blank deep teal screen no text. Keyboard: realistic compact ivory HHKB 60-key layout, 5 rows, no function row, no arrow cluster, no number pad, stepped tactile ivory keycaps with beige modifiers and white spacebar, centered x1040 y628 on black desk mat, only about190pixels wide. Speakers in same left/right positions x850y574 and x1297y575: premium small walnut wood cabinets with rounded edges, natural oatmeal woven fabric grille faces and elegant thin champagne aluminum bases, no cheap exposed black plastic drivers. Keep coffee cup centerx1372y608, bronze singing bowl centerx715y596, lamp positions exactly. Replace pen resting on black notebook near x696y617 with ONE elegant black lacquer fountain pen, slender body, refined gold clip/bands and visible small golden nib, natural realistic scale. Match the existing rich layered painterly paper art, sophisticated quiet contemporary interiors. No people, no dog, no extra logos, no UI, no watermarks. Maintain whole original composition and 16:9 landscape framing.
```

The generated monitor interior moved slightly: approximately x895–1239,
y396–563. The live HTML editor and weather mask were re-registered to the final
artwork instead of keeping the requested-but-unachieved old coordinates.

Season-specific prompts, source files and checks:
[spring](DESK-SPRING.md), [summer](DESK-SUMMER.md),
[autumn](DESK-AUTUMN.md), [winter](DESK-WINTER.md).
All generated source desk lamps stay off; the interactive warm light layer
supplies the on state. Christmas lights remain part of the winter scene.

## Object registration

- Monitor overlay: left 53.53%, top 42.1%, width 20.5%, height 17.5%.
- HHKB click region: left 56.6%, top 64.9%, width 11.8%, height 4.1%.
- Singing bowl and coffee mouth registrations are in [DESK-EFFECTS.md](DESK-EFFECTS.md).
- Fountain pen opens a local-only notebook. It is not a moving rectangular crop.
- Both illustrated speakers toggle the same climate-selected playback controller.

Original reference images and all 20 outputs were inspected by the scoped art
workers. Root inspected the master and selected final seasonal scenes. This
confirms illustration quality and geometry; it does not replace Chrome checks
of composited live overlays and motion.
