import assert from 'node:assert/strict'
import { test } from 'node:test'
import { listEntries, parseCursor } from '../src/entries.ts'
import { cleanAbuseRecords } from '../src/repository.ts'
import { databaseFixture, seedEntry } from './database.ts'
import { httpFixture, testOrigin } from './http-fixture.ts'

const now = Date.parse('2026-10-01T12:00:00Z')

test('pages equal-time entries without repeats while excluding moderated messages', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  for (let index = 0; index < 25; index += 1) await seedEntry(db, now)
  await seedEntry(db, now + 1, 'private', 'private', 1)
  const first = await listEntries(db, null)
  // When
  const second = await listEntries(db, parseCursor(first.nextCursor))
  // Then
  assert.equal(first.entries.length, 20)
  assert.equal(second.entries.length, 5)
  assert.equal(second.nextCursor, null)
  assert.equal(new Set([...first.entries, ...second.entries].map((entry) => entry.id)).size, 25)
  assert.equal(first.entries.some((entry) => entry.createdAt === new Date(now + 1).toISOString()), false)
})

for (const cursor of ['', 'bad', '-1_00000000-0000-0000-0000-000000000000', 'NaN_id', '1_00000000-0000-0000-0000-000000000000_extra', '1'.repeat(1000)]) {
  test(`rejects invalid page cursors ${cursor.slice(0, 20)}`, () => {
    // Given
    const input = cursor
    // When
    const action = () => parseCursor(input)
    // Then
    assert.throws(action, { code: 'invalid_request' })
  })
}

test('expires old abuse fingerprints and attempts while keeping public entries', async (t) => {
  // Given
  const { db, dispose } = await databaseFixture()
  t.after(dispose)
  await seedEntry(db, now - 172800001)
  await seedEntry(db, now - 1000, 'recent')
  await db.prepare('INSERT INTO guestbook_attempts(ip_hash,created_at) VALUES (?,?)').bind('old', now - 172800001).run()
  await db.prepare('INSERT INTO guestbook_attempts(ip_hash,created_at) VALUES (?,?)').bind('recent', now - 1000).run()
  // When
  await cleanAbuseRecords(db, now)
  // Then
  const rows = await db.prepare('SELECT ip_hash,message_hash FROM guestbook_entries ORDER BY created_at').all<{ ip_hash: string | null; message_hash: string | null }>()
  assert.equal(rows.results.length, 2)
  assert.deepEqual(rows.results[0], { ip_hash: null, message_hash: null })
  assert.equal(rows.results[1]?.ip_hash, 'recent')
  assert.equal((await db.prepare('SELECT COUNT(*) AS total FROM guestbook_attempts').first<{ total: number }>())?.total, 1)
})

test('serves a cached public page without querying an unavailable database', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  await seedEntry(app.db, now)
  await app.runtime.dispatchFetch('https://api.test/entries')
  await app.db.prepare('DROP TABLE guestbook_entries').run()
  // When
  const response = await app.runtime.dispatchFetch('https://api.test/entries', { headers: { Origin: testOrigin } })
  // Then
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), testOrigin)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
})

test('rejects cache-busting query parameters before reading the database', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  await app.db.prepare('DROP TABLE guestbook_entries').run()
  // When
  const response = await app.runtime.dispatchFetch('https://api.test/entries?cacheBust=123')
  // Then
  assert.equal(response.status, 400)
})

test('retains a cached rate block without another database or Turnstile request', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  for (let index = 0; index < 31; index += 1) await app.post({ turnstileToken: `bad-${index}` })
  await app.db.prepare('DROP TABLE guestbook_attempts').run()
  // When
  const response = await app.post({ turnstileToken: 'bad-again' })
  // Then
  assert.equal(response.status, 429)
  assert.equal(app.verifications(), 30)
})
