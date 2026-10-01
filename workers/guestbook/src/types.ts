export type Env = {
  readonly DB: D1Database
  readonly TURNSTILE_SITE_KEY: string
  readonly TURNSTILE_SECRET_KEY: string
  readonly IP_HASH_SECRET: string
  readonly ALLOWED_ORIGINS: string
  readonly WRITES_ENABLED?: string
}

export type BackgroundContext = Pick<ExecutionContext, 'waitUntil'>

export type GuestbookEntry = {
  readonly id: string
  readonly name: string
  readonly message: string
  readonly createdAt: string
}

export type Submission = {
  readonly name: string
  readonly message: string
  readonly turnstileToken: string
}

export type ErrorCode =
  | 'invalid_request' | 'invalid_origin' | 'invalid_verification'
  | 'duplicate_entry' | 'rate_limited' | 'unavailable' | 'not_found'
  | 'method_not_allowed' | 'payload_too_large' | 'unsupported_media_type'

export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly retryAfter: number | undefined

  constructor(status: number, code: ErrorCode, message: string, retryAfter?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}
