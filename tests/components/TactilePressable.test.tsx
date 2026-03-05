import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppText } from '@/components/primitives/AppText';
import { TactilePressable } from '@/components/primitives/TactilePressable';

describe('TactilePressable', () => {
  it('renders children and forwards press events', () => {
    const onPress = jest.fn();

    render(
      <TactilePressable accessibilityRole="button" onPress={onPress}>
        <AppText>Tap me</AppText>
      </TactilePressable>,
    );

    fireEvent.press(screen.getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
