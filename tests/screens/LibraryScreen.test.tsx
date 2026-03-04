const mockUseLibraryScreen = jest.fn();

jest.mock('@/features/library/hooks/useLibraryScreen', () => ({
  useLibraryScreen: (params: unknown) => mockUseLibraryScreen(params),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
}));

import { render, screen } from '@testing-library/react-native';

import { LibraryScreen } from '@/features/library/screens/LibraryScreen';

import { createLibraryCapture } from '@/tests/support/fixtures';

describe('LibraryScreen', () => {
  beforeEach(() => {
    mockUseLibraryScreen.mockReset();
  });

  it('renders the loading shell', () => {
    mockUseLibraryScreen.mockReturnValue({
      data: null,
      isLoading: true,
      isRefreshing: false,
      openCapture: jest.fn(),
      openImport: jest.fn(),
      openTagsLibrary: jest.fn(),
      refresh: jest.fn(),
      setSmartView: jest.fn(),
      setSort: jest.fn(),
      setViewMode: jest.fn(),
      sort: 'imported_desc',
      viewMode: 'grid',
    });

    render(<LibraryScreen />);

    expect(screen.getByText('Loading your Captures...')).toBeTruthy();
  });

  it('renders core sections for a populated library', () => {
    mockUseLibraryScreen.mockReturnValue({
      data: {
        activeTagCount: 1,
        feed: [createLibraryCapture({ duplicateGroupHint: 'stale-hint' })],
        graveyardCount: 0,
        reminderCount: 0,
        smartView: 'recent',
        topTags: [{ captureCount: 1, id: 'tag-1', label: 'study' }],
        totalCount: 1,
        unsortedCount: 0,
        viewMode: 'grid',
      },
      isLoading: false,
      isRefreshing: false,
      openCapture: jest.fn(),
      openImport: jest.fn(),
      openTagsLibrary: jest.fn(),
      refresh: jest.fn(),
      setSmartView: jest.fn(),
      setSort: jest.fn(),
      setViewMode: jest.fn(),
      sort: 'imported_desc',
      viewMode: 'grid',
    });

    render(<LibraryScreen />);

    expect(screen.getByText('Library')).toBeTruthy();
    expect(screen.getAllByText('Recently Added').length).toBeGreaterThan(0);
    expect(screen.queryByText(/duplicate hint/i)).toBeNull();
    expect(screen.queryByText(/similar/i)).toBeNull();
  });
});
