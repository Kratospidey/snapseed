import type { SQLiteDatabase } from 'expo-sqlite';

import { RECENT_SEARCH_LIMIT } from '@/constants/limits';
import type { SearchFilters } from '@/modules/search/search.types';
import { parseLocalDateBoundaryMs } from '@/utils/dates';

type RecentSearchRecord = {
  filterSnapshot: string | null;
  id: string;
  lastUsedAt: number;
  normalizedQuery: string;
  queryText: string;
};

export class SearchRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async deleteCaptureDocument(captureId: string) {
    await this.db.runAsync('DELETE FROM capture_search WHERE capture_id = ?', captureId);
  }

  async listRecentSearches(limit = RECENT_SEARCH_LIMIT) {
    return this.db.getAllAsync<{
      filterSnapshot: string | null;
      id: string;
      lastUsedAt: number;
      queryText: string;
      useCount: number;
    }>(
      `
        SELECT
          id,
          query_text AS queryText,
          filter_snapshot AS filterSnapshot,
          last_used_at AS lastUsedAt,
          use_count AS useCount
        FROM recent_searches
        ORDER BY last_used_at DESC
        LIMIT ?
      `,
      limit,
    );
  }

  async pruneRecentSearches(limit = RECENT_SEARCH_LIMIT) {
    await this.db.runAsync(
      `
        DELETE FROM recent_searches
        WHERE id NOT IN (
          SELECT id
          FROM recent_searches
          ORDER BY last_used_at DESC
          LIMIT ?
        )
      `,
      limit,
    );
  }

  async saveRecentSearch(record: RecentSearchRecord) {
    await this.db.runAsync(
      `
        UPDATE recent_searches
        SET
          query_text = ?,
          last_used_at = ?,
          use_count = use_count + 1
        WHERE normalized_query = ?
          AND COALESCE(filter_snapshot, '') = COALESCE(?, '')
      `,
      record.queryText,
      record.lastUsedAt,
      record.normalizedQuery,
      record.filterSnapshot,
    );

    const changes = await this.db.getFirstAsync<{ count: number }>('SELECT changes() AS count');

    if ((changes?.count ?? 0) > 0) {
      return;
    }

    await this.db.runAsync(
      `
        INSERT INTO recent_searches (
          id,
          query_text,
          normalized_query,
          filter_snapshot,
          last_used_at,
          use_count
        ) VALUES (?, ?, ?, ?, ?, 1)
      `,
      record.id,
      record.queryText,
      record.normalizedQuery,
      record.filterSnapshot,
      record.lastUsedAt,
    );
  }

  async searchCaptureIds(params: { filters: SearchFilters; limit?: number; query: string }) {
    const { clause, params: filterParams } = buildSearchFilterClause(params.filters);
    const rows = await this.db.getAllAsync<{ captureId: string }>(
      `
        SELECT capture_search.capture_id AS captureId
        FROM capture_search
        INNER JOIN captures c ON c.id = capture_search.capture_id
        LEFT JOIN reminders r ON r.capture_id = c.id AND r.status = 'pending'
        WHERE capture_search MATCH ?
          AND c.deleted_at IS NULL
          ${clause ? `AND ${clause}` : ''}
        ORDER BY bm25(capture_search), c.imported_at DESC
        LIMIT ?
      `,
      params.query,
      ...filterParams,
      params.limit ?? 50,
    );

    return rows.map((row) => row.captureId);
  }

  async upsertCaptureDocument(input: { captureId: string; noteText: string; tagText: string }) {
    await this.deleteCaptureDocument(input.captureId);
    await this.db.runAsync(
      `
        INSERT INTO capture_search (capture_id, note_text, tag_text)
        VALUES (?, ?, ?)
      `,
      input.captureId,
      input.noteText,
      input.tagText,
    );
  }
}

function buildSearchFilterClause(filters: SearchFilters) {
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
