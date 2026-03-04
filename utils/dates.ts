export function nowMs() {
  return Date.now();
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseLocalDateBoundaryMs(
  value: string | null | undefined,
  boundary: 'start' | 'end',
) {
  const normalized = value?.trim();

  if (!normalized || !DATE_ONLY_PATTERN.test(normalized)) {
    return null;
  }

  const suffix = boundary === 'start' ? 'T00:00:00.000' : 'T23:59:59.999';
  const parsed = new Date(`${normalized}${suffix}`);

  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : null;
}
