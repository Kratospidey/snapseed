import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';

import { routes } from '@/constants/routes';
import { ReminderService } from '@/modules/reminders/reminder.service';
import type { ReminderFeedSections, ReminderPermissionState } from '@/modules/reminders/reminder.types';

type ReminderAction =
  | 'done'
  | 'reschedule'
  | 'snooze-hour'
  | 'snooze-tomorrow';

const EMPTY_FEED: ReminderFeedSections = {
  done: [],
  overdue: [],
  upcoming: [],
};

export function useRemindersScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const reminderService = useMemo(() => new ReminderService(db), [db]);
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [feed, setFeed] = useState<ReminderFeedSections>(EMPTY_FEED);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<ReminderPermissionState>('undetermined');

  const load = useCallback(async () => {
    setIsLoading(true);
    await reminderService.reconcile();

    const [nextFeed, nextPermissionState] = await Promise.all([
      reminderService.getReminderFeed(),
      reminderService.getPermissionState(),
    ]);

    setFeed(nextFeed);
    setPermissionState(nextPermissionState);
    setIsLoading(false);
  }, [reminderService]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const runAction = useCallback(
    async (captureId: string, action: ReminderAction, callback: () => Promise<unknown>) => {
      const key = `${action}:${captureId}`;
      setPendingActionKey(key);

      try {
        await callback();
        await load();
      } finally {
        setPendingActionKey(null);
      }
    },
    [load],
  );

  return {
    doneExpanded,
    feed,
    isLoading,
    openCapture: (captureId: string) => {
      router.push(routes.captureDetail(captureId));
    },
    openNotificationSettings: () => reminderService.openSystemNotificationSettings(),
    pendingActionKey,
    permissionState,
    refresh: load,
    setDoneExpanded,
    markDone: (captureId: string) =>
      runAction(captureId, 'done', () => reminderService.markDone(captureId)),
    reschedule: (input: {
      captureId: string;
      localDate: string;
      localTime: string;
      timezone: string;
    }) =>
      runAction(input.captureId, 'reschedule', () => reminderService.rescheduleReminder({
        captureId: input.captureId,
        dueAt: new Date(`${input.localDate}T${input.localTime}:00`).getTime(),
        localDate: input.localDate,
        localTime: input.localTime,
        timezone: input.timezone,
      })),
    snoozeByHour: (captureId: string) =>
      runAction(captureId, 'snooze-hour', () => reminderService.snoozeByMinutes(captureId, 60)),
    snoozeToTomorrow: (captureId: string) =>
      runAction(captureId, 'snooze-tomorrow', () => reminderService.snoozeToTomorrowSameTime(captureId)),
  };
}
