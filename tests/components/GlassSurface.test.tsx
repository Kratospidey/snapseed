import { render, screen } from '@testing-library/react-native';

import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';

describe('GlassSurface', () => {
  it('renders children with fallback styling when blur is disabled', () => {
    render(
      <GlassSurface useBlur={false}>
        <AppText>Glass content</AppText>
      </GlassSurface>,
    );

    expect(screen.getByText('Glass content')).toBeTruthy();
  });
});
