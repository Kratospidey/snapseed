import type { SQLiteDatabase } from 'expo-sqlite';

import { CaptureRepository } from '@/modules/captures/capture.repository';
import type { ImportDuplicateCandidateRecord } from '@/modules/captures/capture.types';
import type { ResolvedMediaAsset } from '@/modules/media/media.types';

import type { ImportDuplicateConfidence, ImportDuplicateMatch } from './import.types';

export class DuplicateService {
  private readonly captureRepository: CaptureRepository;

  constructor(db: SQLiteDatabase) {
    this.captureRepository = new CaptureRepository(db);
  }

  async findMatchesForAsset(asset: ResolvedMediaAsset) {
    const candidates = await this.captureRepository.findPotentialDuplicates({
      duplicateGroupHint: asset.duplicateGroupHint ?? null,
      mediaAssetId: asset.mediaAssetId ?? null,
      sourceFilename: asset.sourceFilename ?? null,
      sourceUri: asset.sourceUri,
    });

    return candidates
      .map((candidate) => toDuplicateMatch(asset, candidate))
      .filter((match): match is ImportDuplicateMatch => Boolean(match))
      .sort(compareDuplicateMatches)
      .slice(0, 4);
  }
}

function compareDuplicateMatches(left: ImportDuplicateMatch, right: ImportDuplicateMatch) {
  return confidenceScore(right.confidence) - confidenceScore(left.confidence) || right.importedAt - left.importedAt;
}

function confidenceScore(confidence: ImportDuplicateConfidence) {
  switch (confidence) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
    default:
      return 1;
  }
}

function toDuplicateMatch(
  asset: ResolvedMediaAsset,
  candidate: ImportDuplicateCandidateRecord,
): ImportDuplicateMatch | null {
  const checks: Array<{ confidence: ImportDuplicateConfidence; reason: string }> = [];

  if (asset.mediaAssetId && candidate.mediaAssetId === asset.mediaAssetId) {
    checks.push({ confidence: 'high', reason: 'Exact media-library asset match.' });
  }

  if (candidate.sourceUri === asset.sourceUri) {
    checks.push({ confidence: 'high', reason: 'Exact stored source reference match.' });
  }

  if (asset.duplicateGroupHint && candidate.duplicateGroupHint === asset.duplicateGroupHint) {
    checks.push({ confidence: 'medium', reason: 'Matching filename, dimensions, and capture-time bucket.' });
  }

  if (
    asset.sourceFilename &&
    candidate.sourceFilename &&
    asset.sourceFilename === candidate.sourceFilename &&
    asset.width &&
    asset.height &&
    candidate.width === asset.width &&
    candidate.height === asset.height &&
    isNearTimestamp(asset.capturedAt, candidate.capturedAt, 120_000)
  ) {
    checks.push({ confidence: 'medium', reason: 'Same filename, size, and near-identical capture time.' });
  }

  if (
    getFilenameStem(asset.sourceFilename) &&
    getFilenameStem(asset.sourceFilename) === getFilenameStem(candidate.sourceFilename) &&
    isNearTimestamp(asset.capturedAt, candidate.capturedAt, 300_000)
  ) {
    checks.push({ confidence: 'low', reason: 'Similar filename stem and close capture time.' });
  }

  if (checks.length === 0) {
    return null;
  }

  const best = checks.sort((left, right) => confidenceScore(right.confidence) - confidenceScore(left.confidence))[0];

  return {
    capturedAt: candidate.capturedAt,
    captureId: candidate.id,
    confidence: best.confidence,
    importedAt: candidate.importedAt,
    reason: best.reason,
    sourceFilename: candidate.sourceFilename,
  };
}

function getFilenameStem(filename: string | null) {
  if (!filename) {
    return '';
  }

  return filename.toLocaleLowerCase().replace(/\.[^/.]+$/, '').trim();
}

function isNearTimestamp(left: number | null, right: number | null, thresholdMs: number) {
  if (!left || !right) {
    return false;
  }

  return Math.abs(left - right) <= thresholdMs;
}
