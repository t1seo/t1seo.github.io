# Milky photo refresh

The active Seoul studio uses the same photo-inspired Milky as the user's Pets companion. The 26 user-supplied photos were reviewed locally for face, ears, coat, profile, belly-up and sleepy expressions. Source photographs and private filenames are not included here.

The validated Pets atlas supplies idle, locomotion and sixteen gaze directions. Six separately generated strips add the existing sit/rest/wake, meal/play, tilt/pant, paws/chin, sleepy-peek and belly-roll postures. Original room plates, album photographs and legacy art stay archived.

Exported supplement frames share a single scale per source strip, calibrated from its first standing pose. Every frame registers its support point onto [795,970] in the existing 1536×1024 art space. No per-pose stretch, redraw or silhouette normalization is used. `registration.json` records the transforms and chroma edge cleanup.

Profile gait needs a 1.42 scale correction because the wide body had been fitted into the narrow Pets cell. This restores approximately the standing pose's height without changing anatomy; its floor anchor stays fixed. Idle and supplement art use the common 4.2 source-to-logical scale. The existing controller retains motion, toys, bed, lifecycle and lazy photo loading. The atlas presentation owns no new animation-frame loop.

The jump strip was regenerated with natural elbow and hindleg flexion to keep limb anatomy consistent. Its five frames retain a single 1.07 scale correction around the same floor anchor; body lift is authored in the strip and the existing bed hop trajectory. Chin contact uses measured native [968,950] and a 220-pixel bounded whole-frame translation for the newly registered art.

Runtime WebP derivatives are 768×512 (logical 1536×1024), quality 92; generated full-resolution strips remain here for reproducibility.

The final play reach uses a regenerated low forepaw contact at native [1140,958] (345 pixels ahead of the support anchor). The eating muzzle is 190 pixels ahead. These measured landmarks keep bowl and ball placement aligned with the replacement anatomy.
