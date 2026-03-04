import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

import { createId } from '@/utils/ids';

import { ReminderRepository } from './reminder.repository';
import { ReminderScheduler } from './reminder.scheduler';
import type {
  ReminderFeedSections,
  ReminderPermissionState,
  ReminderRecord,
  ReminderSchedulingResult,
} from './reminder.types';

const upsertReminderInputSchema = z.object({
  captureId: z.string().trim().min(1),
  dueAt: z.number().int(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  localTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(1),
});

type UpsertReminderInput = z.infer<typeof upsertReminderInputSchema>;

export class ReminderService {
  private readonly reminderRepository: ReminderRepository;
  private readonly reminderScheduler: ReminderScheduler;
  private reconcileInFlight: Promise<void> | null = null;

  constructor(db: SQLiteDatabase) {
    this.reminderRepository = new ReminderRepository(db);
    this.reminderScheduler = new ReminderScheduler();
  }

  async clearReminder(captureId: string) {
    const existing = await this.reminderRepository.getByCaptureId(captureId);

    await this.cancelNotificationSafely(existing?.notificationId);

    await this.reminderRepository.deleteByCaptureId(captureId);
  }

  async getReminderFeed(): Promise<ReminderFeedSections> {
    return this.reminderRepository.listFeedSections();
  }

  async getPermissionState(): Promise<ReminderPermissionState> {
    return this.reminderScheduler.getPermissions();
  }

  async markDone(captureId: string) {
    const existing = await this.reminderRepository.getByCaptureId(captureId);

    if (!existing) {
      return;
    }

    const now = Date.now();

    await this.cancelNotificationSafely(existing.notificationId);

    await this.reminderRepository.upsert({
      ...existing,
      completedAt: now,
      lastInteractionAt: now,
      notificationId: null,
      status: 'done',
      updatedAt: now,
    });
  }

  async openSystemNotificationSettings() {
    await this.reminderScheduler.openSystemNotificationSettings();
  }

  async reconcile(now = Date.now()) {
    if (this.reconcileInFlight) {
      await this.reconcileInFlight;
      return;
    }

    this.reconcileInFlight = this.reconcilePendingReminders(now).finally(() => {
      this.reconcileInFlight = null;
    });

    await this.reconcileInFlight;
  }

  async rescheduleReminder(input: UpsertReminderInput) {
    return this.upsertReminder(input);
  }

  async snoozeByMinutes(captureId: string, minutes: number) {
    const existing = await this.reminderRepository.getByCaptureId(captureId);

    if (!existing) {
      throw new Error('Reminder not found for this Capture.');
    }

    const now = Date.now();
    const nextDue = now + minutes * 60 * 1000;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || existing.timezone || 'UTC';
    const { localDate, localTime } = toLocalDateAndTime(nextDue);

    return this.upsertReminder({
      captureId,
      dueAt: nextDue,
      localDate,
      localTime,
      timezone,
    });
  }

  async snoozeToTomorrowSameTime(captureId: string) {
    const existing = await this.reminderRepository.getByCaptureId(captureId);

    if (!existing) {
      throw new Error('Reminder not found for this Capture.');
    }

    const now = Date.now();
    const nextDue = computeTomorrowAtSameLocalTime(existing.localTime, now);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || existing.timezone || 'UTC';
    const { localDate } = toLocalDateAndTime(nextDue);

    return this.upsertReminder({
      captureId,
      dueAt: nextDue,
      localDate,
      localTime: existing.localTime,
      timezone,
    });
  }

  async upsertReminder(input: UpsertReminderInput): Promise<ReminderSchedulingResult> {
    const parsed = upsertReminderInputSchema.parse(input);
    const now = Date.now();
    const existing = await this.reminderRepository.getByCaptureId(parsed.captureId);

    await this.cancelNotificationSafely(existing?.notificationId);

    const pendingReminder = createPendingReminderRecord({
      captureId: parsed.captureId,
      dueAt: parsed.dueAt,
      existing,
      lastInteractionAt: now,
      localDate: parsed.localDate,
      localTime: parsed.localTime,
      now,
      timezone: parsed.timezone,
    });

    await this.reminderRepository.upsert(pendingReminder);
    return this.scheduleAndPersist(pendingReminder, now);
  }

  private async autoSnoozeReminder(reminder: ReminderRecord, now: number) {
    const nextDueAt = computeNextAutoSnoozeDueAt(reminder, now);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || reminder.timezone || 'UTC';

    await this.cancelNotificationSafely(reminder.notificationId);

    const nextRecord: ReminderRecord = {
      ...reminder,
      autoSnoozeCount: reminder.autoSnoozeCount + 1,
      completedAt: null,
      dueAt: nextDueAt,
      localDate: toLocalDateAndTime(nextDueAt).localDate,
      notificationId: null,
      status: 'pending',
      timezone,
      updatedAt: now,
    };

    await this.reminderRepository.upsert(nextRecord);
    await this.scheduleAndPersist(nextRecord, now);
  }

  private async scheduleAndPersist(reminder: ReminderRecord, now: number) {
    const schedulingResult = await this.reminderScheduler.scheduleReminderNotification({
      captureId: reminder.captureId,
      dueAt: reminder.dueAt,
      reminderId: reminder.id,
    });

    if (!schedulingResult.scheduled) {
      await this.reminderRepository.upsert({
        ...reminder,
        notificationId: null,
        updatedAt: now,
      });

      return schedulingResult;
    }

    await this.reminderRepository.upsert({
      ...reminder,
      notificationId: schedulingResult.notificationId,
      updatedAt: now,
    });

    return schedulingResult;
  }

  private async reconcilePendingReminders(now: number) {
    const pending = await this.reminderRepository.listPending();

    for (const reminder of pending) {
      if (reminder.dueAt < now && shouldAutoSnooze(reminder)) {
        await this.autoSnoozeReminder(reminder, now);
        continue;
      }

      if (!reminder.notificationId && reminder.dueAt > now) {
        await this.scheduleAndPersist(reminder, now);
      }
    }
  }

  private async cancelNotificationSafely(notificationId: string | null | undefined) {
    if (!notificationId) {
      return;
    }

    try {
      await this.reminderScheduler.cancelNotification(notificationId);
    } catch (error) {
      if (__DEV__) {
        console.warn('[reminders] failed to cancel notification', error);
      }
    }
  }
}

function computeNextAutoSnoozeDueAt(reminder: ReminderRecord, now: number) {
  const parsedBase = parseDateTime(reminder.localDate, reminder.localTime);
  let candidate = Number.isFinite(parsedBase.getTime()) ? parsedBase : new Date(reminder.dueAt);

  candidate = new Date(candidate.getTime());
  candidate.setDate(candidate.getDate() + 1);

  while (candidate.getTime() <= now) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate.getTime();
}

function computeTomorrowAtSameLocalTime(localTime: string, now: number) {
  const [hours, minutes] = localTime.split(':').map((value) => Number(value));
  const base = new Date(now);

  base.setDate(base.getDate() + 1);
  base.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);

  return base.getTime();
}

