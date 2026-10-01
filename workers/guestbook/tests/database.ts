import { readFile } from 'node:fs/promises'
import { URL } from 'node:url'
import { convertV4MiniflareOptions, Miniflare } from 'miniflare'

export async function databaseFixture() {
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: 'export default { fetch() { return new Response("test") } }',
    compatibilityDate: '2026-10-01',
    d1Databases: ['DB'],
  }))
  const db = await runtime.getD1Database('DB')
  const sql = await readFile(new URL('../migrations/0001_guestbook.sql', import.meta.url), 'utf8')
  await db.exec(sql.replace(/\n/g, ' '))
  return { db, dispose: () => runtime.dispose() }
}

export async function seedEntry(db: D1Database, time: number, ipHash = 'visitor', messageHash = crypto.randomUUID(), hidden = 0) {
  await db.prepare(`INSERT INTO guestbook_entries (id,name,message,created_at,ip_hash,message_hash,hidden)
    VALUES (?, 'Guest', 'A quiet room', ?, ?, ?, ?)`).bind(crypto.randomUUID(), time, ipHash, messageHash, hidden).run()
}
