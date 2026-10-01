import { readFile } from 'node:fs/promises'
import { URL } from 'node:url'
import { build } from 'esbuild'
import { convertV4MiniflareOptions, Miniflare } from 'miniflare'

export const testOrigin = 'https://t1seo.github.io'

export async function httpFixture(overrides: Record<string, string> = {}) {
  const output = await build({ entryPoints: [new URL('../src/index.ts', import.meta.url).pathname], bundle: true, write: false, format: 'esm', target: 'es2022' })
  const script = output.outputFiles[0]?.text
  if (!script) throw new TypeError('Worker test bundle missing')
  let verifications = 0
  const consumed = new Set<string>()
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true, script, compatibilityDate: '2026-10-01', d1Databases: ['DB'],
    bindings: {
      TURNSTILE_SITE_KEY: '0xProductionLikeSiteKeyForTests',
      TURNSTILE_SECRET_KEY: '0xProductionLikeSecretForTests',
      IP_HASH_SECRET: 'isolated-test-only-hmac-secret-at-least32bytes',
      ALLOWED_ORIGINS: testOrigin,
      ...overrides,
    },
    outboundService: async (request) => {
      assertSiteverify(request.url)
      verifications += 1
      const form = new URLSearchParams(await request.text())
      const token = form.get('response') ?? ''
      if (token.startsWith('bad') || consumed.has(token)) return Response.json({ success: false, 'error-codes': ['timeout-or-duplicate'] })
      consumed.add(token)
      return Response.json({ success: true, hostname: 't1seo.github.io', action: 'guestbook', challenge_ts: new Date(Date.now() - 1000).toISOString() })
    },
  }))
  const db = await runtime.getD1Database('DB')
  const sql = await readFile(new URL('../migrations/0001_guestbook.sql', import.meta.url), 'utf8')
  await db.exec(sql.replace(/\n/g, ' '))
  const post = (body: Record<string, unknown> = {}, headers: Record<string, string> = {}) => runtime.dispatchFetch('https://api.test/entries', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: testOrigin, 'CF-Connecting-IP': '192.0.2.10', ...headers },
    body: JSON.stringify({ name: 'A visitor', message: 'Such a peaceful room.', website: '', turnstileToken: crypto.randomUUID(), ...body }),
  })
  return { runtime, db, post, dispose: () => runtime.dispose(), verifications: () => verifications }
}

function assertSiteverify(url: string) {
  if (url !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify') throw new TypeError('Unexpected external test request')
}
