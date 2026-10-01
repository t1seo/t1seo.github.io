import { ApiError, type GuestbookEntry } from './types.ts'

type Cursor = { readonly time: number; readonly id: string }

export function parseCursor(value: string | null): Cursor | null {
  if (value === null) return null
  if (value.length > 64) throw new ApiError(400, 'invalid_request', 'This page could not be loaded. Please refresh the guestbook.')
  const [timeText, id, extra] = value.split('_')
  const time = Number(timeText)
  if (extra !== undefined || !timeText || !Number.isSafeInteger(time) || time < 0 || time > 8640000000000000
    || !id || !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id)) {
    throw new ApiError(400, 'invalid_request', 'This page could not be loaded. Please refresh the guestbook.')
  }
  return { time, id: id.toLowerCase() }
}

export async function listEntries(db: D1Database, cursor: Cursor | null): Promise<{
  readonly entries: readonly GuestbookEntry[]
  readonly nextCursor: string | null
}> {
  const query = cursor
    ? db.prepare(`SELECT id,name,message,created_at FROM guestbook_entries
      WHERE hidden = 0 AND (created_at < ?1 OR (created_at = ?1 AND id < ?2))
      ORDER BY created_at DESC,id DESC LIMIT 21`).bind(cursor.time, cursor.id)
    : db.prepare(`SELECT id,name,message,created_at FROM guestbook_entries
      WHERE hidden = 0 ORDER BY created_at DESC,id DESC LIMIT 21`)
  const { results } = await query.all<{ id: string; name: string; message: string; created_at: number }>()
  const page = results.slice(0, 20)
  const last = page.at(-1)
  return {
    entries: page.map((row) => ({ id: row.id, name: row.name, message: row.message, createdAt: new Date(row.created_at).toISOString() })),
    nextCursor: results.length > 20 && last ? `${last.created_at}_${last.id}` : null,
  }
}
