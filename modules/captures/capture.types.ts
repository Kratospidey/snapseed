import { z } from 'zod';

import { CAPTURE_NOTE_MAX_LENGTH } from '@/constants/limits';
import type { DatabaseBoolean } from '@/types/db';

export const captureSourceSchemeSchema = z.enum(['content', 'file', 'ph', 'unknown']);

export const createCaptureInputSchema = z.object({
  mediaAssetId: z.string().trim().min(1).nullable().optional(),
  sourceUri: z.string().trim().min(1),
  sourceScheme: captureSourceSchemeSchema,
  sourceFilename: z.string().trim().min(1).nullable().optional(),
  mimeType: z.string().trim().min(1).nullable().optional(),
  capturedAt: z.number().int().nullable().optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  note: z.string().max(CAPTURE_NOTE_MAX_LENGTH).nullable().optional(),
  duplicateGroupHint: z.string().trim().min(1).nullable().optional(),
  tagLabels: z.array(z.string()).default([]),
  reminder: z
    .object({
      dueAt: z.number().int(),
      localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      localTime: z.string().regex(/^\d{2}:\d{2}$/),
      timezone: z.string().trim().min(1),
    })
    .nullable()
    .optional(),
});

export type CreateCaptureInput = z.infer<typeof createCaptureInputSchema>;

export type CaptureInsertRecord = {
  capturedAt: number | null;
  duplicateGroupHint: string | null;
  fileSize: number | null;
  height: number | null;
  id: string;
  importedAt: number;
  mediaAssetId: string | null;
  mimeType: string | null;
  note: string | null;
  noteNormalized: string | null;
  sourceFilename: string | null;
  sourceScheme: z.infer<typeof captureSourceSchemeSchema>;
  sourceUri: string;
  updatedAt: number;
  width: number | null;
};

export type CaptureSearchProjection = {
  captureId: string;
  noteText: string;
  tagText: string;
};

export type ImportDuplicateCandidateRecord = {
  capturedAt: number | null;
  duplicateGroupHint: string | null;
  id: string;
  importedAt: number;
  mediaAssetId: string | null;
  sourceFilename: string | null;
  sourceUri: string;
  height: number | null;
  width: number | null;
};

export const librarySmartViewSchema = z.enum(['graveyard', 'recent', 'reminders', 'unsorted']);
export const librarySortOptionSchema = z.enum([
  'captured_asc',
  'captured_desc',
  'imported_asc',
  'imported_desc',
  'last_viewed_desc',
  'reminder_due_asc',
]);

export type LibrarySmartView = z.infer<typeof librarySmartViewSchema>;
export type LibrarySortOption = z.infer<typeof librarySortOptionSchema>;

export type CaptureDetailRecord = {
  capturedAt: number | null;
  duplicateGroupHint: string | null;
  fileSize: number | null;
  height: number | null;
  id: string;
  importedAt: number;
  isMissing: boolean;
  mediaAssetId: string | null;
  note: string | null;
  reminderDueAt: number | null;
  reminderLocalDate: string | null;
  reminderLocalTime: string | null;
  reminderTimezone: string | null;
  sourceFilename: string | null;
  sourceScheme: z.infer<typeof captureSourceSchemeSchema>;
  sourceUri: string;
  tags: string[];
  width: number | null;
};

export type LibraryCaptureRecord = {
  capturedAt: number | null;
  duplicateGroupHint: string | null;
  id: string;
  importedAt: number;
  isMissing: DatabaseBoolean;
  mediaAssetId: string | null;
  note: string | null;
  reminderDueAt: number | null;
  sourceFilename: string | null;
  sourceScheme: z.infer<typeof captureSourceSchemeSchema>;
  sourceUri: string;
  tagCount: number;
  tagLabels: string[];
};

export type CaptureSourceReference = {
  id: string;
  isMissing: boolean;
  mediaAssetId: string | null;
  sourceScheme: z.infer<typeof captureSourceSchemeSchema>;
  sourceUri: string;
};
