import { render, screen } from '@testing-library/react-native';

import { LibraryGridCard } from '@/features/library/components/LibraryGridCard';
import { LibraryListRow } from '@/features/library/components/LibraryListRow';

import { createLibraryCapture } from '@/tests/support/fixtures';

describe('Library preview safety', () => {
  it('renders list rows safely for unresolved ph:// sources', () => {
    const item = createLibraryCapture({
      mediaAssetId: null,
      sourceScheme: 'ph',
      sourceUri: 'ph://asset-library-id',
    });

    render(<LibraryListRow item={item} onPress={jest.fn()} />);

    expect(screen.getByText('Preview unavailable')).toBeTruthy();
  });

  it('renders grid cards safely for unresolved ph:// sources', () => {
    const item = createLibraryCapture({
      mediaAssetId: null,
      sourceScheme: 'ph',
      sourceUri: 'ph://asset-library-id',
    });

    render(<LibraryGridCard item={item} onPress={jest.fn()} />);

    expect(screen.getByText('Preview unavailable')).toBeTruthy();
  });
});
