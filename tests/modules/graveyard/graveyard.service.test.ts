import { GraveyardService } from '@/modules/graveyard/graveyard.service';

describe('GraveyardService', () => {
  it('marks available-missing captures as recovered and unavailable captures as missing during integrity scan', async () => {
    const captureRepository = {
      clearMissing: jest.fn(),
      listIntegrityScanCandidates: jest.fn().mockResolvedValue([
        {
          id: 'capture-missing',
          isMissing: false,
          mediaAssetId: 'asset-missing',
          sourceScheme: 'ph',
          sourceUri: 'ph://asset-missing',
        },
        {
          id: 'capture-recovered',
          isMissing: true,
          mediaAssetId: 'asset-recovered',
          sourceScheme: 'file',
          sourceUri: 'file:///tmp/capture.png',
        },
      ]),
      markMissing: jest.fn(),
      relinkSource: jest.fn(),
    };
    const mediaGateway = {
      verifySourceAvailability: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
    };
    const service = new GraveyardService({} as never, {
      captureRepository: captureRepository as never,
      mediaGateway: mediaGateway as never,
    });

    const result = await service.runIntegrityScan({ limit: 10 });

    expect(result.scanned).toBe(2);
    expect(result.markedMissing).toBe(1);
    expect(result.recovered).toBe(1);
    expect(captureRepository.markMissing).toHaveBeenCalledWith('capture-missing', expect.any(Number));
    expect(captureRepository.clearMissing).toHaveBeenCalledWith('capture-recovered', expect.any(Number));
  });

  it('marks a capture as missing when verifyCaptureById cannot resolve source', async () => {
    const captureRepository = {
      clearMissing: jest.fn(),
      getSourceReferenceById: jest.fn().mockResolvedValue({
        id: 'capture-1',
        isMissing: false,
        mediaAssetId: 'asset-1',
        sourceScheme: 'ph',
        sourceUri: 'ph://asset-1',
      }),
      listIntegrityScanCandidates: jest.fn(),
      markMissing: jest.fn(),
      relinkSource: jest.fn(),
    };
    const mediaGateway = {
      verifySourceAvailability: jest.fn().mockResolvedValue(false),
    };
    const service = new GraveyardService({} as never, {
      captureRepository: captureRepository as never,
      mediaGateway: mediaGateway as never,
    });

    const result = await service.verifyCaptureById('capture-1');

    expect(result).toBe('missing');
    expect(captureRepository.markMissing).toHaveBeenCalledWith('capture-1', expect.any(Number));
    expect(captureRepository.clearMissing).not.toHaveBeenCalled();
  });

  it('updates source references and clears graveyard state during relink', async () => {
    const captureRepository = {
      clearMissing: jest.fn(),
      listIntegrityScanCandidates: jest.fn(),
      markMissing: jest.fn(),
      relinkSource: jest.fn(),
    };
    const service = new GraveyardService({} as never, {
      captureRepository: captureRepository as never,
    });

    await service.relinkCaptureSource({
      captureId: 'capture-1',
      replacementAsset: {
        assetId: 'asset-1',
        capturedAt: null,
        duplicateGroupHint: null,
        fileSize: 1024,
        filename: 'shot.png',
        height: 1200,
        isLikelyScreenshot: true,
        mediaAssetId: 'asset-1',
        mimeType: null,
        previewUri: 'file:///tmp/shot.png',
        sourceFilename: 'shot.png',
        sourceScheme: 'file',
        sourceUri: 'file:///tmp/shot.png',
        width: 800,
      },
    });

    expect(captureRepository.relinkSource).toHaveBeenCalledWith(
      expect.objectContaining({
        captureId: 'capture-1',
        fileSize: 1024,
        sourceScheme: 'file',
        sourceUri: 'file:///tmp/shot.png',
      }),
    );
  });
});
