import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { routes } from '@/constants/routes';
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
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvingAssetIds, setResolvingAssetIds] = useState<Record<string, boolean>>({});
  const selectedAssetIdSet = useMemo(() => new Set(selectedAssetIds), [selectedAssetIds]);

  const loadAssetsPage = useCallback(async (reset: boolean) => {
    if (isLoadingAssets) {
      return;
    }

    setIsLoadingAssets(true);
    setLoadError(null);

    try {
      const page = await mediaGateway.loadPhotoAssetsPage({
        after: reset ? null : endCursor,
      });

      setAssets((current) => (reset ? page.assets : [...current, ...page.assets]));
      setEndCursor(page.endCursor);
      setHasNextPage(page.hasNextPage);
    } catch {
      setLoadError('Media could not be loaded from the device library.');
    } finally {
      setIsLoadingAssets(false);
    }
  }, [endCursor, isLoadingAssets, mediaGateway]);

  useEffect(() => {
    let isMounted = true;

    async function loadPermissionState() {
      const nextPermission = await mediaGateway.getPermissionState();

      if (!isMounted) {
        return;
      }

      setPermission(nextPermission);

      if (nextPermission?.granted) {
        await loadAssetsPage(true);
      }
    }

    void loadPermissionState();

    return () => {
      isMounted = false;
    };
  }, [loadAssetsPage, mediaGateway]);

  async function requestAccess() {
    setIsRequestingPermission(true);

    try {
      const nextPermission = await mediaGateway.requestPermission();
      setPermission(nextPermission);

      if (nextPermission.granted) {
        await loadAssetsPage(true);
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

  const showPermissionGate = !permission?.granted;
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

        {showPermissionGate ? (
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
                if (hasNextPage) {
                  void loadAssetsPage(false);
                }
              }}
              onEndReachedThreshold={0.6}
              renderItem={({ item }) => {
                const isSelected = selectedAssetIdSet.has(item.assetId);
                const isResolving = Boolean(resolvingAssetIds[item.assetId]);

                return (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void handleSelectAsset(item)}
                    style={[styles.assetTile, isSelected ? styles.assetTileSelected : null]}
                  >
                    <Image source={{ uri: item.previewUri }} style={styles.assetImage} />
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
                isLoadingAssets ? (
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
                isLoadingAssets && assets.length > 0 ? (
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
    flex: 1,
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
