import { ScrollView, StyleSheet } from 'react-native';

import { AppChip } from '@/components/primitives/AppChip';
import type { LibrarySortDescriptor } from '@/features/library/types';
import type { LibrarySortOption } from '@/modules/captures/capture.types';
import { spacing } from '@/theme';

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
          <AppChip key={option.value} label={option.label} onPress={() => onChange(option.value)} selected={isSelected} />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
});
