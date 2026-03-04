import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { routes } from '@/constants/routes';
import { useImportDraftStore } from '@/features/import/importDraft.store';
import { ImportService } from '@/modules/import/import.service';
import type { ImportDraftAsset } from '@/modules/import/import.types';
import { colors, spacing } from '@/theme';

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
  const reviewAssets = useMemo(
    () => selectedAssetIds.map((assetId) => selectedAssets[assetId]).filter(Boolean) as ImportDraftAsset[],
    [selectedAssetIds, selectedAssets],
  );
  const duplicateAssetCount = useMemo(
    () => reviewAssets.filter((asset) => asset.duplicateMatches.length > 0).length,
    [reviewAssets],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDuplicateMatches() {
      if (reviewAssets.length === 0) {
        return;
      }

      setDuplicateStatus('loading');

      try {
        const matchesByAssetId = await importService.refreshDuplicateMatches(reviewAssets);

        if (!isMounted) {
          return;
        }

        setDuplicateMatches(matchesByAssetId);
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
  }, [importService, reviewAssets, setDuplicateMatches]);

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
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Add Capture</AppText>
            <AppText variant="title">Review</AppText>
          </View>
        </View>

        <View style={styles.summaryCard}>
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
            <View style={styles.warningCard}>
              <AppText variant="action">
                {duplicateAssetCount} selected item{duplicateAssetCount === 1 ? '' : 's'} may already exist in
                the Library
              </AppText>
              <AppText color={colors.textMuted}>
                Duplicate detection is warning-only. Keep everything or remove individual items from
                this batch.
              </AppText>
            </View>
          ) : null}
        </View>

        {saveMessage ? (
          <View style={styles.messageBanner}>
            <AppText color={colors.text} variant="caption">
              {saveMessage}
            </AppText>
          </View>
        ) : null}

        {saveError ? (
          <View style={styles.errorBanner}>
            <AppText color={colors.danger} variant="caption">
              {saveError}
            </AppText>
          </View>
        ) : null}

        <View style={styles.panel}>
          <AppText variant="eyebrow">Shared tags</AppText>
          <TextInput
            autoCapitalize="none"
            onChangeText={setSharedTagsInput}
            placeholder="study, receipts, shopping"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={sharedTagsInput}
          />
          <AppText color={colors.textMuted} variant="caption">
            Tags are normalized to lowercase canonical form. Emoji tags are supported.
          </AppText>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderCopy}>
              <AppText variant="eyebrow">Reminder to all</AppText>
              <AppText color={colors.textMuted} variant="caption">
                Optional. One date-and-time reminder can be applied to every selected Capture.
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setSharedReminder(sharedReminder ? null : { localDate: '', localTime: '' })
              }
              style={styles.secondaryButton}
            >
              <AppText variant="caption">{sharedReminder ? 'Clear' : 'Add reminder'}</AppText>
            </Pressable>
          </View>

          {sharedReminder ? (
            <View style={styles.reminderRow}>
              <TextInput
                keyboardType="numbers-and-punctuation"
                onChangeText={(value) =>
                  setSharedReminder({
                    ...sharedReminder,
                    localDate: value,
                  })
                }
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.reminderInput]}
                value={sharedReminder.localDate}
              />
              <TextInput
                keyboardType="numbers-and-punctuation"
                onChangeText={(value) =>
                  setSharedReminder({
                    ...sharedReminder,
                    localTime: value,
                  })
                }
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.reminderInput]}
                value={sharedReminder.localTime}
              />
            </View>
          ) : (
            <AppText color={colors.textMuted} variant="caption">
              Batch notes are intentionally not applied by default in MVP.
            </AppText>
          )}
        </View>

        {reviewAssets.length === 0 ? (
          <View style={styles.panel}>
            <AppText variant="title">No media selected</AppText>
            <AppText color={colors.textMuted}>
              Go back to the picker to choose screenshots before saving.
            </AppText>
          </View>
        ) : (
          <View style={styles.assetList}>
            {reviewAssets.map((asset) => (
              <View key={asset.assetId} style={styles.assetCard}>
                <Image source={{ uri: asset.previewUri }} style={styles.assetPreview} />
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
              </View>
            ))}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={reviewAssets.length === 0 || isSaving}
          onPress={() => void handleSave()}
          style={[styles.primaryButton, reviewAssets.length === 0 || isSaving ? styles.primaryButtonDisabled : null]}
        >
          <AppText style={styles.primaryButtonLabel} variant="action">
            {isSaving
              ? 'Saving...'
              : `Import ${reviewAssets.length} Capture${reviewAssets.length === 1 ? '' : 's'}`}
          </AppText>
        </Pressable>
      </ScrollView>
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
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
    aspectRatio: 1.4,
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
    borderRadius: 16,
    gap: 2,
    padding: spacing.sm,
  },
  errorBanner: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: 18,
    borderWidth: 1,
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
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageBanner: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
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
  reminderInput: {
    flex: 1,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  removeButton: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
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
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
});
