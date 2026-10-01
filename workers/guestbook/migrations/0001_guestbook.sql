CREATE TABLE guestbook_entries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  created_at INTEGER NOT NULL,
  ip_hash TEXT,
  message_hash TEXT,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1))
);
CREATE INDEX guestbook_visible ON guestbook_entries (created_at DESC, id DESC) WHERE hidden = 0;
CREATE INDEX guestbook_ip_time ON guestbook_entries (ip_hash, created_at);
CREATE INDEX guestbook_duplicate ON guestbook_entries (ip_hash, message_hash, created_at);
CREATE INDEX guestbook_time ON guestbook_entries (created_at);
CREATE INDEX guestbook_private_expiry ON guestbook_entries (created_at) WHERE ip_hash IS NOT NULL;

CREATE TABLE guestbook_attempts (
  id INTEGER PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX guestbook_attempt_ip_time ON guestbook_attempts (ip_hash, created_at);
CREATE INDEX guestbook_attempt_time ON guestbook_attempts (created_at);

CREATE TABLE guestbook_daily_budget (
  utc_day INTEGER PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  entries INTEGER NOT NULL DEFAULT 0
);
CREATE TRIGGER guestbook_count_attempt AFTER INSERT ON guestbook_attempts BEGIN
  INSERT INTO guestbook_daily_budget (utc_day, attempts)
    VALUES (NEW.created_at - (NEW.created_at % 86400000), 1)
    ON CONFLICT(utc_day) DO UPDATE SET attempts = attempts + 1;
END;
CREATE TRIGGER guestbook_count_entry AFTER INSERT ON guestbook_entries BEGIN
  INSERT INTO guestbook_daily_budget (utc_day, entries)
    VALUES (NEW.created_at - (NEW.created_at % 86400000), 1)
    ON CONFLICT(utc_day) DO UPDATE SET entries = entries + 1;
END;
