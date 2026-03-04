import type { SQLiteDatabase } from 'expo-sqlite';

type ReminderRecord = {
  autoSnoozeCount?: number;
  captureId: string;
  completedAt?: number | null;
  createdAt: number;
  dueAt: number;
  id: string;
  lastInteractionAt?: number | null;
  lastNotifiedAt?: number | null;
  localDate: string;
  localTime: string;
  notificationId?: string | null;
  status: 'cancelled' | 'done' | 'pending';
  timezone: string;
  updatedAt: number;
};

export class ReminderRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async deleteByCaptureId(captureId: string) {
    await this.db.runAsync('DELETE FROM reminders WHERE capture_id = ?', captureId);
  }

  async listPending() {
    return this.db.getAllAsync<{
      captureId: string;
      dueAt: number;
      id: string;
      status: string;
    }>(
      `
        SELECT id, capture_id AS captureId, due_at AS dueAt, status
        FROM reminders
        WHERE status = 'pending'
        ORDER BY due_at ASC
      `,
    );
  }

  async upsert(record: ReminderRecord) {
    await this.db.runAsync(
      `
        INSERT INTO reminders (
          id,
          capture_id,
          status,
          due_at,
          local_date,
          local_time,
          timezone,
          notification_id,
          last_notified_at,
          last_interaction_at,
          completed_at,
          auto_snooze_count,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(capture_id) DO UPDATE SET
          status = excluded.status,
          due_at = excluded.due_at,
          local_date = excluded.local_date,
          local_time = excluded.local_time,
          timezone = excluded.timezone,
          notification_id = excluded.notification_id,
          last_notified_at = excluded.last_notified_at,
          last_interaction_at = excluded.last_interaction_at,
          completed_at = excluded.completed_at,
          auto_snooze_count = excluded.auto_snooze_count,
          updated_at = excluded.updated_at
      `,
      record.id,
      record.captureId,
      record.status,
      record.dueAt,
      record.localDate,
      record.localTime,
      record.timezone,
      record.notificationId ?? null,
      record.lastNotifiedAt ?? null,
      record.lastInteractionAt ?? null,
      record.completedAt ?? null,
      record.autoSnoozeCount ?? 0,
      record.createdAt,
      record.updatedAt,
    );
  }
}

