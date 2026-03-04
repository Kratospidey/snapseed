import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { routes } from '@/constants/routes';
import { ImportAssetPreview } from '@/features/import/components/ImportAssetPreview';
import { useImportDraftStore } from '@/features/import/importDraft.store';
import { ImportService } from '@/modules/import/import.service';
import { MediaGateway } from '@/modules/media/media.gateway';
import type { MediaPickerAsset, MediaPermissionState } from '@/modules/media/media.types';
import { colors, spacing } from '@/theme';

export function ImportPickerScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const importService = useMemo(() => new ImportService(db), [db]);
  const mediaGateway = useMemo(() => new MediaGateway(), []);
  const clearDraft = useImportDraftStore((state) => state.clearDraft);
  const removeSelectedAsset = useImportDraftStore((state) => state.removeSelectedAsset);
  const selectedAssetIds = useImportDraftStore((state) => state.selectedAssetIds);
  const upsertSelectedAsset = useImportDraftStore((state) => state.upsertSelectedAsset);
  const [permission, setPermission] = useState<MediaPermissionState>(null);
  const [assets, setAssets] = useState<MediaPickerAsset[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [isLoadingInitialAssets, setIsLoadingInitialAssets] = useState(false);
  const [isLoadingMoreAssets, setIsLoadingMoreAssets] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvingAssetIds, setResolvingAssetIds] = useState<Record<string, boolean>>({});
  const endCursorRef = useRef<string | null>(null);
  const isLoadingInitialAssetsRef = useRef(false);
  const isLoadingMoreAssetsRef = useRef(false);
  const isMountedRef = useRef(true);
  const resolvingAssetIdsRef = useRef<Record<string, boolean>>({});
  const selectedAssetIdSet = useMemo(() => new Set(selectedAssetIds), [selectedAssetIds]);

  const applyAssetPage = useCallback((page: { assets: MediaPickerAsset[]; endCursor: string | null; hasNextPage: boolean }, reset: boolean) => {
    endCursorRef.current = page.endCursor;
    setHasNextPage(page.hasNextPage);
    setAssets((current) => {
      if (reset) {
        return page.assets;
      }

      const nextAssets = new Map(current.map((asset) => [asset.assetId, asset]));

      for (const asset of page.assets) {
        nextAssets.set(asset.assetId, asset);
      }

      return [...nextAssets.values()];
    });
  }, []);

  const updatePermissionState = useCallback((nextPermission: MediaPermissionState) => {
    setPermission((current) => (arePermissionsEqual(current, nextPermission) ? current : nextPermission));
  }, []);

  const loadInitialAssets = useCallback(async () => {
    if (isLoadingInitialAssetsRef.current) {
      return;
    }

    isLoadingInitialAssetsRef.current = true;
    setIsLoadingInitialAssets(true);
    setLoadError(null);

    try {
      const page = await mediaGateway.loadPhotoAssetsPage();

      if (!isMountedRef.current) {
        return;
      }

      applyAssetPage(page, true);
    } catch {
      if (isMountedRef.current) {
        setAssets([]);
        setHasNextPage(false);
        endCursorRef.current = null;
        setLoadError('Media could not be loaded from the device library.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingInitialAssets(false);
      }

      isLoadingInitialAssetsRef.current = false;
    }
  }, [applyAssetPage, mediaGateway]);

  const loadMoreAssets = useCallback(async () => {
    if (isLoadingInitialAssetsRef.current || isLoadingMoreAssetsRef.current || !hasNextPage) {
      return;
    }

    isLoadingMoreAssetsRef.current = true;
    setIsLoadingMoreAssets(true);
    setLoadError(null);

    try {
      const page = await mediaGateway.loadPhotoAssetsPage({
        after: endCursorRef.current,
      });

      if (!isMountedRef.current) {
        return;
      }

      applyAssetPage(page, false);
    } catch {
      if (isMountedRef.current) {
        setLoadError('More media could not be loaded from the device library.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMoreAssets(false);
      }

      isLoadingMoreAssetsRef.current = false;
    }
  }, [applyAssetPage, hasNextPage, mediaGateway]);

  useEffect(() => {
    isMountedRef.current = true;

    async function bootstrapPicker() {
      try {
        const nextPermission = await mediaGateway.getPermissionState();

        if (!isMountedRef.current) {
          return;
        }

        updatePermissionState(nextPermission);

        if (nextPermission?.granted) {
          await loadInitialAssets();
        }
      } finally {
        if (isMountedRef.current) {
          setIsCheckingPermission(false);
        }
      }
    }

    void bootstrapPicker();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadInitialAssets, mediaGateway, updatePermissionState]);

  async function requestAccess() {
    setIsRequestingPermission(true);

    try {
      const nextPermission = await mediaGateway.requestPermission();
      updatePermissionState(nextPermission);

      if (nextPermission.granted) {
        await loadInitialAssets();
      }
    } finally {
      setIsRequestingPermission(false);
    }
  }

  async function handleSelectAsset(asset: MediaPickerAsset) {
    if (selectedAssetIdSet.has(asset.assetId)) {
      removeSelectedAsset(asset.assetId);
      return;
    }

    if (resolvingAssetIdsRef.current[asset.assetId]) {
      return;
    }

    resolvingAssetIdsRef.current = { ...resolvingAssetIdsRef.current, [asset.assetId]: true };
    setResolvingAssetIds((current) => ({ ...current, [asset.assetId]: true }));
    setLoadError(null);

    try {
      const draftAsset = await importService.createDraftAsset(asset);
      upsertSelectedAsset(draftAsset);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'This media item could not be prepared for import.');
    } finally {
      setResolvingAssetIds((current) => {
        const next = { ...current };
        delete next[asset.assetId];
        resolvingAssetIdsRef.current = next;
        return next;
      });
    }
  }

  function handleClose() {
    if (selectedAssetIds.length === 0) {
      clearDraft();
      router.back();
      return;
    }

    Alert.alert('Discard import draft?', 'Selected media and batch metadata will be cleared.', [
      { style: 'cancel', text: 'Keep draft' },
      {
        style: 'destructive',
        text: 'Discard',
        onPress: () => {
          clearDraft();
          router.back();
        },
      },
    ]);
  }

  const showPermissionGate = !isCheckingPermission && !permission?.granted;
  const isDenied = permission?.canAskAgain === false && permission?.status === 'denied';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={handleClose} style={styles.iconButton}>
            <Ionicons color={colors.text} name="close" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Add Capture</AppText>
            <AppText variant="title">Import picker</AppText>
          </View>
        </View>

        <View style={styles.selectionSummary}>
          <View style={styles.selectionCopy}>
            <AppText variant="title">{selectedAssetIds.length} selected</AppText>
            <AppText color={colors.textMuted}>
              Multi-select recent screenshots and similar images, then review shared tags and reminder
              before saving.
            </AppText>
          </View>
          {permission?.accessPrivileges === 'limited' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void mediaGateway.openLimitedAccessPicker()}
              style={styles.secondaryChip}
            >
              <AppText variant="caption">Manage Access</AppText>
            </Pressable>
          ) : null}
        </View>

        {loadError ? (
          <View style={styles.errorBanner}>
            <AppText color={colors.danger} variant="caption">
              {loadError}
            </AppText>
          </View>
        ) : null}

        {isCheckingPermission ? (
          <View style={styles.panel}>
            <ActivityIndicator color={colors.accent} />
            <AppText color={colors.textMuted}>Checking photo access...</AppText>
          </View>
        ) : showPermissionGate ? (
          <View style={styles.panel}>
            <AppText variant="title">{isDenied ? 'Photo access needed' : 'Allow photo access'}</AppText>
            <AppText color={colors.textMuted}>
              SnapBrain uses the device media library so you can choose screenshots to import as
              Captures without copying the originals into app storage.
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => void (isDenied ? Linking.openSettings() : requestAccess())}
              style={styles.primaryButton}
            >
              <AppText style={styles.primaryButtonLabel} variant="action">
                {isDenied ? 'Open Settings' : isRequestingPermission ? 'Requesting Access...' : 'Allow Photo Access'}
              </AppText>
            </Pressable>
          </View>
        ) : (
          <>
            <FlatList
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.assetGrid}
              data={assets}
              keyExtractor={(item) => item.assetId}
              numColumns={3}
              onEndReached={() => {
                if (permission?.granted && hasNextPage && !isLoadingInitialAssets && !isLoadingMoreAssets) {
                  void loadMoreAssets();
                }
              }}
              onEndReachedThreshold={0.6}
              renderItem={({ item }) => {
                const isSelected = selectedAssetIdSet.has(item.assetId);
                const isResolving = Boolean(resolvingAssetIds[item.assetId]);

                return (
                  <Pressable
                    accessibilityLabel={`Select ${item.filename ?? 'media item'}`}
                    accessibilityRole="button"
                    onPress={() => void handleSelectAsset(item)}
                    style={[styles.assetTile, isSelected ? styles.assetTileSelected : null]}
                    testID={`picker-asset-tile-${item.assetId}`}
                  >
                    <ImportAssetPreview
                      containerStyle={styles.assetImage}
                      fallbackTestID={`picker-preview-fallback-${item.assetId}`}
                      imageTestID={`picker-preview-image-${item.assetId}`}
                      mediaAssetId={item.assetId}
                      previewUri={item.previewUri}
                      sourceUri={item.previewUri}
                    />
                    {item.isLikelyScreenshot ? (
                      <View style={styles.screenshotBadge}>
                        <AppText color={colors.surface} variant="caption">
                          Screenshot
                        </AppText>
                      </View>
                    ) : null}
                    <View style={styles.assetOverlay}>
                      <View style={[styles.checkBadge, isSelected ? styles.checkBadgeSelected : null]}>
                        {isResolving ? (
                          <ActivityIndicator color={colors.surface} size="small" />
                        ) : isSelected ? (
                          <Ionicons color={colors.surface} name="checkmark" size={16} />
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                isLoadingInitialAssets ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator color={colors.accent} />
                    <AppText color={colors.textMuted}>Loading recent media...</AppText>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <AppText variant="title">No photos available</AppText>
                    <AppText color={colors.textMuted}>
                      SnapBrain needs visible photo assets to start an import batch.
                    </AppText>
                  </View>
                )
              }
              ListFooterComponent={
                isLoadingMoreAssets && assets.length > 0 ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator color={colors.accent} />
                  </View>
                ) : null
              }
            />

            <Pressable
              accessibilityRole="button"
              disabled={selectedAssetIds.length === 0}
              onPress={() => router.push(routes.importReview)}
              style={[styles.primaryButton, selectedAssetIds.length === 0 ? styles.primaryButtonDisabled : null]}
              testID="import-picker-review-button"
            >
              <AppText style={styles.primaryButtonLabel} variant="action">
                Review {selectedAssetIds.length > 0 ? `${selectedAssetIds.length} Capture${selectedAssetIds.length === 1 ? '' : 's'}` : 'selection'}
              </AppText>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  assetGrid: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  assetImage: {
    ...StyleSheet.absoluteFillObject,
  },
  assetOverlay: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    left: 0,
    padding: spacing.xs,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  assetTile: {
    aspectRatio: 0.72,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minHeight: 168,
    overflow: 'hidden',
  },
  assetTileSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(32, 26, 22, 0.28)',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkBadgeSelected: {
    backgroundColor: colors.accent,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  footerLoading: {
    paddingVertical: spacing.md,
  },
  gridRow: {
    gap: spacing.sm,
  },
  headerCopy: {
    gap: 2,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonLabel: {
    color: colors.surface,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screenshotBadge: {
    backgroundColor: 'rgba(32, 26, 22, 0.76)',
    borderRadius: 999,
    left: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    position: 'absolute',
    top: spacing.xs,
  },
  secondaryChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  selectionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  selectionSummary: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
});

function arePermissionsEqual(current: MediaPermissionState, next: MediaPermissionState) {
  if (!current || !next) {
    return current === next;
  }

  return (
    current.accessPrivileges === next.accessPrivileges &&
    current.canAskAgain === next.canAskAgain &&
    current.granted === next.granted &&
    current.status === next.status
  );
}
