import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { AppText } from './AppText';
import { TactilePressable } from './TactilePressable';

type AppChipProps = {
  disabled?: boolean;
  label: string;
  leftAccessory?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  testID?: string;
};

export function AppChip({
  disabled = false,
  label,
  leftAccessory,
  onPress,
  selected = false,
  testID,
}: AppChipProps) {
  return (
    <TactilePressable
      accessibilityRole="button"
      disabled={disabled}
      intensity={selected ? 'strong' : 'soft'}
      onPress={onPress}
      shadowMode="none"
      style={[
        styles.base,
        selected ? styles.selected : null,
        disabled ? styles.disabled : null,
      ]}
      testID={testID}
    >
      {selected ? <View pointerEvents="none" style={styles.selectedHighlight} /> : null}
      {leftAccessory ? <View style={styles.accessory}>{leftAccessory}</View> : null}
      <AppText
        color={selected ? colors.chipSelectedText : colors.chipUnselectedText}
        style={styles.label}
        variant="caption"
      >
        {label}
      </AppText>
    </TactilePressable>
  );
}

const styles = StyleSheet.create({
  accessory: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  base: {
    alignItems: 'center',
    backgroundColor: colors.chipUnselectedBackground,
    borderColor: colors.chipBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '700',
  },
  selectedHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    height: 1,
    left: spacing.sm,
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    borderRadius: radii.pill,
  },
  selected: {
    backgroundColor: colors.chipSelectedBackground,
    borderColor: colors.chipSelectedBorder,
  },
});
