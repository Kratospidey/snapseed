import { SearchRepository } from '@/modules/search/search.repository';
import { EMPTY_SEARCH_FILTERS } from '@/modules/search/search.types';

describe('SearchRepository', () => {
  it('qualifies capture_search.capture_id when searching joined FTS results', async () => {
    const getAllAsync = jest.fn().mockResolvedValue([{ captureId: 'capture-1' }]);
    const repository = new SearchRepository({
      getAllAsync,
    } as never);

    const captureIds = await repository.searchCaptureIds({
      filters: EMPTY_SEARCH_FILTERS,
      limit: 10,
      query: 'study*',
    });

    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT capture_search.capture_id AS captureId'),
      'study*',
      10,
    );
    expect(captureIds).toEqual(['capture-1']);
  });

  it('applies inclusive local date boundaries when date filters are active', async () => {
    const getAllAsync = jest.fn().mockResolvedValue([]);
    const repository = new SearchRepository({
      getAllAsync,
    } as never);

    await repository.searchCaptureIds({
      filters: {
        ...EMPTY_SEARCH_FILTERS,
        dateFrom: '2026-03-05',
        dateTo: '2026-03-06',
      },
      limit: 20,
      query: 'capture*',
    });

    const [query, ftsQuery, fromBoundary, toBoundary, limit] = getAllAsync.mock.calls[0];

    expect(query).toContain('COALESCE(c.captured_at, c.imported_at) >= ?');
    expect(query).toContain('COALESCE(c.captured_at, c.imported_at) <= ?');
    expect(ftsQuery).toBe('capture*');
    expect(fromBoundary).toBe(new Date('2026-03-05T00:00:00.000').getTime());
    expect(toBoundary).toBe(new Date('2026-03-06T23:59:59.999').getTime());
    expect(limit).toBe(20);
  });
});
