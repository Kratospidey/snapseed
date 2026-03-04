import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { ImportAssetPreview } from '@/features/import/components/ImportAssetPreview';
import { CaptureService } from '@/modules/captures/capture.service';
import { GraveyardService } from '@/modules/graveyard/graveyard.service';
import { MediaGateway } from '@/modules/media/media.gateway';
import type { MediaPickerAsset, MediaPermissionState } from '@/modules/media/media.types';
import { colors, spacing } from '@/theme';

export function RelinkModalScreen() {
  const { captureId } = useLocalSearchParams<{ captureId?: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const captureService = useMemo(() => new CaptureService(db), [db]);
  const graveyardService = useMemo(() => new GraveyardService(db), [db]);
  const mediaGateway = useMemo(() => new MediaGateway(), []);
  const [capture, setCapture] = useState<Awaited<ReturnType<CaptureService['getCaptureDetail']>> | null>(null);
  const [permission, setPermission] = useState<MediaPermissionState>(null);
  const [assets, setAssets] = useState<MediaPickerAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endCursorRef = useRef<string | null>(null);
  const hasNextPageRef = useRef(true);
  const isLoadingMoreRef = useRef(false);

  const selectedAsset = selectedAssetId ? assets.find((asset) => asset.assetId === selectedAssetId) ?? null : null;
  const showPermissionGate = !isLoading && !permission?.granted;
  const isDenied = permission?.canAskAgain === false && permission?.status === 'denied';

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (!captureId) {
        if (isMounted) {
          setError('Capture route is invalid for relink.');
          setIsLoading(false);
        }

        return;
      }

      try {
        const [detail, permissionState] = await Promise.all([
          captureService.getCaptureDetail(captureId),
          mediaGateway.getPermissionState(),
        ]);

        if (!isMounted) {
          return;
        }

        setCapture(detail);
        setPermission(permissionState);

        if (permissionState?.granted) {
          const firstPage = await mediaGateway.loadPhotoAssetsPage({ first: 90 });

          if (!isMounted) {
            return;
          }

          endCursorRef.current = firstPage.endCursor;
          hasNextPageRef.current = firstPage.hasNextPage;
          setAssets(firstPage.assets);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Relink assets could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [captureId, captureService, mediaGateway]);

  async function requestPermission() {
    setError(null);

    try {
      const nextPermission = await mediaGateway.requestPermission();
      setPermission(nextPermission);

      if (!nextPermission.granted) {
        return;
      }

      const firstPage = await mediaGateway.loadPhotoAssetsPage({ first: 90 });
      endCursorRef.current = firstPage.endCursor;
      hasNextPageRef.current = firstPage.hasNextPage;
      setAssets(firstPage.assets);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Photo access could not be requested.');
    }
  }

  async function loadMore() {
    if (!permission?.granted || !hasNextPageRef.current || isLoadingMoreRef.current) {
      return;
    }

    isLoadingMoreRef.current = true;

    try {
      const page = await mediaGateway.loadPhotoAssetsPage({
        after: endCursorRef.current,
      });
      endCursorRef.current = page.endCursor;
      hasNextPageRef.current = page.hasNextPage;
      setAssets((current) => {
        const nextMap = new Map(current.map((item) => [item.assetId, item]));

        for (const asset of page.assets) {
          nextMap.set(asset.assetId, asset);
        }

        return [...nextMap.values()];
      });
    } catch {
      // Keep existing list and allow user to continue with loaded assets.
    } finally {
      isLoadingMoreRef.current = false;
    }
  }

  async function handleRelink() {
    if (!captureId || !selectedAsset) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const replacementAsset = await mediaGateway.resolveAssetForImport(selectedAsset);

      await graveyardService.relinkCaptureSource({
        captureId,
        replacementAsset,
      });
      router.back();
    } catch (relinkError) {
      setError(relinkError instanceof Error ? relinkError.message : 'Capture could not be relinked.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    if (isSaving) {
      return;
    }

    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={handleClose} style={styles.iconButton}>
            <Ionicons color={colors.text} name="close" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Graveyard</AppText>
            <AppText variant="title">Relink original</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText variant="action">{capture?.sourceFilename ?? 'Capture'}</AppText>
          <AppText color={colors.textMuted}>
            Select a replacement image. SnapBrain keeps all current tags, note, reminders, and metadata.
          </AppText>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <AppText color={colors.danger} variant="caption">
              {error}
            </AppText>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centerCard}>
            <ActivityIndicator color={colors.accent} />
            <AppText color={colors.textMuted}>Loading relink options...</AppText>
          </View>
        ) : showPermissionGate ? (
          <View style={styles.centerCard}>
            <AppText variant="title">{isDenied ? 'Photo access needed' : 'Allow photo access'}</AppText>
            <AppText color={colors.textMuted}>
              SnapBrain needs photo-library access so you can choose a replacement source for this Capture.
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => void (isDenied ? Linking.openSettings() : requestPermission())}
              style={styles.primaryButton}
            >
              <AppText color={colors.surface} variant="action">
                {isDenied ? 'Open Settings' : 'Allow access'}
              </AppText>
            </Pressable>
          </View>
        ) : (
          <FlatList
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.grid}
            data={assets}
            keyExtractor={(item) => item.assetId}
            numColumns={3}
            onEndReached={() => {
              void loadMore();
            }}
            onEndReachedThreshold={0.6}
            renderItem={({ item }) => {
              const isSelected = item.assetId === selectedAssetId;

              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedAssetId(item.assetId)}
                  style={[styles.assetTile, isSelected ? styles.assetTileSelected : null]}
                >
                  <ImportAssetPreview
                    containerStyle={styles.assetPreview}
                    fallbackLabel="Preview unavailable"
                    mediaAssetId={item.assetId}
                    previewUri={item.previewUri}
                    sourceUri={item.previewUri}
                  />
                  <View style={[styles.selectionDot, isSelected ? styles.selectionDotActive : null]} />
                </Pressable>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable
          accessibilityRole="button"
          disabled={!selectedAsset || isSaving}
          onPress={() => void handleRelink()}
          style={[styles.primaryButton, (!selectedAsset || isSaving) && styles.buttonDisabled]}
        >
          <AppText color={colors.surface} variant="action">
            {isSaving ? 'Relinking...' : 'Relink Capture'}
          </AppText>
        </Pressable>

        <Pressable accessibilityRole="button" disabled={isSaving} onPress={handleClose} style={styles.secondaryButton}>
          <AppText variant="caption">Cancel</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  assetPreview: {
    height: '100%',
    width: '100%',
  },
  assetTile: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  assetTileSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  centerCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 180,
    justifyContent: 'center',
    padding: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  errorBanner: {
    backgroundColor: '#FDECEA',
    borderColor: '#E6B4AE',
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.sm,
  },
  grid: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  gridRow: {
    gap: spacing.md,
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  selectionDot: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 20,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 20,
  },
  selectionDotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
