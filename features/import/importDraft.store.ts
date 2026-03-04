import { create } from 'zustand';

import type { ImportDraftAsset, ImportDuplicateMatch, ImportReminderDraft } from '@/modules/import/import.types';

type ImportDraftState = {
  clearDraft: () => void;
  removeSelectedAsset: (assetId: string) => void;
  selectedAssetIds: string[];
  selectedAssets: Record<string, ImportDraftAsset>;
  setDuplicateMatches: (matchesByAssetId: Record<string, ImportDuplicateMatch[]>) => void;
  setSharedReminder: (reminder: ImportReminderDraft | null) => void;
  setSharedTagsInput: (value: string) => void;
  sharedReminder: ImportReminderDraft | null;
  sharedTagsInput: string;
  upsertSelectedAsset: (asset: ImportDraftAsset) => void;
};

const INITIAL_STATE = {
  selectedAssetIds: [],
  selectedAssets: {},
  sharedReminder: null,
  sharedTagsInput: '',
} satisfies Pick<
  ImportDraftState,
  'selectedAssetIds' | 'selectedAssets' | 'sharedReminder' | 'sharedTagsInput'
>;

export const useImportDraftStore = create<ImportDraftState>((set) => ({
  ...INITIAL_STATE,
  clearDraft: () => set(INITIAL_STATE),
  removeSelectedAsset: (assetId) =>
    set((state) => {
      const nextAssets = { ...state.selectedAssets };
      delete nextAssets[assetId];

      return {
        selectedAssetIds: state.selectedAssetIds.filter((id) => id !== assetId),
        selectedAssets: nextAssets,
      };
    }),
  setDuplicateMatches: (matchesByAssetId) =>
    set((state) => {
      const nextAssets = { ...state.selectedAssets };

      for (const assetId of Object.keys(matchesByAssetId)) {
        const existing = nextAssets[assetId];

        if (!existing) {
          continue;
        }

        nextAssets[assetId] = {
          ...existing,
          duplicateMatches: matchesByAssetId[assetId] ?? [],
        };
      }

      return {
        selectedAssets: nextAssets,
      };
    }),
  setSharedReminder: (sharedReminder) => set({ sharedReminder }),
  setSharedTagsInput: (sharedTagsInput) => set({ sharedTagsInput }),
  upsertSelectedAsset: (asset) =>
    set((state) => ({
      selectedAssetIds: state.selectedAssets[asset.assetId]
        ? state.selectedAssetIds
        : [...state.selectedAssetIds, asset.assetId],
      selectedAssets: {
        ...state.selectedAssets,
        [asset.assetId]: asset,
      },
    })),
}));
