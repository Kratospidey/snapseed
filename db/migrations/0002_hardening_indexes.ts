export const hardeningIndexesMigration = {
  version: 2,
  name: 'hardening-indexes',
  sql: `
    CREATE INDEX IF NOT EXISTS idx_captures_deleted_imported
      ON captures (deleted_at, imported_at DESC, id DESC);

    CREATE INDEX IF NOT EXISTS idx_captures_deleted_captured
      ON captures (deleted_at, captured_at DESC, imported_at DESC, id DESC);

    CREATE INDEX IF NOT EXISTS idx_captures_deleted_missing_imported
      ON captures (deleted_at, is_missing, imported_at DESC, id DESC);
  `,
} as const;
