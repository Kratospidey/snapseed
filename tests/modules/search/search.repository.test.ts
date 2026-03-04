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
});