function createPendingReminderRecord(input: {
  captureId: string;
  dueAt: number;
  existing: ReminderRecord | null;
  lastInteractionAt: number;
  localDate: string;
  localTime: string;
  now: number;
  timezone: string;
}): ReminderRecord {
  return {
    autoSnoozeCount: input.existing?.autoSnoozeCount ?? 0,
    captureId: input.existing?.captureId ?? input.captureId,
    completedAt: null,
    createdAt: input.existing?.createdAt ?? input.now,
    dueAt: input.dueAt,
    id: input.existing?.id ?? createId('reminder'),
    lastInteractionAt: input.lastInteractionAt,
    lastNotifiedAt: input.existing?.lastNotifiedAt ?? null,
    localDate: input.localDate,
    localTime: input.localTime,
    notificationId: null,
    status: 'pending',
    timezone: input.timezone,
    updatedAt: input.now,
  };
}

function parseDateTime(localDate: string, localTime: string) {
  return new Date(`${localDate}T${localTime}:00`);
}

function shouldAutoSnooze(reminder: ReminderRecord) {
  if (reminder.status !== 'pending') {
    return false;
  }

  if (!reminder.lastInteractionAt) {
    return true;
  }

  return reminder.lastInteractionAt < reminder.dueAt;
}

function toLocalDateAndTime(timestamp: number) {
  const date = new Date(timestamp);

  return {
    localDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    localTime: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
