import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { DateTimeFieldPicker } from '@/components/reminders/DateTimeFieldPicker';
import { AppText } from '@/components/primitives/AppText';
import { CAPTURE_NOTE_MAX_LENGTH } from '@/constants/limits';
import { routes } from '@/constants/routes';
import { CaptureService } from '@/modules/captures/capture.service';
import { GraveyardService } from '@/modules/graveyard/graveyard.service';
import { colors, spacing, typography } from '@/theme';

import {
  formatCaptureFileSize,
  getCapturePreviewHeight,
  getOpenOriginalDecision,
  splitTagDraft,
} from '../captureDetail.helpers';
import { CapturePreviewImage } from '../../library/components/CapturePreviewImage';
import { MetaBadge } from '../../library/components/MetaBadge';
import { TagPill } from '../../library/components/TagPill';

export function CaptureDetailScreen() {
  const { captureId } = useLocalSearchParams<{ captureId?: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const viewport = useWindowDimensions();
  const captureService = useMemo(() => new CaptureService(db), [db]);
  const graveyardService = useMemo(() => new GraveyardService(db), [db]);
  const [capture, setCapture] = useState<Awaited<ReturnType<CaptureService['getCaptureDetail']>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [reminderDateDraft, setReminderDateDraft] = useState('');
  const [reminderTimeDraft, setReminderTimeDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const syncDrafts = useCallback(
    (detail: Awaited<ReturnType<CaptureService['getCaptureDetail']>> | null) => {
      setNoteDraft(detail?.note ?? '');
      setReminderDateDraft(detail?.reminderLocalDate ?? '');
      setReminderTimeDraft(detail?.reminderLocalTime ?? '');
      setTagDraft(detail ? detail.tags.join(', ') : '');
    },
    [],
  );

  const loadCapture = useCallback(async (options?: { showLoadingState?: boolean }) => {
    if (!captureId) {
      setCapture(null);
      syncDrafts(null);
      setIsLoading(false);
      return;
    }

    if (options?.showLoadingState) {
      setIsLoading(true);
    }

    let nextCapture = await captureService.getCaptureDetail(captureId);

    if (nextCapture && !nextCapture.isMissing) {
      try {
        const verifyResult = await graveyardService.verifyCaptureById(nextCapture.id);

        if (verifyResult === 'missing') {
          nextCapture = await captureService.getCaptureDetail(captureId);
        }
      } catch {
        // Keep detail rendering even if missing-source verification cannot run.
      }
    }

    setCapture(nextCapture);
    syncDrafts(nextCapture);
    setIsLoading(false);
  }, [captureId, captureService, graveyardService, syncDrafts]);

  useEffect(() => {
    void loadCapture({ showLoadingState: true });
  }, [loadCapture]);

  useFocusEffect(
    useCallback(() => {
      if (!captureId) {
        return;
      }

      void captureService.recordCaptureViewed(captureId);
    }, [captureId, captureService]),
  );

  const handleDelete = useCallback(() => {
    if (!capture) {
      return;
    }

    Alert.alert(
      'Delete this Capture?',
      'This removes SnapBrain metadata only. The original screenshot stays in device storage.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            void (async () => {
              setPendingAction('delete');

              try {
                await captureService.deleteCaptureMetadata(capture.id);
                router.replace(routes.library);
              } catch (error) {
                Alert.alert(
                  'Capture not deleted',
                  error instanceof Error ? error.message : 'Unable to remove this Capture.',
                );
              } finally {
                setPendingAction(null);
              }
            })();
          },
        },
      ],
    );
  }, [capture, captureService, router]);

  const handleOpenOriginal = useCallback(async () => {
    if (!capture) {
      return;
    }

    const decision = getOpenOriginalDecision({
      isMissing: capture.isMissing,
      sourceUri: capture.sourceUri,
    });

    if (!decision.allowed) {
      Alert.alert(decision.title, decision.message);
      return;
    }

    try {
      await Linking.openURL(decision.sourceUri);
    } catch {
      try {
        if (capture.id) {
          await graveyardService.verifyCaptureById(capture.id);
          await loadCapture();
        }
      } catch {
        // Keep the user-visible failure handling below.
      }
      Alert.alert('Unable to open original', 'The device could not open this source reference.');
    }
  }, [capture, graveyardService, loadCapture]);

  const handleSaveNote = useCallback(async () => {
    if (!capture) {
      return;
    }

    setPendingAction('note');

    try {
      await captureService.updateNote(capture.id, noteDraft);
      await loadCapture();
    } catch (error) {
      Alert.alert('Note not saved', error instanceof Error ? error.message : 'Unable to update this note.');
    } finally {
      setPendingAction(null);
    }
  }, [capture, captureService, loadCapture, noteDraft]);

  const handleSaveTags = useCallback(async () => {
    if (!capture) {
      return;
    }

    setPendingAction('tags');

    try {
      await captureService.updateTags(capture.id, splitTagDraft(tagDraft));
      await loadCapture();
    } catch (error) {
      Alert.alert('Tags not saved', error instanceof Error ? error.message : 'Unable to update tags.');
    } finally {
      setPendingAction(null);
    }
  }, [capture, captureService, loadCapture, tagDraft]);

  const handleSaveReminder = useCallback(async () => {
    if (!capture) {
      return;
    }

    if (!reminderDateDraft.trim() || !reminderTimeDraft.trim()) {
      Alert.alert('Reminder incomplete', 'Enter both a local date and a local time.');
      return;
    }

    setPendingAction('reminder');

    try {
      const result = await captureService.updateReminder({
        captureId: capture.id,
        localDate: reminderDateDraft.trim(),
        localTime: reminderTimeDraft.trim(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      notifyIfSchedulingFailed(result);
      await loadCapture();
    } catch (error) {
      Alert.alert(
        'Reminder not saved',
        error instanceof Error ? error.message : 'Unable to update this reminder.',
      );
    } finally {
      setPendingAction(null);
    }
  }, [capture, captureService, loadCapture, reminderDateDraft, reminderTimeDraft]);

  const handleClearReminder = useCallback(async () => {
    if (!capture) {
      return;
    }

    setPendingAction('reminder-clear');

    try {
      await captureService.clearReminder(capture.id);
      await loadCapture();
    } catch (error) {
      Alert.alert(
        'Reminder not cleared',
        error instanceof Error ? error.message : 'Unable to remove this reminder.',
      );
    } finally {
      setPendingAction(null);
    }
  }, [capture, captureService, loadCapture]);

  const handleMarkReminderDone = useCallback(async () => {
    if (!capture?.reminderDueAt) {
      return;
    }

    setPendingAction('reminder-done');

    try {
      await captureService.markReminderDone(capture.id);
      await loadCapture();
    } catch (error) {
      Alert.alert(
        'Reminder not marked done',
        error instanceof Error ? error.message : 'Unable to mark this reminder as done.',
      );
    } finally {
      setPendingAction(null);
    }
  }, [capture, captureService, loadCapture]);

  const handleSnoozeOneHour = useCallback(async () => {
    if (!capture?.reminderDueAt) {
      return;
    }

    setPendingAction('reminder-snooze-hour');

    try {
      const result = await captureService.snoozeReminderByOneHour(capture.id);
      notifyIfSchedulingFailed(result);
      await loadCapture();
    } catch (error) {
      Alert.alert(
        'Reminder not snoozed',
        error instanceof Error ? error.message : 'Unable to snooze this reminder.',
      );
    } finally {
      setPendingAction(null);
    }
  }, [capture, captureService, loadCapture]);

  const handleSnoozeTomorrow = useCallback(async () => {
    if (!capture?.reminderDueAt) {
      return;
    }

    setPendingAction('reminder-snooze-tomorrow');

    try {
      const result = await captureService.snoozeReminderToTomorrow(capture.id);
      notifyIfSchedulingFailed(result);
      await loadCapture();
    } catch (error) {
      Alert.alert(
        'Reminder not snoozed',
        error instanceof Error ? error.message : 'Unable to snooze this reminder to tomorrow.',
      );
    } finally {
      setPendingAction(null);
    }
  }, [capture, captureService, loadCapture]);

  const toggleEditing = useCallback(() => {
    setIsEditing((current) => {
      const next = !current;

      if (!next) {
        syncDrafts(capture);
      }

      return next;
    });
  }, [capture, syncDrafts]);

  const previewHeight = useMemo(
    () =>
      getCapturePreviewHeight({
        previewWidth: Math.max(240, viewport.width - spacing.lg * 2),
        sourceHeight: capture?.height ?? null,
        sourceWidth: capture?.width ?? null,
        viewportHeight: viewport.height,
      }),
    [capture?.height, capture?.width, viewport.height, viewport.width],
  );

  const showLoadingState = isLoading && !capture;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Capture</AppText>
            <AppText variant="title">Detail</AppText>
          </View>
        </View>

        {showLoadingState ? (
          <View style={styles.placeholderCard}>
            <AppText color={colors.textMuted}>Loading Capture metadata...</AppText>
          </View>
        ) : capture ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(routes.capturePreview(capture.id))}
              style={[styles.previewCard, { height: previewHeight }]}
            >
              <CapturePreviewImage
                fit="contain"
                isMissing={capture.isMissing}
                mediaAssetId={capture.mediaAssetId}
                sourceScheme={capture.sourceScheme}
                sourceUri={capture.sourceUri}
              />
              <View style={styles.previewOverlay}>
                <AppText style={styles.previewAction} variant="action">
                  Open Fullscreen Preview
                </AppText>
              </View>
            </Pressable>

            <View style={styles.badgeRow}>
              {capture.isMissing ? <MetaBadge label="Graveyard" tone="danger" /> : null}
              {capture.reminderDueAt ? <MetaBadge label="Reminder" tone="accent" /> : null}
            </View>

            {capture.isMissing ? (
              <View style={styles.graveyardBanner}>
                <AppText variant="action">Original file unavailable</AppText>
                <AppText color={colors.textMuted}>
                  This Capture is in Graveyard state. Relink a new original to restore previews and open-original behavior.
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  disabled={pendingAction !== null}
                  onPress={() => router.push(routes.relinkCapture(capture.id))}
                  style={styles.secondaryButton}
                >
                  <AppText variant="action">Relink original</AppText>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.quickActionsRow}>
              <QuickActionButton
                disabled={capture.isMissing}
                iconName="open-outline"
                label="Open original"
                onPress={() => void handleOpenOriginal()}
              />
              <QuickActionButton
                iconName="expand-outline"
                label="Fullscreen"
                onPress={() => router.push(routes.capturePreview(capture.id))}
              />
              <QuickActionButton
                iconName={isEditing ? 'checkmark-circle-outline' : 'create-outline'}
                label={isEditing ? 'Done editing' : 'Edit'}
                onPress={toggleEditing}
              />
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Tags</AppText>
              <View style={styles.tagsRow}>
                {capture.tags.length > 0 ? (
                  capture.tags.map((tag) => <TagPill key={tag} label={tag} />)
                ) : (
                  <AppText color={colors.textMuted}>No tags yet.</AppText>
                )}
              </View>

              {isEditing ? (
                <View style={styles.editorCard}>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setTagDraft}
                    placeholder="comma-separated tags"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                    value={tagDraft}
                  />
                  <SectionButton
                    busy={pendingAction === 'tags'}
                    disabled={pendingAction !== null && pendingAction !== 'tags'}
                    label="Save tags"
                    onPress={() => void handleSaveTags()}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Note</AppText>
              <View style={styles.infoCard}>
                {isEditing ? (
                  <View style={styles.editorCard}>
                    <TextInput
                      maxLength={CAPTURE_NOTE_MAX_LENGTH}
                      multiline
                      onChangeText={setNoteDraft}
                      placeholder="Add a note for this Capture"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.textInput, styles.noteInput]}
                      textAlignVertical="top"
                      value={noteDraft}
                    />
                    <View style={styles.noteFooter}>
                      <AppText color={colors.textMuted} variant="caption">
                        {noteDraft.trim().length}/{CAPTURE_NOTE_MAX_LENGTH}
                      </AppText>
                      <SectionButton
                        busy={pendingAction === 'note'}
                        disabled={pendingAction !== null && pendingAction !== 'note'}
                        label="Save note"
                        onPress={() => void handleSaveNote()}
                      />
                    </View>
                  </View>
                ) : (
                  <AppText color={capture.note ? colors.text : colors.textMuted}>
                    {capture.note ?? 'No note for this Capture yet.'}
                  </AppText>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Reminder</AppText>
              <View style={styles.infoCard}>
                <AppText color={capture.reminderDueAt ? colors.text : colors.textMuted}>
                  {capture.reminderDueAt
                    ? `${formatTimestamp(capture.reminderDueAt)} (${capture.reminderTimezone ?? 'local time'})`
                    : 'No reminder set.'}
                </AppText>
                {isEditing ? (
                  <View style={styles.editorCard}>
                    <View style={styles.reminderInputsRow}>
                      <View style={styles.reminderInput}>
                        <DateTimeFieldPicker
                          accessibilityLabel="Choose reminder date"
                          label="Date"
                          mode="date"
                          onChangeValue={setReminderDateDraft}
                          placeholder="YYYY-MM-DD"
                          value={reminderDateDraft}
                        />
                      </View>
                      <View style={styles.reminderInput}>
                        <DateTimeFieldPicker
                          accessibilityLabel="Choose reminder time"
                          label="Time"
                          mode="time"
                          onChangeValue={setReminderTimeDraft}
                          placeholder="HH:MM"
                          value={reminderTimeDraft}
                        />
                      </View>
                    </View>
                    <View style={styles.inlineButtonRow}>
                      <SectionButton
                        busy={pendingAction === 'reminder'}
                        disabled={pendingAction !== null && pendingAction !== 'reminder'}
                        label="Save reminder"
                        onPress={() => void handleSaveReminder()}
                      />
                      {capture.reminderDueAt ? (
                        <>
                          <Pressable
                            accessibilityRole="button"
                            disabled={pendingAction !== null}
                            onPress={() => void handleMarkReminderDone()}
                            style={styles.secondaryButton}
                          >
                            <AppText variant="action">
                              {pendingAction === 'reminder-done' ? 'Saving...' : 'Done'}
                            </AppText>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            disabled={pendingAction !== null}
                            onPress={() => void handleSnoozeOneHour()}
                            style={styles.secondaryButton}
                          >
                            <AppText variant="action">
                              {pendingAction === 'reminder-snooze-hour' ? 'Saving...' : 'Snooze +1h'}
                            </AppText>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            disabled={pendingAction !== null}
                            onPress={() => void handleSnoozeTomorrow()}
                            style={styles.secondaryButton}
                          >
                            <AppText variant="action">
                              {pendingAction === 'reminder-snooze-tomorrow' ? 'Saving...' : 'Snooze tomorrow'}
                            </AppText>
                          </Pressable>
                        </>
                      ) : null}
                      {capture.reminderDueAt ? (
                        <Pressable
                          accessibilityRole="button"
                          disabled={pendingAction !== null}
                          onPress={() => void handleClearReminder()}
                          style={styles.secondaryButton}
                        >
                          <AppText variant="action">
                            {pendingAction === 'reminder-clear' ? 'Clearing...' : 'Clear'}
                          </AppText>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Metadata</AppText>
              <View style={styles.infoCard}>
                <MetadataRow label="Created" value={capture.capturedAt ? formatTimestamp(capture.capturedAt) : 'Unknown'} />
                <MetadataRow label="Imported" value={formatTimestamp(capture.importedAt)} />
                <MetadataRow label="File size" value={formatCaptureFileSize(capture.fileSize)} />
                <MetadataRow label="Dimensions" value={formatDimensions(capture.width, capture.height)} />
                <MetadataRow label="Source" value={capture.sourceFilename ?? capture.sourceUri} />
              </View>
            </View>

            <View style={styles.section}>
              <AppText color={colors.danger} variant="eyebrow">
                Danger zone
              </AppText>
              <View style={styles.dangerCard}>
                <AppText color={colors.textMuted}>
                  Delete removes SnapBrain metadata only. The original screenshot is not deleted from device storage.
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  disabled={pendingAction === 'delete'}
                  onPress={handleDelete}
                  style={styles.dangerButton}
                >
                  <AppText color={colors.surface} variant="action">
                    {pendingAction === 'delete'
                      ? 'Deleting...'
                      : capture.isMissing
                        ? 'Delete metadata permanently'
                        : 'Delete Capture'}
                  </AppText>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.placeholderCard}>
            <AppText variant="title">Capture not found</AppText>
            <AppText color={colors.textMuted}>
              This route is wired for the upcoming detail flow, but no matching Capture exists.
            </AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function notifyIfSchedulingFailed(result: unknown) {
  if (!result || typeof result !== 'object') {
    return;
  }

  const scheduling = result as { reason?: string; scheduled?: boolean };

  if (scheduling.scheduled) {
    return;
  }

  if (scheduling.reason === 'permission-denied') {
    Alert.alert(
      'Notifications disabled',
      'Reminder data was saved, but system notifications are currently disabled for SnapBrain.',
    );
  }
}

function formatDimensions(width: number | null, height: number | null) {
  if (!width || !height) {
    return 'Unknown';
  }

  return `${width} × ${height}px`;
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metadataRow}>
      <AppText color={colors.textMuted} style={styles.metadataLabel}>
        {label}
      </AppText>
      <AppText style={styles.metadataValue}>{value}</AppText>
    </View>
  );
}

function QuickActionButton({
  disabled,
  iconName,
  label,
  onPress,
}: {
  disabled?: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.quickActionButton, disabled && styles.actionDisabled]}
    >
      <Ionicons color={colors.text} name={iconName} size={18} />
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}

function SectionButton({
  busy,
  disabled,
  label,
  onPress,
}: {
  busy: boolean;
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.actionDisabled]}
    >
      <AppText color={colors.surface} variant="action">
        {busy ? 'Saving...' : label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionDisabled: {
    opacity: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 999,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dangerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  editorCard: {
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
  graveyardBanner: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
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
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  inlineButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaLine: {
    color: colors.textMuted,
  },
  metadataLabel: {
    flex: 0.8,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metadataValue: {
    flex: 1.2,
  },
  noteFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  noteInput: {
    minHeight: 120,
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 240,
    padding: spacing.lg,
  },
  previewAction: {
    color: colors.surface,
  },
  previewCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(32, 26, 22, 0.72)',
    bottom: 0,
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 72,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reminderInput: {
    flex: 1,
  },
  reminderInputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
});
