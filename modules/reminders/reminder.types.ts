import type { ReminderStatus as DomainReminderStatus } from '@/types/domain';

import type { CaptureDetailRecord } from '../captures/capture.types';

export type ReminderStatus = DomainReminderStatus;

export type ReminderRecord = {
  autoSnoozeCount: number;
  captureId: string;
  completedAt: number | null;
  createdAt: number;
  dueAt: number;
  id: string;
  lastInteractionAt: number | null;
  lastNotifiedAt: number | null;
  localDate: string;
  localTime: string;
  notificationId: string | null;
  status: ReminderStatus;
  timezone: string;
  updatedAt: number;
};

export type ReminderFeedItem = ReminderRecord & {
  capture: {
    capturedAt: number | null;
    id: string;
    importedAt: number;
    isMissing: boolean;
    mediaAssetId: string | null;
    note: string | null;
    sourceFilename: string | null;
    sourceScheme: CaptureDetailRecord['sourceScheme'];
    sourceUri: string;
    tagLabels: string[];
  };
};

export type ReminderFeedSections = {
  done: ReminderFeedItem[];
  overdue: ReminderFeedItem[];
  upcoming: ReminderFeedItem[];
};

export type ReminderPermissionState = 'denied' | 'granted' | 'undetermined';

export type ReminderSchedulingFailureReason = 'past-due' | 'permission-denied' | 'schedule-error';

export type ReminderSchedulingResult =
  | {
      notificationId: string;
      scheduled: true;
    }
  | {
      reason: ReminderSchedulingFailureReason;
      scheduled: false;
    };
