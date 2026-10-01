import { ApiError, type Env } from './types.ts'

export type Config = {
  readonly siteKey: string
  readonly verificationSecret: string
  readonly hashSecret: string
  readonly origins: readonly string[]
}

export function readConfig(env: Env): Config {
  const unavailable = () => new ApiError(503, 'unavailable', 'The guestbook is temporarily unavailable.')
  const siteKey = env.TURNSTILE_SITE_KEY?.trim()
  const verificationSecret = env.TURNSTILE_SECRET_KEY?.trim()
  const hashSecret = env.IP_HASH_SECRET?.trim()
  if (!siteKey || siteKey.length < 20 || /^(?:[123]x|REPLACE_)/.test(siteKey)
    || !verificationSecret || verificationSecret.length < 20 || /^(?:[123]x|REPLACE_)/.test(verificationSecret)
    || !hashSecret || hashSecret.length < 32 || hashSecret.startsWith('REPLACE_')) throw unavailable()
  const origins = (env.ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean)
  if (origins.length === 0) throw unavailable()
  for (const origin of origins) {
    let url: URL
    try { url = new URL(origin) } catch (error) {
      if (error instanceof TypeError) throw unavailable()
      throw error
    }
    if (url.origin !== origin || (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost'))) throw unavailable()
  }
  return { siteKey, verificationSecret, hashSecret, origins }
}

export function requireOrigin(request: Request, config: Config): string | null {
  const origin = request.headers.get('Origin')
  if ((origin !== null && !config.origins.includes(origin)) || (request.method === 'POST' && origin === null)) {
    throw new ApiError(403, 'invalid_origin', 'Please open the guestbook from the website.')
  }
  return origin
}

export async function fingerprint(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
