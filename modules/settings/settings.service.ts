import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

import { SettingsRepository } from './settings.repository';

const libraryViewModeSchema = z.enum(['grid', 'list']);

export class SettingsService {
  private readonly settingsRepository: SettingsRepository;

  constructor(db: SQLiteDatabase) {
    this.settingsRepository = new SettingsRepository(db);
  }

  async getLibraryLastViewMode() {
    const value = await this.settingsRepository.get<unknown>('library.lastViewMode');
    const parsed = libraryViewModeSchema.safeParse(value);

    return parsed.success ? parsed.data : 'grid';
  }

  async setLibraryLastViewMode(viewMode: 'grid' | 'list') {
    await this.settingsRepository.set('library.lastViewMode', libraryViewModeSchema.parse(viewMode), Date.now());
  }
}

