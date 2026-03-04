import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

import { createId } from '@/utils/ids';

import { ReminderRepository } from './reminder.repository';

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

  constructor(db: SQLiteDatabase) {
    this.reminderRepository = new ReminderRepository(db);
  }

  async upsertReminder(input: UpsertReminderInput) {
    const parsed = upsertReminderInputSchema.parse(input);
    const now = Date.now();

    await this.reminderRepository.upsert({
      captureId: parsed.captureId,
      createdAt: now,
      dueAt: parsed.dueAt,
      id: createId('reminder'),
      localDate: parsed.localDate,
      localTime: parsed.localTime,
      status: 'pending',
      timezone: parsed.timezone,
      updatedAt: now,
    });
  }
}

