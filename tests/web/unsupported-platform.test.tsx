import { render, screen } from '@testing-library/react-native';

import { UnsupportedPlatformScreen } from '@/components/feedback/UnsupportedPlatformScreen';

describe('UnsupportedPlatformScreen', () => {
  it('renders the intentional web fallback copy', () => {
    render(<UnsupportedPlatformScreen title="Mobile-only for now" />);

    expect(screen.getByText('Mobile-only for now')).toBeTruthy();
    expect(screen.getByText(/currently built for Android and iPhone/i)).toBeTruthy();
  });
});
