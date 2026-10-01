import test from 'node:test';
import assert from 'node:assert/strict';
import { createFocusTimer } from './penthouse-focus-timer.ts';
import type { FocusTimerState } from './penthouse-focus-timer.ts';

function fixture() {
  let now = 0;
  let id = 0;
  let completed = 0;
  const changes: FocusTimerState[] = [];
  const tasks = new Map<number, { at: number; callback: () => void }>();
  const timer = createFocusTimer({
    now: () => now,
    scheduler: {
      setTimeout(callback, delayMs) {
        const handle = ++id;
        tasks.set(handle, { at: now + delayMs, callback });
        return handle;
      },
      clearTimeout: handle => { tasks.delete(handle); },
    },
    onChange: state => changes.push(state),
    onComplete: () => { completed++; },
  });
  function advance(milliseconds: number) {
    const until = now + milliseconds;
    for (;;) {
      const next = [...tasks.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > until) break;
      now = next[1].at;
      tasks.delete(next[0]);
      next[1].callback();
    }
    now = until;
  }
  return { timer, tasks, changes, advance, completed: () => completed, jump: (ms: number) => { now += ms; } };
}

test('counts down a selected focus duration with one visible tick per second', () => {
  const f = fixture();
  f.timer.start(25);
  f.advance(3_000);
  assert.deepEqual(f.timer.getState(), { status: 'running', durationMs: 1_500_000, remainingMs: 1_497_000 });
  assert.equal(f.changes.length, 4);
  assert.equal(f.tasks.size, 1);
});

test('preserves remaining focus time while paused and resumes its deadline', () => {
  const f = fixture();
  f.timer.start(1);
  f.advance(12_500);
  f.timer.pause();
  f.advance(30_000);
  assert.deepEqual(f.timer.getState(), { status: 'paused', durationMs: 60_000, remainingMs: 47_500 });
  assert.equal(f.tasks.size, 0);
  f.timer.resume();
  f.advance(47_500);
  assert.equal(f.timer.getState().status, 'idle');
  assert.equal(f.completed(), 1);
});

test('tracks wall time without ticks while hidden and completes once on return', () => {
  const f = fixture();
  f.timer.start(1);
  f.timer.setVisible(false);
  f.advance(90_000);
  assert.equal(f.tasks.size, 0);
  assert.equal(f.completed(), 0);
  assert.equal(f.changes.length, 1);
  assert.equal(f.timer.getState().remainingMs, 0);
  f.timer.setVisible(true);
  f.timer.setVisible(false);
  f.timer.setVisible(true);
  assert.equal(f.completed(), 1);
  assert.deepEqual(f.timer.getState(), { status: 'idle', durationMs: 0, remainingMs: 0 });
  assert.equal(f.tasks.size, 0);
});

test('resumes visible ticking with elapsed hidden time already deducted', () => {
  const f = fixture();
  f.timer.start(1);
  f.timer.setVisible(false);
  f.advance(30_000);
  f.timer.setVisible(true);
  assert.equal(f.timer.getState().remainingMs, 30_000);
  assert.equal(f.changes.at(-1)?.remainingMs, 30_000);
  assert.equal(f.tasks.size, 1);
});

test('uses the deadline rather than counting delayed callbacks', () => {
  const f = fixture();
  f.timer.start(1);
  const scheduled = [...f.tasks.values()][0];
  assert.ok(scheduled);
  f.tasks.clear();
  f.jump(70_000);
  scheduled.callback();
  assert.equal(f.completed(), 1);
  assert.equal(f.timer.getState().status, 'idle');
});

test('replaces a running timer without delivering its canceled completion', () => {
  const f = fixture();
  f.timer.start(1);
  f.advance(30_000);
  f.timer.start(50);
  f.advance(30_000);
  assert.equal(f.timer.getState().remainingMs, 2_970_000);
  assert.equal(f.completed(), 0);
  assert.equal(f.tasks.size, 1);
});

test('cancels overdue hidden completion before the tab returns', () => {
  const f = fixture();
  f.timer.start(1);
  f.timer.setVisible(false);
  f.advance(90_000);
  f.timer.cancel();
  f.timer.setVisible(true);
  assert.equal(f.timer.getState().status, 'idle');
  assert.equal(f.completed(), 0);
  assert.equal(f.tasks.size, 0);
});

test('rejects invalid duration input while retaining an existing timer', () => {
  const f = fixture();
  assert.equal(f.timer.start(25), true);
  for (const minutes of [0, -1, 0.5, 181, NaN, Infinity]) assert.equal(f.timer.start(minutes), false);
  assert.equal(f.timer.getState().remainingMs, 1_500_000);
  assert.equal(f.tasks.size, 1);
});

test('destroy releases timers and prevents all later callbacks or restarts', () => {
  const f = fixture();
  f.timer.start(1);
  f.timer.destroy();
  const changeCount = f.changes.length;
  f.advance(90_000);
  f.timer.resume();
  f.timer.setVisible(true);
  f.timer.cancel();
  assert.equal(f.timer.start(25), false);
  assert.equal(f.tasks.size, 0);
  assert.equal(f.completed(), 0);
  assert.equal(f.changes.length, changeCount);
});
