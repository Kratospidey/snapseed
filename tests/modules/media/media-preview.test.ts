const mockGetAssetInfoAsync = jest.fn();

jest.mock('expo-media-library', () => ({
  getAssetInfoAsync: (...args: unknown[]) => mockGetAssetInfoAsync(...args),
}));

import {
  clearPreviewUriCache,
  getInitialCapturePreviewSource,
  resolveCapturePreviewSource,
} from '@/modules/media/media-preview';

describe('media preview source helpers', () => {
  beforeEach(() => {
    clearPreviewUriCache();
    mockGetAssetInfoAsync.mockReset();
  });

  it('keeps the stored preview URI when no media asset id exists', async () => {
    await expect(
      resolveCapturePreviewSource({
        mediaAssetId: null,
        sourceScheme: 'file',
        sourceUri: 'file:///capture.png',
      }),
    ).resolves.toEqual({
      kind: 'renderable',
      renderer: 'expo-image',
      uri: 'file:///capture.png',
    });
  });

  it('refreshes preview sources from media asset info on cold start', async () => {
    mockGetAssetInfoAsync.mockResolvedValue({
      localUri: 'file:///fresh-preview.png',
      uri: 'ph://asset-id',
    });

    await expect(
      resolveCapturePreviewSource({
        mediaAssetId: 'media-1',
        sourceScheme: 'ph',
        sourceUri: 'ph://asset-id',
      }),
    ).resolves.toEqual({
      kind: 'renderable',
      renderer: 'expo-image',
      uri: 'file:///fresh-preview.png',
    });

    await expect(
      resolveCapturePreviewSource({
        mediaAssetId: 'media-1',
        sourceScheme: 'ph',
        sourceUri: 'ph://asset-id',
      }),
    ).resolves.toEqual({
      kind: 'renderable',
      renderer: 'expo-image',
      uri: 'file:///fresh-preview.png',
    });

    expect(mockGetAssetInfoAsync).toHaveBeenCalledTimes(1);
  });

  it('marks unresolved ph:// sources as unrenderable so they do not hit image URL loaders', async () => {
    await expect(
      resolveCapturePreviewSource({
        mediaAssetId: null,
        sourceScheme: 'ph',
        sourceUri: 'ph://asset-id',
      }),
    ).resolves.toEqual({
      kind: 'unrenderable',
      reason: 'ph-uri-unresolved',
    });
  });

  it('returns an unrenderable result when media rehydration still resolves to ph://', async () => {
    mockGetAssetInfoAsync.mockResolvedValue({
      localUri: null,
      uri: 'ph://asset-id',
    });

    await expect(
      resolveCapturePreviewSource({
        mediaAssetId: 'media-1',
        sourceScheme: 'ph',
        sourceUri: 'ph://asset-id',
      }),
    ).resolves.toEqual({
      kind: 'unrenderable',
      reason: 'ph-uri-unresolved',
    });
  });

  it('normalizes initial preview source URIs', () => {
    expect(
      getInitialCapturePreviewSource({
        mediaAssetId: null,
        sourceScheme: 'file',
        sourceUri: '  file:///capture.png  ',
      }),
    ).toEqual({
      kind: 'renderable',
      renderer: 'expo-image',
      uri: 'file:///capture.png',
    });
  });
});
