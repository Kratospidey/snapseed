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

export function splitTagDraft(value: string) {
  return value
    .split(/[,\n]/)
    .map((label) => label.trim())
    .filter(Boolean);
}
