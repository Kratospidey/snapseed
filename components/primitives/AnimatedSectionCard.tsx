import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { TactilePressable } from './TactilePressable';

type AnimatedSectionCardProps = PropsWithChildren<{
  accessibilityRole?: 'button';
  delayMs?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function AnimatedSectionCard({
  accessibilityRole = 'button',
  children,
  delayMs: _delayMs = 0,
  onPress,
  style,
  testID,
}: AnimatedSectionCardProps) {
  return (
    <TactilePressable
      accessibilityRole={accessibilityRole}
      intensity="soft"
      onPress={onPress}
      shadowMode="none"
      style={style}
      testID={testID}
    >
      <View>{children}</View>
    </TactilePressable>
  );
}
