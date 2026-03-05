import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, View } from 'react-native';

import { AppIconButton } from '@/components/primitives/AppIconButton';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { routes } from '@/constants/routes';
import { CaptureService } from '@/modules/captures/capture.service';
import { TagService } from '@/modules/tags/tag.service';
import { colors, spacing } from '@/theme';

import { LibraryListRow } from '@/features/library/components/LibraryListRow';
import type { LibraryFeedItem } from '@/features/library/types';

type TagDetailState = {
  captureCount: number;
  id: string;
  label: string;
  lastUsedAt: number | null;
};

export function TagCapturesScreen() {
  const { tagId } = useLocalSearchParams<{ tagId?: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const captureService = useMemo(() => new CaptureService(db), [db]);
  const tagService = useMemo(() => new TagService(db), [db]);
  const [tag, setTag] = useState<TagDetailState | null>(null);
  const [captures, setCaptures] = useState<LibraryFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tagId) {
      setTag(null);
      setCaptures([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [nextTag, nextCaptures] = await Promise.all([
      tagService.getById(tagId),
      captureService.getCapturesForTag(tagId, 160),
    ]);

    setTag(nextTag);
    setCaptures(nextCaptures);
    setIsLoading(false);
  }, [captureService, tagId, tagService]);
  const openCaptureDetail = useCallback(
    (captureId: string) => {
      router.push(routes.captureDetail(captureId));
    },
    [router],
  );
  const renderCaptureItem = useCallback(
    ({ item }: { item: LibraryFeedItem }) => <LibraryListRow item={item} onPressCapture={openCaptureDetail} />,
    [openCaptureDetail],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={captures}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <GlassSurface style={styles.emptyCard} useBlur={false}>
            {isLoading ? (
              <AppText color={colors.textMuted}>Loading related Captures...</AppText>
            ) : tag ? (
              <>
                <AppText variant="title">No linked Captures</AppText>
                <AppText color={colors.textMuted}>
                  #{tag.label} exists, but no Capture currently uses it.
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="title">Tag not found</AppText>
                <AppText color={colors.textMuted}>This tag may have been renamed, merged, or deleted.</AppText>
              </>
            )}
          </GlassSurface>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <AppIconButton onPress={() => router.back()}>
                <Ionicons color={colors.text} name="arrow-back" size={22} />
              </AppIconButton>
              <View style={styles.headerCopy}>
                <AppText variant="eyebrow">Tag</AppText>
                <AppText variant="title">{tag ? `#${tag.label}` : 'Related Captures'}</AppText>
                <AppText color={colors.textMuted}>
                  {tag
                    ? `${tag.captureCount} Capture${tag.captureCount === 1 ? '' : 's'} · last used ${formatLastUsed(tag.lastUsedAt)}`
                    : 'Browse the Captures attached to one canonical tag.'}
                </AppText>
              </View>
            </View>
          </View>
        }
        renderItem={renderCaptureItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function formatLastUsed(timestamp: number | null) {
  if (!timestamp) {
    return 'not used yet';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(timestamp);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  header: {
    paddingBottom: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
