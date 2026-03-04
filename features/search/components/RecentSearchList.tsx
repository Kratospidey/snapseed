import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import type { RecentSearchEntry, SearchFilters } from '@/modules/search/search.types';
import { colors, spacing } from '@/theme';

type RecentSearchListProps = {
  onPressItem: (entry: RecentSearchEntry) => void;
  parseFilterSnapshot: (snapshot: string | null) => SearchFilters;
  recentSearches: RecentSearchEntry[];
};

export function RecentSearchList({
  onPressItem,
  parseFilterSnapshot,
  recentSearches,
}: RecentSearchListProps) {
  return (
    <View style={styles.section}>
      <AppText variant="title">Recent searches</AppText>
      <View style={styles.list}>
        {recentSearches.map((entry) => {
          const filters = parseFilterSnapshot(entry.filterSnapshot);
          const filterLabels = [
            filters.unsorted ? 'Unsorted' : null,
            filters.hasReminder ? 'Reminder' : null,
            filters.graveyard ? 'Graveyard' : null,
            filters.dateFrom || filters.dateTo ? 'Date range' : null,
          ].filter(Boolean);

          return (
            <Pressable
              accessibilityRole="button"
              key={entry.id}
              onPress={() => onPressItem(entry)}
              style={styles.item}
            >
              <View style={styles.itemCopy}>
                <AppText variant="action">{entry.queryText}</AppText>
                {filterLabels.length > 0 ? (
                  <AppText color={colors.textMuted} variant="caption">
                    {filterLabels.join(' • ')}
                  </AppText>
                ) : null}
              </View>
              <AppText color={colors.textMuted} variant="caption">
                {formatLastUsed(entry.lastUsedAt)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function formatLastUsed(lastUsedAt: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(lastUsedAt);
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
});
