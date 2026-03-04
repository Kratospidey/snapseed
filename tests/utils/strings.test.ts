import { CAPTURE_NOTE_MAX_LENGTH } from '@/constants/limits';
import { getSourceScheme, normalizeNote, normalizeTagLabel } from '@/utils/strings';

describe('strings utilities', () => {
  it('normalizes tag labels to lowercase canonical form without stripping emoji', () => {
    expect(normalizeTagLabel('  Study   Notes  ')).toBe('study notes');
    expect(normalizeTagLabel('  🧾 Receipts  ')).toBe('🧾 receipts');
  });

  it('normalizes notes by trimming and enforcing the MVP max length', () => {
    expect(normalizeNote('   ')).toBeNull();
    expect(normalizeNote('  hello there  ')).toBe('hello there');
    expect(normalizeNote('a'.repeat(CAPTURE_NOTE_MAX_LENGTH + 20))).toHaveLength(CAPTURE_NOTE_MAX_LENGTH);
  });

  it('detects supported source URI schemes', () => {
    expect(getSourceScheme('content://media/external/images/1')).toBe('content');
    expect(getSourceScheme('file:///tmp/capture.png')).toBe('file');
    expect(getSourceScheme('ph://abc')).toBe('ph');
    expect(getSourceScheme('https://example.com/capture.png')).toBe('unknown');
  });
});
