import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { TactilePressable } from './TactilePressable';

type AppIconButtonProps = {
  accessibilityRole?: 'button';
  children: ReactNode;
  onPress: () => void;
  size?: 'md' | 'sm';
  testID?: string;
};

export function AppIconButton({
  accessibilityRole = 'button',
  children,
  onPress,
  size = 'md',
  testID,
}: AppIconButtonProps) {
  return (
    <TactilePressable
      accessibilityRole={accessibilityRole}
      intensity="soft"
      onPress={onPress}
      style={[styles.base, sizeStyles[size]]}
      testID={testID}
    >
      {children}
    </TactilePressable>
  );
}

const sizeStyles = StyleSheet.create({
  md: {
    height: 42,
    width: 42,
  },
  sm: {
    height: 36,
    width: 36,
  },
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    padding: spacing.xs,
  },
});
