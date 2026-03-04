import type { SQLiteDatabase } from 'expo-sqlite';

import { RECENT_SEARCH_LIMIT } from '@/constants/limits';

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

  async searchCaptureIds(query: string, limit = 50) {
    return this.db.getAllAsync<{ captureId: string }>(
      `
        SELECT capture_id AS captureId
        FROM capture_search
        WHERE capture_search MATCH ?
        LIMIT ?
      `,
      query,
      limit,
    );
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
