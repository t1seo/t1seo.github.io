import assert from 'node:assert/strict';
import test from 'node:test';
import { photoMotionButtonsMarkup, PHOTO_MOTION_ACTIONS } from './penthouse-photo-motions-ui.ts';
import { photoMotionUiFixture as fixture } from './penthouse-photo-motions-ui-test-fixture.ts';

test('renders six named native buttons without replacing keyboard activation', () => {
  // Given the six deliberate photo moments.
  // When their control markup is rendered.
  const markup = photoMotionButtonsMarkup();
  // Then each action has a native button and the shared availability description.
  assert.equal([...markup.matchAll(/<button\b/g)].length, 6);
  for (const { kind, label } of PHOTO_MOTION_ACTIONS) {
    assert.ok(markup.includes(`data-photo-motion="${kind}"`));
    assert.ok(markup.includes(label));
  }
  assert.equal([...markup.matchAll(/type="button"/g)].length, 6);
  assert.equal([...markup.matchAll(/aria-describedby="ph-photo-motion-status"/g)].length, 6);
  assert.equal(markup.includes('tabindex'), false);
});

for (const { kind } of PHOTO_MOTION_ACTIONS) {
  test(`closes the drawer and restores the pet before requesting ${kind}`, t => {
    // Given an available deliberate action.
    const f = fixture(t);
    const button = f.buttons.find(item => item.dataset.photoMotion === kind);
    assert.ok(button);
    f.controls.refresh();
    // When the native button receives activation, including the browser's keyboard click.
    button.dispatchEvent(new Event('click'));
    // Then the room is active before the exact request starts.
    assert.deepEqual(f.events, ['close-and-reactivate', kind]);
  });
}

test('keeps bed-only actions disabled when the cushion is outside the visible room', t => {
  // Given a portrait crop without the bed.
  const f = fixture(t);
  f.state.bedVisible = false;
  // When the panel opens.
  f.controls.refresh();
  // Then bed actions stay unavailable while floor moments remain usable.
  assert.deepEqual(f.buttons.filter(button => button.disabled).map(button => button.dataset.photoMotion), ['chin-rest', 'belly-up']);
  assert.match(f.status.textContent, /bed.*view/i);
});

test('rechecks geometry before closing the drawer on a stale available button', t => {
  // Given an available button whose bed becomes cropped before the next refresh.
  const f = fixture(t);
  f.controls.refresh();
  f.state.bedVisible = false;
  const button = f.buttons.find(item => item.dataset.photoMotion === 'chin-rest');
  assert.ok(button);
  // When the stale action receives activation.
  button.dispatchEvent(new Event('click'));
  // Then no request or drawer close occurs.
  assert.deepEqual(f.events, []);
  assert.equal(button.disabled, true);
});

test('refreshes availability after the visible room changes size', t => {
  // Given bed buttons disabled by a narrow crop.
  const f = fixture(t);
  f.state.bedVisible = false;
  f.controls.refresh();
  f.state.bedVisible = true;
  // When the viewport grows.
  f.window.dispatchEvent(new Event('resize'));
  // Then all six actions become available without polling or loading art.
  assert.equal(f.buttons.some(button => button.disabled), false);
  assert.deepEqual(f.events, []);
});

test('disables sequences and describes the setting when reduced motion changes', t => {
  // Given the open controls.
  const f = fixture(t);
  f.controls.refresh();
  // When reduced motion is enabled.
  f.reduced(true);
  // Then every sequence is unavailable with an accessible explanation.
  assert.ok(f.buttons.every(button => button.disabled));
  assert.match(f.status.textContent, /reduced motion/i);
});

test('reflects still mode when saved atmosphere settings are applied', t => {
  // Given the open controls and a preset that turns animation off.
  const f = fixture(t);
  f.state.animated = false;
  // When the scene refreshes the controls.
  f.controls.refresh();
  // Then all sequence buttons are disabled without issuing any request.
  assert.ok(f.buttons.every(button => button.disabled));
  assert.match(f.status.textContent, /Animate the view/);
  assert.deepEqual(f.events, []);
});

test('does not attach duplicate action handlers on repeated panel refreshes', t => {
  // Given frequent availability refreshes of the same controls.
  const f = fixture(t);
  for (let index = 0; index < 5; index++) f.controls.refresh();
  // When one button is activated.
  f.buttons[0]?.dispatchEvent(new Event('click'));
  // Then only one request is sent.
  assert.deepEqual(f.events, ['close-and-reactivate', 'tilt']);
});

test('detaches controls from a replaced drawer page', t => {
  // Given controls removed when another panel replaces the Milky page.
  const f = fixture(t);
  f.controls.refresh();
  const oldButton = f.buttons[0];
  assert.ok(oldButton);
  f.buttons.splice(0);
  f.controls.refresh();
  // When the removed control receives a stale click.
  oldButton.dispatchEvent(new Event('click'));
  // Then it cannot trigger a later pet action.
  assert.deepEqual(f.events, []);
});

test('keeps an accessible retry message when the controller rejects an immediate request', t => {
  // Given a motion that becomes unavailable during the room handoff.
  const f = fixture(t);
  f.state.accepts = false;
  f.controls.refresh();
  // When the visitor requests it.
  f.buttons[0]?.dispatchEvent(new Event('click'));
  // Then the next panel view has a retry explanation and controls remain usable.
  assert.match(f.status.textContent, /try again/i);
  assert.equal(f.buttons[0]?.disabled, false);
});

test('removes button, resize and motion listeners when the scene is destroyed', t => {
  // Given mounted controls that are then destroyed.
  const f = fixture(t);
  f.controls.refresh();
  f.controls.destroy();
  // When stale browser events arrive.
  f.buttons[0]?.dispatchEvent(new Event('click'));
  f.reduced(true);
  f.window.dispatchEvent(new Event('resize'));
  // Then no action or later UI mutation occurs.
  assert.deepEqual(f.events, []);
  assert.equal(f.buttons.some(button => button.disabled), false);
});
