import type { PropsWithChildren } from 'react';
import { StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { AppText } from './AppText';
import { TactilePressable } from './TactilePressable';

type AppButtonProps = PropsWithChildren<{
  accessibilityRole?: PressableProps['accessibilityRole'];
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  tone?: 'danger' | 'primary' | 'secondary';
}>;

export function AppButton({
  accessibilityRole = 'button',
  children,
  disabled = false,
  onPress,
  style,
  testID,
  tone = 'primary',
}: AppButtonProps) {
  return (
    <TactilePressable
      accessibilityRole={accessibilityRole}
      disabled={disabled}
      intensity={tone === 'primary' ? 'strong' : 'soft'}
      onPress={onPress}
      style={[
        styles.base,
        toneStyles[tone],
        disabled ? styles.disabled : null,
        style,
      ]}
      testID={testID}
    >
      {typeof children === 'string' ? (
        <AppText color={tone === 'secondary' ? colors.textPrimary : colors.surface} style={styles.label} variant="label">
          {children}
        </AppText>
      ) : (
        children
      )}
    </TactilePressable>
  );
}

const toneStyles = StyleSheet.create({
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accentStrong,
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '700',
  },
});
