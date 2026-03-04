import { CAPTURE_NOTE_MAX_LENGTH } from '@/constants/limits';

export function buildFtsQuery(normalizedQuery: string) {
  return normalizedQuery
    .split(' ')
    .filter(Boolean)
    .map((term) => `${escapeFtsTerm(term)}*`)
    .join(' ');
}

export function getSourceScheme(sourceUri: string) {
  const normalizedUri = sourceUri.trim().toLocaleLowerCase();

  if (normalizedUri.startsWith('content://')) {
    return 'content' as const;
  }

  if (normalizedUri.startsWith('file://')) {
    return 'file' as const;
  }

  if (normalizedUri.startsWith('ph://')) {
    return 'ph' as const;
  }

  return 'unknown' as const;
}

export function normalizeNote(note: string | null | undefined) {
  const trimmed = note?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, CAPTURE_NOTE_MAX_LENGTH);
}

export function normalizeSearchQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeTagLabel(input: string) {
  const collapsedWhitespace = input.normalize('NFKC').trim().replace(/\s+/g, ' ');

  return collapsedWhitespace.toLocaleLowerCase();
}

export function stripNilStrings(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function escapeFtsTerm(term: string) {
  return term.replace(/["']/g, '');
}
