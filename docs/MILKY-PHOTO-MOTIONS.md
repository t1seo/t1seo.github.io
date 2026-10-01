# Milky’s photo motions and walking

The active Seoul Studio extends the existing pet controller with six finite
moments inspired by the published album photographs. The moments are animation
interpretations, not claims about Milky’s past behavior. The feature plan and
acceptance scenarios are in [milky-photo-motions.md](../plans/milky-photo-motions.md).

## Photo-motion implementation

`penthouse-main.ts` opts in through `{ photoMotions: true, groundedWalk: true }`
and explicitly passes `MILKY_PHOTO_REST`, adding the authored `sitdown` and `wake`
frames. Archived rooms keep the original `sit`, `drowsy` and `sleep` set and omit
both feature flags. The Milky drawer’s
**Little moments** controls call `canPhotoMotion(kind)` before
`photoMotion(kind)`. An accepted request can wait for its frame group to decode;
it does not mean the animation is already playing. Lying moments also require
their existing rest poses to be ready: sitting for paws-rest, sitting/drowsy for
chin-rest, and sitting/drowsy/sleeping for sleepy-peek and belly-up. Archived
rooms request none of these new photo-motion assets.

| Module | Responsibility |
| --- | --- |
| [cyber-pet-photo-art.ts](../src/cyber-pet-photo-art.ts) | Typed frame inventory, group membership and registration anchors |
| [cyber-pet-photo-loader.ts](../src/cyber-pet-photo-loader.ts) | Lazy loading, atomic group readiness, deduplication and deliberate retry |
| [cyber-pet-photo-plan.ts](../src/cyber-pet-photo-plan.ts) | Drawn entry, held and exit poses for all six moments |
| [cyber-pet-photo.ts](../src/cyber-pet-photo.ts) | Latest pending intent, cooldowns and runtime facade |
| [cyber-pet-photo-geometry.ts](../src/cyber-pet-photo-geometry.ts) | Bounded chin-to-cushion contact correction |
| [penthouse-photo-motions-ui.ts](../src/penthouse-photo-motions-ui.ts) | Accessible actions and availability explanations |

The loader permits at most two photo-frame requests/decodes in flight across all
six groups and retains at most the 15 defined frame images. Every required image
must decode with the expected aspect ratio before a group can appear. Failures
leave the current pet visible; a later explicit request may retry failed frames.
Autonomous opportunities do not repeatedly retry failures or start a late-loaded
moment after its original context has passed.

The controller reuses its existing action timer and revision checks. A new
command supersedes a pending intent. Posture changes use the drawn exit/rise
frames before walking, and bed moments require actual landing rather than
placing a lying pose on the floor. Hidden, still, reduced-motion, modal and
destroy paths cancel obsolete work. Autonomous variations use existing rest,
greeting and successful play/run opportunities with shared and per-kind
cooldowns; they add no perpetual timer or animation loop.

## Artwork and registration

The 15 photo-motion frames are transparent 768×512 WebPs on a common logical
1536×1024 canvas. Keep the existing `.847` physical scale. Per-frame translation
maps the approved body-registration anchor to `(795,970)`; these anchors are
calibrated body positions, not raw silhouette bounds. Do not normalize each
frame to its bounding box. Chin-rest adds a bounded correction to the actual
cushion rim, and remains unavailable when that contact cannot be achieved.

Source images, prompts, registration records and contact sheets are preserved
under [asset-sources/milky-photo-motions](../asset-sources/milky-photo-motions/).
The `standing`, `rest` and `bed` directories cover the six groups; `bridges`
contains the additional sitting-down and waking transitions. Runtime photo
frames live under `public/assets/cyberpunk/milky-photo-motions/`. Original
photographs, private filenames and metadata are not part of these assets.

Walking uses separate painted torso, foreleg and hindleg layers. Their source
art, joint landmarks, measured sole bounds, export hashes and rejected
candidates are recorded in
[milky-grounded-walk](../asset-sources/milky-grounded-walk/README.md). The three
768×512 runtime images total 109,786 bytes. They are newly generated artwork
matched to the established likeness; the original full-body rasters remain
unchanged.

## Continuous walking

[cyber-pet-grounded-plan.ts](../src/cyber-pet-grounded-plan.ts) plans four-foot
steps by distance, keeping support paws fixed in room coordinates while swing
paws lift and advance. Each leg has its own contact and joint geometry; the
painted torso and limb layers are assembled by
[cyber-pet-grounded-render.ts](../src/cyber-pet-grounded-render.ts). The controller
uses the existing pet animation loop. A normal stride has a nominal 720ms
cadence, with eased travel at either end; Run and ball chases increase the
cadence of this same supported walk. The small bed hop retains the authored
airborne frames.

All three walking layers load lazily through
[cyber-pet-grounded-assets.ts](../src/cyber-pet-grounded-assets.ts) and become
available as one complete set. A walk already using the original frames finishes
with that set; the prepared layers can take over on a subsequent walk. Original
rasters also remain the fallback when the layered renderer is unavailable.

On completed arrival, `finish()` retains the final neutral canvas pose without
ongoing redraws or an immediate swap to the differently shaped idle raster.
Other actions and lifecycle cancellation still hand control back to the normal
posture system. Compatible retargets preserve the current contact state; the
motion tests cover these joins separately from artwork review.

## Provenance and verification

Actual Claude Fable implemented the six-motion runtime and reviewed the layered
walking approach. The Codex team produced and reviewed the additive artwork,
built the walking renderer and integrated the controls. Runtime behavior and
asset quality require separate checks; passing a timing test does not establish
that a pose looks correct.

Run the focused controller, planning, loading and lifecycle checks with:

```sh
node --experimental-strip-types --test src/cyber-pet*.test.ts src/penthouse-photo-motions-ui.test.ts
```

Use `npm test` and `npm run build` for integrated validation. Review contact
sheets and timed renders at room scale, including bed occlusion, both walking
directions, stops, retargets and ball contact. Native Canvas renders and fake
DOM/clock tests are not browser-playback evidence. Chrome verification requires
the official Codex Computer Use provider; its Sky native-pipe startup failure
has prevented browser playback checks during this work. Final release evidence
must state which checks actually ran and retain this limitation if it persists.
