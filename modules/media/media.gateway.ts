import * as MediaLibrary from 'expo-media-library';

import { getSourceScheme } from '@/utils/strings';

import type {
  MediaAssetResolutionFailure,
  MediaPermissionState,
  MediaPickerAsset,
  MediaPickerPage,
  ResolvedMediaAsset,
} from './media.types';

const SCREENSHOT_FILENAME_PATTERN =
  /(screenshot|screen[\s._-]?shot|screen[\s._-]?capture|screenrecord|capture)/i;

export class MediaGateway {
  async getPermissionState(): Promise<MediaPermissionState> {
    return MediaLibrary.getPermissionsAsync(false, ['photo']);
  }

  async openLimitedAccessPicker() {
    try {
      await MediaLibrary.presentPermissionsPickerAsync(['photo']);
    } catch {
      // Ignore on unsupported platforms and keep the current access mode.
    }
  }

  async requestPermission() {
    return MediaLibrary.requestPermissionsAsync(false, ['photo']);
  }

  async loadPhotoAssetsPage(params: { after?: string | null; first?: number } = {}): Promise<MediaPickerPage> {
    const page = await MediaLibrary.getAssetsAsync({
      after: params.after ?? undefined,
      first: params.first ?? 60,
      mediaType: MediaLibrary.MediaType.photo,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });

    return {
      assets: page.assets.map((asset) => ({
        assetId: asset.id,
        capturedAt: normalizeTimestamp(asset.creationTime),
        filename: asset.filename ?? null,
        height: normalizeDimension(asset.height),
        isLikelyScreenshot: isLikelyScreenshot(asset.filename),
        previewUri: asset.uri,
        width: normalizeDimension(asset.width),
      })),
      endCursor: page.endCursor || null,
      hasNextPage: page.hasNextPage,
      totalCount: page.totalCount,
    };
  }

  async resolveAssetForImport(asset: MediaPickerAsset): Promise<ResolvedMediaAsset> {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset.assetId, { shouldDownloadFromNetwork: false });
      const sourceUri = info.localUri ?? info.uri ?? asset.previewUri;

      return {
        assetId: asset.assetId,
        capturedAt: normalizeTimestamp(info.creationTime) ?? asset.capturedAt,
        duplicateGroupHint: buildDuplicateGroupHint({
          capturedAt: normalizeTimestamp(info.creationTime) ?? asset.capturedAt,
          filename: info.filename ?? asset.filename,
          height: normalizeDimension(info.height) ?? asset.height,
          width: normalizeDimension(info.width) ?? asset.width,
        }),
        fileSize: null,
        filename: info.filename ?? asset.filename,
        height: normalizeDimension(info.height) ?? asset.height,
        isLikelyScreenshot: asset.isLikelyScreenshot,
        mediaAssetId: asset.assetId,
        mimeType: null,
        previewUri: sourceUri,
        sourceFilename: info.filename ?? asset.filename,
        sourceScheme: getSourceScheme(sourceUri),
        sourceUri,
        width: normalizeDimension(info.width) ?? asset.width,
      };
    } catch {
      if (!asset.previewUri) {
        throw new Error('This media item could not be resolved from the device library.');
      }

      return {
        assetId: asset.assetId,
        capturedAt: asset.capturedAt,
        duplicateGroupHint: buildDuplicateGroupHint({
          capturedAt: asset.capturedAt,
          filename: asset.filename,
          height: asset.height,
          width: asset.width,
        }),
        fileSize: null,
        filename: asset.filename,
        height: asset.height,
        isLikelyScreenshot: asset.isLikelyScreenshot,
        mediaAssetId: asset.assetId,
        mimeType: null,
        previewUri: asset.previewUri,
        sourceFilename: asset.filename,
        sourceScheme: getSourceScheme(asset.previewUri),
        sourceUri: asset.previewUri,
        width: asset.width,
      };
    }
  }

  async revalidateResolvedAsset(asset: ResolvedMediaAsset): Promise<
    | {
        asset: ResolvedMediaAsset;
        status: 'ok';
      }
    | {
        failure: MediaAssetResolutionFailure;
        status: 'failed';
      }
  > {
    if (!asset.mediaAssetId) {
      if (asset.sourceUri) {
        return { asset, status: 'ok' };
      }

      return {
        failure: {
          assetId: asset.assetId,
          filename: asset.filename,
          reason: 'The selected image no longer has a usable source reference.',
        },
        status: 'failed',
      };
    }

    try {
      const refreshed = await MediaLibrary.getAssetInfoAsync(asset.mediaAssetId, {
        shouldDownloadFromNetwork: false,
      });
      const sourceUri = refreshed.localUri ?? refreshed.uri ?? asset.sourceUri;

      return {
        asset: {
          ...asset,
          capturedAt: normalizeTimestamp(refreshed.creationTime) ?? asset.capturedAt,
          duplicateGroupHint: buildDuplicateGroupHint({
            capturedAt: normalizeTimestamp(refreshed.creationTime) ?? asset.capturedAt,
            filename: refreshed.filename ?? asset.filename,
            height: normalizeDimension(refreshed.height) ?? asset.height,
            width: normalizeDimension(refreshed.width) ?? asset.width,
          }),
          filename: refreshed.filename ?? asset.filename,
          height: normalizeDimension(refreshed.height) ?? asset.height,
          previewUri: sourceUri,
          sourceFilename: refreshed.filename ?? asset.sourceFilename,
          sourceScheme: getSourceScheme(sourceUri),
          sourceUri,
          width: normalizeDimension(refreshed.width) ?? asset.width,
        },
        status: 'ok',
      };
    } catch {
      if (asset.sourceUri) {
        return { asset, status: 'ok' };
      }

      return {
        failure: {
          assetId: asset.assetId,
          filename: asset.filename,
          reason: 'The selected image is no longer available in the device library.',
        },
        status: 'failed',
      };
    }
  }
}

function buildDuplicateGroupHint(input: {
  capturedAt: number | null;
  filename: string | null;
  height: number | null;
  width: number | null;
}) {
  const normalizedFilename = input.filename?.trim().toLocaleLowerCase() ?? '';
  const minuteBucket = input.capturedAt ? Math.floor(input.capturedAt / 60000) : 'unknown';

  if (!normalizedFilename && !input.width && !input.height && minuteBucket === 'unknown') {
    return null;
  }

  return [normalizedFilename, input.width ?? 'unknown', input.height ?? 'unknown', minuteBucket].join('|');
}

function isLikelyScreenshot(filename: string | null | undefined) {
  return Boolean(filename && SCREENSHOT_FILENAME_PATTERN.test(filename));
}

function normalizeDimension(value: number | null | undefined) {
  return typeof value === 'number' && value > 0 ? Math.round(value) : null;
}

function normalizeTimestamp(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}
