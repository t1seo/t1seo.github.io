import test from 'node:test';
import assert from 'node:assert/strict';
import { createMusicSession, type MusicBookmark } from './cyber-music-session.ts';
import { CYBER_MUSIC_TRACKS } from './cyber-music-catalog.ts';

function fixture(enabled = true) {
  let state: MusicBookmark = { track: CYBER_MUSIC_TRACKS[0], position: 42, enabled };
  const applied: MusicBookmark[] = [];
  const sessions = createMusicSession({ snapshot: () => state, apply(bookmark) { state = bookmark; applied.push(bookmark); } });
  return { sessions, applied, current: () => state };
}

test('starts a temporary recording when prior music is off', () => {
  // Given a silent room with a saved track.
  const { sessions, current } = fixture(false);
  // When a user opens the album.
  sessions.begin(CYBER_MUSIC_TRACKS[1]);
  // Then only the chosen album track starts, from its beginning.
  assert.deepEqual(current(), { track: CYBER_MUSIC_TRACKS[1], position: 0, enabled: true });
});

test('restores the original recording position when the album closes', () => {
  // Given a room recording interrupted at 42 seconds.
  const { sessions, current } = fixture();
  const session = sessions.begin(CYBER_MUSIC_TRACKS[1]);
  // When the album closes.
  session.close();
  // Then its original recording and cursor resume.
  assert.deepEqual(current(), { track: CYBER_MUSIC_TRACKS[0], position: 42, enabled: true });
});

test('returns to silence when music was off before the album', () => {
  // Given automatic album playback over a silent room.
  const { sessions, current } = fixture(false);
  const session = sessions.begin(CYBER_MUSIC_TRACKS[1]);
  // When the album closes.
  session.close();
  // Then music remains off.
  assert.equal(current().enabled, false);
});

test('keeps an explicit pause when closing an originally playing room', () => {
  // Given the listener paused music while reading.
  const { sessions, current } = fixture();
  const session = sessions.begin(CYBER_MUSIC_TRACKS[1]);
  sessions.chooseEnabled(false);
  // When the album closes.
  session.close();
  // Then the old recording is selected without restarting sound.
  assert.equal(current().track.id, CYBER_MUSIC_TRACKS[0].id);
  assert.equal(current().enabled, false);
});

test('does not replace the original bookmark on repeated open requests', () => {
  // Given an album session that is already loading.
  const { sessions, applied, current } = fixture();
  const session = sessions.begin(CYBER_MUSIC_TRACKS[1]);
  // When another open gesture reaches the same session.
  const repeated = sessions.begin(CYBER_MUSIC_TRACKS[1]);
  // Then it owns the same single bookmark.
  assert.equal(repeated, session);
  assert.equal(applied.length, 1);
  repeated.close();
  assert.equal(current().track.id, CYBER_MUSIC_TRACKS[0].id);
});

test('ignores a stale close after a new album session starts', () => {
  // Given a closed session followed by a new one.
  const { sessions, applied, current } = fixture();
  const old = sessions.begin(CYBER_MUSIC_TRACKS[1]);
  old.close();
  sessions.begin(CYBER_MUSIC_TRACKS[2]);
  // When a delayed old close arrives.
  old.close();
  // Then the new session stays selected.
  assert.equal(current().track.id, CYBER_MUSIC_TRACKS[2].id);
  assert.equal(applied.length, 3);
});

test('does not restore playback when the application is destroyed', () => {
  // Given a mounted album during page teardown.
  const { sessions, applied } = fixture();
  const session = sessions.begin(CYBER_MUSIC_TRACKS[1]);
  sessions.destroy();
  // When its late modal close runs.
  session.close();
  // Then no media restart is requested.
  assert.equal(applied.length, 1);
});
