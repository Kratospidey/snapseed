import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import type { LibraryViewMode } from '@/types/domain';
import { colors, spacing } from '@/theme';

type LibraryViewModeToggleProps = {
  onChange: (value: LibraryViewMode) => void;
  value: LibraryViewMode;
};

export function LibraryViewModeToggle({ onChange, value }: LibraryViewModeToggleProps) {
  return (
    <View style={styles.toggleShell}>
      <ToggleOption isActive={value === 'grid'} label="Grid" onPress={() => onChange('grid')} />
      <ToggleOption isActive={value === 'list'} label="List" onPress={() => onChange('list')} />
    </View>
  );
}

type ToggleOptionProps = {
  isActive: boolean;
  label: string;
  onPress: () => void;
};

function ToggleOption({ isActive, label, onPress }: ToggleOptionProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.option, isActive ? styles.optionActive : undefined]}>
      <AppText color={isActive ? colors.surface : colors.textMuted} style={styles.optionLabel} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionActive: {
    backgroundColor: colors.text,
  },
  optionLabel: {
    fontWeight: '700',
  },
  toggleShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: 4,
  },
});
