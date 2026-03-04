import type { CaptureSourceReference } from '@/modules/captures/capture.types';
import type { ResolvedMediaAsset } from '@/modules/media/media.types';

export type GraveyardScanResult = {
  markedMissing: number;
  recovered: number;
  runAt: number;
  scanned: number;
};

export type GraveyardVerifyResult = 'missing' | 'not-found' | 'ok';

export type GraveyardRelinkInput = {
  captureId: string;
  replacementAsset: ResolvedMediaAsset;
};

export type GraveyardCandidate = CaptureSourceReference;
