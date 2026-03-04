const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

const mockCaptureService = {
  clearReminder: jest.fn(),
  deleteCaptureMetadata: jest.fn(),
  getCaptureDetail: jest.fn(),
  recordCaptureViewed: jest.fn(),
  updateNote: jest.fn(),
  updateReminder: jest.fn(),
  updateTags: jest.fn(),
};

let mockSearchParams = { captureId: 'capture-1' };

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

import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { CaptureDetailScreen } from '@/features/capture-detail/screens/CaptureDetailScreen';

import { createCaptureDetail } from '@/tests/support/fixtures';

describe('CaptureDetailScreen', () => {
  beforeEach(() => {
    for (const mockFn of Object.values(mockCaptureService)) {
      mockFn.mockReset();
    }
    mockRouter.back.mockReset();
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockSearchParams = { captureId: 'capture-1' };
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders core sections and shows Unknown for nullable file size', async () => {
    mockCaptureService.getCaptureDetail.mockResolvedValue(
      createCaptureDetail({ duplicateGroupHint: 'stale-hint', fileSize: null, reminderDueAt: 1_710_000_200_000 }),
    );

    render(<CaptureDetailScreen />);

    await waitFor(() => expect(screen.getByText('Detail')).toBeTruthy());

    expect(screen.getByText('Open original')).toBeTruthy();
    expect(screen.getByText('Metadata')).toBeTruthy();
    expect(screen.getByText('Unknown')).toBeTruthy();
    expect(screen.queryByText(/duplicate hint/i)).toBeNull();
  });

  it('renders the not-found state when no Capture exists', async () => {
    mockCaptureService.getCaptureDetail.mockResolvedValue(null);

    render(<CaptureDetailScreen />);

    await waitFor(() => expect(screen.getByText('Capture not found')).toBeTruthy());
  });

  it('keeps detail content mounted during post-save refreshes', async () => {
    mockCaptureService.getCaptureDetail
      .mockResolvedValueOnce(createCaptureDetail({ note: 'Initial note' }))
      .mockResolvedValueOnce(createCaptureDetail({ note: 'Updated note' }));
    mockCaptureService.updateNote.mockResolvedValue(undefined);

    render(<CaptureDetailScreen />);

    await waitFor(() => expect(screen.getByText('Detail')).toBeTruthy());

    fireEvent.press(screen.getByText('Edit'));
    fireEvent.changeText(screen.getByPlaceholderText('Add a note for this Capture'), 'Updated note');
    fireEvent.press(screen.getByText('Save note'));

    await waitFor(() => expect(mockCaptureService.updateNote).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Loading Capture metadata...')).toBeNull();
    expect(screen.getByText('Open original')).toBeTruthy();
  });
});
