import type { SQLiteDatabase } from 'expo-sqlite';

import type { TagRecord } from './tag.types';

export class TagRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async attachTagsToCapture(captureId: string, tagIds: string[], appliedAt: number) {
    if (tagIds.length === 0) {
      return;
    }

    await this.db.withTransactionAsync(async () => {
      for (const tagId of tagIds) {
        await this.db.runAsync(
          `
            INSERT OR IGNORE INTO capture_tags (capture_id, tag_id, applied_at)
            VALUES (?, ?, ?)
          `,
          captureId,
          tagId,
          appliedAt,
        );
      }
    });
  }

  async clearCaptureTags(captureId: string) {
    await this.db.runAsync('DELETE FROM capture_tags WHERE capture_id = ?', captureId);
  }

  async deleteTag(tagId: string) {
    await this.db.runAsync('DELETE FROM tags WHERE id = ?', tagId);
  }

  async findByCanonicalLabel(canonicalLabel: string) {
    return (
      (await this.db.getFirstAsync<TagRecord>(
        `
          SELECT
            id,
            label,
            canonical_label AS canonicalLabel,
            created_at AS createdAt,
            updated_at AS updatedAt,
            last_used_at AS lastUsedAt
          FROM tags
          WHERE canonical_label = ?
        `,
        canonicalLabel,
      )) ?? null
    );
  }

  async getById(tagId: string) {
    return (
      (await this.db.getFirstAsync<
        TagRecord & {
          captureCount: number;
        }
      >(
        `
          SELECT
            t.id,
            t.label,
            t.canonical_label AS canonicalLabel,
            t.created_at AS createdAt,
            t.updated_at AS updatedAt,
            t.last_used_at AS lastUsedAt,
            COUNT(ct.capture_id) AS captureCount
          FROM tags t
          LEFT JOIN capture_tags ct ON ct.tag_id = t.id
          WHERE t.id = ?
          GROUP BY t.id
        `,
        tagId,
      )) ?? null
    );
  }

  async listAll() {
    return this.db.getAllAsync<
      TagRecord & {
        captureCount: number;
      }
    >(`
      SELECT
        t.id,
        t.label,
        t.canonical_label AS canonicalLabel,
        t.created_at AS createdAt,
        t.updated_at AS updatedAt,
        t.last_used_at AS lastUsedAt,
        COUNT(ct.capture_id) AS captureCount
      FROM tags t
      LEFT JOIN capture_tags ct ON ct.tag_id = t.id
      GROUP BY t.id
      ORDER BY t.last_used_at DESC, t.label ASC
    `);
  }

  async listCaptureIds(tagId: string) {
    const rows = await this.db.getAllAsync<{ captureId: string }>(
      `
        SELECT capture_id AS captureId
        FROM capture_tags
        WHERE tag_id = ?
      `,
      tagId,
    );

    return rows.map((row) => row.captureId);
  }

  async getUsageSummary(limit: number) {
    const [topTags, usedTagCountRow] = await Promise.all([
      this.db.getAllAsync<
        TagRecord & {
          captureCount: number;
        }
      >(
        `
          SELECT
            t.id,
            t.label,
            t.canonical_label AS canonicalLabel,
            t.created_at AS createdAt,
            t.updated_at AS updatedAt,
            t.last_used_at AS lastUsedAt,
            COUNT(ct.capture_id) AS captureCount
          FROM tags t
          INNER JOIN capture_tags ct ON ct.tag_id = t.id
          GROUP BY t.id
          ORDER BY captureCount DESC, t.label ASC
          LIMIT ?
        `,
        limit,
      ),
      this.db.getFirstAsync<{ usedTagCount: number }>(
        `
          SELECT COUNT(*) AS usedTagCount
          FROM tags t
          WHERE EXISTS (
            SELECT 1
            FROM capture_tags ct
            WHERE ct.tag_id = t.id
          )
        `,
      ),
    ]);

    return {
      topTags,
      usedTagCount: usedTagCountRow?.usedTagCount ?? 0,
    };
  }

  async mergeTags(sourceTagId: string, targetTagId: string, mergedAt: number) {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `
          INSERT OR IGNORE INTO capture_tags (capture_id, tag_id, applied_at)
          SELECT capture_id, ?, ?
          FROM capture_tags
          WHERE tag_id = ?
        `,
        targetTagId,
        mergedAt,
        sourceTagId,
      );

      await this.db.runAsync('DELETE FROM capture_tags WHERE tag_id = ?', sourceTagId);
      await this.db.runAsync('DELETE FROM tags WHERE id = ?', sourceTagId);
      await this.touchTag(targetTagId, mergedAt);
    });
  }

  async renameTag(tagId: string, label: string, canonicalLabel: string, updatedAt: number) {
    await this.db.runAsync(
      `
        UPDATE tags
        SET
          label = ?,
          canonical_label = ?,
          updated_at = ?
        WHERE id = ?
      `,
      label,
      canonicalLabel,
      updatedAt,
      tagId,
    );
  }

  async touchTag(tagId: string, lastUsedAt: number) {
    await this.db.runAsync(
      `
        UPDATE tags
        SET
          last_used_at = ?,
          updated_at = ?
        WHERE id = ?
      `,
      lastUsedAt,
      lastUsedAt,
      tagId,
    );
  }

  async upsert(record: TagRecord) {
    await this.db.runAsync(
      `
        INSERT INTO tags (
          id,
          label,
          canonical_label,
          created_at,
          updated_at,
          last_used_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(canonical_label) DO UPDATE SET
          updated_at = excluded.updated_at,
          last_used_at = excluded.last_used_at
      `,
      record.id,
      record.label,
      record.canonicalLabel,
      record.createdAt,
      record.updatedAt,
      record.lastUsedAt,
    );
  }
}
