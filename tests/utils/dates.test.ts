import { parseLocalDateBoundaryMs } from '@/utils/dates';

describe('date boundaries', () => {
  it('returns start-of-day and end-of-day local timestamps', () => {
    expect(parseLocalDateBoundaryMs('2026-03-05', 'start')).toBe(
      new Date('2026-03-05T00:00:00.000').getTime(),
    );
    expect(parseLocalDateBoundaryMs('2026-03-05', 'end')).toBe(
      new Date('2026-03-05T23:59:59.999').getTime(),
    );
  });

  it('returns null for invalid date strings', () => {
    expect(parseLocalDateBoundaryMs('2026/03/05', 'start')).toBeNull();
    expect(parseLocalDateBoundaryMs('', 'end')).toBeNull();
    expect(parseLocalDateBoundaryMs('not-a-date', 'end')).toBeNull();
  });
});
