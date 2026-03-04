import type { SQLiteDatabase } from 'expo-sqlite';

import type { SearchFilters } from '@/modules/search/search.types';
import { parseLocalDateBoundaryMs } from '@/utils/dates';

import type {
  CaptureDetailRecord,
  ImportDuplicateCandidateRecord,
  CaptureSearchProjection,
  CaptureInsertRecord,
  CaptureSourceReference,
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

  async findPotentialDuplicates(params: {
    duplicateGroupHint: string | null;
    mediaAssetId: string | null;
    sourceFilename: string | null;
    sourceUri: string;
  }) {
    const clauses: string[] = [];
    const args: Array<string> = [];

    if (params.mediaAssetId) {
      clauses.push('media_asset_id = ?');
      args.push(params.mediaAssetId);
    }

    if (params.sourceUri) {
      clauses.push('source_uri = ?');
      args.push(params.sourceUri);
    }

    if (params.duplicateGroupHint) {
      clauses.push('duplicate_group_hint = ?');
      args.push(params.duplicateGroupHint);
    }

    if (params.sourceFilename) {
      clauses.push('source_filename = ?');
      args.push(params.sourceFilename);
    }

    if (clauses.length === 0) {
      return [] satisfies ImportDuplicateCandidateRecord[];
    }

    return this.db.getAllAsync<ImportDuplicateCandidateRecord>(
      `
        SELECT
          id,
          media_asset_id AS mediaAssetId,
          source_uri AS sourceUri,
          source_filename AS sourceFilename,
          imported_at AS importedAt,
          captured_at AS capturedAt,
          width,
          height,
          duplicate_group_hint AS duplicateGroupHint
        FROM captures
        WHERE deleted_at IS NULL
          AND (${clauses.join(' OR ')})
        ORDER BY imported_at DESC
        LIMIT 12
      `,
      ...args,
    );
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
        fileSize: number | null;
        height: number | null;
        id: string;
        importedAt: number;
        isMissing: number;
        mediaAssetId: string | null;
        note: string | null;
        reminderDueAt: number | null;
        reminderLocalDate: string | null;
        reminderLocalTime: string | null;
        reminderTimezone: string | null;
        sourceFilename: string | null;
        sourceScheme: CaptureDetailRecord['sourceScheme'];
        sourceUri: string;
        tagLabels: string | null;
        width: number | null;
      }>(
        `
        SELECT
          c.id,
          c.media_asset_id AS mediaAssetId,
          c.source_uri AS sourceUri,
          c.source_scheme AS sourceScheme,
          c.source_filename AS sourceFilename,
          c.imported_at AS importedAt,
          c.captured_at AS capturedAt,
          c.file_size AS fileSize,
          c.width,
          c.height,
          c.note,
          c.is_missing AS isMissing,
          c.duplicate_group_hint AS duplicateGroupHint,
          r.due_at AS reminderDueAt,
          r.local_date AS reminderLocalDate,
          r.local_time AS reminderLocalTime,
          r.timezone AS reminderTimezone,
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
        LEFT JOIN reminders r ON r.capture_id = c.id AND r.status = 'pending'
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
      fileSize: row.fileSize,
      height: row.height,
      id: row.id,
      importedAt: row.importedAt,
      isMissing: row.isMissing === 1,
      mediaAssetId: row.mediaAssetId,
      note: row.note,
      reminderDueAt: row.reminderDueAt,
      reminderLocalDate: row.reminderLocalDate,
      reminderLocalTime: row.reminderLocalTime,
      reminderTimezone: row.reminderTimezone,
      sourceFilename: row.sourceFilename,
      sourceScheme: row.sourceScheme,
      sourceUri: row.sourceUri,
      tags: splitTagLabels(row.tagLabels),
      width: row.width,
    } satisfies CaptureDetailRecord;
  }

  async listByTagId(tagId: string, limit: number = 120) {
    return this.listLibraryRows({
      limit,
      orderBy: 'COALESCE(c.captured_at, c.imported_at) DESC, c.imported_at DESC, c.id DESC',
      params: [tagId],
      whereClause: `
        c.deleted_at IS NULL
        AND EXISTS (
          SELECT 1
          FROM capture_tags ct
          WHERE ct.capture_id = c.id
            AND ct.tag_id = ?
        )
      `,
    });
  }

  async listLibraryFeed(params: { limit?: number; smartView: LibrarySmartView; sort: LibrarySortOption }) {
    const limit = params.limit ?? 120;
    const whereClause = this.buildLibraryWhereClause(params.smartView);
    const orderByClause = LIBRARY_SORT_SQL[params.sort];
    return this.listLibraryRows({
      limit,
      orderBy: orderByClause,
      whereClause: `c.deleted_at IS NULL AND ${whereClause}`,
    });
  }

  async listByIdsInOrder(captureIds: string[]) {
    if (captureIds.length === 0) {
      return [] satisfies LibraryCaptureRecord[];
    }

    const placeholders = captureIds.map(() => '?').join(', ');
    const rows = await this.db.getAllAsync<LibraryCaptureRow>(
      `
        ${this.getLibrarySelectSql()}
        WHERE c.deleted_at IS NULL
          AND c.id IN (${placeholders})
        ORDER BY c.imported_at DESC, c.id DESC
      `,
      ...captureIds,
    );
    const rowMap = new Map(rows.map((row) => [row.id, mapLibraryCaptureRow(row)]));

    return captureIds
      .map((captureId) => rowMap.get(captureId))
      .filter((row): row is LibraryCaptureRecord => Boolean(row));
  }

  async listFilteredFeed(params: { filters: SearchFilters; limit?: number }) {
    const limit = params.limit ?? 120;
    const { clause, params: queryParams } = this.buildSearchFilterClause(params.filters);

    return this.listLibraryRows({
      limit,
      orderBy: 'COALESCE(c.captured_at, c.imported_at) DESC, c.imported_at DESC, c.id DESC',
      params: queryParams,
      whereClause: `c.deleted_at IS NULL${clause ? ` AND ${clause}` : ''}`,
    });
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

  async clearMissing(captureId: string, updatedAt: number) {
    await this.db.runAsync(
      `
        UPDATE captures
        SET
          is_missing = 0,
          missing_detected_at = NULL,
          updated_at = ?
        WHERE id = ?
      `,
      updatedAt,
      captureId,
    );
  }

  async getSourceReferenceById(captureId: string) {
    const row = await this.db.getFirstAsync<{
      id: string;
      isMissing: 0 | 1;
      mediaAssetId: string | null;
      sourceScheme: CaptureSourceReference['sourceScheme'];
      sourceUri: string;
    }>(
      `
        SELECT
          id,
          is_missing AS isMissing,
          media_asset_id AS mediaAssetId,
          source_scheme AS sourceScheme,
          source_uri AS sourceUri
        FROM captures
        WHERE id = ?
          AND deleted_at IS NULL
      `,
      captureId,
    );

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      isMissing: row.isMissing === 1,
      mediaAssetId: row.mediaAssetId,
      sourceScheme: row.sourceScheme,
      sourceUri: row.sourceUri,
    } satisfies CaptureSourceReference;
  }

  async listIntegrityScanCandidates(limit: number) {
    const rows = await this.db.getAllAsync<{
      id: string;
      isMissing: 0 | 1;
      mediaAssetId: string | null;
      sourceScheme: CaptureSourceReference['sourceScheme'];
      sourceUri: string;
    }>(
      `
        SELECT
          id,
          is_missing AS isMissing,
          media_asset_id AS mediaAssetId,
          source_scheme AS sourceScheme,
          source_uri AS sourceUri
        FROM captures
        WHERE deleted_at IS NULL
        ORDER BY is_missing DESC, imported_at DESC, id DESC
        LIMIT ?
      `,
      limit,
    );

    return rows.map(
      (row) =>
        ({
          id: row.id,
          isMissing: row.isMissing === 1,
          mediaAssetId: row.mediaAssetId,
          sourceScheme: row.sourceScheme,
          sourceUri: row.sourceUri,
        }) satisfies CaptureSourceReference,
    );
  }

  async relinkSource(params: {
    captureId: string;
    fileSize: number | null;
    height: number | null;
    mediaAssetId: string | null;
    sourceFilename: string | null;
    sourceScheme: CaptureSourceReference['sourceScheme'];
    sourceUri: string;
    updatedAt: number;
    width: number | null;
  }) {
    await this.db.runAsync(
      `
        UPDATE captures
        SET
          media_asset_id = ?,
          source_uri = ?,
          source_scheme = ?,
          source_filename = ?,
          file_size = ?,
          width = ?,
          height = ?,
          is_missing = 0,
          missing_detected_at = NULL,
          updated_at = ?
        WHERE id = ?
      `,
      params.mediaAssetId,
      params.sourceUri,
      params.sourceScheme,
      params.sourceFilename,
      params.fileSize,
      params.width,
      params.height,
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

  async touchLastViewed(captureId: string, viewedAt: number) {
    await this.db.runAsync(
      `
        UPDATE captures
        SET
          last_viewed_at = ?,
          updated_at = ?
        WHERE id = ?
      `,
      viewedAt,
      viewedAt,
      captureId,
    );
  }

  private async listLibraryRows(params: {
    limit: number;
    orderBy: string;
    params?: Array<number | string>;
    whereClause: string;
  }) {
    const rows = await this.db.getAllAsync<LibraryCaptureRow>(
      `
        ${this.getLibrarySelectSql()}
        WHERE ${params.whereClause}
        ORDER BY ${params.orderBy}
        LIMIT ?
      `,
      ...(params.params ?? []),
      params.limit,
    );

    return rows.map((row) => mapLibraryCaptureRow(row)) satisfies LibraryCaptureRecord[];
  }

  private buildSearchFilterClause(filters: SearchFilters) {
    const clauses: string[] = [];
    const params: Array<number | string> = [];

    if (filters.unsorted) {
      clauses.push(`
        c.note IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM capture_tags ct_unsorted
          WHERE ct_unsorted.capture_id = c.id
        )
      `);
    }

    if (filters.hasReminder) {
      clauses.push("r.status = 'pending'");
    }

    if (filters.graveyard) {
      clauses.push('c.is_missing = 1');
    }

    if (filters.dateFrom) {
      const dateFrom = parseLocalDateBoundaryMs(filters.dateFrom, 'start');

      if (dateFrom !== null) {
        clauses.push('COALESCE(c.captured_at, c.imported_at) >= ?');
        params.push(dateFrom);
      }
    }

    if (filters.dateTo) {
      const dateTo = parseLocalDateBoundaryMs(filters.dateTo, 'end');

      if (dateTo !== null) {
        clauses.push('COALESCE(c.captured_at, c.imported_at) <= ?');
        params.push(dateTo);
      }
    }

    return {
      clause: clauses.join(' AND '),
      params,
    };
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

  private getLibrarySelectSql() {
    return `
      SELECT
        c.id,
        c.media_asset_id AS mediaAssetId,
        c.source_uri AS sourceUri,
        c.source_scheme AS sourceScheme,
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
            FROM capture_tags ct_labels
            INNER JOIN tags t ON t.id = ct_labels.tag_id
            WHERE ct_labels.capture_id = c.id
            ORDER BY t.last_used_at DESC, t.label ASC
            LIMIT 2
          )
        ) AS tagLabels
      FROM captures c
      LEFT JOIN reminders r ON r.capture_id = c.id AND r.status = 'pending'
    `;
  }
}

type LibraryCaptureRow = {
  capturedAt: number | null;
  duplicateGroupHint: string | null;
  id: string;
  importedAt: number;
  isMissing: 0 | 1;
  mediaAssetId: string | null;
  note: string | null;
  reminderDueAt: number | null;
  sourceFilename: string | null;
  sourceScheme: LibraryCaptureRecord['sourceScheme'];
  sourceUri: string;
  tagCount: number;
  tagLabels: string | null;
};

function mapLibraryCaptureRow(row: LibraryCaptureRow) {
  return {
    capturedAt: row.capturedAt,
    duplicateGroupHint: row.duplicateGroupHint,
    id: row.id,
    importedAt: row.importedAt,
    isMissing: row.isMissing,
    mediaAssetId: row.mediaAssetId,
    note: row.note,
    reminderDueAt: row.reminderDueAt,
    sourceFilename: row.sourceFilename,
    sourceScheme: row.sourceScheme,
    sourceUri: row.sourceUri,
    tagCount: row.tagCount,
    tagLabels: splitTagLabels(row.tagLabels),
  } satisfies LibraryCaptureRecord;
}

function splitTagLabels(value: string | null) {
  if (!value) {
    return [];
  }

  return value.split(TAG_SEPARATOR).filter(Boolean);
}
