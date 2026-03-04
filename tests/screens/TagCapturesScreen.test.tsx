const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
};

const mockCaptureService = {
  getCapturesForTag: jest.fn(),
};

const mockTagService = {
  getById: jest.fn(),
};

let mockSearchParams = { tagId: 'tag-1' };

jest.mock('expo-router', () => {
  const React = require('react');

  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => callback(), [callback]);
    },
    useLocalSearchParams: () => mockSearchParams,
    useRouter: () => mockRouter,
  };
});

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock('@/modules/captures/capture.service', () => ({
  CaptureService: jest.fn(() => mockCaptureService),
}));

jest.mock('@/modules/tags/tag.service', () => ({
  TagService: jest.fn(() => mockTagService),
}));

import { render, screen, waitFor } from '@testing-library/react-native';

import { TagCapturesScreen } from '@/features/tags/screens/TagCapturesScreen';

import { createLibraryCapture } from '@/tests/support/fixtures';

describe('TagCapturesScreen', () => {
  beforeEach(() => {
    mockCaptureService.getCapturesForTag.mockReset();
    mockTagService.getById.mockReset();
    mockRouter.back.mockReset();
    mockRouter.push.mockReset();
    mockSearchParams = { tagId: 'tag-1' };
  });

  it('renders the empty state for a valid tag', async () => {
    mockTagService.getById.mockResolvedValueOnce({
      captureCount: 0,
      id: 'tag-1',
      label: 'study',
      lastUsedAt: null,
    });
    mockCaptureService.getCapturesForTag.mockResolvedValueOnce([]);

    render(<TagCapturesScreen />);
    await waitFor(() => expect(screen.getByText('No linked Captures')).toBeTruthy());
  });

  it('renders a populated state for linked Captures', async () => {
    mockTagService.getById.mockResolvedValueOnce({
      captureCount: 1,
      id: 'tag-1',
      label: 'study',
      lastUsedAt: 1_710_000_000_000,
    });
    mockCaptureService.getCapturesForTag.mockResolvedValueOnce([createLibraryCapture()]);

    render(<TagCapturesScreen />);

    await waitFor(() => expect(screen.getByText('A useful note')).toBeTruthy());
  });
});
