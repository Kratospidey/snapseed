import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { routes } from '@/constants/routes';
import type { LibraryCaptureRecord } from '@/modules/captures/capture.types';
import { SearchService } from '@/modules/search/search.service';
import {
  EMPTY_SEARCH_FILTERS,
  hasActiveSearchFilters,
  normalizeSearchFilters,
  type RecentSearchEntry,
  type SearchFilters,
} from '@/modules/search/search.types';
import { normalizeSearchQuery } from '@/utils/strings';

export function useSearchScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const searchService = useMemo(() => new SearchService(db), [db]);
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_SEARCH_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([]);
  const [results, setResults] = useState<LibraryCaptureRecord[]>([]);
  const deferredQuery = useDeferredValue(queryText);
  const latestRequestKeyRef = useRef<string | null>(null);

  const normalizedQuery = normalizeSearchQuery(queryText);
  const hasActiveFilters = hasActiveSearchFilters(filters);
  const isIdle = !normalizedQuery && !hasActiveFilters;

  const loadRecentSearches = useCallback(async () => {
    const items = await searchService.listRecentSearches();
    setRecentSearches(items);
  }, [searchService]);

  useFocusEffect(
    useCallback(() => {
      void loadRecentSearches();
    }, [loadRecentSearches]),
  );

  useEffect(() => {
    const effectiveQuery = normalizeSearchQuery(deferredQuery);
    const normalizedFilters = normalizeSearchFilters(filters);

    if (!effectiveQuery && !hasActiveSearchFilters(normalizedFilters)) {
      setResults([]);
      setIsLoading(false);
      latestRequestKeyRef.current = null;
      return;
    }

    const requestKey = `${effectiveQuery}::${JSON.stringify(normalizedFilters)}`;
    latestRequestKeyRef.current = requestKey;
    setIsLoading(true);
    let isMounted = true;

    void searchService
      .searchCaptures({
        filters: normalizedFilters,
        limit: 120,
        queryText: effectiveQuery,
      })
      .then((nextResults) => {
        if (!isMounted || latestRequestKeyRef.current !== requestKey) {
          return;
        }

        setResults(nextResults);
      })
      .finally(() => {
        if (isMounted && latestRequestKeyRef.current === requestKey) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [deferredQuery, filters, searchService]);

  const commitRecentSearch = useCallback(
    async (override?: { filters?: SearchFilters; queryText?: string }) => {
      const query = override?.queryText ?? queryText;
      const nextFilters = normalizeSearchFilters(override?.filters ?? filters);
      const normalized = normalizeSearchQuery(query);

      if (!normalized) {
        return;
      }

      await searchService.registerRecentSearch(query, searchService.serializeFilterSnapshot(nextFilters));
      await loadRecentSearches();
    },
    [filters, loadRecentSearches, queryText, searchService],
  );

  const openCapture = useCallback(
    (captureId: string) => {
      if (normalizedQuery) {
        void commitRecentSearch();
      }

      router.push(routes.captureDetail(captureId));
    },
    [commitRecentSearch, normalizedQuery, router],
  );

  return {
    applyRecentSearch: (entry: RecentSearchEntry) => {
      setQueryText(entry.queryText);
      setFilters(searchService.parseFilterSnapshot(entry.filterSnapshot));
      void commitRecentSearch({
        filters: searchService.parseFilterSnapshot(entry.filterSnapshot),
        queryText: entry.queryText,
      });
    },
    clearDateRange: () => setFilters((current) => ({ ...current, dateFrom: null, dateTo: null })),
    clearQuery: () => setQueryText(''),
    commitSearch: () => void commitRecentSearch(),
    filters,
    hasActiveFilters,
    isIdle,
    isLoading,
    openCapture,
    parseFilterSnapshot: (snapshot: string | null) => searchService.parseFilterSnapshot(snapshot),
    queryText,
    recentSearches,
    results,
    setDateFrom: (value: string) => setFilters((current) => ({ ...current, dateFrom: value })),
    setDateTo: (value: string) => setFilters((current) => ({ ...current, dateTo: value })),
    setQueryText,
    toggleFilter: (filterName: 'graveyard' | 'hasReminder' | 'unsorted') =>
      setFilters((current) => ({ ...current, [filterName]: !current[filterName] })),
  };
}
