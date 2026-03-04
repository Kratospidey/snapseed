const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
};

const mockImportService = {
  createDraftAsset: jest.fn(),
};

const mockMediaGateway = {
  getPermissionState: jest.fn(),
  loadPhotoAssetsPage: jest.fn(),
  openLimitedAccessPicker: jest.fn(),
  requestPermission: jest.fn(),
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

jest.mock('@/modules/media/media.gateway', () => ({
  MediaGateway: jest.fn(() => mockMediaGateway),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { routes } from '@/constants/routes';
import { useImportDraftStore } from '@/features/import/importDraft.store';
import { ImportPickerScreen } from '@/features/import/screens/ImportPickerScreen';
import { createImportDraftAsset, createMediaPickerAsset } from '@/tests/support/fixtures';

const grantedPermission = {
  accessPrivileges: 'all',
  canAskAgain: true,
  expires: 'never',
  granted: true,
  status: 'granted',
} as const;

const deniedPermission = {
  accessPrivileges: 'none',
  canAskAgain: true,
  expires: 'never',
  granted: false,
  status: 'denied',
} as const;

describe('ImportPickerScreen', () => {
  beforeEach(() => {
    mockImportService.createDraftAsset.mockReset();
    mockMediaGateway.getPermissionState.mockReset();
    mockMediaGateway.loadPhotoAssetsPage.mockReset();
    mockMediaGateway.openLimitedAccessPicker.mockReset();
    mockMediaGateway.requestPermission.mockReset();
    mockRouter.back.mockReset();
    mockRouter.push.mockReset();
    useImportDraftStore.getState().clearDraft();
  });

  it('loads permission once and renders preview images for granted media access', async () => {
    const asset = createMediaPickerAsset();

    mockMediaGateway.getPermissionState.mockResolvedValue(grantedPermission);
    mockMediaGateway.loadPhotoAssetsPage.mockResolvedValue({
      assets: [asset],
      endCursor: null,
      hasNextPage: false,
      totalCount: 1,
    });

    render(<ImportPickerScreen />);

    await waitFor(() => expect(screen.getByTestId('picker-preview-image-asset-1')).toBeTruthy());

    expect(mockMediaGateway.getPermissionState).toHaveBeenCalledTimes(1);
    expect(mockMediaGateway.loadPhotoAssetsPage).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('picker-preview-image-asset-1').props.source).toEqual({ uri: asset.previewUri });
  });

  it('requests permission once and loads assets after access is granted', async () => {
    const asset = createMediaPickerAsset();

    mockMediaGateway.getPermissionState.mockResolvedValue(deniedPermission);
    mockMediaGateway.requestPermission.mockResolvedValue(grantedPermission);
    mockMediaGateway.loadPhotoAssetsPage.mockResolvedValue({
      assets: [asset],
      endCursor: null,
      hasNextPage: false,
      totalCount: 1,
    });

    render(<ImportPickerScreen />);

    await waitFor(() => expect(screen.getByText('Allow Photo Access')).toBeTruthy());

    fireEvent.press(screen.getByText('Allow Photo Access'));

    await waitFor(() => expect(mockMediaGateway.requestPermission).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockMediaGateway.loadPhotoAssetsPage).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('picker-preview-image-asset-1')).toBeTruthy());
  });

  it('selects an asset once and pushes the review route without recursive churn', async () => {
    const pickerAsset = createMediaPickerAsset();
    const draftAsset = createImportDraftAsset({ assetId: pickerAsset.assetId });

    mockMediaGateway.getPermissionState.mockResolvedValue(grantedPermission);
    mockMediaGateway.loadPhotoAssetsPage.mockResolvedValue({
      assets: [pickerAsset],
      endCursor: null,
      hasNextPage: false,
      totalCount: 1,
    });
    mockImportService.createDraftAsset.mockResolvedValue(draftAsset);

    render(<ImportPickerScreen />);

    await waitFor(() => expect(screen.getByTestId('picker-asset-tile-asset-1')).toBeTruthy());

    fireEvent.press(screen.getByTestId('picker-asset-tile-asset-1'));

    await waitFor(() => expect(mockImportService.createDraftAsset).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useImportDraftStore.getState().selectedAssetIds).toEqual(['asset-1']));

    fireEvent.press(screen.getByTestId('import-picker-review-button'));

    expect(mockRouter.push).toHaveBeenCalledWith(routes.importReview);
  });

  it('ignores rapid repeated presses for the same asset while draft creation is resolving', async () => {
    const pickerAsset = createMediaPickerAsset();
    const draftAsset = createImportDraftAsset({ assetId: pickerAsset.assetId });

    let resolveDraftAsset: ((asset: typeof draftAsset) => void) | null = null;

    mockMediaGateway.getPermissionState.mockResolvedValue(grantedPermission);
    mockMediaGateway.loadPhotoAssetsPage.mockResolvedValue({
      assets: [pickerAsset],
      endCursor: null,
      hasNextPage: false,
      totalCount: 1,
    });
    mockImportService.createDraftAsset.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDraftAsset = resolve;
        }),
    );

    render(<ImportPickerScreen />);

    await waitFor(() => expect(screen.getByTestId('picker-asset-tile-asset-1')).toBeTruthy());

    fireEvent.press(screen.getByTestId('picker-asset-tile-asset-1'));
    fireEvent.press(screen.getByTestId('picker-asset-tile-asset-1'));

    expect(mockImportService.createDraftAsset).toHaveBeenCalledTimes(1);

    expect(resolveDraftAsset).toBeTruthy();
    resolveDraftAsset!(draftAsset);

    await waitFor(() => expect(useImportDraftStore.getState().selectedAssetIds).toEqual(['asset-1']));
  });

  it('shows a visible fallback when the media library cannot provide a preview uri', async () => {
    const asset = createMediaPickerAsset({ previewUri: null });

    mockMediaGateway.getPermissionState.mockResolvedValue(grantedPermission);
    mockMediaGateway.loadPhotoAssetsPage.mockResolvedValue({
      assets: [asset],
      endCursor: null,
      hasNextPage: false,
      totalCount: 1,
    });

    render(<ImportPickerScreen />);

    await waitFor(() => expect(screen.getByTestId('picker-preview-fallback-asset-1')).toBeTruthy());
    expect(screen.getByText('Preview unavailable')).toBeTruthy();
    expect(mockMediaGateway.getPermissionState).toHaveBeenCalledTimes(1);
    expect(mockMediaGateway.loadPhotoAssetsPage).toHaveBeenCalledTimes(1);
  });

  it('shows a visible fallback when a thumbnail uri exists but fails to render', async () => {
    const asset = createMediaPickerAsset();

    mockMediaGateway.getPermissionState.mockResolvedValue(grantedPermission);
    mockMediaGateway.loadPhotoAssetsPage.mockResolvedValue({
      assets: [asset],
      endCursor: null,
      hasNextPage: false,
      totalCount: 1,
    });

    render(<ImportPickerScreen />);

    await waitFor(() => expect(screen.getByTestId('picker-preview-image-asset-1')).toBeTruthy());

    fireEvent(screen.getByTestId('picker-preview-image-asset-1'), 'error');

    await waitFor(() => expect(screen.getByTestId('picker-preview-fallback-asset-1')).toBeTruthy());
    expect(screen.getByText('Preview unavailable')).toBeTruthy();
  });
});
