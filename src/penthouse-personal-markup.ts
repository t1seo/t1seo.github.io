export function focusMarkup(): string {
  return `<section class="ph-focus-session" aria-labelledby="focus-heading">
    <h3 id="focus-heading">A little time to focus</h3>
    <p class="ph-focus-readout" data-focus-readout>Ready when you are.</p>
    <div class="ph-session-actions">
      <button type="button" data-action="timer-start" data-minutes="25">25 minutes</button>
      <button type="button" data-action="timer-start" data-minutes="50">50 minutes</button>
      <button type="button" data-action="timer-pause" hidden>Pause</button>
      <button type="button" data-action="timer-resume" hidden>Resume</button>
      <button type="button" data-action="timer-cancel" hidden>Cancel</button>
    </div>
    <p class="ph-panel-note">The desk clock counts down. A soft singing bowl marks the end.</p>
    <p class="ph-personal-status" data-focus-status role="status"></p>
  </section>`;
}

export function memoMarkup(): string {
  return `<p class="ph-overline">A THOUGHT, KEPT CLOSE</p><h2 id="ph-dialog-title">Your desk note.</h2>
    <label class="ph-field-label" for="desk-note">A thought or a few things for today</label>
    <textarea id="desk-note" class="ph-note" data-personal-memo maxlength="2000" rows="9" placeholder="Leave yourself a little note…"></textarea>
    <div class="ph-note-footer"><span data-memo-count>0 / 2,000</span><button type="button" data-action="memo-clear">Clear note</button></div>
    <p class="ph-personal-status" data-memo-status role="status"></p>
    <p class="ph-panel-note">Saved as you write, in this browser only. Clearing browser data removes your note.</p>`;
}

export function presetsMarkup(): string {
  return `<section class="ph-presets" aria-labelledby="presets-heading">
    <h3 id="presets-heading">Your atmospheres</h3>
    <p class="ph-panel-note">Keep up to five combinations of weather, lighting and sound.</p>
    <label class="ph-field-label" for="atmosphere-name">Name this atmosphere</label>
    <div class="ph-preset-save"><input id="atmosphere-name" data-preset-name type="text" maxlength="40" placeholder="Rainy evening" autocomplete="off"><button type="button" data-action="preset-save">Save current</button></div>
    <div class="ph-preset-list" data-preset-list></div>
    <p class="ph-personal-status" data-preset-status role="status"></p>
  </section>`;
}

export function mixerMarkup(): string {
  return `<section class="ph-mixer" aria-labelledby="sound-heading">
    <h3 id="sound-heading">Room sound</h3>
    <div class="ph-mixer-row"><label for="music-volume">Music</label><output for="music-volume" data-volume-label="music">65%</output></div>
    <input id="music-volume" type="range" min="0" max="100" step="1" value="65" data-mix-volume="music" aria-label="Music volume">
    <div class="ph-mixer-row"><label class="ph-rain-toggle"><input type="checkbox" data-mix-rain> Rain ambience</label><output for="rain-volume" data-volume-label="rain">50%</output></div>
    <input id="rain-volume" type="range" min="0" max="100" step="1" value="50" data-mix-volume="rain" aria-label="Rain ambience volume">
    <p class="ph-personal-status" data-mix-status role="status"></p>
  </section>`;
}
