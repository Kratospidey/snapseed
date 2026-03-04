import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/utils/ids';
import { normalizeTagLabel } from '@/utils/strings';

import { SearchService } from '../search/search.service';
import { TagRepository } from './tag.repository';

export class TagService {
  private readonly searchService: SearchService;
  private readonly tagRepository: TagRepository;

  constructor(db: SQLiteDatabase) {
    this.searchService = new SearchService(db);
    this.tagRepository = new TagRepository(db);
  }

  async deleteTag(tagId: string) {
    await this.tagRepository.deleteTag(tagId);
  }

  async renameOrMergeTag(tagId: string, nextLabel: string) {
    const normalizedLabel = normalizeTagLabel(nextLabel);
    const existing = await this.tagRepository.findByCanonicalLabel(normalizedLabel);
    const now = Date.now();

    if (existing && existing.id !== tagId) {
      await this.tagRepository.mergeTags(tagId, existing.id, now);
      return existing.id;
    }

    await this.tagRepository.renameTag(tagId, normalizedLabel, normalizedLabel, now);
    return tagId;
  }

  async replaceCaptureTags(captureId: string, labels: string[], appliedAt: number = Date.now()) {
    const uniqueLabels = [...new Set(labels.map(normalizeTagLabel).filter(Boolean))];
    const tagIds: string[] = [];

    await this.tagRepository.clearCaptureTags(captureId);

    for (const label of uniqueLabels) {
      const existing = await this.tagRepository.findByCanonicalLabel(label);
      const tagId = existing?.id ?? createId('tag');

      await this.tagRepository.upsert({
        canonicalLabel: label,
        createdAt: existing?.createdAt ?? appliedAt,
        id: tagId,
        label,
        lastUsedAt: appliedAt,
        updatedAt: appliedAt,
      });

      tagIds.push(tagId);
    }

    await this.tagRepository.attachTagsToCapture(captureId, tagIds, appliedAt);
    await this.searchService.reindexCapture(captureId);

    return tagIds;
  }
}

