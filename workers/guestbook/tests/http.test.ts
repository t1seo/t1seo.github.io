import assert from 'node:assert/strict'
import { test } from 'node:test'
import { httpFixture, testOrigin } from './http-fixture.ts'
import worker from '../src/index.ts'

test('publishes and lists an anonymous entry through the real Worker and D1', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  // When
  const submitted = await app.post({ message: '<b>Only plain text</b>' })
  const listing = await app.runtime.dispatchFetch('https://api.test/entries', { headers: { Origin: testOrigin } })
  const contents = await listing.text()
  // Then
  assert.equal(submitted.status, 201)
  assert.equal(listing.status, 200)
  assert.match(contents, /Only plain text/)
  assert.doesNotMatch(contents, /ip_hash|message_hash|hidden|192\.0\.2\.10|turnstileToken/)
  assert.equal(submitted.headers.get('Access-Control-Allow-Origin'), testOrigin)
  assert.equal(app.verifications(), 1)
})

test('blocks a mismatching origin before verification and database attempts', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  // When
  const response = await app.post({}, { Origin: 'https://t1seo.github.io.evil.test' })
  // Then
  assert.equal(response.status, 403)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null)
  assert.equal(app.verifications(), 0)
  assert.equal((await app.db.prepare('SELECT COUNT(*) AS total FROM guestbook_attempts').first<{ total: number }>())?.total, 0)
})

test('rejects honeypots without spending a verification attempt', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  // When
  const response = await app.post({ website: 'spam' })
  // Then
  assert.equal(response.status, 400)
  assert.equal(app.verifications(), 0)
})

test('rejects reused Turnstile tokens without a second published entry', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  await app.post({ turnstileToken: 'same-token' })
  // When
  const response = await app.post({ turnstileToken: 'same-token', message: 'Another message' }, { 'CF-Connecting-IP': '192.0.2.11' })
  // Then
  assert.equal(response.status, 403)
  assert.equal((await app.db.prepare('SELECT COUNT(*) AS total FROM guestbook_entries').first<{ total: number }>())?.total, 1)
})

test('returns Retry-After and prevents verified concurrent posting floods', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  // When
  const responses = await Promise.all(Array.from({ length: 10 }, (_, index) => app.post({ message: `Hello from request ${index}` })))
  // Then
  assert.equal(responses.filter((response) => response.status === 201).length, 1)
  assert.equal(responses.filter((response) => response.status === 429).length, 9)
  assert.ok(responses.find((response) => response.status === 429)?.headers.get('Retry-After'))
})

for (const missing of ['TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY', 'IP_HASH_SECRET']) {
  test(`fails closed on GET config and POST when ${missing} is missing`, async (t) => {
    // Given
    const app = await httpFixture({ [missing]: '' })
    t.after(app.dispose)
    // When
    const config = await app.runtime.dispatchFetch('https://api.test/config')
    const post = await app.post()
    // Then
    assert.equal(config.status, 503)
    assert.equal(post.status, 503)
    assert.equal(app.verifications(), 0)
  })
}

test('rejects official dummy Turnstile keys in production configuration', async (t) => {
  // Given
  const app = await httpFixture({ TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' })
  t.after(app.dispose)
  // When
  const response = await app.post()
  // Then
  assert.equal(response.status, 503)
})

test('caps bad-token calls before reaching the verification service again', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  // When
  const responses = await Promise.all(Array.from({ length: 40 }, (_, index) => app.post({ turnstileToken: `bad-${index}` })))
  // Then
  assert.equal(app.verifications(), 30)
  assert.equal(responses.filter((response) => response.status === 429).length, 10)
  assert.equal((await app.db.prepare('SELECT COUNT(*) AS total FROM guestbook_entries').first<{ total: number }>())?.total, 0)
})

test('rejects a missing trusted IP even when a forged forwarded IP is supplied', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  // When
  const request = new Request('https://api.test/entries', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: testOrigin, 'X-Forwarded-For': '192.0.2.20' },
    body: JSON.stringify({ name: 'Guest', message: 'No trusted identity', website: '', turnstileToken: 'token' }),
  })
  const response = await worker.fetch(request, {
    DB: app.db, ALLOWED_ORIGINS: testOrigin, TURNSTILE_SITE_KEY: '0xProductionLikeSiteKeyForTests',
    TURNSTILE_SECRET_KEY: '0xProductionLikeSecretForTests', IP_HASH_SECRET: 'isolated-test-only-hmac-secret-at-least32bytes',
  }, { waitUntil: () => assert.fail('No background task expected') })
  // Then
  assert.equal(response.status, 403)
  assert.equal(app.verifications(), 0)
})

test('allows the exact JSON CORS preflight without accepting credentials', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  // When
  const response = await app.runtime.dispatchFetch('https://api.test/entries', {
    method: 'OPTIONS', headers: { Origin: testOrigin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  })
  // Then
  assert.equal(response.status, 204)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), testOrigin)
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null)
})

test('exposes only the public widget key and field limits', async (t) => {
  // Given
  const app = await httpFixture()
  t.after(app.dispose)
  // When
  const response = await app.runtime.dispatchFetch('https://api.test/config')
  // Then
  assert.deepEqual(await response.json(), { siteKey: '0xProductionLikeSiteKeyForTests', maxNameLength: 40, maxMessageLength: 1000 })
})

test('pauses new writes without disabling public reading', async (t) => {
  // Given
  const app = await httpFixture({ WRITES_ENABLED: 'false' })
  t.after(app.dispose)
  // When
  const posted = await app.post()
  const listed = await app.runtime.dispatchFetch('https://api.test/entries')
  // Then
  assert.equal(posted.status, 503)
  assert.equal(listed.status, 200)
  assert.equal(app.verifications(), 0)
})
