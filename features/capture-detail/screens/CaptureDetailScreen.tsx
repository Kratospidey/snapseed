import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { routes } from '@/constants/routes';
import { CaptureService } from '@/modules/captures/capture.service';
import { colors, spacing, typography } from '@/theme';

import { CapturePreviewImage } from '../../library/components/CapturePreviewImage';
import { MetaBadge } from '../../library/components/MetaBadge';
import { TagPill } from '../../library/components/TagPill';

export function CaptureDetailScreen() {
  const { captureId } = useLocalSearchParams<{ captureId?: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const captureService = useMemo(() => new CaptureService(db), [db]);
  const [capture, setCapture] = useState<Awaited<ReturnType<CaptureService['getCaptureDetail']>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!captureId) {
        if (isMounted) {
          setCapture(null);
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);

      const nextCapture = await captureService.getCaptureDetail(captureId);

      if (!isMounted) {
        return;
      }

      setCapture(nextCapture);
      setIsLoading(false);
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [captureId, captureService]);

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

        {isLoading ? (
          <View style={styles.placeholderCard}>
            <AppText color={colors.textMuted}>Loading Capture metadata...</AppText>
          </View>
        ) : capture ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(routes.capturePreview(capture.id))}
              style={styles.previewCard}
            >
              <CapturePreviewImage isMissing={capture.isMissing} sourceUri={capture.sourceUri} />
              <View style={styles.previewOverlay}>
                <AppText style={styles.previewAction} variant="action">
                  Open Fullscreen Preview
                </AppText>
              </View>
            </Pressable>

            <View style={styles.badgeRow}>
              {capture.isMissing ? <MetaBadge label="Graveyard" tone="danger" /> : null}
              {capture.reminderDueAt ? <MetaBadge label="Reminder" tone="accent" /> : null}
              {capture.duplicateGroupHint ? <MetaBadge label="Duplicate hint" tone="neutral" /> : null}
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
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Note</AppText>
              <View style={styles.infoCard}>
                <AppText color={capture.note ? colors.text : colors.textMuted}>
                  {capture.note ?? 'No note for this Capture yet.'}
                </AppText>
              </View>
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Metadata</AppText>
              <View style={styles.infoCard}>
                <AppText style={styles.metaLine}>Imported at: {formatTimestamp(capture.importedAt)}</AppText>
                <AppText style={styles.metaLine}>
                  Captured at: {capture.capturedAt ? formatTimestamp(capture.capturedAt) : 'Unknown'}
                </AppText>
                <AppText style={styles.metaLine}>
                  Reminder: {capture.reminderDueAt ? formatTimestamp(capture.reminderDueAt) : 'None'}
                </AppText>
                <AppText style={styles.metaLine}>Source: {capture.sourceFilename ?? capture.sourceUri}</AppText>
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

const styles = StyleSheet.create({
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
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  metaLine: {
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 320,
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
