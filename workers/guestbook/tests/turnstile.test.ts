import assert from 'node:assert/strict'
import { test } from 'node:test'
import { verifyTurnstile } from '../src/turnstile.ts'

const now = Date.parse('2026-10-01T12:00:00Z')
const valid = { success: true, hostname: 't1seo.github.io', action: 'guestbook', challenge_ts: new Date(now - 1000).toISOString() }

test('sends the token to the official server verification endpoint without a raw IP', async () => {
  // Given
  let body: unknown
  let url: unknown
  const transport: typeof fetch = async (input, init) => {
    url = input
    body = init?.body
    return Response.json(valid)
  }
  // When
  await verifyTurnstile('one-use-token', 'server-secret', 't1seo.github.io', now, transport)
  // Then
  assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify')
  assert.ok(body instanceof URLSearchParams)
  assert.equal(body.get('response'), 'one-use-token')
  assert.equal(body.has('remoteip'), false)
})

for (const [label, response] of [
  ['replayed token', { success: false, 'error-codes': ['timeout-or-duplicate'] }],
  ['wrong host', { ...valid, hostname: 'attacker.test' }],
  ['wrong action', { ...valid, action: 'login' }],
  ['old challenge', { ...valid, challenge_ts: new Date(now - 300001).toISOString() }],
  ['future challenge', { ...valid, challenge_ts: new Date(now + 60000).toISOString() }],
  ['invalid timestamp', { ...valid, challenge_ts: 'not-a-date' }],
  ['nonboolean success', { ...valid, success: 'true' }],
  ['missing fields', { success: true }], ['non-object response', null],
] satisfies ReadonlyArray<readonly [string, unknown]>) {
  test(`fails closed on ${label}`, async () => {
    // Given
    const transport: typeof fetch = async () => Response.json(response)
    // When
    const result = verifyTurnstile('token', 'secret', 't1seo.github.io', now, transport)
    // Then
    await assert.rejects(result, { code: 'invalid_verification' })
  })
}

test('fails closed when the verification service times out', async () => {
  // Given
  const transport: typeof fetch = async () => { throw new DOMException('timeout', 'TimeoutError') }
  // When
  const result = verifyTurnstile('token', 'secret', 't1seo.github.io', now, transport)
  // Then
  await assert.rejects(result, { code: 'unavailable' })
})

test('fails closed when the verification service returns invalid JSON', async () => {
  // Given
  const transport: typeof fetch = async () => new Response('<html>outage</html>')
  // When
  const result = verifyTurnstile('token', 'secret', 't1seo.github.io', now, transport)
  // Then
  await assert.rejects(result, { code: 'unavailable' })
})
