import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME as APP_DATABASE_NAME } from '@/constants/app';

import { runMigrationsAsync } from './migrationRunner';

export const DATABASE_NAME = APP_DATABASE_NAME;

export async function initializeDatabaseAsync(db: SQLiteDatabase) {
  try {
    if (__DEV__) {
      console.info('[startup] SQLite init begin');
    }

    await db.execAsync(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
    `);

    await runMigrationsAsync(db);

    if (__DEV__) {
      console.info('[startup] SQLite init complete');
    }
  } catch (error) {
    console.error('[startup] SQLite init failed', error);
    throw error;
  }
}
