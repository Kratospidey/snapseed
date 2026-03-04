import * as MediaLibrary from 'expo-media-library';

import type { CaptureDetailRecord, LibraryCaptureRecord } from '@/modules/captures/capture.types';
import { getSourceScheme } from '@/utils/strings';

type CapturePreviewSource = Pick<LibraryCaptureRecord, 'mediaAssetId' | 'sourceScheme' | 'sourceUri'>;

const previewUriCache = new Map<string, CapturePreviewResolution>();

export type CapturePreviewResolution =
  | {
      kind: 'renderable';
      renderer: 'expo-image';
      uri: string;
    }
  | {
      kind: 'unrenderable';
      reason: 'missing-uri' | 'ph-uri-unresolved' | 'unsupported-uri';
    };

export function getInitialCapturePreviewSource(input: CapturePreviewSource): CapturePreviewResolution {
  return toPreviewResolution(normalizePreviewUri(input.sourceUri));
}

export function shouldRefreshPreviewSource(input: CapturePreviewSource) {
  return Boolean(input.mediaAssetId);
}

export async function resolveCapturePreviewSource(input: CapturePreviewSource): Promise<CapturePreviewResolution> {
  const fallback = getInitialCapturePreviewSource(input);

  if (!input.mediaAssetId) {
    return fallback;
  }

  const cached = previewUriCache.get(input.mediaAssetId);

  if (cached?.kind === 'renderable') {
    return cached;
  }

  try {
    const asset = await MediaLibrary.getAssetInfoAsync(input.mediaAssetId, {
      shouldDownloadFromNetwork: false,
    });
    const candidates = [normalizePreviewUri(asset.localUri), normalizePreviewUri(asset.uri), normalizePreviewUri(input.sourceUri)];

    for (const candidate of candidates) {
      const nextSource = toPreviewResolution(candidate);

      if (nextSource.kind === 'renderable') {
        previewUriCache.set(input.mediaAssetId, nextSource);
        return nextSource;
      }
    }

    return fallback.kind === 'renderable'
      ? fallback
      : {
          kind: 'unrenderable',
          reason: 'ph-uri-unresolved',
        };
  } catch {
    return fallback;
  }
}

export function clearPreviewUriCache() {
  previewUriCache.clear();
}

function normalizePreviewUri(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function toPreviewResolution(uri: string | null): CapturePreviewResolution {
  if (!uri) {
    return {
      kind: 'unrenderable',
      reason: 'missing-uri',
    };
  }

  const scheme = getSourceScheme(uri);

  if (scheme === 'ph') {
    return {
      kind: 'unrenderable',
      reason: 'ph-uri-unresolved',
    };
  }

  if (scheme === 'file' || scheme === 'content' || uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:')) {
    return {
      kind: 'renderable',
      renderer: 'expo-image',
      uri,
    };
  }

  return {
    kind: 'unrenderable',
    reason: 'unsupported-uri',
  };
}

export type CapturePreviewRecord = Pick<
  CaptureDetailRecord | LibraryCaptureRecord,
  'mediaAssetId' | 'sourceScheme' | 'sourceUri'
>;
