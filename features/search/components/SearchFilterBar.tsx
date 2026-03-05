import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DateTimeFieldPicker } from '@/components/reminders/DateTimeFieldPicker';
import { AppButton } from '@/components/primitives/AppButton';
import { AppChip } from '@/components/primitives/AppChip';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import type { SearchFilters } from '@/modules/search/search.types';
import { spacing } from '@/theme';

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
        <GlassSurface style={styles.dateRangePanel} useBlur={false} variant="card">
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

          <AppButton onPress={onClearDateRange} style={styles.clearButton} tone="secondary">
            <AppText variant="caption">Clear range</AppText>
          </AppButton>
        </GlassSurface>
      ) : null}
    </View>
  );
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <AppChip label={label} onPress={onPress} selected={active} testID={`search-filter-${label.toLowerCase().replace(/\s+/g, '-')}`} />;
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
  container: {
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  dateRangePanel: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
