import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { DateTimeFieldPicker } from '@/components/reminders/DateTimeFieldPicker';
import { AppButton } from '@/components/primitives/AppButton';
import { AppChip } from '@/components/primitives/AppChip';
import { AppIconButton } from '@/components/primitives/AppIconButton';
import { AppInput } from '@/components/primitives/AppInput';
import { AppText } from '@/components/primitives/AppText';
import { GlassSurface } from '@/components/primitives/GlassSurface';
import { routes } from '@/constants/routes';
import { ImportAssetPreview } from '@/features/import/components/ImportAssetPreview';
import { useImportDraftStore } from '@/features/import/importDraft.store';
import { ImportService } from '@/modules/import/import.service';
import type { ImportDraftAsset } from '@/modules/import/import.types';
import { colors, radii, shadows, spacing } from '@/theme';

export function ImportReviewScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const importService = useMemo(() => new ImportService(db), [db]);
  const clearDraft = useImportDraftStore((state) => state.clearDraft);
  const removeSelectedAsset = useImportDraftStore((state) => state.removeSelectedAsset);
  const selectedAssetIds = useImportDraftStore((state) => state.selectedAssetIds);
  const selectedAssets = useImportDraftStore((state) => state.selectedAssets);
  const setDuplicateMatches = useImportDraftStore((state) => state.setDuplicateMatches);
  const setSharedReminder = useImportDraftStore((state) => state.setSharedReminder);
  const setSharedTagsInput = useImportDraftStore((state) => state.setSharedTagsInput);
  const sharedReminder = useImportDraftStore((state) => state.sharedReminder);
  const sharedTagsInput = useImportDraftStore((state) => state.sharedTagsInput);
  const [duplicateStatus, setDuplicateStatus] = useState<'idle' | 'loading'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);
  const lastDuplicateRefreshKeyRef = useRef<string | null>(null);
  const latestDuplicateRefreshKeyRef = useRef<string | null>(null);
  const reviewAssets = useMemo(
    () => selectedAssetIds.map((assetId) => selectedAssets[assetId]).filter(Boolean) as ImportDraftAsset[],
    [selectedAssetIds, selectedAssets],
  );
  const duplicateRefreshKey = useMemo(
    () =>
      selectedAssetIds
        .map((assetId) => {
          const asset = selectedAssets[assetId];

          if (!asset) {
            return `missing:${assetId}`;
          }

          return [
            asset.assetId,
            asset.mediaAssetId ?? '',
            asset.sourceUri,
            asset.filename ?? '',
            asset.capturedAt ?? '',
            asset.width ?? '',
            asset.height ?? '',
          ].join('|');
        })
        .join('||'),
    [selectedAssetIds, selectedAssets],
  );
  const duplicateAssetCount = useMemo(
    () => reviewAssets.filter((asset) => asset.duplicateMatches.length > 0).length,
    [reviewAssets],
  );
  const previewAsset = previewAssetId ? selectedAssets[previewAssetId] ?? null : null;

  useEffect(() => {
    let isMounted = true;

    async function loadDuplicateMatches() {
      if (reviewAssets.length === 0) {
        lastDuplicateRefreshKeyRef.current = null;
        latestDuplicateRefreshKeyRef.current = null;
        return;
      }

      if (lastDuplicateRefreshKeyRef.current === duplicateRefreshKey) {
        return;
      }

      lastDuplicateRefreshKeyRef.current = duplicateRefreshKey;
      latestDuplicateRefreshKeyRef.current = duplicateRefreshKey;
      setDuplicateStatus('loading');

      try {
        const requestKey = duplicateRefreshKey;
        const matchesByAssetId = await importService.refreshDuplicateMatches(reviewAssets);

        if (!isMounted || latestDuplicateRefreshKeyRef.current !== requestKey) {
          return;
        }

        setDuplicateMatches(matchesByAssetId);
      } catch {
        lastDuplicateRefreshKeyRef.current = null;
      } finally {
        if (isMounted) {
          setDuplicateStatus('idle');
        }
      }
    }

    void loadDuplicateMatches();

    return () => {
      isMounted = false;
    };
  }, [duplicateRefreshKey, importService, reviewAssets, setDuplicateMatches]);

  useEffect(() => {
    if (previewAssetId && !selectedAssets[previewAssetId]) {
      setPreviewAssetId(null);
    }
  }, [previewAssetId, selectedAssets]);

  async function handleSave() {
    if (reviewAssets.length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const result = await importService.importDraftSelection({
        assets: reviewAssets,
        sharedReminder,
        sharedTagsInput,
      });

      if (result.importedAssetIds.length > 0) {
        for (const assetId of result.importedAssetIds) {
          removeSelectedAsset(assetId);
        }
      }

      if (result.failedAssets.length > 0) {
        setSaveMessage(
          `Imported ${result.importedCaptureIds.length} Capture${result.importedCaptureIds.length === 1 ? '' : 's'}. ${result.failedAssets.length} item${result.failedAssets.length === 1 ? '' : 's'} could not be imported and remain in the batch.`,
        );
      } else {
        clearDraft();
        router.dismissTo(routes.library);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Import failed before any metadata was saved.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <AppIconButton onPress={() => router.back()}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </AppIconButton>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Add Capture</AppText>
            <AppText variant="title">Review</AppText>
          </View>
        </View>

        <GlassSurface style={styles.summaryCard} useBlur={false}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryCopy}>
              <AppText variant="title">{reviewAssets.length} ready to import</AppText>
              <AppText color={colors.textMuted}>
                Apply shared tags to all selected Captures, optionally add one reminder to all, and
                remove any suspected duplicates before saving.
              </AppText>
            </View>
            {duplicateStatus === 'loading' ? <ActivityIndicator color={colors.accent} /> : null}
          </View>
          {duplicateAssetCount > 0 ? (
            <GlassSurface style={styles.warningCard} useBlur={false} variant="inset">
              <AppText variant="action">
                {duplicateAssetCount} selected item{duplicateAssetCount === 1 ? '' : 's'} may already exist in
                the Library
              </AppText>
              <AppText color={colors.textMuted}>
                Duplicate detection is warning-only. Keep everything or remove individual items from
                this batch.
              </AppText>
            </GlassSurface>
          ) : null}
        </GlassSurface>

        {reviewAssets.length > 0 ? (
          <View style={styles.assetList}>
            {reviewAssets.map((asset) => (
              <GlassSurface key={asset.assetId} style={styles.assetCard} useBlur={false}>
                <ImportAssetPreview
                  accessibilityLabel={`Preview ${asset.filename ?? 'selected image'}`}
                  containerStyle={styles.assetPreview}
                  fallbackLabel="Preview unavailable for this Capture"
                  fallbackTestID={`review-preview-fallback-${asset.assetId}`}
                  imageTestID={`review-preview-image-${asset.assetId}`}
                  mediaAssetId={asset.mediaAssetId}
                  onPress={() => setPreviewAssetId(asset.assetId)}
                  pressable
                  previewUri={asset.previewUri}
                  sourceScheme={asset.sourceScheme}
                  sourceUri={asset.sourceUri}
                />
                <View style={styles.previewHintOverlay}>
                  <AppText color={colors.surface} variant="caption">
                    Tap to preview
                  </AppText>
                </View>
                <View style={styles.assetBody}>
                  <View style={styles.assetHeader}>
                    <View style={styles.assetCopy}>
                      <AppText numberOfLines={1} variant="action">
                        {asset.filename ?? 'Untitled image'}
                      </AppText>
                      <AppText color={colors.textMuted} numberOfLines={1} variant="caption">
                        {formatAssetMeta(asset)}
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => removeSelectedAsset(asset.assetId)}
                      style={styles.removeButton}
                    >
                      <AppText variant="caption">Remove</AppText>
                    </Pressable>
                  </View>

                  {asset.duplicateMatches.length > 0 ? (
                    <View style={styles.duplicateList}>
                      {asset.duplicateMatches.map((match) => (
                        <View key={`${asset.assetId}-${match.captureId}`} style={styles.duplicateRow}>
                          <AppText variant="caption">
                            {match.confidence.toUpperCase()}: {match.reason}
                          </AppText>
                          <AppText color={colors.textMuted} variant="caption">
                            Existing Capture imported {formatTimestamp(match.importedAt)}
                            {match.sourceFilename ? ` • ${match.sourceFilename}` : ''}
                          </AppText>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <AppText color={colors.textMuted} variant="caption">
                      No duplicate warning for this item.
                    </AppText>
                  )}
                </View>
              </GlassSurface>
            ))}
          </View>
        ) : null}

        {saveMessage ? (
          <GlassSurface style={styles.messageBanner} useBlur={false}>
            <AppText color={colors.text} variant="caption">
              {saveMessage}
            </AppText>
          </GlassSurface>
        ) : null}

        {saveError ? (
          <GlassSurface style={styles.errorBanner} useBlur={false}>
            <AppText color={colors.danger} variant="caption">
              {saveError}
            </AppText>
          </GlassSurface>
        ) : null}

        <GlassSurface style={styles.panel} useBlur={false}>
          <AppText variant="eyebrow">Shared tags</AppText>
          <AppInput
            autoCapitalize="none"
            onChangeText={setSharedTagsInput}
            placeholder="study, receipts, shopping"
            style={styles.input}
            value={sharedTagsInput}
          />
          <AppText color={colors.textMuted} variant="caption">
            Tags are normalized to lowercase canonical form. Emoji tags are supported.
          </AppText>
        </GlassSurface>

        <GlassSurface style={styles.panel} useBlur={false}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderCopy}>
              <AppText variant="eyebrow">Reminder to all</AppText>
              <AppText color={colors.textMuted} variant="caption">
                Optional. One date-and-time reminder can be applied to every selected Capture.
              </AppText>
            </View>
            <AppChip
              label={sharedReminder ? 'Clear' : 'Add reminder'}
              onPress={() =>
                setSharedReminder(sharedReminder ? null : { localDate: '', localTime: '' })
              }
            />
          </View>

          {sharedReminder ? (
            <View style={styles.reminderRow}>
              <View style={styles.reminderField}>
                <DateTimeFieldPicker
                  accessibilityLabel="Choose reminder date"
                  label="Date"
                  mode="date"
                  onChangeValue={(value) =>
                    setSharedReminder({
                      ...sharedReminder,
                      localDate: value,
                    })
                  }
                  placeholder="Choose a date"
                  testID="shared-reminder-date-field"
                  value={sharedReminder.localDate}
                />
              </View>
              <View style={styles.reminderField}>
                <DateTimeFieldPicker
                  accessibilityLabel="Choose reminder time"
                  label="Time"
                  mode="time"
                  onChangeValue={(value) =>
                    setSharedReminder({
                      ...sharedReminder,
                      localTime: value,
                    })
                  }
                  placeholder="Choose a time"
                  testID="shared-reminder-time-field"
                  value={sharedReminder.localTime}
                />
              </View>
            </View>
          ) : (
            <AppText color={colors.textMuted} variant="caption">
              Batch notes are intentionally not applied by default in MVP.
            </AppText>
          )}
        </GlassSurface>

        {reviewAssets.length === 0 ? (
          <GlassSurface style={styles.panel} useBlur={false}>
            <AppText variant="title">No media selected</AppText>
            <AppText color={colors.textMuted}>
              Go back to the picker to choose screenshots before saving.
            </AppText>
          </GlassSurface>
        ) : null}

        <AppButton
          disabled={reviewAssets.length === 0 || isSaving}
          onPress={() => void handleSave()}
          style={[styles.primaryButton, reviewAssets.length === 0 || isSaving ? styles.primaryButtonDisabled : null]}
        >
          {isSaving
            ? 'Saving...'
            : `Import ${reviewAssets.length} Capture${reviewAssets.length === 1 ? '' : 's'}`}
        </AppButton>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setPreviewAssetId(null)}
        transparent
        visible={previewAsset !== null}
      >
        <SafeAreaView style={styles.previewModalBackdrop}>
          <Pressable
            accessibilityLabel="Close preview"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setPreviewAssetId(null)}
            style={styles.previewModalCloseButton}
            testID="review-preview-close-button"
          >
            <Ionicons color={colors.surface} name="close" size={24} />
          </Pressable>
          <View style={styles.previewModalContent}>
            {previewAsset ? (
              <>
                <ImportAssetPreview
                  containerStyle={styles.previewModalImage}
                  fallbackLabel="Preview unavailable for this Capture"
                  fallbackTestID="review-preview-modal-fallback"
                  imageTestID="review-preview-modal-image"
                  mediaAssetId={previewAsset.mediaAssetId}
                  previewUri={previewAsset.previewUri}
                  sourceScheme={previewAsset.sourceScheme}
                  sourceUri={previewAsset.sourceUri}
                />
                <AppText color={colors.surface} style={styles.previewModalCaption} variant="caption">
                  {previewAsset.filename ?? 'Capture preview'} · tap outside or close to return
                </AppText>
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function formatAssetMeta(asset: ImportDraftAsset) {
  const parts = [
    asset.isLikelyScreenshot ? 'Likely screenshot' : 'Photo asset',
    asset.width && asset.height ? `${asset.width}×${asset.height}` : null,
    asset.capturedAt ? formatTimestamp(asset.capturedAt) : null,
  ].filter(Boolean);

  return parts.join(' • ');
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

const styles = StyleSheet.create({
  assetBody: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  assetCard: {
    overflow: 'hidden',
    ...shadows.sm,
  },
  assetCopy: {
    flex: 1,
    gap: 2,
  },
  assetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  assetList: {
    gap: spacing.md,
  },
  assetPreview: {
    aspectRatio: 1.1,
    minHeight: 232,
    width: '100%',
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  duplicateList: {
    gap: spacing.xs,
  },
  duplicateRow: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    gap: 2,
    padding: spacing.sm,
  },
  errorBanner: {
    padding: spacing.md,
  },
  headerCopy: {
    gap: 2,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    minHeight: 52,
  },
  messageBanner: {
    padding: spacing.md,
  },
  panel: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  panelHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  panelHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  previewHintOverlay: {
    backgroundColor: 'rgba(32, 26, 22, 0.72)',
    borderRadius: 999,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    position: 'absolute',
    top: spacing.md,
  },
  previewModalBackdrop: {
    backgroundColor: 'rgba(32, 26, 22, 0.96)',
    flex: 1,
  },
  previewModalCaption: {
    textAlign: 'center',
  },
  previewModalCloseButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 253, 248, 0.18)',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    marginRight: spacing.lg,
    marginTop: spacing.sm,
    width: 42,
  },
  previewModalContent: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  previewModalImage: {
    aspectRatio: 0.72,
    borderRadius: radii.xl,
    minHeight: 520,
    width: '100%',
  },
  primaryButton: {},
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonLabel: {},
  reminderInput: {
    flex: 1,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reminderField: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryButton: {},
  summaryCard: {
    gap: spacing.sm,
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  warningCard: {
    gap: spacing.xs,
    padding: spacing.md,
  },
});
