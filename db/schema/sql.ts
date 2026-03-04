export const initialSchemaSql = `
CREATE TABLE IF NOT EXISTS captures (
  id TEXT PRIMARY KEY NOT NULL,
  media_asset_id TEXT,
  source_uri TEXT NOT NULL,
  source_scheme TEXT NOT NULL,
  source_filename TEXT,
  mime_type TEXT,
  imported_at INTEGER NOT NULL,
  captured_at INTEGER,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  note TEXT,
  note_normalized TEXT,
  is_missing INTEGER NOT NULL DEFAULT 0,
  missing_detected_at INTEGER,
  duplicate_group_hint TEXT,
  ocr_text TEXT,
  ocr_status TEXT NOT NULL DEFAULT 'none',
  ocr_updated_at INTEGER,
  last_viewed_at INTEGER,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_captures_imported_at ON captures (imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_captures_captured_at ON captures (captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_captures_is_missing ON captures (is_missing, imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_captures_media_asset_id ON captures (media_asset_id);
CREATE INDEX IF NOT EXISTS idx_captures_duplicate_group_hint ON captures (duplicate_group_hint);
CREATE INDEX IF NOT EXISTS idx_captures_last_viewed_at ON captures (last_viewed_at DESC);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  canonical_label TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_used_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_canonical_label ON tags (canonical_label);
CREATE INDEX IF NOT EXISTS idx_tags_last_used_at ON tags (last_used_at DESC);

CREATE TABLE IF NOT EXISTS capture_tags (
  capture_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  applied_at INTEGER NOT NULL,
  PRIMARY KEY (capture_id, tag_id),
  FOREIGN KEY (capture_id) REFERENCES captures(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_capture_tags_tag_id_capture_id
  ON capture_tags (tag_id, capture_id);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  capture_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  due_at INTEGER NOT NULL,
  local_date TEXT NOT NULL,
  local_time TEXT NOT NULL,
  timezone TEXT NOT NULL,
  notification_id TEXT,
  last_notified_at INTEGER,
  last_interaction_at INTEGER,
  completed_at INTEGER,
  auto_snooze_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (capture_id) REFERENCES captures(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminders_status_due_at ON reminders (status, due_at ASC);
CREATE INDEX IF NOT EXISTS idx_reminders_capture_id ON reminders (capture_id);

CREATE TABLE IF NOT EXISTS recent_searches (
  id TEXT PRIMARY KEY NOT NULL,
  query_text TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  filter_snapshot TEXT,
  last_used_at INTEGER NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recent_searches_lookup
  ON recent_searches (normalized_query, COALESCE(filter_snapshot, ''));

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS capture_search USING fts5(
  capture_id UNINDEXED,
  note_text,
  tag_text,
  tokenize = 'unicode61 remove_diacritics 2'
);
`;

