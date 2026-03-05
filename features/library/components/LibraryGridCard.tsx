import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { TactilePressable } from '@/components/primitives/TactilePressable';
import type { LibraryFeedItem } from '@/features/library/types';
import { colors, radii, shadows, spacing } from '@/theme';

import { CapturePreviewImage } from './CapturePreviewImage';
import { MetaBadge } from './MetaBadge';
import { TagPill } from './TagPill';

type LibraryGridCardProps = {
  item: LibraryFeedItem;
  onPress?: () => void;
  onPressCapture?: (captureId: string) => void;
};

export const LibraryGridCard = memo(function LibraryGridCard({
  item,
  onPress,
  onPressCapture,
}: LibraryGridCardProps) {
  const handlePress = useCallback(() => {
    if (onPressCapture) {
      onPressCapture(item.id);
      return;
    }

    onPress?.();
  }, [item.id, onPress, onPressCapture]);

  return (
    <TactilePressable accessibilityRole="button" intensity="soft" onPress={handlePress} style={styles.card}>
      <View pointerEvents="none" style={styles.cardTopHighlight} />
      <View pointerEvents="none" style={styles.cardInsetBorder} />
      <View style={styles.thumbnailWrap}>
        <CapturePreviewImage
          isMissing={item.isMissing === 1}
          mediaAssetId={item.mediaAssetId}
          sourceScheme={item.sourceScheme}
          sourceUri={item.sourceUri}
        />
        <View style={styles.badgeOverlay}>
          {item.isMissing === 1 ? <MetaBadge label="Missing" tone="danger" /> : null}
          {item.reminderDueAt ? <MetaBadge label="Reminder" tone="accent" /> : null}
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
    </TactilePressable>
  );
});

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
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardInsetBorder: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.xl,
    borderWidth: 1,
    opacity: 0.5,
    zIndex: 1,
  },
  cardTopHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    height: 1,
    left: spacing.sm,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.xs,
    zIndex: 2,
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
    backgroundColor: colors.surfaceInset,
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    position: 'relative',
  },
});
