import type { SQLiteDatabase } from 'expo-sqlite';

import { initialMigration } from './migrations/0001_initial';
import { hardeningIndexesMigration } from './migrations/0002_hardening_indexes';

type Migration = {
  name: string;
  sql: string;
  version: number;
};

const MIGRATIONS: Migration[] = [initialMigration, hardeningIndexesMigration];

export async function runMigrationsAsync(db: SQLiteDatabase) {
  const currentVersion =
    (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await db.execAsync(`
      BEGIN;
      ${migration.sql}
      PRAGMA user_version = ${migration.version};
      COMMIT;
    `);
  }
}
