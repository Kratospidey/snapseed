import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';

import { AppButton } from '@/components/primitives/AppButton';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import type { LibrarySortOption } from '@/modules/captures/capture.types';
import { colors, radii, shadows, spacing } from '@/theme';

import { useLibraryScreen } from '../hooks/useLibraryScreen';
import type { LibraryFeedItem, LibrarySortDescriptor } from '../types';
import { LibraryGridCard } from '../components/LibraryGridCard';
import { LibraryListRow } from '../components/LibraryListRow';
import { LibrarySmartSections } from '../components/LibrarySmartSections';
import { LibrarySortControls } from '../components/LibrarySortControls';
import { LibraryViewModeToggle } from '../components/LibraryViewModeToggle';

const SORT_OPTIONS: LibrarySortDescriptor[] = [
  { label: 'Recently added', value: 'imported_desc' },
  { label: 'Oldest added', value: 'imported_asc' },
  { label: 'Recently captured', value: 'captured_desc' },
  { label: 'Oldest captured', value: 'captured_asc' },
  { label: 'Last viewed', value: 'last_viewed_desc' },
  { label: 'Reminder date', value: 'reminder_due_asc' },
];

export function LibraryScreen() {
  const { smartView } = useLocalSearchParams<{ smartView?: string }>();
  const {
    data,
    isLoading,
    isRefreshing,
    openCapture,
    openImport,
    openTagsLibrary,
    refresh,
    setSmartView,
    setSort,
    setViewMode,
    sort,
    viewMode,
  } = useLibraryScreen({
    smartViewParam: smartView,
  });

  const items = data?.feed ?? [];
  const renderGridItem = useCallback(
    ({ item }: { item: LibraryFeedItem }) => (
      <View style={styles.gridItem}>
        <LibraryGridCard item={item} onPressCapture={openCapture} />
      </View>
    ),
    [openCapture],
  );
  const renderListItem = useCallback(
    ({ item }: { item: LibraryFeedItem }) => <LibraryListRow item={item} onPressCapture={openCapture} />,
    [openCapture],
  );
  const handleChangeViewMode = useCallback(
    (nextMode: 'grid' | 'list') => {
      if (nextMode === viewMode) {
        return;
      }

      if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setViewMode(nextMode);
    },
    [setViewMode, viewMode],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading && !data ? (
        <View style={styles.loadingState}>
          <AppText variant="eyebrow">Library</AppText>
          <AppText variant="display">Loading your Captures...</AppText>
          <View style={styles.loadingGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={styles.loadingCard} />
            ))}
          </View>
        </View>
      ) : (
        <View key={`library-feed-${viewMode}`} style={styles.feedWrap}>
          <FlatList
            key={viewMode}
            ListEmptyComponent={<EmptyState onImport={openImport} smartViewLabel={resolveSmartViewLabel(data?.smartView)} />}
            ListHeaderComponent={
              <View style={styles.headerContent}>
                <View style={styles.heroRow}>
                  <View style={styles.heroCopy}>
                    <AppText variant="eyebrow">SnapBrain</AppText>
                    <AppText variant="display">Library</AppText>
                    <AppText color={colors.textMuted}>
                      Global, folderless browsing for every Capture in one place.
                    </AppText>
                  </View>
                  <LibraryViewModeToggle onChange={handleChangeViewMode} value={viewMode} />
                </View>

                <LibrarySmartSections
                  activeTagCount={data?.activeTagCount ?? 0}
                  graveyardCount={data?.graveyardCount ?? 0}
                  onOpenTags={openTagsLibrary}
                  onSelectSmartView={setSmartView}
                  reminderCount={data?.reminderCount ?? 0}
                  selectedSmartView={data?.smartView ?? 'recent'}
                  topTags={data?.topTags ?? []}
                  totalCount={data?.totalCount ?? 0}
                  unsortedCount={data?.unsortedCount ?? 0}
                />

                <View style={styles.sectionHeader}>
                  <View>
                    <AppText variant="title">{resolveSmartViewLabel(data?.smartView)}</AppText>
                    <AppText color={colors.textMuted} variant="caption">
                      {items.length} visible Capture{items.length === 1 ? '' : 's'}
                    </AppText>
                  </View>
                </View>

                <LibrarySortControls onChange={setSort} options={SORT_OPTIONS} selected={sort} />
              </View>
            }
            columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
            contentContainerStyle={styles.listContent}
            data={items}
            keyExtractor={(item) => item.id}
            numColumns={viewMode === 'grid' ? 2 : 1}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} tintColor={colors.accent} onRefresh={refresh} />
            }
            renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function EmptyState({ onImport, smartViewLabel }: { onImport: () => void; smartViewLabel: string }) {
  return (
    <GlassSurface style={styles.emptyState} useBlur={false} variant="card">
      <View style={styles.emptyContent}>
        <AppText variant="title">No Captures yet</AppText>
        <AppText color={colors.textMuted}>
          {smartViewLabel === 'Recently Added'
            ? 'Imported screenshots become structured Captures here with tags, notes, reminders, and smart sections.'
            : `There are no Captures in ${smartViewLabel.toLowerCase()} right now.`}
        </AppText>
        <AppButton onPress={onImport} style={styles.emptyButton}>
          Add Capture
        </AppButton>
      </View>
    </GlassSurface>
  );
}

function resolveSmartViewLabel(smartView: string | undefined) {
  switch (smartView) {
    case 'graveyard':
      return 'Graveyard';
    case 'reminders':
      return 'Reminder Pending';
    case 'unsorted':
      return 'Unsorted';
    case 'recent':
    default:
      return 'Recently Added';
  }
}

const styles = StyleSheet.create({
  emptyButton: {
    alignSelf: 'center',
    minWidth: 160,
  },
  emptyState: {
    marginTop: spacing.sm,
  },
  emptyContent: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  feedWrap: {
    flex: 1,
  },
  gridItem: {
    flex: 1,
  },
  gridRow: {
    gap: spacing.md,
  },
  headerContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  heroRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  listContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingCard: {
    aspectRatio: 0.82,
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSoft,
    borderRadius: radii.xl,
    borderWidth: 1,
    ...shadows.sm,
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  loadingState: {
    flex: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
