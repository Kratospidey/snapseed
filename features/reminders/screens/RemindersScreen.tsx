import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { DateTimeFieldPicker } from '@/components/reminders/DateTimeFieldPicker';
import { AppText } from '@/components/primitives/AppText';
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
          <View style={styles.bannerWarning}>
            <AppText variant="action">Notifications are disabled</AppText>
            <AppText color={colors.textMuted}>
              Reminders still work in-app, but lock-screen alerts are off until notifications are enabled.
            </AppText>
            <Pressable accessibilityRole="button" onPress={openNotificationSettings} style={styles.inlineAction}>
              <AppText variant="caption">Enable notifications</AppText>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.card}>
            <AppText color={colors.textMuted}>Loading reminder feed...</AppText>
          </View>
        ) : !hasAnyRows ? (
          <View style={styles.card}>
            <AppText variant="title">No reminders yet</AppText>
            <AppText color={colors.textMuted}>
              Add reminders from import review or Capture detail, then resolve them from this tab.
            </AppText>
          </View>
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
          <View style={styles.card}>
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
              <Pressable accessibilityRole="button" onPress={() => void handleSaveReschedule()} style={styles.primaryButton}>
                <AppText color={colors.surface} variant="action">
                  Save
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRescheduleDraft(null)}
                style={styles.inlineAction}
              >
                <AppText variant="caption">Cancel</AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.inlineAction}>
          <AppText variant="caption">Refresh reminder state</AppText>
        </Pressable>
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
    backgroundColor: '#F7EEE0',
    borderColor: '#E6BF88',
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
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
  inlineAction: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  itemsList: {
    gap: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
