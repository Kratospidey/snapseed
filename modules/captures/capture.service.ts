import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/utils/ids';
import { normalizeNote, stripNilStrings } from '@/utils/strings';

import { ReminderService } from '../reminders/reminder.service';
import { SearchService } from '../search/search.service';
import { TagService } from '../tags/tag.service';
import { CaptureRepository } from './capture.repository';
import {
  createCaptureInputSchema,
  librarySortOptionSchema,
  librarySmartViewSchema,
  type CreateCaptureInput,
  type CaptureInsertRecord,
  type LibrarySortOption,
  type LibrarySmartView,
} from './capture.types';

export class CaptureService {
  private readonly captureRepository: CaptureRepository;
  private readonly reminderService: ReminderService;
  private readonly searchService: SearchService;
  private readonly tagService: TagService;

  constructor(db: SQLiteDatabase) {
    this.captureRepository = new CaptureRepository(db);
    this.reminderService = new ReminderService(db);
    this.searchService = new SearchService(db);
    this.tagService = new TagService(db);
  }

  async importCaptures(inputs: CreateCaptureInput[]) {
    const now = Date.now();
    const normalizedInputs = inputs.map((input) => createCaptureInputSchema.parse(input));
    const records = normalizedInputs.map<CaptureInsertRecord>((input) => {
      const normalizedNote = normalizeNote(input.note ?? null);

      return {
        capturedAt: input.capturedAt ?? null,
        duplicateGroupHint: input.duplicateGroupHint ?? null,
        fileSize: input.fileSize ?? null,
        height: input.height ?? null,
        id: createId('capture'),
        importedAt: now,
        mediaAssetId: input.mediaAssetId ?? null,
        mimeType: input.mimeType ?? null,
        note: normalizedNote,
        noteNormalized: normalizedNote,
        sourceFilename: input.sourceFilename ?? null,
        sourceScheme: input.sourceScheme,
        sourceUri: input.sourceUri,
        updatedAt: now,
        width: input.width ?? null,
      };
    });

    await this.captureRepository.insertMany(records);

    for (const [index, record] of records.entries()) {
      const input = normalizedInputs[index];
      const tagLabels = stripNilStrings(input.tagLabels);

      if (tagLabels.length > 0) {
        await this.tagService.replaceCaptureTags(record.id, tagLabels, now);
      }

      if (input.reminder) {
        await this.reminderService.upsertReminder({
          captureId: record.id,
          dueAt: input.reminder.dueAt,
          localDate: input.reminder.localDate,
          localTime: input.reminder.localTime,
          timezone: input.reminder.timezone,
        });
      }

      await this.searchService.reindexCapture(record.id);
    }

    return records.map((record) => record.id);
  }

  async getCaptureDetail(captureId: string) {
    return this.captureRepository.getDetailById(captureId);
  }

  async getCapturesForTag(tagId: string, limit?: number) {
    return this.captureRepository.listByTagId(tagId, limit);
  }

  async getLibraryFeed(input: { limit?: number; smartView: LibrarySmartView; sort: LibrarySortOption }) {
    return this.captureRepository.listLibraryFeed({
      limit: input.limit,
      smartView: librarySmartViewSchema.parse(input.smartView),
      sort: librarySortOptionSchema.parse(input.sort),
    });
  }

  async getSmartCounts() {
    return this.captureRepository.getSmartCounts();
  }

  async clearReminder(captureId: string) {
    await this.reminderService.clearReminder(captureId);
  }

  async deleteCaptureMetadata(captureId: string) {
    await this.captureRepository.deleteById(captureId);
    await this.searchService.reindexCapture(captureId);
  }

  async recordCaptureViewed(captureId: string) {
    await this.captureRepository.touchLastViewed(captureId, Date.now());
  }

  async updateNote(captureId: string, note: string | null) {
    const normalizedNote = normalizeNote(note);

    await this.captureRepository.updateNote(captureId, normalizedNote, normalizedNote, Date.now());
    await this.searchService.reindexCapture(captureId);
  }

  async updateReminder(input: {
    captureId: string;
    localDate: string;
    localTime: string;
    timezone: string;
  }) {
    const dueAt = parseReminderDateTime(input.localDate, input.localTime);

    await this.reminderService.upsertReminder({
      captureId: input.captureId,
      dueAt,
      localDate: input.localDate,
      localTime: input.localTime,
      timezone: input.timezone,
    });
  }

  async updateTags(captureId: string, labels: string[]) {
    await this.tagService.replaceCaptureTags(captureId, labels, Date.now());
  }
}

function parseReminderDateTime(localDate: string, localTime: string) {
  const parsed = new Date(`${localDate}T${localTime}:00`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid reminder date/time');
  }

  return parsed.getTime();
}
