import type { SQLiteDatabase } from 'expo-sqlite';

import { RECENT_SEARCH_LIMIT } from '@/constants/limits';
import { CaptureRepository } from '@/modules/captures/capture.repository';
import { createId } from '@/utils/ids';
import { buildFtsQuery, normalizeSearchQuery } from '@/utils/strings';

import { SearchRepository } from './search.repository';

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

  async searchCaptureIds(queryText: string, limit = 50) {
    const normalizedQuery = normalizeSearchQuery(queryText);

    if (!normalizedQuery) {
      return [];
    }

    return this.searchRepository.searchCaptureIds(buildFtsQuery(normalizedQuery), limit);
  }
}

