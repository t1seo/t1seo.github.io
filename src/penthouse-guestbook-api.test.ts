import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createGuestbookApi, GuestbookApiError, parseGuestbookConfig, parseGuestbookPage } from './penthouse-guestbook-api.ts';

test('keeps guestbook messages as literal text when parsing API entries', () => {
  // Given a hostile-looking message from the public endpoint.
  const message = '<img src=x onerror=alert(1)>& hello';
  // When the page crosses the API boundary.
  const page = parseGuestbookPage({ entries: [{ id: 'a', name: '<script>', message, createdAt: '2026-10-01T10:00:00.000Z' }], nextCursor: null });
  // Then the text is retained for safe textContent rendering.
  assert.equal(page.entries[0]?.message, message);
  assert.equal(page.entries[0]?.name, '<script>');
});

test('rejects malformed and unbounded responses when parsing public data', () => {
  // Given malformed entry metadata and an invalid public configuration.
  const invalid = [{ entries: [{ id: 'a', name: 'Visitor', message: 'Hello', createdAt: 'yesterday' }], nextCursor: null }, { entries: [], nextCursor: 12 }];
  // When each response is parsed.
  // Then no partial result reaches rendering.
  for (const data of invalid) assert.throws(() => parseGuestbookPage(data), GuestbookApiError);
  assert.throws(() => parseGuestbookConfig({ siteKey: '', maxNameLength: 40, maxMessageLength: 1000 }), GuestbookApiError);
});

test('preserves server cooldown when the server rejects a request', async () => {
  // Given a real HTTP server rejecting a rate-limited write.
  const server = createServer((_request, response) => {
    response.writeHead(429, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: { code: 'rate_limited', message: 'Please wait a little.', retryAfter: 60 } }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const api = createGuestbookApi(`http://127.0.0.1:${address.port}`, new AbortController().signal);
  try {
    // When a guest tries to post.
    // Then the client preserves a typed retry duration.
    await assert.rejects(api.postEntry({ name: 'Guest', message: 'Hello', website: '', turnstileToken: 'token' }), error => error instanceof GuestbookApiError && error.code === 'rate_limited' && error.retryAfter === 60);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('aborts an in-flight request when the panel is destroyed', async () => {
  // Given a real endpoint that does not respond until its connection is closed.
  const server = createServer(() => undefined);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const controller = new AbortController();
  const api = createGuestbookApi(`http://127.0.0.1:${address.port}`, controller.signal);
  const received = once(server, 'request');
  const pending = api.readEntries(null);
  await received;
  // When the owner cancels the panel lifetime.
  controller.abort();
  try {
    // Then the request settles as cancellation, without waiting for the network.
    await assert.rejects(pending, error => error instanceof GuestbookApiError && error.code === 'cancelled');
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
