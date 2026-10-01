import { ApiError, type GuestbookEntry, type Submission } from './types.ts'

const DAY = 86400000

export async function claimAttempt(db: D1Database, ipHash: string, now: number): Promise<void> {
  const day = Math.floor(now / DAY) * DAY
  const claimed = await db.prepare(`INSERT INTO guestbook_attempts (ip_hash, created_at)
    SELECT ?1, ?2 WHERE
      COALESCE((SELECT attempts FROM guestbook_daily_budget WHERE utc_day = ?4), 0) < 1000
      AND (SELECT COUNT(*) FROM guestbook_attempts WHERE ip_hash = ?1 AND created_at > ?3) < 30
      AND (SELECT COUNT(*) FROM guestbook_attempts WHERE ip_hash = ?1 AND created_at >= ?4) < 120
    RETURNING id`).bind(ipHash, now, now - 600000, day).first<{ id: number }>()
  if (claimed) return
  const daily = await db.prepare(`SELECT
    (SELECT COUNT(*) FROM guestbook_attempts WHERE ip_hash = ?1 AND created_at >= ?2) AS visitor,
    COALESCE((SELECT attempts FROM guestbook_daily_budget WHERE utc_day = ?2), 0) AS total
  `).bind(ipHash, day).first<{ visitor: number; total: number }>()
  const retryAfter = daily && (daily.visitor >= 120 || daily.total >= 1000)
    ? Math.ceil((day + DAY - now) / 1000) : 600
  throw new ApiError(429, 'rate_limited', 'Too many attempts. Please try again later.', retryAfter)
}

export async function insertEntry(
  db: D1Database, submission: Submission, ipHash: string, messageHash: string, now: number,
): Promise<GuestbookEntry> {
  const day = Math.floor(now / DAY) * DAY
  const id = crypto.randomUUID()
  const inserted = await db.prepare(`INSERT INTO guestbook_entries (id,name,message,created_at,ip_hash,message_hash)
    SELECT ?1, ?2, ?3, ?4, ?5, ?6 WHERE
      COALESCE((SELECT entries FROM guestbook_daily_budget WHERE utc_day = ?9), 0) < 100
      AND NOT EXISTS (SELECT 1 FROM guestbook_entries WHERE ip_hash = ?5 AND created_at > ?7)
      AND (SELECT COUNT(*) FROM guestbook_entries WHERE ip_hash = ?5 AND created_at > ?8) < 5
      AND (SELECT COUNT(*) FROM guestbook_entries WHERE ip_hash = ?5 AND created_at >= ?9) < 20
      AND NOT EXISTS (SELECT 1 FROM guestbook_entries WHERE ip_hash = ?5 AND message_hash = ?6 AND created_at > ?10)
    RETURNING id`).bind(id, submission.name, submission.message, now, ipHash, messageHash,
    now - 60000, now - 3600000, day, now - DAY).first<{ id: string }>()
  if (inserted) return { id, name: submission.name, message: submission.message, createdAt: new Date(now).toISOString() }
  const limits = await db.prepare(`SELECT
    EXISTS (SELECT 1 FROM guestbook_entries WHERE ip_hash = ?1 AND message_hash = ?2 AND created_at > ?3) AS duplicate,
    COALESCE((SELECT entries FROM guestbook_daily_budget WHERE utc_day = ?4), 0) AS global_day,
    (SELECT COUNT(*) FROM guestbook_entries WHERE ip_hash = ?1 AND created_at >= ?4) AS visitor_day,
    (SELECT COUNT(*) FROM guestbook_entries WHERE ip_hash = ?1 AND created_at > ?5) AS visitor_hour,
    (SELECT MIN(created_at) FROM guestbook_entries WHERE ip_hash = ?1 AND created_at > ?5) AS hour_oldest,
    (SELECT MAX(created_at) FROM guestbook_entries WHERE ip_hash = ?1) AS latest
  `).bind(ipHash, messageHash, now - DAY, day, now - 3600000).first<{
    duplicate: number; global_day: number; visitor_day: number; visitor_hour: number;
    hour_oldest: number | null; latest: number | null;
  }>()
  if (limits?.duplicate) throw new ApiError(409, 'duplicate_entry', 'You have already left this message. Thank you!')
  let retryAt = now + 60000
  if (limits) {
    if (limits.global_day >= 100 || limits.visitor_day >= 20) retryAt = day + DAY
    else if (limits.visitor_hour >= 5 && limits.hour_oldest !== null) retryAt = limits.hour_oldest + 3600000
    else if (limits.latest !== null) retryAt = limits.latest + 60000
  }
  throw new ApiError(429, 'rate_limited', 'Please leave a little time between messages.', Math.max(1, Math.ceil((retryAt - now) / 1000)))
}

export async function cleanAbuseRecords(db: D1Database, now: number): Promise<void> {
  const cutoff = now - 2 * DAY
  await db.batch([
    db.prepare('DELETE FROM guestbook_attempts WHERE created_at < ?').bind(cutoff),
    db.prepare('DELETE FROM guestbook_daily_budget WHERE utc_day < ?').bind(Math.floor(cutoff / DAY) * DAY),
    db.prepare('UPDATE guestbook_entries SET ip_hash = NULL, message_hash = NULL WHERE created_at < ? AND ip_hash IS NOT NULL').bind(cutoff),
  ])
}
