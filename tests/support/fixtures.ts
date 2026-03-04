import type { CaptureDetailRecord, ImportDuplicateCandidateRecord, LibraryCaptureRecord } from '@/modules/captures/capture.types';
import type { ImportDraftAsset, ImportDuplicateMatch } from '@/modules/import/import.types';
import type { MediaPickerAsset } from '@/modules/media/media.types';

export function createCaptureDetail(overrides: Partial<CaptureDetailRecord> = {}): CaptureDetailRecord {
  return {
    capturedAt: 1_710_000_000_000,
    duplicateGroupHint: null,
    fileSize: 524_288,
    height: 1920,
    id: 'capture-1',
    importedAt: 1_710_000_100_000,
    isMissing: false,
    note: 'Keep this reference',
    reminderDueAt: null,
    reminderLocalDate: null,
    reminderLocalTime: null,
    reminderTimezone: null,
    sourceFilename: 'IMG_1234.PNG',
    sourceUri: 'file:///capture.png',
    tags: ['study'],
    width: 1080,
    ...overrides,
  };
}

export function createImportDraftAsset(overrides: Partial<ImportDraftAsset> = {}): ImportDraftAsset {
  return {
    assetId: 'asset-1',
    capturedAt: 1_710_000_000_000,
    duplicateGroupHint: 'img_1234.png|1080|1920|28500000',
    duplicateMatches: [],
    fileSize: null,
    filename: 'IMG_1234.PNG',
    height: 1920,
    isLikelyScreenshot: true,
    mediaAssetId: 'media-1',
    mimeType: 'image/png',
    previewUri: 'file:///preview.png',
    sourceFilename: 'IMG_1234.PNG',
    sourceScheme: 'file',
    sourceUri: 'file:///preview.png',
    width: 1080,
    ...overrides,
  };
}

export function createMediaPickerAsset(overrides: Partial<MediaPickerAsset> = {}): MediaPickerAsset {
  return {
    assetId: 'asset-1',
    capturedAt: 1_710_000_000_000,
    filename: 'IMG_1234.PNG',
    height: 1920,
    isLikelyScreenshot: true,
    previewUri: 'file:///picker-preview.png',
    width: 1080,
    ...overrides,
  };
}

export function createDuplicateCandidate(
  overrides: Partial<ImportDuplicateCandidateRecord> = {},
): ImportDuplicateCandidateRecord {
  return {
    capturedAt: 1_710_000_000_000,
    duplicateGroupHint: 'img_1234.png|1080|1920|28500000',
    height: 1920,
    id: 'capture-1',
    importedAt: 1_710_000_100_000,
    mediaAssetId: 'media-1',
    sourceFilename: 'IMG_1234.PNG',
    sourceUri: 'file:///preview.png',
    width: 1080,
    ...overrides,
  };
}

export function createDuplicateMatch(overrides: Partial<ImportDuplicateMatch> = {}): ImportDuplicateMatch {
  return {
    capturedAt: 1_710_000_000_000,
    captureId: 'capture-1',
    confidence: 'medium',
    importedAt: 1_710_000_100_000,
    reason: 'Matching filename, dimensions, and capture-time bucket.',
    sourceFilename: 'IMG_1234.PNG',
    ...overrides,
  };
}

export function createLibraryCapture(overrides: Partial<LibraryCaptureRecord> = {}): LibraryCaptureRecord {
  return {
    capturedAt: 1_710_000_000_000,
    duplicateGroupHint: null,
    id: 'capture-1',
    importedAt: 1_710_000_100_000,
    isMissing: 0,
    note: 'A useful note',
    reminderDueAt: null,
    sourceFilename: 'IMG_1234.PNG',
    sourceUri: 'file:///capture.png',
    tagCount: 1,
    tagLabels: ['study'],
    ...overrides,
  };
}
