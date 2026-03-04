import { ScrollView, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import type { LibrarySortDescriptor } from '@/features/library/types';
import type { LibrarySortOption } from '@/modules/captures/capture.types';
import { colors, spacing } from '@/theme';

type LibrarySortControlsProps = {
  onChange: (value: LibrarySortOption) => void;
  options: LibrarySortDescriptor[];
  selected: LibrarySortOption;
};

export function LibrarySortControls({ onChange, options, selected }: LibrarySortControlsProps) {
  return (
    <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>
      {options.map((option) => {
        const isSelected = option.value === selected;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isSelected ? styles.chipSelected : undefined]}
          >
            <AppText
              color={isSelected ? colors.surface : colors.textMuted}
              style={styles.chipLabel}
              variant="caption"
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipLabel: {
    fontWeight: '700',
  },
  chipSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
});
