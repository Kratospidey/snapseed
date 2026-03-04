const mockUseSearchScreen = jest.fn();

jest.mock('@/features/search/hooks/useSearchScreen', () => ({
  useSearchScreen: () => mockUseSearchScreen(),
}));

import { fireEvent, render, screen } from '@testing-library/react-native';

import { SearchScreen } from '@/features/search/screens/SearchScreen';
import { EMPTY_SEARCH_FILTERS } from '@/modules/search/search.types';

import { createLibraryCapture } from '@/tests/support/fixtures';

describe('SearchScreen', () => {
  beforeEach(() => {
    mockUseSearchScreen.mockReset();
  });

  it('renders recent searches in the idle state', () => {
    const applyRecentSearch = jest.fn();
    mockUseSearchScreen.mockReturnValue({
      applyRecentSearch,
      clearDateRange: jest.fn(),
      clearQuery: jest.fn(),
      commitSearch: jest.fn(),
      filters: EMPTY_SEARCH_FILTERS,
      hasActiveFilters: false,
      isIdle: true,
      isLoading: false,
      openCapture: jest.fn(),
      parseFilterSnapshot: () => EMPTY_SEARCH_FILTERS,
      queryText: '',
      recentSearches: [
        {
          filterSnapshot: null,
          id: 'recent-1',
          lastUsedAt: 1_710_000_000_000,
          queryText: 'study',
          useCount: 3,
        },
      ],
      results: [],
      setDateFrom: jest.fn(),
      setDateTo: jest.fn(),
      setQueryText: jest.fn(),
      toggleFilter: jest.fn(),
    });

    render(<SearchScreen />);

    expect(screen.getByText('Recent searches')).toBeTruthy();
    fireEvent.press(screen.getByText('study'));
    expect(applyRecentSearch).toHaveBeenCalled();
  });

  it('renders list-style search results when a query is active', () => {
    const result = createLibraryCapture({ note: 'Needle note', tagLabels: ['study'] });
    const openCapture = jest.fn();
    mockUseSearchScreen.mockReturnValue({
      applyRecentSearch: jest.fn(),
      clearDateRange: jest.fn(),
      clearQuery: jest.fn(),
      commitSearch: jest.fn(),
      filters: EMPTY_SEARCH_FILTERS,
      hasActiveFilters: false,
      isIdle: false,
      isLoading: false,
      openCapture,
      parseFilterSnapshot: () => EMPTY_SEARCH_FILTERS,
      queryText: 'needle',
      recentSearches: [],
      results: [result],
      setDateFrom: jest.fn(),
      setDateTo: jest.fn(),
      setQueryText: jest.fn(),
      toggleFilter: jest.fn(),
    });

    render(<SearchScreen />);

    expect(screen.getByText('Results')).toBeTruthy();
    expect(screen.getByText('Needle note')).toBeTruthy();

    fireEvent.press(screen.getByText('Needle note'));
    expect(openCapture).toHaveBeenCalledWith(result.id);
  });
});
