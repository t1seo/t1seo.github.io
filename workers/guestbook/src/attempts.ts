import { claimAttempt } from './repository.ts'
import { ApiError, type BackgroundContext } from './types.ts'

export async function checkAttempts(db: D1Database, ipHash: string, requestUrl: string, context: BackgroundContext): Promise<void> {
  const cache = await caches.open('guestbook-attempt-blocks-v1')
  const key = new URL(`/.guestbook-attempt-block/${ipHash}`, requestUrl).toString()
  const cached = await cache.match(key)
  if (cached) {
    const retryAt = Number(cached.headers.get('X-Retry-At'))
    if (retryAt > Date.now()) throw new ApiError(429, 'rate_limited', 'Too many attempts. Please try again later.', Math.ceil((retryAt - Date.now()) / 1000))
  }
  try {
    await claimAttempt(db, ipHash, Date.now())
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    if (error.code === 'rate_limited' && error.retryAfter !== undefined) {
      const response = new Response(null, { headers: {
        'Cache-Control': `public, max-age=${Math.min(error.retryAfter, 600)}`,
        'X-Retry-At': String(Date.now() + error.retryAfter * 1000),
      } })
      context.waitUntil(cache.put(key, response))
    }
    throw error
  }
}
