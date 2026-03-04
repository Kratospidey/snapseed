const mockGetAssetInfoAsync = jest.fn();

jest.mock('expo-media-library', () => ({
  getAssetInfoAsync: (...args: unknown[]) => mockGetAssetInfoAsync(...args),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ImportAssetPreview } from '@/features/import/components/ImportAssetPreview';
import { clearPreviewUriCache } from '@/modules/media/media-preview';

describe('ImportAssetPreview', () => {
  beforeEach(() => {
    clearPreviewUriCache();
    mockGetAssetInfoAsync.mockReset();
  });

  it('renders an image when a preview uri exists', () => {
    render(<ImportAssetPreview imageTestID="import-preview-image" previewUri="file:///preview.png" />);

    expect(screen.getByTestId('import-preview-image').props.source).toEqual({ uri: 'file:///preview.png' });
  });

  it('renders a fallback when the preview uri is missing', () => {
    render(<ImportAssetPreview fallbackTestID="import-preview-fallback" previewUri={null} />);

    expect(screen.getByTestId('import-preview-fallback')).toBeTruthy();
    expect(screen.getByText('Preview unavailable')).toBeTruthy();
  });

  it('renders a fallback after an image load failure', () => {
    render(
      <ImportAssetPreview
        fallbackTestID="import-preview-fallback"
        imageTestID="import-preview-image"
        previewUri="file:///broken-preview.png"
      />,
    );

    fireEvent(screen.getByTestId('import-preview-image'), 'error');

    expect(screen.getByTestId('import-preview-fallback')).toBeTruthy();
    expect(screen.getByText('Preview unavailable')).toBeTruthy();
  });

  it('supports press interaction when configured', () => {
    const onPress = jest.fn();

    render(
      <ImportAssetPreview
        accessibilityLabel="Open import preview"
        onPress={onPress}
        pressable
        previewUri="file:///preview.png"
      />,
    );

    fireEvent.press(screen.getByLabelText('Open import preview'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('rehydrates ph:// preview sources through media asset info before rendering', async () => {
    mockGetAssetInfoAsync.mockResolvedValue({
      localUri: 'file:///resolved-preview.png',
      uri: 'ph://asset-1',
    });

    render(<ImportAssetPreview imageTestID="import-preview-image" mediaAssetId="asset-1" previewUri="ph://asset-1" />);

    await waitFor(() =>
      expect(screen.getByTestId('import-preview-image').props.source).toEqual({ uri: 'file:///resolved-preview.png' }),
    );
  });

  it('shows fallback when ph:// preview cannot be resolved to a renderable uri', async () => {
    mockGetAssetInfoAsync.mockResolvedValue({
      localUri: null,
      uri: 'ph://asset-1',
    });

    render(
      <ImportAssetPreview
        fallbackTestID="import-preview-fallback"
        mediaAssetId="asset-1"
        previewUri="ph://asset-1"
      />,
    );

    await waitFor(() => expect(screen.getByTestId('import-preview-fallback')).toBeTruthy());
    expect(screen.getByText('Preview unavailable')).toBeTruthy();
  });
});
