import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppChip } from '@/components/primitives/AppChip';
import { AppText } from '@/components/primitives/AppText';
import { TactilePressable } from '@/components/primitives/TactilePressable';
import { MetaBadge } from '@/features/library/components/MetaBadge';
import type { ReminderFeedItem } from '@/modules/reminders/reminder.types';
import { colors, spacing } from '@/theme';

type ReminderRowProps = {
  item: ReminderFeedItem;
  onMarkDone?: () => void;
  onOpenCapture: () => void;
  onReschedule?: () => void;
  onSnoozeByHour?: () => void;
  onSnoozeTomorrow?: () => void;
  pendingActionKey: string | null;
  rowActionScope: 'done' | 'pending';
};

function ReminderRowComponent({
  item,
  onMarkDone,
  onOpenCapture,
  onReschedule,
  onSnoozeByHour,
  onSnoozeTomorrow,
  pendingActionKey,
  rowActionScope,
}: ReminderRowProps) {
  const isOverdue = rowActionScope === 'pending' && item.dueAt < Date.now();
  const tagPreview = item.capture.tagLabels.slice(0, 2).join(', ');

  return (
    <TactilePressable accessibilityRole="button" intensity="soft" onPress={onOpenCapture} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <AppText numberOfLines={1} variant="action">
            {item.capture.sourceFilename ?? 'Capture'}
          </AppText>
          <AppText color={colors.textMuted} numberOfLines={1} variant="caption">
            Due {formatDateTime(item.dueAt)}
          </AppText>
          {item.capture.note ? (
            <AppText color={colors.textMuted} numberOfLines={2} variant="caption">
              {item.capture.note}
            </AppText>
          ) : null}
          {tagPreview ? (
            <AppText color={colors.textMuted} numberOfLines={1} variant="caption">
              #{tagPreview}
            </AppText>
          ) : null}
        </View>
        <View style={styles.badges}>
          {isOverdue ? <OverdueBadge /> : null}
          {item.capture.isMissing ? <MetaBadge label="Missing original" tone="danger" /> : null}
          {rowActionScope === 'pending' && !item.notificationId ? (
            <MetaBadge label="In-app only" tone="neutral" />
          ) : null}
          {rowActionScope === 'done' ? <MetaBadge label="Done" tone="neutral" /> : null}
        </View>
      </View>

      {rowActionScope === 'pending' ? (
        <View style={styles.actionRow}>
          <RowActionButton
            busy={pendingActionKey === `done:${item.captureId}`}
            disabled={Boolean(pendingActionKey)}
            label="Mark done"
            onPress={onMarkDone}
          />
          <RowActionButton
            busy={pendingActionKey === `snooze-hour:${item.captureId}`}
            disabled={Boolean(pendingActionKey)}
            label="+1h"
            onPress={onSnoozeByHour}
          />
          <RowActionButton
            busy={pendingActionKey === `snooze-tomorrow:${item.captureId}`}
            disabled={Boolean(pendingActionKey)}
            label="Tomorrow"
            onPress={onSnoozeTomorrow}
          />
          <RowActionButton
            busy={pendingActionKey === `reschedule:${item.captureId}`}
            disabled={Boolean(pendingActionKey)}
            label="Reschedule"
            onPress={onReschedule}
          />
        </View>
      ) : null}
    </TactilePressable>
  );
}

function OverdueBadge() {
  return <MetaBadge label="Overdue" tone="danger" />;
}

function RowActionButton({
  busy,
  disabled,
  label,
  onPress,
}: {
  busy: boolean;
  disabled: boolean;
  label: string;
  onPress?: () => void;
}) {
  return <AppChip disabled={disabled || !onPress} label={busy ? '...' : label} onPress={onPress} />;
}

function formatDateTime(timestamp: number) {
  return REMINDER_DATE_TIME_FORMATTER.format(timestamp);
}

const REMINDER_DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badges: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
export const ReminderRow = memo(ReminderRowComponent);
