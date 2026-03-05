import { StyleSheet, View } from 'react-native';

import { AppChip } from '@/components/primitives/AppChip';
import type { LibraryViewMode } from '@/types/domain';
import { colors, radii, spacing } from '@/theme';

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
    <AppChip label={label} onPress={onPress} selected={isActive} />
  );
}

const styles = StyleSheet.create({
  toggleShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSoft,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xxs,
  },
});
