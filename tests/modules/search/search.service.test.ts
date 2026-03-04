const mockCaptureRepository = {
  deleteById: jest.fn(),
  getSearchProjection: jest.fn(),
  listByIdsInOrder: jest.fn(),
  listFilteredFeed: jest.fn(),
};

const mockSearchRepository = {
  deleteCaptureDocument: jest.fn(),
  listRecentSearches: jest.fn(),
  pruneRecentSearches: jest.fn(),
  saveRecentSearch: jest.fn(),
  searchCaptureIds: jest.fn(),
  upsertCaptureDocument: jest.fn(),
};

jest.mock('@/modules/captures/capture.repository', () => ({
  CaptureRepository: jest.fn(() => mockCaptureRepository),
}));

jest.mock('@/modules/search/search.repository', () => ({
  SearchRepository: jest.fn(() => mockSearchRepository),
}));

jest.mock('@/utils/ids', () => ({
  createId: jest.fn(() => 'recent-search-1'),
}));

import { SearchService } from '@/modules/search/search.service';
import {
  EMPTY_SEARCH_FILTERS,
  parseSearchFilterSnapshot,
  serializeSearchFilters,
} from '@/modules/search/search.types';

import { createLibraryCapture } from '@/tests/support/fixtures';

describe('SearchService', () => {
  beforeEach(() => {
    for (const mockFn of Object.values(mockCaptureRepository)) {
      mockFn.mockReset();
    }

    for (const mockFn of Object.values(mockSearchRepository)) {
      mockFn.mockReset();
    }
  });

  it('uses the FTS path for non-empty queries and hydrates ordered results', async () => {
    const first = createLibraryCapture({ id: 'capture-1', note: 'first' });
    const second = createLibraryCapture({ id: 'capture-2', note: 'second' });
    mockSearchRepository.searchCaptureIds.mockResolvedValue(['capture-2', 'capture-1']);
    mockCaptureRepository.listByIdsInOrder.mockResolvedValue([second, first]);

    const service = new SearchService({} as never);
    const results = await service.searchCaptures({
      filters: EMPTY_SEARCH_FILTERS,
      queryText: 'Study note',
    });

    expect(mockSearchRepository.searchCaptureIds).toHaveBeenCalledWith({
      filters: EMPTY_SEARCH_FILTERS,
      limit: 50,
      query: 'study* note*',
    });
    expect(mockCaptureRepository.listByIdsInOrder).toHaveBeenCalledWith(['capture-2', 'capture-1']);
    expect(results).toEqual([second, first]);
  });

  it('uses the filtered feed path when only filters are active', async () => {
    const filteredCapture = createLibraryCapture({ id: 'capture-filtered' });
    mockCaptureRepository.listFilteredFeed.mockResolvedValue([filteredCapture]);

    const service = new SearchService({} as never);
    const results = await service.searchCaptures({
      filters: {
        ...EMPTY_SEARCH_FILTERS,
        hasReminder: true,
      },
      queryText: '   ',
    });

    expect(mockSearchRepository.searchCaptureIds).not.toHaveBeenCalled();
    expect(mockCaptureRepository.listFilteredFeed).toHaveBeenCalledWith({
      filters: {
        ...EMPTY_SEARCH_FILTERS,
        hasReminder: true,
      },
      limit: 50,
    });
    expect(results).toEqual([filteredCapture]);
  });

  it('returns no results when no query and no filters are active', async () => {
    const service = new SearchService({} as never);

    await expect(
      service.searchCaptures({
        filters: EMPTY_SEARCH_FILTERS,
        queryText: '   ',
      }),
    ).resolves.toEqual([]);
  });

  it('registers normalized recent searches and preserves filter snapshots', async () => {
    const service = new SearchService({} as never);
    const filterSnapshot = serializeSearchFilters({
      ...EMPTY_SEARCH_FILTERS,
      unsorted: true,
    });

    await service.registerRecentSearch('  Study  ', filterSnapshot);

    expect(mockSearchRepository.saveRecentSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        filterSnapshot,
        id: 'recent-search-1',
        normalizedQuery: 'study',
        queryText: 'Study',
      }),
    );
    expect(mockSearchRepository.pruneRecentSearches).toHaveBeenCalled();
  });

  it('serializes and parses filter snapshots consistently', () => {
    const snapshot = serializeSearchFilters({
      dateFrom: '2026-03-01',
      dateTo: '2026-03-10',
      graveyard: true,
      hasReminder: false,
      unsorted: true,
    });

    expect(parseSearchFilterSnapshot(snapshot)).toEqual({
      dateFrom: '2026-03-01',
      dateTo: '2026-03-10',
      graveyard: true,
      hasReminder: false,
      unsorted: true,
    });
  });
});
