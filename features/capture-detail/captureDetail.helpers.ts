import { getSourceScheme } from '@/utils/strings';

type OpenOriginalDecision =
  | {
      allowed: false;
      message: string;
      title: string;
    }
  | {
      allowed: true;
      sourceUri: string;
    };

export function getOpenOriginalDecision(input: {
  isMissing: boolean;
  sourceUri: string | null | undefined;
}): OpenOriginalDecision {
  if (input.isMissing) {
    return {
      allowed: false,
      message: 'This Capture is in graveyard state until the original is relinked.',
      title: 'Original unavailable',
    };
  }

  const sourceUri = input.sourceUri?.trim();

  if (!sourceUri) {
    return {
      allowed: false,
      message: 'This Capture does not have a usable source reference yet.',
      title: 'Original unavailable',
    };
  }

  const sourceScheme = getSourceScheme(sourceUri);

  if (sourceScheme === 'ph') {
    return {
      allowed: false,
      message: 'iPhone photo-library references cannot be opened directly. Use the fullscreen preview instead.',
      title: 'Unable to open original',
    };
  }

  if (sourceScheme === 'unknown') {
    return {
      allowed: false,
      message: 'The original source reference is not supported on this device.',
      title: 'Unable to open original',
    };
  }

  return {
    allowed: true,
    sourceUri,
  };
}

export function formatCaptureFileSize(fileSize: number | null) {
  if (!fileSize) {
    return 'Unknown';
  }

  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

export function getCapturePreviewHeight(input: {
  previewWidth: number;
  sourceHeight: number | null;
  sourceWidth: number | null;
  viewportHeight: number;
}) {
  const safeWidth = input.sourceWidth && input.sourceWidth > 0 ? input.sourceWidth : null;
  const safeHeight = input.sourceHeight && input.sourceHeight > 0 ? input.sourceHeight : null;

  if (!safeWidth || !safeHeight) {
    return Math.round(Math.max(220, Math.min(input.viewportHeight * 0.36, 300)));
  }

  const naturalHeight = input.previewWidth * (safeHeight / safeWidth);
  return Math.round(Math.max(220, Math.min(naturalHeight, input.viewportHeight * 0.42, 360)));
}

export function splitTagDraft(value: string) {
  return value
    .split(/[,\n]/)
    .map((label) => label.trim())
    .filter(Boolean);
}
