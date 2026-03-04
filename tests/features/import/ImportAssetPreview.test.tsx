import { fireEvent, render, screen } from '@testing-library/react-native';

import { ImportAssetPreview } from '@/features/import/components/ImportAssetPreview';

describe('ImportAssetPreview', () => {
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
});
