import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import type { LibraryFeedItem } from '@/features/library/types';
import { colors, spacing } from '@/theme';

import { CapturePreviewImage } from './CapturePreviewImage';
import { MetaBadge } from './MetaBadge';
import { TagPill } from './TagPill';

type LibraryListRowProps = {
  item: LibraryFeedItem;
  onPress?: () => void;
  onPressCapture?: (captureId: string) => void;
};

const IMPORTED_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
});

export const LibraryListRow = memo(function LibraryListRow({
  item,
  onPress,
  onPressCapture,
}: LibraryListRowProps) {
  const handlePress = useCallback(() => {
    if (onPressCapture) {
      onPressCapture(item.id);
      return;
    }

    onPress?.();
  }, [item.id, onPress, onPressCapture]);

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} style={styles.row}>
      <View style={styles.thumbnailWrap}>
        <CapturePreviewImage
          isMissing={item.isMissing === 1}
          mediaAssetId={item.mediaAssetId}
          sourceScheme={item.sourceScheme}
          sourceUri={item.sourceUri}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.badgesRow}>
          {item.isMissing === 1 ? <MetaBadge label="Graveyard" tone="danger" /> : null}
          {item.reminderDueAt ? <MetaBadge label="Reminder" tone="accent" /> : null}
        </View>

        {item.tagLabels.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.tagLabels.map((tag) => (
              <TagPill key={`${item.id}-${tag}`} label={tag} />
            ))}
          </View>
        ) : (
          <AppText color={colors.textMuted} variant="caption">
            {item.note ? 'No tags yet' : 'Unsorted'}
          </AppText>
        )}

        {item.note ? (
          <AppText numberOfLines={3} style={styles.notePreview}>
            {item.note}
          </AppText>
        ) : null}

        <AppText color={colors.textMuted} variant="caption">
          Imported {IMPORTED_DATE_FORMATTER.format(item.importedAt)}
        </AppText>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  notePreview: {
    color: colors.text,
  },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  thumbnailWrap: {
    backgroundColor: colors.accentSoft,
    borderRadius: 18,
    height: 104,
    overflow: 'hidden',
    width: 92,
  },
});
