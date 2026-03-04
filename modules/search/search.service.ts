import type { SQLiteDatabase } from 'expo-sqlite';

import { RECENT_SEARCH_LIMIT } from '@/constants/limits';
import { CaptureRepository } from '@/modules/captures/capture.repository';
import { createId } from '@/utils/ids';
import { buildFtsQuery, normalizeSearchQuery } from '@/utils/strings';

import { SearchRepository } from './search.repository';
import {
  EMPTY_SEARCH_FILTERS,
  hasActiveSearchFilters,
  normalizeSearchFilters,
  parseSearchFilterSnapshot,
  serializeSearchFilters,
  type SearchFilters,
} from './search.types';

export class SearchService {
  private readonly captureRepository: CaptureRepository;
  private readonly searchRepository: SearchRepository;

  constructor(db: SQLiteDatabase) {
    this.captureRepository = new CaptureRepository(db);
    this.searchRepository = new SearchRepository(db);
  }

  async listRecentSearches(limit = RECENT_SEARCH_LIMIT) {
    return this.searchRepository.listRecentSearches(limit);
  }

  async reindexCapture(captureId: string) {
    const projection = await this.captureRepository.getSearchProjection(captureId);

    if (!projection) {
      await this.searchRepository.deleteCaptureDocument(captureId);
      return;
    }

    await this.searchRepository.upsertCaptureDocument({
      captureId,
      noteText: projection.noteText,
      tagText: projection.tagText,
    });
  }

  async registerRecentSearch(queryText: string, filterSnapshot: string | null = null) {
    const normalizedQuery = normalizeSearchQuery(queryText);

    if (!normalizedQuery) {
      return;
    }

    await this.searchRepository.saveRecentSearch({
      filterSnapshot,
      id: createId('recent-search'),
      lastUsedAt: Date.now(),
      normalizedQuery,
      queryText: queryText.trim(),
    });
    await this.searchRepository.pruneRecentSearches();
  }

  async searchCaptureIds(queryText: string, limit = 50, filters: SearchFilters = EMPTY_SEARCH_FILTERS) {
    const normalizedQuery = normalizeSearchQuery(queryText);

    if (!normalizedQuery) {
      return [];
    }

    return this.searchRepository.searchCaptureIds({
      filters: normalizeSearchFilters(filters),
      limit,
      query: buildFtsQuery(normalizedQuery),
    });
  }

  async searchCaptures(params: { filters?: SearchFilters; limit?: number; queryText: string }) {
    const filters = normalizeSearchFilters(params.filters);
    const normalizedQuery = normalizeSearchQuery(params.queryText);
    const limit = params.limit ?? 50;

    if (normalizedQuery) {
      const captureIds = await this.searchRepository.searchCaptureIds({
        filters,
        limit,
        query: buildFtsQuery(normalizedQuery),
      });

      return this.captureRepository.listByIdsInOrder(captureIds);
    }

    if (hasActiveSearchFilters(filters)) {
      return this.captureRepository.listFilteredFeed({
        filters,
        limit,
      });
    }

    return [];
  }

  parseFilterSnapshot(snapshot: string | null | undefined) {
    return parseSearchFilterSnapshot(snapshot);
  }

  serializeFilterSnapshot(filters: SearchFilters) {
    return serializeSearchFilters(filters);
  }
}
