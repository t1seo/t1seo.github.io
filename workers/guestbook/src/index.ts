import { fingerprint, readConfig, requireOrigin, type Config } from './config.ts'
import { checkAttempts } from './attempts.ts'
import { listEntries, parseCursor } from './entries.ts'
import { normalizeIp, normalizeMessage, parseSubmission } from './input.ts'
import { cleanAbuseRecords, insertEntry } from './repository.ts'
import { verifyTurnstile } from './turnstile.ts'
import { ApiError, type BackgroundContext, type Env } from './types.ts'

function withHeaders(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('Vary', 'Origin')
  if (origin) headers.set('Access-Control-Allow-Origin', origin)
  return new Response(response.body, { status: response.status, headers })
}

async function getEntries(url: URL, env: Env, context: BackgroundContext): Promise<Response> {
  if ([...url.searchParams.keys()].some((key) => key !== 'cursor') || url.searchParams.getAll('cursor').length > 1) {
    throw new ApiError(400, 'invalid_request', 'This page could not be loaded. Please refresh the guestbook.')
  }
  const cursor = parseCursor(url.searchParams.get('cursor'))
  const cacheUrl = new URL(url.pathname, url.origin)
  if (cursor) cacheUrl.searchParams.set('cursor', `${cursor.time}_${cursor.id}`)
  const cache = await caches.open('guestbook-public-v1')
  const cached = await cache.match(cacheUrl.toString())
  if (cached) return cached
  const response = Response.json(await listEntries(env.DB, cursor), { headers: { 'Cache-Control': 'public, max-age=30' } })
  context.waitUntil(cache.put(cacheUrl.toString(), response.clone()))
  return response
}

async function postEntry(request: Request, env: Env, config: Config, origin: string, context: BackgroundContext): Promise<Response> {
  if (env.WRITES_ENABLED === 'false') throw new ApiError(503, 'unavailable', 'The guestbook is open for reading. New messages are temporarily paused.')
  const submission = await parseSubmission(request)
  const ip = normalizeIp(request.headers.get('CF-Connecting-IP') ?? '')
  const ipHash = await fingerprint(config.hashSecret, `ip:${ip}`)
  await checkAttempts(env.DB, ipHash, request.url, context)
  await verifyTurnstile(submission.turnstileToken, config.verificationSecret, new URL(origin).hostname, Date.now())
  const messageHash = await fingerprint(config.hashSecret, `message:${normalizeMessage(submission.message)}`)
  const entry = await insertEntry(env.DB, submission, ipHash, messageHash, Date.now())
  const cache = await caches.open('guestbook-public-v1')
  context.waitUntil(cache.delete(new URL('/entries', request.url).toString()))
  return Response.json({ entry }, { status: 201 })
}

async function route(request: Request, env: Env, config: Config, origin: string | null, context: BackgroundContext): Promise<Response> {
  const url = new URL(request.url)
  if (url.pathname !== '/config' && url.pathname !== '/entries') throw new ApiError(404, 'not_found', 'Page not found.')
  switch (request.method) {
    case 'OPTIONS': {
      const method = request.headers.get('Access-Control-Request-Method')
      const headers = request.headers.get('Access-Control-Request-Headers')?.toLowerCase().split(',').map((value) => value.trim()) ?? []
      if (!origin || (method !== 'GET' && method !== 'POST') || headers.some((header) => header !== 'content-type')) {
        throw new ApiError(403, 'invalid_origin', 'This request is not allowed.')
      }
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
      } })
    }
    case 'GET':
      if (url.pathname === '/config') return Response.json({ siteKey: config.siteKey, maxNameLength: 40, maxMessageLength: 1000 })
      return getEntries(url, env, context)
    case 'POST':
      if (url.pathname === '/entries' && origin) return postEntry(request, env, config, origin, context)
      throw new ApiError(405, 'method_not_allowed', 'This action is not available.')
    default:
      throw new ApiError(405, 'method_not_allowed', 'This action is not available.')
  }
}

const worker = {
  async fetch(request: Request, env: Env, context: BackgroundContext): Promise<Response> {
    let origin: string | null = null
    try {
      const config = readConfig(env)
      origin = requireOrigin(request, config)
      return withHeaders(await route(request, env, config, origin, context), origin)
    } catch (error) {
      if (!(error instanceof ApiError) && !(error instanceof Error)) throw error
      const failure = error instanceof ApiError
        ? error : new ApiError(503, 'unavailable', 'The guestbook is temporarily unavailable. Please try again later.')
      const details = failure.retryAfter === undefined
        ? { code: failure.code, message: failure.message }
        : { code: failure.code, message: failure.message, retryAfter: failure.retryAfter }
      const response = Response.json({ error: details }, { status: failure.status })
      if (failure.retryAfter !== undefined) response.headers.set('Retry-After', String(failure.retryAfter))
      return withHeaders(response, origin)
    }
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await cleanAbuseRecords(env.DB, Date.now())
  },
} satisfies ExportedHandler<Env>

export default worker
