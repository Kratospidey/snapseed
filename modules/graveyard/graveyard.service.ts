import type { SQLiteDatabase } from 'expo-sqlite';

import { CaptureRepository } from '@/modules/captures/capture.repository';
import { MediaGateway } from '@/modules/media/media.gateway';

import type { GraveyardRelinkInput, GraveyardScanResult, GraveyardVerifyResult } from './graveyard.types';

export class GraveyardService {
  private readonly captureRepository: CaptureRepository;
  private readonly mediaGateway: MediaGateway;

  constructor(
    db: SQLiteDatabase,
    dependencies?: {
      captureRepository?: CaptureRepository;
      mediaGateway?: MediaGateway;
    },
  ) {
    this.captureRepository = dependencies?.captureRepository ?? new CaptureRepository(db);
    this.mediaGateway = dependencies?.mediaGateway ?? new MediaGateway();
  }

  async runIntegrityScan(params?: { limit?: number }): Promise<GraveyardScanResult> {
    const runAt = Date.now();
    const limit = Math.max(1, params?.limit ?? 30);
    const candidates = await this.captureRepository.listIntegrityScanCandidates(limit);
    let markedMissing = 0;
    let recovered = 0;

    for (const candidate of candidates) {
      const available = await this.mediaGateway.verifySourceAvailability({
        mediaAssetId: candidate.mediaAssetId,
        sourceScheme: candidate.sourceScheme,
        sourceUri: candidate.sourceUri,
      });

      if (!available && !candidate.isMissing) {
        await this.captureRepository.markMissing(candidate.id, runAt);
        markedMissing += 1;
      }

      if (available && candidate.isMissing) {
        await this.captureRepository.clearMissing(candidate.id, runAt);
        recovered += 1;
      }
    }

    return {
      markedMissing,
      recovered,
      runAt,
      scanned: candidates.length,
    };
  }

  async verifyCaptureById(captureId: string): Promise<GraveyardVerifyResult> {
    const capture = await this.captureRepository.getSourceReferenceById(captureId);

    if (!capture) {
      return 'not-found';
    }

    const available = await this.mediaGateway.verifySourceAvailability({
      mediaAssetId: capture.mediaAssetId,
      sourceScheme: capture.sourceScheme,
      sourceUri: capture.sourceUri,
    });
    const now = Date.now();

    if (!available) {
      if (!capture.isMissing) {
        await this.captureRepository.markMissing(capture.id, now);
      }

      return 'missing';
    }

    if (capture.isMissing) {
      await this.captureRepository.clearMissing(capture.id, now);
    }

    return 'ok';
  }

  async relinkCaptureSource(input: GraveyardRelinkInput) {
    const now = Date.now();

    await this.captureRepository.relinkSource({
      captureId: input.captureId,
      fileSize: input.replacementAsset.fileSize,
      height: input.replacementAsset.height,
      mediaAssetId: input.replacementAsset.mediaAssetId,
      sourceFilename: input.replacementAsset.sourceFilename,
      sourceScheme: input.replacementAsset.sourceScheme,
      sourceUri: input.replacementAsset.sourceUri,
      updatedAt: now,
      width: input.replacementAsset.width,
    });
  }
}
