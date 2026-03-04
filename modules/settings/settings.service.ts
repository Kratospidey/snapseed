import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

import { SettingsRepository } from './settings.repository';

const libraryViewModeSchema = z.enum(['grid', 'list']);
const notificationPreferenceSchema = z.object({
  inAppRemindersEnabled: z.boolean(),
  pushNotificationsEnabled: z.boolean(),
});

export class SettingsService {
  private readonly settingsRepository: SettingsRepository;

  constructor(db: SQLiteDatabase) {
    this.settingsRepository = new SettingsRepository(db);
  }

  async getLibraryLastViewMode() {
    const mode = await this.getLibraryViewModeByKey('library.lastViewMode');
    return mode ?? 'grid';
  }

  async getLibraryDefaultViewMode() {
    const mode = await this.getLibraryViewModeByKey('library.defaultViewMode');
    return mode ?? 'grid';
  }

  async getLibraryInitialViewMode() {
    const [lastMode, defaultMode] = await Promise.all([
      this.getLibraryViewModeByKey('library.lastViewMode'),
      this.getLibraryDefaultViewMode(),
    ]);

    return lastMode ?? defaultMode;
  }

  async setLibraryLastViewMode(viewMode: 'grid' | 'list') {
    await this.settingsRepository.set('library.lastViewMode', libraryViewModeSchema.parse(viewMode), Date.now());
  }

  async setLibraryDefaultViewMode(viewMode: 'grid' | 'list') {
    await this.settingsRepository.set('library.defaultViewMode', libraryViewModeSchema.parse(viewMode), Date.now());
  }

  async getNotificationPreferences() {
    const value = await this.settingsRepository.get<unknown>('notifications.preferences');
    const parsed = notificationPreferenceSchema.safeParse(value);

    if (parsed.success) {
      return parsed.data;
    }

    return {
      inAppRemindersEnabled: true,
      pushNotificationsEnabled: true,
    };
  }

  async setNotificationPreferences(input: {
    inAppRemindersEnabled: boolean;
    pushNotificationsEnabled: boolean;
  }) {
    await this.settingsRepository.set(
      'notifications.preferences',
      notificationPreferenceSchema.parse(input),
      Date.now(),
    );
  }

  async getNumberSetting(key: string) {
    const value = await this.settingsRepository.get<unknown>(key);
    const parsed = z.number().safeParse(value);

    return parsed.success ? parsed.data : null;
  }

  async getStringSetting(key: string) {
    const value = await this.settingsRepository.get<unknown>(key);
    const parsed = z.string().safeParse(value);

    return parsed.success ? parsed.data : null;
  }

  async setSetting(key: string, value: unknown) {
    await this.settingsRepository.set(key, value, Date.now());
  }

  private async getLibraryViewModeByKey(key: string) {
    const value = await this.settingsRepository.get<unknown>(key);
    const parsed = libraryViewModeSchema.safeParse(value);

    return parsed.success ? parsed.data : null;
  }
}
