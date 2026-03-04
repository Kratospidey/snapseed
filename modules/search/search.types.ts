import { z } from 'zod';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const searchFiltersSchema = z.object({
  dateFrom: dateStringSchema.nullable(),
  dateTo: dateStringSchema.nullable(),
  graveyard: z.boolean(),
  hasReminder: z.boolean(),
  unsorted: z.boolean(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export type SearchTimestampRange = {
  from: number | null;
  to: number | null;
};

export type RecentSearchEntry = {
  filterSnapshot: string | null;
  id: string;
  lastUsedAt: number;
  queryText: string;
  useCount: number;
};

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  dateFrom: null,
  dateTo: null,
  graveyard: false,
  hasReminder: false,
  unsorted: false,
};

export function normalizeSearchFilters(filters: Partial<SearchFilters> | null | undefined): SearchFilters {
  const parsed = searchFiltersSchema.safeParse({
    dateFrom: normalizeDateString(filters?.dateFrom),
    dateTo: normalizeDateString(filters?.dateTo),
    graveyard: filters?.graveyard ?? false,
    hasReminder: filters?.hasReminder ?? false,
    unsorted: filters?.unsorted ?? false,
  });

  if (!parsed.success) {
    return EMPTY_SEARCH_FILTERS;
  }

  const normalized = parsed.data;

  if (normalized.dateFrom && normalized.dateTo && normalized.dateFrom > normalized.dateTo) {
    return {
      ...normalized,
      dateFrom: normalized.dateTo,
      dateTo: normalized.dateFrom,
    };
  }

  return normalized;
}

export function hasActiveSearchFilters(filters: SearchFilters) {
  return Boolean(
    filters.unsorted || filters.hasReminder || filters.graveyard || filters.dateFrom || filters.dateTo,
  );
}

export function serializeSearchFilters(filters: SearchFilters) {
  const normalized = normalizeSearchFilters(filters);

  if (!hasActiveSearchFilters(normalized)) {
    return null;
  }

  return JSON.stringify(normalized);
}

export function parseSearchFilterSnapshot(snapshot: string | null | undefined) {
  if (!snapshot) {
    return EMPTY_SEARCH_FILTERS;
  }

  try {
    return normalizeSearchFilters(JSON.parse(snapshot) as Partial<SearchFilters>);
  } catch {
    return EMPTY_SEARCH_FILTERS;
  }
}

export function resolveSearchTimestampRange(filters: SearchFilters): SearchTimestampRange {
  const normalized = normalizeSearchFilters(filters);

  return {
    from: normalized.dateFrom ? parseDateBoundary(normalized.dateFrom, 'start') : null,
    to: normalized.dateTo ? parseDateBoundary(normalized.dateTo, 'end') : null,
  };
}

function normalizeDateString(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function parseDateBoundary(value: string, boundary: 'start' | 'end') {
  const timeSuffix = boundary === 'start' ? 'T00:00:00.000' : 'T23:59:59.999';
  const parsed = new Date(`${value}${timeSuffix}`);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : null;
}
