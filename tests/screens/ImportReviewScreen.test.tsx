import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockRouter = {
  back: jest.fn(),
  dismissTo: jest.fn(),
};

const mockImportService = {
  importDraftSelection: jest.fn(),
  refreshDuplicateMatches: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock('@/modules/import/import.service', () => ({
  ImportService: jest.fn(() => mockImportService),
}));

import { useImportDraftStore } from '@/features/import/importDraft.store';
import { ImportReviewScreen } from '@/features/import/screens/ImportReviewScreen';

import { createDuplicateMatch, createImportDraftAsset } from '@/tests/support/fixtures';

describe('ImportReviewScreen', () => {
  beforeEach(() => {
    mockImportService.importDraftSelection.mockReset();
    mockImportService.refreshDuplicateMatches.mockReset();
    mockRouter.back.mockReset();
    mockRouter.dismissTo.mockReset();
    useImportDraftStore.getState().clearDraft();
  });

  it('renders selected assets and duplicate warning state', async () => {
    const duplicateMatch = createDuplicateMatch({ confidence: 'high' });
    const asset = createImportDraftAsset({ duplicateMatches: [duplicateMatch] });

    useImportDraftStore.getState().upsertSelectedAsset(asset);
    useImportDraftStore.getState().setSharedTagsInput('study');
    mockImportService.refreshDuplicateMatches.mockResolvedValue({
      [asset.assetId]: [duplicateMatch],
    });

    render(<ImportReviewScreen />);

    await waitFor(() => expect(screen.getByText('1 ready to import')).toBeTruthy());
    await waitFor(() => expect(mockImportService.refreshDuplicateMatches).toHaveBeenCalledTimes(1));

    expect(screen.getByText(/may already exist in the Library/i)).toBeTruthy();
    expect(screen.getByText('Tap to preview')).toBeTruthy();
    expect(screen.getByDisplayValue('study')).toBeTruthy();
    expect(screen.getByText('Tags are normalized to lowercase canonical form. Emoji tags are supported.')).toBeTruthy();
  });

  it('uses picker-based reminder inputs and clears them cleanly', async () => {
    const asset = createImportDraftAsset();

    useImportDraftStore.getState().upsertSelectedAsset(asset);
    mockImportService.refreshDuplicateMatches.mockResolvedValue({
      [asset.assetId]: [],
    });

    render(<ImportReviewScreen />);

    fireEvent.press(screen.getByText('Add reminder'));

    fireEvent.press(screen.getByTestId('shared-reminder-date-field'));
    fireEvent(screen.getByTestId('shared-reminder-date-field-picker'), 'onChange', { type: 'set' }, new Date('2026-03-20T12:00:00'));
    if (screen.queryByText('Confirm')) {
      fireEvent.press(screen.getByText('Confirm'));
    }

    fireEvent.press(screen.getByTestId('shared-reminder-time-field'));
    fireEvent(screen.getByTestId('shared-reminder-time-field-picker'), 'onChange', { type: 'set' }, new Date('1970-01-01T09:45:00'));
    if (screen.queryByText('Confirm')) {
      fireEvent.press(screen.getByText('Confirm'));
    }

    await waitFor(() =>
      expect(useImportDraftStore.getState().sharedReminder).toEqual({
        localDate: '2026-03-20',
        localTime: '09:45',
      }),
    );

    fireEvent.press(screen.getByText('Clear'));

    await waitFor(() => expect(useImportDraftStore.getState().sharedReminder).toBeNull());
  });

  it('opens and closes the fullscreen import preview', async () => {
    const asset = createImportDraftAsset();

    useImportDraftStore.getState().upsertSelectedAsset(asset);
    mockImportService.refreshDuplicateMatches.mockResolvedValue({
      [asset.assetId]: [],
    });

    render(<ImportReviewScreen />);

    await waitFor(() => expect(screen.getByLabelText(`Preview ${asset.filename}`)).toBeTruthy());

    fireEvent.press(screen.getByLabelText(`Preview ${asset.filename}`));

    await waitFor(() => expect(screen.getByTestId('review-preview-modal-image')).toBeTruthy());

    fireEvent.press(screen.getByTestId('review-preview-close-button'));

    await waitFor(() => expect(screen.queryByTestId('review-preview-modal-image')).toBeNull());
  });

  it('shows an explicit fallback when a selected asset preview is unavailable', async () => {
    const asset = createImportDraftAsset({
      previewUri: null,
      sourceScheme: 'unknown',
      sourceUri: '',
    });

    useImportDraftStore.getState().upsertSelectedAsset(asset);
    mockImportService.refreshDuplicateMatches.mockResolvedValue({
      [asset.assetId]: [],
    });

    render(<ImportReviewScreen />);

    await waitFor(() => expect(screen.getByTestId(`review-preview-fallback-${asset.assetId}`)).toBeTruthy());
    expect(screen.getByText('Preview unavailable for this Capture')).toBeTruthy();
  });

  it('ignores stale duplicate refresh results when the selected asset set changes', async () => {
    const assetOne = createImportDraftAsset({ assetId: 'asset-1', filename: 'IMG_0001.PNG' });
    const assetTwo = createImportDraftAsset({ assetId: 'asset-2', filename: 'IMG_0002.PNG', previewUri: 'file:///preview-2.png' });
    const olderMatch = createDuplicateMatch({ captureId: 'capture-old', confidence: 'high', reason: 'stale result' });
    const latestMatch = createDuplicateMatch({ captureId: 'capture-latest', confidence: 'low', reason: 'latest result' });

    let resolveFirst: ((value: Record<string, Array<typeof olderMatch>>) => void) | null = null;
    let resolveSecond: ((value: Record<string, Array<typeof latestMatch>>) => void) | null = null;

    mockImportService.refreshDuplicateMatches
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    useImportDraftStore.getState().upsertSelectedAsset(assetOne);

    render(<ImportReviewScreen />);

    await waitFor(() => expect(mockImportService.refreshDuplicateMatches).toHaveBeenCalledTimes(1));

    useImportDraftStore.getState().upsertSelectedAsset(assetTwo);

    await waitFor(() => expect(mockImportService.refreshDuplicateMatches).toHaveBeenCalledTimes(2));

    expect(resolveSecond).toBeTruthy();
    resolveSecond!({
      [assetOne.assetId]: [],
      [assetTwo.assetId]: [latestMatch],
    });

    await waitFor(
      () =>
        expect(useImportDraftStore.getState().selectedAssets[assetTwo.assetId].duplicateMatches).toEqual([latestMatch]),
    );

    expect(resolveFirst).toBeTruthy();
    resolveFirst!({
      [assetOne.assetId]: [olderMatch],
    });

    await waitFor(() =>
      expect(useImportDraftStore.getState().selectedAssets[assetOne.assetId].duplicateMatches).toEqual([]),
    );
  });
});
