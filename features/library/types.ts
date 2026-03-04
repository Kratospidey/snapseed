import type { LibraryCaptureRecord, LibrarySortOption, LibrarySmartView } from '@/modules/captures/capture.types';
import type { LibraryViewMode } from '@/types/domain';

export type LibraryFeedItem = LibraryCaptureRecord;

export type LibraryScreenData = {
  activeTagCount: number;
  feed: LibraryFeedItem[];
  graveyardCount: number;
  reminderCount: number;
  smartView: LibrarySmartView;
  topTags: Array<{
    captureCount: number;
    id: string;
    label: string;
  }>;
  totalCount: number;
  unsortedCount: number;
  viewMode: LibraryViewMode;
};

export type LibrarySortDescriptor = {
  label: string;
  value: LibrarySortOption;
};
