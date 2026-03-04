const mockCaptureRepository = {
  findPotentialDuplicates: jest.fn(),
};

jest.mock('@/modules/captures/capture.repository', () => ({
  CaptureRepository: jest.fn(() => mockCaptureRepository),
}));

import { DuplicateService } from '@/modules/import/duplicate.service';

import { createDuplicateCandidate, createImportDraftAsset } from '@/tests/support/fixtures';

describe('DuplicateService', () => {
  beforeEach(() => {
    mockCaptureRepository.findPotentialDuplicates.mockReset();
  });

  it('ranks exact matches above weaker heuristics', async () => {
    mockCaptureRepository.findPotentialDuplicates.mockResolvedValue([
      createDuplicateCandidate({
        duplicateGroupHint: 'other|group',
        height: null,
        id: 'capture-low',
        importedAt: 100,
        mediaAssetId: 'other',
        sourceUri: 'file:///other.png',
        width: null,
      }),
      createDuplicateCandidate({ id: 'capture-medium', importedAt: 200, mediaAssetId: 'other-2', sourceUri: 'file:///other-2.png' }),
      createDuplicateCandidate({ id: 'capture-high', importedAt: 300 }),
    ]);

    const service = new DuplicateService({} as never);
    const matches = await service.findMatchesForAsset(createImportDraftAsset());

    expect(matches).toHaveLength(3);
    expect(matches[0]).toMatchObject({ captureId: 'capture-high', confidence: 'high' });
    expect(matches[1]).toMatchObject({ captureId: 'capture-medium', confidence: 'medium' });
    expect(matches[2]).toMatchObject({ captureId: 'capture-low', confidence: 'low' });
  });

  it('returns an empty list when nothing meaningfully matches', async () => {
    mockCaptureRepository.findPotentialDuplicates.mockResolvedValue([
      createDuplicateCandidate({
        capturedAt: 1_000,
        duplicateGroupHint: 'other|group',
        height: 900,
        importedAt: 1,
        mediaAssetId: 'different',
        sourceFilename: 'totally-different.png',
        sourceUri: 'content://different',
        width: 900,
      }),
    ]);

    const service = new DuplicateService({} as never);
    const matches = await service.findMatchesForAsset(
      createImportDraftAsset({
        capturedAt: 2_000_000,
        duplicateGroupHint: 'asset|group',
        mediaAssetId: 'media-123',
        sourceFilename: 'img-1234.png',
        sourceUri: 'file:///img-1234.png',
      }),
    );

    expect(matches).toEqual([]);
  });
});
