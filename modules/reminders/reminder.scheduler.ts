import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';

import type {
  ReminderPermissionState,
  ReminderSchedulingResult,
} from './reminder.types';

const REMINDER_CHANNEL_ID = 'snapbrain-reminders';

let channelConfigured = false;

export class ReminderScheduler {
  async getPermissions(): Promise<ReminderPermissionState> {
    const permission = await Notifications.getPermissionsAsync();
    return normalizePermission(permission.status);
  }

  async requestPermissionsIfNeeded(): Promise<ReminderPermissionState> {
    const current = await this.getPermissions();

    if (current === 'granted' || current === 'denied') {
      return current;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return normalizePermission(requested.status);
  }

  async scheduleReminderNotification(input: {
    captureId: string;
    dueAt: number;
    reminderId: string;
  }): Promise<ReminderSchedulingResult> {
    if (!Number.isFinite(input.dueAt) || input.dueAt <= Date.now()) {
      return {
        reason: 'past-due',
        scheduled: false,
      };
    }

    const permission = await this.requestPermissionsIfNeeded();

    if (permission !== 'granted') {
      return {
        reason: 'permission-denied',
        scheduled: false,
      };
    }

    try {
      await ensureAndroidReminderChannel();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          body: 'Open SnapBrain to review this Capture reminder.',
          data: {
            captureId: input.captureId,
            reminderId: input.reminderId,
          },
          title: 'Capture reminder',
        },
        trigger: {
          channelId: REMINDER_CHANNEL_ID,
          date: new Date(input.dueAt),
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
      });

      return {
        notificationId,
        scheduled: true,
      };
    } catch {
      return {
        reason: 'schedule-error',
        scheduled: false,
      };
    }
  }

  async cancelNotification(notificationId: string | null | undefined) {
    if (!notificationId) {
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async openSystemNotificationSettings() {
    await Linking.openSettings();
  }
}

function normalizePermission(status: Notifications.PermissionStatus): ReminderPermissionState {
  switch (status) {
    case Notifications.PermissionStatus.GRANTED:
      return 'granted';
    case Notifications.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
}

async function ensureAndroidReminderChannel() {
  if (Platform.OS !== 'android' || channelConfigured) {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#7FA489',
    name: 'Capture reminders',
  });

  channelConfigured = true;
}
