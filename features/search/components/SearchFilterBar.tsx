import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DateTimeFieldPicker } from '@/components/reminders/DateTimeFieldPicker';
import { AppText } from '@/components/primitives/AppText';
import type { SearchFilters } from '@/modules/search/search.types';
import { colors, spacing } from '@/theme';

type SearchFilterBarProps = {
  filters: SearchFilters;
  onClearDateRange: () => void;
  onSetDateFrom: (value: string) => void;
  onSetDateTo: (value: string) => void;
  onToggleFilter: (filterName: 'graveyard' | 'hasReminder' | 'unsorted') => void;
};

export function SearchFilterBar({
  filters,
  onClearDateRange,
  onSetDateFrom,
  onSetDateTo,
  onToggleFilter,
}: SearchFilterBarProps) {
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(Boolean(filters.dateFrom || filters.dateTo));

  return (
    <View style={styles.container}>
      <View style={styles.chipRow}>
        <FilterChip active={filters.unsorted} label="Unsorted" onPress={() => onToggleFilter('unsorted')} />
        <FilterChip active={filters.hasReminder} label="Reminder" onPress={() => onToggleFilter('hasReminder')} />
        <FilterChip active={filters.graveyard} label="Graveyard" onPress={() => onToggleFilter('graveyard')} />
        <FilterChip
          active={Boolean(filters.dateFrom || filters.dateTo)}
          label="Date range"
          onPress={() => setIsDateRangeOpen((current) => !current)}
        />
      </View>

      {isDateRangeOpen ? (
        <View style={styles.dateRangePanel}>
          <View style={styles.dateRangeRow}>
            <View style={styles.dateField}>
              <DateTimeFieldPicker
                label="From"
                mode="date"
                onChangeValue={onSetDateFrom}
                placeholder="Start date"
                testID="search-date-from-field"
                value={filters.dateFrom}
              />
            </View>
            <View style={styles.dateField}>
              <DateTimeFieldPicker
                label="To"
                mode="date"
                onChangeValue={onSetDateTo}
                placeholder="End date"
                testID="search-date-to-field"
                value={filters.dateTo}
              />
            </View>
          </View>

          <Pressable accessibilityRole="button" onPress={onClearDateRange} style={styles.clearButton}>
            <AppText variant="caption">Clear range</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
      testID={`search-filter-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <AppText color={active ? colors.surface : colors.text} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  clearButton: {
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  container: {
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  dateRangePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
