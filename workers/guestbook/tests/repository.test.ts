import assert from 'node:assert/strict'
import { test } from 'node:test'
import { claimAttempt, insertEntry } from '../src/repository.ts'
import { ApiError } from '../src/types.ts'
import { databaseFixture, seedEntry } from './database.ts'

const now = Date.parse('2026-10-01T12:00:00Z')
const submission = { name: 'Guest', message: 'A beautiful place', turnstileToken: 'verified-at-http-boundary' }

test('accepts only one simultaneous post per IP during the cooldown', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  // When
  const results = await Promise.allSettled(Array.from({ length: 30 }, (_, index) => insertEntry(db, submission, 'visitor', String(index), now)))
  // Then
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal((await db.prepare('SELECT COUNT(*) AS total FROM guestbook_entries').first<{ total: number }>())?.total, 1)
})

test('enforces the global day ceiling atomically across distinct visitors', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  await Promise.all(Array.from({ length: 99 }, (_, index) => seedEntry(db, now - 60000, `visitor-${index}`)))
  // When
  const results = await Promise.allSettled(Array.from({ length: 20 }, (_, index) => insertEntry(db, submission, `new-${index}`, String(index), now)))
  // Then
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
})

test('counts hidden entries toward the hourly posting limit', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  for (let index = 1; index <= 5; index += 1) await seedEntry(db, now - index * 60000, 'visitor', String(index), 1)
  // When / Then
  await assert.rejects(insertEntry(db, submission, 'visitor', 'new', now), { code: 'rate_limited' })
})

test('counts earlier hours toward the per-visitor UTC day ceiling', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  for (let index = 0; index < 20; index += 1) await seedEntry(db, now - 7200000 - index * 60000)
  // When / Then
  await assert.rejects(insertEntry(db, submission, 'visitor', 'new', now), { code: 'rate_limited', retryAfter: 43200 })
})

test('rejects a duplicated message within 24 hours even if hidden', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  await seedEntry(db, now - 7200000, 'visitor', 'same-message', 1)
  // When / Then
  await assert.rejects(insertEntry(db, submission, 'visitor', 'same-message', now), { code: 'duplicate_entry' })
})

test('accepts the same message from another visitor without exposing fingerprints', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  await seedEntry(db, now - 60000, 'other', 'same-message')
  // When
  const entry = await insertEntry(db, submission, 'visitor', 'same-message', now)
  // Then
  assert.deepEqual(Object.keys(entry).sort(), ['createdAt', 'id', 'message', 'name'])
  assert.equal(entry.createdAt, '2026-10-01T12:00:00.000Z')
})

test('limits simultaneous verification attempts without growing rejected rows', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  // When
  const results = await Promise.allSettled(Array.from({ length: 50 }, () => claimAttempt(db, 'visitor', now)))
  // Then
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 30)
  assert.equal((await db.prepare('SELECT COUNT(*) AS total FROM guestbook_attempts').first<{ total: number }>())?.total, 30)
  for (const result of results) if (result.status === 'rejected') assert.ok(result.reason instanceof ApiError)
})

test('limits verification attempts across the UTC day', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  await db.batch(Array.from({ length: 120 }, () => db.prepare('INSERT INTO guestbook_attempts(ip_hash,created_at) VALUES (?,?)').bind('visitor', now - 3600000)))
  // When / Then
  await assert.rejects(claimAttempt(db, 'visitor', now), { code: 'rate_limited', retryAfter: 43200 })
})

test('caps the global verification budget across visitors', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  await db.batch(Array.from({ length: 999 }, (_, index) => db.prepare('INSERT INTO guestbook_attempts(ip_hash,created_at) VALUES (?,?)').bind(String(index), now)))
  // When
  const results = await Promise.allSettled(Array.from({ length: 10 }, (_, index) => claimAttempt(db, `new-${index}`, now)))
  // Then
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
})
