import { useImportDraftStore } from '@/features/import/importDraft.store';

import { createDuplicateMatch, createImportDraftAsset } from '@/tests/support/fixtures';

describe('useImportDraftStore', () => {
  beforeEach(() => {
    useImportDraftStore.getState().clearDraft();
  });

  it('adds and re-upserts assets without duplicating selected ids', () => {
    const asset = createImportDraftAsset();
    const updatedAsset = createImportDraftAsset({ duplicateMatches: [createDuplicateMatch()] });

    useImportDraftStore.getState().upsertSelectedAsset(asset);
    useImportDraftStore.getState().upsertSelectedAsset(updatedAsset);

    const state = useImportDraftStore.getState();
    expect(state.selectedAssetIds).toEqual(['asset-1']);
    expect(state.selectedAssets['asset-1'].duplicateMatches).toHaveLength(1);
  });

  it('removes assets, clears drafts, and updates shared metadata', () => {
    const asset = createImportDraftAsset();

    useImportDraftStore.getState().upsertSelectedAsset(asset);
    useImportDraftStore.getState().setSharedTagsInput('study');
    useImportDraftStore.getState().setSharedReminder({ localDate: '2026-03-05', localTime: '09:30' });
    useImportDraftStore.getState().setDuplicateMatches({
      'asset-1': [createDuplicateMatch({ confidence: 'high' })],
    });

    let state = useImportDraftStore.getState();
    expect(state.sharedTagsInput).toBe('study');
    expect(state.sharedReminder).toEqual({ localDate: '2026-03-05', localTime: '09:30' });
    expect(state.selectedAssets['asset-1'].duplicateMatches[0].confidence).toBe('high');

    useImportDraftStore.getState().removeSelectedAsset('asset-1');
    state = useImportDraftStore.getState();
    expect(state.selectedAssetIds).toEqual([]);
    expect(state.selectedAssets).toEqual({});

    useImportDraftStore.getState().upsertSelectedAsset(asset);
    useImportDraftStore.getState().clearDraft();
    state = useImportDraftStore.getState();
    expect(state.selectedAssetIds).toEqual([]);
    expect(state.sharedTagsInput).toBe('');
    expect(state.sharedReminder).toBeNull();
  });
});
