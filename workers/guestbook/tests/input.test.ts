import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeIp, normalizeMessage, parseSubmission } from '../src/input.ts'
import { ApiError } from '../src/types.ts'

const post = (body: unknown, headers = { 'Content-Type': 'application/json' }) =>
  new Request('https://guestbook.test/entries', { method: 'POST', headers, body: JSON.stringify(body) })

test('accepts a normalized name and multiline message when valid', async () => {
  // Given
  const request = post({ name: '  밀키  ', message: '안녕하세요\r\n반가워요', turnstileToken: 'token', website: '' })
  // When
  const submission = await parseSubmission(request)
  // Then
  assert.deepEqual(submission, { name: '밀키', message: '안녕하세요\n반가워요', turnstileToken: 'token' })
})

for (const [label, body] of [
  ['honeypot', { website: 'spam' }], ['empty name', { name: '   ' }],
  ['long name', { name: 'a'.repeat(41) }], ['long message', { message: 'a'.repeat(1001) }],
  ['missing token', { turnstileToken: '' }], ['links', { message: 'https://spam.test' }],
  ['controls', { message: 'bad\u0000text' }], ['repetition', { message: 'a'.repeat(30) }],
  ['invisible message', { message: '\u200B\u2060' }], ['invisible name', { name: '\u200B\u2060' }],
] satisfies ReadonlyArray<readonly [string, Record<string, string>]>) {
  test(`rejects ${label} at the submission boundary`, async () => {
    // Given
    const request = post({ name: 'Guest', message: 'Hello there', turnstileToken: 'token', website: '', ...body })
    // When / Then
    await assert.rejects(parseSubmission(request), ApiError)
  })
}

test('rejects streamed bodies larger than 8KiB without trusting content length', async () => {
  // Given
  const request = post({ name: 'Guest', message: '界'.repeat(4000), turnstileToken: 'token', website: '' })
  // When / Then
  await assert.rejects(parseSubmission(request), { code: 'payload_too_large' })
})

test('rejects form posts when JSON content type is missing', async () => {
  // Given
  const request = post({}, { 'Content-Type': 'text/plain' })
  // When / Then
  await assert.rejects(parseSubmission(request), { code: 'unsupported_media_type' })
})

test('normalizes duplicate whitespace, Unicode compatibility and letter case', () => {
  // Given / When
  const result = normalizeMessage(' Ｈello\u200B\t WORLD\n ')
  // Then
  assert.equal(result, 'hello world')
})

test('canonicalizes equivalent IPv6 addresses and shares a /64 abuse key', () => {
  // Given / When
  const actual = ['2001:db8:abcd:12::1', '2001:0db8:abcd:0012:1234:5678:9abc:def0'].map(normalizeIp)
  // Then
  assert.deepEqual(actual, ['2001:db8:abcd:12::/64', '2001:db8:abcd:12::/64'])
})

test('normalizes IPv4-mapped IPv6 addresses to their IPv4 identity', () => {
  // Given / When
  const result = normalizeIp('::ffff:192.0.2.8')
  // Then
  assert.equal(result, '192.0.2.8')
})

for (const ip of ['', 'garbage', '192.168.1.999', '192.0.2.1, 192.0.2.2', '2001:db8::1%eth0']) {
  test(`rejects invalid trusted-IP value ${JSON.stringify(ip)}`, () => {
    // Given / When / Then
    assert.throws(() => normalizeIp(ip), ApiError)
  })
}
