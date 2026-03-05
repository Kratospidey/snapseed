const mockRouter = {
  push: jest.fn(),
};

const mockTagService = {
  createTag: jest.fn(),
  deleteTag: jest.fn(),
  listAll: jest.fn(),
  renameOrMergeTag: jest.fn(),
};

jest.mock('expo-router', () => {
  const React = require('react');

  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => callback(), [callback]);
    },
    useRouter: () => mockRouter,
  };
});

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock('@/modules/tags/tag.service', () => ({
  TagService: jest.fn(() => mockTagService),
}));

import { render, screen, waitFor } from '@testing-library/react-native';

import { TagsScreen } from '@/features/tags/screens/TagsScreen';

describe('TagsScreen', () => {
  beforeEach(() => {
    for (const mockFn of Object.values(mockTagService)) {
      mockFn.mockReset();
    }
    mockRouter.push.mockReset();
  });

  it('renders tag rows and management copy', async () => {
    mockTagService.listAll.mockResolvedValue([
      {
        canonicalLabel: 'study',
        captureCount: 3,
        createdAt: 1,
        id: 'tag-1',
        label: 'study',
        lastUsedAt: 1_710_000_000_000,
        updatedAt: 1,
      },
    ]);

    render(<TagsScreen />);

    await waitFor(() => expect(screen.getByText('Canonical library')).toBeTruthy());

    expect(screen.getByText('#study')).toBeTruthy();
    expect(screen.getByText('3 Captures')).toBeTruthy();
    expect(screen.getByTestId('tag-edit-tag-1')).toBeTruthy();
    expect(screen.getByTestId('tag-delete-tag-1')).toBeTruthy();
  });
});
