import { Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { DateTimeFieldPicker } from '@/components/reminders/DateTimeFieldPicker';
import { AppButton } from '@/components/primitives/AppButton';
import { AppChip } from '@/components/primitives/AppChip';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { colors, spacing } from '@/theme';

import { ReminderRow } from '../components/ReminderRow';
import { ReminderSection } from '../components/ReminderSection';
import { useRemindersScreen } from '../hooks/useRemindersScreen';
import type { ReminderFeedItem } from '@/modules/reminders/reminder.types';

type RescheduleDraft = {
  captureId: string;
  localDate: string;
  localTime: string;
};

export function RemindersScreen() {
  const {
    doneExpanded,
    feed,
    isLoading,
    markDone,
    openCapture,
    openNotificationSettings,
    pendingActionKey,
    permissionState,
    refresh,
    reschedule,
    setDoneExpanded,
    snoozeByHour,
    snoozeToTomorrow,
  } = useRemindersScreen();
  const [rescheduleDraft, setRescheduleDraft] = useState<RescheduleDraft | null>(null);

  const hasAnyRows = feed.overdue.length > 0 || feed.upcoming.length > 0 || feed.done.length > 0;

  const handleStartReschedule = (item: ReminderFeedItem) => {
    setRescheduleDraft({
      captureId: item.captureId,
      localDate: item.localDate,
      localTime: item.localTime,
    });
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleDraft) {
      return;
    }

    if (!rescheduleDraft.localDate.trim() || !rescheduleDraft.localTime.trim()) {
      Alert.alert('Reschedule incomplete', 'Choose both a date and time before saving.');
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    try {
      await reschedule({
        captureId: rescheduleDraft.captureId,
        localDate: rescheduleDraft.localDate,
        localTime: rescheduleDraft.localTime,
        timezone,
      });
      setRescheduleDraft(null);
    } catch (error) {
      Alert.alert(
        'Reminder not rescheduled',
        error instanceof Error ? error.message : 'Unable to reschedule this reminder.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCopy}>
          <AppText variant="eyebrow">SnapBrain</AppText>
          <AppText variant="display">Reminders</AppText>
          <AppText color={colors.textMuted}>
            Resolve overdue Captures, snooze quickly, or reschedule without leaving this workflow.
          </AppText>
        </View>

        {permissionState === 'denied' ? (
          <GlassSurface style={styles.bannerWarning} useBlur={false}>
            <AppText variant="action">Notifications are disabled</AppText>
            <AppText color={colors.textMuted}>
              Reminders still work in-app, but lock-screen alerts are off until notifications are enabled.
            </AppText>
            <AppChip label="Enable notifications" onPress={openNotificationSettings} />
          </GlassSurface>
        ) : null}

        {isLoading ? (
          <GlassSurface style={styles.card} useBlur={false}>
            <AppText color={colors.textMuted}>Loading reminder feed...</AppText>
          </GlassSurface>
        ) : !hasAnyRows ? (
          <GlassSurface style={styles.card} useBlur={false}>
            <AppText variant="title">No reminders yet</AppText>
            <AppText color={colors.textMuted}>
              Add reminders from import review or Capture detail, then resolve them from this tab.
            </AppText>
          </GlassSurface>
        ) : (
          <>
            {feed.overdue.length > 0 ? (
              <View style={styles.section}>
                <ReminderSection count={feed.overdue.length} subtitle="needs attention now" title="Overdue" />
                <View style={styles.itemsList}>
                  {feed.overdue.map((item) => (
                    <ReminderRow
                      item={item}
                      key={item.id}
                      onMarkDone={() => void markDone(item.captureId)}
                      onOpenCapture={() => openCapture(item.captureId)}
                      onReschedule={() => handleStartReschedule(item)}
                      onSnoozeByHour={() => void snoozeByHour(item.captureId)}
                      onSnoozeTomorrow={() => void snoozeToTomorrow(item.captureId)}
                      pendingActionKey={pendingActionKey}
                      rowActionScope="pending"
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {feed.upcoming.length > 0 ? (
              <View style={styles.section}>
                <ReminderSection count={feed.upcoming.length} subtitle="upcoming" title="Upcoming" />
                <View style={styles.itemsList}>
                  {feed.upcoming.map((item) => (
                    <ReminderRow
                      item={item}
                      key={item.id}
                      onMarkDone={() => void markDone(item.captureId)}
                      onOpenCapture={() => openCapture(item.captureId)}
                      onReschedule={() => handleStartReschedule(item)}
                      onSnoozeByHour={() => void snoozeByHour(item.captureId)}
                      onSnoozeTomorrow={() => void snoozeToTomorrow(item.captureId)}
                      pendingActionKey={pendingActionKey}
                      rowActionScope="pending"
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {feed.done.length > 0 ? (
              <View style={styles.section}>
                <ReminderSection
                  count={feed.done.length}
                  ctaLabel={doneExpanded ? 'Hide done' : 'Show done'}
                  onPressCta={() => setDoneExpanded(!doneExpanded)}
                  subtitle="completed"
                  title="Done"
                />
                {doneExpanded ? (
                  <View style={styles.itemsList}>
                    {feed.done.map((item) => (
                      <ReminderRow
                        item={item}
                        key={item.id}
                        onOpenCapture={() => openCapture(item.captureId)}
                        pendingActionKey={pendingActionKey}
                        rowActionScope="done"
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        )}

        {rescheduleDraft ? (
          <GlassSurface style={styles.card} useBlur={false}>
            <AppText variant="title">Reschedule reminder</AppText>
            <View style={styles.rescheduleRow}>
              <View style={styles.rescheduleField}>
                <DateTimeFieldPicker
                  accessibilityLabel="Choose reminder date"
                  label="Date"
                  mode="date"
                  onChangeValue={(nextValue) =>
                    setRescheduleDraft((current) =>
                      current
                        ? {
                            ...current,
                            localDate: nextValue,
                          }
                        : current,
                    )
                  }
                  placeholder="YYYY-MM-DD"
                  value={rescheduleDraft.localDate}
                />
              </View>
              <View style={styles.rescheduleField}>
                <DateTimeFieldPicker
                  accessibilityLabel="Choose reminder time"
                  label="Time"
                  mode="time"
                  onChangeValue={(nextValue) =>
                    setRescheduleDraft((current) =>
                      current
                        ? {
                            ...current,
                            localTime: nextValue,
                          }
                        : current,
                    )
                  }
                  placeholder="HH:MM"
                  value={rescheduleDraft.localTime}
                />
              </View>
            </View>
            <View style={styles.actionRow}>
              <AppButton onPress={() => void handleSaveReschedule()}>Save</AppButton>
              <AppChip label="Cancel" onPress={() => setRescheduleDraft(null)} />
            </View>
          </GlassSurface>
        ) : null}

        <AppChip label="Refresh reminder state" onPress={() => void refresh()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bannerWarning: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  content: {
    gap: spacing.md,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  itemsList: {
    gap: spacing.sm,
  },
  rescheduleField: {
    flex: 1,
  },
  rescheduleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
});
