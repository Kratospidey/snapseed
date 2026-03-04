import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

import { CaptureService } from '@/modules/captures/capture.service';
import { normalizeTagLabel } from '@/utils/strings';

import { MediaGateway } from '../media/media.gateway';
import type { MediaPickerAsset } from '../media/media.types';
import { DuplicateService } from './duplicate.service';
import type {
  ImportBatchResult,
  ImportDraftAsset,
  ImportDuplicateMatch,
  ImportReminderDraft,
} from './import.types';

const importReminderDraftSchema = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  localTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export class ImportService {
  private readonly captureService: CaptureService;
  private readonly duplicateService: DuplicateService;
  private readonly mediaGateway: MediaGateway;

  constructor(db: SQLiteDatabase) {
    this.captureService = new CaptureService(db);
    this.duplicateService = new DuplicateService(db);
    this.mediaGateway = new MediaGateway();
  }

  async createDraftAsset(asset: MediaPickerAsset): Promise<ImportDraftAsset> {
    const resolved = await this.mediaGateway.resolveAssetForImport(asset);

    return {
      ...resolved,
      duplicateMatches: [],
    };
  }

  async refreshDuplicateMatches(assets: ImportDraftAsset[]) {
    const results = await Promise.all(
      assets.map(async (asset) => ({
        assetId: asset.assetId,
        matches: await this.duplicateService.findMatchesForAsset(asset),
      })),
    );

    return Object.fromEntries(results.map((result) => [result.assetId, result.matches])) as Record<
      string,
      ImportDuplicateMatch[]
    >;
  }

  async importDraftSelection(params: {
    assets: ImportDraftAsset[];
    sharedReminder: ImportReminderDraft | null;
    sharedTagsInput: string;
  }): Promise<ImportBatchResult> {
    const reminder = normalizeReminder(params.sharedReminder);
    const tagLabels = parseSharedTags(params.sharedTagsInput);
    const failedAssets: ImportBatchResult['failedAssets'] = [];
    const importableAssets: ImportDraftAsset[] = [];

    for (const asset of params.assets) {
      const result = await this.mediaGateway.revalidateResolvedAsset(asset);

      if (result.status === 'failed') {
        failedAssets.push(result.failure);
        continue;
      }

      importableAssets.push({
        ...asset,
        ...result.asset,
      });
    }

    if (importableAssets.length === 0) {
      return {
        failedAssets,
        importedAssetIds: [],
        importedCaptureIds: [],
      };
    }

    const importedCaptureIds = await this.captureService.importCaptures(
      importableAssets.map((asset) => ({
        capturedAt: asset.capturedAt,
        duplicateGroupHint: asset.duplicateGroupHint,
        fileSize: asset.fileSize,
        height: asset.height,
        mediaAssetId: asset.mediaAssetId,
        mimeType: asset.mimeType,
        reminder,
        sourceFilename: asset.sourceFilename,
        sourceScheme: asset.sourceScheme,
        sourceUri: asset.sourceUri,
        tagLabels,
        width: asset.width,
      })),
    );

    return {
      failedAssets,
      importedAssetIds: importableAssets.map((asset) => asset.assetId),
      importedCaptureIds,
    };
  }
}

function normalizeReminder(reminder: ImportReminderDraft | null) {
  if (!reminder) {
    return null;
  }

  const parsed = importReminderDraftSchema.parse(reminder);
  const dueAt = new Date(`${parsed.localDate}T${parsed.localTime}:00`).getTime();

  if (!Number.isFinite(dueAt)) {
    throw new Error('Reminder date and time could not be parsed.');
  }

  return {
    dueAt,
    localDate: parsed.localDate,
    localTime: parsed.localTime,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };
}

function parseSharedTags(input: string) {
  return [...new Set(input.split(/[,\n]/).map(normalizeTagLabel).filter(Boolean))];
}
