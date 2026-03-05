import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, type ViewStyle } from 'react-native';

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

  it('can disable injected shadow styles', () => {
    render(
      <TactilePressable accessibilityRole="button" shadowMode="none" testID="chip-like">
        <AppText>Tap me</AppText>
      </TactilePressable>,
    );

    const pressable = screen.getByTestId('chip-like');
    const rawStyle = pressable.props.style as
      | ((state: { pressed: boolean }) => unknown)
      | ViewStyle
      | ViewStyle[]
      | undefined;
    const resolveStyle = (pressed: boolean) =>
      StyleSheet.flatten(
        typeof rawStyle === 'function' ? rawStyle({ pressed }) : rawStyle,
      ) as ViewStyle;

    const unpressedStyle = resolveStyle(false);
    expect(unpressedStyle?.elevation).toBeUndefined();
    expect(unpressedStyle?.shadowOpacity).toBeUndefined();
    expect(unpressedStyle?.shadowRadius).toBeUndefined();

    const pressedStyle = resolveStyle(true);
    expect(pressedStyle?.elevation).toBeUndefined();
    expect(pressedStyle?.shadowOpacity).toBeUndefined();
    expect(pressedStyle?.shadowRadius).toBeUndefined();
  });
});
