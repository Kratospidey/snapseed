import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';

import { routes } from '@/constants/routes';
import { ReminderService } from '@/modules/reminders/reminder.service';

export function ReminderRuntimeSync() {
  const db = useSQLiteContext();
  const router = useRouter();
  const reminderService = useMemo(() => new ReminderService(db), [db]);

  useEffect(() => {
    void reminderService.reconcile().catch((error) => {
      if (__DEV__) {
        console.warn('[reminders] initial reconcile failed', error);
      }
    });
  }, [reminderService]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void reminderService.reconcile().catch((error) => {
          if (__DEV__) {
            console.warn('[reminders] foreground reconcile failed', error);
          }
        });
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [reminderService]);

  useEffect(() => {
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const captureId = typeof data?.captureId === 'string' ? data.captureId : null;

      if (!captureId) {
        return;
      }

      router.push(routes.captureDetail(captureId));
    });

    return () => {
      notificationSubscription.remove();
    };
  }, [router]);

  return null;
}
