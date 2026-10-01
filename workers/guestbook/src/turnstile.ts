import { ApiError } from './types.ts'

export async function verifyTurnstile(
  token: string, secret: string, hostname: string, now: number, fetcher: typeof fetch = fetch,
): Promise<void> {
  let result: unknown
  try {
    const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new ApiError(503, 'unavailable', 'Verification is temporarily unavailable. Please try again.')
    result = await response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof Error) {
      throw new ApiError(503, 'unavailable', 'Verification is temporarily unavailable. Please try again.')
    }
    throw error
  }
  if (typeof result !== 'object' || result === null
    || !('success' in result) || result.success !== true
    || !('hostname' in result) || result.hostname !== hostname
    || !('action' in result) || result.action !== 'guestbook'
    || !('challenge_ts' in result) || typeof result.challenge_ts !== 'string') {
    throw new ApiError(403, 'invalid_verification', 'Please complete a fresh verification and try again.')
  }
  const age = now - Date.parse(result.challenge_ts)
  if (!Number.isFinite(age) || age < 0 || age > 300000) {
    throw new ApiError(403, 'invalid_verification', 'Your verification has expired. Please try again.')
  }
}
