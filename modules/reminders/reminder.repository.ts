import type { SQLiteDatabase } from 'expo-sqlite';

import type { ReminderFeedItem, ReminderFeedSections, ReminderRecord } from './reminder.types';

const TAG_SEPARATOR = '\u001f';

type ReminderRecordInsert = ReminderRecord;

type ReminderRow = {
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
  status: ReminderRecord['status'];
  timezone: string;
  updatedAt: number;
};

type ReminderFeedRow = ReminderRow & {
  capturedAt: number | null;
  importedAt: number;
  isMissing: 0 | 1;
  mediaAssetId: string | null;
  note: string | null;
  sourceFilename: string | null;
  sourceScheme: ReminderFeedItem['capture']['sourceScheme'];
  sourceUri: string;
  tagLabels: string | null;
};

export class ReminderRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async deleteByCaptureId(captureId: string) {
    await this.db.runAsync('DELETE FROM reminders WHERE capture_id = ?', captureId);
  }

  async getByCaptureId(captureId: string) {
    const row = await this.db.getFirstAsync<ReminderRow>(
      `
        SELECT
          id,
          capture_id AS captureId,
          status,
          due_at AS dueAt,
          local_date AS localDate,
          local_time AS localTime,
          timezone,
          notification_id AS notificationId,
          last_notified_at AS lastNotifiedAt,
          last_interaction_at AS lastInteractionAt,
          completed_at AS completedAt,
          auto_snooze_count AS autoSnoozeCount,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM reminders
        WHERE capture_id = ?
      `,
      captureId,
    );

    return row ? mapReminderRow(row) : null;
  }

  async listFeedSections(input?: {
    doneLimit?: number;
    overdueLimit?: number;
    upcomingLimit?: number;
  }): Promise<ReminderFeedSections> {
    const now = Date.now();
    const overdueLimit = input?.overdueLimit ?? 120;
    const upcomingLimit = input?.upcomingLimit ?? 180;
    const doneLimit = input?.doneLimit ?? 120;

    const [overdue, upcoming, done] = await Promise.all([
      this.listFeed(
        `
          r.status = 'pending'
          AND r.due_at < ?
        `,
        [now],
        'r.due_at ASC, r.updated_at DESC',
        overdueLimit,
      ),
      this.listFeed(
        `
          r.status = 'pending'
          AND r.due_at >= ?
        `,
        [now],
        'r.due_at ASC, r.updated_at DESC',
        upcomingLimit,
      ),
      this.listFeed(
        `
          r.status = 'done'
        `,
        [],
        'COALESCE(r.completed_at, r.updated_at) DESC',
        doneLimit,
      ),
    ]);

    return {
      done,
      overdue,
      upcoming,
    };
  }

  async listPending() {
    const rows = await this.db.getAllAsync<ReminderRow>(
      `
        SELECT
          id,
          capture_id AS captureId,
          status,
          due_at AS dueAt,
          local_date AS localDate,
          local_time AS localTime,
          timezone,
          notification_id AS notificationId,
          last_notified_at AS lastNotifiedAt,
          last_interaction_at AS lastInteractionAt,
          completed_at AS completedAt,
          auto_snooze_count AS autoSnoozeCount,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM reminders
        WHERE status = 'pending'
        ORDER BY due_at ASC
      `,
    );

    return rows.map((row) => mapReminderRow(row));
  }

  async upsert(record: ReminderRecordInsert) {
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
      record.notificationId,
      record.lastNotifiedAt,
      record.lastInteractionAt,
      record.completedAt,
      record.autoSnoozeCount,
      record.createdAt,
      record.updatedAt,
    );
  }

  private async listFeed(
    whereClause: string,
    params: Array<number | string>,
    orderBy: string,
    limit: number,
  ) {
    const rows = await this.db.getAllAsync<ReminderFeedRow>(
      `
        SELECT
          r.id,
          r.capture_id AS captureId,
          r.status,
          r.due_at AS dueAt,
          r.local_date AS localDate,
          r.local_time AS localTime,
          r.timezone,
          r.notification_id AS notificationId,
          r.last_notified_at AS lastNotifiedAt,
          r.last_interaction_at AS lastInteractionAt,
          r.completed_at AS completedAt,
          r.auto_snooze_count AS autoSnoozeCount,
          r.created_at AS createdAt,
          r.updated_at AS updatedAt,
          c.source_uri AS sourceUri,
          c.source_scheme AS sourceScheme,
          c.source_filename AS sourceFilename,
          c.media_asset_id AS mediaAssetId,
          c.note,
          c.imported_at AS importedAt,
          c.captured_at AS capturedAt,
          c.is_missing AS isMissing,
          (
            SELECT GROUP_CONCAT(label, '${TAG_SEPARATOR}')
            FROM (
              SELECT t.label AS label
              FROM capture_tags ct_labels
              INNER JOIN tags t ON t.id = ct_labels.tag_id
              WHERE ct_labels.capture_id = c.id
              ORDER BY t.last_used_at DESC, t.label ASC
              LIMIT 2
            )
          ) AS tagLabels
        FROM reminders r
        INNER JOIN captures c ON c.id = r.capture_id
        WHERE c.deleted_at IS NULL
          AND ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ?
      `,
      ...params,
      limit,
    );

    return rows.map((row) => mapReminderFeedRow(row));
  }
}

function mapReminderRow(row: ReminderRow): ReminderRecord {
  return {
    autoSnoozeCount: row.autoSnoozeCount,
    captureId: row.captureId,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    dueAt: row.dueAt,
    id: row.id,
    lastInteractionAt: row.lastInteractionAt,
    lastNotifiedAt: row.lastNotifiedAt,
    localDate: row.localDate,
    localTime: row.localTime,
    notificationId: row.notificationId,
    status: row.status,
    timezone: row.timezone,
    updatedAt: row.updatedAt,
  };
}

function mapReminderFeedRow(row: ReminderFeedRow): ReminderFeedItem {
  return {
    ...mapReminderRow(row),
    capture: {
      capturedAt: row.capturedAt,
      id: row.captureId,
      importedAt: row.importedAt,
      isMissing: row.isMissing === 1,
      mediaAssetId: row.mediaAssetId,
      note: row.note,
      sourceFilename: row.sourceFilename,
      sourceScheme: row.sourceScheme,
      sourceUri: row.sourceUri,
      tagLabels: splitTagLabels(row.tagLabels),
    },
  };
}

function splitTagLabels(value: string | null) {
  if (!value) {
    return [];
  }

  return value.split(TAG_SEPARATOR).filter(Boolean);
}
