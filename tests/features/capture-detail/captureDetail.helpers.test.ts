import { formatCaptureFileSize, getOpenOriginalDecision } from '@/features/capture-detail/captureDetail.helpers';

describe('capture detail helpers', () => {
  it('blocks missing or unsupported originals', () => {
    expect(getOpenOriginalDecision({ isMissing: true, sourceUri: 'file:///capture.png' })).toMatchObject({
      allowed: false,
      title: 'Original unavailable',
    });
    expect(getOpenOriginalDecision({ isMissing: false, sourceUri: '' })).toMatchObject({
      allowed: false,
      title: 'Original unavailable',
    });
    expect(getOpenOriginalDecision({ isMissing: false, sourceUri: 'https://example.com/capture.png' })).toMatchObject({
      allowed: false,
      title: 'Unable to open original',
    });
  });

  it('allows native device URI schemes and formats nullable file sizes honestly', () => {
    expect(getOpenOriginalDecision({ isMissing: false, sourceUri: 'content://image/1' })).toEqual({
      allowed: true,
      sourceUri: 'content://image/1',
    });
    expect(getOpenOriginalDecision({ isMissing: false, sourceUri: 'file:///capture.png' })).toEqual({
      allowed: true,
      sourceUri: 'file:///capture.png',
    });
    expect(getOpenOriginalDecision({ isMissing: false, sourceUri: 'ph://asset-id' })).toEqual({
      allowed: true,
      sourceUri: 'ph://asset-id',
    });

    expect(formatCaptureFileSize(null)).toBe('Unknown');
    expect(formatCaptureFileSize(512)).toBe('512 B');
  });
});
