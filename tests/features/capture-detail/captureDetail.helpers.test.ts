import {
  formatCaptureFileSize,
  getCapturePreviewHeight,
  getOpenOriginalDecision,
} from '@/features/capture-detail/captureDetail.helpers';

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

  it('allows supported device URI schemes, blocks ph:// opens, and formats nullable file sizes honestly', () => {
    expect(getOpenOriginalDecision({ isMissing: false, sourceUri: 'content://image/1' })).toEqual({
      allowed: true,
      sourceUri: 'content://image/1',
    });
    expect(getOpenOriginalDecision({ isMissing: false, sourceUri: 'file:///capture.png' })).toEqual({
      allowed: true,
      sourceUri: 'file:///capture.png',
    });
    expect(getOpenOriginalDecision({ isMissing: false, sourceUri: 'ph://asset-id' })).toMatchObject({
      allowed: false,
      title: 'Unable to open original',
    });

    expect(formatCaptureFileSize(null)).toBe('Unknown');
    expect(formatCaptureFileSize(512)).toBe('512 B');
  });

  it('caps oversized screenshot previews to a balanced detail height', () => {
    expect(
      getCapturePreviewHeight({
        previewWidth: 360,
        sourceHeight: 1920,
        sourceWidth: 1080,
        viewportHeight: 844,
      }),
    ).toBeLessThan(361);
    expect(
      getCapturePreviewHeight({
        previewWidth: 360,
        sourceHeight: null,
        sourceWidth: null,
        viewportHeight: 844,
      }),
    ).toBeGreaterThanOrEqual(220);
  });
});
