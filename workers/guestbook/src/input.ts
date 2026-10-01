import { ApiError, type Submission } from './types.ts'

const invalidInput = () => new ApiError(400, 'invalid_request', 'Please check your name and message.')

export async function parseSubmission(request: Request): Promise<Submission> {
  if (request.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    throw new ApiError(415, 'unsupported_media_type', 'Please submit the guestbook form as JSON.')
  }
  if (Number(request.headers.get('Content-Length')) > 8192) {
    throw new ApiError(413, 'payload_too_large', 'Your message is too large.')
  }
  const reader = request.body?.getReader()
  if (!reader) throw invalidInput()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 8192) {
        await reader.cancel()
        throw new ApiError(413, 'payload_too_large', 'Your message is too large.')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  let body: unknown
  try {
    body = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes))
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) throw invalidInput()
    throw error
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)
    || !('name' in body) || typeof body.name !== 'string'
    || !('message' in body) || typeof body.message !== 'string'
    || !('turnstileToken' in body) || typeof body.turnstileToken !== 'string'
    || !('website' in body) || body.website !== '') throw invalidInput()
  const name = body.name.normalize('NFC').trim().replace(/\s+/gu, ' ')
  const message = body.message.normalize('NFC').replace(/\r\n?/g, '\n').trim()
  const turnstileToken = body.turnstileToken.trim()
  if (name.length < 1 || name.length > 40 || message.length < 1 || message.length > 1000
    || !normalizeMessage(name) || !normalizeMessage(message)
    || turnstileToken.length < 1 || turnstileToken.length > 2048
    || /[\u0000-\u001f\u007f]/u.test(body.name)
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(message)
    || /(.)\1{19}/us.test(message)) throw invalidInput()
  if (/(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|xyz|top|ru|cn)\b)/iu.test(`${name} ${message}`)) {
    throw new ApiError(400, 'invalid_request', 'Links are not allowed in the guestbook.')
  }
  return { name, message, turnstileToken }
}

export function normalizeMessage(message: string): string {
  return message.normalize('NFKC').replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/gu, '')
    .trim().replace(/\s+/gu, ' ').toLowerCase()
}

export function normalizeIp(ip: string): string {
  const invalid = () => new ApiError(403, 'invalid_request', 'A valid connection is required.')
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) {
    const octets = ip.split('.').map(Number)
    if (octets.some((octet) => octet > 255)) throw invalid()
    return octets.join('.')
  }
  if (!ip.includes(':') || /[^a-f\d:.]/iu.test(ip)) throw invalid()
  let hostname: string
  try {
    hostname = new URL(`http://[${ip}]/`).hostname.slice(1, -1)
  } catch (error) {
    if (error instanceof TypeError) throw invalid()
    throw error
  }
  const [left = '', right = ''] = hostname.split('::')
  const start = left ? left.split(':') : []
  const end = right ? right.split(':') : []
  const parts = hostname.includes('::')
    ? [...start, ...Array<string>(8 - start.length - end.length).fill('0'), ...end]
    : start
  if (parts.length !== 8) throw invalid()
  const numbers = parts.map((part) => Number.parseInt(part, 16))
  if (numbers.slice(0, 5).every((part) => part === 0) && numbers[5] === 65535) {
    const high = numbers[6]
    const low = numbers[7]
    if (high === undefined || low === undefined) throw invalid()
    return [high >> 8, high & 255, low >> 8, low & 255].join('.')
  }
  return `${numbers.slice(0, 4).map((part) => part.toString(16)).join(':')}::/64`
}
