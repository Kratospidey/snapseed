import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  CaptureDetailRecord,
  CaptureSearchProjection,
  CaptureInsertRecord,
  LibraryCaptureRecord,
  LibrarySortOption,
  LibrarySmartView,
} from './capture.types';

const TAG_SEPARATOR = '\u001f';

const LIBRARY_SORT_SQL: Record<LibrarySortOption, string> = {
  captured_asc: 'COALESCE(c.captured_at, c.imported_at) ASC, c.imported_at ASC, c.id ASC',
  captured_desc: 'COALESCE(c.captured_at, c.imported_at) DESC, c.imported_at DESC, c.id DESC',
  imported_asc: 'c.imported_at ASC, c.id ASC',
  imported_desc: 'c.imported_at DESC, c.id DESC',
  last_viewed_desc: 'COALESCE(c.last_viewed_at, 0) DESC, c.imported_at DESC, c.id DESC',
  reminder_due_asc:
    "CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END ASC, COALESCE(r.due_at, c.imported_at) ASC, c.imported_at DESC, c.id DESC",
};

export class CaptureRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async deleteById(captureId: string) {
    await this.db.runAsync('DELETE FROM captures WHERE id = ?', captureId);
  }

  async getSearchProjection(captureId: string) {
    const row = await this.db.getFirstAsync<CaptureSearchProjection>(
      `
        SELECT
          c.id AS captureId,
          COALESCE(c.note_normalized, '') AS noteText,
          COALESCE(GROUP_CONCAT(t.canonical_label, ' '), '') AS tagText
        FROM captures c
        LEFT JOIN capture_tags ct ON ct.capture_id = c.id
        LEFT JOIN tags t ON t.id = ct.tag_id
        WHERE c.id = ?
        GROUP BY c.id
      `,
      captureId,
    );

    return row ?? null;
  }

  async getSmartCounts() {
    const row = await this.db.getFirstAsync<{
      graveyardCount: number;
      reminderCount: number;
      totalCount: number;
      unsortedCount: number;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM captures WHERE deleted_at IS NULL) AS totalCount,
        (
          SELECT COUNT(*)
          FROM captures c
          WHERE c.deleted_at IS NULL
            AND c.note IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM capture_tags ct WHERE ct.capture_id = c.id
            )
        ) AS unsortedCount,
        (
          SELECT COUNT(*)
          FROM captures c
          WHERE c.deleted_at IS NULL
            AND c.is_missing = 1
        ) AS graveyardCount,
        (
          SELECT COUNT(*)
          FROM reminders r
          INNER JOIN captures c ON c.id = r.capture_id
          WHERE c.deleted_at IS NULL
            AND r.status = 'pending'
        ) AS reminderCount
    `);

    return {
      graveyardCount: row?.graveyardCount ?? 0,
      reminderCount: row?.reminderCount ?? 0,
      totalCount: row?.totalCount ?? 0,
      unsortedCount: row?.unsortedCount ?? 0,
    };
  }

  async getDetailById(captureId: string) {
    const row = await this.db.getFirstAsync<{
      capturedAt: number | null;
      duplicateGroupHint: string | null;
      id: string;
      importedAt: number;
      isMissing: number;
      note: string | null;
      reminderDueAt: number | null;
      sourceFilename: string | null;
      sourceUri: string;
      tagLabels: string | null;
    }>(
      `
        SELECT
          c.id,
          c.source_uri AS sourceUri,
          c.source_filename AS sourceFilename,
          c.imported_at AS importedAt,
          c.captured_at AS capturedAt,
          c.note,
          c.is_missing AS isMissing,
          c.duplicate_group_hint AS duplicateGroupHint,
          r.due_at AS reminderDueAt,
          (
            SELECT GROUP_CONCAT(label, '${TAG_SEPARATOR}')
            FROM (
              SELECT t.label AS label
              FROM capture_tags ct
              INNER JOIN tags t ON t.id = ct.tag_id
              WHERE ct.capture_id = c.id
              ORDER BY t.last_used_at DESC, t.label ASC
            )
          ) AS tagLabels
        FROM captures c
        LEFT JOIN reminders r ON r.capture_id = c.id
        WHERE c.id = ?
          AND c.deleted_at IS NULL
      `,
      captureId,
    );

    if (!row) {
      return null;
    }

    return {
      capturedAt: row.capturedAt,
      duplicateGroupHint: row.duplicateGroupHint,
      id: row.id,
      importedAt: row.importedAt,
      isMissing: row.isMissing === 1,
      note: row.note,
      reminderDueAt: row.reminderDueAt,
      sourceFilename: row.sourceFilename,
      sourceUri: row.sourceUri,
      tags: splitTagLabels(row.tagLabels),
    } satisfies CaptureDetailRecord;
  }

  async listLibraryFeed(params: { limit?: number; smartView: LibrarySmartView; sort: LibrarySortOption }) {
    const limit = params.limit ?? 120;
    const whereClause = this.buildLibraryWhereClause(params.smartView);
    const orderByClause = LIBRARY_SORT_SQL[params.sort];
    const rows = await this.db.getAllAsync<{
      capturedAt: number | null;
      duplicateGroupHint: string | null;
      id: string;
      importedAt: number;
      isMissing: 0 | 1;
      note: string | null;
      reminderDueAt: number | null;
      sourceFilename: string | null;
      sourceUri: string;
      tagCount: number;
      tagLabels: string | null;
    }>(
      `
        SELECT
          c.id,
          c.source_uri AS sourceUri,
          c.source_filename AS sourceFilename,
          c.imported_at AS importedAt,
          c.captured_at AS capturedAt,
          c.note,
          c.is_missing AS isMissing,
          c.duplicate_group_hint AS duplicateGroupHint,
          r.due_at AS reminderDueAt,
          (
            SELECT COUNT(*)
            FROM capture_tags ct_count
            WHERE ct_count.capture_id = c.id
          ) AS tagCount,
          (
            SELECT GROUP_CONCAT(label, '${TAG_SEPARATOR}')
            FROM (
              SELECT t.label AS label
              FROM capture_tags ct
              INNER JOIN tags t ON t.id = ct.tag_id
              WHERE ct.capture_id = c.id
              ORDER BY t.last_used_at DESC, t.label ASC
              LIMIT 2
            )
          ) AS tagLabels
        FROM captures c
        LEFT JOIN reminders r ON r.capture_id = c.id
        WHERE c.deleted_at IS NULL
          AND ${whereClause}
        ORDER BY ${orderByClause}
        LIMIT ?
      `,
      limit,
    );

    return rows.map((row) => ({
      capturedAt: row.capturedAt,
      duplicateGroupHint: row.duplicateGroupHint,
      id: row.id,
      importedAt: row.importedAt,
      isMissing: row.isMissing,
      note: row.note,
      reminderDueAt: row.reminderDueAt,
      sourceFilename: row.sourceFilename,
      sourceUri: row.sourceUri,
      tagCount: row.tagCount,
      tagLabels: splitTagLabels(row.tagLabels),
    })) satisfies LibraryCaptureRecord[];
  }

  async insertMany(records: CaptureInsertRecord[]) {
    if (records.length === 0) {
      return;
    }

    await this.db.withTransactionAsync(async () => {
      for (const record of records) {
        await this.db.runAsync(
          `
            INSERT INTO captures (
              id,
              media_asset_id,
              source_uri,
              source_scheme,
              source_filename,
              mime_type,
              imported_at,
              captured_at,
              file_size,
              width,
              height,
              note,
              note_normalized,
              duplicate_group_hint,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          record.id,
          record.mediaAssetId,
          record.sourceUri,
          record.sourceScheme,
          record.sourceFilename,
          record.mimeType,
          record.importedAt,
          record.capturedAt,
          record.fileSize,
          record.width,
          record.height,
          record.note,
          record.noteNormalized,
          record.duplicateGroupHint,
          record.updatedAt,
        );
      }
    });
  }

  async markMissing(captureId: string, detectedAt: number) {
    await this.db.runAsync(
      `
        UPDATE captures
        SET
          is_missing = 1,
          missing_detected_at = ?,
          updated_at = ?
        WHERE id = ?
      `,
      detectedAt,
      detectedAt,
      captureId,
    );
  }

  async relinkSource(params: {
    captureId: string;
    mediaAssetId: string | null;
    sourceScheme: string;
    sourceUri: string;
    updatedAt: number;
  }) {
    await this.db.runAsync(
      `
        UPDATE captures
        SET
          media_asset_id = ?,
          source_uri = ?,
          source_scheme = ?,
          is_missing = 0,
          missing_detected_at = NULL,
          updated_at = ?
        WHERE id = ?
      `,
      params.mediaAssetId,
      params.sourceUri,
      params.sourceScheme,
      params.updatedAt,
      params.captureId,
    );
  }

  async updateNote(captureId: string, note: string | null, noteNormalized: string | null, updatedAt: number) {
    await this.db.runAsync(
      `
        UPDATE captures
        SET
          note = ?,
          note_normalized = ?,
          updated_at = ?
        WHERE id = ?
      `,
      note,
      noteNormalized,
      updatedAt,
      captureId,
    );
  }

  private buildLibraryWhereClause(smartView: LibrarySmartView) {
    switch (smartView) {
      case 'graveyard':
        return 'c.is_missing = 1';
      case 'recent':
        return '1 = 1';
      case 'reminders':
        return "r.status = 'pending'";
      case 'unsorted':
        return `
          c.note IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM capture_tags ct_unsorted
            WHERE ct_unsorted.capture_id = c.id
          )
        `;
      default:
        return '1 = 1';
    }
  }
}

function splitTagLabels(value: string | null) {
  if (!value) {
    return [];
  }

  return value.split(TAG_SEPARATOR).filter(Boolean);
}
