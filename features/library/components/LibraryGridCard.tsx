import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import type { LibraryFeedItem } from '@/features/library/types';
import { colors, spacing } from '@/theme';

import { CapturePreviewImage } from './CapturePreviewImage';
import { MetaBadge } from './MetaBadge';
import { TagPill } from './TagPill';

type LibraryGridCardProps = {
  item: LibraryFeedItem;
  onPress: () => void;
};

export function LibraryGridCard({ item, onPress }: LibraryGridCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.thumbnailWrap}>
        <CapturePreviewImage isMissing={item.isMissing === 1} sourceUri={item.sourceUri} />
        <View style={styles.badgeOverlay}>
          {item.isMissing === 1 ? <MetaBadge label="Missing" tone="danger" /> : null}
          {item.reminderDueAt ? <MetaBadge label="Reminder" tone="accent" /> : null}
          {item.duplicateGroupHint ? <MetaBadge label="Similar" tone="neutral" /> : null}
        </View>
      </View>

      <View style={styles.metaArea}>
        {item.tagLabels.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.tagLabels.map((tag) => (
              <TagPill key={`${item.id}-${tag}`} label={tag} />
            ))}
          </View>
        ) : (
          <AppText color={colors.textMuted} variant="caption">
            {item.note ? 'Note only' : 'Unsorted'}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badgeOverlay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    left: spacing.sm,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metaArea: {
    gap: spacing.xs,
    minHeight: 54,
    padding: spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  thumbnailWrap: {
    aspectRatio: 0.82,
    backgroundColor: colors.accentSoft,
    position: 'relative',
  },
});
