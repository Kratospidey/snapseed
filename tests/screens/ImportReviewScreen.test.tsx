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

import { render, screen, waitFor } from '@testing-library/react-native';

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
    await waitFor(() => expect(mockImportService.refreshDuplicateMatches).toHaveBeenCalled());

    expect(screen.getByText(/may already exist in the Library/i)).toBeTruthy();
    expect(screen.getByDisplayValue('study')).toBeTruthy();
    expect(screen.getByText('Tags are normalized to lowercase canonical form. Emoji tags are supported.')).toBeTruthy();
  });
});
