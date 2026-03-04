import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/primitives/AppText';
import { BackupService } from '@/modules/backup/backup.service';
import { SettingsService } from '@/modules/settings/settings.service';
import { colors, spacing } from '@/theme';

export function SettingsBackupScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const backupService = useMemo(() => new BackupService(), []);
  const settingsService = useMemo(() => new SettingsService(db), [db]);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportAt, setLastExportAt] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void settingsService.getNumberSetting('backup.lastExportAt').then((value) => {
        setLastExportAt(value);
      });
    }, [settingsService]),
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const result = await backupService.exportMetadataBackup();
      await settingsService.setSetting('backup.lastExportAt', result.exportedAt);
      await settingsService.setSetting('backup.lastExportPath', result.databasePath);
      setLastExportAt(result.exportedAt);
      setMessage('Metadata backup exported. Original screenshot files are not part of this export.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Backup export failed.');
    } finally {
      setIsExporting(false);
    }
  }, [backupService, settingsService]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="eyebrow">Settings</AppText>
            <AppText variant="title">Backup export</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText variant="action">Metadata-first export</AppText>
          <AppText color={colors.textMuted}>
            SnapBrain exports SQLite metadata only. Original screenshot image files are not included and are not restored automatically.
          </AppText>
          <AppText color={colors.textMuted} variant="caption">
            Last export: {lastExportAt ? formatTimestamp(lastExportAt) : 'Never'}
          </AppText>
        </View>

        <Pressable accessibilityRole="button" onPress={() => void handleExport()} style={styles.primaryButton}>
          <AppText color={colors.surface} variant="action">
            {isExporting ? 'Exporting...' : 'Export metadata backup'}
          </AppText>
        </Pressable>

        {message ? (
          <View style={styles.messageCard}>
            <AppText color={colors.textMuted} variant="caption">
              {message}
            </AppText>
          </View>
        ) : null}
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
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
  messageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.sm,
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
});
