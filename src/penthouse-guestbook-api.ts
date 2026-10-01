export type GuestbookEntry = {
  readonly id: string;
  readonly name: string;
  readonly message: string;
  readonly createdAt: string;
};

export type GuestbookConfig = { readonly siteKey: string; readonly maxNameLength: number; readonly maxMessageLength: number };
export type GuestbookPage = { readonly entries: readonly GuestbookEntry[]; readonly nextCursor: string | null };
export type GuestbookPost = { readonly name: string; readonly message: string; readonly turnstileToken: string; readonly website: string };
export type GuestbookApi = ReturnType<typeof createGuestbookApi>;

export class GuestbookApiError extends Error {
  readonly code: string;
  readonly retryAfter: number;
  constructor(code: string, message: string, retryAfter = 0) {
    super(message);
    this.name = 'GuestbookApiError';
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function invalidResponse(): never {
  throw new GuestbookApiError('invalid_response', 'The guestbook sent an unexpected response. Please try again.');
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEntry(value: unknown): GuestbookEntry {
  if (!record(value) || typeof value.id !== 'string' || value.id.length > 200 || !value.id
    || typeof value.name !== 'string' || !value.name || value.name.length > 80
    || typeof value.message !== 'string' || value.message.length > 2000
    || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))) return invalidResponse();
  return { id: value.id, name: value.name, message: value.message, createdAt: value.createdAt };
}

export function parseGuestbookPage(value: unknown): GuestbookPage {
  if (!record(value) || !Array.isArray(value.entries) || value.entries.length > 20
    || (value.nextCursor !== null && (typeof value.nextCursor !== 'string' || value.nextCursor.length > 512))) return invalidResponse();
  return { entries: value.entries.map(parseEntry), nextCursor: value.nextCursor };
}

export function parseGuestbookConfig(value: unknown): GuestbookConfig {
  if (!record(value) || typeof value.siteKey !== 'string' || !value.siteKey || value.siteKey.length > 200
    || value.maxNameLength !== 40 || value.maxMessageLength !== 1000) return invalidResponse();
  return { siteKey: value.siteKey, maxNameLength: value.maxNameLength, maxMessageLength: value.maxMessageLength };
}

function parseServerError(value: unknown): GuestbookApiError {
  if (!record(value) || !record(value.error) || typeof value.error.code !== 'string' || typeof value.error.message !== 'string') {
    return new GuestbookApiError('unavailable', 'The guestbook is temporarily unavailable. Please try again.');
  }
  const delay = value.error.retryAfter;
  return new GuestbookApiError(value.error.code, value.error.message.slice(0, 500), typeof delay === 'number' && Number.isFinite(delay) ? Math.max(0, Math.min(delay, 86400)) : 0);
}

export function createGuestbookApi(apiUrl: string, lifetime: AbortSignal) {
  const base = apiUrl.replace(/\/+$/, '');
  async function request(path: string, body?: GuestbookPost): Promise<unknown> {
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    lifetime.addEventListener('abort', cancel, { once: true });
    if (lifetime.aborted) controller.abort();
    const timer = globalThis.setTimeout(() => { timedOut = true; controller.abort(); }, 15_000);
    try {
      const response = await fetch(base + path, {
        method: body ? 'POST' : 'GET', credentials: 'omit', signal: controller.signal,
        headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const value: unknown = await response.json();
      if (!response.ok) throw parseServerError(value);
      return value;
    } catch (error) {
      if (error instanceof GuestbookApiError) throw error;
      if (lifetime.aborted) throw new GuestbookApiError('cancelled', 'This guestbook has been closed.');
      if (timedOut) throw new GuestbookApiError('request_timeout', 'The request took too long. Please try again.');
      if (error instanceof SyntaxError) return invalidResponse();
      if (error instanceof Error) throw new GuestbookApiError('network_error', 'We could not reach the guestbook. Please check your connection.');
      throw error;
    } finally {
      globalThis.clearTimeout(timer);
      lifetime.removeEventListener('abort', cancel);
    }
  }
  return {
    async readConfig(): Promise<GuestbookConfig> { return parseGuestbookConfig(await request('/config')); },
    async readEntries(cursor: string | null): Promise<GuestbookPage> {
      return parseGuestbookPage(await request('/entries' + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : '')));
    },
    async postEntry(body: GuestbookPost): Promise<GuestbookEntry> {
      const response = await request('/entries', body);
      return record(response) ? parseEntry(response.entry) : invalidResponse();
    },
  };
}
