import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME as APP_DATABASE_NAME } from '@/constants/app';

import { runMigrationsAsync } from './migrationRunner';

export const DATABASE_NAME = APP_DATABASE_NAME;

export async function initializeDatabaseAsync(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
  `);

  await runMigrationsAsync(db);
}

