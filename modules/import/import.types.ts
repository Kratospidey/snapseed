import type { ResolvedMediaAsset } from '@/modules/media/media.types';

export type ImportDuplicateConfidence = 'high' | 'low' | 'medium';

export type ImportDuplicateMatch = {
  capturedAt: number | null;
  captureId: string;
  confidence: ImportDuplicateConfidence;
  importedAt: number;
  reason: string;
  sourceFilename: string | null;
};

export type ImportDraftAsset = ResolvedMediaAsset & {
  duplicateMatches: ImportDuplicateMatch[];
};

export type ImportReminderDraft = {
  localDate: string;
  localTime: string;
};

export type ImportBatchFailure = {
  assetId: string;
  filename: string | null;
  reason: string;
};

export type ImportBatchResult = {
  failedAssets: ImportBatchFailure[];
  importedAssetIds: string[];
  importedCaptureIds: string[];
};
