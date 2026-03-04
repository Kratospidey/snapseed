import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { routes } from '@/constants/routes';
import { CaptureService } from '@/modules/captures/capture.service';
import {
  librarySmartViewSchema,
  type LibrarySortOption,
  type LibrarySmartView,
} from '@/modules/captures/capture.types';
import { SettingsService } from '@/modules/settings/settings.service';
import { TagService } from '@/modules/tags/tag.service';
import { GraveyardService } from '@/modules/graveyard/graveyard.service';
import type { LibraryViewMode } from '@/types/domain';

import type { LibraryScreenData } from '../types';

type UseLibraryScreenParams = {
  smartViewParam?: string;
};

const DEFAULT_SMART_VIEW: LibrarySmartView = 'recent';
const DEFAULT_VIEW_MODE: LibraryViewMode = 'grid';

export function useLibraryScreen({ smartViewParam }: UseLibraryScreenParams) {
  const router = useRouter();
  const db = useSQLiteContext();
  const captureService = useMemo(() => new CaptureService(db), [db]);
  const graveyardService = useMemo(() => new GraveyardService(db), [db]);
  const settingsService = useMemo(() => new SettingsService(db), [db]);
  const tagService = useMemo(() => new TagService(db), [db]);
  const parsedSmartView = librarySmartViewSchema.safeParse(smartViewParam);
  const smartView = parsedSmartView.success ? parsedSmartView.data : DEFAULT_SMART_VIEW;
  const [sort, setSort] = useState<LibrarySortOption>(getDefaultSortForSmartView(smartView));
  const [viewMode, setViewMode] = useState<LibraryViewMode>(DEFAULT_VIEW_MODE);
  const [data, setData] = useState<LibraryScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    void settingsService.getLibraryInitialViewMode().then((nextMode) => {
      setViewMode(nextMode);
    });
  }, [settingsService]);

  useEffect(() => {
    const nextDefaultSort = getDefaultSortForSmartView(smartView);

    setSort((currentSort) => {
      if (currentSort === 'reminder_due_asc' && smartView !== 'reminders') {
        return nextDefaultSort;
      }

      if (currentSort === 'imported_desc' && smartView === 'reminders') {
        return nextDefaultSort;
      }

      return currentSort;
    });
  }, [smartView]);

  const load = useCallback(
    async (refreshing: boolean) => {
      if (refreshing) {
        setIsRefreshing(true);
        try {
          await graveyardService.runIntegrityScan({ limit: 60 });
        } catch {
          // Continue loading feed even if background integrity check fails.
        }
      } else {
        setIsLoading(true);
      }

      const [feed, smartCounts, tagUsageSummary] = await Promise.all([
        captureService.getLibraryFeed({
          limit: 160,
          smartView,
          sort,
        }),
        captureService.getSmartCounts(),
        tagService.getUsageSummary(3),
      ]);

      setData({
        activeTagCount: tagUsageSummary.usedTagCount,
        feed,
        graveyardCount: smartCounts.graveyardCount,
        reminderCount: smartCounts.reminderCount,
        smartView,
        topTags: tagUsageSummary.topTags.map((tag) => ({
          captureCount: tag.captureCount,
          id: tag.id,
          label: tag.label,
        })),
        totalCount: smartCounts.totalCount,
        unsortedCount: smartCounts.unsortedCount,
        viewMode,
      });
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [captureService, graveyardService, smartView, sort, tagService, viewMode],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const updateViewMode = useCallback(
    (nextMode: LibraryViewMode) => {
      setViewMode(nextMode);
      setData((currentData) => (currentData ? { ...currentData, viewMode: nextMode } : currentData));
      void settingsService.setLibraryLastViewMode(nextMode);
    },
    [settingsService],
  );

  const openCapture = useCallback(
    (captureId: string) => {
      router.push(routes.captureDetail(captureId));
    },
    [router],
  );

  const openImport = useCallback(() => {
    router.push(routes.importPicker);
  }, [router]);

  const setSmartView = useCallback(
    (nextSmartView: LibrarySmartView) => {
      router.replace(`/library?smartView=${nextSmartView}`);
    },
    [router],
  );

  const openTagsLibrary = useCallback(() => {
    router.push(routes.tags);
  }, [router]);

  return {
    data,
    isLoading,
    isRefreshing,
    openCapture,
    openImport,
    openTagsLibrary,
    refresh: () => load(true),
    setSmartView,
    setSort,
    setViewMode: updateViewMode,
    sort,
    smartView,
    viewMode,
  };
}

function getDefaultSortForSmartView(smartView: LibrarySmartView): LibrarySortOption {
  if (smartView === 'reminders') {
    return 'reminder_due_asc';
  }

  return 'imported_desc';
}
