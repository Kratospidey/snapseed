import type { SQLiteDatabase } from 'expo-sqlite';

export class SettingsRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async get<T>(key: string) {
    const row = await this.db.getFirstAsync<{ valueJson: string }>(
      `
        SELECT value_json AS valueJson
        FROM settings
        WHERE key = ?
      `,
      key,
    );

    if (!row) {
      return null;
    }

    return JSON.parse(row.valueJson) as T;
  }

  async set(key: string, value: unknown, updatedAt: number) {
    await this.db.runAsync(
      `
        INSERT INTO settings (key, value_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at
      `,
      key,
      JSON.stringify(value),
      updatedAt,
    );
  }
}

