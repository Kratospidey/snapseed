import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { LibraryListRow } from '@/features/library/components/LibraryListRow';
import type { LibraryCaptureRecord } from '@/modules/captures/capture.types';
import { colors, spacing } from '@/theme';

import { RecentSearchList } from '../components/RecentSearchList';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { SearchInput } from '../components/SearchInput';
import { useSearchScreen } from '../hooks/useSearchScreen';

export function SearchScreen() {
  const {
    applyRecentSearch,
    clearDateRange,
    clearQuery,
    commitSearch,
    filters,
    hasActiveFilters,
    isIdle,
    isLoading,
    openCapture,
    parseFilterSnapshot,
    queryText,
    recentSearches,
    results,
    setDateFrom,
    setDateTo,
    setQueryText,
    toggleFilter,
  } = useSearchScreen();
  const renderResultItem = useCallback(
    ({ item }: { item: LibraryCaptureRecord }) => <LibraryListRow item={item} onPressCapture={openCapture} />,
    [openCapture],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        ListEmptyComponent={
          isIdle ? (
            recentSearches.length > 0 ? (
              <RecentSearchList
                onPressItem={applyRecentSearch}
                parseFilterSnapshot={parseFilterSnapshot}
                recentSearches={recentSearches}
              />
            ) : (
              <GlassSurface style={styles.emptyState} useBlur={false}>
                <AppText variant="title">Search your Captures</AppText>
                <AppText color={colors.textMuted}>
                  Search tags and note text instantly, then narrow results with smart filters like reminders,
                  unsorted, graveyard, or a date range.
                </AppText>
              </GlassSurface>
            )
          ) : (
            <GlassSurface style={styles.emptyState} useBlur={false}>
              <AppText variant="title">{isLoading ? 'Searching…' : 'No Captures match'}</AppText>
              <AppText color={colors.textMuted}>
                {isLoading
                  ? 'Looking across tags and note text.'
                  : 'Try a different query or relax one of the active filters.'}
              </AppText>
            </GlassSurface>
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText variant="eyebrow">SnapBrain</AppText>
              <AppText variant="display">Search</AppText>
              <AppText color={colors.textMuted}>
                Live search across tags and notes with fast filters for reminders, unsorted, graveyard, and date range.
              </AppText>
            </View>

            <SearchInput
              onChangeText={setQueryText}
              onClear={clearQuery}
              onSubmit={commitSearch}
              value={queryText}
            />

            <SearchFilterBar
              filters={filters}
              onClearDateRange={clearDateRange}
              onSetDateFrom={setDateFrom}
              onSetDateTo={setDateTo}
              onToggleFilter={toggleFilter}
            />

            {!isIdle ? (
              <View style={styles.resultsHeader}>
                <AppText variant="title">Results</AppText>
                <AppText color={colors.textMuted} variant="caption">
                  {results.length} visible Capture{results.length === 1 ? '' : 's'}
                  {hasActiveFilters ? ' • filters active' : ''}
                </AppText>
              </View>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.content}
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderResultItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  resultsHeader: {
    gap: spacing.xs,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
