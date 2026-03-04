import type { PermissionResponse } from 'expo-media-library';

export type MediaPickerAsset = {
  assetId: string;
  capturedAt: number | null;
  filename: string | null;
  height: number | null;
  isLikelyScreenshot: boolean;
  previewUri: string | null;
  width: number | null;
};

export type ResolvedMediaAsset = {
  assetId: string;
  capturedAt: number | null;
  duplicateGroupHint: string | null;
  fileSize: number | null;
  filename: string | null;
  height: number | null;
  isLikelyScreenshot: boolean;
  mediaAssetId: string | null;
  mimeType: string | null;
  previewUri: string | null;
  sourceFilename: string | null;
  sourceScheme: 'content' | 'file' | 'ph' | 'unknown';
  sourceUri: string;
  width: number | null;
};

export type MediaAssetResolutionFailure = {
  assetId: string;
  filename: string | null;
  reason: string;
};

export type MediaPickerPage = {
  assets: MediaPickerAsset[];
  endCursor: string | null;
  hasNextPage: boolean;
  totalCount: number;
};

export type MediaPermissionState = PermissionResponse | null;
