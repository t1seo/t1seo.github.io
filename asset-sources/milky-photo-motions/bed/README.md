# Milky: chin rest and gentle belly roll

Six additive animation sprites made with the built-in `image_gen` tool. Existing Milky artwork, photographs, room plates and bed artwork were not changed.

The accepted originals are the six unqualified PNG filenames. Each runtime WebP is a single whole-image resize from 1536 × 1024 to 768 × 512 at quality 93, preserving the generated alpha. No head/body rescaling, rotation, recolouring or background masking was performed during export.

| Sprite | Accepted prompt | Purpose |
| --- | --- | --- |
| `chin-lower` | `chin-lower-v4.prompt.txt` | Tucked forepaws and a naturally extended neck before lowering the head. |
| `chin-rest` | `chin-rest-v3.prompt.txt` | Chin reaches the actual front rim; paws remain beneath the chest. |
| `roll-side` | `roll-side.prompt.txt` | Shoulder and hip turn onto the side, with one foreleg folded. |
| `roll-half` | `roll-half.prompt.txt` | Torso rolls further as the paws bend upward. |
| `belly-up` | `belly-up.prompt.txt` | Comfortable four-legged belly-up pose. |
| `belly-relaxed` | `belly-relaxed.prompt.txt` | Eyes close and the paws relax slightly without moving the body. |

The actual album photographs 26, 12 and 21 informed the gestures. The accepted art inherits the existing illustrated Milky likeness through the new `paws-rest` reference and subsequent frames. No photograph was copied into these runtime sprites.

`bed-registration.json` records source/runtime hashes, alpha measurements, raw anatomical landmarks and the approved rigid runtime offsets. All coordinates use the logical 1536 × 1024 canvas, not the half-size exported pixels. In the chin poses, the body's support rests on the higher inner cushion while the head reaches the front rim; the virtual registration anchor is deliberately separate from the visible support landmarks.

Independent art QA and root reviewed the actual bed composites at the real scene scale. The final chin lies at approximately scene `(1466.55, 879.60)`, with the foreground rim at `880.73`; its eyes and nose remain visible. The two chin frames share one fixed translation. All four roll frames share one horizontal registration and use back/cheek contacts rather than raised-paw bounds. `qa-chin-bed-contact.png` and `qa-roll-bed-sequence.png` are native canvas diagnostic compositions, not browser screenshots.

Earlier chin attempts rested on the dog's own paws or changed the scale too much. The files named `rejected-*` preserve those selected comparison originals; their prompts are retained as production history and they are never exported to runtime. Other superseded prompts are also historical. Natural timing, transitions, cancellation and actual browser verification belong to the separate integration change.
