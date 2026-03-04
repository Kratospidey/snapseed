import type { LibraryCaptureRecord } from '@/modules/captures/capture.types';
import type { RecentSearchEntry, SearchFilters } from '@/modules/search/search.types';

export type SearchScreenData = {
  filters: SearchFilters;
  hasActiveFilters: boolean;
  isIdle: boolean;
  isLoading: boolean;
  queryText: string;
  recentSearches: RecentSearchEntry[];
  results: LibraryCaptureRecord[];
};
