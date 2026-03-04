const mockTagRepository = {
  clearCaptureTags: jest.fn(),
  deleteTag: jest.fn(),
  findByCanonicalLabel: jest.fn(),
  getById: jest.fn(),
  listAll: jest.fn(),
  listCaptureIds: jest.fn(),
  mergeTags: jest.fn(),
  renameTag: jest.fn(),
  upsert: jest.fn(),
};

const mockSearchService = {
  reindexCapture: jest.fn(),
};

jest.mock('@/modules/tags/tag.repository', () => ({
  TagRepository: jest.fn(() => mockTagRepository),
}));

jest.mock('@/modules/search/search.service', () => ({
  SearchService: jest.fn(() => mockSearchService),
}));

jest.mock('@/utils/ids', () => ({
  createId: jest.fn(() => 'tag-new'),
}));

import { TagService } from '@/modules/tags/tag.service';

describe('TagService', () => {
  beforeEach(() => {
    for (const mockFn of Object.values(mockTagRepository)) {
      mockFn.mockReset();
    }
    mockSearchService.reindexCapture.mockReset();
  });

  it('creates normalized lowercase tags and reuses canonical matches', async () => {
    mockTagRepository.findByCanonicalLabel.mockResolvedValueOnce(null).mockResolvedValueOnce({
      canonicalLabel: 'study',
      createdAt: 1,
      id: 'tag-existing',
      label: 'study',
      lastUsedAt: null,
      updatedAt: 1,
    });

    const service = new TagService({} as never);

    await expect(service.createTag('  Study  ')).resolves.toBe('tag-new');
    await expect(service.createTag('study')).resolves.toBe('tag-existing');

    expect(mockTagRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalLabel: 'study',
        id: 'tag-new',
        label: 'study',
      }),
    );
  });

  it('merges into an existing canonical tag and reindexes affected captures', async () => {
    mockTagRepository.listCaptureIds.mockResolvedValue(['capture-1', 'capture-2']);
    mockTagRepository.findByCanonicalLabel.mockResolvedValue({
      canonicalLabel: 'study',
      createdAt: 1,
      id: 'tag-target',
      label: 'study',
      lastUsedAt: 1,
      updatedAt: 1,
    });

    const service = new TagService({} as never);
    const result = await service.renameOrMergeTag('tag-source', '  Study ');

    expect(result).toBe('tag-target');
    expect(mockTagRepository.mergeTags).toHaveBeenCalledWith('tag-source', 'tag-target', expect.any(Number));
    expect(mockSearchService.reindexCapture).toHaveBeenCalledTimes(2);
  });

  it('deletes a tag and reindexes linked captures', async () => {
    mockTagRepository.listCaptureIds.mockResolvedValue(['capture-1']);

    const service = new TagService({} as never);
    await service.deleteTag('tag-1');

    expect(mockTagRepository.deleteTag).toHaveBeenCalledWith('tag-1');
    expect(mockSearchService.reindexCapture).toHaveBeenCalledWith('capture-1');
  });
});
